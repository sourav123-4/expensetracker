import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { StorageKeys, storage } from '../storage/mmkv';

/**
 * FCM push registration. All Firebase calls are guarded: until the Firebase
 * config files (google-services.json / GoogleService-Info.plist) are added to
 * the native projects — see FIREBASE-SETUP.md — every function fails soft and
 * reports why, so the rest of the app is unaffected.
 */
const ALERT_CHANNEL_ID = 'alerts';

export const isPushEnabled = (): boolean => storage.getBoolean(StorageKeys.pushEnabled) === true;

export interface PushRegistration {
  ok: boolean;
  token?: string;
  reason?: string;
}

export async function registerForPush(): Promise<PushRegistration> {
  const permission = await notifee.requestPermission();
  if (permission.authorizationStatus === AuthorizationStatus.DENIED) {
    return { ok: false, reason: 'Notification permission denied' };
  }

  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    storage.set(StorageKeys.pushEnabled, true);
    return { ok: true, token };
  } catch {
    return {
      ok: false,
      reason:
        'Firebase is not configured yet — add the Firebase config files (see FIREBASE-SETUP.md)',
    };
  }
}

export function disablePush(): void {
  storage.remove(StorageKeys.pushEnabled);
}

/** Shows foreground FCM messages as local notifications (FCM only auto-displays in background). */
export function listenForForegroundMessages(): () => void {
  try {
    const messaging = getMessaging();
    return onMessage(messaging, async (message: FirebaseMessagingTypes.RemoteMessage) => {
      if (!message.notification) return;
      await notifee.createChannel({
        id: ALERT_CHANNEL_ID,
        name: 'Alerts',
        importance: AndroidImportance.HIGH,
      });
      await notifee.displayNotification({
        title: message.notification.title,
        body: message.notification.body,
        data: message.data,
        android: { channelId: ALERT_CHANNEL_ID, smallIcon: 'ic_launcher', pressAction: { id: 'default' } },
      });
    });
  } catch {
    return () => {};
  }
}

/** Keeps the backend token registration fresh across FCM token rotations. */
export function listenForTokenRefresh(onNewToken: (token: string) => void): () => void {
  try {
    return onTokenRefresh(getMessaging(), onNewToken);
  } catch {
    return () => {};
  }
}
