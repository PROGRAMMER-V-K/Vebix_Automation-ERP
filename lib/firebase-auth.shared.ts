/** Shared helpers for the "Keep me signed in" preference (AsyncStorage). */
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_ME_KEY = '@vebix/remember-me';

export async function getRememberMe(): Promise<boolean> {
  const value = await AsyncStorage.getItem(REMEMBER_ME_KEY);
  return value !== 'false';
}

export async function setRememberMe(remember: boolean): Promise<void> {
  await AsyncStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
}
