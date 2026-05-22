/**
 * Global authentication state via Firebase Auth.
 * Provides sign-in, sign-up, logout, and onAuthStateChanged for the whole app.
 */
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { formatAuthError } from '@/lib/auth-errors';
import { applyAuthPersistence, getFirebaseAuth, getRememberMe, setRememberMe } from '@/lib/firebase-auth';
import { isFirebaseConfigured } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  initError: string | null;
  rememberMe: boolean;
  setRememberMePreference: (value: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMeState] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setInitError('Firebase is not configured. Check your .env file.');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        const storedRemember = await getRememberMe();
        setRememberMeState(storedRemember);
        await applyAuthPersistence(storedRemember);

        const auth = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      } catch (err) {
        setInitError(formatAuthError(err));
        setLoading(false);
      }
    }

    init();

    return () => unsubscribe?.();
  }, []);

  const setRememberMePreference = useCallback(async (value: boolean) => {
    setRememberMeState(value);
    await setRememberMe(value);
    await applyAuthPersistence(value);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const auth = getFirebaseAuth();
        await signInWithEmailAndPassword(auth, email.trim(), password);
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, message: formatAuthError(err) };
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const auth = getFirebaseAuth();
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, message: formatAuthError(err) };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      initError,
      rememberMe,
      setRememberMePreference,
      signInWithEmail,
      signUpWithEmail,
      logout,
    }),
    [user, loading, initError, rememberMe, setRememberMePreference, signInWithEmail, signUpWithEmail, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useAuthUser() {
  const { user } = useAuth();
  return {
    id: user?.uid ?? '',
    name: user?.displayName ?? user?.email?.split('@')[0] ?? 'User',
    email: user?.email ?? '',
    photoUrl: user?.photoURL ?? undefined,
  };
}
