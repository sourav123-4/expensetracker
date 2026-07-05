import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
import { DEFAULT_CURRENCY_SYMBOL } from '../../../constants/config';
import { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { INCOME_SOURCES, IncomeSource } from '../../../types/api';
import { formatDate } from '../../../utils/format';
import { useCreateIncomeMutation, useGetIncomeQuery, useUpdateIncomeMutation } from '../incomeApi';

type Props = NativeStackScreenProps<RootStackParamList, 'IncomeForm'>;

interface FormValues {
  title: string;
  amount: string;
  source: IncomeSource;
  description: string;
  date: Date;
}

export function IncomeFormScreen({ navigation, route }: Props) {
  const { id, prefill } = route.params ?? {};
  const isEdit = Boolean(id);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: existing, isLoading: isLoadingExisting } = useGetIncomeQuery(id ?? '', {
    skip: !isEdit,
  });

  const [createIncome, { isLoading: isCreating }] = useCreateIncomeMutation();
  const [updateIncome, { isLoading: isUpdating }] = useUpdateIncomeMutation();
  const prefillSource = (INCOME_SOURCES as readonly string[]).includes(prefill?.source ?? '')
    ? (prefill!.source as IncomeSource)
    : undefined;

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
      source: prefillSource ?? 'Salary',
      description: '',
      date: prefill?.date ? new Date(prefill.date) : new Date(),
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
        source: existing.source,
        description: existing.description ?? '',
        date: new Date(existing.date),
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title.trim(),
      amount: Number(values.amount),
      source: values.source,
      description: values.description.trim() || undefined,
      date: values.date.toISOString(),
    };

    try {
      if (isEdit && id) {
        await updateIncome({ id, patch: payload }).unwrap();
        showToast('Income updated');
      } else {
        await createIncome(payload).unwrap();
        showToast('Income added');
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
          <AppText variant="h1">{isEdit ? 'Edit income' : 'Add income'}</AppText>
          <View style={{ width: 40 }} />
        </View>

        <Controller
          control={control}
          name="title"
          rules={{ required: 'Title is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input label="Title" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} placeholder="e.g. July salary" />
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
          <AppText variant="caption" tone="secondary">
            Source
          </AppText>
          <View style={styles.chipWrap}>
            {INCOME_SOURCES.map((src) => (
              <Chip key={src} label={src} selected={watch('source') === src} onPress={() => setValue('source', src)} />
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
            style={[styles.dateField, { borderColor: theme.colors.borderHairline, borderRadius: theme.radius.m, backgroundColor: theme.colors.bgSurface }]}
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

        <Button title={isEdit ? 'Save changes' : 'Add income'} onPress={handleSubmit(onSubmit)} loading={isCreating || isUpdating} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateField: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth },
  dateDoneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
});
