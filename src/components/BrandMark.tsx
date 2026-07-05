import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/** App logo mark — rounded square + wallet glyph. */
export function BrandMark({ size = 56 }: { size?: number }) {
  const { theme } = useTheme();
  const glyph = size * 0.55;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: theme.colors.brandPrimary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
    >
      <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 7a2 2 0 0 1 2-2h13v3M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z"
          stroke={theme.colors.brandOnPrimary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={16.5} cy={13.5} r={1.4} fill={theme.colors.brandOnPrimary} />
      </Svg>
    </View>
  );
}
