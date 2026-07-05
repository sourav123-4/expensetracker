import ReactNativeBiometrics from 'react-native-biometrics';
import { storage } from '../storage/mmkv';
import { sha256 } from '../utils/sha256';

/**
 * App lock: 4-digit PIN (hashed with a per-device salt) with optional
 * biometric (Face ID / Touch ID / fingerprint) unlock on top.
 */
const KEYS = {
  enabled: 'security.lockEnabled',
  pinHash: 'security.pinHash',
  salt: 'security.pinSalt',
  biometric: 'security.biometricEnabled',
} as const;

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

function getSalt(): string {
  let salt = storage.getString(KEYS.salt);
  if (!salt) {
    salt = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.set(KEYS.salt, salt);
  }
  return salt;
}

export const appLock = {
  isEnabled: (): boolean => storage.getBoolean(KEYS.enabled) === true,
  isBiometricEnabled: (): boolean => storage.getBoolean(KEYS.biometric) === true,

  setPin(pin: string): void {
    storage.set(KEYS.pinHash, sha256(`${getSalt()}:${pin}`));
    storage.set(KEYS.enabled, true);
  },

  verifyPin(pin: string): boolean {
    const stored = storage.getString(KEYS.pinHash);
    return stored !== undefined && stored === sha256(`${getSalt()}:${pin}`);
  },

  disable(): void {
    storage.remove(KEYS.enabled);
    storage.remove(KEYS.pinHash);
    storage.remove(KEYS.biometric);
  },

  setBiometricEnabled(enabled: boolean): void {
    storage.set(KEYS.biometric, enabled);
  },

  /** Face ID / Touch ID / fingerprint availability on this device. */
  async biometricAvailability(): Promise<{ available: boolean; label: string }> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      const label =
        biometryType === 'FaceID'
          ? 'Face ID'
          : biometryType === 'TouchID'
            ? 'Touch ID'
            : 'Fingerprint';
      return { available, label };
    } catch {
      return { available: false, label: 'Biometrics' };
    }
  },

  async promptBiometric(): Promise<boolean> {
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Unlock ExpenseFlow',
        cancelButtonText: 'Use PIN',
      });
      return success;
    } catch {
      return false;
    }
  },
};
