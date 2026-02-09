"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Plus, SidebarOpen, Trash2, X } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import { useResume, CustomSection, CustomField } from "../../_context/ResumeContext";
import Tabs from "./Tabs";
import EditorTab from "../editor/EditorTab";
import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
import AIReviewTab from "../aiReview/AIReviewTab";
import { toast } from "sonner";
import { updateResume } from "@/api/resumeApi";
import logger from "@/lib/logger";

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

interface SectionItem {
  name: string;
  ai: boolean;
  customSectionId?: string; // Present if this is a custom section
}

interface CustomSectionModalProps {
  section: CustomSection;
  isOpen: boolean;
  onClose: () => void;
}

const CustomSectionModal: React.FC<CustomSectionModalProps> = ({ section, isOpen, onClose }) => {
  const {
    addCustomField,
    updateCustomFieldValue,
    deleteCustomField,
    removeCustomSection,
    resumeData,
    resumeId,
    setCompletionStatus // ✅ Add setCompletionStatus to mark section as complete
  } = useResume();
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");
  const [showTips, setShowTips] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error("Field name cannot be empty");
      return;
    }
    addCustomField(section.id, newFieldName, newFieldType);
    setNewFieldName("");
    setNewFieldType("text");
    toast.success("Field added successfully");
  };

  const handleDeleteSection = () => {
    if (confirm(`Are you sure you want to delete "${section.sectionName}"?`)) {
      removeCustomSection(section.id);
      onClose();
      toast.success("Section deleted");
    }
  };

  const handleSave = async () => {
    if (!resumeId) {
      toast.error("No resume ID found. Please save your resume first.");
      return;
    }

    setIsSaving(true);
    try {
      logger.info("💾 Saving custom sections...", resumeData.customSections);

      await updateResume(resumeId, {
        customSections: resumeData.customSections,
      });

      logger.info("✅ Custom sections saved successfully");

      // ✅ Mark section as complete if all fields have values
      const isComplete = section.fields.every((field) => {
        const value = field.value;
        if (Array.isArray(value)) {
          return value.length > 0 && value.some(v => v.trim() !== '');
        }
        return value && value.toString().trim() !== '';
      });

      if (isComplete) {
        setCompletionStatus((prev) => ({
          ...prev,
          [section.sectionName]: true,
        }));
        logger.info("✅ Section marked as complete:", section.sectionName);
      }

      toast.success(`${section.sectionName} saved successfully!`);
      onClose();
    } catch (error) {
      logger.error("❌ Failed to save custom sections:", error);
      toast.error("Failed to save custom section");
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      text: "Text",
      textarea: "Long Text",
      date: "Date",
      url: "URL",
      list: "List"
    };
    return types[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {section.sectionName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{section.sectionName}</h2>
              <p className="text-xs text-gray-500">{section.fields.length} field{section.fields.length !== 1 ? 's' : ''} configured</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-all hover:border-red-300"
              onClick={handleDeleteSection}
              aria-label="Delete section"
            >
              <div className="flex items-center gap-2">
                <Trash2 size={16} />
                <span>Delete Section</span>
              </div>
            </button>
            <button
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {section.fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No fields yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md">
                  Add fields to customize your section. Choose from text, long text, dates, URLs, or lists.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {section.fields.map((field, index) => (
                  <div key={field.id} className="group border-2 border-gray-100 hover:border-blue-200 rounded-xl p-4 transition-all bg-white hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                          {field.fieldName}
                        </label>
                        {/* <span className="inline-block text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium"> */}
                          {/* {getFieldTypeDisplay(field.fieldType)} */}
                        {/* </span> */}
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => {
                          if (confirm(`Delete field "${field.fieldName}"?`)) {
                            deleteCustomField(section.id, field.id);
                            toast.success("Field deleted");
                          }
                        }}
                        aria-label="Delete field"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Field Input */}
                    <div className="mt-3">
                      {field.fieldType === "textarea" ? (
                        <textarea
                          className="w-full px-3 py-3 text-sm rounded-lg text-black hover:bg-gray-50 bg-[#faf9f8] border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                          rows={4}
                          value={(field.value as string) || ""}
                          onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                          placeholder={`Enter ${field.fieldName}`}
                        />
                      ) : field.fieldType === "date" ? (
                        <input
                          type="date"
                          className="w-full px-3 py-3 text-sm rounded-lg text-black hover:bg-gray-50 bg-[#faf9f8] border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                          value={(field.value as string) || ""}
                          onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                        />
                      ) : field.fieldType === "url" ? (
                        <input
                          type="url"
                          className="w-full px-3 py-3 text-sm rounded-lg text-black hover:bg-gray-50 bg-[#faf9f8] border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                          value={(field.value as string) || ""}
                          onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                          placeholder="https://example.com"
                        />
                      ) : field.fieldType === "list" ? (
                        <div className="space-y-2">
                          {((field.value as string[]) || []).map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                className="flex-1 px-3 py-2.5 text-sm rounded-lg text-black hover:bg-gray-50 bg-[#faf9f8] border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                value={item || ""}
                                onChange={(e) => {
                                  const newList = [...((field.value as string[]) || [])];
                                  newList[idx] = e.target.value;
                                  updateCustomFieldValue(section.id, field.id, newList);
                                }}
                                placeholder={`Item ${idx + 1}`}
                              />
                              <button
                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={() => {
                                  const newList = ((field.value as string[]) || []).filter((_, i) => i !== idx);
                                  updateCustomFieldValue(section.id, field.id, newList);
                                }}
                                aria-label="Delete list item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                          <button
                            className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg transition-all font-medium"
                            onClick={() =>
                              updateCustomFieldValue(section.id, field.id, [...((field.value as string[]) || []), ""])
                            }
                          >
                            + Add item
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full px-3 py-3 text-sm rounded-lg text-black hover:bg-gray-50 bg-[#faf9f8] border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                          value={(field.value as string) || ""}
                          onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                          placeholder={`Enter ${field.fieldName}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Field Section */}
            <div className="mt-6 pt-6 border-t-2 border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                {/* <span className="text-lg">➕</span> */}
                <Plus size={16} className="text-blue-600" />
                Add New Field
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all placeholder-gray-400"
                  placeholder="Field name (e.g., License Number, Portfolio URL)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                />
                <select
                  className="px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all bg-white font-medium"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as CustomField["fieldType"])}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="date">Date</option>
                  <option value="url">URL</option>
                  <option value="list">List</option>
                </select>
                <button
                  onClick={handleAddField}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>

          {/* Tips Sidebar */}
          {showTips && (
            <div className="w-80 bg-gradient-to-br from-gray-50 to-gray-100 p-6  overflow-y-auto">
              <div className="sticky top-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-gray-900">Tips</h3>
                  <button
                    onClick={() => setShowTips(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Text Fields</h4>
                    <p className="text-xs text-gray-600">
                      Perfect for short info like titles, names, or single-line details.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Long Text</h4>
                    <p className="text-xs text-gray-600">
                      Use for descriptions, paragraphs, or detailed information.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Date Fields</h4>
                    <p className="text-xs text-gray-600">
                      Automatically formatted dates for consistency.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">URL Fields</h4>
                    <p className="text-xs text-gray-600">
                      Links will be clickable in your final resume.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">List Fields</h4>
                    <p className="text-xs text-gray-600">
                      Create bullet-point lists for multiple items.
                    </p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3 mt-4">
                    <p className="text-xs text-blue-800 font-medium">
                      Custom sections let you add unique information that sets your resume apart!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            {showTips ? "Hide" : "Show"} Tips
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
}

const ResumeSide: React.FC<ResumeSideProps> = ({
  isTemplateSidebarOpen = true,
  onToggleTemplateSidebar,
}) => {
  const [sections, setSections] = useState<SectionItem[]>(initialSections);

  // ✅ Get completionStatus and setCompletionStatus from context
  const {
    resumeData,
    isLoadingResume,
    completionStatus,
    setCompletionStatus,
    addCustomSection,
    removeCustomSection,
  } = useResume();
  
  const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
    { name: "Achievements", ai: true },
    { name: "Publications", ai: false },
    { name: "Volunteering", ai: false },
    { name: "Awards", ai: false },
    { name: "Hobbies", ai: true },
    { name: "Interests", ai: true },
    { name: "Languages", ai: false },
    { name: "References", ai: false },
  ]);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Editor");

  // Custom sections state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCustomSectionId, setActiveCustomSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");

  // ✅ Get the latest section data from ResumeContext based on activeCustomSectionId
  const activeCustomSection = useMemo(() => {
    if (!activeCustomSectionId) return null;
    return resumeData.customSections.find(
      (section) => section.id === activeCustomSectionId
    ) || null;
  }, [activeCustomSectionId, resumeData.customSections]);

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
      newFormData["phone"] = resumeData.personalInfo?.phone || "";
      newFormData["location"] = resumeData.personalInfo?.location || "";
      newFormData["linkedinUrl"] = resumeData.personalInfo?.linkedinUrl || "";
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
        newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
        newFormData[`certification_${index}_year`] = cert.year || "";
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

      // Custom sections
      resumeData.customSections?.forEach((section) => {
        section.fields.forEach((field) => {
          const key = `customSection_${section.id}_field_${field.id}`;
          if (Array.isArray(field.value)) {
            newFormData[key] = field.value.join(", ");
          } else {
            newFormData[key] = field.value || "";
          }
        });
      });

      setFormData(newFormData);
    }
  }, [isLoadingResume, resumeData]);

  // ✅ CRITICAL FIX: Sync Skills data from resumeData back to formData
  // This ensures that changes made by the Skills component (which updates resumeData directly)
  // are reflected in formData, allowing auto-save and manual save to work correctly
  useEffect(() => {
    if (!isLoadingResume && resumeData.skills) {
      const resumeDataSkills = Array.isArray(resumeData.skills)
        ? resumeData.skills.join(", ")
        : "";

      console.log("🔄 Syncing skills to formData:", {
        skills: resumeData.skills,
        categorizedSkills: resumeData.categorizedSkills,
        flattenedString: resumeDataSkills
      });

      // Use functional update to avoid needing formData in dependencies
      setFormData(prev => {
        const currentSkills = prev["skills"] || "";

        // Always update if this useEffect runs, because it means either skills or
        // categorizedSkills changed. We need to trigger formData change to activate auto-save.
        // Adding a timestamp ensures formData object reference changes even if string is same.
        if (currentSkills !== resumeDataSkills || resumeData.categorizedSkills) {
          console.log("✅ formData updated with skills");
          return {
            ...prev,
            skills: resumeDataSkills,
            _skillsTimestamp: Date.now().toString() // Force formData change for auto-save
          };
        }

        console.log("⏭️ Skills unchanged, skipping formData update");
        return prev; // No change needed
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: formData is intentionally excluded to prevent infinite loops
  }, [resumeData.skills, resumeData.categorizedSkills, isLoadingResume]);

  // ✅ Sync custom sections with main sections list
  useEffect(() => {
    if (!isLoadingResume) {
      // Preserve existing non-custom sections (to keep user's added sections)
      const nonCustomSections = sections.filter(s => !s.customSectionId);

      // Map custom sections to section format
      const customSectionsAsSections: SectionItem[] = (resumeData.customSections || []).map(cs => ({
        name: cs.sectionName,
        ai: false,
        customSectionId: cs.id // Mark as custom for deletion handling
      }));

      // Combine - custom sections go at the end
      const newSections = [...nonCustomSections, ...customSectionsAsSections];

      // Only update if changed (to avoid infinite loops)
      if (JSON.stringify(sections) !== JSON.stringify(newSections)) {
        setSections(newSections);
      }

      // ✅ Check completion status for custom sections
      (resumeData.customSections || []).forEach((cs) => {
        const isComplete = cs.fields.length > 0 && cs.fields.every((field) => {
          const value = field.value;
          if (Array.isArray(value)) {
            return value.length > 0 && value.some(v => v.trim() !== '');
          }
          return value && value.toString().trim() !== '';
        });

        // Update completion status if it changed
        if (completionStatus[cs.sectionName] !== isComplete) {
          setCompletionStatus((prev) => ({
            ...prev,
            [cs.sectionName]: isComplete,
          }));
        }
      });
    }
  }, [resumeData.customSections, isLoadingResume, sections, completionStatus, setCompletionStatus]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...sections];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSections(items);
  };

  const handleDeleteSection = async (index: number) => {
    const removed = sections[index];

    // Check if this is a custom section
    const customSectionId = (removed as any).customSectionId;
    if (customSectionId) {
      // It's a custom section - delete it completely
      if (confirm(`Are you sure you want to delete "${removed.name}"?`)) {
        try {
          // Remove from local state
          removeCustomSection(customSectionId);

          // ✅ Immediately sync with backend
          if (resumeId) {
            const updatedCustomSections = resumeData.customSections.filter(
              (s) => s.id !== customSectionId
            );
            await updateResume(resumeId, {
              customSections: updatedCustomSections,
            });
            logger.info("✅ Custom section deleted from backend");
          }

          toast.success("Custom section deleted");
        } catch (error) {
          logger.error("❌ Failed to delete custom section from backend:", error);
          toast.error("Failed to delete section from server");
        }
      }
    } else {
      // Regular section - move to extra sections
      setSections((prev) => prev.filter((_, i) => i !== index));
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

    // Custom sections completion
    (resumeData.customSections || []).forEach((cs) => {
      newStatus[cs.sectionName] = cs.fields.some((f) => {
        if (Array.isArray(f.value)) {
          return f.value.length > 0 && f.value.some(v => v.trim() !== "");
        }
        return f.value && f.value.toString().trim() !== "";
      });
    });

    // ✅ Update context completion status (used for progress circle)
    setCompletionStatus(newStatus);

  }, [resumeData, setCompletionStatus]);

  const openCustomSectionModal = (section: CustomSection) => {
    setActiveCustomSectionId(section.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveCustomSectionId(null);
  };

  const handleAddCustomSection = () => {
    if (!newSectionName.trim()) {
      toast.error("Section name cannot be empty.");
      return;
    }
    addCustomSection(newSectionName.trim());
    setNewSectionName("");
    toast.success("Custom section added!");
  };

  // ✅ Handler for custom section clicks from EditorTab
  const handleCustomSectionClick = (sectionName: string) => {
    // Find the custom section by name
    const customSection = resumeData.customSections.find(cs => cs.sectionName === sectionName);
    if (customSection) {
      openCustomSectionModal(customSection);
      return true; // Indicate that it was handled
    }
    return false; // Not a custom section
  };

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
        <div className="flex flex-col flex-1 px-3 py-4 overflow-y-scroll scrollbar-hide bg-white">
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
              onCustomSectionClick={handleCustomSectionClick}
            />
          )}
          {activeTab === "ResumeGPT" && <ResumeGPTTab />}
          {activeTab === "AI Review" && <AIReviewTab />}

          {/* Add Custom Section */}
          {activeTab === "Editor" && (
            <div className="mt-6 pt-4 border-t-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <span className="text-lg">✨</span>
                Add Custom Section
              </h3>

              <div className="mb-2">
                <input
                  type="text"
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
                  placeholder="e.g., Licenses, Patents, Media"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomSection()}
                />
              </div>
              <button
                onClick={handleAddCustomSection}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span>
                Add to Sections List
              </button>

              <div className="mt-3 p-2.5 bg-blue-50 border-l-4 border-blue-500 rounded text-xs text-blue-800">
                <strong className="font-semibold">💡 Tip:</strong> Custom sections will appear in the main sections list above!
              </div>
            </div>
          )}
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

      {/* Custom Section Modal */}
      {activeCustomSection && (
        <CustomSectionModal section={activeCustomSection} isOpen={modalOpen} onClose={closeModal} />
      )}
    </div>
  );
};

export default ResumeSide;
//  before custom sections add


// "use client";
// import React, { useState, useEffect } from "react";
// import { SidebarOpen, Trash2 } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume, CustomSection, CustomField } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";
// import { toast } from "sonner";
// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// const CustomSectionEditor = ({ section }: { section: CustomSection }) => {
//   const { addCustomField, updateCustomFieldValue, deleteCustomField, removeCustomSection } = useResume();
//   const [newFieldName, setNewFieldName] = useState("");
//   const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");
//   const [isEditingSectionName, setIsEditingSectionName] = useState(false);
//   const [sectionNameInput, setSectionNameInput] = useState(section.sectionName);

//   return (
//     <div className="p-3 border rounded-lg shadow-sm mb-4">
//       <div className="flex justify-between items-center mb-3">
//         {isEditingSectionName ? (
//           <input
//             type="text"
//             value={sectionNameInput}
//             onChange={(e) => setSectionNameInput(e.target.value)}
//             onBlur={() => setIsEditingSectionName(false)}
//             onKeyDown={(e) => e.key === "Enter" && setIsEditingSectionName(false)}
//             className="text-lg font-semibold border-b border-gray-400 focus:outline-none"
//             autoFocus
//           />
//         ) : (
//           <h3 className="text-lg font-semibold cursor-pointer" onClick={() => setIsEditingSectionName(true)}>
//             {section.sectionName}
//           </h3>
//         )}
//         <button onClick={() => removeCustomSection(section.id)} title="Delete Section" className="text-red-600 hover:text-red-800">
//           <Trash2 size={18} />
//         </button>
//       </div>

//       <div>
//         {section.fields.map((field) => (
//           <div key={field.id} className="mb-2">
//             <label className="block font-medium text-gray-700 mb-1">
//               {field.fieldName} ({field.fieldType})
//             </label>

//             {field.fieldType === "textarea" ? (
//               <textarea
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                 rows={3}
//               />
//             ) : field.fieldType === "date" ? (
//               <input
//                 type="date"
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//               />
//             ) : field.fieldType === "url" ? (
//               <input
//                 type="url"
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//               />
//             ) : field.fieldType === "list" ? (
//               <div className="space-y-2">
//                 {(field.value as string[]).map((item, idx) => (
//                   <div key={idx} className="flex gap-2">
//                     <input
//                       type="text"
//                       className="flex-1 border p-2 rounded"
//                       value={item}
//                       onChange={(e) => {
//                         const newList = [...(field.value as string[])];
//                         newList[idx] = e.target.value;
//                         updateCustomFieldValue(section.id, field.id, newList);
//                       }}
//                     />
//                     <button
//                       className="text-red-600 hover:text-red-800"
//                       onClick={() => {
//                         const newList = (field.value as string[]).filter((_, i) => i !== idx);
//                         updateCustomFieldValue(section.id, field.id, newList);
//                       }}
//                       title="Delete item"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 ))}
//                 <button
//                   className="text-blue-600 hover:underline"
//                   onClick={() =>
//                     updateCustomFieldValue(section.id, field.id, [...(field.value as string[]), ""])
//                   }
//                 >
//                   + Add item
//                 </button>
//               </div>
//             ) : (
//               <input
//                 type="text"
//                 className="w-full border p-2 rounded"
//                 value={field.value as string}
//                 onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//               />
//             )}

//             <button
//               onClick={() => deleteCustomField(section.id, field.id)}
//               className="mt-1 text-red-600 hover:text-red-800"
//               title="Delete field"
//             >
//               <Trash2 size={14} />
//             </button>
//           </div>
//         ))}
//       </div>

//       <AddNewFieldForm sectionId={section.id} addCustomField={addCustomField} />
//     </div>
//   );
// };

// const AddNewFieldForm = ({
//   sectionId,
//   addCustomField,
// }: {
//   sectionId: string;
//   addCustomField: (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => void;
// }) => {
//   const [newFieldName, setNewFieldName] = useState("");
//   const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");

//   const handleAdd = () => {
//     if (!newFieldName.trim()) {
//       toast.error("Field name cannot be empty");
//       return;
//     }
//     addCustomField(sectionId, newFieldName, newFieldType);
//     setNewFieldName("");
//     setNewFieldType("text");
//   };

//   return (
//     <div className="mt-4 border-t pt-3">
//       <input
//         type="text"
//         placeholder="New field name"
//         className="border p-2 rounded mr-2 w-2/3"
//         value={newFieldName}
//         onChange={(e) => setNewFieldName(e.target.value)}
//       />
//       <select
//         value={newFieldType}
//         onChange={(e) => setNewFieldType(e.target.value as CustomField["fieldType"])}
//         className="border p-2 rounded mr-2"
//       >
//         <option value="text">Text</option>
//         <option value="textarea">Long Text</option>
//         <option value="date">Date</option>
//         <option value="url">URL</option>
//         <option value="list">List</option>
//       </select>
//       <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//         Add Field
//       </button>
//     </div>
//   );
// };

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
  
//   const { 
//     resumeData, 
//     isLoadingResume,
//     completionStatus,
//     setCompletionStatus,
//     addCustomSection,
//     removeCustomSection
//   } = useResume();
  
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Publications", ai: false },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");
  
//   const clearErrors = (fields?: string[]) => {
//     if (!fields || fields.length === 0) {
//       setErrors({});
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         fields.forEach(field => {
//           delete newErrors[field];
//         });
//         return newErrors;
//       });
//     }
//   };

//   useEffect(() => {
//     if (!isLoadingResume && resumeData) {
//       const newFormData: Record<string, string> = {};
//       newFormData["name"] = resumeData.personalInfo?.fullName || "";
//       newFormData["email"] = resumeData.personalInfo?.email || "";
//       newFormData["phone"] = resumeData.personalInfo?.phone || "";
//       newFormData["location"] = resumeData.personalInfo?.location || "";
//       newFormData["linkedinurl"] = resumeData.personalInfo?.linkedinUrl || "";
//       newFormData["portifoliourl"] = resumeData.personalInfo?.portifolioUrl || "";
//       newFormData["professionalSummary"] = resumeData.professionalSummary || "";
//       if (Array.isArray(resumeData.skills)) {
//         newFormData["skills"] = resumeData.skills.join(", ");
//       }
//       resumeData.education?.forEach((edu, index) => {
//         newFormData[`education_${index}_school`] = edu.school || "";
//         newFormData[`education_${index}_degree`] = edu.degree || "";
//         newFormData[`education_${index}_startDate`] = edu.startDate || "";
//         newFormData[`education_${index}_endDate`] = edu.endDate || "";
//       });
//       resumeData.workExperience?.forEach((work, index) => {
//         newFormData[`workExperience_${index}_company`] = work.company || "";
//         newFormData[`workExperience_${index}_role`] = work.role || "";
//         newFormData[`workExperience_${index}_location`] = work.location || "";
//         newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
//         newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
//         newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
//         newFormData[`workExperience_${index}_description`] = work.description || "";
//       });
//       resumeData.projects?.forEach((project, index) => {
//         newFormData[`project_${index}_title`] = project.title || "";
//         newFormData[`project_${index}_description`] = project.description || "";
//         newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) ? project.technologies.join(", ") : "";
//         newFormData[`project_${index}_startDate`] = project.startDate || "";
//         newFormData[`project_${index}_endDate`] = project.endDate || "";
//         newFormData[`project_${index}_link`] = project.link || "";
//       });
//       resumeData.certifications?.forEach((cert, index) => {
//         newFormData[`certification_${index}_name`] = cert.name || "";
//         newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
//         newFormData[`certification_${index}_year`] = cert.year || "";
//       });
//       resumeData.achievements?.forEach((ach, index) => {
//         newFormData[`achievement_${index}_title`] = ach.title || "";
//         newFormData[`achievement_${index}_date`] = ach.date || "";
//         newFormData[`achievement_${index}_description`] = ach.description || "";
//       });
//       resumeData.internships?.forEach((intern, index) => {
//         newFormData[`internship_${index}_company`] = intern.company || "";
//         newFormData[`internship_${index}_role`] = intern.role || "";
//         newFormData[`internship_${index}_location`] = intern.location || "";
//         newFormData[`internship_${index}_startDate`] = intern.startDate || "";
//         newFormData[`internship_${index}_endDate`] = intern.endDate || "";
//         newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
//         newFormData[`internship_${index}_description`] = intern.description || "";
//       });
//       resumeData.volunteering?.forEach((vol, index) => {
//         newFormData[`volunteering_${index}_organization`] = vol.organization || "";
//         newFormData[`volunteering_${index}_role`] = vol.role || "";
//         newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
//         newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
//       });
//       resumeData.awards?.forEach((award, index) => {
//         newFormData[`award_${index}_title`] = award.title || "";
//         newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
//         newFormData[`award_${index}_year`] = award.year || "";
//       });
//       resumeData.hobbies?.forEach((hobby, index) => {
//         newFormData[`hobbie_${index}_name`] = hobby.name || "";
//         newFormData[`hobbie_${index}_description`] = hobby.description || "";
//         newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
//         newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
//       });
//       resumeData.interests?.forEach((interest, index) => {
//         newFormData[`interest_${index}_name`] = interest.name || "";
//         newFormData[`interest_${index}_description`] = interest.description || "";
//         newFormData[`interest_${index}_category`] = interest.category || "";
//       });
//       resumeData.languages?.forEach((lang, index) => {
//         newFormData[`language_${index}_language`] = lang.language || "";
//         newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
//       });
//       resumeData.publications?.forEach((pub, index) => {
//         newFormData[`publication_${index}_title`] = pub.title || "";
//         newFormData[`publication_${index}_authors`] = pub.authors || "";
//         newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
//         newFormData[`publication_${index}_date`] = pub.date || "";
//         newFormData[`publication_${index}_url`] = pub.url || "";
//       });
//       resumeData.references?.forEach((ref, index) => {
//         newFormData[`reference_${index}_name`] = ref.name || "";
//         newFormData[`reference_${index}_relation`] = ref.relation || "";
//         newFormData[`reference_${index}_contact`] = ref.contact || "";
//       });

//       // Populate customSections fields to formData using keys: customSection_{sectionId}_field_{fieldId}
//       resumeData.customSections?.forEach((section) => {
//         section.fields.forEach((field) => {
//           const key = `customSection_${section.id}_field_${field.id}`;
//           if (Array.isArray(field.value)) {
//             newFormData[key] = field.value.join(", ");
//           } else {
//             newFormData[key] = field.value || "";
//           }
//         });
//       });

//       setFormData(newFormData);
//     }
//   }, [isLoadingResume, resumeData]);

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [key]: value
//     }));

//     if (errors[key]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleBlur = (key: string, value: string) => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];

//     const isRequired = !optionalFields.some((optional) => lowerKey.includes(optional));

//     if (isRequired && (!value || value.trim() === "")) {
//       setErrors(prev => ({
//         ...prev,
//         [key]: "This field is required"
//       }));
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;

//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.fullName &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone &&
//         !!resumeData.personalInfo.location,
//       "Professional Summary": !!resumeData.professionalSummary.summary?.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//       Hobbies: resumeData.hobbies.some(
//         (hobby) => isFilled(hobby.name)),
//       Interests: resumeData.interests.some(
//         (interest) => isFilled(interest.name)),
//       Languages: resumeData.languages.some(
//         (lang) => isFilled(lang.language)),
//       Publications: resumeData.publications.some(
//         (pub) => isFilled(pub.title)),
//     };

//     // Also mark custom sections completion:
//     (resumeData.customSections || []).forEach((cs) => {
//       newStatus[cs.id] = cs.fields.some((f) => {
//         if (Array.isArray(f.value)) {
//           return f.value.length > 0 && f.value.some(v => v.trim() !== "");
//         }
//         return f.value && f.value.trim() !== "";
//       });
//     });

//     setCompletionStatus(newStatus);

//   }, [resumeData, setCompletionStatus]);

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">

//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//               clearErrors={clearErrors}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}

//           {/* Custom Sections Editors displayed in sidebar */}
//           {resumeData.customSections?.map((section) => (
//             <CustomSectionEditor key={section.id} section={section} />
//           ))}

//           {/* Add Custom Section Input & Button */}
//           <div className="my-4">
//             <input
//               className="w-full px-3 py-2 border rounded mb-2"
//               placeholder="New custom section name"
//               value={formData["customSectionNewName"] || ""}
//               onChange={(e) => setFormData((prev) => ({ ...prev, customSectionNewName: e.target.value }))}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && formData["customSectionNewName"]?.trim()) {
//                   addCustomSection(formData["customSectionNewName"].trim());
//                   setFormData((prev) => ({ ...prev, customSectionNewName: "" }));
//                 }
//               }}
//             />
//             <button
//               onClick={() => {
//                 if (formData["customSectionNewName"]?.trim()) {
//                   addCustomSection(formData["customSectionNewName"].trim());
//                   setFormData((prev) => ({ ...prev, customSectionNewName: "" }));
//                 } else {
//                   toast.error("Section name cannot be empty");
//                 }
//               }}
//               className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
//             >
//               + Add Custom Section
//             </button>
//           </div>

//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border  border-white rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}
//     </div>
//   );
// };

// export default ResumeSide; before popup

// "use client";

// import React, { useState, useEffect } from "react";
// import { SidebarOpen } from "lucide-react";
// import { DropResult } from "@hello-pangea/dnd";
// import { useResume, CustomSection, CustomField } from "../../_context/ResumeContext";
// import Tabs from "./Tabs";
// import EditorTab from "../editor/EditorTab";
// import ResumeGPTTab from "../resumeGPT/ResumeGPTTab";
// import AIReviewTab from "../aiReview/AIReviewTab";
// import { Trash2 } from "lucide-react";
// import { toast } from "sonner";

// import PersonalInfo from "../editor/sections/PersonalInfo";
// import ProfessionalSummary from "../editor/sections/ProfessionalSummary";
// import Education from "../editor/sections/Education";
// import WorkExperience from "../editor/sections/WorkExperience";
// import Projects from "../editor/sections/Projects";
// import Skills from "../editor/sections/Skills";
// import Certifications from "../editor/sections/Certifications";
// import Achievements from "../editor/sections/Achievements";
// import Volunteering from "../editor/sections/Volunteering";
// import References from "../editor/sections/References";
// import Internships from "../editor/sections/Internships";
// import Awards from "../editor/sections/Awards";

// import { initialSections } from "../../_utils/sectionsConfig";
// import Publications from "../editor/sections/Publications";
// import Interests from "../editor/sections/Interests";
// import Hobbies from "../editor/sections/Hobbies";
// import Languages from "../editor/sections/Languages";

// interface SectionProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (fieldKey: string, value: string) => void;
//   onBlur: (fieldKey: string, value: string) => void;
// }

// const sectionComponents: Record<string, React.FC<SectionProps>> = {
//   "Personal Info": PersonalInfo,
//   "Professional Summary": ProfessionalSummary,
//   Education,
//   "Work Experience": WorkExperience,
//   Projects,
//   Skills,
//   Certifications,
//   Achievements,
//   Volunteering,
//   References,
//   Internships,
//   Awards,
//   Publications,
//   Interests,
//   Hobbies,
//   Languages,
// };

// interface ResumeSideProps {
//   isTemplateSidebarOpen?: boolean;
//   onToggleTemplateSidebar?: (isOpen: boolean) => void;
// }

// interface CustomSectionModalProps {
//   section: CustomSection;
//   isOpen: boolean;
//   onClose: () => void;
// }

// const CustomSectionModal: React.FC<CustomSectionModalProps> = ({ section, isOpen, onClose }) => {
//   const { addCustomField, updateCustomFieldValue, deleteCustomField, removeCustomSection } = useResume();
//   const [newFieldName, setNewFieldName] = useState("");
//   const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");

//   if (!isOpen) return null;

//   const handleAddField = () => {
//     if (!newFieldName.trim()) {
//       toast.error("Field name cannot be empty");
//       return;
//     }
//     addCustomField(section.id, newFieldName, newFieldType);
//     setNewFieldName("");
//     setNewFieldType("text");
//     toast.success("Field added successfully");
//   };

//   const handleDeleteSection = () => {
//     if (confirm(`Are you sure you want to delete "${section.sectionName}"?`)) {
//       removeCustomSection(section.id);
//       onClose();
//       toast.success("Section deleted");
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" onClick={onClose}>
//       <div className="bg-white max-w-3xl w-full max-h-[85vh] rounded-lg shadow-lg p-6 overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">{section.sectionName}</h2>
//           <div className="flex gap-2">
//             <button
//               className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded"
//               onClick={handleDeleteSection}
//               aria-label="Delete section"
//             >
//               Delete Section
//             </button>
//             <button
//               className="text-gray-500 hover:text-gray-700"
//               onClick={onClose}
//               aria-label="Close modal"
//             >
//               <Trash2 size={20} />
//             </button>
//           </div>
//         </div>

//         <div className="space-y-4">
//           {section.fields.length === 0 && (
//             <p className="text-gray-500 text-center py-4">No fields added yet. Add fields below.</p>
//           )}
//           {section.fields.map((field) => (
//             <div key={field.id} className="border-b pb-3">
//               <div className="flex justify-between items-center mb-1">
//                 <label className="block text-gray-700 font-medium">
//                   {field.fieldName} ({field.fieldType})
//                 </label>
//                 <button
//                   className="text-red-600 hover:text-red-800"
//                   onClick={() => {
//                     deleteCustomField(section.id, field.id);
//                     toast.success("Field deleted");
//                   }}
//                   aria-label="Delete field"
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//               {field.fieldType === "textarea" ? (
//                 <textarea
//                   className="w-full border p-2 rounded"
//                   rows={3}
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                   placeholder={`Enter ${field.fieldName}`}
//                 />
//               ) : field.fieldType === "date" ? (
//                 <input
//                   type="date"
//                   className="w-full border p-2 rounded"
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                 />
//               ) : field.fieldType === "url" ? (
//                 <input
//                   type="url"
//                   className="w-full border p-2 rounded"
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                   placeholder="https://example.com"
//                 />
//               ) : field.fieldType === "list" ? (
//                 <div className="space-y-2">
//                   {(field.value as string[]).map((item, idx) => (
//                     <div key={idx} className="flex gap-2">
//                       <input
//                         type="text"
//                         className="flex-1 border p-2 rounded"
//                         value={item}
//                         onChange={(e) => {
//                           const newList = [...(field.value as string[])];
//                           newList[idx] = e.target.value;
//                           updateCustomFieldValue(section.id, field.id, newList);
//                         }}
//                         placeholder={`Item ${idx + 1}`}
//                       />
//                       <button
//                         className="text-red-600 hover:text-red-800 px-2"
//                         onClick={() => {
//                           const newList = (field.value as string[]).filter((_, i) => i !== idx);
//                           updateCustomFieldValue(section.id, field.id, newList);
//                         }}
//                         aria-label="Delete list item"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   ))}
//                   <button
//                     className="text-blue-600 hover:underline text-sm"
//                     onClick={() =>
//                       updateCustomFieldValue(section.id, field.id, [...(field.value as string[]), ""])
//                     }
//                   >
//                     + Add item
//                   </button>
//                 </div>
//               ) : (
//                 <input
//                   type="text"
//                   className="w-full border p-2 rounded"
//                   value={field.value as string}
//                   onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
//                   placeholder={`Enter ${field.fieldName}`}
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="mt-6 pt-4 border-t">
//           <h3 className="font-semibold mb-3">Add New Field</h3>
//           <div className="flex items-center gap-3">
//             <input
//               type="text"
//               className="border p-2 rounded flex-1"
//               placeholder="Field name (e.g., Description, Date)"
//               value={newFieldName}
//               onChange={(e) => setNewFieldName(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleAddField()}
//             />
//             <select
//               className="border p-2 rounded"
//               value={newFieldType}
//               onChange={(e) => setNewFieldType(e.target.value as CustomField["fieldType"])}
//             >
//               <option value="text">Text</option>
//               <option value="textarea">Long Text</option>
//               <option value="date">Date</option>
//               <option value="url">URL</option>
//               <option value="list">List</option>
//             </select>
//             <button
//               onClick={handleAddField}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//             >
//               Add Field
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ResumeSide: React.FC<ResumeSideProps> = ({ 
//   isTemplateSidebarOpen = true,
//   onToggleTemplateSidebar,
// }) => {
//   const [sections, setSections] = useState(initialSections);
  
//   const { 
//     resumeData, 
//     isLoadingResume,
//     completionStatus,
//     setCompletionStatus,
//     addCustomSection,
//   } = useResume();
  
//   const [extraSections, setExtraSections] = useState<{ name: string; ai: boolean }[]>([
//     { name: "Achievements", ai: true },
//     { name: "Publications", ai: false },
//     { name: "Volunteering", ai: false },
//     { name: "Awards", ai: false },
//     { name: "Hobbies", ai: true },
//     { name: "Interests", ai: true },
//     { name: "Languages", ai: false },
//     { name: "References", ai: false },
//   ]);

//   const [formData, setFormData] = useState<Record<string, string>>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [activeSection, setActiveSection] = useState<number | null>(null);
//   const [isOpen, setIsOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Editor");
  
//   const [modalOpen, setModalOpen] = useState(false);
//   const [activeCustomSection, setActiveCustomSection] = useState<CustomSection | null>(null);
//   const [newSectionName, setNewSectionName] = useState("");
  
//   const clearErrors = (fields?: string[]) => {
//     if (!fields || fields.length === 0) {
//       setErrors({});
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         fields.forEach(field => {
//           delete newErrors[field];
//         });
//         return newErrors;
//       });
//     }
//   };

//   useEffect(() => {
//     if (!isLoadingResume && resumeData) {
//       const newFormData: Record<string, string> = {};
//       newFormData["name"] = resumeData.personalInfo?.fullName || "";
//       newFormData["email"] = resumeData.personalInfo?.email || "";
//       newFormData["phone"] = resumeData.personalInfo?.phone || "";
//       newFormData["location"] = resumeData.personalInfo?.location || "";
//       newFormData["linkedinurl"] = resumeData.personalInfo?.linkedinUrl || "";
//       newFormData["portifoliourl"] = resumeData.personalInfo?.portifolioUrl || "";
//       newFormData["professionalSummary"] = resumeData.professionalSummary || "";
//       if (Array.isArray(resumeData.skills)) {
//         newFormData["skills"] = resumeData.skills.join(", ");
//       }
//       resumeData.education?.forEach((edu, index) => {
//         newFormData[`education_${index}_school`] = edu.school || "";
//         newFormData[`education_${index}_degree`] = edu.degree || "";
//         newFormData[`education_${index}_startDate`] = edu.startDate || "";
//         newFormData[`education_${index}_endDate`] = edu.endDate || "";
//       });
//       resumeData.workExperience?.forEach((work, index) => {
//         newFormData[`workExperience_${index}_company`] = work.company || "";
//         newFormData[`workExperience_${index}_role`] = work.role || "";
//         newFormData[`workExperience_${index}_location`] = work.location || "";
//         newFormData[`workExperience_${index}_startDate`] = work.startDate || "";
//         newFormData[`workExperience_${index}_endDate`] = work.endDate || "";
//         newFormData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
//         newFormData[`workExperience_${index}_description`] = work.description || "";
//       });
//       resumeData.projects?.forEach((project, index) => {
//         newFormData[`project_${index}_title`] = project.title || "";
//         newFormData[`project_${index}_description`] = project.description || "";
//         newFormData[`project_${index}_technologies`] = Array.isArray(project.technologies) ? project.technologies.join(", ") : "";
//         newFormData[`project_${index}_startDate`] = project.startDate || "";
//         newFormData[`project_${index}_endDate`] = project.endDate || "";
//         newFormData[`project_${index}_link`] = project.link || "";
//       });
//       resumeData.certifications?.forEach((cert, index) => {
//         newFormData[`certification_${index}_name`] = cert.name || "";
//         newFormData[`certification_${index}_issuedBy`] = cert.issuedBy || "";
//         newFormData[`certification_${index}_year`] = cert.year || "";
//       });
//       resumeData.achievements?.forEach((ach, index) => {
//         newFormData[`achievement_${index}_title`] = ach.title || "";
//         newFormData[`achievement_${index}_date`] = ach.date || "";
//         newFormData[`achievement_${index}_description`] = ach.description || "";
//       });
//       resumeData.internships?.forEach((intern, index) => {
//         newFormData[`internship_${index}_company`] = intern.company || "";
//         newFormData[`internship_${index}_role`] = intern.role || "";
//         newFormData[`internship_${index}_location`] = intern.location || "";
//         newFormData[`internship_${index}_startDate`] = intern.startDate || "";
//         newFormData[`internship_${index}_endDate`] = intern.endDate || "";
//         newFormData[`internship_${index}_currentlyWorking`] = String(intern.currentlyWorking);
//         newFormData[`internship_${index}_description`] = intern.description || "";
//       });
//       resumeData.volunteering?.forEach((vol, index) => {
//         newFormData[`volunteering_${index}_organization`] = vol.organization || "";
//         newFormData[`volunteering_${index}_role`] = vol.role || "";
//         newFormData[`volunteering_${index}_startDate`] = vol.startDate || "";
//         newFormData[`volunteering_${index}_endDate`] = vol.endDate || "";
//       });
//       resumeData.awards?.forEach((award, index) => {
//         newFormData[`award_${index}_title`] = award.title || "";
//         newFormData[`award_${index}_issuedBy`] = award.issuedBy || "";
//         newFormData[`award_${index}_year`] = award.year || "";
//       });
//       resumeData.hobbies?.forEach((hobby, index) => {
//         newFormData[`hobbie_${index}_name`] = hobby.name || "";
//         newFormData[`hobbie_${index}_description`] = hobby.description || "";
//         newFormData[`hobbie_${index}_proficiencyLevel`] = hobby.proficiencyLevel || "";
//         newFormData[`hobbie_${index}_achievement`] = hobby.achievement || "";
//       });
//       resumeData.interests?.forEach((interest, index) => {
//         newFormData[`interest_${index}_name`] = interest.name || "";
//         newFormData[`interest_${index}_description`] = interest.description || "";
//         newFormData[`interest_${index}_category`] = interest.category || "";
//       });
//       resumeData.languages?.forEach((lang, index) => {
//         newFormData[`language_${index}_language`] = lang.language || "";
//         newFormData[`language_${index}_proficiency`] = lang.proficiency || "";
//       });
//       resumeData.publications?.forEach((pub, index) => {
//         newFormData[`publication_${index}_title`] = pub.title || "";
//         newFormData[`publication_${index}_authors`] = pub.authors || "";
//         newFormData[`publication_${index}_publicationName`] = pub.publicationName || "";
//         newFormData[`publication_${index}_date`] = pub.date || "";
//         newFormData[`publication_${index}_url`] = pub.url || "";
//       });
//       resumeData.references?.forEach((ref, index) => {
//         newFormData[`reference_${index}_name`] = ref.name || "";
//         newFormData[`reference_${index}_relation`] = ref.relation || "";
//         newFormData[`reference_${index}_contact`] = ref.contact || "";
//       });

//       resumeData.customSections?.forEach((section) => {
//         section.fields.forEach((field) => {
//           const key = `customSection_${section.id}_field_${field.id}`;
//           if (Array.isArray(field.value)) {
//             newFormData[key] = field.value.join(", ");
//           } else {
//             newFormData[key] = field.value || "";
//           }
//         });
//       });

//       setFormData(newFormData);
//     }
//   }, [isLoadingResume, resumeData]);

//   const handleDragEnd = (result: DropResult) => {
//     if (!result.destination) return;
//     const items = [...sections];
//     const [moved] = items.splice(result.source.index, 1);
//     items.splice(result.destination.index, 0, moved);
//     setSections(items);
//   };

//   const handleDeleteSection = (index: number) => {
//     const removed = sections[index];
//     setSections((prev) => prev.filter((_, i) => i !== index));
//     setExtraSections((prev) => [...prev, removed]);
//     if (activeSection === index) setActiveSection(null);
//   };

//   const handleAddSection = (section: { name: string; ai: boolean }) => {
//     setSections((prev) => [...prev, section]);
//     setExtraSections((prev) => prev.filter((s) => s.name !== section.name));
//   };

//   const handleChange = (key: string, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [key]: value
//     }));

//     if (errors[key]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleBlur = (key: string, value: string) => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];

//     const isRequired = !optionalFields.some((optional) => lowerKey.includes(optional));

//     if (isRequired && (!value || value.trim() === "")) {
//       setErrors(prev => ({
//         ...prev,
//         [key]: "This field is required"
//       }));
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[key];
//         return newErrors;
//       });
//     }
//   };

//   const handleSidebarToggle = (isOpen: boolean) => {
//     if (onToggleTemplateSidebar) {
//       onToggleTemplateSidebar(isOpen);
//     }
//   };

//   useEffect(() => {
//     const isFilled = (value?: string) => !!value && value.length > 0;
//     const isArrayFilled = (arr?: string[]) => !!arr && arr.length > 0;

//     const newStatus: Record<string, boolean> = {
//       "Personal Info":
//         !!resumeData.personalInfo.fullName &&
//         !!resumeData.personalInfo.email &&
//         !!resumeData.personalInfo.phone,
//       "Professional Summary": !!resumeData.professionalSummary.summary?.trim(),
//       Education: resumeData.education.some(
//         (edu) =>
//           isFilled(edu.school) && isFilled(edu.degree) 
//       ),
//       Skills: isArrayFilled(resumeData.skills),
//       "Work Experience": resumeData.workExperience.some(
//         (exp) =>
//           isFilled(exp.company) &&
//           isFilled(exp.role)
//       ),
//       Projects: resumeData.projects.some(
//         (proj) => isFilled(proj.title) && isArrayFilled(proj.technologies)
//       ),
//       Certifications: resumeData.certifications.some(
//         (cert) => isFilled(cert.name)),
//       Achievements: resumeData.achievements.some(
//         (ach) => isFilled(ach.title)),
//       Awards: resumeData.awards.some(
//         (awd) => isFilled(awd.title)),
//       Volunteering: resumeData.volunteering.some(
//         (vol) => isFilled(vol.organization) && isFilled(vol.role)
//       ),
//       References: resumeData.references.some(
//         (ref) => isFilled(ref.name) && isFilled(ref.contact)
//       ),
//       Internships: resumeData.internships.some(
//         (intern) => isFilled(intern.company) && isFilled(intern.role)
//       ),
//       Hobbies: resumeData.hobbies.some(
//         (hobby) => isFilled(hobby.name)),
//       Interests: resumeData.interests.some(
//         (interest) => isFilled(interest.name)),
//       Languages: resumeData.languages.some(
//         (lang) => isFilled(lang.language)),
//       Publications: resumeData.publications.some(
//         (pub) => isFilled(pub.title)),
//     };

//     (resumeData.customSections || []).forEach((cs) => {
//       newStatus[cs.id] = cs.fields.some((f) => {
//         if (Array.isArray(f.value)) {
//           return f.value.length > 0 && f.value.some(v => v.trim() !== "");
//         }
//         return f.value && f.value.trim() !== "";
//       });
//     });

//     setCompletionStatus(newStatus);

//   }, [resumeData, setCompletionStatus]);

//   const openCustomSectionModal = (section: CustomSection) => {
//     setActiveCustomSection(section);
//     setModalOpen(true);
//   };

//   const closeModal = () => {
//     setModalOpen(false);
//     setActiveCustomSection(null);
//   };

//   const handleAddCustomSection = () => {
//     if (!newSectionName.trim()) {
//       toast.error("Section name cannot be empty.");
//       return;
//     }
//     addCustomSection(newSectionName.trim());
//     setNewSectionName("");
//   };

//   const dynamicWidth = isTemplateSidebarOpen ? "w-[30%]" : "w-[32%]";

//   return (
//     <div
//       className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
//         ${isOpen ? `${dynamicWidth} px-3` : "w-12 p-0"}
//       `}
//     >
//       {isOpen && (
//         <Tabs
//           isOpen={isOpen}
//           onToggle={() => setIsOpen(!isOpen)}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//         />
//       )}

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">

//           {activeTab === "Editor" && (
//             <EditorTab
//               sections={sections}
//               extraSections={extraSections}
//               activeSection={activeSection}
//               formData={formData}
//               errors={errors}
//               sectionComponents={sectionComponents}
//               handleDeleteSection={handleDeleteSection}
//               handleAddSection={handleAddSection}
//               handleChange={handleChange}
//               handleBlur={handleBlur}
//               setActiveSection={setActiveSection}
//               handleDragEnd={handleDragEnd}
//               completionStatus={completionStatus}
//               onSidebarToggle={handleSidebarToggle}
//               clearErrors={clearErrors}
//             />
//           )}
//           {activeTab === "ResumeGPT" && <ResumeGPTTab />}
//           {activeTab === "AI Review" && <AIReviewTab />}

//           <div className="mt-4 pt-4 border-t">
//             <h3 className="font-semibold mb-3 text-gray-700">Custom Sections</h3>
//             <div className="mb-3">
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded mb-2"
//                 placeholder="New custom section name"
//                 value={newSectionName}
//                 onChange={(e) => setNewSectionName(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleAddCustomSection()}
//               />
//               <button
//                 onClick={handleAddCustomSection}
//                 className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
//               >
//                 + Add Custom Section
//               </button>
//             </div>

//             {resumeData.customSections.map((section) => (
//               <div
//                 key={section.id}
//                 className="cursor-pointer px-3 py-2 mb-2 border rounded hover:bg-gray-100 flex justify-between items-center transition-colors"
//                 onClick={() => openCustomSectionModal(section)}
//               >
//                 <span className="font-medium">{section.sectionName}</span>
//                 <span className="text-sm text-gray-500">{section.fields.length} fields</span>
//               </div>
//             ))}
//           </div>

//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-2 p-1.5 bg-white border  border-white rounded shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarOpen className="text-blue-500" size={20} />
//         </button>
//       )}

//       {activeCustomSection && (
//         <CustomSectionModal section={activeCustomSection} isOpen={modalOpen} onClose={closeModal} />
//       )}
//     </div>
//   );
// };

// export default ResumeSide;



