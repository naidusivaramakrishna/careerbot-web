"use client";
import { Camera, Github, Mail, MapPin, Phone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import ProfileTabs from './ProfileTabs';
import Image from 'next/image';
import { toast } from 'sonner';
import { ProfileData } from '../_types/ProfileData';
import { PersonalInfoRef } from '../_types/PersonalInfoRef';
import { getProfile, getProfilePicture, uploadProfilePicture, deleteProfilePicture, UserProfile, getEducation, getExperience, getSkills, getEmploymentInfo, Skill } from '@/api/userApi';
import { logger } from '@/lib/logger';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';

interface ProfileAvatarProps {
  selectedImage: string | null;
  isHovering: boolean;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileAvatar = ({
  selectedImage, isHovering, onHoverEnter, onHoverLeave,
  onDelete, onUpload, fileInputRef, onChange,
}: ProfileAvatarProps) => (
  <div
    className="relative w-20 h-20 shrink-0"
    onMouseEnter={onHoverEnter}
    onMouseLeave={onHoverLeave}
  >
    <div className="w-full h-full rounded-full border-2 border-[#2257a7] bg-gray-100 overflow-hidden flex items-center justify-center">
      {selectedImage ? (
        <Image src={selectedImage} alt="profile" fill className="object-cover rounded-full" unoptimized={selectedImage.startsWith('http')} />
      ) : (
        <Image src="/assets/icons/user_icon.svg" alt="user-icon" width={36} height={36} />
      )}
    </div>
    {isHovering && selectedImage && (
      <button
        type="button"
        onClick={onDelete}
        data-testid="delete-profile-pic-btn"
        aria-label="Delete profile picture"
        className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 transition"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    )}
    <button
      type="button"
      onClick={onUpload}
      data-testid="upload-profile-pic-btn"
      aria-label="Upload profile picture"
      className="absolute bottom-0 right-0 w-6 h-6 bg-[#2257a7] rounded-full flex items-center justify-center hover:scale-110 transition shadow"
    >
      <Camera className="w-3.5 h-3.5 text-white" />
    </button>
    <input
      type="file"
      accept="image/*"
      className="hidden"
      ref={fileInputRef}
      id="profile-picture"
      name="profile_picture"
      data-testid="profile-pic-input"
      onChange={onChange}
    />
  </div>
);

const MainSection = ({ initialData }: { initialData?: ProfileData }) => {
  const { profileData, setProfileData, setActiveTab, setProfilePicUrl } = useProfileContext();
  const personalInfoRef = useRef<PersonalInfoRef | null>(null);
  const [username, setUsername] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Show preview instantly
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const res = await uploadProfilePicture(file);

      if (res.picture_url) {
        const fullUrl = res.picture_url.startsWith("http")
          ? res.picture_url
          : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}${res.picture_url}`;
        setSelectedImage(fullUrl);
        // Sync image with sidebar via ProfileContext
        setProfilePicUrl(fullUrl);
        // Dispatch event to sync with Sidebar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { profilePicUrl: fullUrl } }));
        }
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch (error) {
      logger.error("Error uploading profile picture:", error);
      toast.error("Failed to upload image");
    } finally {
      toast.dismiss();
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!selectedImage) return;

    try {
      const result = await deleteProfilePicture();
      setSelectedImage(null);
      // Sync deletion with sidebar via ProfileContext
      setProfilePicUrl(null);
      // Dispatch event to sync with Sidebar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { profilePicUrl: null } }));
      }
      toast.success(result.message);
    } catch (error) {
      logger.error("Error deleting profile picture:", error);
      toast.error("Failed to delete profile picture");
    }
  };

  // Map backend UserProfile to frontend ProfileData
  const mapBackendToFrontend = (backendProfile: UserProfile): ProfileData => {
    return {
      personalInformation: {
        fullName: backendProfile.full_name || backendProfile.username || '',
        headline: backendProfile.headline || '',
        location: backendProfile.location || '',
        email: backendProfile.email || '',
        phone: backendProfile.phone_number || '',
        linkedin: backendProfile.linkedin_url || '',
        github: backendProfile.github_url || '',
        summary: backendProfile.summary || '',
      }
    };
  };

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // ✅ httpOnly cookies are sent automatically - no need to check localStorage
        const backendProfile = await getProfile();
        setUsername(backendProfile.username ?? null)
        setUserEmail(backendProfile.email ?? null);
        setIsEmailVerified(backendProfile.is_verified ?? false);
        const mappedProfile = mapBackendToFrontend(backendProfile);

        // Fetch all profile sections in parallel to ensure completion score calculates correctly
        const [education, experience, skills, employmentInfo] = await Promise.all([
          getEducation().catch(() => []),
          getExperience().catch(() => []),
          getSkills().catch(() => []),
          getEmploymentInfo().catch(() => ({}))
        ]);

        // Set complete profile data with all sections
        setProfileData((prev) => ({
          ...prev,
          personalInformation: mappedProfile.personalInformation,
          education: education,
          workExperience: experience,
          skills: skills.map((s: Skill) => s.name),
          employmentInfo: employmentInfo,
        }));

        // ✅ Fetch profile picture from backend
        try {
          const pictureRes = await getProfilePicture();

          if (pictureRes?.picture_url) {
            const fullImageUrl = pictureRes.picture_url.startsWith("http")
              ? pictureRes.picture_url
              : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}${pictureRes.picture_url}`;

            setSelectedImage(fullImageUrl); // <-- Image now persists after reload
            setProfilePicUrl(fullImageUrl); // Sync with sidebar
          }
        } catch (err) {
          logger.warn("No profile picture found");
        }

        toast.success('Profile loaded successfully');
      } catch (err: unknown) {
        logger.error('Error fetching profile:', err);

        const error = err as { response?: { status?: number; data?: { detail?: string } } };
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again');
        } else if (error.response?.status === 404) {
          // Profile doesn't exist yet - this is fine for new users
          logger.info('No profile found. User can create one.');
        } else {
          toast.error(error.response?.data?.detail || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [setProfileData]);

  // Prefill profile when imported (optional)
  useEffect(() => {
    if (initialData && !loading) {
      setProfileData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData, loading, setProfileData]);

  const hasProfileData = !!profileData?.personalInformation?.fullName;
  // Show loading state
  if (loading) {
    return (
      <div className="flex-4 min-w-0 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2257a7] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-4 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col my-4">
      {/* Email Verification Banner */}
      {userEmail && !isEmailVerified && (
        <div className="px-6 pt-4">
          <EmailVerificationBanner userEmail={userEmail} isVerified={isEmailVerified} />
        </div>
      )}

      {/* ── Profile Header ── */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-100">
        {!hasProfileData ? (
          /* Welcome state */
          <div className="flex items-center gap-5">
            <ProfileAvatar
              selectedImage={selectedImage}
              isHovering={isHoveringImage}
              onHoverEnter={() => setIsHoveringImage(true)}
              onHoverLeave={() => setIsHoveringImage(false)}
              onDelete={handleDeleteImage}
              onUpload={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onChange={handleImageChange}
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Welcome, {username ?? "User"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Complete your profile to unlock personalised job matches.
              </p>
            </div>
          </div>
        ) : (
          /* Filled profile state */
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-5">
              <ProfileAvatar
                selectedImage={selectedImage}
                isHovering={isHoveringImage}
                onHoverEnter={() => setIsHoveringImage(true)}
                onHoverLeave={() => setIsHoveringImage(false)}
                onDelete={handleDeleteImage}
                onUpload={() => fileInputRef.current?.click()}
                fileInputRef={fileInputRef}
                onChange={handleImageChange}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                  {profileData?.personalInformation?.fullName}
                </h2>
                {profileData?.personalInformation?.headline && (
                  <p className="text-sm text-[#2257a7] font-medium mt-0.5">
                    {profileData.personalInformation.headline}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                  {profileData?.personalInformation?.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {profileData.personalInformation.location}
                    </span>
                  )}
                  {profileData?.personalInformation?.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {profileData.personalInformation.email}
                    </span>
                  )}
                  {profileData?.personalInformation?.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {profileData.personalInformation.phone}
                    </span>
                  )}
                </div>

                {/* Social links */}
                <div className="flex gap-2 mt-3">
                  {profileData?.personalInformation?.linkedin ? (
                    <a
                      href={profileData.personalInformation.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="linkedin-link"
                      className="flex items-center gap-1.5 text-xs font-medium text-[#0A66C2] bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5 hover:bg-blue-100 transition"
                    >
                      <Image src="/assets/icons/linkedin-icon.svg" alt="linkedin" width={14} height={14} />
                      LinkedIn
                    </a>
                  ) : (
                    <button
                      type="button"
                      data-testid="add-linkedin-btn"
                      onClick={() => { setActiveTab("Personal Information"); setTimeout(() => personalInfoRef.current?.focusLinkedin(), 100); }}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-100 transition"
                    >
                      <Image src="/assets/icons/linkedin-icon.svg" alt="linkedin" width={14} height={14} />
                      Add LinkedIn
                    </button>
                  )}

                  {profileData?.personalInformation?.github ? (
                    <a
                      href={profileData.personalInformation.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="github-link"
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-100 transition"
                    >
                      <Github className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                  ) : (
                    <button
                      type="button"
                      data-testid="add-github-btn"
                      onClick={() => { setActiveTab("Personal Information"); setTimeout(() => personalInfoRef.current?.focusGithub(), 100); }}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-100 transition"
                    >
                      <Github className="w-3.5 h-3.5" />
                      Add GitHub
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            {profileData?.personalInformation?.summary && (
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                {profileData.personalInformation.summary}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 pt-2 mb-8">
        <ProfileTabs
          profile={profileData}
          setProfile={setProfileData}
          personalInfoRef={personalInfoRef}
        />
      </div>
    </div>
  );
}

export default MainSection;
