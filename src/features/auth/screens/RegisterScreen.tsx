import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BrandMark } from '../../../components/BrandMark';
import { Button } from '../../../components/Button';
import { EyeIcon, EyeOffIcon } from '../../../components/icons';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';
import { APP_NAME } from '../../../constants/config';
import { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { useRegisterMutation } from '../authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [register, { isLoading }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { name: '', email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      }).unwrap();
      showToast(`Welcome, ${values.name.trim().split(' ')[0]}!`);
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
        <View style={{ gap: theme.space.m }}>
          <BrandMark />
          <View style={{ gap: theme.space.xs }}>
            <AppText variant="display">{APP_NAME}</AppText>
            <AppText tone="secondary">Create your account — takes less than a minute.</AppText>
          </View>
        </View>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Full name"
              placeholder="e.g. Sourav Mahanty"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              autoComplete="name"
              textContentType="name"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Password"
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              textContentType="newPassword"
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

        <Button title="Create account" onPress={handleSubmit(onSubmit)} loading={isLoading} />

        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          style={({ pressed }) => [styles.loginLink, pressed && styles.pressed]}
        >
          <AppText tone="secondary">
            Already have an account? <AppText tone="brand">Log in</AppText>
          </AppText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  loginLink: { alignSelf: 'center', marginTop: 8 },
  pressed: { opacity: 0.5 },
});
