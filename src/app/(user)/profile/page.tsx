"use client";
import React from "react";
import RightSection from "./_components/RightSection";
import MainSection from "./_components/MainSection";
import { ProfileContextProvider } from "./context/ProfileContext";
import { useDashboard } from "@/contexts/DashboardContext";

const ProfileContent = () => {
    const { data: dashboardData } = useDashboard();

    return (
        <div className="ml-4">
            <h1 className="text-2xl font-bold mt-4">Profile</h1>
            <div className="min-h-screen  bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
                <div className="flex gap-4 w-full">
                    <MainSection />
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
