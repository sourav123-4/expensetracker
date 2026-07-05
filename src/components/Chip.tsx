import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional dot color (category chips show their chart slot color). */
  dotColor?: string;
}

/** Selectable pill — category pickers, filters, tags. */
export function Chip({ label, selected = false, onPress, dotColor }: ChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.brandPrimary : theme.colors.brandSubtle,
          borderRadius: theme.radius.full,
        },
      ]}
    >
      {dotColor ? (
        <AppText
          variant="caption"
          style={{ color: selected ? theme.colors.brandOnPrimary : dotColor }}
        >
          ●
        </AppText>
      ) : null}
      <AppText variant="caption" tone={selected ? 'onPrimary' : 'brand'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 36,
  },
});
