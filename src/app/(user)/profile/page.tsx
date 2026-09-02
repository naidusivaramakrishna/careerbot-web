"use client";
import React, { useEffect, useState } from "react";
import RightSection from "./_components/RightSection";
import MainSection from "./_components/MainSection";
import { ProfileContextProvider } from "./context/ProfileContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { getProfile } from "@/api/userApi";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

const ProfileContent = () => {
    const { data: dashboardData } = useDashboard();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

    useEffect(() => {
        const fetchEmailData = async () => {
            try {
                const profile = await getProfile();
                setUserEmail(profile.email ?? null);
                setIsEmailVerified(profile.is_verified ?? false);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        };

        fetchEmailData();
    }, []);

    return (
        <div className="ml-4">
            <h1 className="text-xl font-bold mt-4 text-gray-800">Profile</h1>

            <div className="min-h-screen bg-[#F4F6F9] px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px] flex flex-col gap-4">
                {/* Main content flex row */}
                <div className="flex gap-4 w-full">
                    {/* Left column: Banner and MainSection */}
                    <div className="flex-4 min-w-0 flex flex-col ">
                        {/* Email Verification Banner - Matches MainSection width */}
                        {userEmail && !isEmailVerified && (
                            <EmailVerificationBanner userEmail={userEmail} isVerified={isEmailVerified} />
                        )}
                        <MainSection />
                    </div>
                    {/* Right column: RightSection */}
                    <RightSection
                        completeness={dashboardData?.profile?.completeness ?? 0}
                        missingFields={dashboardData?.profile?.missing_fields ?? []}
                    />
                </div>
            </div>
        </div>
    );
};

export default function ProfilePage() {
    return (
        <ProfileContextProvider>
            <ProfileContent />
        </ProfileContextProvider>
    );
}
