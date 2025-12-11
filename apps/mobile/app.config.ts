import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sleek Coach',
  slug: 'sleek-coach',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#6750A4',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sleekcoach.app',
  },
  android: {
    package: 'com.sleekcoach.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#6750A4',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-font', 'expo-dev-client'],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    eas: {
      projectId: 'sleek-coach',
    },
  },
});
