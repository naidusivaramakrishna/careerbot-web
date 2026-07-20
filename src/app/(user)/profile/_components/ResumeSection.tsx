"use client"
import React, { useState, useEffect } from 'react'
import { uploadResume, getResume, deleteResume, ResumeResponse, ResumeUploadResponse, ResumeDeleteResponse } from '@/api/userApi';
import { toast } from "sonner";
import { useProfileContext } from '../context/ProfileContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { ProfileData } from '../_types/ProfileData';
import logger from '@/lib/logger';
import { CheckCircle, FileText, Info, Trash2, Upload } from 'lucide-react';

interface ResumeSectionProps {
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const ResumeSection = ({ setTempProfile }: ResumeSectionProps) => {
    const { profileData, setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const [resumeUrl, setResumeUrl] = useState<string | null>(profileData.resume_url ?? null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(!profileData.resume_url);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);

    // One-way sync: propagates context resume_url into local state when it becomes truthy
    // (e.g. sidebar upload). Does NOT clear local state when resume_url goes null —
    // deletion is managed locally by this component's own delete handler.
    useEffect(() => {
        if (profileData.resume_url && profileData.resume_url !== resumeUrl) {
            setResumeUrl(profileData.resume_url);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileData.resume_url]);

    useEffect(() => {
        // Skip fetch if we already have a URL from context (sidebar upload)
        if (profileData.resume_url) {
            setIsFetching(false);
            return;
        }
        const fetchResume = async () => {
            try {
                setIsFetching(true);
                const response: ResumeResponse = await getResume();
                if (response.resume_url) {
                    setResumeUrl(response.resume_url);
                    setTempProfile((prev) => ({ ...prev, resume_url: response.resume_url }));
                    setProfileData((prev) => ({ ...prev, resume_url: response.resume_url }));
                }
            } catch (error) {
                const axiosError = error as { response?: { status?: number } };
                if (axiosError?.response?.status !== 404) {
                    logger.error('Failed to fetch resume:', error);
                }
            } finally {
                setIsFetching(false);
            }
        };
        fetchResume();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validFileTypes.includes(file.type)) {
            toast.error('Please upload a PDF, DOCX, or DOC file');
            e.target.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            e.target.value = '';
            return;
        }

        setIsLoading(true);
        try {
            const response: ResumeUploadResponse = await uploadResume(file);
            setResumeUrl(response.resume_url);
            setIsReplacing(false);
            setTempProfile((prev) => ({ ...prev, resume_url: response.resume_url }));
            setProfileData((prev) => ({ ...prev, resume_url: response.resume_url }));
            setTimeout(() => { refreshDashboard(); }, 300);
            toast.success(response.message || 'Resume uploaded successfully');
            e.target.value = '';
        } catch (error) {
            logger.error('Failed to upload resume:', error);
            toast.error('Failed to upload resume. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!resumeUrl) return;
        setIsDeleting(true);
        try {
            const response: ResumeDeleteResponse = await deleteResume();
            setResumeUrl(null);
            setShowDeleteModal(false);
            setTempProfile((prev) => ({ ...prev, resume_url: undefined }));
            setProfileData((prev) => {
                const newProfile = { ...prev };
                delete newProfile.resume_url;
                return newProfile;
            });
            setTimeout(() => { refreshDashboard(); }, 300);
            toast.success(response.message || 'Resume deleted successfully');
        } catch (error) {
            logger.error('Failed to delete resume:', error);
            toast.error('Failed to delete resume. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isFetching) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-8 flex items-center justify-center min-h-[160px]">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#2257a7] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Loading resume...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Upload / Current resume card */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-5">
                {resumeUrl && !isReplacing ? (
                    <div className="flex flex-col gap-4">
                        {/* File indicator */}
                        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-green-800 truncate">
                                    {`Resume.${resumeUrl.split('.').pop() || 'pdf'}`}
                                </p>
                                <p className="text-xs text-green-600">Uploaded successfully</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                data-testid="delete-resume-btn"
                                onClick={() => setShowDeleteModal(true)}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg px-4 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>

                            <label className="flex-1">
                                <input
                                    type="file"
                                    data-testid="resume-replace-input"
                                    id="resume-replace"
                                    name="resume"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeUpload}
                                    disabled={isLoading}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    data-testid="replace-resume-btn"
                                    onClick={() => setIsReplacing(true)}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] rounded-lg px-4 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="w-4 h-4" />
                                    {isLoading ? 'Uploading...' : 'Replace'}
                                </button>
                            </label>
                        </div>
                    </div>
                ) : (
                    /* Upload dropzone */
                    <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 bg-[#EEF3FB] rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#2257a7]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">Upload Your Resume</h3>
                            <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX or DOC — max 10 MB</p>
                        </div>
                        <label>
                            <input
                                type="file"
                                data-testid="resume-file-input"
                                id="resume-upload"
                                name="resume"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                disabled={isLoading}
                                className="hidden"
                            />
                            <button
                                type="button"
                                data-testid="choose-resume-btn"
                                onClick={(e) => e.currentTarget.previousElementSibling?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload className="w-4 h-4" />
                                {isLoading ? 'Uploading...' : 'Choose Resume'}
                            </button>
                        </label>
                    </div>
                )}
            </div>

            {/* Info card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex gap-3">
                <div className="w-8 h-8 bg-white border border-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-[#2257a7]" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">Why upload your resume?</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                        <li className="flex items-start gap-1.5"><span className="text-[#2257a7] mt-0.5">•</span>Employers can quickly review your qualifications</li>
                        <li className="flex items-start gap-1.5"><span className="text-[#2257a7] mt-0.5">•</span>Update or replace your resume anytime</li>
                        <li className="flex items-start gap-1.5"><span className="text-[#2257a7] mt-0.5">•</span>Supports PDF, DOCX, and DOC formats</li>
                    </ul>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div data-testid="delete-resume-modal" className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-base font-semibold text-center text-gray-900 mb-1">Delete Resume?</h3>
                        <p className="text-center text-gray-500 text-xs mb-5">
                            Are you sure you want to delete your resume? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                data-testid="modal-cancel-btn"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                data-testid="modal-confirm-delete-btn"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResumeSection
