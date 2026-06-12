'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { parseJDText } from '@/api/parserApi';
import { extractResume } from '@/api/resumeParsingApi';
import SignUpModal from '@/components/SignUpModal';
import { useHasParsedResume } from '@/hooks/useHasParsedResume';
import { useLatestParsedResume } from '@/hooks/useLatestParsedResume';
import { useGenerateCoverLetter } from '@/hooks/useGenerateCoverLetter';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { mintIdempotencyKey } from '@/lib/idempotencyKey';
import { ERROR_MESSAGES } from '@/lib/coverLetterMessages';
import { getCoverLetterParsedResumeId } from '@/lib/coverLetterResume';
import NoResumePrompt from '../_components/NoResumePrompt';
import CoverLetterForm from '../_components/CoverLetterForm';
import type { CoverLetterFormSubmit } from '@/types/coverLetter';

const MAX_RESUME_UPLOAD_MB = 10;
const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
type ParsedResumeBlob = Record<string, unknown>;

export default function CoverLetterNewPage() {
  const gate = useHasParsedResume();
  const [uploadedResume, setUploadedResume] = useState<ParsedResumeBlob | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const uploader = useCoverLetterResumeUpload(async (resume) => {
    setUploadedResume(resume);
    await gate.refetch();
  }, () => setShowSignIn(true));

  if (gate.isLoading && gate.hasResume === null) {
    return <PageLoader />;
  }
  if (gate.hasResume === false && !uploadedResume) {
    return (
      <>
        <NoResumePrompt
          isRefreshing={gate.isLoading}
          isUploading={uploader.isUploading}
          uploadError={uploader.uploadError}
          onRefresh={() => void gate.refetch()}
          onUpload={(file) => void uploader.uploadResume(file)}
        />
        <SignUpModal
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          initialFormType="signin"
          redirectTo="/cover-letter/new"
          onSuccess={() => void gate.refetch()}
        />
      </>
    );
  }
  return <FormHost uploadedResume={uploadedResume} />;
}

