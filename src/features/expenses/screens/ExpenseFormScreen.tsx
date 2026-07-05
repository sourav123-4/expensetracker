import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BackButton } from '../../../components/BackButton';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { useConfirm } from '../../../components/ConfirmDialog';
import { Input } from '../../../components/Input';
import { Skeleton } from '../../../components/Skeleton';
import { useToast } from '../../../components/Toast';
import { categoryColor } from '../../../constants/categories';
import { DEFAULT_CURRENCY_SYMBOL } from '../../../constants/config';
import { useDebounce } from '../../../hooks/useDebounce';
import { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { EXPENSE_CATEGORIES, ExpenseCategory, PAYMENT_METHODS, PaymentMethod } from '../../../types/api';
import { formatDate } from '../../../utils/format';
import {
  useCategorizeExpenseMutation,
  useCreateExpenseMutation,
  useGetExpenseQuery,
  useUpdateExpenseMutation,
} from '../expensesApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseForm'>;

interface FormValues {
  title: string;
  amount: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  description: string;
  date: Date;
  isRecurring: boolean;
}

export function ExpenseFormScreen({ navigation, route }: Props) {
  const { id, prefill } = route.params ?? {};
  const isEdit = Boolean(id);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: existing, isLoading: isLoadingExisting } = useGetExpenseQuery(id ?? '', {
    skip: !isEdit,
  });
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [categorizeExpense] = useCategorizeExpenseMutation();
  const prefillCategory = (EXPENSE_CATEGORIES as readonly string[]).includes(prefill?.category ?? '')
    ? (prefill!.category as ExpenseCategory)
    : undefined;
  // A category that already arrived via prefill (AI quick-add) counts as "touched" —
  // the title-based auto-suggest below must not second-guess it.
  const categoryTouchedRef = useRef(Boolean(prefillCategory));
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState(false);

  const { showToast } = useToast();
  const confirm = useConfirm();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    mode: 'onTouched',
    defaultValues: {
      title: prefill?.title ?? '',
      amount: prefill?.amount ? String(prefill.amount) : '',
      category: prefillCategory ?? 'Food',
      paymentMethod: (PAYMENT_METHODS as readonly string[]).includes(prefill?.paymentMethod ?? '')
        ? (prefill!.paymentMethod as PaymentMethod)
        : 'Cash',
      description: '',
      date: prefill?.date ? new Date(prefill.date) : new Date(),
      isRecurring: false,
    },
  });

  const handleClose = async () => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    const ok = await confirm({
      title: 'Discard changes?',
      message: 'Your edits will be lost.',
      confirmText: 'Discard',
      cancelText: 'Keep editing',
      destructive: true,
    });
    if (ok) navigation.goBack();
  };

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        amount: String(existing.amount),
        category: existing.category,
        paymentMethod: existing.paymentMethod,
        description: existing.description ?? '',
        date: new Date(existing.date),
        isRecurring: existing.isRecurring,
      });
    }
  }, [existing, reset]);

  const debouncedTitle = useDebounce(watch('title'), 600);

  // AI-suggests a category from the title as the user types — only while adding
  // (not editing an existing expense) and only until they pick a category themselves,
  // so it never fights a deliberate manual choice.
  useEffect(() => {
    if (isEdit || categoryTouchedRef.current) return;
    const trimmed = debouncedTitle.trim();
    if (trimmed.length < 3) return;

    let cancelled = false;
    categorizeExpense({ title: trimmed })
      .unwrap()
      .then((category) => {
        if (!cancelled && category && !categoryTouchedRef.current) {
          setValue('category', category);
          setAiSuggestedCategory(true);
        }
      })
      .catch(() => {
        // AI categorization unavailable/unconfigured — keep the default category
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTitle, isEdit, categorizeExpense, setValue]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title.trim(),
      amount: Number(values.amount),
      category: values.category,
      paymentMethod: values.paymentMethod,
      description: values.description.trim() || undefined,
      date: values.date.toISOString(),
      isRecurring: values.isRecurring,
    };

    try {
      if (isEdit && id) {
        await updateExpense({ id, patch: payload }).unwrap();
        showToast('Expense updated');
      } else {
        await createExpense(payload).unwrap();
        showToast('Expense added');
      }
      navigation.goBack();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong';
      showToast(message, 'error');
    }
  };

  if (isEdit && isLoadingExisting) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgPage, paddingTop: insets.top + 24, gap: 16, paddingHorizontal: 20 }]}>
        <Skeleton height={52} />
        <Skeleton height={52} />
        <Skeleton height={100} />
      </View>
    );
  }

  const dateValue = watch('date');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgPage }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, gap: theme.space.l }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <BackButton onPress={handleClose} accessibilityLabel="Close" />
          <AppText variant="h1">{isEdit ? 'Edit expense' : 'Add expense'}</AppText>
          <View style={{ width: 40 }} />
        </View>

        <Controller
          control={control}
          name="title"
          rules={{ required: 'Title is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input label="Title" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} placeholder="e.g. Grocery run" />
          )}
        />

        <Controller
          control={control}
          name="amount"
          rules={{
            required: 'Amount is required',
            validate: (v) => Number(v) > 0 || 'Amount must be greater than zero',
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Amount"
              value={value}
              onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
              onBlur={onBlur}
              error={errors.amount?.message}
              keyboardType="decimal-pad"
              placeholder="0.00"
              trailing={<AppText tone="muted">{DEFAULT_CURRENCY_SYMBOL}</AppText>}
            />
          )}
        />

        <View style={{ gap: theme.space.s }}>
          <View style={styles.categoryLabelRow}>
            <AppText variant="caption" tone="secondary">
              Category
            </AppText>
            {aiSuggestedCategory && (
              <AppText variant="caption" tone="brand">
                AI suggested
              </AppText>
            )}
          </View>
          <View style={styles.chipWrap}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                dotColor={categoryColor(theme, cat)}
                selected={watch('category') === cat}
                onPress={() => {
                  categoryTouchedRef.current = true;
                  setAiSuggestedCategory(false);
                  setValue('category', cat);
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: theme.space.s }}>
          <AppText variant="caption" tone="secondary">
            Payment method
          </AppText>
          <View style={styles.chipWrap}>
            {PAYMENT_METHODS.map((pm) => (
              <Chip
                key={pm}
                label={pm}
                selected={watch('paymentMethod') === pm}
                onPress={() => setValue('paymentMethod', pm)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: theme.space.xs }}>
          <AppText variant="caption" tone="secondary">
            Date
          </AppText>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            style={[
              styles.dateField,
              { borderColor: theme.colors.borderHairline, borderRadius: theme.radius.m, backgroundColor: theme.colors.bgSurface },
            ]}
          >
            <AppText>{formatDate(dateValue.toISOString())}</AppText>
          </Pressable>
          {showDatePicker && (
            <>
              <DateTimePicker
                value={dateValue}
                mode="date"
                maximumDate={new Date()}
                onChange={(_e, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setValue('date', selected);
                }}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  accessibilityRole="button"
                  style={styles.dateDoneButton}
                >
                  <AppText variant="bodyStrong" tone="brand">
                    Done
                  </AppText>
                </Pressable>
              )}
            </>
          )}
        </View>

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Description (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, paddingTop: 12 }}
            />
          )}
        />

        <View style={styles.recurringRow}>
          <AppText variant="bodyStrong">Recurring expense</AppText>
          <Controller
            control={control}
            name="isRecurring"
            render={({ field: { value, onChange } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: theme.colors.brandPrimary }}
                accessibilityLabel="Recurring expense"
              />
            )}
          />
        </View>

        <Button
          title={isEdit ? 'Save changes' : 'Add expense'}
          onPress={handleSubmit(onSubmit)}
          loading={isCreating || isUpdating}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateField: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth },
  dateDoneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
  recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
