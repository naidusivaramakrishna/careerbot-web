// Email-verification screen — accept token from email deep-link, also
// supports manual paste + resend.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import AuthInput from '@/components/forms/AuthInput';
import { getApiErrorMessage } from '@/api/client/errors';
import { authStyles } from '@/features/auth/styles';
import {
  useResendVerificationEmail,
  useVerifyEmail,
} from '@/features/auth/emailVerificationApi';
import { isValidEmail } from '@/utils/validators';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const tokenFromLink = typeof params.token === 'string' ? params.token : '';

  const [token, setToken] = useState(tokenFromLink);
  const [resendEmail, setResendEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | undefined>();

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationEmail();

  // Auto-submit when token arrives from a deep link.
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (tokenFromLink && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      void verifyMutation
        .mutateAsync({ token: tokenFromLink })
        .then(() => setDone(true))
        .catch((e) => setError(getApiErrorMessage(e, 'Verification failed.')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromLink]);

  async function onSubmit() {
    setError(undefined);
    if (!token.trim()) return setError('Verification token is required.');
    try {
      await verifyMutation.mutateAsync({ token });
      setDone(true);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Verification failed.'));
    }
  }

  async function onResend() {
    setError(undefined);
    setResendMessage(undefined);
    if (!resendEmail.trim()) return setError('Email is required to resend.');
    if (!isValidEmail(resendEmail)) return setError('Enter a valid email address.');
    try {
      const result = await resendMutation.mutateAsync({ email: resendEmail });
      setResendMessage(
        result.message ||
          'If this email is registered, you will receive a verification link shortly.',
      );
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not resend verification email.'));
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={authStyles.panel}>
        <Text style={authStyles.title}>Verify your email</Text>
        <Text style={authStyles.subtitle}>
          Tap the link in the email we sent, or paste the token here to verify.
        </Text>

        {error ? <Text style={authStyles.formErrorText}>{error}</Text> : null}
        {done ? (
          <Text style={authStyles.successText}>
            Email verified. You can now sign in.
          </Text>
        ) : null}
        {resendMessage ? <Text style={authStyles.successText}>{resendMessage}</Text> : null}

        {done ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(auth)/signin')}
            style={({ pressed }) => [authStyles.primaryButton, pressed && authStyles.buttonPressed]}
          >
            <Text style={authStyles.primaryButtonText}>Continue to sign in</Text>
          </Pressable>
        ) : (
          <>
            <View style={authStyles.form}>
              <AuthInput
                autoCapitalize="none"
                label="Verification token"
                onChangeText={setToken}
                placeholder="Paste token from email"
                value={token}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={verifyMutation.isPending}
              onPress={onSubmit}
              style={({ pressed }) => [
                authStyles.primaryButton,
                pressed && authStyles.buttonPressed,
                verifyMutation.isPending && authStyles.buttonDisabled,
              ]}
            >
              <Text style={authStyles.primaryButtonText}>
                {verifyMutation.isPending ? 'Verifying...' : 'Verify email'}
              </Text>
            </Pressable>

            <View style={[authStyles.form, { marginTop: 28 }]}>
              <Text style={authStyles.inputLabel}>Did not get the email?</Text>
              <AuthInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="Resend to"
                onChangeText={setResendEmail}
                placeholder="you@example.com"
                value={resendEmail}
              />
              <Pressable
                accessibilityRole="button"
                disabled={resendMutation.isPending}
                onPress={onResend}
                style={({ pressed }) => [
                  authStyles.socialButton,
                  pressed && authStyles.buttonPressed,
                  resendMutation.isPending && authStyles.buttonDisabled,
                ]}
              >
                <Text style={authStyles.socialButtonText}>
                  {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
