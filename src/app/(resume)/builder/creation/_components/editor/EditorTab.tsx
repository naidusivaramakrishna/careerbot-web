"use client";
import React, { useState, useEffect, useCallback,useRef } from "react";

// Module-level constant — single source of truth for all section → backend key mapping.
// Previously duplicated three times inside the component (component body, triggerAutoSave, handleSaveForm).
const SECTION_KEY_MAP: Record<string, string> = {
  "Personal Info": "personal_info",
  "Professional Summary": "professional_summary",
  "Skills": "skills",
  "Education": "education",
  "Work Experience": "work_experience",
  "Projects": "projects",
  "Certifications": "certifications",
  "Achievements": "achievements",
  "Volunteering": "volunteering",
  "Internships": "internships",
  "Awards": "awards",
  "Hobbies": "hobbies",
  "Interests": "interests",
  "Languages": "languages",
  "Publications": "publications",
  "References": "references",
} as const;
import { useSearchParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import SectionItem from "./SectionItem";
import AddNewSection from "./AddNewSection";
import CircularProgress from "./CircularProgress";
import CustomSectionEditor from "./CustomSectionEditor";
import { sectionIcons } from "../../_utils/sectionsConfig";
import { Plus, Sparkles, X, LayoutGrid } from "lucide-react";
import { useResume, CustomSection } from "../../_context/ResumeContext";
import { updateResume, getAllResumes, autoSaveResume } from "@/api/resumeApi";
import { autoSaveEnhancedResume, updateEnhancedResume } from "@/api/enhancerApi";
import { toast } from "sonner";
import logger from "@/lib/logger";


interface SectionComponentProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}


interface Props {
  sections: { name: string; ai: boolean }[];
  extraSections: { name: string; ai: boolean }[];
  activeSection: number | null;
  formData: Record<string, string>;
  errors: Record<string, string>;
  sectionComponents: Record<string, React.FC<SectionComponentProps>>;
  handleDeleteSection: (index: number) => void;
  handleAddSection: (section: { name: string; ai: boolean }) => void;
  handleChange: (key: string, value: string) => void;
  handleBlur: (key: string, value: string) => void;
  setActiveSection: (index: number | null) => void;
  handleDragEnd: (result: DropResult) => void;
  completionStatus: Record<string, boolean>;
  onSidebarToggle?: (isOpen: boolean) => void;
  clearErrors: (fields?: string[]) => void;
}


