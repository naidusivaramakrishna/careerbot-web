"use client"
import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { toast } from 'sonner';
import { getAllResumesUnified, deleteResume as deleteResumeApi, downloadResume, getResumeScore, ResumeResponse } from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import { downloadEnhancedResume } from '@/api/enhancerApi';
import type { EnhancedResumeSummary } from '@/types/api.types';
import { formatDateResume } from '@/utils/formatDateResume';
import DeleteConfirmModal from '../_components/DeleteConfirmModal';
import DownloadModal from '../_components/DownloadModal';
import ResumeTableRow from '../_components/ResumeTableRow';
import AddResumeModal from '../_components/AddResumeModal';
import UploadResumeModal from '../_components/UploadResumeModal';
import { useRouter } from 'next/navigation';
import logger from "@/lib/logger";
import { createResumeWithAuth } from '@/api/resumeApi';
import AuthModal from '@/components/SignUpModal';

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

      // Fetch profile name as fallback for resumes with no fullname set
      let profileName = '';
      try {
        const profile = await getProfile();
        profileName = profile.full_name || profile.username || '';
      } catch {
        // best-effort
      }

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
      const transformedData = transformResumeData(builder_resumes as unknown as ResumeResponse[], profileName);

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
  }, [router]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

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
      router.push("/templates");
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error("Please sign in to create a resume");
      } else {
        toast.error("Failed to create resume. Please try again.");
      }
      setIsCreating(false);
    }
  };

  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Page header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Resumes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage, analyze and optimize your resumes with AI</p>
          </div>

          {/* Add Resume button + dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddMenuOpen((v) => !v)}
              disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-md"
              style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)", boxShadow: "0 4px 14px rgba(37,87,167,0.35)" }}
            >
              {isCreating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
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
        <div className="px-8 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
            <div className="px-6 py-4 border-b border-gray-50 flex gap-8">
              {[180, 140, 80, 120, 120, 60].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
              ))}
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-6 px-6 py-4 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-36 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-2 w-24 rounded-full bg-gray-100 animate-pulse" />
                </div>
                <div className="w-28 h-2.5 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-24 h-2.5 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-24 h-2.5 rounded-full bg-gray-100 animate-pulse" />
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
      <div className="px-8 pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-6 py-3.5 bg-gray-50/50">Resume</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-6 py-3.5 bg-gray-50/50">Target Role</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-6 py-3.5 bg-gray-50/50">Score</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-6 py-3.5 bg-gray-50/50">Last Modified</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-6 py-3.5 bg-gray-50/50">Created</th>
                <th className="px-6 py-3.5 bg-gray-50/50" />
              </tr>
            </thead>
            <tbody>
              {resumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#e8f0fb,#c7d9f5)" }}>
                        <svg className="w-6 h-6 text-[#2557a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500">No resumes yet</p>
                      <p className="text-xs text-gray-400">Click <strong className="text-[#2557a7]">Add Resume</strong> to get started</p>
                    </div>
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
