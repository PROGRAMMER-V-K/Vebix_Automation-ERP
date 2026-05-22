/**
 * Redirects unauthenticated users to /login and signed-in users away from auth screens.
 */
import { Href, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { useAuth } from '@/contexts/auth-context';

const LOGIN_PATH = '/login' as Href;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginScreen = pathname === '/login' || pathname.endsWith('/login');

  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginScreen) {
      router.replace(LOGIN_PATH);
    } else if (user && isLoginScreen) {
      router.replace('/');
    }
  }, [user, loading, isLoginScreen, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={HorizonColors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HorizonColors.background,
  },
});
