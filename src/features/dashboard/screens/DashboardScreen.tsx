import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useParseTransactionMutation } from '../../../api/aiApi';
import { AppText } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { DonutChart } from '../../../components/charts/DonutChart';
import { TrendBarChart } from '../../../components/charts/TrendBarChart';
import { EmptyState } from '../../../components/EmptyState';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from '../../../components/icons';
import { Input } from '../../../components/Input';
import { Skeleton } from '../../../components/Skeleton';
import { useToast } from '../../../components/Toast';
import { TransactionRow } from '../../../components/TransactionRow';
import { BalanceCard } from '../components/BalanceCard';
import { categoryColor } from '../../../constants/categories';
import { ExpenseCategory } from '../../../types/api';
import { ExpensesStackParamList, IncomeStackParamList, MainTabParamList } from '../../../navigation/types';
import { openExpenseForm, openIncomeForm } from '../../../navigation/navigateGlobal';
import { useAppSelector } from '../../../hooks/redux';
import { useTheme } from '../../../theme/ThemeProvider';
import { currentMonth, formatCurrency, formatMonthLabel } from '../../../utils/format';
import { useDashboardInsightQuery, useDashboardSummaryQuery } from '../dashboardApi';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<ExpensesStackParamList & IncomeStackParamList>
>;

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabelFull(month: string): string {
  const [y] = month.split('-');
  return `${formatMonthLabel(month)} ${y}`;
}

/**
 * Navigates into a screen nested inside another bottom-tab's stack. React
 * Navigation supports this at runtime (`navigate(tab, { screen, params })`),
 * but the composite tab+stack param list can't express it statically without
 * a much heavier navigator typing setup — an `any` escape hatch here is
 * deliberate rather than a typing gap to fix later.
 */
function navigateToTab(navigation: Nav, tab: string, screen: string, params: object): void {
  (navigation.navigate as (tab: string, opts: { screen: string; params: object }) => void)(tab, {
    screen,
    params,
  });
}

