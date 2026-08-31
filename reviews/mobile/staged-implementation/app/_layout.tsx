// Root layout — Providers + bootstrap wiring.
//
// Per docs/design/notes/2026-06-03-auth-lifecycle-orchestration.md §3 Option D.
//
// Bootstrap order (DO NOT REORDER — caught by Codex rounds 3 + 4):
//   1. restoreSession()                          — read SecureStore → useAuthStore
//   2. registerSignOutHandler(signOut)           — wire http.ts onSignOut hook
//   3. configureAuthActions({ queryClient })     — wire authActions.signOut deps
//   4. authLifecycle.start({ queryClient, signOut }) — schedule + AppState
//   5. UI gate releases (children render)
//
// If authLifecycle.start() detects a near-expired restored token and refresh
// FAILS, it calls deps.signOut() internally and returns. The route gate in
// app/index.tsx then sees isSignedIn=false and redirects to /(auth)/signin.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { registerSignOutHandler } from '@/api/client/http';
import { configureAuthActions, signOut } from '@/features/auth/authActions';
import { authLifecycle } from '@/features/auth/authLifecycle';
import { restoreSession } from '@/features/auth/sessionRestore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function RootLayout() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // 1. Read SecureStore → useAuthStore (hydrates synchronously after await).
      await restoreSession();

      // 2. Wire http.ts onSignOut hook before any 401 can fire.
      registerSignOutHandler(signOut);

      // 3. Configure the authActions composition with its dependencies.
      configureAuthActions({ queryClient });

      // 4. Start the lifecycle service (snapshot reconcile + scheduler + AppState).
      await authLifecycle.start({
        queryClient,
        signOut,
      });

      // 5. Release UI gate.
      if (!cancelled) setBootstrapped(true);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
