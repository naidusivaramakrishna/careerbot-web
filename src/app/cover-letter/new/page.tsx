'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useHasParsedResume } from '@/hooks/useHasParsedResume';
import { useLatestParsedResume } from '@/hooks/useLatestParsedResume';
import { useGenerateCoverLetter } from '@/hooks/useGenerateCoverLetter';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { mintIdempotencyKey } from '@/lib/idempotencyKey';
import { ERROR_MESSAGES } from '@/lib/coverLetterMessages';
import NoResumePrompt from '../_components/NoResumePrompt';
import CoverLetterForm from '../_components/CoverLetterForm';
import GenerationProgress from '../_components/GenerationProgress';
import type { CoverLetterGenerateRequest } from '@/types/coverLetter';

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
  const lastAttemptKeyRef = useRef<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const generation = useGenerateCoverLetter({
    onSuccess: (response) => {
      toast.success('Cover letter generated.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/cover-letter/${encodeURIComponent(response.letter_id)}` as any);
    },
    onError: (err) => {
      const message = ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      setApiError(message);
    },
  });

  if (latest.isLoading) return <PageLoader />;

  if (!latest.resume) {
    return (
      <NoResumePrompt
        isRefreshing={latest.isLoading}
        onRefresh={() => void latest.refetch()}
      />
    );
  }

  if (generation.isLoading) {
    return (
      <GenerationProgress
        onCancel={() => {
          generation.abort();
        }}
      />
    );
  }

  function handleSubmit(request: CoverLetterGenerateRequest) {
    const idFor = userId ?? 'anon';
    const attemptKey = mintIdempotencyKey(idFor);
    lastAttemptKeyRef.current = attemptKey;
    setApiError(null);
    void generation.mutate({ body: request, attemptKey });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/cover-letter"
            aria-label="Back to cover letters"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 leading-tight">
              New Cover Letter
            </h1>
            <p className="text-xs text-slate-500">
              AI-tailored to your resume and job description
            </p>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="max-w-2xl mx-auto px-4 py-8">
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#2257a7]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}