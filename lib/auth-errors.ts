/**
 * Maps Firebase Auth error codes to user-friendly messages for alerts and UI.
 */
export function formatAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = error instanceof Error ? error.message : 'Sign in failed.';

  const messages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Sign in was cancelled.',
  };

  if (code && messages[code]) return messages[code];
  if (message.includes('network')) return messages['auth/network-request-failed'];
  return message;
}
