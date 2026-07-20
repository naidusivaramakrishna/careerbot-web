"use client";

import React, { useRef, useState, useMemo } from "react";
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
    addCertificationAutoFill,
    uploadResume,
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

    const status = useMemo(() => {
        if (completionPercentage === 100) return {
            label: 'Complete!',
            color: 'text-green-600',
            ringColor: 'stroke-green-500',
            bgColor: 'bg-green-50',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        };
        if (completionPercentage >= 80) return {
            label: 'Almost There!',
            color: 'text-blue-600',
            ringColor: 'stroke-blue-500',
            bgColor: 'bg-blue-50',
            icon: <User className="w-5 h-5 text-blue-600" />,
        };
        if (completionPercentage >= 60) return {
            label: 'Good Progress',
            color: 'text-yellow-600',
            ringColor: 'stroke-yellow-500',
            bgColor: 'bg-yellow-50',
            icon: <User className="w-5 h-5 text-yellow-600" />,
        };
        if (completionPercentage >= 30) return {
            label: 'Getting Started',
            color: 'text-orange-600',
            ringColor: 'stroke-orange-500',
            bgColor: 'bg-orange-50',
            icon: <User className="w-5 h-5 text-orange-600" />,
        };
        return {
            label: 'Just Started',
            color: 'text-gray-600',
            ringColor: 'stroke-gray-400',
            bgColor: 'bg-gray-50',
            icon: <User className="w-5 h-5 text-gray-600" />,
        };
    }, [completionPercentage]);

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
            if (fileInputRef.current) fileInputRef.current.value = '';
            return
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size should be less than 10MB")
            if (fileInputRef.current) fileInputRef.current.value = '';
            return
        }

        try {
            setUploading(true)
            toast.loading("Uploading and parsing your resume...", { id: "resume-upload" })

            // 1️⃣ Extract resume first — some backends auto-save parsed data to profile
            const result: ResumeExtractResponse = await extractResume(file);

            // 2️⃣ Store the file immediately after parsing succeeds (independent of profile save steps)
            uploadResume(file)
                .then((res) => setProfileData((prev) => ({ ...prev, resume_url: res.resume_url })))
                .catch((err) => {
                    logger.warn("Resume file storage failed:", err);
                    toast.warning("Resume parsed successfully but could not be saved to your profile.", { id: "resume-upload-store" });
                });

            // 3️⃣ Map to ProfileData format
            const mapped = mapResumeToProfile(result);

            // =====================================================
            // 3️⃣ DELETE existing data AFTER parse so we also clear
            //    any entries auto-saved by the parse endpoint itself
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
        <div className="w-72 shrink-0 flex flex-col gap-4 my-4">

            {/* ── Quick Actions ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-800 mb-0.5">Quick Actions</p>
                <p className="text-xs text-gray-400 mb-4">Auto-fill your profile in seconds.</p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploading}
                    id="quick-resume-upload"
                    name="resume"
                    data-testid="quick-resume-upload-input"
                />
                <button
                    type="button"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    data-testid="upload-resume-area"
                    disabled={uploading}
                    className="w-full flex items-center justify-center cursor-pointer gap-2 border border-[#2257a7] text-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-[#2257a7] border-t-transparent rounded-full animate-spin" />
                            Uploading…
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Upload Resume
                        </>
                    )}
                </button>
            </div>

            {/* ── Profile Completeness ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-800">Profile Completeness</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color} ${status.bgColor}`}>
                        {status.label}
                    </span>
                </div>

                {/* Ring + bar */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative shrink-0">
                        <svg className="w-16 h-16 -rotate-90">
                            <circle cx="32" cy="32" r="26" stroke="#E5E7EB" strokeWidth="5" fill="none" />
                            <circle
                                cx="32" cy="32" r="26"
                                stroke="currentColor" strokeWidth="5" fill="none"
                                strokeLinecap="round"
                                className={status.ringColor}
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 26}`,
                                    strokeDashoffset: `${2 * Math.PI * 26 * (1 - completionPercentage / 100)}`,
                                    transition: 'stroke-dashoffset 0.6s ease-out',
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-800">{completionPercentage}%</span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {missingFields.length > 0 ? (
                            <>
                                <p className="text-xs text-gray-400 mb-1.5">Still missing:</p>
                                <ul className="space-y-1">
                                    {missingFields.slice(0, 4).map((field) => (
                                        <li key={field} className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <span className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />
                                            {field}
                                        </li>
                                    ))}
                                    {missingFields.length > 4 && (
                                        <li className="text-xs text-gray-400">+{missingFields.length - 4} more</li>
                                    )}
                                </ul>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <p className="text-xs font-medium">All fields complete!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Upgrade Plan ── */}
            <div className="bg-[#1E3A5F] rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-yellow-300" />
                    </div>
                    <p className="font-semibold text-sm">Upgrade Your Plan</p>
                </div>
                <p className="text-xs text-blue-200 leading-relaxed mb-4">
                    Unlock unlimited ATS scans, AI resume optimization, job applications, and priority support.
                </p>
                <button
                    type="button"
                    onClick={() => router.push('/payments')}
                    data-testid="upgrade-now-btn"
                    className="w-full cursor-pointer bg-white text-[#1E3A5F] text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-blue-50 transition"
                >
                    Upgrade Now
                </button>
            </div>

            {/* ── Need Help ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Need Help?</p>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Get expert advice on building and optimising your profile.
                </p>
                <a
                    href="mailto:support@careerbot.ai"
                    data-testid="contact-support-btn"
                    className="w-full inline-block cursor-pointer text-center text-sm font-medium text-gray-700 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2.5 transition"
                >
                    Contact Support
                </a>
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
