"use client"
import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { toast } from 'sonner';
import { getAllResumesUnified, deleteResume as deleteResumeApi, downloadResume, getBuilderScore, ResumeResponse } from '@/api/resumeApi';
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

      // Fetch profile and resumes in parallel — profile is only a name fallback
      const [profileResult, resumesResult] = await Promise.allSettled([
        getProfile(),
        getAllResumesUnified(),
      ]);

      const profileName = profileResult.status === 'fulfilled'
        ? (profileResult.value.full_name || profileResult.value.username || '')
        : '';

      if (resumesResult.status === 'rejected') throw resumesResult.reason;
      const { builder_resumes, enhanced_resumes } = resumesResult.value;

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

      // Transform builder resumes and show list immediately
      const transformedData = transformResumeData(builder_resumes as unknown as ResumeResponse[], profileName);
      const merged = [...transformedData, ...transformedEnhanced];
      setResumes(merged);
      setLoading(false);

      // Load scores in the background — update each card as its score arrives
      transformedData.forEach(async (resume) => {
        try {
          const scoreData = await getBuilderScore(resume.id);
          if (scoreData.score > 0) {
            setResumes(prev =>
              prev.map(r => r.id === resume.id ? { ...r, score: scoreData.score } : r)
            );
          }
        } catch {
          // leave score as 0
        }
      });
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

  const builderCount  = resumes.filter(r => r.source !== 'enhanced').length;
  const enhancedCount = resumes.filter(r => r.source === 'enhanced').length;
  const scoredResumes = resumes.filter(r => r.score > 0);
  const avgScore = scoredResumes.length
    ? Math.round(scoredResumes.reduce((s, r) => s + r.score, 0) / scoredResumes.length)
    : null;

  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}>
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">My Resumes</h1>
                <p className="text-xs text-gray-400 mt-0.5">Manage, analyze and optimize your resumes with AI</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats pills */}
              {!loading && resumes.length > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  {builderCount > 0 && (
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full text-gray-600"
                      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
                      {builderCount} Builder
                    </span>
                  )}
                  {enhancedCount > 0 && (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(37,87,167,0.07)", color: "#1f4e98", border: "1px solid rgba(37,87,167,0.15)" }}>
                      ✦ {enhancedCount} Enhanced
                    </span>
                  )}
                  {avgScore !== null && (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{
                        background: avgScore >= 70 ? "#f0fdf4" : avgScore >= 40 ? "#eff6ff" : "#fef2f2",
                        color: avgScore >= 70 ? "#16a34a" : avgScore >= 40 ? "#2557a7" : "#dc2626",
                        border: `1px solid ${avgScore >= 70 ? "#bbf7d0" : avgScore >= 40 ? "#bfdbfe" : "#fecaca"}`,
                      }}>
                      Avg. {avgScore}% ATS
                    </span>
                  )}
                </div>
              )}

              {/* Add Resume */}
              <div className="relative">
                <button
                  onClick={() => setAddMenuOpen((v) => !v)}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)", boxShadow: "0 3px 10px rgba(37,87,167,0.3)" }}
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
        </div>
      </div>

      <UploadResumeModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />

      <div className="px-8 py-6">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <PageShell>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)" }}>
          <div className="px-6 py-3.5 border-b border-gray-50 flex gap-8 bg-gray-50/60">
            {[160, 130, 70, 110, 110].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-gray-200 animate-pulse" style={{ width: w }} />
            ))}
          </div>
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-5 px-6 py-4 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-32 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-2 w-16 rounded-full bg-gray-100 animate-pulse" />
              </div>
              <div className="w-24 h-6 rounded-lg bg-gray-100 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
              <div className="w-20 h-2 rounded-full bg-gray-100 animate-pulse" />
              <div className="w-20 h-2 rounded-full bg-gray-100 animate-pulse" />
              <div className="w-6 h-6 rounded-lg bg-gray-100 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-3">Resume</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-3">Target Role</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-3">ATS Score</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-3">Modified</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-3">Created</th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody>
            {resumes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#e8f0fb,#c7d9f5)" }}>
                      <svg className="w-5.5 h-5.5 text-[#2557a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" width={22} height={22}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No resumes yet</p>
                    <p className="text-xs text-gray-400">Click <strong className="text-[#2557a7] font-semibold">Add Resume</strong> to get started</p>
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

      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteResume(deleteConfirmId)}
        deleting={deleting}
      />

      <DownloadModal
        isOpen={downloadModalOpen && !!selectedResumeId}
        onClose={() => { setDownloadModalOpen(false); setSelectedResumeId(null); }}
        onDownload={(format) => selectedResumeId && handleDownloadResume(selectedResumeId, format)}
        downloading={downloading}
      />
    </PageShell>
  );
};

const ResumeListPage = () => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
      <div className="w-8 h-8 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
    </div>
  }>
    <ResumeListContent />
  </Suspense>
);

export default ResumeListPage;
