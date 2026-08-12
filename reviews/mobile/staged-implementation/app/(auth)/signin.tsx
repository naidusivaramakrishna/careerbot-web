// Sign-in screen — email/password + Google + LinkedIn + Apple.
// TS port of POC src/screens/signin/SignInScreen.js as an Expo Router screen.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import AuthAssurance from '@/components/forms/AuthAssurance';
import AuthInput from '@/components/forms/AuthInput';
import SocialAuthButtons from '@/components/forms/SocialAuthButtons';
import { getApiErrorMessage } from '@/api/client/errors';
import { authStyles } from '@/features/auth/styles';
import { signInWithApple } from '@/features/auth/oauth/apple';
import { signInWithGoogle } from '@/features/auth/oauth/google';
import { signInWithLinkedIn } from '@/features/auth/oauth/linkedin';
import { useSignIn } from '@/features/auth/signinApi';
import { isValidEmail } from '@/utils/validators';

type ProviderKey = 'google' | 'linkedin' | 'apple';

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingProvider, setLoadingProvider] = useState<ProviderKey | null>(null);

  const signInMutation = useSignIn();

  function validate(): boolean {
    const next: FormErrors = {};
    const trimmed = identifier.trim();

    if (!trimmed) next.identifier = 'Email is required.';
    else if (!isValidEmail(trimmed)) next.identifier = 'Enter a valid email address.';

    if (!password.trim()) next.password = 'Password is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    setErrors({});
    if (!validate()) return;
    try {
      await signInMutation.mutateAsync({ email: identifier, password });
      router.replace('/(tabs)/home');
    } catch (error) {
      setErrors({
        general: getApiErrorMessage(error, 'Sign in failed.', { credentials: true }),
      });
    }
  }

  async function onSocialPress(provider: ProviderKey) {
    setLoadingProvider(provider);
    setErrors({});
    try {
      const fn =
        provider === 'google'
          ? signInWithGoogle
          : provider === 'linkedin'
            ? signInWithLinkedIn
            : signInWithApple;
      const token = await fn();
      if (token) router.replace('/(tabs)/home');
      // null = user cancelled or failure handled by the oauth module's PII-safe log
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={authStyles.panel}>
        <Text style={authStyles.title}>Welcome back</Text>
        <Text style={authStyles.subtitle}>Sign in to continue with CareerBot</Text>

        <SocialAuthButtons
          disabled={signInMutation.isPending}
          loadingProvider={loadingProvider}
          onPress={onSocialPress}
        />

        {errors.general ? <Text style={authStyles.formErrorText}>{errors.general}</Text> : null}

        <View style={authStyles.form}>
          <AuthInput
            autoCapitalize="none"
            autoComplete="email"
            error={errors.identifier}
            keyboardType="email-address"
            label="Email"
            onChangeText={setIdentifier}
            placeholder="you@example.com"
            returnKeyType="next"
            textContentType="emailAddress"
            value={identifier}
          />
          <AuthInput
            autoCapitalize="none"
            autoComplete="password"
            error={errors.password}
            label="Password"
            onChangeText={setPassword}
            placeholder="Enter your password"
            returnKeyType="done"
            secureTextEntry
            textContentType="password"
            value={password}
          />

          <View style={authStyles.signInMetaRow}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/(auth)/forgot')}
            >
              <Text style={authStyles.linkText}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={signInMutation.isPending}
          onPress={onSubmit}
          style={({ pressed }) => [
            authStyles.primaryButton,
            pressed && authStyles.buttonPressed,
            signInMutation.isPending && authStyles.buttonDisabled,
          ]}
        >
          <Text style={authStyles.primaryButtonText}>
            {signInMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Text>
        </Pressable>

        <View style={authStyles.footerRow}>
          <Text style={authStyles.footerText}>New to CareerBot?</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace('/(auth)/signup')}
          >
            <Text style={authStyles.linkText}>Create an account</Text>
          </Pressable>
        </View>

        <AuthAssurance />
      </View>
    </ScrollView>
  );
}
