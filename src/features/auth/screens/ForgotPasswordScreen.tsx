import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BackButton } from '../../../components/BackButton';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';
import { AuthStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { useForgotPasswordMutation } from '../authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      showToast('Code sent — check your email');
      navigation.navigate('VerifyOtp', { email: email.trim() });
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
          <AppText variant="h1">Forgot password?</AppText>
          <AppText tone="secondary">
            Enter your email and we'll send a 6-digit code to reset it.
          </AppText>
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
            />
          )}
        />

        <Button title="Send code" onPress={handleSubmit(onSubmit)} loading={isLoading} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
});
