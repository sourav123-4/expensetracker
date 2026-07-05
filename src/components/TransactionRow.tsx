import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Theme } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { formatCurrency, formatDate } from '../utils/format';
import { AppText } from './AppText';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from './icons';

interface TransactionRowProps {
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  onPress?: () => void;
  categoryColor?: string;
  /** Adds inner horizontal padding — for use inside card-style rows. */
  inset?: boolean;
}

function iconBg(theme: Theme, type: 'expense' | 'income') {
  return type === 'income'
    ? (theme.dark ? 'rgba(12,163,12,0.18)' : 'rgba(12,163,12,0.12)')
    : theme.colors.brandSubtle;
}

/** Shared row: dashboard recent list + expense/income lists. */
export function TransactionRow({
  title,
  category,
  amount,
  date,
  type,
  onPress,
  categoryColor,
  inset = false,
}: TransactionRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, ${category}, ${formatCurrency(amount)}, ${formatDate(date)}`}
      style={({ pressed }) => [
        styles.row,
        inset && styles.inset,
        { opacity: pressed && onPress ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg(theme, type) }]}>
        {type === 'income' ? (
          <ArrowDownLeftIcon size={20} color={theme.colors.statusGood} />
        ) : (
          <ArrowUpRightIcon size={20} color={categoryColor ?? theme.colors.brandPrimary} />
        )}
      </View>
      <View style={styles.middle}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted">
          {category} · {formatDate(date)}
        </AppText>
      </View>
      <AppText variant="bodyStrong" tone={type === 'income' ? 'good' : 'critical'} tabular>
        {type === 'income' ? '+' : '-'}
        {formatCurrency(amount)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  inset: { paddingHorizontal: 14, paddingVertical: 13 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 2 },
});
