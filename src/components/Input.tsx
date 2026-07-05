import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  /** Trailing element (e.g. currency symbol, visibility toggle). */
  trailing?: React.ReactNode;
}

/** Labeled text input with focus ring and inline error state. */
export function Input({ label, error, trailing, style, onFocus, onBlur, ...rest }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.statusCritical
    : focused
      ? theme.colors.brandPrimary
      : theme.colors.borderHairline;

  return (
    <View style={{ gap: theme.space.xs }}>
      {label ? (
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.bgSurface,
            borderColor,
            borderRadius: theme.radius.m,
            borderWidth: focused || error ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label || rest.placeholder}
          {...rest}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            { color: theme.colors.textPrimary },
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {trailing}
      </View>
      {error ? (
        <AppText variant="caption" tone="critical" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
});
