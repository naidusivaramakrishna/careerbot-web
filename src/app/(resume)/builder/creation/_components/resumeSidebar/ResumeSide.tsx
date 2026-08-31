"use client";
import React, { useState, useEffect, useRef } from "react";
import { SidebarOpen } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import { useResume } from "../../_context/ResumeContext";
import Tabs from "./Tabs";
import EditorTab from "../editor/EditorTab";
import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
import AIReviewTab from "../aiReview/AIReviewTab";
import ScoreTab from "../score/ScoreTab";

import PersonalInfo from "../editor/sections/PersonalInfo";
import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
import Education from "../editor/sections/Education";
import WorkExperience from "../editor/sections/WorkExperience";
import Projects from "../editor/sections/Projects";
import Skills from "../editor/sections/Skills";
import Certifications from "../editor/sections/Certifications";
import Achievements from "../editor/sections/Achievements";
import Volunteering from "../editor/sections/Volunteering";
import References from "../editor/sections/References";
import Internships from "../editor/sections/Internships";
import Awards from "../editor/sections/Awards";

import { initialSections } from "../../_utils/sectionsConfig";
import Publications from "../editor/sections/Publications";
import Patents from "../editor/sections/Patents";
import Interests from "../editor/sections/Interests";
import Hobbies from "../editor/sections/Hobbies";
import Languages from "../editor/sections/Languages";
import Declaration from "../editor/sections/Declaration";

interface SectionProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (fieldKey: string, value: string) => void;
  onBlur: (fieldKey: string, value: string) => void;
}

const sectionComponents: Record<string, React.FC<SectionProps>> = {
  "Personal Info": PersonalInfo,
  "Professional Summary": ProfessionalSummary,
  Education,
  "Work Experience": WorkExperience,
  Projects,
  Skills,
  Certifications,
  Achievements,
  Volunteering,
  References,
  Internships,
  Awards,
  Publications,
  Patents,
  Interests,
  Hobbies,
  Languages,
  Declaration,
};

// Maps ATS report section names → builder section names
const ATS_SECTION_TO_BUILDER: Record<string, string> = {
  Contact: "Personal Info",
  Headline: "Professional Summary",
  Summary: "Professional Summary",
  Formatting: "Professional Summary",
  ATSCompatibility: "Personal Info",
  Experience: "Work Experience",
  WorkExperience: "Work Experience",
  ContentQuality: "Work Experience",
  Leadership: "Work Experience",
  Education: "Education",
  Skills: "Skills",
  Keywords: "Skills",
  Projects: "Projects",
  Certifications: "Certifications",
  Internships: "Internships",
  Achievements: "Achievements",
  Volunteering: "Volunteering",
  Awards: "Awards",
  Languages: "Languages",
  Publications: "Publications",
  Hobbies: "Hobbies",
  Interests: "Interests",
  References: "References",
};

interface ResumeSideProps {
  isTemplateSidebarOpen?: boolean;
  onToggleTemplateSidebar?: (isOpen: boolean) => void;
  resumeId?: string;
  initialTab?: string;
  defaultOpen?: boolean;
  /** ATS section name to auto-open on mount (e.g. "Experience", "Skills") */
  openSection?: string;
}

// All standard (non-custom) section names — used to avoid re-adding custom sections to extraSections on delete
const standardSectionNames = new Set([
  "Personal Info", "Professional Summary", "Education", "Skills",
  "Work Experience", "Projects", "Certifications", "Internships",
  "Achievements", "Publications", "Patents", "Volunteering", "Awards",
  "Hobbies", "Interests", "Languages", "References", "Declaration",
]);

