import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { OnboardingScreen } from '../features/auth/screens/OnboardingScreen';
import { PhoneLoginScreen } from '../features/auth/screens/PhoneLoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';
import { VerifyOtpScreen } from '../features/auth/screens/VerifyOtpScreen';
import { StorageKeys, storage } from '../storage/mmkv';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  const onboardingDone = storage.getBoolean(StorageKeys.onboardingDone);

  return (
    <Stack.Navigator
      initialRouteName={onboardingDone ? 'Login' : 'Onboarding'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
    </Stack.Navigator>
  );
}
