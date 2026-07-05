import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
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
            borderWidth: focused || error ? 1.5 : theme.dark ? StyleSheet.hairlineWidth : 0,
          },
          // Fields lift off the page with a soft shadow, matching the app's
          // card language; the border color communicates focus/error on top.
          // The shadow must stay on regardless of focus state — toggling
          // Android's `elevation` promotes/demotes the view to its own
          // hardware layer, and doing that on the exact frame a TextInput
          // gains focus can recreate the native EditText and silently drop
          // keyboard focus (the field looks tappable but stops accepting
          // input).
          !theme.dark &&
            Platform.select({
              ios: {
                shadowColor: '#3730A3',
                shadowOpacity: 0.08,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 3 },
              },
              android: { elevation: 2 },
            }),
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
