"use client";
import React, { useState, useEffect, useCallback,useRef } from "react";
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
import { sectionIcons } from "../../_utils/sectionsConfig";
import { Plus, Sparkles, X, FileText } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { updateResume, getAllResumes, autoSaveResume } from "@/api/resumeApi";
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
  onCustomSectionClick?: (sectionName: string) => boolean;
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
  onCustomSectionClick,
}) => {
  const nonDeletableSections = [
    "Personal Info",
    "Professional Summary",
    "Skills",
    "Education",
  ];


  const {
    resumeData,
    setSectionOrder,
    selectedTemplate,
    setSelectedTemplate,
    getCompletionPercentage,
    setCompletionStatus
  } = useResume();
  
  const [openModalSection, setOpenModalSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  


  useEffect(() => {
    const validateResumeId = async () => {
      const storedId = localStorage.getItem("current_resume_id");

      logger.info("Validating resume ID on page load:", storedId);

      if (!storedId || storedId === 'null' || storedId === 'undefined') {
        logger.error("No valid resume ID found");
        toast.error("Resume ID missing. Redirecting to dashboard...", {
          duration: 3000
        });

        return;
      }

      try {
        const resumes = await getAllResumes();
        const exists = resumes.some(r => r.id === storedId);

        if (!exists) {
          logger.error("Stored ID doesn't exist in backend");
          logger.error("Stored ID:", storedId);
          logger.error("Available IDs:", resumes.map(r => r.id));

          toast.warning("Resume ID mismatch. Using latest resume...");

          if (resumes.length > 0) {
            const newId = resumes[0].id;
            localStorage.setItem("current_resume_id", newId);
            logger.info("Updated to new ID:", newId);
            toast.success(`Switched to resume: ${newId.substring(0, 8)}...`);
          } else {
            toast.error("No resumes found. Redirecting...");
          }
        } else {
          logger.info("Resume ID validated successfully");
        }
      } catch (err) {
        logger.error("Failed to validate resume ID:", err);
      }
    };
    
    validateResumeId();
  }, []);


  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result);
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSectionOrder(reordered.map((s) => s.name));
  };


  const visibleSections =
    activeSection !== null
      ? sections.filter((_, idx) => idx === activeSection)
      : sections;


  const closeModal = () => {
    setOpenModalSection(null);
  };


  const handleToggleSection = (sectionName: string) => {
    // ✅ Check if this is a custom section
    if (onCustomSectionClick && onCustomSectionClick(sectionName)) {
      // Custom section was handled by the callback
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
          (lowerKey.includes("workexperience") ||
            lowerKey.includes("company") ||
            (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
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


  const triggerAutoSave = useCallback(async (sectionName: string, currentFormData: Record<string, string>) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }


    autoSaveTimerRef.current = setTimeout(async () => {
      const resumeId = localStorage.getItem("current_resume_id");
      
      if (!resumeId || !sectionName || resumeId === 'null' || resumeId === 'undefined') {
        logger.info("Skipping auto-save: No valid resume ID");
        return;
      }
      
      try {
        setIsAutoSaving(true);
        logger.info("Auto-saving:", sectionName);

        const sectionData = transformFormDataToBackend(sectionName);
        
        const sectionKeyMap: Record<string, string> = {
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
        };
        
        const backendKey = sectionKeyMap[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");

        const updatePayload: Record<string, any> = {
          [backendKey]: sectionData,
        };

        // ✅ For Skills section, also include categorizedSkills from resumeData
        if (sectionName === "Skills" && resumeData.categorizedSkills) {
          updatePayload.categorizedSkills = resumeData.categorizedSkills;
        }

        logger.info("Auto-save payload:", updatePayload);

        await autoSaveResume(resumeId, updatePayload);

        setLastSaved(new Date());
        logger.info("Auto-saved successfully");

      } catch (error) {
        logger.error("Auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000);
  }, [resumeData]);


  useEffect(() => {
    if (openModalSection && formData) {
      triggerAutoSave(openModalSection, formData);
    }
  }, [formData, openModalSection, triggerAutoSave]);


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
      "linkedin url",
      "portfolio url",
      "currentlyworking",
      "link",
      "technologies",
      "description",
      "achievement",
      "category",
      "proficiencylevel",
      "startdate",
      "enddate",
      "date",
      "year",
    ];
    return !optionalFields.some((optional) => lowerKey.includes(optional));
  };


  // ✅ FIXED: Validate and return new errors, don't rely on stale state
  const validateSectionFields = (): { isValid: boolean; newErrors: Record<string, string> } => {
    if (!openModalSection) return { isValid: true, newErrors: {} };
    
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
    const sectionFields = getSectionFields(sectionName);

    logger.info("Transforming section:", sectionName);
    logger.info("Section fields:", sectionFields);
    
    if (sectionName === "Professional Summary") {
      const summaryValue = formData["professionalSummary"] || formData["summary"] || "";
      // Backend expects just the summary string, not an object
      // Note: targetRole is stored in frontend context but not sent to backend yet
      return summaryValue;
    }
    
    if (sectionName === "Skills") {
      const skillsValue = formData["skills"];
      let skillsArray: string[] = [];

      if (typeof skillsValue === 'string') {
        skillsArray = skillsValue.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(skillsValue)) {
        skillsArray = skillsValue;
      }

      return skillsArray;
    }
    
    if (sectionName === "Personal Info") {
      return {
        fullname: formData["fullname"] || "",
        email: formData["email"] || "",
        phone: formData["phone"] || "",
        location: formData["location"] || "",
        linkedinUrl: formData["linkedinUrl"] || "",
        portfolioUrl: formData["portfolioUrl"] || "",
      };
    }
    
    if (sectionName === "Education") {
      const educationArray: any[] = [];
      let index = 0;
      
      while (formData[`education_${index}_school`]) {
        educationArray.push({
          school: formData[`education_${index}_school`] || "",
          degree: formData[`education_${index}_degree`] || "",
          startDate: formData[`education_${index}_startDate`] || "",
          endDate: formData[`education_${index}_endDate`] || "",
        });
        index++;
      }

      logger.info("Education array:", educationArray);
      return educationArray.length > 0 ? educationArray : [];
    }
    
    if (sectionName === "Work Experience") {
      const workArray: any[] = [];
      let index = 0;
      
      while (formData[`workExperience_${index}_company`]) {
        workArray.push({
          company: formData[`workExperience_${index}_company`] || "",
          role: formData[`workExperience_${index}_role`] || "",
          location: formData[`workExperience_${index}_location`] || "",
          startDate: formData[`workExperience_${index}_startDate`] || "",
          endDate: formData[`workExperience_${index}_endDate`] || "",
          currentlyWorking: formData[`workExperience_${index}_currentlyWorking`] === "true",
          description: formData[`workExperience_${index}_description`] || "",
        });
        index++;
      }

      logger.info("Work Experience array:", workArray);
      return workArray.length > 0 ? workArray : [];
    }
    
    if (sectionName === "Projects") {
      const projectsArray: any[] = [];
      let index = 0;
      
      while (formData[`project_${index}_title`]) {
        const technologies = formData[`project_${index}_technologies`];
        projectsArray.push({
          title: formData[`project_${index}_title`] || "",
          description: formData[`project_${index}_description`] || "",
          technologies: typeof technologies === 'string' 
            ? technologies.split(',').map(t => t.trim()).filter(t => t)
            : (Array.isArray(technologies) ? technologies : []),
          startDate: formData[`project_${index}_startDate`] || "",
          endDate: formData[`project_${index}_endDate`] || "",
          link: formData[`project_${index}_link`] || "",
        });
        index++;
      }

      logger.info("Projects array:", projectsArray);
      return projectsArray.length > 0 ? projectsArray : [];
    }
    
    if (sectionName === "Certifications") {
      const certsArray: any[] = [];
      let index = 0;
      
      while (formData[`certification_${index}_name`]) {
        certsArray.push({
          name: formData[`certification_${index}_name`] || "",
          issuedBy: formData[`certification_${index}_issuedBy`] || "",
          year: formData[`certification_${index}_year`] || "",
        });
        index++;
      }
      
      return certsArray.length > 0 ? certsArray : [];
    }
    
    if (sectionName === "Achievements") {
      const achievementsArray: any[] = [];
      let index = 0;
      
      while (formData[`achievement_${index}_title`]) {
        achievementsArray.push({
          title: formData[`achievement_${index}_title`] || "",
          date: formData[`achievement_${index}_date`] || "",
          description: formData[`achievement_${index}_description`] || "",
        });
        index++;
      }
      
      return achievementsArray.length > 0 ? achievementsArray : [];
    }
    
    if (sectionName === "Internships") {
      const internshipsArray: any[] = [];
      let index = 0;
      
      while (formData[`internship_${index}_company`]) {
        internshipsArray.push({
          company: formData[`internship_${index}_company`] || "",
          role: formData[`internship_${index}_role`] || "",
          location: formData[`internship_${index}_location`] || "",
          startDate: formData[`internship_${index}_startDate`] || "",
          endDate: formData[`internship_${index}_endDate`] || "",
          currentlyWorking: formData[`internship_${index}_currentlyWorking`] === "true",
          description: formData[`internship_${index}_description`] || "",
        });
        index++;
      }
      
      return internshipsArray.length > 0 ? internshipsArray : [];
    }
    
    if (sectionName === "Volunteering") {
      const volunteeringArray: any[] = [];
      let index = 0;
      
      while (formData[`volunteering_${index}_organization`]) {
        volunteeringArray.push({
          organization: formData[`volunteering_${index}_organization`] || "",
          role: formData[`volunteering_${index}_role`] || "",
          startDate: formData[`volunteering_${index}_startDate`] || "",
          endDate: formData[`volunteering_${index}_endDate`] || "",
        });
        index++;
      }
      
      return volunteeringArray.length > 0 ? volunteeringArray : [];
    }

        if (sectionName === "Awards") {
      const awardsArray: any[] = [];
      let index = 0;
      
      while (formData[`award_${index}_title`]) {
        awardsArray.push({
          title: formData[`award_${index}_title`] || "",
          issuedBy: formData[`award_${index}_issuedBy`] || "",
          year: formData[`award_${index}_year`] || "",
        });
        index++;
      }
      
      return awardsArray.length > 0 ? awardsArray : [];
    }
    
    if (sectionName === "Hobbies") {
      const hobbiesArray: any[] = [];
      let index = 0;
      
      while (formData[`hobbie_${index}_name`]) {
        hobbiesArray.push({
          name: formData[`hobbie_${index}_name`] || "",
          description: formData[`hobbie_${index}_description`] || "",
          proficiencyLevel: formData[`hobbie_${index}_proficiencyLevel`] || "",
          achievement: formData[`hobbie_${index}_achievement`] || "",
        });
        index++;
      }
      
      return hobbiesArray.length > 0 ? hobbiesArray : [];
    }
    
    if (sectionName === "Interests") {
      const interestsArray: any[] = [];
      let index = 0;
      
      while (formData[`interest_${index}_name`]) {
        interestsArray.push({
          name: formData[`interest_${index}_name`] || "",
          description: formData[`interest_${index}_description`] || "",
          category: formData[`interest_${index}_category`] || "",
        });
        index++;
      }
      
      return interestsArray.length > 0 ? interestsArray : [];
    }
    
    if (sectionName === "Languages") {
      const languagesArray: any[] = [];
      let index = 0;
      
      while (formData[`language_${index}_language`]) {
        languagesArray.push({
          language: formData[`language_${index}_language`] || "",
          proficiency: formData[`language_${index}_proficiency`] || "",
        });
        index++;
      }
      
      return languagesArray.length > 0 ? languagesArray : [];
    }
    
    // ✅ FIXED: Publications returns [] instead of {}
    if (sectionName === "Publications") {
      const publicationsArray: any[] = [];
      let index = 0;
      
      while (formData[`publication_${index}_title`]) {
        publicationsArray.push({
          title: formData[`publication_${index}_title`] || "",
          authors: formData[`publication_${index}_authors`] || "",
          publicationName: formData[`publication_${index}_publicationName`] || "",
          date: formData[`publication_${index}_date`] || "",
          url: formData[`publication_${index}_url`] || "",
        });
        index++;
      }

      logger.info("Publications array:", publicationsArray);
      return publicationsArray.length > 0 ? publicationsArray : [];
    }
    
    if (sectionName === "References") {
      const referencesArray: any[] = [];
      let index = 0;
      
      while (formData[`reference_${index}_name`]) {
        referencesArray.push({
          name: formData[`reference_${index}_name`] || "",
          relation: formData[`reference_${index}_relation`] || "",
          contact: formData[`reference_${index}_contact`] || "",
        });
        index++;
      }
      
      return referencesArray.length > 0 ? referencesArray : [];
    }

    logger.warn("Unknown section:", sectionName);
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
      logger.warn("No valid resume ID found, refetching...");
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

    // ✅ Step 4: Transform section data for backend
    const sectionData = transformFormDataToBackend(openModalSection);

    const sectionKeyMap: Record<string, string> = {
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
    };

    const backendKey =
      sectionKeyMap[openModalSection] ||
      openModalSection.toLowerCase().replace(/\s+/g, "_");

    const updatePayload: Record<string, any> = {
      [backendKey]: sectionData,
    };

    // ✅ For Skills section, also include categorizedSkills from resumeData
    if (openModalSection === "Skills" && resumeData.categorizedSkills) {
      updatePayload.categorizedSkills = resumeData.categorizedSkills;
    }

    logger.info("Sending payload:", updatePayload);

    // ✅ Step 5: Call update API safely
    await updateResume(resumeId, updatePayload);

    // ✅ Step 6: Mark section complete + clear all validation
    setCompletionStatus((prev) => ({
      ...prev,
      [openModalSection]: true,
    }));

    clearErrors(sectionFields); // remove local validation
    toast.success(`${openModalSection} saved successfully!`);
    closeModal();
  } catch (error) {
    logger.error("Save failed:", error);
    if (error instanceof Error) {
      toast.error(error.message || "Failed to save section.");
    } else {
      toast.error("Unexpected error occurred while saving.");
    }
  } finally {
    setIsSaving(false);
  }
};



  const completionPercentage = getCompletionPercentage();

  // ✅ Calculate actual section counts for CircularProgress display
  const totalSections = Object.keys(completionStatus).length;
  const completedSectionsCount = Object.values(completionStatus).filter(Boolean).length;

  return (
    <>
      {isAutoSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Saving...</span>
        </div>
      )}
      
      {lastSaved && !isAutoSaving && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
        </div>
      )}
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
          <CircularProgress
            percentage={completionPercentage}
            size={54}
            strokeWidth={4}
            totalSections={totalSections}
          />
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
                const Icon = sectionIcons[s.name] || FileText; // Use FileText as default icon for custom sections
                const id = `${s.name}-${originalIndex}`;

                // ✅ Get resumeId and sectionKey for delete functionality
                const resumeId = localStorage.getItem("current_resume_id") || undefined;
                const sectionKeyMap: Record<string, string> = {
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
                };
                const sectionKey = sectionKeyMap[s.name] || s.name.toLowerCase().replace(/\s+/g, "_");

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
                          disableDelete={nonDeletableSections.includes(s.name)}
                          isComplete={completionStatus[s.name] || false}
                          resumeId={resumeId}
                          sectionKey={sectionKey}
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


            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default EditorTab;

