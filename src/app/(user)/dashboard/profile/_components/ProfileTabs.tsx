"use client";
import { useState, useEffect } from "react";
import { Award, Briefcase, CircleUserRound, FileText, GraduationCap, Lightbulb } from "lucide-react";
import EducationSection from "./education/EducationSection";
import CertificationsSection from "./certifications/CertificationsSection";
import { useProfileContext } from "../context/ProfileContext";
import Tabs from "@/components/common/Tabs";
import { ProfileData } from "../_types/ProfileData";
import { PersonalInfoRef } from "../_types/PersonalInfoRef";
import WorkExperienceSection from "./experience/WorkExperienceSection";
import PersonalInfoSection from "./PersonalInfoSection";
import SkillsSection from "./SkillsSection";
import EmploymentInfoSection from "./employmentInfo/EmploymentInfoSection";
import logger from "@/lib/logger";

interface ProfileTabsProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  personalInfoRef: React.Ref<PersonalInfoRef>;
}

export default function ProfileTabs({
  profile,
  setProfile,
  personalInfoRef,
}: ProfileTabsProps) {
  const { profileData, activeTab, setActiveTab, clearSidebarActive } = useProfileContext();
  const [tempProfile, setTempProfile] = useState(profile);

  // Sync tempProfile with profileData from context
  useEffect(() => {
    setTempProfile(profileData);
    logger.info("Profile Data synced in ProfileTabs:", profileData); // Debug log
  }, [profileData]);

  const profileTabs = [
    {
      label: "Personal Information",
      text: "Personal",
      icon: <CircleUserRound />,
      content: <PersonalInfoSection ref={personalInfoRef} tempProfile={tempProfile} setTempProfile={setTempProfile} setProfile={setProfile} />,
    },
    {
      label: "Education",
      text: "Education",
      icon: <GraduationCap />,
      content: <EducationSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Work Experience",
      text: "Work Experience",
      icon: <Briefcase />,
      content: <WorkExperienceSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Skills",
      text: "Skills",
      icon: <Lightbulb />,
      content: <SkillsSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Certifications",
      text: "Certifications",
      icon: <Award />,
      content: <CertificationsSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Employment Information",
      text: "Employment Info",
      icon: <FileText />,
      content: <EmploymentInfoSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    }
  ];

  const handleTabChange = (label: string) => {
    setActiveTab(label);
    clearSidebarActive();
  };

  return <Tabs tabs={profileTabs} active={activeTab} onChange={handleTabChange} />;
}