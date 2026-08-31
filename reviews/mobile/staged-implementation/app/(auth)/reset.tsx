// Reset-password screen — accept token from email deep-link + new password.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import AuthInput from '@/components/forms/AuthInput';
import { getApiErrorMessage } from '@/api/client/errors';
import { authStyles } from '@/features/auth/styles';
import { useConfirmPasswordReset } from '@/features/auth/passwordResetApi';
import { PASSWORD_REQUIREMENT_TEXT, isStrongPassword } from '@/utils/validators';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const tokenFromLink = typeof params.token === 'string' ? params.token : '';

  const [token, setToken] = useState(tokenFromLink);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const confirmMutation = useConfirmPasswordReset();

  async function onSubmit() {
    setError(undefined);

    if (!token.trim()) return setError('Reset token is required.');
    if (!password.trim()) return setError('New password is required.');
    if (!isStrongPassword(password)) return setError(PASSWORD_REQUIREMENT_TEXT);
    if (password !== confirmPassword) return setError('Passwords do not match.');

    try {
      await confirmMutation.mutateAsync({ token, new_password: password });
      setDone(true);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not reset password.'));
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.screen} keyboardShouldPersistTaps="handled">
      <View style={authStyles.panel}>
        <Text style={authStyles.title}>Set a new password</Text>
        <Text style={authStyles.subtitle}>
          {tokenFromLink
            ? 'Choose a new password for your CareerBot account.'
            : 'Enter the reset token from your email and a new password.'}
        </Text>

        {error ? <Text style={authStyles.formErrorText}>{error}</Text> : null}
        {done ? (
          <Text style={authStyles.successText}>
            Password reset. You can now sign in with your new password.
          </Text>
        ) : null}

        {done ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(auth)/signin')}
            style={({ pressed }) => [authStyles.primaryButton, pressed && authStyles.buttonPressed]}
          >
            <Text style={authStyles.primaryButtonText}>Back to sign in</Text>
          </Pressable>
        ) : (
          <>
            <View style={authStyles.form}>
              {tokenFromLink ? null : (
                <AuthInput
                  autoCapitalize="none"
                  label="Reset token"
                  onChangeText={setToken}
                  placeholder="Paste token from email"
                  value={token}
                />
              )}
              <AuthInput
                autoCapitalize="none"
                autoComplete="password-new"
                label="New password"
                onChangeText={setPassword}
                placeholder="At least 8 chars, letters + numbers"
                secureTextEntry
                textContentType="newPassword"
                value={password}
              />
              <AuthInput
                autoCapitalize="none"
                autoComplete="password-new"
                label="Confirm new password"
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                secureTextEntry
                textContentType="newPassword"
                value={confirmPassword}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={confirmMutation.isPending}
              onPress={onSubmit}
              style={({ pressed }) => [
                authStyles.primaryButton,
                pressed && authStyles.buttonPressed,
                confirmMutation.isPending && authStyles.buttonDisabled,
              ]}
            >
              <Text style={authStyles.primaryButtonText}>
                {confirmMutation.isPending ? 'Resetting...' : 'Reset password'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}
