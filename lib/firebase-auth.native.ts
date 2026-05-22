/**
 * Firebase Auth for iOS/Android — persists login with AsyncStorage.
 * Metro resolves @firebase/auth to the RN bundle (see metro.config.js).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Auth } from '@firebase/auth';

import { getFirebaseApp } from '@/lib/firebase';

export { getRememberMe, setRememberMe } from '@/lib/firebase-auth.shared';

type FirebaseRnAuth = {
  getAuth: (app: ReturnType<typeof getFirebaseApp>) => Auth;
  initializeAuth: (
    app: ReturnType<typeof getFirebaseApp>,
    deps: { persistence: unknown },
  ) => Auth;
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
};

let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const app = getFirebaseApp();
  const firebaseAuth = require('@firebase/auth') as FirebaseRnAuth;

  if (typeof firebaseAuth.getReactNativePersistence !== 'function') {
    throw new Error(
      'Firebase Auth native module failed to load. Restart Metro with: npx expo start -c',
    );
  }

  try {
    auth = firebaseAuth.initializeAuth(app, {
      persistence: firebaseAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/already-initialized') {
      auth = firebaseAuth.getAuth(app);
    } else {
      throw e;
    }
  }

  return auth;
}

export async function applyAuthPersistence(_rememberMe: boolean): Promise<void> {
  // Native always persists via initializeAuth + AsyncStorage
}
