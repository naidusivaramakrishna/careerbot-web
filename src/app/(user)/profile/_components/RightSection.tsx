"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mapResumeToProfile } from "../_utils/resumeMapper";
import { logger } from "@/lib/logger";

import {
    updateProfile,
    getEducation,
    getExperience,
    getSkills,
    deleteExperience,
    deleteSkill,
    deleteEducation,
    getProjects,
    deleteProject,
    addEducationAutoFill,
    addExperienceAutoFill,
    addSkillAutoFill,
    addProjectAutoFill,
    getCertification,
    deleteCertification,
    addCertificationAutoFill
} from "@/api/userApi";

import { useProfileContext } from '../context/ProfileContext'
import { ResumeExtractResponse, extractResume } from "@/api/resumeParsingApi";
import { useDashboard } from "@/contexts/DashboardContext";
import { Crown, MessageSquare, Upload, User, CheckCircle } from "lucide-react";
import { importLinkedInProfile } from "@/api/linkedinParsingApi";
import { mapLinkedinToProfile } from "../_utils/linkedinMapper";
import LinkedinImportModal from "./LinkedinImportModal";

interface RightSectionProps {
    completeness: number;
    missingFields: string[];
}

const RightSection = ({ completeness, missingFields }: RightSectionProps) => {
    const router = useRouter();
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const completionPercentage = completeness;
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);

    // Determine status based on completeness
    const getStatus = () => {
        if (completionPercentage === 100) {
            return {
                label: 'Complete!',
                color: 'text-green-600',
                ringColor: 'stroke-green-500',
                bgColor: 'bg-green-50',
                icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            };
        }
        if (completionPercentage >= 80) {
            return {
                label: 'Almost There!',
                color: 'text-blue-600',
                ringColor: 'stroke-blue-500',
                bgColor: 'bg-blue-50',
                icon: <User className="w-5 h-5 text-blue-600" />,
            };
        }
        if (completionPercentage >= 60) {
            return {
                label: 'Good Progress',
                color: 'text-yellow-600',
                ringColor: 'stroke-yellow-500',
                bgColor: 'bg-yellow-50',
                icon: <User className="w-5 h-5 text-yellow-600" />,
            };
        }
        if (completionPercentage >= 30) {
            return {
                label: 'Getting Started',
                color: 'text-orange-600',
                ringColor: 'stroke-orange-500',
                bgColor: 'bg-orange-50',
                icon: <User className="w-5 h-5 text-orange-600" />,
            };
        }
        return {
            label: 'Just Started',
            color: 'text-gray-600',
            ringColor: 'stroke-gray-400',
            bgColor: 'bg-gray-50',
            icon: <User className="w-5 h-5 text-gray-600" />,
        };
    };

    const status = getStatus();

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
        ]
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please upload a PDF or DOCX file")
            return
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size should be less than 10MB")
            return
        }

        try {
            setUploading(true)
            toast.loading("Uploading and parsing your resume...", { id: "resume-upload" })

            // =====================================================
            // 1️⃣ DELETE old data before adding newly imported data
            // =====================================================

            // DELETE EDUCATION
            try {
                const existingEducation = await getEducation();
                for (const edu of existingEducation) {
                    if (edu.id) await deleteEducation(edu.id);
                }
            } catch (err) {
                logger.warn("Error deleting education:", err);
            }

            // DELETE EXPERIENCE
            try {
                const existingExperience = await getExperience();
                for (const exp of existingExperience) {
                    if (exp.id) await deleteExperience(exp.id);
                }
            } catch (err) {
                logger.warn("Error deleting experience:", err);
            }

            // DELETE SKILLS
            try {
                const existingSkills = await getSkills();
                for (const skill of existingSkills) {
                    if (skill.id) await deleteSkill(skill.id);
                }
            } catch (err) {
                logger.warn("Error deleting skills:", err);
            }

            // DELETE PROJECTS
            try {
                const existingProjects = await getProjects();
                for (const project of existingProjects) {
                    await deleteProject(project.id!);
                }
            } catch (err) {
                logger.warn("Error deleting projects:", err);
            }

            // DELETE CERTIFICATIONS
            try {
                const existingCertifications = await getCertification();
                for (const cert of existingCertifications) {
                    if (cert.id) await deleteCertification(cert.id);
                }
            } catch (err) {
                logger.warn("Error deleting certifications:", err);
            }

            // 1️⃣ Extract resume
            const result: ResumeExtractResponse = await extractResume(file);

            // 2️⃣ Map to ProfileData format
            const mapped = mapResumeToProfile(result);

            // Ensure mapped is defined
            if (!mapped) {
                throw new Error('Failed to parse resume data');
            }

            // ---------------------------------------
            // 3️⃣ UPDATE PERSONAL INFO IN DB
            // ---------------------------------------
            if (mapped?.personalInformation) {
                const personalPayload = {
                    full_name: mapped.personalInformation.fullName,
                    email: mapped.personalInformation.email,
                    phone_number: mapped.personalInformation.phone,
                    headline: mapped.personalInformation.headline || "Software developer",
                    location: mapped.personalInformation.location,
                    linkedin_url: mapped.personalInformation.linkedin,
                    github_url: mapped.personalInformation.github,
                    summary: mapped.personalInformation.summary,
                };

                await updateProfile(personalPayload);
            }

            // ---------------------------------------
            // 4️⃣ STORE EDUCATION IN DB
            // ---------------------------------------
            if (mapped.education?.length) {
                for (const edu of mapped.education) {
                    await addEducationAutoFill({
                        institution: edu.institution || '',
                        degree: edu.degree || '',
                        stream: edu.stream || '',
                        cgpa: edu.cgpa,
                        start_date: edu.start_date || '',
                        end_date: edu.end_date,
                    });
                }
            }

            // ---------------------------------------
            // 5️⃣ STORE EXPERIENCE IN DB
            // ---------------------------------------
            if (mapped.workExperience?.length) {
                for (const exp of mapped.workExperience) {
                    await addExperienceAutoFill({
                        job_title: exp.job_title || '',
                        company: exp.company || '',
                        job_type: "full_time",
                        location: exp.location || "India",
                        start_date: exp.start_date || '',
                        end_date: exp.end_date,
                        description: exp.description,
                    });
                }
            }

            // ---------------------------------------
            // 6️⃣ STORE SKILLS IN DB
            // ---------------------------------------
            if (mapped.skills?.length) {
                for (const skill of mapped.skills) {
                    await addSkillAutoFill({ name: skill });
                }
            }

            // ---------------------------------------
            // 7️⃣ STORE PROJECTS IN DB
            // ---------------------------------------
            if (mapped.projects?.length) {
                for (const project of mapped.projects) {
                    await addProjectAutoFill({
                        project_name: project.project_name,
                        role: project.role,
                        technologies: project.technologies || '',
                        start_date: project.start_date || '',
                        end_date: project.end_date,
                        description: project.description,
                        project_link: project.project_link,
                    });
                }
            }

            // ---------------------------------------
            // 8️⃣ STORE CERTIFICATIONS IN DB
            // ---------------------------------------
            if (mapped.certifications?.length) {
                for (const cert of mapped.certifications) {
                    await addCertificationAutoFill({
                        certification_name: cert.certification_name || '',
                        issuer: cert.issuer || '',
                        start_date: cert.start_date || '',
                        end_date: cert.end_date,
                    });
                }
            }

            // 🔄 1️⃣0️⃣ RE-FETCH UPDATED DATA FROM DB
            const [fetchedEducation, updatedExp, updatedSkills, updatedProjects, updatedCertifications] = await Promise.all([
                getEducation(),
                getExperience(),
                getSkills(),
                getProjects(),
                getCertification(),
            ]);

            // ✅ FIRST: Update profile context with all new data BEFORE refreshing dashboard
            // This prevents multiple re-renders and toast notifications

            // ✅ SORT EDUCATION BY RECENCY (most recent first)
            // First maintain resume order from mapped.education, then sort by end_date
            const educationOrder = new Map(
                (mapped?.education || []).map((edu, index) => [
                    `${edu?.institution || ''}|${edu?.degree || ''}`,
                    index
                ]) || []
            );

            const updatedEducation = [...(fetchedEducation || [])].sort((a, b) => {
                const aKey = `${a?.institution || ''}|${a?.degree || ''}`;
                const bKey = `${b?.institution || ''}|${b?.degree || ''}`;
                const aIndex = educationOrder.get(aKey) ?? Infinity;
                const bIndex = educationOrder.get(bKey) ?? Infinity;

                // If both have indices from mapped education, maintain that order
                if (aIndex !== Infinity && bIndex !== Infinity) {
                    return aIndex - bIndex;
                }

                // Otherwise sort by end_date (most recent first)
                if (!a?.end_date && !b?.end_date) return 0;
                if (!a?.end_date) return -1; // Ongoing education first
                if (!b?.end_date) return 1;
                return new Date(b?.end_date || '').getTime() - new Date(a?.end_date || '').getTime();
            });

            // ---------------------------------------
            // 9️⃣ UPDATE CONTEXT → UI auto-fills
            // ---------------------------------------
            setProfileData((prev) => ({
                ...prev,
                personalInformation: {
                    ...prev?.personalInformation,
                    ...(mapped?.personalInformation || {}),
                },
                education: updatedEducation,
                workExperience: updatedExp || [],
                skills: (updatedSkills || []).map((s) => s?.name || ''),
                projects: (updatedProjects || []).map((p) => ({
                    id: p?.id,
                    project_name: p?.project_name || '',
                    role: p?.role || '',
                    technologies: p?.technologies || '',
                    start_date: p?.start_date || '',
                    end_date: p?.end_date || '',
                    description: p?.description || '',
                    project_link: p?.project_link || '',
                })),
                certifications: updatedCertifications || [],
            }));

            toast.success("Resume imported successfully!", { id: "resume-upload" });

            // ✅ FINAL: Refresh dashboard AFTER all profile updates complete
            // Use setTimeout to ensure profile context has updated first
            setTimeout(() => {
                refreshDashboard();
            }, 100);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error("Error during resume import:", errorMessage, err);
            toast.error(errorMessage || "Failed to extract resume", { id: "resume-upload" });
        } finally {
            setUploading(false);
        }
    };

    const handleLinkedInImport = async (url: string) => {

        try {
            toast.loading("Fetching and parsing LinkedIn data...", { id: "linkedin-import" });


            const res = await importLinkedInProfile({
                linkedin_url: url,
                merge_strategy: "merge"
            });

            // =====================================================
            // 1️⃣ DELETE old data before adding newly imported data
            // =====================================================

            // DELETE EDUCATION
            try {
                const existingEducation = await getEducation();
                for (const edu of existingEducation) {
                    if (edu.id) await deleteEducation(edu.id);
                }
            } catch (err) {
                logger.warn("Error deleting education:", err);
            }

            // DELETE EXPERIENCE
            try {
                const existingExperience = await getExperience();
                for (const exp of existingExperience) {
                    if (exp.id) await deleteExperience(exp.id);
                }
            } catch (err) {
                logger.warn("Error deleting experience:", err);
            }

            // DELETE SKILLS
            try {
                const existingSkills = await getSkills();
                for (const skill of existingSkills) {
                    if (skill.id) await deleteSkill(skill.id);
                }
            } catch (err) {
                logger.warn("Error deleting skills:", err);
            }

            // DELETE PROJECTS
            try {
                const existingProjects = await getProjects();
                for (const project of existingProjects) {
                    await deleteProject(project.id!);
                }
            } catch (err) {
                logger.warn("Error deleting projects:", err);
            }

            const mapped = mapLinkedinToProfile(res);

            // Ensure mapped is defined
            if (!mapped) {
                throw new Error('Failed to parse LinkedIn data');
            }

            // -------------------------------
            // 1️⃣ UPDATE PERSONAL INFO
            // -------------------------------
            if (mapped?.personalInformation) {
                await updateProfile({
                    full_name: mapped.personalInformation.fullName,
                    email: mapped.personalInformation.email,
                    phone_number: mapped.personalInformation.phone,
                    location: mapped.personalInformation.location,
                    headline: "Software Developer",
                    linkedin_url: mapped.personalInformation.linkedin,
                    github_url: mapped.personalInformation.github,
                    summary: mapped.personalInformation.summary
                });
            }

            // -------------------------------
            // 2️⃣ EDUCATION
            // -------------------------------
            if (mapped.education?.length) {
                for (const edu of mapped.education) {
                    await addEducationAutoFill({
                        institution: edu.institution || '',
                        degree: edu.degree || '',
                        stream: edu.stream || "",
                        cgpa: edu.cgpa,
                        start_date: edu.start_date || '',
                        end_date: edu.end_date,
                    });
                }
            }

            // -------------------------------
            // 3️⃣ EXPERIENCE
            // -------------------------------
            if (mapped.workExperience?.length) {
                for (const exp of mapped.workExperience) {
                    await addExperienceAutoFill({
                        job_title: exp.job_title || '',
                        company: exp.company || '',
                        job_type: exp.job_type || 'full_time',
                        location: exp.location || '',
                        start_date: exp.start_date || '',
                        end_date: exp.end_date,
                        description: exp.description,
                    });
                }
            }

            // -------------------------------
            // 4️⃣ SKILLS
            // -------------------------------
            if (mapped.skills?.length) {
                for (const skill of mapped.skills) {
                    await addSkillAutoFill({ name: skill });
                }
            }

            // -------------------------------
            // 5️⃣ PROJECTS
            // -------------------------------
            if (mapped.projects?.length) {
                for (const project of mapped.projects) {
                    await addProjectAutoFill({
                        project_name: project.project_name,
                        role: project.role,
                        technologies: project.technologies || '',
                        start_date: project.start_date || '',
                        end_date: project.end_date,
                        description: project.description,
                        project_link: project.project_link,
                    });
                }
            }

            // -------------------------------
            // 6️⃣ RELOAD DATA
            // -------------------------------
            const [updatedEducation, updatedExp, updatedSkills, updatedProjects] = await Promise.all([
                getEducation(),
                getExperience(),
                getSkills(),
                getProjects(),
            ]);

            setProfileData((prev) => ({
                ...prev,
                personalInformation: {
                    ...prev?.personalInformation,
                    ...(mapped?.personalInformation || {}),
                },
                education: updatedEducation || [],
                workExperience: updatedExp || [],
                skills: (updatedSkills || []).map((s) => s?.name || ''),
                projects: (updatedProjects || []).map((p) => ({
                    id: p?.id,
                    project_name: p?.project_name || '',
                    role: p?.role || '',
                    technologies: p?.technologies || '',
                    start_date: p?.start_date || '',
                    end_date: p?.end_date || '',
                    description: p?.description || '',
                    project_link: p?.project_link || '',
                })),
            }));

            toast.success("LinkedIn imported successfully!", { id: "linkedin-import" });

            // ✅ FINAL: Refresh dashboard AFTER all profile updates complete
            // Use setTimeout to ensure profile context has updated first
            setTimeout(() => {
                refreshDashboard();
            }, 100);

        } catch (error) {
            logger.error("Error during LinkedIn import:", error);
            toast.error("Failed to import LinkedIn data", { id: "linkedin-import" });
        }
    };


    return (
        <div className='flex-1 w-1/5'>
            <div className="flex flex-col justify-center">
                <div className="bg-white p-4 rounded-xl my-4 shadow-sm">
                    <h3 className='my-4 font-semibold text-lg'>Quick Actions</h3>
                    <h3 className='my-4 text-sm'>Auto fill your profile within seconds.</h3>

                    {/* Upload Resume */}
                    <div className='flex flex-col gap-2 mt-2'>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc"
                            onChange={handleResumeUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`flex items-center gap-2 border p-2 bg-[#F9F9FA] border-gray-400 hover:bg-[#e8eff9] hover:text-[#2557a7] rounded-lg ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                                    <span className='text-sm'>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className='w-4 h-4' />
                                    <span className='text-sm'>Upload Resume</span>
                                </>
                            )}
                        </div>
                    </div>
                    {/* <div className='flex flex-col gap-2 mt-2'>
                        <div
                            className='flex items-center cursor-pointer gap-2 border p-2 bg-[#F9F9FA] border-gray-400 hover:bg-[#e8eff9] hover:text-[#2557a7] rounded-lg'
                            onClick={() => setLinkedinModalOpen(true)}
                        >
                            <Image src="/assets/icons/linkedin-icon.svg" alt='linkedin-icon' className='w-4 h-4' width={16} height={16} />
                            <span className='text-sm'>Import from Linkedin</span>
                        </div>
                    </div> */}
                </div>
                {/* Profile Completion Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow my-3">
                    {/* Header */}
                    <div className="flex flex-col items-center justify-between mb-4">
                        <p className="text-sm font-semibold">Profile Completeness</p>
                        <span className={`text-xs font-semibold ${status.color} my-2 px-2 py-1 ${status.bgColor} rounded-full`}>
                            {status.label}
                        </span>
                    </div>

                    {/* Progress Circle and Missing Fields */}
                    <div className="flex flex-col items-center gap-6">
                        {/* Circular Progress */}
                        <div className="relative shrink-0">
                            <svg className="w-20 h-20 transform -rotate-90">
                                {/* Background circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    className={status.ringColor}
                                    style={{
                                        strokeDasharray: `${2 * Math.PI * 32}`,
                                        strokeDashoffset: `${2 * Math.PI * 32 * (1 - completionPercentage / 100)}`,
                                        transition: 'stroke-dashoffset 0.5s ease-out',
                                    }}
                                />
                            </svg>
                            {/* Percentage */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">{completionPercentage}%</span>
                            </div>
                        </div>

                        {/* Missing Fields */}
                        <div className="flex-1">
                            {missingFields.length > 0 ? (
                                <>
                                    <p className="text-xs text-gray-500 mb-2">Still missing:</p>
                                    <ul className="space-y-1">
                                        {missingFields.slice(0, 3).map((field) => (
                                            <li key={field} className="text-sm text-gray-700 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                                {field}
                                            </li>
                                        ))}
                                        {missingFields.length > 3 && (
                                            <li className="text-xs text-gray-500">
                                                +{missingFields.length - 3} more
                                            </li>
                                        )}
                                    </ul>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <p className="text-sm font-medium">All fields complete!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl border border-[#2200FF33]/20 my-4 shadow bg-[#DAD5F9]">
                    <div className='w-14 h-14 text-white rounded-full flex items-center justify-center bg-linear-to-r from-[#2200FF] to-[#1800B3]'>
                        <Crown className='w-8 h-8' />
                    </div>
                    <h3 className='my-4 font-semibold text-lg'>Upgrade Your Plan</h3>
                    <p className='text-center text-[#818798] text-sm'>Get unlimited ats scans, job applications, AI resume optimization, and priority support.</p>
                    <button onClick={() => router.push('/pricing')} className='rounded-lg my-4 text-sm text-white border border-neutral-200 gap-2 cursor-pointer bg-linear-to-r from-[#2200FF] to-[#1800B3] w-full px-4 py-2.5'>
                        <span>Upgrade Now</span>
                    </button>
                    <p className='text-sm text-[#818798]'>30 day money back guarantee</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl my-4 shadow bg-white">
                    <MessageSquare className='w-8 h-8 text-[#7B899D]' />
                    <h3 className='my-4 font-semibold text-[#344256] text-lg'>Need Help?</h3>
                    <p className='text-[#7B899D] text-sm'>Get expert advice on optimizing your profile.</p>
                    <button className='rounded-lg text-sm my-4 font-semibold text-black border border-[#DDE2E9] gap-2 cursor-pointer bg-[#F9F9FA] w-full px-4 py-2.5'>
                        <span className='text-[#344256]'>Contact Support</span>
                    </button>
                </div>
            </div>
            <LinkedinImportModal
                open={linkedinModalOpen}
                onClose={() => setLinkedinModalOpen(false)}
                onSubmit={handleLinkedInImport}
            />

        </div>
    );
};

export default RightSection;
