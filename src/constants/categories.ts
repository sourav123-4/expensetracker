import { EXPENSE_CATEGORIES, ExpenseCategory, INCOME_SOURCES, PAYMENT_METHODS } from '../types/api';
import { Theme } from '../theme/tokens';

/** Fixed slot index per category — keeps a category's chart color stable
 * across screens/filters instead of being reassigned when the visible set changes. */
const CATEGORY_SLOT: Record<ExpenseCategory, number> = {
  Food: 0,
  Shopping: 1,
  Fuel: 2,
  Travel: 3,
  Health: 4,
  Medicine: 4,
  Investment: 5,
  Entertainment: 6,
  Bills: 7,
  Others: 7,
};

export function categoryColor(theme: Theme, category: ExpenseCategory): string {
  const palette = theme.colors.chartCategorical;
  return palette[CATEGORY_SLOT[category] % palette.length];
}

export { EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS };
