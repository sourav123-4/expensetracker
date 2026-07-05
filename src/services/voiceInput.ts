import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

/**
 * Speech-to-text for Quick Add, via a small native module wrapping Android's
 * built-in SpeechRecognizer (see VoiceInputModule.kt) — no third-party
 * package, no network dependency beyond whatever the OS's own recognizer
 * uses. Android only — iOS would need separate native code this app doesn't
 * have yet.
 */
export const isVoiceInputSupported = Platform.OS === 'android';

async function requestMicPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export interface VoiceInputCallbacks {
  /** Fires repeatedly with the recognizer's best-guess-so-far, while still listening. */
  onPartialResult?: (text: string) => void;
  /** Fires once with the final transcript, right before `onEnd`. */
  onResult?: (text: string) => void;
  onError?: (message: string) => void;
  /** Listening has stopped (success, error, or silence timeout) — always fires eventually. */
  onEnd?: () => void;
}

/**
 * Requests mic permission and starts listening. Returns a cleanup function
 * that removes the JS-side event subscriptions (call it once `onEnd` fires,
 * or on unmount) — it does not itself stop the recognizer; use
 * `stopVoiceInput()` for that.
 */
export async function startVoiceInput(callbacks: VoiceInputCallbacks): Promise<() => void> {
  if (!isVoiceInputSupported || !NativeModules.VoiceInput) {
    callbacks.onError?.('Voice input is only available on Android');
    callbacks.onEnd?.();
    return () => {};
  }

  const granted = await requestMicPermission();
  if (!granted) {
    callbacks.onError?.('Microphone permission denied');
    callbacks.onEnd?.();
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.VoiceInput);
  const subscriptions = [
    emitter.addListener('voicePartialResult', (e: { text: string }) => callbacks.onPartialResult?.(e.text)),
    emitter.addListener('voiceResult', (e: { text: string }) => callbacks.onResult?.(e.text)),
    emitter.addListener('voiceError', (e: { message: string }) => callbacks.onError?.(e.message)),
    emitter.addListener('voiceEnd', () => callbacks.onEnd?.()),
  ];
  NativeModules.VoiceInput.startListening();

  return () => subscriptions.forEach((s) => s.remove());
}

export function stopVoiceInput(): void {
  if (isVoiceInputSupported) NativeModules.VoiceInput?.stopListening();
}