export function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);
  const [month, setMonth] = useState(currentMonth());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const { showToast } = useToast();

  const { data, isLoading, isFetching, isError, refetch } = useDashboardSummaryQuery({ month });
  const { data: insight } = useDashboardInsightQuery({ month });
  const [parseTransaction, { isLoading: isParsing }] = useParseTransactionMutation();

  const hasData = data && (data.totalIncome > 0 || data.totalExpense > 0);

  const handleQuickAddSubmit = async () => {
    const text = quickAddText.trim();
    if (!text) return;
    try {
      const parsed = await parseTransaction({ text }).unwrap();
      setQuickAddVisible(false);
      setQuickAddText('');
      const prefill = {
        title: parsed.title,
        amount: parsed.amount,
        paymentMethod: parsed.paymentMethod,
        category: parsed.category,
        source: parsed.source,
      };
      if (parsed.type === 'income') {
        openIncomeForm(navigation, { prefill });
      } else {
        openExpenseForm(navigation, { prefill });
      }
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Couldn't understand that — try including an amount";
      showToast(message, 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPage }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.space.l, gap: theme.space.l },
        ]}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={theme.colors.brandPrimary} />}
      >
        <View style={styles.headerRow}>
          <View>
            <AppText variant="caption" tone="muted">
              {greeting()}
            </AppText>
            <AppText variant="h1">{user?.name?.split(' ')[0] ?? 'there'}</AppText>
          </View>
          <Pressable
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Change month"
            style={[styles.monthPill, { backgroundColor: theme.colors.brandSubtle, borderRadius: theme.radius.full }]}
          >
            <AppText variant="caption" tone="brand">
              {monthLabelFull(month)}
            </AppText>
          </Pressable>
        </View>

        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <Card>
            <AppText tone="secondary" style={{ textAlign: 'center' }}>
              Couldn't load your dashboard. Pull to refresh.
            </AppText>
          </Card>
        ) : (
          <>
            <BalanceCard
              balance={data!.balance}
              income={data!.totalIncome}
              expense={data!.totalExpense}
            />

            {insight && (
              <View style={[styles.insightBar, { backgroundColor: theme.colors.brandSubtle, borderRadius: theme.radius.l }]}>
                <AppText variant="caption" tone="brand">
                  AI insight
                </AppText>
                <AppText variant="body" tone="secondary">
                  {insight}
                </AppText>
              </View>
            )}

            <View style={styles.quickActions}>
              <QuickAction
                label="Add expense"
                kind="expense"
                onPress={() => openExpenseForm(navigation)}
              />
              <QuickAction
                label="Add income"
                kind="income"
                onPress={() => openIncomeForm(navigation)}
              />
            </View>

            <Pressable
              onPress={() => setQuickAddVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Quick add with AI"
              style={[styles.quickAddBar, { backgroundColor: theme.colors.bgSurface, borderRadius: theme.radius.l }]}
            >
              <AppText variant="bodyStrong" tone="brand">
                Quick add
              </AppText>
              <AppText variant="caption" tone="muted">
                Describe a transaction in plain English
              </AppText>
            </Pressable>

            {hasData ? (
              <>
                {data!.categoryBreakdown.length > 0 && (
                  <Card style={{ gap: theme.space.m }}>
                    <AppText variant="h2">Spending by category</AppText>
                    <DonutChart
                      data={data!.categoryBreakdown.map((c) => ({ label: c.category, value: c.total }))}
                      centerLabel="Total"
                      centerValue={formatCurrency(data!.totalExpense)}
                      onSlicePress={(category) =>
                        navigateToTab(navigation, 'ExpensesTab', 'ExpenseList', { category })
                      }
                    />
                  </Card>
                )}

                <Card style={{ gap: theme.space.m }}>
                  <AppText variant="h2">6-month trend</AppText>
                  <TrendBarChart data={data!.trend} />
                </Card>

                <Card style={{ gap: theme.space.s }}>
                  <View style={styles.headerRow}>
                    <AppText variant="h2">Recent transactions</AppText>
                    <Pressable
                      onPress={() => navigateToTab(navigation, 'ExpensesTab', 'ExpenseList', {})}
                      accessibilityRole="button"
                    >
                      <AppText variant="caption" tone="brand">
                        See all
                      </AppText>
                    </Pressable>
                  </View>
                  {data!.recentTransactions.map((t) => (
                    <TransactionRow
                      key={`${t.type}-${t.id}`}
                      title={t.title}
                      category={t.category}
                      amount={t.amount}
                      date={t.date}
                      type={t.type}
                      categoryColor={
                        t.type === 'expense'
                          ? categoryColor(theme, t.category as ExpenseCategory)
                          : undefined
                      }
                      onPress={() =>
                        t.type === 'expense'
                          ? navigateToTab(navigation, 'ExpensesTab', 'ExpenseDetail', { id: t.id })
                          : undefined
                      }
                    />
                  ))}
                </Card>
              </>
            ) : (
              <Card>
                <EmptyState
                  title="No activity this month"
                  subtitle="Add an expense or income entry to see your dashboard come to life."
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <BottomSheet visible={pickerVisible} onClose={() => setPickerVisible(false)}>
        <View style={{ gap: theme.space.m, paddingBottom: theme.space.m }}>
          <AppText variant="h2">Select month</AppText>
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setMonth((m) => shiftMonth(m, -1))}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={styles.monthNavBtn}
            >
              <AppText variant="h2">‹</AppText>
            </Pressable>
            <AppText variant="h2">{monthLabelFull(month)}</AppText>
            <Pressable
              onPress={() => setMonth((m) => shiftMonth(m, 1))}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.monthNavBtn}
            >
              <AppText variant="h2">›</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet visible={quickAddVisible} onClose={() => setQuickAddVisible(false)}>
        <View style={{ gap: theme.space.m, paddingBottom: theme.space.m }}>
          <AppText variant="h2">Quick add</AppText>
          <AppText variant="caption" tone="secondary">
            Describe the transaction — AI fills in the rest.
          </AppText>
          <Input
            label="Transaction"
            value={quickAddText}
            onChangeText={setQuickAddText}
            placeholder='e.g. "coffee 150 UPI" or "got 5000 salary"'
            autoFocus
            onSubmitEditing={handleQuickAddSubmit}
          />
          <Button
            title="Add"
            onPress={handleQuickAddSubmit}
            loading={isParsing}
            disabled={!quickAddText.trim()}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

function QuickAction({
  label,
  kind,
  onPress,
}: {
  label: string;
  kind: 'expense' | 'income';
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const iconColor = kind === 'income' ? theme.colors.statusGood : theme.colors.brandPrimary;
  const iconBg =
    kind === 'income'
      ? theme.dark
        ? 'rgba(12,163,12,0.18)'
        : 'rgba(12,163,12,0.12)'
      : theme.colors.brandSubtle;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.bgSurface,
          borderRadius: theme.radius.l,
          opacity: pressed ? 0.7 : 1,
        },
        theme.dark
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderHairline }
          : Platform.select({
              ios: {
                shadowColor: '#3730A3',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              },
              android: { elevation: 2 },
            }),
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>
        {kind === 'income' ? (
          <ArrowDownLeftIcon size={18} color={iconColor} />
        ) : (
          <ArrowUpRightIcon size={18} color={iconColor} />
        )}
      </View>
      <AppText variant="bodyStrong">{label}</AppText>
    </Pressable>
  );
}

function DashboardSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.space.l }}>
      <Skeleton height={140} radius={theme.radius.l} />
      <View style={{ flexDirection: 'row', gap: theme.space.m }}>
        <Skeleton height={52} radius={theme.radius.l} style={{ flex: 1 }} />
        <Skeleton height={52} radius={theme.radius.l} style={{ flex: 1 }} />
      </View>
      <Skeleton height={180} radius={theme.radius.l} />
      <Skeleton height={160} radius={theme.radius.l} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthPill: { paddingHorizontal: 14, paddingVertical: 8 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 10,
  },
  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthNavBtn: { padding: 8 },
  insightBar: { paddingVertical: 12, paddingHorizontal: 16, gap: 2 },
  quickAddBar: { paddingVertical: 14, paddingHorizontal: 16, gap: 2 },
});
