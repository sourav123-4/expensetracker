import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Pass a render function to let content (e.g. a menu option) trigger the same animated close. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}

/** Modal bottom sheet — filters, month picker, action menus. */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);
  // `height` is 0 with the keyboard hidden and goes negative (by the keyboard's
  // height) while it's shown — added straight onto translateY, it lifts the
  // whole sheet clear of the keyboard instead of leaving it covered.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: theme.duration.base });
      backdropOpacity.value = withTiming(1, { duration: theme.duration.base });
    }
  }, [visible, translateY, backdropOpacity, theme.duration.base]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + keyboardHeight.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const handleClose = () => {
    // Wait for the slide-down/fade to finish before flipping `visible` off —
    // otherwise the Modal unmounts instantly and the close animation never renders.
    translateY.value = withTiming(400, { duration: theme.duration.fast });
    backdropOpacity.value = withTiming(0, { duration: theme.duration.fast }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.bgSurfaceRaised,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingBottom: insets.bottom + theme.space.l,
          },
          sheetStyle,
        ]}
      >
        <View
          style={[styles.handle, { backgroundColor: theme.colors.borderHairline }]}
          accessibilityElementsHidden
        />
        {typeof children === 'function' ? children(handleClose) : children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
});
