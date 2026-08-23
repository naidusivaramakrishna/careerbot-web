import React from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { InstitutionProvider } from '@/contexts/InstitutionContext';
import { InstitutionGate } from './_components/InstitutionGate';

/**
 * Layout for the college area.
 *
 * Server-side auth guard first — the same pattern as `(user)/layout.tsx`, since
 * middleware can be bypassed by Next's router cache serving a prefetched RSC
 * payload. Everything past this point needs a signed-in account; whether that
 * account belongs to a college is decided client-side by `InstitutionGate`,
 * because it takes an API call to know.
 */
export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasToken = cookieStore.get('access_token') || cookieStore.get('refresh_token');

  if (!hasToken) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/institution';
    redirect(`/?showLogin=true&next=${encodeURIComponent(pathname)}`);
  }

  return (
    <InstitutionProvider>
      <InstitutionGate>{children}</InstitutionGate>
    </InstitutionProvider>
  );
}
