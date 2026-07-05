import { useState } from 'react';
import { useToast } from '../../components/Toast';
import { isGoogleSignInConfigured, signInWithGoogle } from '../../services/googleAuth';
import { useLoginWithGoogleMutation } from './authApi';

/** Drives the full Google sign-in flow: native picker → backend exchange → session start. */
export function useGoogleAuth() {
  const [loginWithGoogle] = useLoginWithGoogleMutation();
  const { showToast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isGoogleSignInConfigured()) {
      showToast('Google sign-in is not set up yet', 'error');
      return;
    }

    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        if (!result.cancelled) showToast(result.reason ?? 'Google sign-in failed', 'error');
        return;
      }
      await loginWithGoogle({ idToken: result.idToken! }).unwrap();
      // RootNavigator swaps to MainTabs automatically on isAuthenticated
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Something went wrong';
      showToast(message, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  return { handleGoogleSignIn, isSigningIn };
}
