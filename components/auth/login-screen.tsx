/**
 * Login and sign-up UI — responsive split layout on desktop, full-width on mobile.
 * Supports email/password, Google Sign-In, and "Keep me signed in".
 */
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_BRAND } from '@/constants/horizon';
import { AuthColors } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';

function WaveDecoration() {
  return (
    <View style={styles.waveHeader}>
      <View style={[styles.wave, styles.waveCyan]} />
      <View style={[styles.wave, styles.wavePink]} />
    </View>
  );
}

function LoginForm({
  isSignUp,
  setIsSignUp,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMePreference,
  busy,
  googleError,
  initError,
  isExpoGo,
  redirectUri,
  onEmailAuth,
  onGoogleSignIn,
  compact,
}: {
  isSignUp: boolean;
  setIsSignUp: (v: boolean | ((prev: boolean) => boolean)) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean | ((prev: boolean) => boolean)) => void;
  rememberMe: boolean;
  setRememberMePreference: (v: boolean) => Promise<void>;
  busy: boolean;
  googleError: string | null;
  initError: string | null;
  isExpoGo: boolean;
  redirectUri: string;
  onEmailAuth: () => void;
  onGoogleSignIn: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.formInner, compact && styles.formInnerCompact]}>
      {initError ? (
        <View style={styles.initErrorBox}>
          <MaterialIcons name="error-outline" size={20} color="#DC2626" />
          <Text style={styles.initErrorText}>{initError}</Text>
        </View>
      ) : null}

      <Text style={styles.brand}>{APP_BRAND.name}</Text>
      <Text style={[styles.title, compact && styles.titleDesktop]}>
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </Text>
      <Text style={styles.subtitle}>
        {isSignUp
          ? 'Create your account to get started'
          : 'Please sign in to your account first'}
      </Text>

      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={AuthColors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        {email.includes('@') ? (
          <MaterialIcons name="check-circle" size={22} color={AuthColors.cyan} />
        ) : null}
      </View>

      <View style={[styles.field, styles.fieldPassword]}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={AuthColors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete={isSignUp ? 'new-password' : 'password'}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={22}
            color={AuthColors.pink}
          />
        </Pressable>
      </View>

      <View style={styles.rememberRow}>
        <View style={styles.rememberLeft}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMePreference}
            trackColor={{ false: AuthColors.border, true: AuthColors.pinkLight }}
            thumbColor={rememberMe ? AuthColors.pink : AuthColors.white}
          />
          <Text style={styles.rememberText}>Keep me signed in</Text>
        </View>
        {!isSignUp ? (
          <Pressable>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onEmailAuth}
        disabled={busy}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed, busy && styles.btnDisabled]}>
        {busy ? (
          <ActivityIndicator color={AuthColors.white} />
        ) : (
          <Text style={styles.primaryBtnText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        )}
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or sign in using</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        onPress={onGoogleSignIn}
        disabled={busy}
        style={({ pressed }) => [styles.googleBtn, pressed && styles.btnPressed, busy && styles.btnDisabled]}>
        <FontAwesome name="google" size={22} color={AuthColors.google} />
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      </Pressable>

      {googleError ? <Text style={styles.googleError}>{googleError}</Text> : null}

      {isExpoGo && Platform.OS !== 'web' ? (
        <Text style={styles.expoHint}>
          Using Expo Go? Add this redirect URI in Google Cloud Console (Web client):{'\n'}
          {redirectUri}
        </Text>
      ) : null}

      <Text style={styles.footerText}>
        {isSignUp ? 'Already have an account? ' : "Don't have an account yet? "}
        <Text style={styles.footerLink} onPress={() => setIsSignUp((v) => !v)}>
          {isSignUp ? 'Sign in' : 'Sign up'}
        </Text>
      </Text>
    </View>
  );
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { signInWithEmail, signUpWithEmail, rememberMe, setRememberMePreference, initError } =
    useAuth();
  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
    redirectUri,
    isExpoGo,
  } = useGoogleSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
      if (!result.ok) {
        Alert.alert(isSignUp ? 'Sign up' : 'Sign in', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    const result = await signInWithGoogle();
    if (!result.ok) Alert.alert('Google sign in', result.message);
  }

  const busy = loading || googleLoading;

  const formProps = {
    isSignUp,
    setIsSignUp,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMePreference,
    busy,
    googleError,
    initError,
    isExpoGo,
    redirectUri,
    onEmailAuth: handleEmailAuth,
    onGoogleSignIn: handleGoogleSignIn,
  };

  if (isDesktop) {
    return (
      <View style={[styles.desktopRoot, { minHeight: height }]}>
        <View style={styles.desktopLeft}>
          <WaveDecoration />
          <View style={styles.desktopBrandBlock}>
            <View style={styles.desktopLogoIcon}>
              <MaterialIcons name="business" size={36} color={AuthColors.white} />
            </View>
            <Text style={styles.desktopBrandTitle}>{APP_BRAND.name}</Text>
            <Text style={styles.desktopBrandTagline}>
              ERP for inventory, sales, finance, HR, and attendance — all in one place.
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.desktopRightScroll}
          contentContainerStyle={[
            styles.desktopRightContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.desktopCard}>
            <LoginForm {...formProps} compact />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <WaveDecoration />
        <View style={styles.content}>
          <LoginForm {...formProps} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AuthColors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: AuthColors.background,
  },
  desktopLeft: {
    flex: 1,
    maxWidth: 520,
    backgroundColor: AuthColors.cyanLight,
    overflow: 'hidden',
    position: 'relative',
  },
  desktopBrandBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingBottom: 48,
    zIndex: 1,
  },
  desktopLogoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: AuthColors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  desktopBrandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: AuthColors.text,
    marginBottom: 12,
  },
  desktopBrandTagline: {
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.textMuted,
    maxWidth: 360,
  },
  desktopRightScroll: {
    flex: 1,
    backgroundColor: AuthColors.background,
  },
  desktopRightContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  desktopCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: AuthColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AuthColors.border,
    paddingHorizontal: 36,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  waveHeader: {
    height: 140,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  wave: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  waveCyan: {
    backgroundColor: AuthColors.cyan,
    opacity: 0.15,
    top: -120,
    left: -80,
  },
  wavePink: {
    backgroundColor: AuthColors.pink,
    opacity: 0.12,
    top: -80,
    right: -40,
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  formInner: {},
  formInnerCompact: {
    paddingTop: 0,
  },
  initErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  initErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  expoHint: {
    fontSize: 11,
    color: AuthColors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
    backgroundColor: AuthColors.cyanLight,
    padding: 10,
    borderRadius: 8,
  },
  brand: {
    fontSize: 14,
    fontWeight: '600',
    color: AuthColors.cyan,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: AuthColors.text,
    marginBottom: 6,
  },
  titleDesktop: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 15,
    color: AuthColors.textMuted,
    marginBottom: 28,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: AuthColors.cyan,
    marginBottom: 20,
    paddingBottom: 8,
  },
  fieldPassword: {
    borderBottomColor: AuthColors.pink,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AuthColors.text,
    paddingVertical: 10,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
    flexWrap: 'wrap',
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 180,
  },
  rememberText: {
    fontSize: 14,
    color: AuthColors.text,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    color: AuthColors.pink,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: AuthColors.pink,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryBtnText: {
    color: AuthColors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.border,
  },
  dividerText: {
    fontSize: 13,
    color: AuthColors.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: AuthColors.border,
    borderRadius: 28,
    paddingVertical: 14,
    backgroundColor: AuthColors.white,
    marginBottom: 8,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: AuthColors.text,
  },
  googleError: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: AuthColors.textMuted,
    marginTop: 16,
  },
  footerLink: {
    color: AuthColors.pink,
    fontWeight: '600',
  },
});
