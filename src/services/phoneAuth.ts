import { getAuth, getIdToken, signInWithPhoneNumber } from '@react-native-firebase/auth';

/**
 * Firebase Phone Auth (SMS OTP). Like FCM push, this depends on the native
 * Firebase config files (google-services.json / GoogleService-Info.plist)
 * being present AND the "Phone" sign-in provider being enabled in Firebase
 * Console — until then, every call fails soft with a clear reason.
 */

// Derived from the modular function's own return type rather than the
// package's separate `FirebaseAuthTypes` namespace — the two don't quite
// line up (a mismatch in the library's own type definitions), so cross
// referencing them fails to compile.
export type PhoneConfirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

export interface SendOtpResult {
  ok: boolean;
  confirmation?: PhoneConfirmation;
  reason?: string;
}


let devSettingsApplied = false;

/**
 * In dev builds only, skip Play Integrity/reCAPTCHA app verification —
 * that whole chain is what makes a real phone number take minutes when
 * Play Integrity isn't fully provisioned. Firebase renders a mock
 * verifier instead, but only actually resolves fast for a phone number
 * you've whitelisted under Firebase Console → Authentication → Sign-in
 * method → Phone → "Phone numbers for testing" (see FIREBASE-SETUP.md
 * Part C3) — a real, non-whitelisted number will still be rejected, just
 * quickly instead of after a multi-minute stall.
 */
function applyDevAuthSettings(): void {
  if (devSettingsApplied || !__DEV__) return;
  getAuth().settings.appVerificationDisabledForTesting = true;
  devSettingsApplied = true;
}

export async function sendPhoneOtp(phoneNumber: string): Promise<SendOtpResult> {
  applyDevAuthSettings();

  try {
    const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
    return { ok: true, confirmation };
  } catch (err) {
    return { ok: false, reason: mapError(err) };
  }
}


export interface ConfirmOtpResult {
  ok: boolean;
  idToken?: string;
  reason?: string;
}

export async function confirmPhoneOtp(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<ConfirmOtpResult> {
  try {
    const credential = await confirmation.confirm(code);
    const idToken = credential?.user ? await getIdToken(credential.user) : undefined;
    if (!idToken) return { ok: false, reason: 'Could not complete sign-in' };
    return { ok: true, idToken };
  } catch (err) {
    return { ok: false, reason: mapError(err) };
  }
}

function mapError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('invalid-phone-number')) return 'Enter a valid phone number with country code';
  if (code.includes('invalid-verification-code')) return 'Incorrect code — please try again';
  if (code.includes('too-many-requests')) return 'Too many attempts — try again later';
  if (code.includes('quota-exceeded')) return 'SMS limit reached — try again later';
  // Firebase reports this when the Phone provider isn't enabled yet in
  // Firebase Console (Authentication → Sign-in method) — surface it plainly
  // rather than the generic fallback, since it's the single most likely
  // cause during setup and otherwise looks identical to "not configured".
  if (code.includes('operation-not-allowed')) {
    return 'Phone sign-in is disabled for this project — enable it in Firebase Console';
  }
  return 'Phone sign-in is not set up yet, or something went wrong';
}
