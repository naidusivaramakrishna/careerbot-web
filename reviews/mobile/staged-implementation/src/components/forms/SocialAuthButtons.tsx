// SocialAuthButtons — Google + LinkedIn + Apple (iOS only).
//
// REWRITE of POC src/components/SocialAuthButtons.js to:
//   1. Add Apple button per OAuth design Option 2.
//   2. Hide Apple button on Android per OAuth design §2.
//   3. Use Apple's native button styling (AppleAuthenticationButton) on iOS,
//      not a custom Pressable, to satisfy App Store Guideline 4.8.
//
// Reference: docs/design/2026-06-03-oauth-providers.md.

import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { authStyles } from '@/features/auth/styles';
import { isAppleSignInAvailable } from '@/features/auth/oauth/apple';

type ProviderKey = 'google' | 'linkedin' | 'apple';

interface SocialAuthButtonsProps {
  disabled?: boolean;
  loadingProvider?: ProviderKey | null;
  onPress: (provider: ProviderKey) => void;
}

const browserProviders = [
  {
    color: '#4285f4',
    icon: 'logo-google' as const,
    key: 'google' as const,
    label: 'Google',
  },
  {
    color: '#0a66c2',
    icon: 'logo-linkedin' as const,
    key: 'linkedin' as const,
    label: 'LinkedIn',
  },
];

export default function SocialAuthButtons({
  disabled,
  loadingProvider,
  onPress,
}: SocialAuthButtonsProps) {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  return (
    <View style={authStyles.socialSection}>
      {/* Apple — iOS native button, blessed by App Store guideline 4.8.
          Rendered ABOVE Google/LinkedIn (Apple HIG: first or equal prominence). */}
      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          cornerRadius={10}
          onPress={() => onPress('apple')}
          style={{ height: 48, width: '100%' }}
        />
      ) : null}

      <View style={authStyles.socialButtonGrid}>
        {browserProviders.map((provider) => {
          const isLoading = loadingProvider === provider.key;
          const isDisabled = disabled || Boolean(loadingProvider);

          return (
            <Pressable
              accessibilityRole="button"
              disabled={isDisabled}
              key={provider.key}
              onPress={() => onPress(provider.key)}
              style={({ pressed }) => [
                authStyles.socialButton,
                pressed && authStyles.buttonPressed,
                isDisabled && !isLoading && authStyles.buttonDisabled,
              ]}
            >
              <Ionicons color={provider.color} name={provider.icon} size={20} />
              <Text style={authStyles.socialButtonText}>
                {isLoading ? 'Opening...' : provider.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={authStyles.authDivider}>
        <View style={authStyles.authDividerLine} />
        <Text style={authStyles.authDividerText}>Or continue with email</Text>
        <View style={authStyles.authDividerLine} />
      </View>
    </View>
  );
}
