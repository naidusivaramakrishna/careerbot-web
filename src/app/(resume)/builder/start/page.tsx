"use client"
import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getAllResumesUnified, getResumeById } from '@/api/resumeApi';
import { toSameOriginPath } from '@/lib/internalPath';
import EmptyState from './_components/EmptyState';
import YourResumes from './_components/YourResumes';
import { formatDateResume } from '@/utils/formatDateResume';
import { computePreviewScore } from '../creation/_lib/computePreviewScore';
import { getEnhancedCurrentScore } from '../creation/_utils/enhancedScore';
import type { ResumeResponse } from '@/api/resumeApi';
import type { ATSScore, EnhancedResumeSummary } from '@/types/api.types';

export interface Resume {
  id: string;
  initials: string;
  name: string;
  job: string;
  score: number;
  modified: string;
  created: string;
  primary: boolean;
  source?: 'enhanced' | 'builder';
  createdAt?: string;
  updatedAt?: string;
}

export interface StartResume {
  id: string;
  name: string;
  score: number;
  modified: string;
  updatedAt: string;
  source: 'enhanced' | 'builder';
}

// How many resumes "Your Resumes" shows
const SHOWN_RESUMES = 3;

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#f7f9fc]">
    <div className="mx-auto max-w-[1180px] px-8 pt-4 pb-10">
      <h1 className="text-[24px] font-bold text-gray-900 leading-tight tracking-tight">Resume Management</h1>
      <p className="text-sm text-gray-600 mt-1">Manage, analyze and optimize your resumes with AI.</p>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

const LoadingShell = () => (
  <PageShell>
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,rgba(88,150,215,0.15),rgba(31,78,152,0.15))" }}
        >
          <div className="w-5 h-5 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-sm text-gray-400">Loading your resumes…</span>
      </div>
    </div>
  </PageShell>
);

const ResumePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [resumes, setResumes] = useState<StartResume[]>([]);

  const checkForResumes = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      // ✅ If not authenticated, API will return 401 (handled in catch block)
      const { builder_resumes, enhanced_resumes } = await getAllResumesUnified();

      // Normalized, same-origin path or null. The raw param is NOT usable: a
      // `startsWith("/") && !startsWith("//")` test on it accepts
      // "/..//evil.com", which the downstream consumer (builder/creation
      // Header) resolves to the protocol-relative path "//evil.com".
      const returnTo = toSameOriginPath(searchParams.get("return_to"));

      // A Cover Letter user needs a builder resume, not an uploaded/enhanced
      // record. Reopen their most recently active builder resume directly; if
      // none exists, keep this page open so they can create one.
      if (returnTo && builder_resumes.length > 0) {
        const currentResumeId = localStorage.getItem("current_resume_id");
        const selectedBuilderResume = builder_resumes.find((resume) => resume.id === currentResumeId)
          ?? builder_resumes[0];
        // builder_resumes is typed Record<string, unknown>[], so `id` is
        // `unknown` — a truthiness check alone would let a number or an
        // object through into the route.
        const selectedBuilderResumeId = typeof selectedBuilderResume?.id === "string"
          ? selectedBuilderResume.id
          : null;
        if (selectedBuilderResumeId) {
          const params = new URLSearchParams({ return_to: returnTo });
          router.push(`/builder/creation/${encodeURIComponent(selectedBuilderResumeId)}?${params.toString()}`);
          return;
        }
      }

      // Show the most recently edited resumes under the creation choices.
      // A builder_score on the compact list payload has no calculation time, so it can be
      // stale; the list page ignores it too. Score from the resume content instead.
      const builderRows: StartResume[] = (builder_resumes as unknown as ResumeResponse[]).map((item) => ({
        id: item.id,
        name: item.personalInfo?.fullname || item.personalInfo?.email?.split('@')[0] || 'Untitled Resume',
        score: computePreviewScore({ ...item, builder_score: undefined }).score,
        modified: formatDateResume(item.updatedAt),
        updatedAt: item.updatedAt,
        source: 'builder',
      }));
      const enhancedRows: StartResume[] = enhanced_resumes.map((item: EnhancedResumeSummary) => ({
        id: item.id,
        name: item.display_name || 'Uploaded Resume',
        score: Math.round(
          typeof item.ats_score === 'number'
            ? item.ats_score
            : getEnhancedCurrentScore(item.ats_score as ATSScore | undefined),
        ),
        modified: formatDateResume(item.updated_at),
        updatedAt: item.updated_at,
        source: 'enhanced',
      }));
      const sorted = [...builderRows, ...enhancedRows].sort(
        (a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
      );

      // The compact list payload leaves out most sections, so scoring it gives a number that is too low.
      // Only the cards that are shown (see YourResumes) are read in full, like the list page does for every row.
      const shownBuilderIds = sorted.slice(0, SHOWN_RESUMES).filter((r) => r.source === 'builder').map((r) => r.id);
      const fullRecords = await Promise.allSettled(shownBuilderIds.map((id) => getResumeById(id)));
      const scoredFromContent = new Map<string, { score: number; name?: string }>();
      fullRecords.forEach((result, i) => {
        if (result.status !== 'fulfilled') return; // keep the compact score for a record that cannot be read
        scoredFromContent.set(shownBuilderIds[i], {
          score: computePreviewScore({ ...result.value, builder_score: undefined }).score,
          name: result.value.personalInfo?.fullname || undefined,
        });
      });
      setResumes(
        sorted.map((r) => {
          const full = scoredFromContent.get(r.id);
          return full && r.source === 'builder' ? { ...r, score: full.score, name: full.name ?? r.name } : r;
        }),
      );

      // No builder resume for this return flow - show the creation choices.
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      if (error.response?.status === 401 || error.message?.includes("sign in")) {
        // Not authenticated - show empty state
      } else {
        toast.error(error.response?.data?.detail || error.message || "Failed to check resumes");
      }
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    checkForResumes();
  }, [checkForResumes]);

  if (loading) {
    return <LoadingShell />;
  }

  return (
    <PageShell>
      <div className="rounded-2xl border border-[#e3e9f2] bg-[#f1f5fb] p-6">
        <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Choose how you&apos;d like to get started</h2>
        <p className="text-sm text-gray-600 mt-1.5 mb-5">
          Create a new resume or upload an existing one to save time and improve it with AI.
        </p>
        <EmptyState selected={selected} onSelect={setSelected} />
      </div>
      <YourResumes resumes={resumes} />
    </PageShell>
  );
};

// useSearchParams() forces a client-side bailout, so the page component that
// calls it must sit inside a Suspense boundary. Without this, `next build`
// fails prerendering /builder/start with
// "useSearchParams() should be wrapped in a suspense boundary".
const ResumePage = () => (
  <Suspense fallback={<LoadingShell />}>
    <ResumePageContent />
  </Suspense>
);

export default ResumePage;