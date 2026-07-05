import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Floating action button — bottom-right "+" for add flows. */
export function Fab({ onPress, accessibilityLabel }: FabProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: theme.duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: theme.duration.fast });
      }}
      style={[
        styles.fab,
        { backgroundColor: theme.colors.brandPrimary },
        // Tinted shadowColor + elevation renders as a harsh saturated ring
        // on some OEM skins (Samsung One UI) — iOS keeps the branded glow,
        // Android falls back to a plain, safe elevation shadow.
        Platform.OS === 'ios' && { shadowColor: theme.colors.brandPrimary },
        animatedStyle,
      ]}
    >
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Path
          d="M12 5v14M5 12h14"
          stroke={theme.colors.brandOnPrimary}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Svg>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
