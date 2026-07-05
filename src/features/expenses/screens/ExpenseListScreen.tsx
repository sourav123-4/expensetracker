import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { Chip } from '../../../components/Chip';
import { useConfirm } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { Fab } from '../../../components/Fab';
import { PencilIcon, SearchIcon, TrashIcon } from '../../../components/icons';
import { Input } from '../../../components/Input';
import { SkeletonRow } from '../../../components/Skeleton';
import { SwipeableRow } from '../../../components/SwipeableRow';
import { useToast } from '../../../components/Toast';
import { TransactionRow } from '../../../components/TransactionRow';
import { categoryColor } from '../../../constants/categories';
import { useDebounce } from '../../../hooks/useDebounce';
import { openExpenseForm } from '../../../navigation/navigateGlobal';
import { ExpensesStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory, ExpenseListParams } from '../../../types/api';
import { useDeleteExpenseMutation, useListExpensesQuery } from '../expensesApi';

type Props = NativeStackScreenProps<ExpensesStackParamList, 'ExpenseList'>;

const SORT_OPTIONS: { label: string; sortBy: ExpenseListParams['sortBy']; order: ExpenseListParams['order'] }[] = [
  { label: 'Newest first', sortBy: 'date', order: 'desc' },
  { label: 'Oldest first', sortBy: 'date', order: 'asc' },
  { label: 'Amount: high to low', sortBy: 'amount', order: 'desc' },
  { label: 'Amount: low to high', sortBy: 'amount', order: 'asc' },
];

export function ExpenseListScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<ExpenseCategory | undefined>(route.params?.category as ExpenseCategory);
  const [sortIndex, setSortIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [deleteExpense] = useDeleteExpenseMutation();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const queryArgs = useMemo<ExpenseListParams>(
    () => ({
      page,
      limit: 20,
      q: debouncedSearch || undefined,
      category,
      sortBy: SORT_OPTIONS[sortIndex].sortBy,
      order: SORT_OPTIONS[sortIndex].order,
    }),
    [page, debouncedSearch, category, sortIndex],
  );

  const { data, isLoading, isFetching, refetch } = useListExpensesQuery(queryArgs);

  const hasFilters = Boolean(category || debouncedSearch);

  const clearFilters = () => {
    setCategory(undefined);
    setSearch('');
    setPage(1);
  };

  const handleDelete = async (expense: Expense) => {
    const ok = await confirm({
      title: 'Delete expense?',
      message: `"${expense.title}" will be permanently removed.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteExpense(expense._id).unwrap();
      showToast('Expense deleted');
    } catch {
      showToast('Could not delete — please try again', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPage, paddingTop: insets.top }]}>
      <View style={[styles.header, { gap: theme.space.m, paddingTop: theme.space.l }]}>
        <AppText variant="h1">Expenses</AppText>

        <Input
          label=""
          placeholder="Search expenses"
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          trailing={<SearchIcon size={18} color={theme.colors.textMuted} />}
        />

        <View style={styles.filterRow}>
          <Pressable onPress={() => setSortSheetVisible(true)} accessibilityRole="button">
            <Chip label={SORT_OPTIONS[sortIndex].label} />
          </Pressable>
          <FlatList
            data={EXPENSE_CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => c}
            contentContainerStyle={{ gap: 8, paddingLeft: 8 }}
            renderItem={({ item }) => (
              <Chip
                label={item}
                selected={category === item}
                dotColor={categoryColor(theme, item)}
                onPress={() => {
                  setCategory((c) => (c === item ? undefined : item));
                  setPage(1);
                }}
              />
            )}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data?.expenses ?? []}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (data?.meta.hasNextPage && !isFetching) setPage((p) => p + 1);
          }}
          refreshing={isFetching && page === 1}
          onRefresh={() => {
            setPage(1);
            refetch();
          }}
          ListEmptyComponent={
            <EmptyState
              title={hasFilters ? 'No matching expenses' : 'No expenses yet'}
              subtitle={
                hasFilters
                  ? 'Try a different search or clear your filters.'
                  : 'Tap the + button to log your first expense.'
              }
              actionLabel={hasFilters ? 'Clear filters' : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          }
          renderItem={({ item }) => (
            <SwipeableRow
              rounded
              actionsWidth={128}
              renderActions={() => (
                <>
                  <Pressable
                    onPress={() => openExpenseForm(navigation, { id: item._id })}
                    accessibilityRole="button"
                    accessibilityLabel="Edit expense"
                    style={[styles.swipeAction, { backgroundColor: theme.colors.brandPrimary }]}
                  >
                    <PencilIcon size={20} color={theme.colors.brandOnPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete expense"
                    style={[styles.swipeAction, { backgroundColor: theme.colors.statusCritical }]}
                  >
                    <TrashIcon size={20} color="#FFFFFF" />
                  </Pressable>
                </>
              )}
            >
              <TransactionRow
                inset
                title={item.title}
                category={item.category}
                amount={item.amount}
                date={item.date}
                type="expense"
                categoryColor={categoryColor(theme, item.category)}
                onPress={() => navigation.navigate('ExpenseDetail', { id: item._id })}
              />
            </SwipeableRow>
          )}
        />
      )}

      <Fab accessibilityLabel="Add expense" onPress={() => openExpenseForm(navigation)} />

      <BottomSheet visible={sortSheetVisible} onClose={() => setSortSheetVisible(false)}>
        {(close) => (
        <View style={{ gap: theme.space.s, paddingBottom: theme.space.m }}>
          <AppText variant="h2">Sort by</AppText>
          {SORT_OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.label}
              onPress={() => {
                setSortIndex(i);
                close();
              }}
              accessibilityRole="button"
              style={styles.sortOption}
            >
              <AppText variant={i === sortIndex ? 'bodyStrong' : 'body'} tone={i === sortIndex ? 'brand' : 'primary'}>
                {opt.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, flexGrow: 1, gap: 10 },
  swipeAction: { width: 64, alignItems: 'center', justifyContent: 'center' },
  sortOption: { paddingVertical: 12 },
});
