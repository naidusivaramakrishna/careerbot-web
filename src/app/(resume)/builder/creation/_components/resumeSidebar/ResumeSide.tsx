"use client";
import React, { useState, useEffect } from "react";
import { SidebarOpen } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import { useResume } from "../../_context/ResumeContext";
import Tabs from "./Tabs";
import EditorTab from "../editor/EditorTab";
import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
import AIReviewTab from "../aiReview/AIReviewTab";

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
import Interests from "../editor/sections/Interests";
import Hobbies from "../editor/sections/Hobbies";
import Languages from "../editor/sections/Languages";

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
  Interests,
  Hobbies,
  Languages,
};

interface ResumeSideProps {
  isTemplateSidebarOpen?: boolean;
  onToggleTemplateSidebar?: (isOpen: boolean) => void;
  resumeId?: string;
  initialTab?: string;
}

// All standard (non-custom) section names — used to avoid re-adding custom sections to extraSections on delete
const standardSectionNames = new Set([
  "Personal Info", "Professional Summary", "Education", "Skills",
  "Work Experience", "Projects", "Certifications", "Internships",
  "Achievements", "Publications", "Volunteering", "Awards",
  "Hobbies", "Interests", "Languages", "References",
]);

const ResumeSide: React.FC<ResumeSideProps> = ({
  isTemplateSidebarOpen = true,
  onToggleTemplateSidebar,
  initialTab,
}) => {
  // ✅ Get context first
  const {
    resumeData,
    isLoadingResume,
    completionStatus,
    setCompletionStatus,
    sectionOrder,
  } = useResume();

  const [sections, setSections] = useState(() => {
    // Initialize sections in sectionOrder if available
    if (!sectionOrder || sectionOrder.length === 0) {
      return initialSections;
    }

    const sectionMap = new Map(initialSections.map(s => [s.name, s]));
    const reordered = sectionOrder
      .filter(name => sectionMap.has(name))
      .map(name => sectionMap.get(name)!)
      .filter(s => s !== undefined);

    const orderedNames = new Set(reordered.map(s => s.name));
    const remaining = initialSections.filter(s => !orderedNames.has(s.name));

    return [...reordered, ...remaining];
  });
  
  const defaultExtraSections: { name: string; ai: boolean }[] = [
    { name: "Achievements", ai: true },
    { name: "Publications", ai: false },
    { name: "Volunteering", ai: false },
    { name: "Awards", ai: false },
    { name: "Hobbies", ai: true },
    { name: "Interests", ai: true },
    { name: "Languages", ai: false },
    { name: "References", ai: false },
  ];

  const [extraSections, setExtraSections] = useState(() => {
    // Initialize extra sections in sectionOrder if available
    if (!sectionOrder || sectionOrder.length === 0) {
      return defaultExtraSections;
    }

    const sectionMap = new Map(defaultExtraSections.map(s => [s.name, s]));
    const reordered = sectionOrder
      .filter(name => sectionMap.has(name))
      .map(name => sectionMap.get(name)!)
      .filter(s => s !== undefined);

    const orderedNames = new Set(reordered.map(s => s.name));
    const remaining = defaultExtraSections.filter(s => !orderedNames.has(s.name));

    return [...reordered, ...remaining];
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab ?? "Editor");
  
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
      
      // Professional Summary
      newFormData["professionalSummary"] = resumeData.professionalSummary.summary || "";
      newFormData["targetRole"] = resumeData.professionalSummary.targetRole || "";
      
      // Skills
      if (Array.isArray(resumeData.skills)) {
        newFormData["skills"] = resumeData.skills.join(", ");
      }
      
      // Education
      resumeData.education?.forEach((edu, index) => {
        newFormData[`education_${index}_school`] = edu.school || "";
        newFormData[`education_${index}_degree`] = edu.degree || "";
        newFormData[`education_${index}_startDate`] = edu.startDate || "";
        newFormData[`education_${index}_endDate`] = edu.endDate || "";
      });
      
      // Work Experience
      resumeData.workExperience?.forEach((work, index) => {
        newFormData[`workExperience_${index}_company`] = work.company || "";
        newFormData[`workExperience_${index}_role`] = work.role || "";
        newFormData[`workExperience_${index}_location`] = work.location || "";
        newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
        newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
        newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
        newFormData[`workExperience_${index}_description`] = work.description || "";
      });
      
      // Projects
      resumeData.projects?.forEach((project, index) => {
        newFormData[`project_${index}_title`] = project.title || "";
        newFormData[`project_${index}_description`] = project.description || "";
        newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) 
          ? project.technologies.join(", ") 
          : "";
        newFormData[`project_${index}_startDate`] = project.startDate || "";
        newFormData[`project_${index}_endDate`] = project.endDate || "";
        newFormData[`project_${index}_link`] = project.link || "";
      });
      
      // Certifications
      resumeData.certifications?.forEach((cert, index) => {
        newFormData[`certification_${index}_name`] = cert.name || "";
        newFormData[`certification_${index}_issuedBy`] = cert.issuer || "";
        newFormData[`certification_${index}_year`] = cert.issueDate || "";
      });
      
      // Achievements
      resumeData.achievements?.forEach((ach, index) => {
        newFormData[`achievement_${index}_title`] = ach.title || "";
        newFormData[`achievement_${index}_date`] = ach.date || "";
        newFormData[`achievement_${index}_description`] = ach.description || "";
      });
      
      // Internships
      resumeData.internships?.forEach((intern, index) => {
        newFormData[`internship_${index}_company`] = intern.company || "";
        newFormData[`internship_${index}_role`] = intern.role || "";
        newFormData[`internship_${index}_location`] = intern.location || "";
        newFormData[`internship_${index}_startDate`] = intern.startDate || "";
        newFormData[`internship_${index}_endDate`] = intern.endDate || "";
        newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
        newFormData[`internship_${index}_description`] = intern.description || "";
      });
      
      // Volunteering
      resumeData.volunteering?.forEach((vol, index) => {
        newFormData[`volunteering_${index}_organization`] = vol.organization || "";
        newFormData[`volunteering_${index}_role`] = vol.role || "";
        newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
        newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
      });
      
      // Awards
      resumeData.awards?.forEach((award, index) => {
        newFormData[`award_${index}_title`] = award.title || "";
        newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
        newFormData[`award_${index}_year`] = award.year || "";
      });
      
      // Hobbies
      resumeData.hobbies?.forEach((hobby, index) => {
        newFormData[`hobbie_${index}_name`] = hobby.name || "";
        newFormData[`hobbie_${index}_description`] = hobby.description || "";
        newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
        newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
      });
      
      // Interests
      resumeData.interests?.forEach((interest, index) => {
        newFormData[`interest_${index}_name`] = interest.name || "";
        newFormData[`interest_${index}_description`] = interest.description || "";
        newFormData[`interest_${index}_category`] = interest.category || "";
      });
      
      // Languages
      resumeData.languages?.forEach((lang, index) => {
        newFormData[`language_${index}_language`] = lang.language || "";
        newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
      });
      
      // Publications
      resumeData.publications?.forEach((pub, index) => {
        newFormData[`publication_${index}_title`] = pub.title || "";
        newFormData[`publication_${index}_authors`] = pub.authors || "";
        newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
        newFormData[`publication_${index}_date`] = pub.date || "";
        newFormData[`publication_${index}_url`] = pub.url || "";
      });
      
      // References
      resumeData.references?.forEach((ref, index) => {
        newFormData[`reference_${index}_name`] = ref.name || "";
        newFormData[`reference_${index}_relation`] = ref.relation || "";
        newFormData[`reference_${index}_contact`] = ref.contact || "";
      });
      
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...sections];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSections(items);
  };

  const handleDeleteSection = (index: number) => {
    const removed = sections[index];
    setSections((prev) => prev.filter((_, i) => i !== index));
    // Only return standard sections to the "Add section" list — custom sections are deleted permanently
    if (standardSectionNames.has(removed.name)) {
      setExtraSections((prev) => [...prev, removed]);
    }
    if (activeSection === index) setActiveSection(null);
  };

  const handleAddSection = (section: { name: string; ai: boolean }) => {
    setSections((prev) => [...prev, section]);
    setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
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
  // Check if this is a required field
  const lowerKey = key.toLowerCase();
  const optionalFields = [
    "linkedin",
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
  
  // Only set error if field is required AND empty
  if (isRequired && (!value || value.trim() === "")) {
    setErrors(prev => ({
      ...prev,
      [key]: "This field is required"
    }));
  } else {
    // Clear error if field has value
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }
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
        (lang) => isFilled(lang.language)),
      Publications: resumeData.publications.some(
        (pub) => isFilled(pub.title)),
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
          {activeTab === "Editor" && (
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
            />
          )}
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
