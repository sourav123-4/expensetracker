import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { PhoneIcon } from './icons';

interface PhoneButtonProps {
  onPress: () => void;
}

/** "Continue with phone" — same outlined shape as GoogleButton, for the other social sign-in option. */
export function PhoneButton({ onPress }: PhoneButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Continue with phone"
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.borderHairline,
          borderRadius: theme.radius.m,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <PhoneIcon size={20} color={theme.colors.textPrimary} />
      <AppText variant="bodyStrong">Continue with phone</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
