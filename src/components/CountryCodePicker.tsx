import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { AppText } from './AppText';
import { ChevronRightIcon, SearchIcon } from './icons';
import { Input } from './Input';
import { useTheme } from '../theme/ThemeProvider';
import { Country, COUNTRIES } from '../constants/countries';

interface CountryCodePickerProps {
  value: Country;
  onChange: (country: Country) => void;
}

/** Tappable dial-code chip that opens a searchable country sheet — used next to the phone number field. */
export function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q),
    );
  }, [query]);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Country: ${value.name}, ${value.dialCode}`}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.bgSurface,
            borderRadius: theme.radius.m,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <AppText variant="bodyStrong">
          {value.flag} {value.dialCode}
        </AppText>
        <ChevronRightIcon size={16} color={theme.colors.textMuted} strokeWidth={2.5} />
      </Pressable>

      <BottomSheet
        visible={visible}
        onClose={() => {
          setVisible(false);
          setQuery('');
        }}
      >
        <View style={{ gap: theme.space.m, height: 420 }}>
          <AppText variant="h2">Select country</AppText>
          <Input
            label=""
            placeholder="Search country or code"
            value={query}
            onChangeText={setQuery}
            trailing={<SearchIcon size={18} color={theme.colors.textMuted} />}
          />
          <FlatList
            data={results}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <AppText tone="muted" style={styles.empty}>
                No matching countries
              </AppText>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setVisible(false);
                  setQuery('');
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
              >
                <AppText variant="bodyStrong">{item.flag}</AppText>
                <AppText style={styles.rowName}>{item.name}</AppText>
                <AppText tone="muted">{item.dialCode}</AppText>
              </Pressable>
            )}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowName: { flex: 1 },
  empty: { textAlign: 'center', paddingVertical: 24 },
});
