// Forgot-password screen — request reset email.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import AuthInput from '@/components/forms/AuthInput';
import { getApiErrorMessage } from '@/api/client/errors';
import { authStyles } from '@/features/auth/styles';
import { useRequestPasswordReset } from '@/features/auth/passwordResetApi';
import { isValidEmail } from '@/utils/validators';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const requestMutation = useRequestPasswordReset();

  async function onSubmit() {
    setError(undefined);
    setSuccessMessage(undefined);

    if (!email.trim()) return setError('Email is required.');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');

    try {
      const result = await requestMutation.mutateAsync({ email });
      // Backend returns generic message regardless of whether email exists
      // (anti-enumeration). Show it as-is.
      setSuccessMessage(
        result.message ||
          'If this email is registered, you will receive a reset link shortly.',
      );
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not send reset email.'));
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={authStyles.panel}>
        <Text style={authStyles.title}>Forgot password</Text>
        <Text style={authStyles.subtitle}>
          Enter the email tied to your CareerBot account; we will send a reset link.
        </Text>

        {error ? <Text style={authStyles.formErrorText}>{error}</Text> : null}
        {successMessage ? <Text style={authStyles.successText}>{successMessage}</Text> : null}

        <View style={authStyles.form}>
          <AuthInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            returnKeyType="done"
            textContentType="emailAddress"
            value={email}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={requestMutation.isPending}
          onPress={onSubmit}
          style={({ pressed }) => [
            authStyles.primaryButton,
            pressed && authStyles.buttonPressed,
            requestMutation.isPending && authStyles.buttonDisabled,
          ]}
        >
          <Text style={authStyles.primaryButtonText}>
            {requestMutation.isPending ? 'Sending...' : 'Send reset link'}
          </Text>
        </Pressable>

        <View style={authStyles.footerRow}>
          <Pressable accessibilityRole="link" onPress={() => router.back()}>
            <Text style={authStyles.linkText}>Back to sign in</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
