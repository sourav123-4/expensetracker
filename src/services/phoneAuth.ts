import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

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

export async function sendPhoneOtp(phoneNumber: string): Promise<SendOtpResult> {
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
    const idToken = await credential?.user.getIdToken();
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
  return 'Phone sign-in is not set up yet, or something went wrong';
}
