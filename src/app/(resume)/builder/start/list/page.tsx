"use client"
import { Plus } from 'lucide-react'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner';
import { getAllResumes, deleteResume as deleteResumeApi, downloadResume, getResumeScore, ResumeResponse } from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import { formatDateResume } from '@/utils/formatDateResume';
import AddResumeModal from '../_components/AddResumeModal';
import DeleteConfirmModal from '../_components/DeleteConfirmModal';
import DownloadModal from '../_components/DownloadModal';
import ResumeTableRow from '../_components/ResumeTableRow';
import { useRouter, useSearchParams } from 'next/navigation';

export interface Resume {
  id: string;
  initials: string;
  name: string;
  job: string;
  score: number;
  modified: string;
  created: string;
  createdAt: string; // ✅ Raw timestamp for dynamic formatting
  updatedAt: string; // ✅ Raw timestamp for dynamic formatting
  primary: boolean;
}

const ResumeListPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

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
      console.log('📋 Resume data from backend:', {
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
      const role = item.work_experience?.[0]?.role || 'No Job Title';

      return {
        id: item.id,
        initials: getInitials(name),
        name: name,
        job: role,
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

      // ✅ Fetch user profile to use as fallback for resume names
      let userProfile;
      try {
        userProfile = await getProfile();
        console.log('👤 User profile fetched:', userProfile?.full_name);
      } catch (profileError) {
        console.warn('⚠️ Could not fetch user profile:', profileError);
      }

      // ✅ No manual token check needed - httpClient sends cookies automatically
      // ✅ If not authenticated, API will return 401 (handled in catch block)
      const data = await getAllResumes();

      // If no resumes, redirect to start page
      if (!data || data.length === 0) {
        router.push('/builder/start');
        return;
      }

      // ✅ Pass user profile to transform function for fallback
      const transformedData = transformResumeData(data, userProfile?.full_name);

      // Fetch scores for each resume
      const resumesWithScores = await Promise.all(
        transformedData.map(async (resume) => {
          try {
            const scoreData = await getResumeScore(resume.id);
            return {
              ...resume,
              score: scoreData.overall_score,
            };
          } catch (error) {
            return resume;
          }
        })
      );

      setResumes(resumesWithScores);

      // ✅ Clean URL by removing refresh parameter after successful fetch
      if (refreshParam) {
        router.replace('/builder/start/list', { scroll: false });
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.message?.includes("sign in")) {
        toast.error("Session expired. Please log in again");
      } else if (err.message?.includes("not found")) {
        toast.error("API endpoint not configured correctly");
      } else {
        toast.error(err.response?.data?.detail || err.message || "Failed to fetch resumes");
      }

      router.push('/builder/start');
    } finally {
      setLoading(false);
    }
  }, [router, refreshParam]);

  useEffect(() => {
    console.log('🔄 Fetching resumes... (refresh param:', refreshParam, ')');
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

      // If no resumes left, redirect to start page
      if (updatedResumes.length === 0) {
        router.push('/builder/start');
      }

      setDeleteConfirmId(null);
      setIsDropdownOpen(null);

    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to delete this resume");
      } else if (err.response?.status === 404) {
        toast.error("Resume not found");
      } else {
        toast.error(err.response?.data?.detail || err.message || "Failed to delete resume");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadResume = async (resumeId: string, format: 'pdf' | 'docx') => {
    try {
      setDownloading(true);

      // ✅ No manual token check needed - httpClient sends cookies automatically
      const blob = await downloadResume(resumeId, format);

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
      setIsDropdownOpen(null);

    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to download this resume");
      } else if (err.response?.status === 404) {
        toast.error("Resume not found");
      } else {
        toast.error(err.response?.data?.detail || err.message || "Failed to download resume");
      }
    } finally {
      setDownloading(false);
    }
  };

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
                  <span className="text-gray-600">Loading resumes...</span>
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
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsModalOpen(!isModalOpen)}
                  className="rounded-lg flex items-center gap-2 cursor-pointer bg-[#2200ff]/70 text-white px-4 py-2.5 hover:bg-[#2200ff]/90 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Resume</span>
                </button>

                <AddResumeModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                />
              </div>
            </div>

            <div className="bg-white w-full rounded-2xl border border-gray-200">
              <table className="w-full rounded-lg">
                <thead className="bg-white text-sm text-gray-600">
                  <tr className="text-left">
                    <th className="p-4">Resume</th>
                    {/* <th className="p-4">Target Job Title</th> */}
                    <th className="p-4">Resume Score</th>
                    <th className="p-4">Last Modified</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((resume, i) => (
                    <ResumeTableRow
                      key={resume.id}
                      resume={resume}
                      index={i}
                      isDropdownOpen={isDropdownOpen === i}
                      onToggleDropdown={() => setIsDropdownOpen(isDropdownOpen === i ? null : i)}
                      onDelete={() => {
                        setDeleteConfirmId(resume.id);
                        setIsDropdownOpen(null);
                      }}
                      onDownload={() => {
                        setSelectedResumeId(resume.id);
                        setDownloadModalOpen(true);
                        setIsDropdownOpen(null);
                      }}
                      downloading={downloading}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
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
    </div>
  );
};

export default ResumeListPage;
