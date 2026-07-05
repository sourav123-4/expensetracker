import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Centered empty state with a simple wallet illustration. */
export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { gap: theme.space.m }]}>
      <Svg width={96} height={96} viewBox="0 0 96 96" accessibilityElementsHidden>
        <Circle cx={48} cy={48} r={44} fill={theme.colors.brandSubtle} />
        <Path
          d="M28 38a6 6 0 0 1 6-6h26a4 4 0 0 1 4 4v2h-4v-2H34a2 2 0 0 0 0 4h30a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V38z"
          fill={theme.colors.brandPrimary}
        />
        <Circle cx={58} cy={52} r={3.5} fill={theme.colors.brandOnPrimary} />
      </Svg>
      <AppText variant="h2" style={styles.center}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText tone="secondary" style={styles.center}>
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: theme.space.s }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  center: { textAlign: 'center' },
});
