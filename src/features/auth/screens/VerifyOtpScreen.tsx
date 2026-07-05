import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BackButton } from '../../../components/BackButton';
import { Button } from '../../../components/Button';
import { OtpInput, OtpInputHandle } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast';
import { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { useForgotPasswordMutation, useVerifyOtpMutation } from '../authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

const OTP_LENGTH = 6;

export function VerifyOtpScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useForgotPasswordMutation();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const otpRef = useRef<OtpInputHandle>(null);

  const onSubmit = async () => {
    if (code.length !== OTP_LENGTH) return;
    try {
      const { resetToken } = await verifyOtp({ email, otp: code }).unwrap();
      navigation.navigate('ResetPassword', { email, resetToken });
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Invalid code';
      showToast(message, 'error');
      otpRef.current?.reset();
    }
  };

  const onResend = async () => {
    try {
      await resendOtp({ email }).unwrap();
      showToast(`New code sent to ${email}`);
    } catch {
      showToast('Something went wrong — please try again', 'error');
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
        <BackButton onPress={() => navigation.goBack()} />

        <View style={{ gap: theme.space.xs }}>
          <AppText variant="h1">Enter the code</AppText>
          <AppText tone="secondary">We sent a 6-digit code to {email}</AppText>
        </View>

        <OtpInput ref={otpRef} length={OTP_LENGTH} onCodeChange={setCode} />

        <Button
          title="Verify"
          onPress={onSubmit}
          loading={isLoading}
          disabled={code.length !== OTP_LENGTH}
        />

        <Pressable
          onPress={onResend}
          disabled={isResending}
          style={({ pressed }) => [styles.resend, pressed && styles.pressed]}
        >
          <AppText variant="caption" tone="brand">
            {isResending ? 'Resending…' : "Didn't get a code? Resend"}
          </AppText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
  resend: { alignSelf: 'center' },
  pressed: { opacity: 0.5 },
});
