import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Server-side auth guard for all (user) routes (dashboard, profile, etc.).
// Middleware is the first line of defence, but Next.js may serve prefetched
// RSC payloads from its router cache without re-running middleware. This
// layout runs on every server render and closes that gap.
export default async function UserGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasToken =
    cookieStore.get('access_token') ||
    cookieStore.get('refresh_token');

  if (!hasToken) {
    const headersList = await headers();
    // x-pathname is set by middleware; Next.js 15 doesn't set x-invoke-path
    const pathname = headersList.get('x-pathname') || '/dashboard';
    redirect(`/?showLogin=true&next=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
