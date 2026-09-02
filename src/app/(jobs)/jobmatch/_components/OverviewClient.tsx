"use client";

import dynamic from "next/dynamic";

// ssr: false must live in a Client Component — this wrapper allows page.tsx
// (a Server Component) to use it while still disabling SSR for Overview.
const Overview = dynamic(() => import("./Overview"), { ssr: false });

export default function OverviewClient({ sessionId }: { sessionId?: string }) {
  return <Overview sessionId={sessionId} />;
}
