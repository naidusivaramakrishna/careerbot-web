"use client"
import React, { useState, useEffect } from 'react'
import { uploadResume, getResume, deleteResume, ResumeResponse, ResumeUploadResponse, ResumeDeleteResponse } from '@/api/userApi';
import { toast } from "sonner";
import { useProfileContext } from '../context/ProfileContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { ProfileData } from '../_types/ProfileData';
import logger from '@/lib/logger';
import { Trash2, Upload, Info } from 'lucide-react';

interface ResumeSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const ResumeSection = ({ tempProfile, setTempProfile }: ResumeSectionProps) => {
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);

    // Fetch resume on component mount
    useEffect(() => {
        const fetchResume = async () => {
            try {
                setIsFetching(true);
                const response: ResumeResponse = await getResume();
                if (response.resume_url) {
                    setResumeUrl(response.resume_url);
                    // Update profile context
                    setTempProfile((prev) => ({ ...prev, resume_url: response.resume_url }));
                    setProfileData((prev) => ({ ...prev, resume_url: response.resume_url }));
                }
            } catch (error) {
                // 404 is expected if no resume has been uploaded yet
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

        // Validate file type
        const validFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validFileTypes.includes(file.type)) {
            toast.error('Please upload a PDF, DOCX, or DOC file');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setIsLoading(true);
        try {
            const response: ResumeUploadResponse = await uploadResume(file);

            setResumeUrl(response.resume_url);
            setIsReplacing(false);

            // Update both tempProfile and global context
            setTempProfile((prev) => ({ ...prev, resume_url: response.resume_url }));
            setProfileData((prev) => ({
                ...prev,
                resume_url: response.resume_url
            }));

            // Refresh dashboard
            setTimeout(() => {
                refreshDashboard();
            }, 300);

            toast.success(response.message || 'Resume uploaded successfully');

            // Reset file input
            e.target.value = '';
        } catch (error) {
            logger.error('Failed to upload resume:', error);
            toast.error('Failed to upload resume. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!resumeUrl) return;

        setIsDeleting(true);
        try {
            const response: ResumeDeleteResponse = await deleteResume();

            setResumeUrl(null);
            setShowDeleteModal(false);

            // Update both tempProfile and global context
            setTempProfile((prev) => ({ ...prev, resume_url: undefined }));
            setProfileData((prev) => {
                const newProfile = { ...prev };
                delete newProfile.resume_url;
                return newProfile;
            });

            // Refresh dashboard
            setTimeout(() => {
                refreshDashboard();
            }, 300);

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
            <div className="rounded-xl shadow-sm bg-white border border-gray-300 py-6 px-4 mb-3 flex items-center justify-center min-h-[200px]">
                <p className="text-gray-500">Loading resume...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Resume Upload Section */}
            <div className="rounded-2xl shadow-sm bg-white border border-gray-200 py-8 px-6">
                {resumeUrl && !isReplacing ? (
                    // Show current resume - Success Card Design
                    <div className="space-y-6">
                        {/* Success Card */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-green-900">
                                        {`Resume.${resumeUrl.split('.').pop() || 'pdf'}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Side by Side */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleResumeDelete}
                                disabled={isDeleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-medium border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>

                            <label className="flex-1">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeUpload}
                                    disabled={isLoading}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => setIsReplacing(true)}
                                    disabled={isLoading}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-[#2257a7] text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="w-4 h-4" />
                                    {isLoading ? 'Uploading...' : 'Replace'}
                                </button>
                            </label>
                        </div>
                    </div>
                ) : (
                    // Show upload area - Updated Design
                    <div className="border-2 border-dashed border-gray-400 rounded-xl p-12 text-center transition-colors duration-200">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <Upload className="w-10 h-10 text-gray-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
                        <p className="text-gray-500 text-sm mb-6">PDF, DOCX, or DOC (Max 10MB)</p>

                        <label className="inline-block">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                disabled={isLoading}
                                className="hidden"
                            />
                            <button
                                onClick={(e) => e.currentTarget.previousElementSibling?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                                disabled={isLoading}
                                    className="bg-[#2257a7] text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                {isLoading ? 'Uploading...' : 'Choose Resume'}
                            </button>
                        </label>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="rounded-2xl shadow-sm bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 py-6 px-6">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            <Info className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Why Upload Your Resume?</h4>
                        <ul className="text-sm text-blue-800 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Employers can quickly review your qualifications</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Update or replace your resume anytime</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Supports PDF, DOCX, and DOC formats</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
                            Delete Resume?
                        </h3>

                        <p className="text-center text-gray-600 text-sm mb-6">
                            Are you sure you want to delete your resume? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResumeSection
