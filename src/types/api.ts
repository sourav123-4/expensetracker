/** Mirrors the backend response envelope and domain models. */

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Shopping',
  'Fuel',
  'Travel',
  'Health',
  'Medicine',
  'Investment',
  'Entertainment',
  'Bills',
  'Others',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'NetBanking', 'Wallet', 'Other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const INCOME_SOURCES = [
  'Salary',
  'Business',
  'Freelancing',
  'Bonus',
  'Cashback',
  'Investment',
  'Interest',
  'Gift',
  'Other',
] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  paymentMethod: PaymentMethod;
  date: string;
  tags: string[];
  isRecurring: boolean;
  receiptUrl: string | null;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  title: string;
  amount: number;
  source: IncomeSource;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySlice {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface MonthPoint {
  month: string;
  income: number;
  expense: number;
}

export interface RecentTransaction {
  id: string;
  type: 'expense' | 'income';
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface DashboardSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategorySlice[];
  trend: MonthPoint[];
  recentTransactions: RecentTransaction[];
  upcomingEmi: null;
  creditCardDue: null;
  loanOutstanding: null;
  savingsProgress: null;
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  category?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  q?: string;
  sortBy?: 'date' | 'amount' | 'category' | 'createdAt';
  order?: 'asc' | 'desc';
}
