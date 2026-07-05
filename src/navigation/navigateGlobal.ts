import type { NavigationProp, ParamListBase } from '@react-navigation/native';

/**
 * Opens a root-level modal (ExpenseForm/IncomeForm) from anywhere in the
 * nested tab/stack tree. React Navigation's `navigate` action bubbles up
 * automatically to find the screen in an ancestor navigator, so this only
 * smooths over static typing across independently-typed nested param lists —
 * it doesn't change runtime behavior. Closing the modal (`goBack`) always
 * returns to whichever screen opened it, regardless of which tab that was.
 */
type GlobalNavigate = (screen: 'ExpenseForm' | 'IncomeForm', params?: { id?: string }) => void;

export function openExpenseForm(navigation: NavigationProp<ParamListBase>, params?: { id?: string }): void {
  (navigation.navigate as unknown as GlobalNavigate)('ExpenseForm', params);
}

export function openIncomeForm(navigation: NavigationProp<ParamListBase>, params?: { id?: string }): void {
  (navigation.navigate as unknown as GlobalNavigate)('IncomeForm', params);
}
