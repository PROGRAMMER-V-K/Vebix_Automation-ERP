/**
 * Firebase Auth for web — browser persistence (local vs session).
 * Loaded automatically on web via platform-specific file resolution.
 */
import {
  Auth,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from '@firebase/auth';

import { getFirebaseApp } from '@/lib/firebase';

export { getRememberMe, setRememberMe } from '@/lib/firebase-auth.shared';

let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export async function applyAuthPersistence(rememberMe: boolean): Promise<void> {
  const authInstance = getFirebaseAuth();
  await setPersistence(
    authInstance,
    rememberMe ? browserLocalPersistence : browserSessionPersistence,
  );
}
