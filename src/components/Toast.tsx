import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';


type ToastKind = 'success' | 'error';

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** How long the toast stays fully visible before it animates out. */
const VISIBLE_MS = 2000;
const EXIT_MS = 220;

/**
 * Lightweight top toast for action feedback ("Expense added", "Deleted") —
 * a solid colored pill (green/red), not a subtle icon-tinted card, so
 * success/error reads at a glance. Confirmation stays in ConfirmDialog;
 * toasts are strictly non-blocking notices.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, kind });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withDelay(VISIBLE_MS, withTiming(-140, { duration: EXIT_MS }));
      opacity.value = withDelay(VISIBLE_MS, withTiming(0, { duration: EXIT_MS }));
      hideTimer.current = setTimeout(() => setToast(null), VISIBLE_MS + EXIT_MS);
    },
    [translateY, opacity],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const value = useMemo(() => ({ showToast }), [showToast]);
  const backgroundColor = toast?.kind === 'error' ? theme.colors.statusCritical : theme.colors.statusGood;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          style={[styles.toast, { top: insets.top + 10, backgroundColor }, animatedStyle]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <View style={styles.iconWrap}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              {toast.kind === 'error' ? (
                <Path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" />
              ) : (
                <Path
                  d="M4 12.5l5 5L20 6.5"
                  stroke="#FFFFFF"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>
          </View>
          <AppText variant="bodyStrong" style={styles.message} numberOfLines={2}>
            {toast.message}
          </AppText>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { flex: 1, color: '#FFFFFF' },
});
