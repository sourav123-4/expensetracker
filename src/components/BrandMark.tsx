import React from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/**
 * App logo mark — rounded square + wallet glyph. Uses the same diagonal
 * brand gradient as the dashboard's balance card for a consistent identity
 * everywhere the mark appears (auth screens, lock screen).
 */
export function BrandMark({ size = 56 }: { size?: number }) {
  const { theme } = useTheme();
  const glyph = size * 0.55;
  const radius = size * 0.32;
  const stops = theme.dark ? ['#4338CA', '#7C3AED'] : ['#4F46E5', '#7C3AED'];

  return (
    <View
      style={
        !theme.dark &&
        Platform.select({
          ios: {
            shadowColor: '#4F46E5',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          },
          android: { elevation: 4 },
        })
      }
    >
      <View
        style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}
        accessibilityElementsHidden
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="brandMarkGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={stops[0]} />
              <Stop offset="1" stopColor={stops[1]} />
            </LinearGradient>
          </Defs>
          <Rect width={size} height={size} fill="url(#brandMarkGradient)" />
        </Svg>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
            {/* Always white — the gradient stops are chosen to keep contrast
                regardless of theme, independent of the theme's brandOnPrimary
                (which assumes a flat, theme-dependent background). */}
            <Path
              d="M3 7a2 2 0 0 1 2-2h13v3M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={16.5} cy={13.5} r={1.4} fill="#FFFFFF" />
          </Svg>
        </View>
      </View>
    </View>
  );
}
