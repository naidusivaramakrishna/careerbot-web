"use client"
import { Plus } from 'lucide-react'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner';
import { getAllResumes, deleteResume as deleteResumeApi, downloadResume, getResumeScore, ResumeResponse } from '@/api/resumeApi';
import { formatDateResume } from '@/utils/formatDateResume';
import AddResumeModal from './_components/AddResumeModal';
import DeleteConfirmModal from './_components/DeleteConfirmModal';
import DownloadModal from './_components/DownloadModal';
import EmptyState from './_components/EmptyState';
import ResumeTableRow from './_components/ResumeTableRow';
import { logger } from '@/lib/logger';

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
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const transformResumeData = (backendData: ResumeResponse[]): Resume[] => {
    return backendData.map((item) => {
      const name = item.personalInfo?.fullName || 'Unknown';
      const role = item.work_experience?.[0]?.role || 'No Job Title';

      return {
        id: item.id,
        initials: getInitials(name),
        name: name,
        job: role,
        score: 0, // ✅ Will be fetched from getResumeScore separately
        modified: formatDateResume(item.updatedAt),
        created: formatDateResume(item.createdAt),
        primary: false,
      };
    });
  };

  // ✅ Updated fetchResumes to also fetch scores
  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);
      logger.info("Fetching resumes from ResumePage");
      const data = await getAllResumes();
      logger.debug("Resumes fetched successfully", { count: data.length });
      
      const transformedData = transformResumeData(data);
      
      // ✅ Fetch scores for each resume
      logger.info("Fetching scores for all resumes");
      const resumesWithScores = await Promise.all(
        transformedData.map(async (resume) => {
          try {
            const scoreData = await getResumeScore(resume.id);
            logger.debug(`Score for ${resume.name}: ${scoreData.overall_score}`);
            
            return {
              ...resume,
              score: scoreData.overall_score, // ✅ Use score from Score API
            };
          } catch (error) {
            logger.error(`Failed to fetch score for ${resume.name}:`, error);
            // Keep score as 0 if fetch fails
            return resume;
          }
        })
      );

      setResumes(resumesWithScores);

      if (resumesWithScores.length === 0) {
        logger.warn("No resumes found");
        toast.info("No resumes found. Create your first resume!");
      } else {
        logger.info(`Loaded ${resumesWithScores.length} resume(s) with scores`);
      }
    } catch (err: any) {
      logger.error('Error fetching resumes:', err);

      if (err.response?.status === 401 || err.message?.includes("sign in")) {
        toast.error("Session expired. Please log in again");
      } else if (err.message?.includes("not found")) {
        toast.error("API endpoint not configured correctly");
      } else {
        toast.error(err.response?.data?.detail || err.message || "Failed to fetch resumes");
      }
      
      setResumes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleDeleteResume = async (resumeId: string) => {
    try {
      logger.warn(`Deleting resume: ${resumeId}`);
      setDeleting(true);
      await deleteResumeApi(resumeId);
      setResumes(prevResumes => prevResumes.filter(r => r.id !== resumeId));
      toast.success("Resume deleted successfully");
      logger.info(`Resume deleted successfully: ${resumeId}`);

      setDeleteConfirmId(null);
      setIsDropdownOpen(null);

    } catch (err: any) {
      logger.error(`Error deleting resume: ${resumeId}`, err);

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
      logger.info(`Downloading resume: ${resumeId} as ${format}`);
      setDownloading(true);
      // ✅ httpOnly cookies sent automatically by httpClient with withCredentials
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
      logger.info(`Resume downloaded successfully: ${resumeId}`);
      setDownloadModalOpen(false);
      setIsDropdownOpen(null);

    } catch (err: any) {
      logger.error(`Error downloading resume: ${resumeId}`, err);

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

  return (
    <div>
      <h1 className="text-2xl font-bold">RESUME</h1>
      <div className="min-h-screen bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
        <main className="flex-1 p-8">
          <div className="rounded-2xl my-4 relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">Resume Management</h1>
                <p className="text-sm text-gray-600">
                  Manage, analyze and optimize your resumes with AI
                </p>
              </div>
              {resumes.length > 0 && (
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
              )}
            </div>

            {resumes.length > 0 && loading ? (
              <div className="bg-white w-full rounded-2xl border border-gray-200 p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading resumes...</span>
                </div>
              </div>
            ) : resumes.length === 0 ? (
              <EmptyState selected={selected} onSelect={setSelected} />
            ) : (
              <div className="bg-white w-full rounded-2xl border border-gray-200">
                <table className="w-full rounded-lg">
                  <thead className="bg-white text-sm text-gray-600">
                    <tr className="text-left">
                      <th className="p-4">Resume</th>
                      <th className="p-4">Target Job Title</th>
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
            )}
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

export default ResumePage;




// "use client"
// import { Plus } from 'lucide-react'
// import React, { useEffect, useRef, useState, useCallback } from 'react'
// import { toast } from 'sonner';
// import { getAllResumes, deleteResume as deleteResumeApi, downloadResume, ResumeResponse } from '@/api/resumeApi';
// import { formatDateResume } from '@/utils/formatDateResume';
// import AddResumeModal from './_components/AddResumeModal';
// import DeleteConfirmModal from './_components/DeleteConfirmModal';
// import DownloadModal from './_components/DownloadModal';
// import ResumeProgressBar from './_components/ResumeProgressBar';
// import EmptyState from './_components/EmptyState';
// import ResumeTableRow from './_components/ResumeTableRow';
// import axios from 'axios';

// export interface Resume {
//   id: string;
//   initials: string;
//   name: string;
//   job: string;
//   score: number;
//   modified: string;
//   created: string;
//   primary: boolean;
// }

// const ResumePage = () => {
//   const [resumes, setResumes] = useState<Resume[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [isDropdownOpen, setIsDropdownOpen] = useState<number | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
//   const [deleting, setDeleting] = useState(false);
//   const [downloading, setDownloading] = useState(false);
//   const [downloadModalOpen, setDownloadModalOpen] = useState(false);
//   const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
//   const [selected, setSelected] = useState<string | null>(null);

//   const buttonRef = useRef<HTMLButtonElement>(null);

//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const transformResumeData = (backendData: ResumeResponse[]): Resume[] => {
//     return backendData.map((item) => {
//       const name = item.personalInfo?.name || 'Unknown';
//       const role = item.work_experience?.[0]?.role || 'No Job Title';

//       return {
//         id: item.id,
//         initials: getInitials(name),
//         name: name,
//         job: role,
//         score: item.builder_score?.score || 0,
//         modified: formatDateResume(item.updatedAt),
//         created: formatDateResume(item.createdAt),
//         primary: false,
//       };
//     });
//   };

//   // ✅ Use useCallback to prevent recreation on every render
//   const fetchResumes = useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("access_token");

//       if (!token) {
//         toast.error("Please log in first");
//         setLoading(false);
//         return;
//       }

//       console.log("📥 Fetching resumes...");
//       const data = await getAllResumes();
//       console.log("📊 Fetched resume data:", data);
      
//       const transformedData = transformResumeData(data);
//       console.log("🔄 Transformed data:", transformedData);
      
//       setResumes(transformedData);

//       if (transformedData.length === 0) {
//         console.log("ℹ️ No resumes found");
//       } else {
//         console.log(`✅ ${transformedData.length} resume(s) loaded`);
//       }
//     } catch (err: unknown) {
//       logger.error('Error fetching resumes:', err);

//       if (axios.isAxiosError(err)) {
//         if (err.response?.status === 401) {
//           toast.error("Session expired. Please log in again");
//         } else {
//           toast.error(err.response?.data?.detail || err.message || "Failed to fetch resumes");
//         }
//       } else if (err instanceof Error) {
//         toast.error(err.message || "Failed to fetch resumes");
//       } else {
//         toast.error("An unexpected error occurred");
//       }
      
//       setResumes([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchResumes();
//   }, [fetchResumes]);

//   const handleDeleteResume = async (resumeId: string) => {
//     try {
//       setDeleting(true);
//       const token = localStorage.getItem("access_token");

//       if (!token) {
//         toast.error("Please log in first");
//         setDeleteConfirmId(null);
//         return;
//       }

//       await deleteResumeApi(resumeId);
//       setResumes(prevResumes => prevResumes.filter(r => r.id !== resumeId));
//       toast.success("Resume deleted successfully");

//       setDeleteConfirmId(null);
//       setIsDropdownOpen(null);

//     } catch (err: unknown) {
//       console.error('Error deleting resume:', err);

//       if (axios.isAxiosError(err)) {
//         if (err.response?.status === 401) {
//           toast.error("Session expired. Please log in again");
//         } else if (err.response?.status === 403) {
//           toast.error("You don't have permission to delete this resume");
//         } else if (err.response?.status === 404) {
//           toast.error("Resume not found");
//         } else {
//           toast.error(err.response?.data?.detail || err.message || "Failed to delete resume");
//         }
//       } else if (err instanceof Error) {
//         toast.error(err.message || "Failed to delete resume");
//       } else {
//         toast.error("An unexpected error occurred");
//       }
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleDownloadResume = async (resumeId: string, format: 'pdf' | 'docx') => {
//     try {
//       setDownloading(true);
//       const token = localStorage.getItem("access_token");

//       if (!token) {
//         toast.error("Please log in first");
//         return;
//       }

//       await downloadResume(resumeId, format as 'pdf' | 'doc');

//       toast.success(`Resume downloaded as ${format.toUpperCase()}`);
//       setDownloadModalOpen(false);
//       setIsDropdownOpen(null);

//     } catch (err: unknown) {
//       console.error('Error downloading resume:', err);

//       if (axios.isAxiosError(err)) {
//         if (err.response?.status === 401) {
//           toast.error("Session expired. Please log in again");
//         } else if (err.response?.status === 403) {
//           toast.error("You don't have permission to download this resume");
//         } else if (err.response?.status === 404) {
//           toast.error("Resume not found");
//         } else {
//           toast.error(err.response?.data?.detail || err.message || "Failed to download resume");
//         }
//       } else if (err instanceof Error) {
//         toast.error(err.message || "Failed to download resume");
//       } else {
//         toast.error("An unexpected error occurred");
//       }
//     } finally {
//       setDownloading(false);
//     }
//   };

//   // ✅ Show loading spinner while fetching
//   if (loading) {
//     return (
//       <div>
//         <h1 className="text-2xl font-bold">RESUME</h1>
//         <div className="min-h-screen bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
//           <main className="flex-1 p-8">
//             <div className="rounded-2xl my-4">
//               <div className="flex justify-between items-start mb-6">
//                 <div>
//                   <h1 className="text-2xl font-bold">Resume Management</h1>
//                   <p className="text-sm text-gray-600">
//                     Manage, analyze and optimize your resumes with AI
//                   </p>
//                 </div>
//               </div>
//               <div className="bg-white w-full rounded-2xl border border-gray-200 p-8 text-center">
//                 <div className="flex items-center justify-center gap-2">
//                   <div className="w-4 h-4 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin"></div>
//                   <span className="text-gray-600">Loading resumes...</span>
//                 </div>
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   // ✅ Show empty state if no resumes
//   if (resumes.length === 0) {
//     return (
//       <div>
//         <h1 className="text-2xl font-bold">RESUME</h1>
//         <div className="min-h-screen bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
//           <main className="flex-1 p-8">
//             <div className="rounded-2xl my-4">
//               <div className="flex justify-between items-start mb-6">
//                 <div>
//                   <h1 className="text-2xl font-bold">Resume Management</h1>
//                   <p className="text-sm text-gray-600">
//                     Manage, analyze and optimize your resumes with AI
//                   </p>
//                 </div>
//               </div>
//               <EmptyState selected={selected} onSelect={setSelected} />
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   // ✅ Show resume management table when resumes exist
//   return (
//     <div>
//       <h1 className="text-2xl font-bold">RESUME</h1>
//       <div className="min-h-screen bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
//         <main className="flex-1 p-8">
//           <div className="rounded-2xl my-4 relative">
//             <div className="flex justify-between items-start mb-6">
//               <div>
//                 <h1 className="text-2xl font-bold">Resume Management</h1>
//                 <p className="text-sm text-gray-600">
//                   Manage, analyze and optimize your resumes with AI
//                 </p>
//               </div>
//               <div className="relative">
//                 <button
//                   ref={buttonRef}
//                   onClick={() => setIsModalOpen(!isModalOpen)}
//                   className="rounded-lg flex items-center gap-2 cursor-pointer bg-[#2200ff]/70 text-white px-4 py-2.5 hover:bg-[#2200ff]/90 text-sm"
//                 >
//                   <Plus className="h-4 w-4" />
//                   <span>Add Resume</span>
//                 </button>

//                 <AddResumeModal
//                   isOpen={isModalOpen}
//                   onClose={() => setIsModalOpen(false)}
//                 />
//               </div>
//             </div>

//             <ResumeProgressBar count={resumes.length} total={5} />

//             <div className="bg-white w-full rounded-2xl border border-gray-200">
//               <table className="w-full rounded-lg">
//                 <thead className="bg-white text-sm text-gray-600">
//                   <tr className="text-left">
//                     <th className="p-4">Resume</th>
//                     <th className="p-4">Target Job Title</th>
//                     <th className="p-4">Resume Score</th>
//                     <th className="p-4">Last Modified</th>
//                     <th className="p-4">Created</th>
//                     <th className="p-4">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {resumes.map((resume, i) => (
//                     <ResumeTableRow
//                       key={resume.id}
//                       resume={resume}
//                       index={i}
//                       isDropdownOpen={isDropdownOpen === i}
//                       onToggleDropdown={() => setIsDropdownOpen(isDropdownOpen === i ? null : i)}
//                       onDelete={() => {
//                         setDeleteConfirmId(resume.id);
//                         setIsDropdownOpen(null);
//                       }}
//                       onDownload={() => {
//                         setSelectedResumeId(resume.id);
//                         setDownloadModalOpen(true);
//                         setIsDropdownOpen(null);
//                       }}
//                       downloading={downloading}
//                     />
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </main>
//       </div>

//       <DeleteConfirmModal
//         isOpen={!!deleteConfirmId}
//         onClose={() => setDeleteConfirmId(null)}
//         onConfirm={() => deleteConfirmId && handleDeleteResume(deleteConfirmId)}
//         deleting={deleting}
//       />

//       <DownloadModal
//         isOpen={downloadModalOpen && !!selectedResumeId}
//         onClose={() => {
//           setDownloadModalOpen(false);
//           setSelectedResumeId(null);
//         }}
//         onDownload={(format) => selectedResumeId && handleDownloadResume(selectedResumeId, format)}
//         downloading={downloading}
//       />
//     </div>
//   );
// };

// export default ResumePage;
