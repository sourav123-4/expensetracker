import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/tokens';

type Variant = keyof typeof typography;
type Tone = 'primary' | 'secondary' | 'muted' | 'brand' | 'onPrimary' | 'good' | 'critical';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  /** Tabular figures for amounts that stack in columns. */
  tabular?: boolean;
}

/** Themed text — the only way text is rendered in the app. */
export function AppText({
  variant = 'body',
  tone = 'primary',
  tabular = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();

  const toneColor: Record<Tone, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    brand: theme.colors.brandPrimary,
    onPrimary: theme.colors.brandOnPrimary,
    good: theme.colors.statusGood,
    critical: theme.colors.statusCritical,
  };

  const base = typography[variant] as TextStyle;

  return (
    <Text
      {...rest}
      style={[
        base,
        { color: toneColor[tone] },
        variant === 'label' && { textTransform: 'uppercase' },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
