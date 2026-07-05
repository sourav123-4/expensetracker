import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useConfirm } from '../../../components/ConfirmDialog';
import { ArrowLeftIcon, CopyIcon, PencilIcon, TrashIcon } from '../../../components/icons';
import { Skeleton } from '../../../components/Skeleton';
import { useToast } from '../../../components/Toast';
import { categoryColor } from '../../../constants/categories';
import { openExpenseForm } from '../../../navigation/navigateGlobal';
import { ExpensesStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { formatCurrency, formatDate } from '../../../utils/format';
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseQuery,
} from '../expensesApi';

type Props = NativeStackScreenProps<ExpensesStackParamList, 'ExpenseDetail'>;

export function ExpenseDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: expense, isLoading } = useGetExpenseQuery(id);
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();
  const [duplicateExpense, { isLoading: isDuplicating }] = useCreateExpenseMutation();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete expense?',
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteExpense(id).unwrap();
      showToast('Expense deleted');
      navigation.goBack();
    } catch {
      showToast('Could not delete — please try again', 'error');
    }
  };

  const handleDuplicate = async () => {
    if (!expense) return;
    try {
      await duplicateExpense({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        date: new Date().toISOString(),
        description: expense.description,
        tags: expense.tags,
        isRecurring: false,
      }).unwrap();
      showToast("Duplicated with today's date");
      navigation.goBack();
    } catch {
      showToast('Could not duplicate — please try again', 'error');
    }
  };

  if (isLoading || !expense) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgPage, paddingTop: insets.top + 24, paddingHorizontal: 20, gap: 16 }]}>
        <Skeleton height={40} />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </View>
    );
  }

  const color = categoryColor(theme, expense.category);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.bgPage }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, gap: theme.space.l }]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
          <ArrowLeftIcon color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => openExpenseForm(navigation, { id })}
            accessibilityRole="button"
            accessibilityLabel="Edit"
            hitSlop={10}
          >
            <PencilIcon color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleDuplicate} accessibilityRole="button" accessibilityLabel="Duplicate" hitSlop={10} disabled={isDuplicating}>
            <CopyIcon color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete" hitSlop={10} disabled={isDeleting}>
            <TrashIcon color={theme.colors.statusCritical} />
          </Pressable>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText variant="display" tabular>
          -{formatCurrency(expense.amount)}
        </AppText>
        <AppText tone="secondary">{expense.title}</AppText>
      </View>

      <Card style={{ gap: theme.space.m }}>
        <DetailRow label="Category" value={expense.category} dotColor={color} />
        <DetailRow label="Payment method" value={expense.paymentMethod} />
        <DetailRow label="Date" value={formatDate(expense.date)} />
        {expense.isRecurring ? <DetailRow label="Recurring" value="Yes" /> : null}
        {expense.tags.length > 0 ? <DetailRow label="Tags" value={expense.tags.join(', ')} /> : null}
        {expense.description ? <DetailRow label="Description" value={expense.description} /> : null}
      </Card>

      {expense.receiptUrl ? (
        <Card padded={false}>
          <Image
            source={{ uri: expense.receiptUrl }}
            style={{ width: '100%', height: 220, borderRadius: theme.radius.l }}
            resizeMode="cover"
          />
        </Card>
      ) : null}

      <Button title="Delete expense" variant="destructive" onPress={handleDelete} loading={isDeleting} />
    </ScrollView>
  );
}

function DetailRow({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
        <AppText variant="bodyStrong">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', gap: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