const EditorTab: React.FC<Props> = ({
  sections,
  extraSections,
  activeSection,
  formData,
  errors,
  sectionComponents,
  handleDeleteSection,
  handleAddSection,
  handleChange,
  handleBlur,
  handleDragEnd,
  completionStatus = {},
  onSidebarToggle,
  clearErrors,
}) => {
  const nonDeletableSections = [
    "Personal Info",
    "Professional Summary",
    "Skills",
    "Education",
  ];

  const {
    setSectionOrder,
    selectedTemplate,
    setSelectedTemplate,
    getCompletionPercentage,
    setCompletionStatus,
    resumeData,
    setResumeData,
    addCustomSection,
    removeCustomSection,
  } = useResume();

  const [openModalSection, setOpenModalSection] = useState<string | null>(null);
  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [newCustomSectionName, setNewCustomSectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks custom section names whose backend UUID is still pending (blocks modal open)
  const pendingCustomSections = useRef<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";

  useEffect(() => {
    // Skip validation for enhanced resumes — their ID is an enhanced_resume_id,
    // not a builder resume ID, so getAllResumes() won't find it.
    if (isEnhancedResume) return;

    const validateResumeId = async () => {
      const storedId = localStorage.getItem("current_resume_id");

      if (!storedId || storedId === 'null' || storedId === 'undefined') {
        toast.error("Resume ID missing. Redirecting to dashboard...", {
          duration: 3000
        });
        return;
      }

      try {
        const resumes = await getAllResumes();
        const exists = resumes.some(r => r.id === storedId);

        if (!exists) {
          toast.warning("Resume ID mismatch. Using latest resume...");

          if (resumes.length > 0) {
            const newId = resumes[0].id;
            localStorage.setItem("current_resume_id", newId);
            toast.success(`Switched to resume: ${newId.substring(0, 8)}...`);
          } else {
            toast.error("No resumes found. Redirecting...");
          }
        }
      } catch {
        // Failed to validate resume ID
      }
    };

    validateResumeId();
  }, [isEnhancedResume]);


  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result);
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    const newOrder = reordered.map((s) => s.name);
    setSectionOrder(newOrder);

    // ✅ Persist manually reordered sections to localStorage
    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';
      localStorage.setItem(sectionOrderKey, JSON.stringify(newOrder));
      logger.info('Saved manually reordered sections to localStorage:', newOrder);
    } catch (err) {
      logger.warn('Error saving section order to localStorage:', err);
    }
  };


  const visibleSections =
    activeSection !== null
      ? sections.filter((_, idx) => idx === activeSection)
      : sections;


  const closeModal = () => {
    setOpenModalSection(null);
  };


  const handleToggleSection = (sectionName: string) => {
    // Block opening a custom section until its backend UUID has been assigned
    if (pendingCustomSections.current.has(sectionName)) {
      toast.info("Section is still saving — please wait a moment.");
      return;
    }
    if (!selectedTemplate) {
      setSelectedTemplate(1);
      if (onSidebarToggle) {
        onSidebarToggle(false);
      }
    }

    // ✅ Clear errors for the previous section when opening a new one
    if (openModalSection && openModalSection !== sectionName) {
      const previousSectionFields = getSectionFields(openModalSection);
      clearErrors(previousSectionFields);
    }

    setOpenModalSection(
      openModalSection === sectionName ? null : sectionName
    );
  };


  const getSectionFields = (sectionName: string): string[] => {
    const fields: string[] = [];


    Object.keys(formData).forEach((key) => {
      const lowerKey = key.toLowerCase();
      const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");


      if (
        lowerKey.includes(lowerSection) ||
        (sectionName === "Personal Info" &&
          (lowerKey.includes("fullname") ||
            lowerKey.includes("email") ||
            lowerKey.includes("phone") ||
            lowerKey.includes("location") ||
            lowerKey.includes("linkedinUrl")) ||
            lowerKey.includes("portifolioUrl")) ||
        (sectionName === "Professional Summary" &&
          lowerKey.includes("summary")) ||
        (sectionName === "Skills" && lowerKey.includes("skill")) ||
        (sectionName === "Education" && lowerKey.includes("education")) ||
        (sectionName === "Work Experience" &&
          lowerKey.includes("workexperience")) ||
        (sectionName === "Projects" && lowerKey.includes("project")) ||
        (sectionName === "Certifications" &&
          lowerKey.includes("certification")) ||
        (sectionName === "Achievements" &&
          lowerKey.includes("achievement")) ||
        (sectionName === "Volunteering" &&
          lowerKey.includes("volunteering")) ||
        (sectionName === "Internships" &&
          lowerKey.includes("internship")) ||
        (sectionName === "Awards" && lowerKey.includes("award")) ||
        (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
        (sectionName === "Interests" && lowerKey.includes("interest")) ||
        (sectionName === "Languages" && lowerKey.includes("language")) ||
        (sectionName === "Publications" && lowerKey.includes("publication")) ||
        (sectionName === "References" &&
          lowerKey.includes("reference"))
      ) {
        fields.push(key);
      }
    });


    return fields;
  };


  const triggerAutoSave = useCallback(async (sectionName: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }


    autoSaveTimerRef.current = setTimeout(async () => {
      const resumeId = localStorage.getItem("current_resume_id");
      
      if (!resumeId || !sectionName || resumeId === 'null' || resumeId === 'undefined') {
        // // console.log("⏸️ Skipping auto-save: No valid resume ID");
        return;
      }
      
      try {
        setIsAutoSaving(true);
        // // console.log("💾 Auto-saving:", sectionName);
        
        const sectionData = transformFormDataToBackend(sectionName);
        
        const backendKey = SECTION_KEY_MAP[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");

        if (isEnhancedResume) {
          const snakeToCamelSectionMap: Record<string, string> = {
            personal_info: "personalInfo", professional_summary: "professionalSummary",
            skills: "skills", education: "education", work_experience: "workExperience",
            projects: "projects", certifications: "certifications", achievements: "achievements",
            volunteering: "volunteering", internships: "internships", awards: "awards",
            hobbies: "hobbies", interests: "interests", languages: "languages",
            publications: "publications", references: "references",
          };
          const camelKey = snakeToCamelSectionMap[backendKey] || backendKey;
          await autoSaveEnhancedResume(resumeId, { [camelKey]: sectionData });
        } else {
          const updatePayload = { [backendKey]: sectionData };
          // // console.log("📤 Auto-save payload:", updatePayload);
          await autoSaveResume(resumeId, updatePayload);
        }
        
        setLastSaved(new Date());
        // // console.log("✅ Auto-saved successfully");
        
      } catch {
        // Auto-save failed silently
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnhancedResume]);


  useEffect(() => {
    // ✅ FIXED: Auto-save for BOTH simple fields (formData) AND multi-entry sections (resumeData)
    // Multi-entry sections (Work Experience, Education, etc.) don't update formData, they update resumeData
    if (openModalSection) {
      triggerAutoSave(openModalSection);
    }
  }, [formData, resumeData, openModalSection, triggerAutoSave]);


  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);


  const isRequiredField = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    const optionalFields = [
      // Personal Info
      "linkedin url",
      "portfolio url",

      // General
      "currentlyworking",
      "startdate",
      "enddate",
      "date",
      "year",
      "location",

      // Work/Internship/Projects
      "link",
      "technologies",
      "description",

      // Education
      "scoretype",
      "scorevalue",

      // Certifications
      "issuedby",
      "expirydate",
      "credentialid",

      // Hobbies/Interests/Achievements
      "achievement",
      "category",
      "proficiencylevel",

      // Languages (proficiency is REQUIRED, not optional)

      // Publications
      "authors",
      "url",

      // References
      "relation",
      "contact",

      // Volunteering
      "role",
    ];
    return !optionalFields.some((optional) => lowerKey.includes(optional));
  };


  // ✅ FIXED: Validate and return new errors, don't rely on stale state
  const validateSectionFields = (): { isValid: boolean; newErrors: Record<string, string> } => {
    if (!openModalSection) return { isValid: true, newErrors: {} };

    // Custom sections have no required fields — skip validation
    const isCustom = (resumeData.customSections || []).some(cs => cs.sectionName === openModalSection);
    if (isCustom) return { isValid: true, newErrors: {} };

    const sectionFields = getSectionFields(openModalSection);
    const newErrors: Record<string, string> = {};
    let hasEmptyRequiredFields = false;


    sectionFields.forEach((key) => {
      const value = formData[key] || "";
      if (isRequiredField(key)) {
        if (!value || value.trim() === "") {
          newErrors[key] = "This field is required";
          hasEmptyRequiredFields = true;
        }
      }
    });


    return { 
      isValid: !hasEmptyRequiredFields, 
      newErrors 
    };
  };


  const transformFormDataToBackend = (sectionName: string) => {
    // // console.log("🔄 Transforming section:", sectionName);

    // ✅ FIXED: Multi-entry sections read from resumeData context, not formData
    // These sections manage their own component state and only update context
    if (["Education", "Work Experience", "Projects", "Certifications", "Internships", "Achievements", "Awards", "Volunteering", "Publications", "References", "Hobbies", "Interests", "Languages"].includes(sectionName)) {
      const contextKey = sectionName
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[àá]/, "a");

      const sectionMap: Record<string, keyof typeof resumeData> = {
        "education": "education",
        "work_experience": "workExperience",
        "projects": "projects",
        "certifications": "certifications",
        "internships": "internships",
        "achievements": "achievements",
        "awards": "awards",
        "volunteering": "volunteering",
        "publications": "publications",
        "references": "references",
        "hobbies": "hobbies",
        "interests": "interests",
        "languages": "languages",
      };

      const key = sectionMap[contextKey] || (sectionName.toLowerCase().replace(/ /g, "_") as keyof typeof resumeData);
      const data = resumeData?.[key];
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    }

    if (sectionName === "Professional Summary") {
      return {
        summary: formData["professionalSummary"] || formData["summary"] || "",
        targetRole: formData["targetRole"] || "",
      };
    }
    
    if (sectionName === "Skills") {
      // Backend expects CategorizedSkills with {name} objects per category
      const cats = resumeData.categorizedSkills;
      if (cats) {
        const toNameObjs = (arr: string[]) => (arr || []).map(s => ({ name: s }));
        return {
          programming_languages: toNameObjs(cats.programming_languages),
          frameworks: toNameObjs(cats.frameworks),
          databases: toNameObjs(cats.databases),
          tools: toNameObjs(cats.tools),
          cloud_platforms: toNameObjs(cats.cloud_platforms),
          soft_skills: toNameObjs(cats.soft_skills),
        };
      }
      return {};
    }
    
    if (sectionName === "Personal Info") {
      const countryCode = formData["countryCode"] || "+91";
      const rawPhone = formData["phone"] || "";
      // Combine countryCode + phone for backend (expects phone starting with +)
      const phone = rawPhone ? (rawPhone.startsWith("+") ? rawPhone : `${countryCode}${rawPhone}`) : "";
      return {
        fullname: formData["fullname"] || "",
        email: formData["email"] || "",
        phone,
        location: formData["location"] || "",
        linkedinUrl: formData["linkedinUrl"] || "",
        githubUrl: formData["githubUrl"] || "",
        portfolioUrl: formData["portfolioUrl"] || "",
      };
    }
    
    return {};
  };
  const handleSaveForm = async () => {
  if (!openModalSection) return;

  try {
    setIsSaving(true);

    // ✅ Step 1: Always clear previous validation errors before revalidating
    const sectionFields = getSectionFields(openModalSection);
    clearErrors(sectionFields);

    // ✅ Step 2: Validate again using the current up-to-date formData
    const { isValid, newErrors } = validateSectionFields();

    if (!isValid) {
      // show errors and stop save
      Object.entries(newErrors).forEach(([key]) => {
        handleBlur(key, formData[key] || "");
      });
      toast.error("Please fill in all required fields");
      setIsSaving(false);
      return;
    }

    // ✅ Step 3: Fetch resumeId safely (with fallback)
    let resumeId = localStorage.getItem("current_resume_id");
    if (!resumeId || resumeId === "null" || resumeId === "undefined") {
      // // console.warn("⚠️ No valid resume ID found, refetching...");
      const resumes = await getAllResumes();
      if (resumes.length > 0) {
        resumeId = resumes[0].id;
        localStorage.setItem("current_resume_id", resumeId);
        toast.info(`Using existing resume ${resumeId.substring(0, 8)}...`);
      } else {
        toast.error("No resumes found. Please create one before saving.");
        setIsSaving(false);
        return;
      }
    }

    // ✅ Step 4: For custom sections, save customSections array directly
    const isCustomSection = (resumeData.customSections || []).some(
      cs => cs.sectionName === openModalSection
    );

    let updatePayload: Record<string, unknown>;

    if (isCustomSection) {
      updatePayload = { customSections: resumeData.customSections };
    } else {
      const sectionData = transformFormDataToBackend(openModalSection);

      const backendKey =
        SECTION_KEY_MAP[openModalSection] ||
        openModalSection.toLowerCase().replace(/\s+/g, "_");

      updatePayload = { [backendKey]: sectionData };
    }

    // // console.log("📤 Sending payload:", updatePayload);

    // ✅ Step 5: Call update API safely (route to enhanced endpoint if needed)
    let saveResponse;
    if (isEnhancedResume) {
      const snakeToCamelMap: Record<string, string> = {
        personal_info: "personalInfo", professional_summary: "professionalSummary",
        skills: "skills", education: "education", work_experience: "workExperience",
        projects: "projects", certifications: "certifications", achievements: "achievements",
        volunteering: "volunteering", internships: "internships", awards: "awards",
        hobbies: "hobbies", interests: "interests", languages: "languages",
        publications: "publications", references: "references",
      };
      const camelPayload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updatePayload)) {
        camelPayload[snakeToCamelMap[k] || k] = v;
      }
      saveResponse = await updateEnhancedResume(resumeId, { enhanced_sections: camelPayload });
    } else {
      saveResponse = await updateResume(resumeId, updatePayload);
    }

    // ✅ Step 5b: Sync backend UUIDs back into context for custom sections
    // Enhanced response nests customSections under enhanced_resume; builder puts it at top level
    const rawResponse = saveResponse as unknown as Record<string, unknown>;
    const rawEnhanced = rawResponse?.enhanced_resume as Record<string, unknown> | undefined;
    const syncedCustomSections = (rawResponse?.customSections ?? rawEnhanced?.customSections) as typeof resumeData.customSections | undefined;
    if (isCustomSection && syncedCustomSections && syncedCustomSections.length > 0) {
      setResumeData(prev => ({ ...prev, customSections: syncedCustomSections }));
    }

    // ✅ Step 6: Mark section complete + clear all validation
    // For custom sections: only mark green when all fields have values
    const isComplete = isCustomSection
      ? (() => {
          const cs = (resumeData.customSections || []).find(c => c.sectionName === openModalSection);
          return !!(cs && cs.fields.length > 0 && cs.fields.every(field => {
            if (field.fieldType === 'list') return (field.value as string[]).some(v => v.trim() !== '');
            return String(field.value).trim() !== '';
          }));
        })()
      : true;
    setCompletionStatus((prev) => ({
      ...prev,
      [openModalSection]: isComplete,
    }));

    clearErrors(sectionFields); // remove local validation
    toast.success(`${openModalSection} saved successfully!`);
    closeModal();
  } catch (error) {
    // // console.error("❌ Save failed:", error);
    if (error instanceof Error) {
      toast.error(error.message || "Failed to save section.");
    } else {
      toast.error("Unexpected error occurred while saving.");
    }
  } finally {
    setIsSaving(false);
  }
};



  const handleCreateCustomSection = (name: string) => {
    const newSection: CustomSection = {
      id: `custom_${Date.now()}`,
      sectionName: name,
      fields: [],
    };
    addCustomSection(newSection);
    handleAddSection({ name, ai: false });
    // Add to sectionOrder so templates render it
    setSectionOrder(prev => [...prev, name]);
    // Block the section modal until the backend UUID is assigned
    pendingCustomSections.current.add(name);
    // Persist to backend (fire-and-forget)
    const resumeId = localStorage.getItem("current_resume_id");
    if (resumeId && resumeId !== "null" && resumeId !== "undefined") {
      const updatedSections = [...(resumeData.customSections || []), newSection];
      updateResume(resumeId, { customSections: updatedSections } as Parameters<typeof updateResume>[1])
        .then(response => {
          // Sync real backend UUIDs into context so subsequent saves UPDATE instead of INSERT
          if (response.customSections && response.customSections.length > 0) {
            setResumeData(prev => ({ ...prev, customSections: response.customSections }));
          }
        })
        .catch(() => {
          toast.error("Custom section created locally but failed to save to server.");
        })
        .finally(() => {
          pendingCustomSections.current.delete(name);
        });
    } else {
      pendingCustomSections.current.delete(name);
    }
    toast.success(`"${name}" created and added to sections`);
    setNewCustomSectionName("");
    setIsAddingCustomSection(false);
  };

  const completionPercentage = getCompletionPercentage();
  const totalSections = Object.keys(completionStatus).length;


  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
            Resume Sections
          </h3>
          <p className="text-xs text-gray-800">
            Complete each section to build a perfect resume
          </p>
        </div>
        <div className="relative">
          <CircularProgress percentage={completionPercentage} totalSections={totalSections} size={54} strokeWidth={4} />
        </div>
      </div>


      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-2 p-1 rounded-xl"
            >
              {visibleSections.map((s, idx) => {
                const originalIndex =
                  activeSection !== null ? activeSection : idx;
                const Icon = sectionIcons[s.name] || LayoutGrid;
                const id = `${s.name}-${originalIndex}`;


                return (
                  <Draggable
                    key={id}
                    draggableId={id}
                    index={originalIndex}
                    isDragDisabled={activeSection !== null}
                  >
                    {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`transition-transform duration-200 ease-in-out ${
                          snap.isDragging ? "scale-[1.01]" : "scale-100"
                        }`}
                      >
                        <SectionItem
                          title={s.name}
                          icon={<Icon size={16} />}
                          ai={s.ai}
                          dragHandleProps={p.dragHandleProps}
                          isDragging={snap.isDragging}
                          isActive={openModalSection === s.name}
                          onToggle={() => handleToggleSection(s.name)}
                          onDelete={() => handleDeleteSection(originalIndex)}
                          onDeleteAsync={(() => {
                            const customSection = (resumeData.customSections || []).find(
                              cs => cs.sectionName === s.name
                            );
                            if (!customSection) return undefined;
                            return async () => {
                              const rid = localStorage.getItem("current_resume_id");
                              const filtered = (resumeData.customSections || []).filter(
                                cs => cs.id !== customSection.id
                              );
                              removeCustomSection(customSection.id);
                              setSectionOrder(prev => prev.filter(n => n !== s.name));
                              handleDeleteSection(originalIndex);
                              if (rid && rid !== "null" && rid !== "undefined") {
                                await updateResume(rid, { customSections: filtered } as Parameters<typeof updateResume>[1]);
                              }
                            };
                          })()}
                          disableDelete={nonDeletableSections.includes(s.name)}
                          isComplete={completionStatus[s.name] || false}
                          resumeId={localStorage.getItem("current_resume_id") || undefined}
                          sectionKey={SECTION_KEY_MAP[s.name] || s.name.toLowerCase().replace(/\s+/g, "_")}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>


      <AddNewSection />


      {extraSections.length > 0 && (
        <div className="mt-3 space-y-2 max-h-screen">
          {extraSections.map((s, i) => {
            const Icon = sectionIcons[s.name] || (() => <span>★</span>);
            return (
              <button
                key={i}
                onClick={() => handleAddSection(s)}
                className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
                    <Icon size={16} />
                  </div>
                  <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                    {s.name}
                  </p>
                </div>


                <div className="flex items-center gap-2">
                  {s.ai && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
                      <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
                    </span>
                  )}
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
                              bg-gradient-to-br from-white-50 to-white-500 text-gray-600
                              group-hover:from-blue-500 group-hover:to-blue-700 
                              group-hover:text-white group-hover:scale-110"
                  >
                    <Plus size={14} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}


      {/* ── Custom Sections Area ── */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LayoutGrid size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Custom Sections</span>
          </div>
          {!isAddingCustomSection && (
            <button
              onClick={() => setIsAddingCustomSection(true)}
              className="flex items-center gap-1 text-xs text-[#2557a7] hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>


        {/* Inline input to add a new custom section */}
        {isAddingCustomSection && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
              placeholder="Section name (e.g., Patents, Awards)"
              value={newCustomSectionName}
              onChange={(e) => setNewCustomSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCustomSectionName.trim()) {
                  handleCreateCustomSection(newCustomSectionName.trim());
                } else if (e.key === "Escape") {
                  setNewCustomSectionName("");
                  setIsAddingCustomSection(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (newCustomSectionName.trim()) {
                  handleCreateCustomSection(newCustomSectionName.trim());
                }
              }}
              className="px-3 py-2 bg-[#2557a7] text-white text-sm rounded-lg hover:bg-[#1f4e98] transition"
            >
              Add
            </button>
            <button
              onClick={() => {
                setNewCustomSectionName("");
                setIsAddingCustomSection(false);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {openModalSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
              disabled={isSaving}
            >
              <X size={20} />
            </button>


            <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
              {openModalSection}
            </h2>


            <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
              {(() => {
                // Render CustomSectionEditor if it's a custom section
                const customSection = (resumeData.customSections || []).find(
                  (cs) => cs.sectionName === openModalSection
                );
                if (customSection) {
                  return <CustomSectionEditor section={customSection} />;
                }
                const Component = sectionComponents[openModalSection];
                if (!Component) return null;
                return (
                  <Component
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                );
              })()}
            </div>


            <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between gap-3">
              {/* Auto-save status — inline, left-aligned */}
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                {isAutoSaving && (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-blue-500 truncate">Auto-saving…</span>
                  </>
                )}
                {!isAutoSaving && lastSaved && (
                  <span className="text-green-600 truncate">
                    ✓ Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveForm}
                  disabled={isSaving}
                  className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default EditorTab;

