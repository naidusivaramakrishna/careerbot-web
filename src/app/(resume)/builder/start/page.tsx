"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation';
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

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#f4f6f9]">
    <div className="bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-8 py-5 flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}>
          <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Resume Builder</h1>
          <p className="text-xs text-gray-400 mt-0.5">Create and optimize your resume with AI</p>
        </div>
      </div>
    </div>
    {children}
  </div>
);

const ResumePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const checkForResumes = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      // ✅ If not authenticated, API will return 401 (handled in catch block)
      const { builder_resumes, enhanced_resumes } = await getAllResumesUnified();

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
    checkForResumes();
  }, [checkForResumes]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="pt-8">
        <EmptyState selected={selected} onSelect={setSelected} />
      </div>
    </PageShell>
  );
};

export default ResumePage;