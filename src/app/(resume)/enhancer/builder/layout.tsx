import React from 'react';

// Server component layout — route segment config works here (not in "use client" page)
export const dynamic = 'force-dynamic';

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
