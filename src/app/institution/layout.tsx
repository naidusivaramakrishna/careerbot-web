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
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/institution';

  // THE COLLEGE FRONT DOOR IS NOT PART OF THE GUARDED AREA.
  //
  // /institution/login exists to be seen by someone who is NOT signed in --
  // that is its entire job. It reads only the public branding endpoint (a
  // college id and name). Running it through the guard below sent a student
  // who typed their college's address to the CONSUMER marketing page, which
  // is the exact failure that page's own comment warns about, and left the
  // college's front door unreachable.
  //
  // It is also returned WITHOUT InstitutionProvider/InstitutionGate: those
  // resolve a membership, and this page is for people who may not have one
  // yet. Only this one path -- every other /institution screen stays gated.
  if (pathname === '/institution/login') {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const hasToken = cookieStore.get('access_token') || cookieStore.get('refresh_token');

  if (!hasToken) {
    redirect(`/?showLogin=true&next=${encodeURIComponent(pathname)}`);
  }

  return (
    <InstitutionProvider>
      <InstitutionGate>{children}</InstitutionGate>
    </InstitutionProvider>
  );
}
