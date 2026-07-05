import { Linking, Platform } from 'react-native';
import notifee, { AndroidImportance, AuthorizationStatus, EventType, Event } from '@notifee/react-native';
import { StorageKeys, storage } from '../storage/mmkv';

/**
 * Persistent "quick add" notification (Android): an ongoing notification that
 * lives in the notification panel with Add-expense / Add-income actions that
 * deep-link straight into the forms.
 *
 * iOS has no equivalent — the OS forbids persistent notifications — so these
 * functions no-op there (the Settings toggle explains this).
 */
const CHANNEL_ID = 'quick-add';
const NOTIFICATION_ID = 'quick-add';

const ACTION_LINKS: Record<string, string> = {
  'add-expense': 'expenseflow://expenses/form',
  'add-income': 'expenseflow://income/form',
  default: 'expenseflow://dashboard',
};

export const isQuickAddSupported = Platform.OS === 'android';

export const isQuickAddEnabled = (): boolean =>
  storage.getBoolean(StorageKeys.quickAddEnabled) === true;

export async function enableQuickAdd(): Promise<boolean> {
  if (!isQuickAddSupported) return false;

  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) return false;

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Quick add',
    importance: AndroidImportance.LOW, // silent — it's a utility, not an alert
  });

  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: 'ExpenseFlow quick add',
    body: 'Log an expense or income in one tap',
    android: {
      channelId: CHANNEL_ID,
      ongoing: true,
      autoCancel: false,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: '➕ Expense', pressAction: { id: 'add-expense', launchActivity: 'default' } },
        { title: '💰 Income', pressAction: { id: 'add-income', launchActivity: 'default' } },
      ],
    },
  });

  storage.set(StorageKeys.quickAddEnabled, true);
  return true;
}

export async function disableQuickAdd(): Promise<void> {
  storage.remove(StorageKeys.quickAddEnabled);
  if (isQuickAddSupported) await notifee.cancelNotification(NOTIFICATION_ID);
}

/** Re-posts the notification on app launch (ongoing notifications don't survive reboots). */
export async function restoreQuickAddIfEnabled(): Promise<void> {
  if (isQuickAddSupported && isQuickAddEnabled()) await enableQuickAdd();
}

/** Shared handler for notification taps — routes actions to their deep links. */
export function handleNotificationEvent({ type, detail }: Event): void {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;
  const actionId =
    type === EventType.ACTION_PRESS ? detail.pressAction?.id : detail.notification?.data?.link
      ? String(detail.notification.data.link)
      : 'default';
  const link = ACTION_LINKS[actionId ?? 'default'] ?? ACTION_LINKS.default;
  Linking.openURL(link).catch(() => {});
}
