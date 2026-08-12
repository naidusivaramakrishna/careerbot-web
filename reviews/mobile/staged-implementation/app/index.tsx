// Splash / route gate — runs after root _layout.tsx bootstrap completes.
// Reads useAuthStore.isSignedIn and redirects to (auth) or (tabs).

import { Redirect } from 'expo-router';

import { useAuthStore } from '@/features/auth/authStore';

export default function Index() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  return <Redirect href={isSignedIn ? '/(tabs)/home' : '/(auth)/signin'} />;
}
