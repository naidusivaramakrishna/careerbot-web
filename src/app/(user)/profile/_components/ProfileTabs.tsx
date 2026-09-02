"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import ResumeSection from "./ResumeSection";
import ProjectsSection from "./projects/ProjectsSection";
import { FaAward, FaBriefcase, FaFolderOpen, FaStar, FaUserCircle, FaUserGraduate } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import { FileUp } from "lucide-react";

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
  const { profileData, activeTab, setActiveTab } = useProfileContext();
  const [tempProfile, setTempProfile] = useState(profile);

  useEffect(() => {
    setTempProfile(profileData);
  }, [profileData]);

  const profileTabs = useMemo(() => [
    {
      label: "Personal Information",
      text: "Personal",
      icon: <FaUserCircle />,
      content: <PersonalInfoSection ref={personalInfoRef} tempProfile={tempProfile} setTempProfile={setTempProfile} setProfile={setProfile} />,
    },
    {
      label: "Education",
      text: "Education",
      icon: <FaUserGraduate />,
      content: <EducationSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Work Experience",
      text: "Work Experience",
      icon: <FaBriefcase />,
      content: <WorkExperienceSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Skills",
      text: "Skills",
      icon: <FaStar />,
      content: <SkillsSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Certifications",
      text: "Certifications",
      icon: <FaAward />,
      content: <CertificationsSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Employment Information",
      text: "Employment Info",
      icon: <FiFileText />,
      content: <EmploymentInfoSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Projects",
      text: "Projects",
      icon: <FaFolderOpen />,
      content: <ProjectsSection tempProfile={tempProfile} setTempProfile={setTempProfile} />,
    },
    {
      label: "Resume",
      text: "Resume",
      icon: <FileUp size={14} />,
      content: <ResumeSection setTempProfile={setTempProfile} />,
    },
  ], [tempProfile, setTempProfile, setProfile, personalInfoRef]);

  const handleTabChange = useCallback((label: string) => {
    setActiveTab(label);
  }, [setActiveTab]);

  return <Tabs tabs={profileTabs} active={activeTab} onChange={handleTabChange} />;
}
