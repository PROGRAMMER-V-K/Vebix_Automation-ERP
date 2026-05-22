/**
 * Google Sign-In for Expo — ID token flow compatible with Firebase Auth.
 * Uses Expo auth proxy redirect URI when running in Expo Go.
 */
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  getGoogleAndroidClientId,
  getGoogleIosClientId,
  getGoogleWebClientId,
  signInWithGoogleToken,
  signInWithGoogleWeb,
} from '@/lib/google-sign-in';

WebBrowser.maybeCompleteAuthSession();

function extractIdToken(params: Record<string, string> | undefined): string | undefined {
  return params?.id_token;
}

/** Redirect URI that works in Expo Go (proxy) and standalone builds (erp:// scheme). */
function getGoogleRedirectUri(): string {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    return makeRedirectUri();
  }

  return makeRedirectUri({
    scheme: 'erp',
    path: 'oauth',
  });
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webClientId = getGoogleWebClientId();
  const iosClientId = getGoogleIosClientId() ?? webClientId;
  const androidClientId = getGoogleAndroidClientId() ?? webClientId;
  const redirectUri = getGoogleRedirectUri();
  const isExpoGo = Constants.appOwnership === 'expo';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId,
      iosClientId,
      androidClientId,
      selectAccount: true,
      redirectUri,
    },
  );

  const completeGoogleSignIn = useCallback(async (idToken: string) => {
    await signInWithGoogleToken(idToken);
  }, []);

  useEffect(() => {
    if (!response || response.type !== 'success') return;

    const idToken = extractIdToken(response.params);
    if (!idToken) {
      setError('Google did not return a sign-in token. Try again.');
      return;
    }

    setLoading(true);
    setError(null);
    completeGoogleSignIn(idToken)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      })
      .finally(() => setLoading(false));
  }, [response, completeGoogleSignIn]);

  const signInWithGoogle = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!webClientId) {
      return {
        ok: false,
        message: 'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.',
      };
    }

    if (!request) {
      return { ok: false, message: 'Google sign-in is still loading. Try again.' };
    }

    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        await signInWithGoogleWeb();
        return { ok: true };
      }

      const result = await promptAsync({
        showInRecents: true,
        preferEphemeralSession: false,
      });

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { ok: false, message: 'Sign in cancelled.' };
      }

      if (result.type === 'error') {
        const msg =
          result.error?.message ??
          result.params?.error_description ??
          'Google sign-in failed.';
        setError(msg);
        return { ok: false, message: msg };
      }

      if (result.type !== 'success') {
        return { ok: false, message: error ?? 'Google sign-in failed.' };
      }

      const idToken = extractIdToken(result.params);
      if (!idToken) {
        const hint = isExpoGo
          ? `Add this redirect URI in Google Cloud Console → Credentials → Web client → Authorized redirect URIs:\n${redirectUri}`
          : 'Add erp://oauth to your Google OAuth redirect URIs.';
        return { ok: false, message: `No token from Google.\n\n${hint}` };
      }

      await completeGoogleSignIn(idToken);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(message);
      return { ok: false, message };
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    loading: loading || !request,
    ready: Boolean(request),
    error,
    redirectUri,
    isExpoGo,
  };
}
