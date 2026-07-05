export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email: string };
  ResetPassword: { email: string; resetToken: string };
};

export type ExpensesStackParamList = {
  ExpenseList: { category?: string } | undefined;
  ExpenseDetail: { id: string };
};

export type IncomeStackParamList = {
  IncomeList: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  ExpensesTab: undefined;
  IncomeTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  // Global "compose" modals — reachable from any tab, always return to
  // wherever the user was (not tied to the Expenses/Income tab's own stack).
  ExpenseForm: { id?: string } | undefined;
  IncomeForm: { id?: string } | undefined;
};
