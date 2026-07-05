import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps extends ViewProps {
  /** Raised cards get the sheet/modal surface color in dark mode. */
  raised?: boolean;
  padded?: boolean;
}

/**
 * Rounded surface card — a soft elevated shadow lifts it off the page in
 * light mode (no border there — the shadow alone reads as a card on the
 * cooler page background); shadows read poorly on dark surfaces, so dark
 * mode falls back to a hairline border instead.
 */
export function Card({ raised = false, padded = true, style, children, ...rest }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: raised ? theme.colors.bgSurfaceRaised : theme.colors.bgSurface,
          borderRadius: theme.radius.l,
          padding: padded ? theme.space.l : 0,
        },
        theme.dark
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderHairline }
          : Platform.select({
              ios: {
                shadowColor: '#3730A3',
                shadowOpacity: 0.1,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
              },
              // Untinted, low elevation — tinted shadows render as a harsh
              // dark rim on OEM skins (Samsung One UI) instead of a soft blur.
              android: { elevation: 2 },
            }),
        style,
      ]}
    >
      {children}
    </View>
  );
}
