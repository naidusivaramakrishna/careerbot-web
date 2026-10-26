"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { FaAward, FaBriefcase, FaFolderOpen, FaStar, FaUniversity, FaUserCircle, FaUserGraduate } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import { FileUp } from "lucide-react";
import { useStudentRecord } from "@/hooks/useStudentRecord";
import { onAccountChanged } from "@/lib/accountChange";
import CollegeProfileSection from "./CollegeProfileSection";

/** The College tab's label, and the tab a student lands on once (spec item 5). */
export const COLLEGE_TAB = "College";

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

  // STUDENTS ONLY: the College tab, first, and the tab they land on -- once.
  // After that their own choice sticks (a re-render must not yank them back).
  const studentRecord = useStudentRecord();
  const isStudent = studentRecord.status === "ready";
  const landedOnCollege = useRef(false);
  // Set when the College tab vanished while open (below): it is reopened when
  // the record comes back, unless the student has moved on meanwhile.
  const fellBackFromCollege = useRef(false);
  // A different account (in-page sign-in) lands on College once again.
  useEffect(() => onAccountChanged(() => {
    landedOnCollege.current = false;
    fellBackFromCollege.current = false;
  }), []);
  useEffect(() => {
    if (!isStudent) return;
    // Land only while the tab is still the untouched default: a tab the
    // student picked while the record was loading is their choice.
    const untouched = activeTab === "Personal Information";
    if (!landedOnCollege.current) {
      landedOnCollege.current = true;
      if (untouched) setActiveTab(COLLEGE_TAB);
    } else if (fellBackFromCollege.current) {
      fellBackFromCollege.current = false;
      if (untouched) setActiveTab(COLLEGE_TAB);
    }
    // activeTab is read, not a trigger: only the record arriving lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, setActiveTab]);
  // The College tab exists only while the record is ready. If it goes away
  // while open (the college session is being re-minted, or ended), Tabs would
  // find no content and render a blank page: fall back to Personal.
  useEffect(() => {
    if (!isStudent && activeTab === COLLEGE_TAB) {
      fellBackFromCollege.current = true;
      setActiveTab("Personal Information");
    }
  }, [isStudent, activeTab, setActiveTab]);

  const collegeTab = useMemo(
    () => (studentRecord.status === "ready"
      ? [{
          label: COLLEGE_TAB,
          text: COLLEGE_TAB,
          icon: <FaUniversity />,
          content: <CollegeProfileSection record={studentRecord.record} />,
        }]
      : []),
    [studentRecord],
  );

  const profileTabs = useMemo(() => [
    ...collegeTab,
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
  ], [collegeTab, tempProfile, setTempProfile, setProfile, personalInfoRef]);

  const handleTabChange = useCallback((label: string) => {
    setActiveTab(label);
  }, [setActiveTab]);

  return <Tabs tabs={profileTabs} active={activeTab} onChange={handleTabChange} />;
}
