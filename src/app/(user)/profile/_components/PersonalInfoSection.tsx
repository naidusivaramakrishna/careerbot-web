import { CircleCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { updateProfile } from '@/api/userApi';
import { ProfileData } from '../_types/ProfileData';
import { useProfileContext } from '../context/ProfileContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { useAIGeneration } from '@/hooks/useAIDescriptionGenerator';
import { logger } from '@/lib/logger';
import { formatPhoneNumber } from '../_utils/resumeMapper';

type ApiError = {
    response?: {
        status?: number;
        data?: {
            error?: { message?: string; details?: { validation_errors?: Array<{ field: string; message: string }> } };
            detail?: string;
            details?: { validation_errors?: Array<{ field: string; message: string }> };
        };
    };
};

interface PersonalInfoSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
    setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const PersonalInfoSection = forwardRef(({ tempProfile, setTempProfile, setProfile }: PersonalInfoSectionProps, ref) => {
    const { setProfileData } = useProfileContext(); // ✅ Get context setter
    const { refreshDashboard } = useDashboard();
    const linkedinRef = useRef<HTMLInputElement | null>(null);
    const githubRef = useRef<HTMLInputElement | null>(null);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const { generateSummary,isGenerating } = useAIGeneration();
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setTempProfile((prev) => ({
            ...prev,
            personalInformation: {
                ...prev.personalInformation,
                [name]: value,
            },
        }));
        // Clear error for this field when user starts editing
        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Map frontend ProfileData to backend UserProfile format
    const mapFrontendToBackend = (profile: ProfileData) => {
        const phone = profile.personalInformation?.phone || '';
        let summary = profile.personalInformation?.summary || '';

        // Ensure summary is always a string, not an array
        if (Array.isArray(summary)) {
            summary = summary.join(' ').trim();
        }

        return {
            full_name: profile.personalInformation?.fullName || '',
            headline: profile.personalInformation?.headline || '',
            phone_number: formatPhoneNumber(phone), // Ensure proper formatting with country code
            location: profile.personalInformation?.location || '',
            summary: summary,
            linkedin_url: profile.personalInformation?.linkedin || '',
            github_url: profile.personalInformation?.github || '',
        };
    };

    const handleSave = async () => {
        setSaving(true);
        setFieldErrors({}); // Clear previous errors
        try {
            const backendData = mapFrontendToBackend(tempProfile);

            // Call the update API
            await updateProfile(backendData);

            // ✅ Update both local profile and global context
            setProfile(tempProfile);
            setProfileData((prev) => {
                const newProfile = {
                    ...prev,
                    personalInformation: tempProfile.personalInformation
                };
                logger.info('✅ Updated profile data after saving personal info:', newProfile);
                return newProfile;
            });

            toast.success('Profile updated successfully!');

            // Refresh dashboard with delay to batch updates and prevent multiple toasts
            setTimeout(() => {
                refreshDashboard();
            }, 300);
        } catch (err: unknown) {
            logger.error('Error updating profile:', err);

            const apiError = err as ApiError;
            const status = apiError.response?.status;
            const data = apiError.response?.data;

            // Check for structured validation errors from backend
            const validationErrors = data?.details?.validation_errors || data?.error?.details?.validation_errors;

            if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
                // Map validation errors to field names
                const errors: Record<string, string> = {};
                validationErrors.forEach((error) => {
                    // Map backend field names to frontend field names if needed
                    let fieldName = error.field;
                    if (fieldName === 'phone_number') fieldName = 'phone';
                    if (fieldName === 'linkedin_url') fieldName = 'linkedin';
                    if (fieldName === 'github_url') fieldName = 'github';
                    if (fieldName === 'full_name') fieldName = 'fullName';

                    errors[fieldName] = error.message;
                });
                setFieldErrors(errors);
            } else {
                // Fallback to string-based error matching
                const errorMessage = data?.error?.message || data?.detail || '';

                const msg = errorMessage.toLowerCase();
                if (msg.includes('phone')) {
                    setFieldErrors({ phone: errorMessage });
                } else if (msg.includes('linkedin')) {
                    setFieldErrors({ linkedin: errorMessage });
                } else if (msg.includes('github')) {
                    setFieldErrors({ github: errorMessage });
                } else if (msg.includes('headline')) {
                    setFieldErrors({ headline: errorMessage });
                } else if (msg.includes('location')) {
                    setFieldErrors({ location: errorMessage });
                } else if (msg.includes('summary')) {
                    setFieldErrors({ summary: errorMessage });
                } else if (msg.includes('full name') || msg.includes('full_name') || msg.includes('name')) {
                    setFieldErrors({ fullName: errorMessage });
                } else if (errorMessage) {
                    toast.error(errorMessage);
                }
            }

            if (status === 401) {
                toast.error('Session expired. Please log in again');
            }
        } finally {
            setSaving(false);
        }
    };

    // Expose focusLinkedin and focusGithub methods to parent
    useImperativeHandle(ref, () => ({
        focusLinkedin: () => {
            linkedinRef.current?.focus();
        },
        focusGithub: () => {
            githubRef.current?.focus();
        }
    }));

    const handleGenerateSummary = async () => {
        // Check if at least job title is provided
        if (!tempProfile.personalInformation?.headline?.trim()) {
            toast.error("Please enter a headline first to generate a summary.");
            return;
        }

        const description = await generateSummary({
            fullName: tempProfile.personalInformation.fullName,
            headline: tempProfile.personalInformation.headline,
            location: tempProfile.personalInformation.location,
            skills: tempProfile.skills
        });

        if (description) {
            setTempProfile((prev) => ({
                ...prev,
                personalInformation: {
                    ...prev.personalInformation,
                    summary: description,
                },
            }));
        }
        toast.success("Summary generated!");
    };

    // Helper component to render input with error message
    const renderInputField = (
        label: string,
        name: string,
        value: string,
        placeholder: string,
        type: string = 'text',
        ref?: React.Ref<HTMLInputElement>,
        disabled: boolean = false
    ) => (
        <div className='flex flex-col gap-3'>
            <label className="text-sm font-medium">{label}</label>
            <input
                ref={ref}
                type={type}
                name={name}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                className={`w-full text-sm border p-2.5 rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${fieldErrors[name]
                        ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500'
                        : 'border-neutral-200'
                    } ${disabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}
                placeholder={placeholder}
            />
            {fieldErrors[name] && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    {fieldErrors[name]}
                </p>
            )}
        </div>
    );
    return (
        <div>
            {/* Form fields */}
            <div className="grid grid-cols-3 gap-4 my-4">
                {renderInputField('Full Name', 'fullName', tempProfile.personalInformation?.fullName || '', 'John Doe')}
                {renderInputField('Headline', 'headline', tempProfile.personalInformation?.headline || '', 'Software Engineer')}
                {renderInputField('Location', 'location', tempProfile.personalInformation?.location || '', 'New York, USA')}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {renderInputField('Email', 'email', tempProfile.personalInformation?.email || '', 'john@example.com', 'email', undefined, true)}
                {renderInputField('Phone', 'phone', tempProfile.personalInformation?.phone || '', '+91 9876543210')}
                {renderInputField('LinkedIn', 'linkedin', tempProfile.personalInformation?.linkedin || '', 'https://linkedin.com/in/johndoe', 'text', linkedinRef)}
                {renderInputField('GitHub', 'github', tempProfile.personalInformation?.github || '', 'https://github.com/johndoe', 'text', githubRef)}
            </div>
            <div className='flex flex-col gap-3 mt-4'>
                <label className="text-sm font-medium">Professional Summary</label>
                <div className="relative w-full">
                    <textarea
                        rows={5}
                        value={tempProfile.personalInformation?.summary || ""}
                        onChange={handleChange}
                        className={`w-full text-sm border p-3 rounded-lg bg-gray-100 outline-neutral-500 pr-10 transition-colors ${fieldErrors['summary']
                                ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500'
                                : 'border-neutral-200'
                            }`}
                        name="summary"
                        id="summary"
                        placeholder="Short bio, career goals, highlights..."
                    ></textarea>
                    <Sparkles
                        className={`absolute right-4 top-4 w-4 h-4 cursor-pointer transition-colors ${isGenerating
                            ? 'text-gray-400 cursor-not-allowed animate-pulse'
                            : 'text-[#1F00EC] hover:text-[#1600BE]'
                            }`}
                        onClick={isGenerating ? undefined : handleGenerateSummary}
                    />
                    {fieldErrors['summary'] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <span>✕</span> {fieldErrors['summary']}
                        </p>
                    )}
                </div>
            </div>
            <div className='flex justify-between'>
                <div className='flex items-center gap-2'>
                    <Image src="/assets/icons/magic-pencil.svg" className='w-4 h-4' width={12} height={12} alt='magic-pencil' />
                    <div className='text-sm'>Let AI help you write this summary....</div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#155DFC] text-white flex gap-2 cursor-pointer items-center justify-self-end my-4 px-4 py-2 text-sm rounded-lg hover:bg-[#0d4acc] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <CircleCheck className="w-4 h-4" />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
});

// Fix ESLint error
PersonalInfoSection.displayName = "PersonalInfoSection";

export default PersonalInfoSection;
