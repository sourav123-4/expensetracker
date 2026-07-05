import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isBlocked = disabled || loading;

  const variantStyles: Record<Variant, { bg: string; border?: string }> = {
    primary: { bg: theme.colors.brandPrimary },
    secondary: { bg: theme.colors.brandSubtle },
    ghost: { bg: 'transparent' },
    destructive: { bg: theme.colors.statusCritical },
  };

  const textTone =
    variant === 'primary' || variant === 'destructive'
      ? 'onPrimary'
      : variant === 'secondary'
        ? 'brand'
        : 'brand';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: theme.duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: theme.duration.fast });
      }}
      style={[
        styles.base,
        {
          backgroundColor: variantStyles[variant].bg,
          borderRadius: theme.radius.m,
          opacity: isBlocked && !loading ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'destructive'
              ? theme.colors.brandOnPrimary
              : theme.colors.brandPrimary
          }
        />
      ) : (
        <AppText variant="bodyStrong" tone={textTone}>
          {title}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
