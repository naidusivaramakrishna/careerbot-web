"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { ProfileData } from "../_types/ProfileData";

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ProfileContextType {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarActiveTab: string;
  setSidebarActiveTab: (tab: string) => void;
  clearSidebarActive: () => void;
  dynamicSections: Section[];
  addSection: (section: Section) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileContextProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData>({}); // Initialize with empty ProfileData
  const [activeTab, setActiveTab] = useState("Personal Information"); // default tab
  const [sidebarActiveTab, setSidebarActiveTab] = useState("Personal Information");
  const [dynamicSections, setDynamicSections] = useState<Section[]>([]);

  const clearSidebarActive = () => setSidebarActiveTab("");

  const addSection = (section: Section) => {
    if (dynamicSections.find((s) => s.id === section.id)) return; // prevent duplicate
    setDynamicSections((prev) => [...prev, section]);
    setSidebarActiveTab(section.id);
    setActiveTab(section.id);
  };

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        setProfileData,
        activeTab,
        setActiveTab,
        sidebarActiveTab,
        setSidebarActiveTab,
        clearSidebarActive,
        dynamicSections,
        addSection,
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