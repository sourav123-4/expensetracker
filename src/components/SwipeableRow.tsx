import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Rendered under the row, revealed by swiping left. Total width drives the snap point. */
  actionsWidth: number;
  renderActions: () => React.ReactNode;
  /** Card style: rounded corners, surface background, clipped actions. */
  rounded?: boolean;
}

/**
 * Minimal swipe-to-reveal-actions row built directly on Reanimated's pan
 * gesture (react-native-gesture-handler v3 doesn't yet re-export a public
 * `Swipeable` component). Snaps open past a threshold, closes on tap-through.
 */
export function SwipeableRow({
  children,
  actionsWidth,
  renderActions,
  rounded = false,
}: SwipeableRowProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const close = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      translateX.value = Math.min(0, Math.max(-actionsWidth, next));
    })
    .onEnd((e) => {
      const shouldOpen = translateX.value < -actionsWidth / 2 || e.velocityX < -500;
      translateX.value = withSpring(shouldOpen ? -actionsWidth : 0, {
        damping: 20,
        stiffness: 200,
      });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Shadows are clipped by the inner view's `overflow: hidden` (needed to
  // round the swipe actions), so the shadow lives on an outer, non-clipping
  // wrapper — same elevation treatment as Card, for visual parity. Android
  // elevation only casts from a view with a background, so the wrapper also
  // carries the surface color + radius (fully covered by the row content).
  return (
    <View
      style={
        rounded && !theme.dark
          ? [styles.shadowWrap, { borderRadius: theme.radius.l, backgroundColor: theme.colors.bgSurface }]
          : undefined
      }
    >
      <View
        style={[
          styles.container,
          rounded && {
            borderRadius: theme.radius.l,
            overflow: 'hidden',
            ...(theme.dark
              ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderHairline }
              : null),
          },
        ]}
      >
        <View style={[styles.actions, { width: actionsWidth }]}>{renderActions()}</View>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              { backgroundColor: rounded ? theme.colors.bgSurface : theme.colors.bgPage },
              rowStyle,
            ]}
            onTouchStart={() => {
              if (translateX.value !== 0) close();
            }}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  shadowWrap: Platform.select({
    ios: {
      shadowColor: '#3730A3',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    // Untinted, low elevation — tinted shadows render as a harsh dark rim
    // on OEM skins (Samsung One UI) instead of a soft blur.
    android: { elevation: 2 },
    default: {},
  }),
});
