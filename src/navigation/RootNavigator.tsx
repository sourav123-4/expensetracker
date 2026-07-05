import { DarkTheme, DefaultTheme, LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ExpenseFormScreen } from '../features/expenses/screens/ExpenseFormScreen';
import { IncomeFormScreen } from '../features/income/screens/IncomeFormScreen';
import { useAppSelector } from '../hooks/redux';
import { useTheme } from '../theme/ThemeProvider';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Deep-link map. ExpenseForm/IncomeForm are root-level modals (reachable from
 * any tab via React Navigation's automatic action bubbling — see
 * ExpensesStack.tsx / IncomeStack.tsx), so their paths sit at the top level
 * alongside the nested tab screens.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: LinkingOptions<any> = {
  prefixes: ['expenseflow://'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      VerifyOtp: 'verify-otp',
      ResetPassword: 'reset-password',
      ExpenseForm: 'expenses/form',
      IncomeForm: 'income/form',
      Main: {
        screens: {
          DashboardTab: 'dashboard',
          ExpensesTab: {
            screens: {
              ExpenseList: 'expenses',
              ExpenseDetail: 'expenses/:id',
            },
          },
          IncomeTab: {
            screens: {
              IncomeList: 'income',
            },
          },
          SettingsTab: 'settings',
        },
      },
    },
  },
};

/** Swaps between AuthStack and MainTabs purely off auth state — no explicit navigate() needed on login/logout. */
export function RootNavigator() {
  const { theme } = useTheme();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.bgPage,
      card: theme.colors.bgSurface,
      text: theme.colors.textPrimary,
      border: theme.colors.borderHairline,
      primary: theme.colors.brandPrimary,
    },
  };

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
              <Stack.Screen name="IncomeForm" component={IncomeFormScreen} />
            </Stack.Group>
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
