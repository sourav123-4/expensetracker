import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
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
  const isPrimary = variant === 'primary';

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

  const gradientStops = theme.dark ? ['#4338CA', '#7C3AED'] : ['#4F46E5', '#7C3AED'];

  return (
    <View
      style={
        isPrimary &&
        !isBlocked &&
        !theme.dark &&
        Platform.select({
          ios: {
            shadowColor: '#4F46E5',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          },
          android: { elevation: 3 },
        })
      }
    >
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
            backgroundColor: isPrimary ? undefined : variantStyles[variant].bg,
            borderRadius: theme.radius.m,
            overflow: isPrimary ? 'hidden' : undefined,
            opacity: isBlocked && !loading ? 0.5 : 1,
          },
          animatedStyle,
          style,
        ]}
      >
        {isPrimary ? (
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="buttonGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={gradientStops[0]} />
                <Stop offset="1" stopColor={gradientStops[1]} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#buttonGradient)" />
          </Svg>
        ) : null}
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
    </View>
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
