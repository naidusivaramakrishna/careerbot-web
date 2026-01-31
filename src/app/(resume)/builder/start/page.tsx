"use client"
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getAllResumes } from '@/api/resumeApi';
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
}

const ResumePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const checkForResumes = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      // ✅ If not authenticated, API will return 401 (handled in catch block)
      const data = await getAllResumes();

      if (data && data.length > 0) {
        // Resumes exist - redirect to list page
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
      <div>
        <h1 className="text-2xl font-bold">RESUME</h1>
        <div className="min-h-screen bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
          <main className="flex-1 p-8">
            <div className="rounded-2xl relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-2xl font-bold">Resume Management</span>
                  <p className="text-sm text-gray-600">
                    Manage, analyze and optimize your resumes with AI
                  </p>
                </div>
              </div>
              <div className="bg-white w-full rounded-2xl border border-gray-200 p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading...</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">RESUME</h1>
      <div className="min-h-screen bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
        <main className="flex-1 p-8">
          <div className="rounded-2xl relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-2xl font-bold">Resume Management</span>
                <p className="text-sm text-gray-600">
                  Manage, analyze and optimize your resumes with AI
                </p>
              </div>
            </div>
            <EmptyState selected={selected} onSelect={setSelected} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResumePage;
