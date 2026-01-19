"use client";
import React, { useState, useEffect } from "react";
import { Banknote, Briefcase, CirclePlay, ExternalLink, MapPin, X } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";
import { IoHourglassOutline } from "react-icons/io5";
import { getJobDetails, updateJob, JobDetailsResponse, UpdateJobRequest } from "@/api/adminJobsApi";
import { toast } from 'sonner';

interface Props {
    job: { id: string } | null;
    onClose: () => void;
    onUpdate?: () => void;
}

const JobDetailsModal: React.FC<Props> = ({ job, onClose, onUpdate }) => {
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [jobDetails, setJobDetails] = useState<JobDetailsResponse | null>(null);
    const [updatedJob, setUpdatedJob] = useState<UpdateJobRequest>({});

    useEffect(() => {
        if (job?.id) {
            fetchJobDetails();
        }
    }, [job?.id]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const details = await getJobDetails(job!.id);
            setJobDetails(details);
            // Initialize update form with current values
            setUpdatedJob({
                job_title: details.job_title,
                company: details.company,
                location: details.location,
                work_mode: details.work_mode as any,
                salary_min: details.salary_min,
                salary_max: details.salary_max,
                job_type: details.job_type as any,
                job_description: details.job_description,
                skills: details.skills,
                status: details.status as any,
            });
        } catch (error) {
            console.error('Error fetching job details:', error);
            toast.error('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateJob(job!.id, updatedJob);
            toast.success('Job updated successfully');
            setEditMode(false);
            if (onUpdate) onUpdate();
            // Refresh details
            await fetchJobDetails();
        } catch (error) {
            console.error('Error updating job:', error);
            toast.error('Failed to update job');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        });
    };

    const formatSalary = (min: number, max: number, currency: string = 'INR') => {
        const symbol = currency === 'INR' ? '₹' : '$';
        return `${symbol} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50">
                <div className="bg-white w-full max-w-2xl h-[700px] flex items-center justify-center rounded-l-2xl">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E5EFF]"></div>
                        <p className="mt-2 text-gray-500">Loading job details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!jobDetails) {
        return (
            <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50">
                <div className="bg-white w-full max-w-2xl h-[700px] flex items-center justify-center rounded-l-2xl">
                    <p className="text-gray-500">Job not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50">
            <div className="bg-white w-full max-w-2xl h-[700px] overflow-y-auto rounded-l-2xl p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-black"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <h2 className="text-xl font-semibold">
                    {editMode ? "Edit Job" : "Job Details"}
                </h2>
                <p className="text-sm text-gray-500 border-b pb-2">
                    {editMode
                        ? "Edit and update job information"
                        : "Complete job description and details"}
                </p>

                {/* ---------------- VIEW MODE ---------------- */}
                {!editMode && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold">{jobDetails.job_title}</h3>
                        <p className="text-gray-600">{jobDetails.company}</p>
                        <div className="flex gap-2 my-4 flex-wrap">
                            <div className="px-3 py-1.5 flex gap-1 items-center border border-[#00000066] rounded-lg text-sm">
                                <MapPin className="w-4 h-4" />
                                {jobDetails.location}
                            </div>
                            <div className="px-3 py-1.5 flex gap-1 items-center border border-[#00000066] rounded-lg text-sm capitalize">
                                {jobDetails.work_mode}
                            </div>
                            <div className="px-3 py-1.5 flex gap-1 items-center border border-[#00000066] rounded-lg text-sm capitalize">
                                {jobDetails.job_type}
                            </div>
                            <div className={`px-3 py-1.5 flex gap-1 items-center rounded-lg text-sm
                            ${jobDetails.status === "active"
                                    ? "text-white bg-[#00A63E]"
                                    : jobDetails.status === "expired"
                                        ? "text-[#FE0004] bg-[#FFB0BA66]/40"
                                        : jobDetails.status === "closed"
                                            ? "text-[#FF6B00] bg-[#FFE5CC]"
                                            : "text-[#9A9A9A] bg-[#F3F3F3]"
                                }`}
                            >
                                {jobDetails.status.charAt(0).toUpperCase() + jobDetails.status.slice(1)}
                            </div>
                        </div>
                        <div className="flex gap-8 my-4 flex-wrap">
                            <div className="flex flex-col gap-1 text-sm">
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
                                {formatSalary(jobDetails.salary_min, jobDetails.salary_max, jobDetails.salary_currency)}
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="flex gap-1 text-[#7C7C7C]">
                                    <Briefcase className="w-4 h-4" />
                                    Experience
                                </div>
                                {jobDetails.experience_min && jobDetails.experience_max
                                    ? `${jobDetails.experience_min}-${jobDetails.experience_max} Years`
                                    : 'Not specified'}
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="flex gap-1 text-[#7C7C7C]">
                                    <IoHourglassOutline className="w-4 h-4" />
                                    Apply by
                                </div>
                                {formatDate(jobDetails.application_deadline || '')}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 my-4 flex-wrap p-4 bg-gray-50 rounded-lg">
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="text-[#7C7C7C]">Views</div>
                                <div className="font-semibold">{jobDetails.views_count.toLocaleString()}</div>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="text-[#7C7C7C]">Applications</div>
                                <div className="font-semibold">{jobDetails.applications_count.toLocaleString()}</div>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="text-[#7C7C7C]">Openings</div>
                                <div className="font-semibold">{jobDetails.number_of_openings}</div>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="text-[#7C7C7C]">Source</div>
                                <div className="font-semibold capitalize">{jobDetails.source}</div>
                            </div>
                        </div>

                        <div className="border border-gray-500 flex flex-col gap-4 rounded-lg p-4">
                            <div>
                                <h3 className="font-semibold my-2">Job Description</h3>
                                <p className="text-[#717182] text-sm whitespace-pre-wrap">{jobDetails.job_description}</p>
                            </div>

                            {jobDetails.about_company && (
                                <div>
                                    <h3 className="font-semibold my-2">About Company</h3>
                                    <p className="text-[#717182] text-sm">{jobDetails.about_company}</p>
                                </div>
                            )}

                            {jobDetails.who_can_apply && (
                                <div>
                                    <h3 className="font-semibold my-2">Who Can Apply</h3>
                                    <p className="text-[#717182] text-sm">{jobDetails.who_can_apply}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold my-4">Required Skills</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {jobDetails.skills?.map((skill, i) => (
                                        <span key={i} className="bg-[#ECEEF2] text-black px-3 py-1 rounded-md text-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {jobDetails.application_url && (
                                <div>
                                    <h3 className="font-semibold my-4">Application URL</h3>
                                    <div className="text-[#A600FF] flex gap-2 items-center">
                                        <ExternalLink className="w-4 h-4" />
                                        <a
                                            href={jobDetails.application_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline break-all"
                                        >
                                            {jobDetails.application_url}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 cursor-pointer rounded-md border border-black/80 bg-white text-sm text-[#9E5559]"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-5 py-2 cursor-pointer rounded-md bg-[#5E5EFF] text-white text-sm"
                                >
                                    Edit Job
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- EDIT MODE ---------------- */}
                {editMode && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Job Title</label>
                                <input
                                    type="text"
                                    value={updatedJob.job_title || ''}
                                    onChange={(e) => setUpdatedJob(prev => ({ ...prev, job_title: e.target.value }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Company</label>
                                <input
                                    type="text"
                                    value={updatedJob.company || ''}
                                    onChange={(e) => setUpdatedJob(prev => ({ ...prev, company: e.target.value }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Location</label>
                                <input
                                    type="text"
                                    value={updatedJob.location || ''}
                                    onChange={(e) => setUpdatedJob(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                />
                            </div>

                            {/* Work Mode */}
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Work Mode</label>
                                <select
                                    value={updatedJob.work_mode || ''}
                                    onChange={(e) => setUpdatedJob(prev => ({ ...prev, work_mode: e.target.value as any }))}
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
                                        <label className="text-lg font-semibold">Salary Range (LPA)</label>
                                        <span className="text-xs text-gray-600">Min</span>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={updatedJob.salary_min || ''}
                                            onChange={(e) => setUpdatedJob(prev => ({
                                                ...prev,
                                                salary_min: e.target.value ? Number(e.target.value) : undefined
                                            }))}
                                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10"
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
                                            value={updatedJob.salary_max || ''}
                                            onChange={(e) => setUpdatedJob(prev => ({
                                                ...prev,
                                                salary_max: e.target.value ? Number(e.target.value) : undefined
                                            }))}
                                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Job Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Job Type</label>
                                <select
                                    value={updatedJob.job_type || ''}
                                    onChange={(e) => setUpdatedJob(prev => ({ ...prev, job_type: e.target.value as any }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                >
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="internship">Internship</option>
                                    <option value="contract">Contract</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-lg font-semibold">Status</label>
                                <select
                                    value={updatedJob.status || ''}
                                    onChange={(e) => setUpdatedJob(prev => ({ ...prev, status: e.target.value as any }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 my-2">
                            <label className="text-lg font-semibold">Job Description</label>
                            <textarea
                                rows={4}
                                value={updatedJob.job_description || ''}
                                onChange={(e) => setUpdatedJob(prev => ({ ...prev, job_description: e.target.value }))}
                                className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                                placeholder="Describe the role, responsibilities, and requirements...."
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 cursor-pointer rounded-md border border-black/80 bg-white text-sm text-[#9E5559]"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 cursor-pointer rounded-md bg-[#5E5EFF] text-white text-sm disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetailsModal;