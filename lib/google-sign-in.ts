/**
 * Google OAuth helpers — popup on web, ID token + credential on native (via expo-auth-session).
 */
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from '@firebase/auth';
import { Platform } from 'react-native';

import { getFirebaseAuth } from '@/lib/firebase-auth';

export function getGoogleWebClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
}

export function getGoogleIosClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
}

export function getGoogleAndroidClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleWebClientId());
}

export async function signInWithGoogleWeb(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signInWithGoogleToken(idToken: string): Promise<void> {
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

export async function signInWithGoogleNative(idToken: string): Promise<void> {
  await signInWithGoogleToken(idToken);
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; message: string };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isGoogleSignInConfigured()) {
    return {
      ok: false,
      message: 'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.',
    };
  }

  if (Platform.OS === 'web') {
    try {
      await signInWithGoogleWeb();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Google sign-in failed.',
      };
    }
  }

  return {
    ok: false,
    message: 'Use the Google button on this screen to sign in.',
  };
}
