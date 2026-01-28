"use client"
import Dropdown from "@/components/common/CustomDropdown";
import { Banknote, Briefcase, CirclePlay, MapPin, Upload } from "lucide-react";
import React, { useState, ChangeEvent } from "react";
import { IoHourglassOutline } from "react-icons/io5";
import { createJob, CreateJobRequest, uploadJobLogo } from "@/api/adminJobsApi";
import { toast } from 'sonner';
import {logger} from '@/lib/logger';
type JobStatus = "active" | "draft" | "expired" | "closed";
type WorkMode = "remote" | "hybrid" | "on-site";
type JobType = "full-time" | "part-time" | "internship" | "contract";

export type JobFormData = {
    jobTitle: string;
    company: string;
    location: string;
    workMode: WorkMode;
    salaryMin: string;
    salaryMax: string;
    jobType: JobType;
    openings: string;
    jobDescription: string;
    aboutCompany: string;
    skills: string[];
    applicationUrl: string;
    applyBy: string;
    whoCanApply: string;
    status: JobStatus;
    startDate: string;
    experience: string;
    experienceMin: string;
    experienceMax: string;
    logo?: string | null; // Base64 for preview
    logoFile?: File | null; // Actual file for upload
    companyLogoUrl?: string;
};

const defaultForm: JobFormData = {
    jobTitle: "",
    company: "",
    location: "",
    workMode: "hybrid",
    salaryMin: "",
    salaryMax: "",
    jobType: "full-time",
    openings: "1",
    jobDescription: "",
    aboutCompany: "",
    skills: [],
    applicationUrl: "",
    applyBy: "",
    whoCanApply: "",
    status: "draft",
    startDate: "Immediately",
    experience: "0",
    experienceMin: "0",
    experienceMax: "5",
    logo: null,
    logoFile: null,
    companyLogoUrl: "",
};

