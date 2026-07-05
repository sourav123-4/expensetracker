import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Renders the confirm button in the critical/red style for destructive actions. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

/**
 * In-app replacement for `Alert.alert` confirmations — a centered card modal
 * matching the app's own design system instead of the native OS dialog.
 * `useConfirm()` resolves `true`/`false`, mirroring how Alert callbacks read.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  const animateIn = () => {
    scale.value = withTiming(1, { duration: 180 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    requestAnimationFrame(animateIn);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal visible={options !== null} transparent animationType="fade" onRequestClose={() => close(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel="Dismiss" />
          {options ? (
            <Animated.View
              style={[
                styles.card,
                { backgroundColor: theme.colors.bgSurfaceRaised, borderRadius: theme.radius.l },
                cardStyle,
              ]}
              accessibilityRole="alert"
            >
              <AppText variant="h2" style={styles.title}>
                {options.title}
              </AppText>
              {options.message ? (
                <AppText tone="secondary" style={styles.message}>
                  {options.message}
                </AppText>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => close(false)}
                  accessibilityRole="button"
                  style={[styles.button, { backgroundColor: theme.colors.brandSubtle, borderRadius: theme.radius.m }]}
                >
                  <AppText variant="bodyStrong" tone="brand">
                    {options.cancelText ?? 'Cancel'}
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => close(true)}
                  accessibilityRole="button"
                  style={[
                    styles.button,
                    {
                      backgroundColor: options.destructive ? theme.colors.statusCritical : theme.colors.brandPrimary,
                      borderRadius: theme.radius.m,
                    },
                  ]}
                >
                  <AppText variant="bodyStrong" tone="onPrimary">
                    {options.confirmText ?? 'Confirm'}
                  </AppText>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** `const confirmed = await confirm({ title, message, destructive });` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    gap: 6,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  button: { flex: 1, paddingVertical: 13, alignItems: 'center' },
});