function FormHost({ uploadedResume }: { uploadedResume?: ParsedResumeBlob | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJd = searchParams.get('jd') ?? '';
  const latest = useLatestParsedResume();
  const { userId } = useCurrentUserId();
  const lastAttemptKeyRef = useRef<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [localUploadedResume, setLocalUploadedResume] = useState<ParsedResumeBlob | null>(
    uploadedResume ?? null
  );
  const [showSignIn, setShowSignIn] = useState(false);
  const uploader = useCoverLetterResumeUpload(async (resume) => {
    setLocalUploadedResume(resume);
    await latest.refetch();
  }, () => setShowSignIn(true));
  const resume = localUploadedResume ?? latest.resume;
  const parsedResumeId = getCoverLetterParsedResumeId(resume);

  const generation = useGenerateCoverLetter({
    onSuccess: (response) => {
      toast.success('Cover letter generated.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/cover-letter/${encodeURIComponent(response.letter_id)}` as any);
    },
    onError: (err) => {
      const message = err.validationErrors?.length
        ? 'Please fix the highlighted fields and try again.'
        : err.reason === 'not_found'
          ? getGenerateNotFoundMessage(err.message)
          : ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      setApiError(message);
    },
  });

  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (
      !autoTriggeredRef.current &&
      initialJd.trim().length >= 50 &&
      parsedResumeId &&
      !latest.isLoading &&
      !isPreparing &&
      !generation.isLoading
    ) {
      autoTriggeredRef.current = true;
      void handleSubmit({ job_description: initialJd.trim(), options: { tone: 'professional', min_words: 250, max_words: 400, include_debug_metadata: false } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedResumeId, latest.isLoading]);

  if (latest.isLoading && !resume) return <PageLoader />;

  if (!resume || !parsedResumeId) {
    return (
      <>
        <NoResumePrompt
          isRefreshing={latest.isLoading}
          isUploading={uploader.isUploading}
          uploadError={uploader.uploadError}
          onRefresh={() => void latest.refetch()}
          onUpload={(file) => void uploader.uploadResume(file)}
        />
        <SignUpModal
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          initialFormType="signin"
          redirectTo="/cover-letter/new"
          onSuccess={() => void latest.refetch()}
        />
      </>
    );
  }

  async function handleSubmit(request: CoverLetterFormSubmit) {
    if (!parsedResumeId) {
      setApiError('This resume is missing its parsed resume id. Please upload the resume again.');
      return;
    }

    const idFor = userId ?? 'anon';
    const attemptKey = mintIdempotencyKey(idFor);
    lastAttemptKeyRef.current = attemptKey;
    setApiError(null);
    setIsPreparing(true);
    try {
      const parsedJd = await parseJDText(request.job_description, {
        skipAuthRedirect: true,
      });
      if (!parsedJd.jd_id) {
        throw new Error('Could not parse this job description. Please paste the full job posting and try again.');
      }

      void generation.mutate({
        body: {
          parsed_resume_id: parsedResumeId,
          jd_id: parsedJd.jd_id,
          ...(request.application_context && {
            application_context: request.application_context,
          }),
          ...(request.options && { options: request.options }),
        },
        attemptKey,
      });
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Could not prepare this job description. Please try again.';
      setApiError(message);
      toast.error(message);
    } finally {
      setIsPreparing(false);
    }
  }

  // When coming from extension (auto-triggered), show a full-screen loader instead of the form
  if (initialJd.trim().length >= 50 && (isPreparing || generation.isLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#eef2fb" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#2557a7]" />
        <p className="text-sm font-medium text-slate-600">
          {isPreparing ? 'Preparing job description…' : 'Generating your cover letter…'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eef2fb" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/cover-letter/history"
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
          isSubmitting={isPreparing || generation.isLoading}
          apiError={apiError}
          validationErrors={
            apiError === 'Please fix the highlighted fields and try again.' &&
            generation.error?.reason === 'validation'
              ? generation.error.validationErrors
              : undefined
          }
          onSubmit={handleSubmit}
        />
        {(isPreparing || generation.isLoading) && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#2557a7] flex items-center justify-between gap-3">
            <span>{isPreparing ? 'Preparing job description...' : 'Generating your cover letter...'}</span>
            {generation.isLoading && (
              <button
                type="button"
                onClick={() => generation.abort()}
                className="font-semibold hover:text-[#1e4a94]"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function validateResumeUpload(file: File): string | null {
  if (file.size > MAX_RESUME_UPLOAD_MB * 1024 * 1024) {
    return `File exceeds ${MAX_RESUME_UPLOAD_MB}MB limit.`;
  }
  const hasAllowedExtension = /\.(pdf|docx)$/i.test(file.name);
  if (!ALLOWED_RESUME_TYPES.has(file.type) && !hasAllowedExtension) {
    return 'Upload a PDF or DOCX resume.';
  }
  return null;
}

function getGenerateNotFoundMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('parsed resume')) {
    return 'We could not find the selected parsed resume. Please upload your resume again.';
  }
  if (lower.includes('job description')) {
    return 'We could not find the parsed job description. Please paste the JD again and retry.';
  }
  return 'We could not find one of the saved inputs for this letter. Please upload your resume or paste the JD again.';
}

function useCoverLetterResumeUpload(
  onUploaded: (resume: ParsedResumeBlob) => Promise<void>,
  onAuthRequired?: () => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadResume = useCallback(async (file: File) => {
    const validationError = validateResumeUpload(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const parsed = await extractResume(file, { skipLoginRedirect: true });
      const mappedResume = {
        parsed_data: parsed.parsed_data,
        parsed_resume_id: parsed.resume_id,
        resume_id: parsed.resume_id,
        source_file_name: parsed.file_name,
      } satisfies ParsedResumeBlob;
      const imageWarning =
        parsed.parsed_data?.image_warning || parsed.parsed_data?.image_message
          ? parsed.parsed_data.image_message ||
            'Resume parsed with image warnings. Text inside images may not be fully extracted.'
          : null;
      if (imageWarning) {
        toast.warning(imageWarning);
      }
      toast.success('Resume parsed. Continue with your cover letter.');
      await onUploaded(mappedResume);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        onAuthRequired?.();
      }
      const message = getResumeUploadErrorMessage(err);
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, [onUploaded, onAuthRequired]);

  return { isUploading, uploadError, uploadResume };
}

function isUnauthorizedError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

function getResumeUploadErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) {
    return 'Please sign in to upload and parse your resume. We will keep you in the cover-letter flow.';
  }

  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === 'string') return detail;
    const error = record.error;
    if (error && typeof error === 'object') {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string') return message;
    }
    const message = record.message;
    if (typeof message === 'string') return message;
  }

  if (err instanceof Error && !/^Request failed with status code \d+$/.test(err.message)) {
    return err.message;
  }

  return 'Could not upload this resume. Please try another file.';
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#eef2fb" }}>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#2557a7]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
