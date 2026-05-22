/**
 * Metro bundler configuration for Expo.
 * Resolves @firebase/auth to the React Native build on iOS/Android for correct persistence.
 */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

// Use Firebase Auth React Native build on iOS/Android (fixes persistence + sign-in)
const firebaseAuthRn = path.resolve(
  __dirname,
  'node_modules/@firebase/auth/dist/rn/index.js',
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === '@firebase/auth') {
    return { filePath: firebaseAuthRn, type: 'sourceFile' };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
