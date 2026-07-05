/**
 * ExpenseFlow
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import notifee from '@notifee/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Provider } from 'react-redux';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { store } from './src/app/store';
import { ConfirmProvider, useConfirm } from './src/components/ConfirmDialog';
import { LockScreen } from './src/components/LockScreen';
import { ToastProvider } from './src/components/Toast';
import { userApi } from './src/features/settings/userApi';
import { useAppSelector } from './src/hooks/redux';
import { navigationRef } from './src/navigation/navigationRef';
import { RootNavigator } from './src/navigation/RootNavigator';
import { appLock } from './src/services/appLock';
import {
  isPushEnabled,
  listenForForegroundMessages,
  listenForTokenRefresh,
} from './src/services/pushNotifications';
import {
  handleNotificationEvent,
  restoreQuickAddIfEnabled,
} from './src/services/quickAddNotification';
import { listenForTransactionSms, restoreSmsAutoDetectIfEnabled } from './src/services/smsListener';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { formatCurrency } from './src/utils/format';

/** Status bar icon color follows theme: dark icons on the light page, light icons on the dark page. */
function StatusBarBridge() {
  const { theme } = useTheme();
  return <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />;
}

/**
 * Status bar background always matches the page background, on every screen,
 * in both themes. iOS ignores `StatusBar`'s `backgroundColor` (Android-only),
 * so the color comes from an actual overlay view sized to the safe-area top
 * inset. It's rendered last — after the navigator — so it paints above every
 * screen/modal; screens start their own content below the inset, so this
 * never covers real content.
 */
function StatusBarUnderlay() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[styles.statusBarUnderlay, { height: insets.top, backgroundColor: theme.colors.bgPage }]}
    />
  );
}

/**
 * Blocks the UI behind the PIN/biometric lock screen when app lock is on —
 * but only for an already-authenticated session. The lock flag persists in
 * MMKV independently of login state, so without this check, logging out
 * would leave a stale lock in front of the Login screen: PIN first, then
 * still having to log in. The lock only ever gates access to a session
 * that's already signed in.
 */
function AppLockGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [locked, setLocked] = useState(() => isAuthenticated && appLock.isEnabled());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocked(false);
      return;
    }
    const sub = AppState.addEventListener('change', (next) => {
      // Relock whenever the app returns from background (standard finance-app behavior)
      if (appState.current === 'background' && next === 'active' && appLock.isEnabled()) {
        setLocked(true);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  return (
    <>
      {children}
      {locked ? <LockScreen onUnlock={() => setLocked(false)} /> : null}
    </>
  );
}

/** Restores the quick-add notification and keeps FCM wiring alive. */
function NotificationBridge() {
  useEffect(() => {
    restoreQuickAddIfEnabled();

    // Taps on notifications while the app is in the foreground
    const unsubscribeNotifee = notifee.onForegroundEvent(handleNotificationEvent);
    // Show FCM messages that arrive while the app is open
    const unsubscribeMessages = listenForForegroundMessages();
    // Keep the backend's device token fresh across FCM rotations
    const unsubscribeTokens = listenForTokenRefresh((token) => {
      if (isPushEnabled()) {
        store.dispatch(userApi.endpoints.registerFcmToken.initiate({ token }));
      }
    });

    return () => {
      unsubscribeNotifee();
      unsubscribeMessages();
      unsubscribeTokens();
    };
  }, []);
  return null;
}

/**
 * Restores the SMS listener on launch and, for each detected bank
 * transaction, asks the user before doing anything — auto-adding entries
 * silently would be surprising and error-prone (regex parsing isn't
 * perfect). Confirming opens the Add form pre-filled so the user still
 * picks a category/source and can edit anything before saving.
 */
function SmsAutoDetectBridge() {
  const confirm = useConfirm();

  useEffect(() => {
    restoreSmsAutoDetectIfEnabled();

    const unsubscribe = listenForTransactionSms(async (txn) => {
      const ok = await confirm({
        title: txn.type === 'expense' ? 'Add this expense?' : 'Add this income?',
        message: `${formatCurrency(txn.amount)} — ${txn.title} (${txn.bank})`,
        confirmText: 'Add',
        cancelText: 'Ignore',
      });
      if (!ok || !navigationRef.isReady()) return;

      const prefill = { title: txn.title, amount: txn.amount, paymentMethod: txn.paymentMethod, date: txn.date };
      if (txn.type === 'expense') {
        navigationRef.navigate('ExpenseForm', { prefill });
      } else {
        navigationRef.navigate('IncomeForm', { prefill });
      }
    });

    return unsubscribe;
  }, [confirm]);

  return null;
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <Provider store={store}>
          <SafeAreaProvider>
            <ThemeProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <StatusBarBridge />
                  <NotificationBridge />
                  <SmsAutoDetectBridge />
                  <AppLockGate>
                    <RootNavigator />
                  </AppLockGate>
                  <StatusBarUnderlay />
                </ConfirmProvider>
              </ToastProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </Provider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusBarUnderlay: { position: 'absolute', top: 0, left: 0, right: 0 },
});

export default App;
