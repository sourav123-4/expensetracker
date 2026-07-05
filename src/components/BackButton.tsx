import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { ArrowLeftIcon } from './icons';

interface BackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Circular back/close affordance — a tactile surface instead of a bare icon, matching the app's card language. */
export function BackButton({ onPress, accessibilityLabel = 'Go back' }: BackButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: theme.duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: theme.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[
        styles.button,
        { backgroundColor: theme.colors.bgSurface },
        theme.dark
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderHairline }
          : Platform.select({
              ios: {
                shadowColor: '#3730A3',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
              },
              android: { elevation: 2 },
            }),
        animatedStyle,
      ]}
    >
      <ArrowLeftIcon size={20} color={theme.colors.textPrimary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
