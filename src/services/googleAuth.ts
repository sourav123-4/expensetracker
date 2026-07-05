import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/config';

/**
 * Google Sign-In. Guarded on `GOOGLE_WEB_CLIENT_ID` — until it's set (from
 * Firebase Console → Authentication → Sign-in method → Google), every call
 * fails soft with a clear reason instead of throwing, matching the pattern
 * already used for FCM push registration.
 */
export const isGoogleSignInConfigured = (): boolean => GOOGLE_WEB_CLIENT_ID.length > 0;

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
  configured = true;
}

export interface GoogleSignInResult {
  ok: boolean;
  idToken?: string;
  /** True when the user closed the picker themselves — not a real error. */
  cancelled?: boolean;
  reason?: string;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isGoogleSignInConfigured()) {
    return { ok: false, reason: 'Google sign-in is not configured yet' };
  }

  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { ok: false, cancelled: true };
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      return { ok: false, reason: 'Google did not return a credential' };
    }
    return { ok: true, idToken };
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, cancelled: true };
      if (err.code === statusCodes.IN_PROGRESS) {
        return { ok: false, reason: 'A sign-in is already in progress' };
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, reason: 'Google Play Services is unavailable on this device' };
      }
    }
    return { ok: false, reason: 'Something went wrong — please try again' };
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!isGoogleSignInConfigured()) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // Best-effort — a stale Google session doesn't block app logout
  }
}
