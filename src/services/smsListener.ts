import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { StorageKeys, storage } from '../storage/mmkv';
import { ParsedTransaction, parseTransactionSms } from './smsParser';

/**
 * SMS auto-detect (expense/income from bank transaction alerts). Android
 * only — iOS gives third-party apps no access to SMS at all, by design.
 * Reads happen entirely on-device; nothing about SMS content is ever sent
 * anywhere except the one transaction the user explicitly confirms adding.
 */
export const isSmsAutoDetectSupported = Platform.OS === 'android';

export const isSmsAutoDetectEnabled = (): boolean =>
  storage.getBoolean(StorageKeys.smsAutoDetectEnabled) === true;

async function requestSmsPermissions(): Promise<boolean> {
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
  ]);
  return (
    granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
    granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
  );
}

export async function enableSmsAutoDetect(): Promise<boolean> {
  if (!isSmsAutoDetectSupported) return false;
  const granted = await requestSmsPermissions();
  if (!granted) return false;
  NativeModules.SmsListener?.startListening();
  storage.set(StorageKeys.smsAutoDetectEnabled, true);
  return true;
}

export function disableSmsAutoDetect(): void {
  storage.remove(StorageKeys.smsAutoDetectEnabled);
  if (isSmsAutoDetectSupported) NativeModules.SmsListener?.stopListening();
}

/** The native receiver doesn't survive a process restart — re-arm it on launch if the user had it on. */
export function restoreSmsAutoDetectIfEnabled(): void {
  if (isSmsAutoDetectSupported && isSmsAutoDetectEnabled()) {
    NativeModules.SmsListener?.startListening();
  }
}

interface RawSmsEvent {
  sender: string;
  body: string;
  timestamp: number;
}

/** Subscribes to incoming SMS, invoking `onDetected` only for messages that parse as a bank transaction. */
export function listenForTransactionSms(onDetected: (txn: ParsedTransaction) => void): () => void {
  if (!isSmsAutoDetectSupported || !NativeModules.SmsListener) return () => {};

  const emitter = new NativeEventEmitter(NativeModules.SmsListener);
  const subscription = emitter.addListener('smsReceived', (event: RawSmsEvent) => {
    const parsed = parseTransactionSms(event.body);
    if (parsed) onDetected(parsed);
  });
  return () => subscription.remove();
}
