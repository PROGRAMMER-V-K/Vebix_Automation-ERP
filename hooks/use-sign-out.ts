/** Confirms sign-out then calls Firebase Auth signOut. */
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export function useSignOut() {
  const { logout } = useAuth();

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return { signOut: confirmSignOut, logout };
}
