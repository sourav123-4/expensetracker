import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BackButton } from '../../../components/BackButton';
import { Button } from '../../../components/Button';
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
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputs = useRef<Array<TextInput | null>>([]);

  const code = digits.join('');

  const handleChange = (text: string, index: number) => {
    // Support pasting the full code into one box
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      setDigits((prev) => {
        const next = [...prev];
        pasted.forEach((d, i) => (next[i] = d));
        return next;
      });
      inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      next[index] = text.replace(/\D/g, '');
      return next;
    });
    if (text && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async () => {
    if (code.length !== OTP_LENGTH) return;
    try {
      const { resetToken } = await verifyOtp({ email, otp: code }).unwrap();
      navigation.navigate('ResetPassword', { email, resetToken });
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Invalid code';
      showToast(message, 'error');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
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

        <View style={styles.otpRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
              style={[
                styles.otpBox,
                {
                  borderColor: digit ? theme.colors.brandPrimary : theme.colors.borderHairline,
                  borderWidth: digit || theme.dark ? 1.5 : 0,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.bgSurface,
                  borderRadius: theme.radius.m,
                },
                // Boxes lift off the page with a soft shadow, matching the
                // app's card language; border color/width communicates the
                // filled state on top. The shadow must stay on regardless of
                // content — toggling Android's `elevation` on the exact
                // frame a digit is typed promotes/demotes the EditText to
                // its own hardware layer, which can silently drop keyboard
                // focus (the box looks fine but stops accepting input).
                !theme.dark &&
                  Platform.select({
                    ios: {
                      shadowColor: '#3730A3',
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                    },
                    android: { elevation: 2 },
                  }),
              ]}
            />
          ))}
        </View>

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
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  resend: { alignSelf: 'center' },
  pressed: { opacity: 0.5 },
});
