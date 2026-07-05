import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { useConfirm } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { Fab } from '../../../components/Fab';
import { TrashIcon, PencilIcon } from '../../../components/icons';
import { SkeletonRow } from '../../../components/Skeleton';
import { SwipeableRow } from '../../../components/SwipeableRow';
import { useToast } from '../../../components/Toast';
import { TransactionRow } from '../../../components/TransactionRow';
import { openIncomeForm } from '../../../navigation/navigateGlobal';
import { IncomeStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { Income } from '../../../types/api';
import { useDeleteIncomeMutation, useListIncomeQuery } from '../incomeApi';

type Props = NativeStackScreenProps<IncomeStackParamList, 'IncomeList'>;

export function IncomeListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, refetch } = useListIncomeQuery({ page, limit: 20 });
  const [deleteIncome] = useDeleteIncomeMutation();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const handleDelete = async (income: Income) => {
    const ok = await confirm({
      title: 'Delete income entry?',
      message: `"${income.title}" will be permanently removed.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteIncome(income._id).unwrap();
      showToast('Income entry deleted');
    } catch {
      showToast('Could not delete — please try again', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPage, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingTop: theme.space.l }]}>
        <AppText variant="h1">Income</AppText>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data?.income ?? []}
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
              title="No income logged yet"
              subtitle="Tap the + button to add your salary, freelance payments, or other income."
            />
          }
          renderItem={({ item }) => (
            <SwipeableRow
              rounded
              actionsWidth={128}
              renderActions={() => (
                <>
                  <Pressable
                    onPress={() => openIncomeForm(navigation, { id: item._id })}
                    accessibilityRole="button"
                    accessibilityLabel="Edit income"
                    style={[styles.swipeAction, { backgroundColor: theme.colors.brandPrimary }]}
                  >
                    <PencilIcon size={20} color={theme.colors.brandOnPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete income"
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
                category={item.source}
                amount={item.amount}
                date={item.date}
                type="income"
                onPress={() => openIncomeForm(navigation, { id: item._id })}
              />
            </SwipeableRow>
          )}
        />
      )}

      <Fab accessibilityLabel="Add income" onPress={() => openIncomeForm(navigation)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, flexGrow: 1, gap: 10 },
  swipeAction: { width: 64, alignItems: 'center', justifyContent: 'center' },
});
