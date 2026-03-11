"use client";
import React from "react";
import RightSection from "./_components/RightSection";
import MainSection from "./_components/MainSection";
import { ProfileContextProvider } from "./context/ProfileContext";
import { ProfileData } from "./_types/ProfileData";

const ProfileContent = ({ initialData }: { initialData?: ProfileData }) => {
    return (
        <div className="ml-4">
            <h1 className="text-2xl font-bold mt-4">Profile</h1>
            <div className="min-h-screen  bg-gray-200 px-4 mt-4 rounded-tl-[20px] rounded-bl-[20px]">
                <div className="flex gap-4">
                    <MainSection initialData={initialData} />
                    <RightSection />
                </div>
            </div>
        </div>
    );
};

//  Main page component
const ProfilePage = ({ initialData }: { initialData?: ProfileData }) => {
    return (
        <ProfileContextProvider>
            <ProfileContent initialData={initialData} />
        </ProfileContextProvider>
    );
};

export default ProfilePage;
