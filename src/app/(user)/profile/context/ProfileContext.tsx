"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { ProfileData } from "../_types/ProfileData";

interface ProfileContextType {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profilePicUrl: string | null;
  setProfilePicUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileContextProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [activeTab, setActiveTab] = useState("Personal Information");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        setProfileData,
        activeTab,
        setActiveTab,
        profilePicUrl,
        setProfilePicUrl,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used inside ProfileContextProvider");
  }
  return context;
}
