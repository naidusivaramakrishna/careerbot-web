"use client"
import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { toast } from 'sonner';
import { getAllResumesUnified, deleteResume as deleteResumeApi, downloadResume, getResumeScore, ResumeResponse } from '@/api/resumeApi';
import { downloadEnhancedResume } from '@/api/enhancerApi';
import type { EnhancedResumeSummary } from '@/types/api.types';
import { formatDateResume } from '@/utils/formatDateResume';
import DeleteConfirmModal from '../_components/DeleteConfirmModal';
import DownloadModal from '../_components/DownloadModal';
import ResumeTableRow from '../_components/ResumeTableRow';
import AddResumeModal from '../_components/AddResumeModal';
import UploadResumeModal from '../_components/UploadResumeModal';
import { useRouter, useSearchParams } from 'next/navigation';
import logger from "@/lib/logger";
import { createResumeWithAuth } from '@/api/resumeApi';

export interface Resume {
  id: string;
  initials: string;
  name: string;
  job: string;
  score: number;
  modified: string;
  created: string;
  createdAt: string;
  updatedAt: string;
  primary: boolean;
  source?: 'enhanced' | 'builder';
}

const ResumeListContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ✅ Track refresh parameter to force data refetch
  const refreshParam = searchParams?.get('refresh');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const transformResumeData = (backendData: ResumeResponse[], userProfileName?: string): Resume[] => {
    return backendData.map((item) => {
      // Debug: Log what we're getting from backend
      logger.info('Resume data from backend:', {
        id: item.id,
        'personalInfo (full)': JSON.stringify(item.personalInfo, null, 2),
        fullname: item.personalInfo?.fullname,
        email: item.personalInfo?.email,
        work_experience: item.work_experience,
        userProfileFallback: userProfileName
      });

      // ✅ Try multiple sources for the name, including user profile as fallback
      const name = item.personalInfo?.fullname ||
                   userProfileName ||  // ✅ Use user profile name if resume personalInfo is null
                   item.personalInfo?.email?.split('@')[0] ||
                   'Untitled Resume';

      // ✅ Get target role from professionalSummary
      const targetRole = typeof item.professionalSummary === 'object'
                         ? item.professionalSummary?.targetRole || 'No Target Role'
                         : 'No Target Role';

      return {
        id: item.id,
        initials: getInitials(name),
        name: name,
        job: targetRole,
        score: 0,
        modified: formatDateResume(item.updatedAt),
        created: formatDateResume(item.createdAt),
        createdAt: item.createdAt, // ✅ Store raw timestamp
        updatedAt: item.updatedAt, // ✅ Store raw timestamp
        primary: false,
      };
    });
  };

  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);

      // Single unified call — returns both builder and enhanced resumes
      const { builder_resumes, enhanced_resumes } = await getAllResumesUnified();

      // Transform enhanced resumes (summary shape — no enhanced_data)
      const transformedEnhanced: Resume[] = enhanced_resumes.map((item: EnhancedResumeSummary) => {
        const name = item.display_name || 'Uploaded Resume';
        const atsObj = typeof item.ats_score === 'object' ? item.ats_score : null;
        const score = typeof item.ats_score === 'number'
          ? item.ats_score
          : atsObj?.final_score ?? atsObj?.Percentage ?? 0;
        return {
          id: item.id,
          initials: name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
          name,
          job: '',
          score,
          modified: formatDateResume(item.updated_at),
          created: formatDateResume(item.created_at),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          primary: false,
          source: 'enhanced' as const,
        };
      });

      // Transform builder resumes
      const transformedData = transformResumeData(builder_resumes as ResumeResponse[]);

      // Fetch scores for builder resumes only
      const resumesWithScores = await Promise.all(
        transformedData.map(async (resume) => {
          try {
            const scoreData = await getResumeScore(resume.id);
            return { ...resume, score: scoreData.overall_score };
          } catch {
            return resume;
          }
        })
      );

      // Merge: builder resumes first, then enhanced resumes
      const merged = [...resumesWithScores, ...transformedEnhanced];
      setResumes(merged);

      // ✅ Clean URL by removing refresh parameter after successful fetch
      if (refreshParam) {
        router.replace('/builder/start/list', { scroll: false });
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      if (error.response?.status === 401 || error.message?.includes("sign in")) {
        toast.error("Session expired. Please log in again");
        router.push('/builder/start');
      } else if (error.message?.includes("not found")) {
        toast.error("API endpoint not configured correctly");
      } else {
        toast.error(error.response?.data?.detail || error.message || "Failed to fetch resumes");
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, refreshParam]); // transformResumeData is a function defined inline and doesn't need to be a dependency

  useEffect(() => {
    logger.info('Fetching resumes... (refresh param:', refreshParam, ')');
    fetchResumes();
  }, [fetchResumes, refreshParam]); // ✅ Refetch when refresh parameter changes

  const handleDeleteResume = async (resumeId: string) => {
    try {
      setDeleting(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      await deleteResumeApi(resumeId);
      const updatedResumes = resumes.filter(r => r.id !== resumeId);
      setResumes(updatedResumes);
      toast.success("Resume deleted successfully");
      setDeleteConfirmId(null);

    } catch (err) {
      const error = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this resume");
      } else if (error.response?.status === 404) {
        toast.error("Resume not found");
      } else {
        toast.error(error.response?.data?.detail || error.message || "Failed to delete resume");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadResume = async (resumeId: string, format: 'pdf' | 'docx') => {
    try {
      setDownloading(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      const isEnhanced = resumes.find(r => r.id === resumeId)?.source === 'enhanced';
      const blob = isEnhanced
        ? await downloadEnhancedResume(resumeId, format)
        : await downloadResume(resumeId, format);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume_${resumeId}.${format}`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Resume downloaded as ${format.toUpperCase()}`);
      setDownloadModalOpen(false);

    } catch (err) {
      const error = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to download this resume");
      } else if (error.response?.status === 404) {
        toast.error("Resume not found");
      } else {
        toast.error(error.response?.data?.detail || error.message || "Failed to download resume");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateWithAI = async () => {
    setIsCreating(true);
    try {
      const newResume = await createResumeWithAuth();
      localStorage.setItem("cached_resume_data", JSON.stringify({ resumeId: newResume.id, data: newResume }));
      localStorage.setItem("current_resume_id", newResume.id);
      router.push(`/builder/creation/${newResume.id}`);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error("Please sign in to create a resume");
      } else {
        toast.error("Failed to create resume. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3 mb-1">
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

          {/* Add Resume button + dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddMenuOpen((v) => !v)}
              disabled={isCreating}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
            >
              {isCreating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Add Resume
            </button>

            <AddResumeModal
              isOpen={addMenuOpen}
              onClose={() => setAddMenuOpen(false)}
              onCreateWithAI={handleCreateWithAI}
              onUploadExisting={() => setShowUploadModal(true)}
            />
          </div>
        </div>
      </div>

      <UploadResumeModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {children}
    </div>
  );

  if (loading) {
    return (
      <PageShell>
        <div className="px-6 pb-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* skeleton header row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              {[120, 160, 90, 100, 100, 70].map((w, i) => (
                <div key={i} className="h-3 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
              ))}
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-2.5 w-20 rounded-full bg-gray-100 animate-pulse" />
                </div>
                <div className="w-24 h-3 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-20 h-3 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-20 h-3 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Resume</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Target Role</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Last Modified</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Created</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    No resumes yet. Click <strong>Add Resume</strong> to get started.
                  </td>
                </tr>
              ) : (
                resumes.map((resume, i) => (
                  <ResumeTableRow
                    key={resume.id}
                    resume={resume}
                    index={i}
                    onDelete={() => setDeleteConfirmId(resume.id)}
                    onDownload={() => {
                      setSelectedResumeId(resume.id);
                      setDownloadModalOpen(true);
                    }}
                    downloading={downloading}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteResume(deleteConfirmId)}
        deleting={deleting}
      />

      <DownloadModal
        isOpen={downloadModalOpen && !!selectedResumeId}
        onClose={() => {
          setDownloadModalOpen(false);
          setSelectedResumeId(null);
        }}
        onDownload={(format) => selectedResumeId && handleDownloadResume(selectedResumeId, format)}
        downloading={downloading}
      />
    </PageShell>
  );
};

const ResumeListPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#2557a7]"></div>
      </div>
    }>
      <ResumeListContent />
    </Suspense>
  );
};

export default ResumeListPage;
