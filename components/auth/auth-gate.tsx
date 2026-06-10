/**
 * Redirects unauthenticated users to /login and signed-in users away from auth screens.
 */
import { Href, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { HorizonColors } from '@/constants/horizon';
import { useAuth } from '@/contexts/auth-context';

const LOGIN_PATH = '/login' as Href;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDashboardGroup = segments[0] === '(dashboard)';


    if (!user && !inAuthGroup) {
      router.replace(LOGIN_PATH);
    } else if (user && !inDashboardGroup) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

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
