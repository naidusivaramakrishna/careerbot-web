"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mapResumeToProfile } from "../_utils/resumeMapper";
import { logger } from "@/lib/logger";

import {
    addEducation,
    addExperience,
    addSkill,
    updateProfile,
    getEducation,
    getExperience,
    getSkills,
    deleteExperience,
    deleteSkill,
    deleteEducation,
    addProject,
    getProjects,
    deleteProject
} from "@/api/userApi";

import { useProfileContext } from '../context/ProfileContext'
import { ResumeExtractResponse, extractResume } from "@/api/resumeParsingApi";
import { Crown, MessageSquare, Settings, Sparkles, Upload } from "lucide-react";
import { ProfileData } from "../_types/ProfileData";
import { importLinkedInProfile } from "@/api/linkedinParsingApi";
import { mapLinkedinToProfile } from "../_utils/linkedinMapper";
import LinkedinImportModal from "./LinkedinImportModal";

const RightSection = () => {
    const { profileData, setProfileData } = useProfileContext();
    const [loading, setLoading] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);

    // Calculate profile completion percentage
    const calculateCompletion = (profile: ProfileData): number => {
        if (!profile) return 0

        let filledSections = 0
        const totalSections = 5

        if (profile?.personalInformation) {
            const { fullName, phone, location, summary } = profile.personalInformation
            if (fullName && phone && location && summary) {
                filledSections++
            }
        }

        if (profile?.education && profile.education.length > 0) {
            const hasValidEducation = profile.education.some(
                edu => edu.institution && edu.degree
            )
            if (hasValidEducation) {
                filledSections++
            }
        }

        if (profile?.workExperience && profile.workExperience.length > 0) {
            const hasValidExperience = profile.workExperience.some(
                exp => exp.company && exp.job_title
            )
            if (hasValidExperience) {
                filledSections++
            }
        }

        if (profile?.skills && profile.skills.length > 0) {
            filledSections++
        }

        if (profile?.employmentInfo) {
            const {
                authorized_to_work,
                disability_status,
                gender,
                willing_to_relocate,
                employment_status,
                work_mode,
                preferred_job_type,
                notice_period_days,
                preferred_industries,
                preferred_roles,
                preferred_locations
            } = profile.employmentInfo

            if (authorized_to_work !== undefined ||
                disability_status ||
                gender ||
                willing_to_relocate !== undefined ||
                employment_status ||
                work_mode ||
                preferred_job_type ||
                notice_period_days ||
                (preferred_industries && preferred_industries.length > 0) ||
                (preferred_roles && preferred_roles.length > 0) ||
                (preferred_locations && preferred_locations.length > 0)) {
                filledSections++
            }
        }

        const percentage = Math.round((filledSections / totalSections) * 100)
        return percentage
    }

    // Update completion percentage whenever any part of the profile changes
    useEffect(() => {
        const newPercentage = calculateCompletion(profileData)
        setCompletionPercentage(newPercentage)
    }, [
        profileData?.personalInformation,
        profileData?.education,
        profileData?.workExperience,
        profileData?.skills,
        profileData?.employmentInfo
    ])

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

            // 1️⃣ Extract resume
            const result: ResumeExtractResponse = await extractResume(file);

            // 2️⃣ Map to ProfileData format
            const mapped = mapResumeToProfile(result);

            // ---------------------------------------
            // 3️⃣ UPDATE PERSONAL INFO IN DB
            // ---------------------------------------
            if (mapped.personalInformation) {
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
                    await addEducation({
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
                    await addExperience({
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
                    await addSkill(skill);
                }
            }

            // ---------------------------------------
            // 7️⃣ STORE PROJECTS IN DB
            // ---------------------------------------
            if (mapped.projects?.length) {
                for (const project of mapped.projects) {
                    await addProject({
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

            // 🔄 8️⃣ RE-FETCH UPDATED DATA FROM DB
            const [updatedEducation, updatedExp, updatedSkills, updatedProjects] = await Promise.all([
                getEducation(),
                getExperience(),
                getSkills(),
                getProjects(),
            ]);

            // ---------------------------------------
            // 9️⃣ UPDATE CONTEXT → UI auto-fills
            // ---------------------------------------
            setProfileData((prev) => ({
                ...prev,
                personalInformation: {
                    ...prev.personalInformation,
                    ...mapped.personalInformation,
                },
                education: updatedEducation,
                workExperience: updatedExp,
                skills: updatedSkills.map((s) => s.name),
                projects: updatedProjects.map((p) => ({
                    id: p.id,
                    project_name: p.project_name,
                    role: p.role,
                    technologies: p.technologies || '',
                    start_date: p.start_date,
                    end_date: p.end_date,
                    description: p.description,
                    project_link: p.project_link,
                })),
            }));

            toast.success("Resume imported successfully!", { id: "resume-upload" });
        } catch (err) {
            logger.error("Error during resume import:", err);
            toast.error("Failed to extract resume", { id: "resume-upload" });
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

            // -------------------------------
            // 1️⃣ UPDATE PERSONAL INFO
            // -------------------------------
            if (mapped.personalInformation) {
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
                    await addEducation({
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
                    await addExperience({
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
                    await addSkill(skill);
                }
            }

            // -------------------------------
            // 5️⃣ PROJECTS
            // -------------------------------
            if (mapped.projects?.length) {
                for (const project of mapped.projects) {
                    await addProject({
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
                    ...prev.personalInformation,
                    ...mapped.personalInformation,
                },
                education: updatedEducation,
                workExperience: updatedExp,
                skills: updatedSkills.map((s) => s.name),
                projects: updatedProjects.map((p) => ({
                    id: p.id,
                    project_name: p.project_name,
                    role: p.role,
                    technologies: p.technologies || '',
                    start_date: p.start_date,
                    end_date: p.end_date,
                    description: p.description,
                    project_link: p.project_link,
                })),
            }));

            toast.success("LinkedIn imported successfully!", { id: "linkedin-import" });

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
                <div className="bg-[#F9F9FA] p-4 rounded-xl my-4 shadow-sm">
                    <div className='flex items-center justify-between'>
                        <h1 className='my-4 font-semibold text-lg'>Profile Completion</h1>
                        <div className='rounded-full border border-neutral-200 px-3 py-0.5 text-sm'>
                            {completionPercentage}%
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-[#3e3197] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl border border-[#2200FF33]/20 my-4 shadow bg-[#DAD5F9]">
                    <div className='w-14 h-14 text-white rounded-full flex items-center justify-center bg-gradient-to-r from-[#2200FF] to-[#1800B3]'>
                        <Crown className='w-8 h-8' />
                    </div>
                    <h3 className='my-4 font-semibold text-lg'>Upgrade to CareerBot Pro</h3>
                    <p className='text-center text-[#818798] text-sm'>Get unlimited job applications, AI resume optimization, and priority support.</p>
                    <button className='rounded-lg my-4 text-sm text-white border border-neutral-200 gap-2 cursor-pointer bg-gradient-to-r from-[#2200FF] to-[#1800B3] w-full px-4 py-2.5'>
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
