import { currentMonth, formatCurrency, formatMonthLabel } from './format';

describe('formatCurrency', () => {
  it('formats whole rupee amounts without decimals', () => {
    expect(formatCurrency(1234)).toBe('₹1,234');
  });

  it('formats fractional amounts with two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('₹1,234.50');
  });

  it('uses Indian digit grouping for large amounts', () => {
    expect(formatCurrency(1234567)).toBe('₹12,34,567');
  });

  it('prefixes negative amounts with a minus sign', () => {
    expect(formatCurrency(-500)).toBe('-₹500');
  });

  it('accepts a custom currency symbol', () => {
    expect(formatCurrency(100, '$')).toBe('$100');
  });
});

describe('formatMonthLabel', () => {
  it('renders a short month name from YYYY-MM', () => {
    expect(formatMonthLabel('2026-07')).toBe('Jul');
    expect(formatMonthLabel('2026-01')).toBe('Jan');
  });
});

describe('currentMonth', () => {
  it('matches the YYYY-MM shape', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
