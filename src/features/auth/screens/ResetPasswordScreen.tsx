import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { EyeIcon, EyeOffIcon } from '../../../components/icons';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';
import { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { useResetPasswordMutation } from '../authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { email, resetToken } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ newPassword: string; confirmPassword: string }>({
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: { newPassword: string }) => {
    try {
      await resetPassword({ email, resetToken, newPassword: values.newPassword }).unwrap();
      showToast('Password reset — please log in');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong';
      showToast(message, 'error');
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
        <View style={{ gap: theme.space.xs }}>
          <AppText variant="h1">Set a new password</AppText>
          <AppText tone="secondary">Make it at least 8 characters.</AppText>
        </View>

        <Controller
          control={control}
          name="newPassword"
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="New password"
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.newPassword?.message}
              secureTextEntry={!showPassword}
              trailing={
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon size={20} color={theme.colors.textMuted} />
                  ) : (
                    <EyeIcon size={20} color={theme.colors.textMuted} />
                  )}
                </Pressable>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (value) => value === watch('newPassword') || 'Passwords do not match',
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Confirm password"
              placeholder="Re-enter the password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              secureTextEntry={!showPassword}
            />
          )}
        />

        <Button title="Reset password" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
});
