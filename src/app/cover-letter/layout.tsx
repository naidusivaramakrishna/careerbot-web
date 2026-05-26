import type { ReactNode } from "react";
import FeatureUnavailableScreen from "./_components/FeatureUnavailableScreen";

/**
 * Cover-letter route group — top-level (no Next route group).
 *
 * This layout is the FLAG GATE for the entire feature. When
 * `NEXT_PUBLIC_COVER_LETTER_ENABLED` is anything other than the
 * literal string "true", every cover-letter route renders the
 * `<FeatureUnavailableScreen />` instead of its real content.
 *
 * Sibling: the backend mirrors this on `/api/v1/cover-letter/*`
 * with `COVER_LETTER_API_ENABLED=False` → 503. Same UX either way
 * (BACKEND blueprint §3 — no existence-disclosure of the feature
 * when off).
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_IMPLEMENTATION_BLUEPRINT_2026_05_25.txt
 *       §9 WEB-1.1.
 */
export default function CoverLetterLayout({ children }: { children: ReactNode }) {
  // Read at module load — Next bakes NEXT_PUBLIC_* into the client
  // bundle at build time, so this is a server-side check at render
  // (App Router) but works identically on the client.
  const enabled = process.env.NEXT_PUBLIC_COVER_LETTER_ENABLED === "true";

  if (!enabled) {
    return <FeatureUnavailableScreen />;
  }

  return <>{children}</>;
}
