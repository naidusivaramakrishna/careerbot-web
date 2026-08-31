import { CircleCheck, Sparkles } from 'lucide-react';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { updateProfile } from '@/api/userApi';
import { ProfileData } from '../_types/ProfileData';
import { useProfileContext } from '../context/ProfileContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { useAISuggestions } from '@/app/(resume)/builder/creation/_hooks/useAISuggestions';
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
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const linkedinRef = useRef<HTMLInputElement | null>(null);
    const githubRef = useRef<HTMLInputElement | null>(null);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const {
        loadingIndex,
        suggestions,
        generateSuggestions,
    } = useAISuggestions();

    useEffect(() => {
        if (suggestions[0] && suggestions[0].length > 0) {
            const generatedSummary = suggestions[0][0];
            setTempProfile((prev) => ({
                ...prev,
                personalInformation: { ...prev.personalInformation, summary: generatedSummary },
            }));
        }
    }, [suggestions, setTempProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTempProfile((prev) => ({
            ...prev,
            personalInformation: { ...prev.personalInformation, [name]: value },
        }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const mapFrontendToBackend = (profile: ProfileData) => {
        const phone = profile.personalInformation?.phone || '';
        let summary = profile.personalInformation?.summary || '';
        if (Array.isArray(summary)) summary = summary.join(' ').trim();
        return {
            full_name: profile.personalInformation?.fullName || '',
            headline: profile.personalInformation?.headline || '',
            phone_number: formatPhoneNumber(phone),
            location: profile.personalInformation?.location || '',
            summary,
            linkedin_url: profile.personalInformation?.linkedin || '',
            github_url: profile.personalInformation?.github || '',
        };
    };

    const handleSave = async () => {
        setSaving(true);
        setFieldErrors({});
        try {
            await updateProfile(mapFrontendToBackend(tempProfile));
            setProfile(tempProfile);
            setProfileData((prev) => ({ ...prev, personalInformation: tempProfile.personalInformation }));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('profileUpdated', {
                    detail: { full_name: tempProfile.personalInformation?.fullName || '' },
                }));
            }
            toast.success('Profile updated successfully!');
            setTimeout(() => { refreshDashboard(); }, 300);
        } catch (err: unknown) {
            logger.error('Error updating profile:', err);
            const apiError = err as ApiError;
            const status = apiError.response?.status;
            const data = apiError.response?.data;
            const validationErrors = data?.details?.validation_errors || data?.error?.details?.validation_errors;

            if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
                const errors: Record<string, string> = {};
                validationErrors.forEach((error) => {
                    let fieldName = error.field;
                    if (fieldName === 'phone_number') fieldName = 'phone';
                    if (fieldName === 'linkedin_url') fieldName = 'linkedin';
                    if (fieldName === 'github_url') fieldName = 'github';
                    if (fieldName === 'full_name') fieldName = 'fullName';
                    errors[fieldName] = error.message;
                });
                setFieldErrors(errors);
            } else {
                const errorMessage = data?.error?.message || data?.detail || '';
                const msg = errorMessage.toLowerCase();
                if (msg.includes('phone')) setFieldErrors({ phone: errorMessage });
                else if (msg.includes('linkedin')) setFieldErrors({ linkedin: errorMessage });
                else if (msg.includes('github')) setFieldErrors({ github: errorMessage });
                else if (msg.includes('headline')) setFieldErrors({ headline: errorMessage });
                else if (msg.includes('location')) setFieldErrors({ location: errorMessage });
                else if (msg.includes('summary')) setFieldErrors({ summary: errorMessage });
                else if (msg.includes('full name') || msg.includes('full_name') || msg.includes('name')) setFieldErrors({ fullName: errorMessage });
                else if (errorMessage) toast.error(errorMessage);
            }

            if (status === 401) toast.error('Session expired. Please log in again');
        } finally {
            setSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({
        focusLinkedin: () => linkedinRef.current?.focus(),
        focusGithub: () => githubRef.current?.focus(),
    }));

    const handleGenerateSummary = () => {
        if (!tempProfile.personalInformation?.headline?.trim()) {
            toast.error("Please enter a headline first to generate a summary.");
            return;
        }

        const skillsList = tempProfile.skills?.join(", ") || "";

        const prompt = `Generate a concise and professional summary for a resume based on the following profile information:
Name: ${tempProfile.personalInformation.fullName || ""}
Headline: ${tempProfile.personalInformation.headline}
Location: ${tempProfile.personalInformation.location || ""}
Skills: ${skillsList}

Requirements:
- Length: 3-4 lines maximum (approximately 30-50 words)
- Start directly with a professional identity or key strength
- Highlight years of experience (if known) and core competencies
- Include the skills mentioned above where relevant
- Focus on unique value proposition and impact
- Avoid generic phrases like "hardworking," "team player," or "seeking opportunities"

Return ONLY the summary text, no numbering or labels.`;

        generateSuggestions(0, prompt, "summary");
    };


    const inputClass = (name: string, disabled = false) =>
        `w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition
         focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white
         ${fieldErrors[name]
            ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400'
            : disabled
                ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
        }`;

    const renderInputField = (
        label: string,
        name: string,
        value: string,
        placeholder: string,
        type: string = 'text',
        inputRef?: React.Ref<HTMLInputElement>,
        disabled = false,
        htmlId?: string,
        testId?: string
    ) => (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
                ref={inputRef}
                type={type}
                name={name}
                id={htmlId || name}
                data-testid={testId || `${name}-input`}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder}
                className={inputClass(name, disabled)}
            />
            {fieldErrors[name] && (
                <p role="alert" className="text-red-500 text-xs">{fieldErrors[name]}</p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-5 py-2">
            {/* Row 1: Full name, headline, location */}
            <div className="grid grid-cols-3 gap-4">
                {renderInputField('Full Name', 'fullName', tempProfile.personalInformation?.fullName || '', 'John Doe', 'text', undefined, false, 'fullname', 'fullname-input')}
                {renderInputField('Headline', 'headline', tempProfile.personalInformation?.headline || '', 'Software Engineer', 'text', undefined, false, 'headline', 'headline-input')}
                {renderInputField('Location', 'location', tempProfile.personalInformation?.location || '', 'New York, USA', 'text', undefined, false, 'location', 'location-input')}
            </div>

            {/* Row 2: Email, phone, LinkedIn, GitHub */}
            <div className="grid grid-cols-2 gap-4">
                {renderInputField('Email', 'email', tempProfile.personalInformation?.email || '', 'john@example.com', 'email', undefined, true, 'email', 'email-input')}
                {renderInputField('Phone', 'phone', tempProfile.personalInformation?.phone || '', '+91 9876543210', 'text', undefined, false, 'phone', 'phone-input')}
                {renderInputField('LinkedIn', 'linkedin', tempProfile.personalInformation?.linkedin || '', 'https://linkedin.com/in/johndoe', 'text', linkedinRef, false, 'linkedin', 'linkedin-input')}
                {renderInputField('GitHub', 'github', tempProfile.personalInformation?.github || '', 'https://github.com/johndoe', 'text', githubRef, false, 'github', 'github-input')}
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">Professional Summary</label>
                    <button
                        type="button"
                        disabled={loadingIndex === 0}
                        onClick={handleGenerateSummary}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-white cursor-pointer bg-linear-to-br from-[#194386] to-[#3b6ecb] hover:bg-blue-700 rounded-full disabled:bg-gray-400 transition"
                    >
                        <Sparkles className={`w-4 h-4 ${loadingIndex === 0 ? 'animate-pulse' : ''}`} />
                        {loadingIndex === 0 ? "Generating..." : "AI Writer"}
                    </button>
                </div>
                <div>
                    <textarea
                        rows={5}
                        value={tempProfile.personalInformation?.summary || ""}
                        onChange={handleChange}
                        name="summary"
                        id="summary"
                        data-testid="summary-textarea"
                        placeholder="Short bio, career goals, highlights..."
                        className={`w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition resize-none
                                    focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white
                                    ${fieldErrors['summary']
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                    />
                    {fieldErrors['summary'] && (
                        <p role="alert" className="text-red-500 text-xs mt-1">{fieldErrors['summary']}</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-1 border-t border-gray-100">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    data-testid="save-changes-btn"
                    className="flex items-center gap-2 bg-[#2257a7] hover:bg-[#1a4590] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <CircleCheck className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
});

PersonalInfoSection.displayName = "PersonalInfoSection";

export default PersonalInfoSection;
