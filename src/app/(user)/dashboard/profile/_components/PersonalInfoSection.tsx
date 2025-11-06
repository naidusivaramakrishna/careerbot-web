import { CircleCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { updateProfile } from '@/api/userApi';
import { ProfileData } from '../_types/ProfileData';
import { useProfileContext } from '../context/ProfileContext';

interface PersonalInfoSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
    setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const PersonalInfoSection = forwardRef(({ tempProfile, setTempProfile, setProfile }: PersonalInfoSectionProps, ref) => {
    const { setProfileData } = useProfileContext(); // ✅ Get context setter
    const linkedinRef = useRef<HTMLInputElement | null>(null);
    const githubRef = useRef<HTMLInputElement | null>(null);
    const [saving, setSaving] = useState(false);

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
    };

    // Map frontend ProfileData to backend UserProfile format
    const mapFrontendToBackend = (profile: ProfileData) => {
        return {
            full_name: profile.personalInformation?.fullName || '',
            headline: profile.personalInformation?.headline || '',
            phone_number: profile.personalInformation?.phone || '',
            location: profile.personalInformation?.location || '',
            summary: profile.personalInformation?.summary || '',
            linkedin_url: profile.personalInformation?.linkedin || '',
            github_url: profile.personalInformation?.github || '',
        };
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                toast.error('Please log in to save your profile');
                return;
            }

            // Map frontend data to backend format
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
                console.log('✅ Updated profile data after saving personal info:', newProfile);
                return newProfile;
            });

            toast.success('Profile updated successfully!');
        } catch (err: any) {
            console.error('Error updating profile:', err);

            if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again');
            } else if (err.response?.status === 400) {
                toast.error('Invalid profile data. Please check your inputs');
            } else {
                toast.error(err.response?.data?.detail || 'Failed to update profile');
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

    return (
        <div>
            {/* Form fields */}
            <div className="grid grid-cols-3 gap-4 my-4">
                <div>
                    <label className="text-base font-medium">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={tempProfile.personalInformation?.fullName || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="text-base font-medium">Headline</label>
                    <input
                        type="text"
                        name="headline"
                        value={tempProfile.personalInformation?.headline || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="Software Engineer"
                    />
                </div>
                <div>
                    <label className="text-base font-medium">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={tempProfile.personalInformation?.location || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="New York, USA"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-base font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={tempProfile.personalInformation?.email || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="john@example.com"
                    />
                </div>
                <div>
                    <label className="text-base font-medium">Phone</label>
                    <input
                        type="text"
                        name="phone"
                        value={tempProfile.personalInformation?.phone || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="+91 9876543210"
                    />
                </div>
                <div>
                    <label className="text-base font-medium">LinkedIn</label>
                    <input
                        ref={linkedinRef}
                        type="text"
                        name="linkedin"
                        value={tempProfile.personalInformation?.linkedin || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="https://linkedin.com/in/johndoe"
                    />
                </div>
                <div>
                    <label className="text-base font-medium">GitHub</label>
                    <input
                        ref={githubRef}
                        type="text"
                        name="github"
                        value={tempProfile.personalInformation?.github || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        placeholder="https://github.com/johndoe"
                    />
                </div>
            </div>
            <div className='mt-4'>
                <label className="text-base font-medium">Professional Summary</label>
                <div className="relative w-full">
                    <textarea
                        rows={5}
                        value={tempProfile.personalInformation?.summary || ""}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 px-10 py-3 rounded-lg bg-white outline-neutral-500"
                        name="summary"
                        id="summary"
                        placeholder="Short bio, career goals, highlights..."
                    ></textarea>
                    <Sparkles className="absolute right-4 top-4 text-[#1F00EC] w-6 h-6 cursor-pointer" />
                </div>
            </div>
            <div className='flex justify-between'>
                <div className='flex items-center gap-2'>
                    <Image src="/assets/icons/magic-pencil.svg" className='w-6 h-6' width={12} height={12} alt='magic-pencil' />
                    <div>Let AI help you write this summary....</div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#155DFC] text-white flex gap-2 cursor-pointer items-center justify-self-end my-4 px-4 py-2 rounded-lg hover:bg-[#0d4acc] transition disabled:opacity-50 disabled:cursor-not-allowed"
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