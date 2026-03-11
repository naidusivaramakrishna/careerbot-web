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
      <div className="w-3/4 max-w-[1200px] overflow-hidden bg-white rounded-2xl my-4 shadow-md p-4 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-4/5 max-w-[1200px]  overflow-hidden bg-white rounded-2xl my-4 shadow-md p-4 flex flex-col">
      {/* Email Verification Banner */}
      {userEmail && !isEmailVerified && (
        <div className="mb-4">
          <EmailVerificationBanner userEmail={userEmail} isVerified={isEmailVerified} />
        </div>
      )}

      {!hasProfileData && (
        <div className="flex items-center gap-6 bg-[#F9FAFB] p-6">
          {/* Profile Image */}
          <div
            className="relative w-24 h-24"
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
          >
            <div className="w-full h-full flex items-center justify-center bg-[#D9D9D9] rounded-full border-2 border-[#1099C6] overflow-hidden">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt="profile"
                  fill
                  className="object-cover rounded-full"
                  unoptimized={selectedImage.startsWith('http')}
                />
              ) : (
                <Image
                  src="/assets/icons/user_icon.svg"
                  alt="user-icon"
                  width={40}
                  height={40}
                />
              )}
            </div>

            {/* Delete icon - shows on hover if image exists */}
            {isHoveringImage && selectedImage && (
              <div
                onClick={handleDeleteImage}
                className="bg-red-500 flex items-center justify-center absolute top-0 right-0 w-6 h-6 rounded-full cursor-pointer hover:scale-105 transition"
              >
                <X className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Camera icon */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#1099C6] flex items-center justify-center absolute bottom-0 right-0 w-6 h-6 rounded-full cursor-pointer hover:scale-105 transition"
            >
              <Camera className="w-4 h-4 text-white" />
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
          {/* Welcome Text */}
          <div className='text-center flex-1'>
            <h1 className="text-2xl font-semibold text-black">
              Welcome to CareerBot,{" "}
              {username ? username : "User"}
            </h1>
            <p className="text-gray-600 text-base">
              Let&apos;s create your profile and connect you to your dream role.
            </p>
          </div>
        </div>
      )}

      {hasProfileData && (
        <div className='flex flex-col gap-3'>
          {/* Profile Info */}
          <div className="flex-1">
            <div className='flex items-center gap-4'>
              <div
                className="relative w-24 h-24"
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
              >
                <div className="w-full h-full flex items-center justify-center bg-[#D9D9D9] rounded-full border-2 border-[#1099C6] overflow-hidden">
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt="profile"
                      fill
                      className="object-cover w-full h-full rounded-full"
                      unoptimized={selectedImage.startsWith('http')}
                    />
                  ) : (
                    <Image
                      src="/assets/icons/user_icon.svg"
                      alt="user-icon"
                      width={40}
                      height={40}
                    />
                  )}
                </div>

                {/* Delete icon - shows on hover if image exists */}
                {isHoveringImage && selectedImage && (
                  <div
                    onClick={handleDeleteImage}
                    className="bg-gray-500 flex items-center justify-center absolute top-0 right-0 w-6 h-6 rounded-full cursor-pointer hover:scale-105 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#1099C6] flex items-center justify-center absolute bottom-0 right-0 w-6 h-6 rounded-full cursor-pointer hover:scale-105 transition"
                >
                  <Camera className="w-4 h-4 text-white" />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </div>
              <div className='text-gray-600'>
                <h1 className="uppercase text-black text-xl font-semibold">{profileData?.personalInformation?.fullName}</h1>
                <span className='text-neutral-600 text-sm'>{profileData?.personalInformation?.headline || ""}</span>
                <div className='flex justify-between gap-6 mt-1'>
                  {profileData?.personalInformation?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className='text-sm'>{profileData?.personalInformation?.location}</span>
                    </div>
                  )}
                  {profileData?.personalInformation?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span className='text-sm'>{profileData?.personalInformation?.email}</span>
                    </div>
                  )}
                  {profileData?.personalInformation?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span className='text-sm'>{profileData?.personalInformation?.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {profileData?.personalInformation?.summary && (
            <span className='text-neutral-600 border border-gray-400 rounded-lg text-sm my-4 p-2'>{profileData.personalInformation.summary}</span>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3'>
            {/* LinkedIn Button */}
            {profileData?.personalInformation?.linkedin ? (
              <a
                href={profileData.personalInformation.linkedin.startsWith("https:www.linkedin")
                  ? profileData.personalInformation.linkedin
                  : `${profileData.personalInformation.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className='flex text-sm gap-2 text-md items-center border shadow-sm bg-white rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50 transition text-[#0A66C2]'
              >
                <Image src="/assets/icons/linkedin-icon.svg" alt='linkedin-icon' className='w-4 h-4' width={20} height={20} />
                <span className='font-semibold'>LinkedIn</span>
              </a>
            ) : (
              <button
                onClick={() => {
                  setActiveTab("Personal Information");
                  setTimeout(() => {
                    personalInfoRef.current?.focusLinkedin();
                  }, 100);
                }}
                className='flex gap-2 text-md items-center border shadow-sm bg-white rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50 transition'
              >
                {/* <Linkedin className='w-5 h-5' /> */}
                <Image src="/assets/icons/linkedin-icon.svg" alt='linkedin-icon' className='w-4 h-4' width={20} height={20} />
                <span className='font-semibold'>Update</span>
              </button>
            )}

            {/* GitHub Button */}
            {profileData?.personalInformation?.github ? (
              <a
                href={profileData.personalInformation.github.startsWith("https:www.github")
                  ? profileData.personalInformation.github
                  : `${profileData.personalInformation.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className='flex gap-2 text-sm items-center border  shadow-sm bg-white rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50 transition text-black'
              >
                <Github className='w-5 h-5' />
                <span className='font-semibold'>GitHub</span>
              </a>
            ) : (
              <button
                onClick={() => {
                  setActiveTab("Personal Information");
                  setTimeout(() => {
                    personalInfoRef.current?.focusGithub();
                  }, 100);
                }}
                className='flex gap-2 text-sm items-center border shadow-sm bg-white rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition'
              >
                <Github className='w-4 h-4' />
                <span className='font-semibold'>Connect</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className='mt-8'>
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
