import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

/** "or" divider between the password form and social sign-in options. */
export function OrDivider() {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: theme.colors.borderHairline }]} />
      <AppText variant="caption" tone="muted">
        or
      </AppText>
      <View style={[styles.line, { backgroundColor: theme.colors.borderHairline }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
