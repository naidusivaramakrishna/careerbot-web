import { ExpoConfig, ConfigContext } from 'expo/config';

// Brand: "CareerBOT" — finalize before store submission.
// Bundle/package: com.careerbot.mobile — change if brand changes.
// Domains: careerbot.com (prod) + staging.careerbot.com — confirm with CEO.

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CareerBOT',
  slug: 'careerbot-mobile',
  scheme: 'careerbot',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.careerbot.mobile',
    buildNumber: '1',
    associatedDomains: [
      'applinks:careerbot.com',
      'applinks:staging.careerbot.com',
    ],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.careerbot.mobile',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'https', host: 'careerbot.com', pathPrefix: '/m' },
          { scheme: 'https', host: 'staging.careerbot.com', pathPrefix: '/m' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-splash-screen',
    'expo-apple-authentication',
    // NOTE: expo-notifications deliberately OMITTED from v1 per Codex doc-set
    // frame challenge. Push ships in v1.1 alongside backend A6 endpoint.
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
    eas: {
      projectId: 'TBD-after-eas-init',
    },
  },
});
