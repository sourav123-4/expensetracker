import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { symbolFor } from '../constants/currencies';
import { StorageKeys, storage } from '../storage/mmkv';

/** Symbol for the user's chosen currency (MMKV-backed, set on login/settings change). */
function currentSymbol(): string {
  return symbolFor(storage.getString(StorageKeys.currency));
}

/** ₹1,23,456.50 — Indian digit grouping to match the default currency. */
export function formatCurrency(amount: number, symbol: string = currentSymbol()): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function formatDate(iso: string): string {
  const date = parseISO(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMM yyyy');
}

export function formatMonthLabel(month: string): string {
  // "2026-07" → "Jul"
  return format(parseISO(`${month}-01`), 'MMM');
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}
