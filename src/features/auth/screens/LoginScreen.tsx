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
import { useLoginMutation } from '../authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface FormValues {
  email: string;
  password: string;
}

export function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await login({ email: values.email.trim(), password: values.password }).unwrap();
      // RootNavigator swaps to MainTabs automatically on isAuthenticated
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
        contentContainerStyle={[
          styles.content,
          { paddingTop: useSafeAreaInsets().top + 40, gap: theme.space.l },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: theme.space.m }}>
          <BrandMark />
          <View style={{ gap: theme.space.xs }}>
            <AppText variant="display">{APP_NAME}</AppText>
            <AppText tone="secondary">Welcome back — let's see where you stand.</AppText>
          </View>
        </View>

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
          rules={{ required: 'Password is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Password"
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
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

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.forgotLink, pressed && styles.pressed]}
        >
          <AppText variant="caption" tone="brand">
            Forgot password?
          </AppText>
        </Pressable>

        <Button title="Log in" onPress={handleSubmit(onSubmit)} loading={isLoading} />

        <Pressable
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.registerLink, pressed && styles.pressed]}
        >
          <AppText tone="secondary">
            Don't have an account? <AppText tone="brand">Sign up</AppText>
          </AppText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  forgotLink: { alignSelf: 'flex-end' },
  registerLink: { alignSelf: 'center', marginTop: 8 },
  pressed: { opacity: 0.5 },
});
