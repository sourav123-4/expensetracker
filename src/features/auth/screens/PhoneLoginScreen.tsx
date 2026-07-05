import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BackButton } from '../../../components/BackButton';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { OtpInput, OtpInputHandle } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast';
import { AuthStackParamList } from '../../../navigation/types';
import { confirmPhoneOtp, PhoneConfirmation, sendPhoneOtp } from '../../../services/phoneAuth';
import { useTheme } from '../../../theme/ThemeProvider';
import { useLoginWithPhoneMutation } from '../authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

const OTP_LENGTH = 6;

/** Phone sign-in: enter a number, confirm the SMS code — two steps, one screen. */
export function PhoneLoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [loginWithPhone, { isLoading: isLoggingIn }] = useLoginWithPhoneMutation();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const confirmationRef = useRef<PhoneConfirmation | null>(null);
  const otpRef = useRef<OtpInputHandle>(null);

  const handleSendCode = async () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed.startsWith('+')) {
      showToast('Include your country code, e.g. +1 555 123 4567', 'error');
      return;
    }
    setIsSending(true);
    try {
      const result = await sendPhoneOtp(trimmed);
      if (!result.ok || !result.confirmation) {
        showToast(result.reason ?? 'Could not send code', 'error');
        return;
      }
      confirmationRef.current = result.confirmation;
      setStep('otp');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH || !confirmationRef.current) return;
    setIsVerifying(true);
    try {
      const result = await confirmPhoneOtp(confirmationRef.current, code);
      if (!result.ok || !result.idToken) {
        showToast(result.reason ?? 'Invalid code', 'error');
        otpRef.current?.reset();
        return;
      }
      await loginWithPhone({ idToken: result.idToken }).unwrap();
      // RootNavigator swaps to MainTabs automatically on isAuthenticated
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong';
      showToast(message, 'error');
      otpRef.current?.reset();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgPage }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, gap: theme.space.l }]}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton
          onPress={() => (step === 'otp' ? setStep('phone') : navigation.goBack())}
        />

        {step === 'phone' ? (
          <>
            <View style={{ gap: theme.space.xs }}>
              <AppText variant="h1">Sign in with phone</AppText>
              <AppText tone="secondary">We'll text you a 6-digit code.</AppText>
            </View>

            <Input
              label="Phone number"
              placeholder="+1 555 123 4567"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoFocus
            />

            <Button title="Send code" onPress={handleSendCode} loading={isSending} />
          </>
        ) : (
          <>
            <View style={{ gap: theme.space.xs }}>
              <AppText variant="h1">Enter the code</AppText>
              <AppText tone="secondary">We sent a 6-digit code to {phoneNumber.trim()}</AppText>
            </View>

            <OtpInput ref={otpRef} length={OTP_LENGTH} onCodeChange={setCode} />

            <Button
              title="Verify"
              onPress={handleVerify}
              loading={isVerifying || isLoggingIn}
              disabled={code.length !== OTP_LENGTH}
            />

            <Pressable
              onPress={handleSendCode}
              disabled={isSending}
              style={({ pressed }) => [styles.resend, pressed && styles.pressed]}
            >
              <AppText variant="caption" tone="brand">
                {isSending ? 'Resending…' : "Didn't get a code? Resend"}
              </AppText>
            </Pressable>
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
  resend: { alignSelf: 'center' },
  pressed: { opacity: 0.5 },
});
