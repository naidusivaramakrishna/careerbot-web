// Sign-up screen — same providers + email/password/name + terms acceptance.

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
import { useSignUp } from '@/features/auth/signupApi';
import {
  PASSWORD_REQUIREMENT_TEXT,
  isStrongPassword,
  isValidEmail,
} from '@/utils/validators';

type ProviderKey = 'google' | 'linkedin' | 'apple';

interface FormErrors {
  email?: string;
  password?: string;
  username?: string;
  full_name?: string;
  general?: string;
}

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingProvider, setLoadingProvider] = useState<ProviderKey | null>(null);

  const signUpMutation = useSignUp();

  function validate(): boolean {
    const next: FormErrors = {};
    if (!fullName.trim()) next.full_name = 'Full name is required.';
    if (!username.trim()) next.username = 'Username is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!password.trim()) next.password = 'Password is required.';
    else if (!isStrongPassword(password)) next.password = PASSWORD_REQUIREMENT_TEXT;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    setErrors({});
    if (!validate()) return;
    try {
      await signUpMutation.mutateAsync({
        email,
        password,
        username,
        full_name: fullName,
      });
      router.replace('/(tabs)/home');
    } catch (error) {
      setErrors({ general: getApiErrorMessage(error, 'Sign up failed.') });
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
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={authStyles.panel}>
        <Text style={authStyles.title}>Create your account</Text>
        <Text style={authStyles.subtitle}>Land your next role faster with CareerBot</Text>

        <SocialAuthButtons
          disabled={signUpMutation.isPending}
          loadingProvider={loadingProvider}
          onPress={onSocialPress}
        />

        {errors.general ? <Text style={authStyles.formErrorText}>{errors.general}</Text> : null}

        <View style={authStyles.form}>
          <AuthInput
            autoCapitalize="words"
            autoComplete="name"
            error={errors.full_name}
            label="Full name"
            onChangeText={setFullName}
            placeholder="Your full name"
            textContentType="name"
            value={fullName}
          />
          <AuthInput
            autoCapitalize="none"
            autoComplete="username"
            error={errors.username}
            label="Username"
            onChangeText={setUsername}
            placeholder="Pick a username"
            textContentType="username"
            value={username}
          />
          <AuthInput
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            textContentType="emailAddress"
            value={email}
          />
          <AuthInput
            autoCapitalize="none"
            autoComplete="password-new"
            error={errors.password}
            label="Password"
            onChangeText={setPassword}
            placeholder="At least 8 chars, letters + numbers"
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={signUpMutation.isPending}
          onPress={onSubmit}
          style={({ pressed }) => [
            authStyles.primaryButton,
            pressed && authStyles.buttonPressed,
            signUpMutation.isPending && authStyles.buttonDisabled,
          ]}
        >
          <Text style={authStyles.primaryButtonText}>
            {signUpMutation.isPending ? 'Creating account...' : 'Create account'}
          </Text>
        </Pressable>

        <View style={authStyles.footerRow}>
          <Text style={authStyles.footerText}>Already have an account?</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace('/(auth)/signin')}
          >
            <Text style={authStyles.linkText}>Sign in</Text>
          </Pressable>
        </View>

        <AuthAssurance />
      </View>
    </ScrollView>
  );
}
