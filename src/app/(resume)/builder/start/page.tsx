"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getAllResumesUnified } from '@/api/resumeApi';
import EmptyState from './_components/EmptyState';

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

const ResumePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const checkForResumes = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      // ✅ If not authenticated, API will return 401 (handled in catch block)
      const { builder_resumes, enhanced_resumes } = await getAllResumesUnified({ skipAuthRedirect: true });

      if (builder_resumes.length > 0 || enhanced_resumes.length > 0) {
        router.push('/builder/start/list');
        return;
      }

      // No resumes - show empty state
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
  }, [router]);

  useEffect(() => {
    const action = searchParams?.get('action');
    if (action === 'enhance') {
      setSelected('upload');
      setLoading(false);
      return;
    }
    checkForResumes();
  }, [checkForResumes, searchParams]);

  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Resume Management</h1>
            <p className="text-xs text-gray-500">Manage, analyze and optimize your resumes with AI</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 mt-4 border-t border-gray-200" />

      {children}
    </div>
  );

  if (loading) {
    return (
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
  }

  return (
    <PageShell>
      {/* Subtle intro text */}
      <div className="px-6 pt-6 pb-2 text-center">
        <p className="text-sm text-gray-400">Choose how you&apos;d like to get started</p>
      </div>
      <EmptyState
        selected={selected}
        onSelect={setSelected}
        initialUploadOpen={searchParams?.get('action') === 'enhance'}
      />
    </PageShell>
  );
};

export default ResumePage;