// =========================
// AddNewJobForm Component
// =========================
export function AddNewJobForm({
    onPreview,
    onPublish,
    onCancel,
    initialData,
    isEdit = false,
}: {
    onPreview: (data: JobFormData) => void;
    onPublish: () => void;
    onCancel: () => void;
    initialData?: Partial<JobFormData>;
    isEdit?: boolean;
}) {
    const [form, setForm] = useState<JobFormData>({
        ...defaultForm,
        ...initialData,
    });
    const [skillInput, setSkillInput] = useState("");
    const [publishing, setPublishing] = useState(false);

    function update<K extends keyof JobFormData>(k: K, v: JobFormData[K]) {
        setForm((s) => ({ ...s, [k]: v }));
    }

    function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Logo file size must be less than 5MB');
            return;
        }

        // Save the file for upload
        update("logoFile", file);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            update("logo", reader.result as string);
        };
        reader.readAsDataURL(file);
    }


    const openFilePicker = () => {
        document.getElementById("logoInput")?.click();
    };

    function addSkill() {
        const v = skillInput.trim();
        if (!v) return;
        if (form.skills.includes(v)) {
            setSkillInput("");
            return;
        }
        update("skills", [...form.skills, v]);
        setSkillInput("");
    }

    function removeSkill(i: number) {
        const arr = [...form.skills];
        arr.splice(i, 1);
        update("skills", arr);
    }

    const validateForm = (): boolean => {
        if (!form.jobTitle.trim()) {
            toast.error('Job title is required');
            return false;
        }
        if (!form.company.trim()) {
            toast.error('Company name is required');
            return false;
        }
        if (!form.location.trim()) {
            toast.error('Location is required');
            return false;
        }
        if (!form.salaryMin || !form.salaryMax) {
            toast.error('Salary range is required');
            return false;
        }
        if (Number(form.salaryMin) >= Number(form.salaryMax)) {
            toast.error('Maximum salary must be greater than minimum salary');
            return false;
        }
        if (!form.jobDescription.trim()) {
            toast.error('Job description is required');
            return false;
        }
        return true;
    };

    const handlePublish = async () => {
        if (!validateForm()) return;

        try {
            setPublishing(true);

            // Step 1: Upload logo if a file was selected
            let logoUrl = form.companyLogoUrl || undefined; // Use URL if provided

            if (form.logoFile) {
                toast.loading('Uploading company logo...');
                const uploadResult = await uploadJobLogo(form.logoFile);
                logoUrl = uploadResult; // This will be something like "/storage/uploads/company_logos/abc123.png"
                toast.dismiss();
                toast.success('Logo uploaded successfully');
            }

            // Step 2: Create job with logo URL
            const jobData: CreateJobRequest = {
                job_title: form.jobTitle,
                company: form.company,
                location: form.location,
                work_mode: form.workMode,
                salary_min: Number(form.salaryMin),
                salary_max: Number(form.salaryMax),
                job_type: form.jobType,
                number_of_openings: Number(form.openings),
                job_description: form.jobDescription,
                about_company: form.aboutCompany || undefined,
                skills: form.skills.length > 0 ? form.skills : undefined,
                application_url: form.applicationUrl || undefined,
                application_deadline: form.applyBy || undefined,
                who_can_apply: form.whoCanApply || undefined,
                status: 'active', // Publishing makes it active
                experience_min: Number(form.experienceMin) || undefined,
                experience_max: Number(form.experienceMax) || undefined,
                company_logo_url: logoUrl, // ✅ Use the URL from upload
            };

            toast.loading('Publishing job...');
            await createJob(jobData);
            toast.dismiss();
            toast.success('Job published successfully!');
            onPublish();
        } catch (error: unknown) {
            logger.error('Error publishing job:', error);
            toast.dismiss();
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish job';
            toast.error(errorMessage);
        } finally {
            setPublishing(false);
        }
    };

    const handleSaveAsDraft = async () => {
        if (!form.jobTitle.trim() || !form.company.trim()) {
            toast.error('Job title and company name are required');
            return;
        }

        try {
            setPublishing(true);

            // Step 1: Upload logo if a file was selected
            let logoUrl = form.companyLogoUrl || undefined;

            if (form.logoFile) {
                toast.loading('Uploading company logo...');
                const uploadResult = await uploadJobLogo(form.logoFile);
                logoUrl = uploadResult;
                toast.dismiss();
            }

            // Step 2: Create draft job
            const jobData: CreateJobRequest = {
                job_title: form.jobTitle,
                company: form.company,
                location: form.location || 'TBD',
                work_mode: form.workMode,
                salary_min: Number(form.salaryMin) || 0,
                salary_max: Number(form.salaryMax) || 0,
                job_type: form.jobType,
                number_of_openings: Number(form.openings),
                job_description: form.jobDescription || 'To be updated',
                status: 'draft',
                company_logo_url: logoUrl,
            };

            await createJob(jobData);
            toast.success('Job saved as draft');
            onCancel(); // Go back to list
        } catch (error: unknown) {
            logger.error('Error saving draft:', error);
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save draft';
            toast.error(errorMessage);
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="min-h-screen p-4 rounded-xl bg-white">
            <div className="flex justify-between items-start mb-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Job' : 'Add New Job'}</h1>
                    <p className="text-sm text-gray-500">{isEdit ? 'Update job posting details' : 'Create a new job posting'}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => onPreview(form)}
                        className="bg-white border border-gray-200 px-4 py-2 rounded-md text-sm shadow-sm"
                    >
                        Preview
                    </button>
                </div>
            </div>
            <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
                {/* Left - Form */}
                <div className="col-span-8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Job Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.jobTitle}
                                    onChange={(e) => update("jobTitle", e.target.value)}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                    placeholder="e.g. Senior Frontend Developer"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Company <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.company}
                                    onChange={(e) => update("company", e.target.value)}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                    placeholder="e.g. Tech Corp"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Location <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={(e) => update("location", e.target.value)}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                    placeholder="e.g. Bangalore"
                                />
                            </div>

                            {/* Work Mode */}
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Work Mode</label>
                                <select
                                    value={form.workMode}
                                    onChange={(e) => update("workMode", e.target.value as WorkMode)}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                >
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="on-site">On-site</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-5 col-span-2">
                                {/* Salary Min */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-lg font-semibold">Salary Range (LPA) <span className="text-red-500">*</span></label>
                                        <span className="text-xs text-gray-600">Min</span>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={form.salaryMin}
                                            onChange={(e) => update("salaryMin", e.target.value)}
                                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10"
                                            placeholder="e.g. 6"
                                        />
                                    </div>
                                </div>

                                {/* Salary Max */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-lg opacity-0 select-none">.</label>
                                        <span className="text-xs text-gray-600">Max</span>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={form.salaryMax}
                                            onChange={(e) => update("salaryMax", e.target.value)}
                                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10"
                                            placeholder="e.g. 12"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Job Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Job Type</label>
                                <select
                                    value={form.jobType}
                                    onChange={(e) => update("jobType", e.target.value as JobType)}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                >
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="internship">Internship</option>
                                    <option value="contract">Contract</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Number of Openings</label>
                                <input
                                    type="number"
                                    value={form.openings}
                                    onChange={(e) => update("openings", e.target.value)}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                    min="1"
                                />
                            </div>

                            {/* Experience Range */}
                            <div className="grid grid-cols-2 gap-5 col-span-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-lg font-semibold">Experience (Years)</label>
                                        <span className="text-xs text-gray-600">Min</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={form.experienceMin}
                                        onChange={(e) => update("experienceMin", e.target.value)}
                                        className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-lg opacity-0 select-none">.</label>
                                        <span className="text-xs text-gray-600">Max</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={form.experienceMax}
                                        onChange={(e) => update("experienceMax", e.target.value)}
                                        className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                        placeholder="5"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-lg font-semibold">Job Description <span className="text-red-500">*</span></label>
                            <textarea
                                value={form.jobDescription}
                                onChange={(e) => update("jobDescription", e.target.value)}
                                rows={6}
                                placeholder="Describe the role, responsibilities, and requirements..."
                                className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-lg font-semibold">About Company</label>
                            <textarea
                                value={form.aboutCompany}
                                onChange={(e) => update("aboutCompany", e.target.value)}
                                rows={3}
                                placeholder="Explain briefly about your company..."
                                className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-lg font-semibold">Skills</label>
                            <div className="flex gap-2">
                                <input
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    placeholder="Add a skill"
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                />
                                <button
                                    onClick={addSkill}
                                    type="button"
                                    className="py-2 px-4 text-sm bg-white border border-gray-400 rounded-md"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="mt-3 flex gap-2 flex-wrap">
                                {form.skills.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                                        {s}
                                        <button onClick={() => removeSkill(i)} className="text-xs">✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={handleSaveAsDraft}
                            disabled={publishing}
                            className="px-4 py-2 border border-black rounded-md bg-white text-[#9E5559] disabled:opacity-50"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="px-4 py-2 rounded-md bg-[#5E5EFF] text-white disabled:opacity-50"
                        >
                            {publishing ? 'Publishing...' : 'Publish Job'}
                        </button>
                    </div>
                </div>

                {/* Right - Sidebar */}
                <div className="col-span-4">
                    <div className="bg-white">
                        <div className="p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-lg font-semibold">Company Logo</h3>
                            <p className="text-xs text-gray-600 mb-8">Upload your company logo (or provide URL below)</p>
                            <div
                                onClick={openFilePicker}
                                className="border-dashed cursor-pointer border-2 border-gray-300 rounded-md p-3 flex items-center justify-center"
                            >
                                {form.logo ? (
                                    <img src={form.logo} alt="logo" className="w-24 h-24 object-cover rounded" />
                                ) : (
                                    <div className="flex flex-col gap-2 items-center py-6" >
                                        <Upload className="w-8 h-8" />
                                        <label className="text-sm text-gray-500">
                                            Click or Drag & drop to upload logo
                                        </label>
                                        <input
                                            id="logoInput"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoChange}
                                        />
                                    </div>

                                )}
                            </div>
                            <div className="mt-4">
                                <label className="text-sm font-semibold">Or provide logo URL</label>
                                <input
                                    type="url"
                                    value={form.companyLogoUrl}
                                    onChange={(e) => update("companyLogoUrl", e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm mt-2"
                                />
                            </div>
                        </div>
                        <div className="border border-[#00000033]/60 shadow-sm space-y-4 rounded-xl p-6 my-8">
                            <h4 className="text-lg font-semibold">Application Settings</h4>
                            <div className="mt-3 space-y-6">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="" className="font-semibold text-sm">Application URL</label>
                                    <input
                                        type="url"
                                        value={form.applicationUrl}
                                        onChange={(e) => update("applicationUrl", e.target.value)}
                                        placeholder="https://..."
                                        className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="" className="font-semibold text-sm">Application Deadline</label>
                                    <input
                                        type="date"
                                        value={form.applyBy}
                                        onChange={(e) => update("applyBy", e.target.value)}
                                        className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="" className="font-semibold text-sm">Who can apply</label>
                                    <input
                                        value={form.whoCanApply}
                                        onChange={(e) => update("whoCanApply", e.target.value)}
                                        placeholder="e.g. Graduates with 2+ years experience"
                                        className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// =========================
// PreviewJobPage Component
// =========================
export function PreviewJobPage({
    data,
    onPublish,
    onBack,
}: {
    data?: JobFormData | null;
    onPublish: () => void;
    onBack: () => void;
}) {
    const d = data || defaultForm;
    const [publishing, setPublishing] = useState(false);

    const handlePublish = async () => {
        try {
            setPublishing(true);

            // Step 1: Upload logo if a file was selected
            let logoUrl = d.companyLogoUrl || undefined;

            if (d.logoFile) {
                toast.loading('Uploading company logo...');
                const uploadResult = await uploadJobLogo(d.logoFile);
                logoUrl = uploadResult;
                toast.dismiss();
                toast.success('Logo uploaded successfully');
            }

            // Step 2: Create job with logo URL
            const jobData: CreateJobRequest = {
                job_title: d.jobTitle,
                company: d.company,
                location: d.location,
                work_mode: d.workMode,
                salary_min: Number(d.salaryMin),
                salary_max: Number(d.salaryMax),
                job_type: d.jobType,
                number_of_openings: Number(d.openings),
                job_description: d.jobDescription,
                about_company: d.aboutCompany || undefined,
                skills: d.skills.length > 0 ? d.skills : undefined,
                application_url: d.applicationUrl || undefined,
                application_deadline: d.applyBy || undefined,
                who_can_apply: d.whoCanApply || undefined,
                status: 'active',
                experience_min: Number(d.experienceMin) || undefined,
                experience_max: Number(d.experienceMax) || undefined,
                company_logo_url: logoUrl, // ✅ Use the URL from upload
            };

            toast.loading('Publishing job...');
            await createJob(jobData);
            toast.dismiss();
            toast.success('Job published successfully!');
            onPublish();
        } catch (error: unknown) {
            console.error('Error publishing job:', error);
            toast.dismiss();
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish job';
            toast.error(errorMessage);
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className=" bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-semibold text-center mb-6">Job Preview</h1>
                <div className="flex justify-between items-start">
                    <div className="">
                        <h1 className="text-xl font-semibold mb-2">{d.jobTitle || "Job Title"}</h1>
                        <p className="text-gray-600 mb-4">{d.company || "Company Name"}</p>
                        <div className="flex gap-2 my-4 flex-wrap">
                            <div className="px-3 py-1.5 flex  gap-1 items-center border border-[#00000066] rounded-lg text-sm">
                                <MapPin className="w-4 h-4" />
                                {d.location || "Location"}
                            </div>
                            <div className="px-3 py-1.5 flex  gap-1 items-center border border-[#00000066] rounded-lg text-sm capitalize">
                                {d.workMode}
                            </div>
                            <div className="px-3 py-1.5 flex  gap-1 items-center border border-[#00000066] rounded-lg text-sm capitalize">
                                {d.jobType}
                            </div>
                        </div>
                    </div>
                    <div className="ml-6">
                        <div className="w-16 h-16 bg-[#D9D9D9] rounded flex items-center justify-center font-semibold text-xl">
                            {d.company ? d.company.charAt(0).toUpperCase() : "C"}
                        </div>
                    </div>
                </div>
                <div className="flex gap-8 my-4 flex-wrap">
                    <div className="flex flex-col gap-1  text-sm">
                        <div className="flex gap-1 text-[#7C7C7C]">
                            <CirclePlay className="w-4 h-4" />
                            Start Date
                        </div>
                        Immediately
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex gap-1 text-[#7C7C7C]">
                            <Banknote className="w-4 h-4" />
                            CTC (ANNUAL)
                        </div>
                        ₹ {d.salaryMin || "0"} - {d.salaryMax || "0"} LPA
                    </div>
                    <div className="flex flex-col gap-1  text-sm">
                        <div className="flex gap-1 text-[#7C7C7C]">
                            <Briefcase className="w-4 h-4" />
                            Experience
                        </div>
                        {d.experienceMin} - {d.experienceMax} Year(s)
                    </div>
                    <div className="flex flex-col gap-1  text-sm">
                        <div className="flex gap-1 text-[#7C7C7C]">
                            <IoHourglassOutline className="w-4 h-4" />
                            Apply by
                        </div>
                        {d.applyBy || "Open"}
                    </div>
                </div>
                <div className="my-8">
                    <h3 className="font-medium mb-3">Job Description:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{d.jobDescription || "No description provided"}</p>
                </div>

                {d.aboutCompany && (
                    <div className="my-8">
                        <h3 className="font-medium mb-3">About Company:</h3>
                        <p className="text-gray-700">{d.aboutCompany}</p>
                    </div>
                )}

                {d.skills.length > 0 && (
                    <div className="my-8">
                        <h3 className="font-medium mb-3">Required Skills:</h3>
                        <div className="flex gap-2 flex-wrap">
                            {d.skills.map((skill, i) => (
                                <span key={i} className="bg-[#ECEEF2] text-black px-3 py-1 rounded-md text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 border border-black rounded-md bg-white text-[#9E5559]"
                        disabled={publishing}
                    >
                        Back to Edit
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="px-4 py-2 rounded-md bg-[#5E5EFF] text-white disabled:opacity-50"
                    >
                        {publishing ? 'Publishing...' : 'Publish Job'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddNewJobForm;