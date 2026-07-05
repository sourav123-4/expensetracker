export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email: string };
  ResetPassword: { email: string; resetToken: string };
  PhoneLogin: undefined;
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

/**
 * Fields a detected bank SMS, or an AI-parsed quick-add sentence, can pre-fill
 * on the Add form — the user still confirms (and can change) everything.
 */
export interface TransactionPrefill {
  title?: string;
  amount?: number;
  paymentMethod?: string;
  date?: string;
  /** Only set by the AI quick-add flow (bank SMS carries no category/source signal). */
  category?: string;
  source?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  // Global "compose" modals — reachable from any tab, always return to
  // wherever the user was (not tied to the Expenses/Income tab's own stack).
  ExpenseForm: { id?: string; prefill?: TransactionPrefill } | undefined;
  IncomeForm: { id?: string; prefill?: TransactionPrefill } | undefined;
};
