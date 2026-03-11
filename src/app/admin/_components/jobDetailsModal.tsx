"use client";
import React, { useState, useEffect } from "react";
import { Banknote, Briefcase, CirclePlay, ExternalLink, MapPin, X } from "lucide-react";
import { IoHourglassOutline } from "react-icons/io5";
import { getJobDetails, closeJob, JobDetailsResponse } from "@/api/adminJobsApi";
import { toast } from 'sonner';

interface Props {
    job: { id: string } | null;
    onClose: () => void;
    onUpdate?: () => void;
    onEdit?: (jobId: string) => void;
}

const JobDetailsModal: React.FC<Props> = ({ job, onClose, onUpdate, onEdit }) => {
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [jobDetails, setJobDetails] = useState<JobDetailsResponse | null>(null);

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
        } catch (error) {
            toast.error('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseJob = async () => {
        try {
            setClosing(true);
            await closeJob(job!.id);
            toast.success('Job closed successfully');
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            toast.error('Failed to close job');
        } finally {
            setClosing(false);
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
                <h2 className="text-xl font-semibold">Job Details</h2>
                <p className="text-sm text-gray-500 border-b pb-2">
                    Complete job description and details
                </p>

                {/* Job Details */}
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
                                    onClick={handleCloseJob}
                                    disabled={closing || jobDetails.status === 'closed'}
                                    className="px-4 py-2 cursor-pointer rounded-md border border-black/80 bg-white text-sm text-[#9E5559] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {closing ? 'Closing...' : 'Close Job'}
                                </button>
                                <button
                                    onClick={() => onEdit?.(job!.id)}
                                    className="px-5 py-2 cursor-pointer rounded-md bg-[#5E5EFF] text-white text-sm"
                                >
                                    Edit Job
                                </button>
                            </div>
                        </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailsModal;