const ResumeSide: React.FC<ResumeSideProps> = ({
  isTemplateSidebarOpen = true,
  onToggleTemplateSidebar,
  initialTab,
  defaultOpen = true,
  openSection,
}) => {
  // ✅ Get context first
  const {
    resumeData,
    setResumeData,
    isLoadingResume,
    completionStatus,
    setCompletionStatus,
    sectionOrder,
    setSectionOrder,
  } = useResume();

  // Defined before sections useState so both initializers can reference it
  const defaultExtraSections: { name: string; ai: boolean }[] = [
    { name: "Achievements", ai: true },
    { name: "Publications", ai: false },
    { name: "Patents", ai: false },
    { name: "Volunteering", ai: false },
    { name: "Awards", ai: false },
    { name: "Hobbies", ai: true },
    { name: "Interests", ai: true },
    { name: "Languages", ai: false },
    { name: "References", ai: false },
  ];

  const [sections, setSections] = useState(() => {
    if (!sectionOrder || sectionOrder.length === 0) {
      return initialSections;
    }

    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
    const hasSavedOrder = typeof window !== 'undefined' && !!localStorage.getItem(sectionOrderKey);

    if (hasSavedOrder) {
      // localStorage sectionOrder = exact main list (core + any extras the user added).
      // Use the full known-sections map so restored extra sections resolve correctly.
      // Only include Declaration if the backend sent it (domain-specific for government_standard).
      const declarationSection = sectionOrder.includes('Declaration') ? [{ name: "Declaration", ai: false }] : [];
      const allKnownSections = [...initialSections, ...defaultExtraSections, ...declarationSection];
      const sectionMap = new Map(allKnownSections.map(s => [s.name, s]));
      return sectionOrder
        .filter(name => sectionMap.has(name))
        .map(name => sectionMap.get(name)!)
        .filter(Boolean);
    }

    // No saved order: sectionOrder comes from getSectionOrderByDomainAndCareer() which lists ALL sections.
    // Only include Declaration if the backend sent it (domain-specific for government_standard).
    const declarationSection = sectionOrder.includes('Declaration') ? [{ name: "Declaration", ai: false }] : [];
    const sectionMap = new Map([...initialSections, ...declarationSection].map(s => [s.name, s]));
    const reordered = sectionOrder
      .filter(name => sectionMap.has(name))
      .map(name => sectionMap.get(name)!)
      .filter(Boolean);
    const orderedNames = new Set(reordered.map(s => s.name));
    const remaining = initialSections.filter(s => !orderedNames.has(s.name));
    return [...reordered, ...remaining];
  });

  const [extraSections, setExtraSections] = useState(() => {
    if (!sectionOrder || sectionOrder.length === 0) {
      return defaultExtraSections;
    }

    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
    const hasSavedOrder = typeof window !== 'undefined' && !!localStorage.getItem(sectionOrderKey);

    if (hasSavedOrder) {
      // localStorage sectionOrder = exact main list. Show everything NOT in it.
      const mainNames = new Set(sectionOrder);
      const allKnown = [
        ...defaultExtraSections,
        ...initialSections.filter(s => !defaultExtraSections.some(d => d.name === s.name)),
      ];
      return allKnown.filter(s => !mainNames.has(s.name));
    }

    // No saved order: sectionOrder = getSectionOrder() which includes ALL sections.
    // The main list only has initialSections, so all defaultExtraSections are available.
    return defaultExtraSections;
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState(initialTab ?? "Editor");
  const [pendingOpenSection, setPendingOpenSection] = useState<string | null>(null);
  const [pendingEditEntryIndex, setPendingEditEntryIndex] = useState<number | null>(null);

  // Auto-open the section specified by the ATS report "Fix Now" button
  const openSectionDone = useRef(false);
  useEffect(() => {
    if (!openSection || isLoadingResume || openSectionDone.current) return;
    openSectionDone.current = true;
    const builderName = ATS_SECTION_TO_BUILDER[openSection] ?? openSection;
    const idx = sections.findIndex(s => s.name === builderName);
    if (idx !== -1) {
      setIsOpen(true);
      setActiveTab("Editor");
      setActiveSection(idx);
    }
  }, [openSection, isLoadingResume, sections]);
  
  const clearErrors = (fields?: string[]) => {
  if (!fields || fields.length === 0) {
    // Clear all errors
    setErrors({});
  } else {
    // Clear specific field errors
    setErrors(prev => {
      const newErrors = { ...prev };
      fields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  }
};

  // ✅ Populate formData from resumeData when it loads
  useEffect(() => {
    if (!isLoadingResume && resumeData) {
      const newFormData: Record<string, string> = {};

      // Personal Info
      newFormData["fullname"] = resumeData.personalInfo?.fullname || "";
      newFormData["email"] = resumeData.personalInfo?.email || "";
      newFormData["countryCode"] = resumeData.personalInfo?.countryCode || "+91";
      newFormData["phone"] = resumeData.personalInfo?.phone || "";
      newFormData["location"] = resumeData.personalInfo?.location || "";
      newFormData["linkedinUrl"] = resumeData.personalInfo?.linkedinUrl || "";
      newFormData["githubUrl"] = resumeData.personalInfo?.githubUrl || "";
      newFormData["portfolioUrl"] = resumeData.personalInfo?.portfolioUrl || "";

      // Government Standard Fields
      newFormData["dateOfBirth"] = resumeData.personalInfo?.dateOfBirth || "";
      newFormData["nationality"] = resumeData.personalInfo?.nationality || "";
      newFormData["category"] = resumeData.personalInfo?.category || "";
      newFormData["knownLanguages"] = resumeData.personalInfo?.languages || "";
      newFormData["fathersName"] = resumeData.personalInfo?.fathersName || "";
      newFormData["gender"] = resumeData.personalInfo?.gender || "";
      newFormData["maritalStatus"] = resumeData.personalInfo?.maritalStatus || "";
      newFormData["permanentAddress"] = resumeData.personalInfo?.permanentAddress || "";

      // Healthcare Fields
      newFormData["titlePrefix"] = resumeData.personalInfo?.titlePrefix || "";
      newFormData["qualifications"] = resumeData.personalInfo?.qualifications || "";
      newFormData["specialisation"] = resumeData.personalInfo?.specialisation || "";
      newFormData["medicalRegNo"] = resumeData.personalInfo?.medicalRegNo || "";

      // Legal Fields
      newFormData["barEnrollmentNo"] = resumeData.personalInfo?.barEnrollmentNo || "";
      newFormData["yearOfEnrollment"] = resumeData.personalInfo?.yearOfEnrollment || "";
      newFormData["courtsOfPractise"] = resumeData.personalInfo?.courtsOfPractise || "";

      // Marine Fields
      newFormData["rank"] = resumeData.personalInfo?.rank || "";
      newFormData["cocNumber"] = resumeData.personalInfo?.cocNumber || "";
      newFormData["vesselTypes"] = resumeData.personalInfo?.vesselTypes || "";
      newFormData["stcwCertificates"] = resumeData.personalInfo?.stcwCertificates || "";

      // Research Scholar Fields
      newFormData["orcidId"] = resumeData.personalInfo?.orcidId || "";
      newFormData["hIndex"] = resumeData.personalInfo?.hIndex || "";
      newFormData["googleScholarUrl"] = resumeData.personalInfo?.googleScholarUrl || "";
      
      // Professional Summary
      newFormData["professionalSummary"] = resumeData.professionalSummary.summary || "";
      newFormData["targetRole"] = resumeData.professionalSummary.targetRole || "";
      
      // Skills is intentionally excluded from formData — the Skills component writes
      // directly to resumeData.categorizedSkills via chip inputs and autosave reads
      // from context, not formData. Including it here created a stale snapshot that
      // caused validateSectionFields to treat the empty initial value as a missing
      // required field and block Save with "Please fill in all required fields".
      //
      // Multi-entry sections (Education, Work Experience, Projects, etc.) are also
      // excluded from formData. They manage their own state (savedEntries / editingEntries)
      // and write directly to resumeData — they never read from formData.
      
      setFormData(newFormData);
    }
  // Intentionally omit resumeData from deps: re-running on every context update
  // would overwrite formData while the user is actively typing in a section modal.
  // formData is populated once when the initial load completes (isLoadingResume → false).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingResume]);

  // Restore custom sections into the main sections list after initial load only
  useEffect(() => {
    if (!isLoadingResume && resumeData.customSections?.length) {
      setSections(prev => {
        const existingNames = new Set(prev.map(s => s.name));
        const toAdd = resumeData.customSections!
          .filter(cs => !existingNames.has(cs.sectionName))
          .map(cs => ({ name: cs.sectionName, ai: false }));
        return toAdd.length ? [...prev, ...toAdd] : prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingResume]);

  // Sync sections when sectionOrder changes (e.g. on career-level template switch).
  // Guards with name-comparison so the 500ms polling in ResumeContext doesn't cause
  // re-renders when the order hasn't actually changed.
  useEffect(() => {
    if (!sectionOrder || sectionOrder.length === 0) return;

    // Only include Declaration if the backend sent it (domain-specific for government_standard).
    const declarationSection = sectionOrder.includes('Declaration') ? [{ name: "Declaration", ai: false }] : [];
    const allKnownSections = [...initialSections, ...defaultExtraSections, ...declarationSection];
    const sectionMap = new Map(allKnownSections.map(s => [s.name, s]));

    setSections(prev => {
      const prevMap = new Map(prev.map(s => [s.name, s]));
      const initialNames = new Set(initialSections.map(s => s.name));
      const newSections = sectionOrder
        .map(name => sectionMap.get(name) || prevMap.get(name))
        .filter((s): s is { name: string; ai: boolean } => !!s && (initialNames.has(s.name) || prevMap.has(s.name)));

      const prevNames = prev.map(s => s.name).join(',');
      const newNames = newSections.map(s => s.name).join(',');
      if (prevNames === newNames) return prev;
      return newSections;
    });

    setExtraSections(prev => {
      const mainNames = new Set(sectionOrder);
      const filtered = defaultExtraSections.filter(s => !mainNames.has(s.name));
      const prevNames = prev.map(s => s.name).join(',');
      const newNames = filtered.map(s => s.name).join(',');
      if (prevNames === newNames) return prev;
      return filtered;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionOrder]);


  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...sections];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSections(items);
    // Persist drag order so polling doesn't revert it
    const newOrder = items.map(s => s.name);
    setSectionOrder(newOrder);
    try {
      const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = email ? `sectionOrder_${email}` : 'sectionOrder';
      localStorage.setItem(key, JSON.stringify(newOrder));
    } catch { /* ignore */ }
  };

  const SECTION_DATA_KEY_MAP: Record<string, string> = {
    "Work Experience": "workExperience",
    "Education": "education",
    "Projects": "projects",
    "Certifications": "certifications",
    "Internships": "internships",
    "Achievements": "achievements",
    "Awards": "awards",
    "Volunteering": "volunteering",
    "Publications": "publications",
    "Patents": "patents",
    "References": "references",
    "Hobbies": "hobbies",
    "Interests": "interests",
    "Languages": "languages",
    "Skills": "categorizedSkills",
  };

  const handleDeleteSection = (index: number) => {
    const removed = sections[index];
    setSections((prev) => prev.filter((_, i) => i !== index));
    // Only return standard sections to the "Add section" list — custom sections are deleted permanently
    if (standardSectionNames.has(removed.name)) {
      setExtraSections((prev) => [...prev, removed]);
    }
    if (activeSection === index) setActiveSection(null);

    // Clear section data from resumeData so the preview updates immediately
    const dataKey = SECTION_DATA_KEY_MAP[removed.name];
    if (dataKey) {
      const emptyValue = dataKey === "categorizedSkills"
        ? { programming_languages: [], frameworks: [], soft_skills: [], project_management: [], marketing_sales: [] }
        : [];
      setResumeData((prev) => ({ ...prev, [dataKey]: emptyValue }));
    }

    // Remove from sectionOrder so it doesn't come back on refresh
    const updatedOrder = (sectionOrder || []).filter(n => n !== removed.name);
    setSectionOrder(updatedOrder);
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      localStorage.setItem(key, JSON.stringify(updatedOrder));
    } catch { /* ignore */ }
  };

  const handleAddSection = (section: { name: string; ai: boolean }) => {
    setSections((prev) => [...prev, section]);
    setExtraSections((prev) => prev.filter((s) => s.name !== section.name));

    // Build order from the current sections state (accurate main list) + new section.
    // Do NOT use sectionOrder context here — it may contain ALL sections from getSectionOrder().
    const updatedOrder = [...sections.map(s => s.name), section.name];
    setSectionOrder(updatedOrder);
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const key = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      localStorage.setItem(key, JSON.stringify(updatedOrder));
    } catch { /* ignore */ }
  };

  // const handleChange = (key: string, value: string) => {
  //   setFormData((prev) => ({ ...prev, [key]: value }));
  // };
  const handleChange = (key: string, value: string) => {
  // Update form data
  setFormData(prev => ({
    ...prev,
    [key]: value
  }));
  
  // ✅ Clear error for this field when user starts typing
  if (errors[key]) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }
};


  // const handleBlur = (key: string, value: string) => {
  //   if (!value) {
  //     setErrors((prev) => ({ ...prev, [key]: "This field is required" }));
  //   } else {
  //     setErrors((prev) => {
  //       const updated = { ...prev };
  //       delete updated[key];
  //       return updated;
  //     });
  //   }
  // };
  const handleBlur = (key: string, value: string) => {
  const lowerKey = key.toLowerCase();
  const optionalFields = [
    "linkedin",
    "github",
    "portfolio",
    "currentlyworking",
    "link",
    "technologies",
    "description",
    "achievement",
    "category",
    "proficiencylevel",
  ];

  const isRequired = !optionalFields.some((optional) => lowerKey.includes(optional));

  const trimmed = value?.trim() ?? "";

  // Required-field empty check
  if (isRequired && !trimmed) {
    setErrors(prev => ({ ...prev, [key]: "This field is required" }));
    return;
  }

  // URL domain/prefix validation for LinkedIn, GitHub, Portfolio
  if (trimmed) {
    let urlError: string | null = null;

    if (key === "linkedinUrl") {
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        urlError = "LinkedIn URL must start with http:// or https://";
      } else if (!trimmed.includes("linkedin.com")) {
        urlError = "LinkedIn URL must be a linkedin.com address";
      }
    } else if (key === "githubUrl") {
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        urlError = "GitHub URL must start with http:// or https://";
      } else if (!trimmed.includes("github.com")) {
        urlError = "GitHub URL must be a github.com address";
      }
    } else if (key === "portfolioUrl") {
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        urlError = "Portfolio URL must start with http:// or https://";
      }
    }

    if (urlError) {
      setErrors(prev => ({ ...prev, [key]: urlError as string }));
      return;
    }
  }

  // Clear error
  setErrors(prev => {
    const newErrors = { ...prev };
    delete newErrors[key];
    return newErrors;
  });
};


  const handleFixNow = (atsSection: string, entryIndex?: number) => {
    const builderName = ATS_SECTION_TO_BUILDER[atsSection] ?? atsSection;
    setPendingEditEntryIndex(entryIndex ?? null);
    setPendingOpenSection(builderName);
  };

  const handleSidebarToggle = (isOpen: boolean) => {
    if (onToggleTemplateSidebar) {
      onToggleTemplateSidebar(isOpen);
    }
  };

  // ✅ Calculate completion status and update context
  useEffect(() => {
    const isFilled = (value?: string) => !!value && value.length > 0;
    const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;
    
    const newStatus: Record<string, boolean> = {
      "Personal Info":
        !!resumeData.personalInfo.fullname &&
        !!resumeData.personalInfo.email &&
        !!resumeData.personalInfo.phone &&
        !!resumeData.personalInfo.location,
      "Professional Summary": !!resumeData.professionalSummary.summary?.trim(),
      Education: resumeData.education.some(
        (edu) =>
          isFilled(edu.school) && isFilled(edu.degree) 
      ),
      Skills: isArrayFilled(resumeData.skills),
      "Work Experience": resumeData.workExperience.some(
        (exp) =>
          isFilled(exp.company) &&
          isFilled(exp.role)
      ),
      Projects: resumeData.projects.some(
        (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
      ),
      Certifications: resumeData.certifications.some(
        (cert) => isFilled(cert.name)),
      Achievements: resumeData.achievements.some(
        (ach) => isFilled(ach.title)),
      Awards: resumeData.awards.some(
        (awd) => isFilled(awd.title)),
      Volunteering: resumeData.volunteering.some(
        (vol) => isFilled(vol.organization) && isFilled(vol.role)
      ),
      References: resumeData.references.some(
        (ref) => isFilled(ref.name) && isFilled(ref.contact)
      ),
      Internships: resumeData.internships.some(
        (intern) => isFilled(intern.company) && isFilled(intern.role)
      ),
      Hobbies: resumeData.hobbies.some(
        (hobby) => isFilled(hobby.name)),
      Interests: resumeData.interests.some(
        (interest) => isFilled(interest.name)),
      Languages: resumeData.languages.some(
        (lang) => isFilled(lang.name)),
      Publications: resumeData.publications.some(
        (pub) => isFilled(pub.title)),
      Patents: (resumeData.patents ?? []).some(
        (pat) => isFilled(pat.title)),
    };
    
    // ✅ Update context completion status (used for progress circle)
    setCompletionStatus(newStatus);
    
  }, [resumeData, setCompletionStatus]);

  const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

  return (
    <div
      className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
        ${isOpen ? `${dynamicWidth}` : "w-12 p-0"}
      `}
    >

      {isOpen && (
        <Tabs
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isTemplateSidebarOpen={isTemplateSidebarOpen}
        />
      )}

      {isOpen && (
        <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
          {/* Always mounted so the fixed modal overlay works from any tab */}
          <div className={activeTab === "Editor" ? "flex flex-col flex-1" : "h-0 overflow-hidden"}>
            <EditorTab
              sections={sections}
              extraSections={extraSections}
              activeSection={activeSection}
              formData={formData}
              errors={errors}
              sectionComponents={sectionComponents}
              handleDeleteSection={handleDeleteSection}
              handleAddSection={handleAddSection}
              handleChange={handleChange}
              handleBlur={handleBlur}
              setActiveSection={setActiveSection}
              handleDragEnd={handleDragEnd}
              completionStatus={completionStatus}
              onSidebarToggle={handleSidebarToggle}
              clearErrors={clearErrors}
              setErrors={setErrors}
              pendingOpenSection={pendingOpenSection}
              pendingEditEntryIndex={pendingEditEntryIndex}
              onClearPendingSection={() => { setPendingOpenSection(null); setPendingEditEntryIndex(null); }}
            />
          </div>
          {activeTab === "Score" && <ScoreTab onFixNow={handleFixNow} />}
          {activeTab === "ResumeGPT" && <ResumeGPTTab />}
          {activeTab === "AI Review" && <AIReviewTab />}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-2 p-1.5 bg-white border  border-white rounded shadow hover:shadow-md hover:border-blue-400 transition"
        >
          <SidebarOpen className="text-blue-500" size={20} />
        </button>
      )}
    </div>
  );
};

export default ResumeSide;
