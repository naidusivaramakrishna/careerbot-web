"use client";

/**
 * /cover-letter/new — generate page (WEB-3.2 wired).
 *
 * State machine:
 *
 *   Mount
 *     │
 *     ▼ useHasParsedResume
 *     │     ▼ false → <NoResumePrompt />
 *     │     ▼ true  → useLatestParsedResume
 *     │                  ▼ null  → <NoResumePrompt /> (defensive)
 *     │                  ▼ blob  → <CoverLetterForm />
 *     │
 *     ▼ user submits → useGenerateCoverLetter.mutate({ body, attemptKey })
 *     │                  ▼ <GenerationProgress /> (Screen B.2)
 *     │
 *     ▼ on success → router.push(`/cover-letter/${letter_id}`)
 *     ▼ on error   → render form again with apiError surfaced
 *     ▼ on cancel  → abort() + back to form (request may still
 *                    complete server-side; reconcile via list refetch
 *                    on the next view, per wireframes §B.2)
 *
 * Spec: wireframes §4 + §B.3 error mapping + §B.4 idempotency.
 */
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useHasParsedResume } from "@/hooks/useHasParsedResume";
import { useLatestParsedResume } from "@/hooks/useLatestParsedResume";
import { useGenerateCoverLetter } from "@/hooks/useGenerateCoverLetter";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { mintIdempotencyKey } from "@/lib/idempotencyKey";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import NoResumePrompt from "../_components/NoResumePrompt";
import CoverLetterForm from "../_components/CoverLetterForm";
import GenerationProgress from "../_components/GenerationProgress";
import type { CoverLetterGenerateRequest } from "@/types/coverLetter";

export default function CoverLetterNewPage() {
  const gate = useHasParsedResume();

  if (gate.isLoading && gate.hasResume === null) {
    return <PageLoader />;
  }
  if (gate.hasResume === false) {
    return (
      <NoResumePrompt
        isRefreshing={gate.isLoading}
        onRefresh={() => void gate.refetch()}
      />
    );
  }
  return <FormHost />;
}

function FormHost() {
  const router = useRouter();
  const latest = useLatestParsedResume();
  const { userId } = useCurrentUserId();
  // attemptKey is captured per-submission; useRef keeps it stable
  // across re-renders of the form (Codex impl-r2 P2#5 — body +
  // key are immutable for the mutation's lifetime).
  const lastAttemptKeyRef = useRef<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const generation = useGenerateCoverLetter({
    onSuccess: (response) => {
      // Backend persisted the letter at `response.letter_id`.
      // Navigate to the detail page. List will refetch on next
      // mount; toast on the way to confirm.
      toast.success("Cover letter generated.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/cover-letter/${encodeURIComponent(response.letter_id)}` as any);
    },
    onError: (err) => {
      const message = ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      setApiError(message);
      // Don't toast — the form already shows the inline error;
      // a parallel toast would be redundant noise.
    },
  });

  if (latest.isLoading) {
    return <PageLoader />;
  }
  if (!latest.resume) {
    return (
      <NoResumePrompt
        isRefreshing={latest.isLoading}
        onRefresh={() => void latest.refetch()}
      />
    );
  }

  // In-flight loader takes over the screen while the LLM runs.
  if (generation.isLoading) {
    return (
      <GenerationProgress
        onCancel={() => {
          generation.abort();
          // Don't navigate away — let the user re-attempt or edit
          // the form. The abandoned request's key stays "in the
          // wild"; list refetch on the way back to /cover-letter
          // will pick it up if the backend finished anyway
          // (wireframes §B.2).
        }}
      />
    );
  }

  function handleSubmit(request: CoverLetterGenerateRequest) {
    // We need a userId for the idempotency key. If we still
    // haven't resolved one (e.g. /api/auth/stream-token slow),
    // generate a session-scoped fallback so the key remains
    // unique per submission — the backend dedups by tenant+user
    // from the JWT, the userId in the key is purely diagnostic.
    const idFor = userId ?? "anon";
    // Capture the attempt key once per submission attempt
    // (immutable for the duration of this mutation).
    const attemptKey = mintIdempotencyKey(idFor);
    lastAttemptKeyRef.current = attemptKey;
    setApiError(null);
    void generation.mutate({ body: request, attemptKey });
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/cover-letter"
            aria-label="Back to cover letters"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">New cover letter</h1>
        </div>
        <CoverLetterForm
          resume={latest.resume}
          resumeSchemaVersion={latest.resumeSchemaVersion}
          isSubmitting={generation.isLoading}
          apiError={apiError}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#2257a7]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
