import { createMMKV, MMKV } from 'react-native-mmkv';

/**
 * App-wide MMKV instance. Tokens and settings live here; it is synchronous,
 * encrypted-at-rest by the OS sandbox, and survives app restarts.
 */
export const storage: MMKV = createMMKV({ id: 'expenseflow' });

export const StorageKeys = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
  themePreference: 'settings.theme', // 'system' | 'light' | 'dark'
  currency: 'settings.currency', // ISO code, drives the symbol in formatCurrency
  onboardingDone: 'onboarding.done',
  quickAddEnabled: 'notifications.quickAdd',
  pushEnabled: 'notifications.push',
  smsAutoDetectEnabled: 'sms.autoDetect',
} as const;

export const tokenStorage = {
  getAccessToken: (): string | undefined => storage.getString(StorageKeys.accessToken),
  getRefreshToken: (): string | undefined => storage.getString(StorageKeys.refreshToken),
  setTokens(accessToken: string, refreshToken: string): void {
    storage.set(StorageKeys.accessToken, accessToken);
    storage.set(StorageKeys.refreshToken, refreshToken);
  },
  clear(): void {
    storage.remove(StorageKeys.accessToken);
    storage.remove(StorageKeys.refreshToken);
    storage.remove(StorageKeys.user);
  },
};
