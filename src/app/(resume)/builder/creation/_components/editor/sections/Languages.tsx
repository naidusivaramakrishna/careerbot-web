"use client";
import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { RiEdit2Fill } from 'react-icons/ri';
import { toast } from "sonner";
import { Trash2, ArrowLeft } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi"; // ✅ Import the API
import SectionTipsPanel from "../SectionTipsPanel";

interface LanguageEntry {
  language: string;
  proficiency: string;
  id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyLanguage = (): LanguageEntry => ({
  language: "",
  proficiency: "",
});

const Languages: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } = useValidation();

  const [showTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null); // ✅ NEW: Track deleting state
  const [editingOriginalIndex, setEditingOriginalIndex] = useState<number | null>(null);
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<LanguageEntry | null>(null);

  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: LanguageEntry): boolean => {
    return !!(entry.language && entry.proficiency);
  };

  const [savedEntries, setSavedEntries] = useState<LanguageEntry[]>(() => {
    if (resumeData.languages && resumeData.languages.length) {
      const validEntries = resumeData.languages.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<LanguageEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyLanguage()];
    }
    return [];
  });

  // Validate all editing entries when the Save button in EditorTab fires the event.
  // Sets field-level errors (red borders) synchronously so the save can be blocked.
  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Languages") return;
      let allValid = true;
      editingEntries.forEach((language, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("language", globalIndex, {
          language: language.language,
          proficiency: language.proficiency,
        });
        if (!isValid) allValid = false;
      });
      e.detail.resultRef.valid = allValid;
    };
    window.addEventListener("resume-validate-section", handleValidateSave as EventListener);
    return () => window.removeEventListener("resume-validate-section", handleValidateSave as EventListener);
  }, [editingEntries, savedEntries, validateRequired]);

  useEffect(() => {
    type OpenEntryEvent = CustomEvent<{ section: string; entryIndex: number }>;
    const handleOpenEntry = (e: OpenEntryEvent) => {
      if (e.detail.section !== "Languages") return;
      const idx = e.detail.entryIndex;
      if (idx >= 0 && idx < savedEntries.length) {
        editEntry(idx);
      }
    };
    window.addEventListener("resume-open-entry", handleOpenEntry as EventListener);
    return () => window.removeEventListener("resume-open-entry", handleOpenEntry as EventListener);
  }, [savedEntries]);

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries.filter(hasValidData)];
    setResumeData(prev => {
      const prevItems = (prev.languages ?? []) as Array<Record<string, unknown>>;
      const merged = allEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.languages) === JSON.stringify(merged)) return prev;
      return { ...prev, languages: merged };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.languages?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.languages!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.languages!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.languages![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.languages]);

  const handleChange = <K extends keyof LanguageEntry>(
    index: number,
    field: K,
    value: LanguageEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("language", savedEntries.length + index, field as string);
  };

  const addLanguage = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      if (editingOriginalIndex !== null) {
        setSavedEntries((prev) => {
          const updated = [...prev];
          updated.splice(editingOriginalIndex, 0, ...validEditingEntries);
          return updated;
        });
        setEditingOriginalIndex(null);
        setEditingOriginalEntry(null);
      } else {
        setSavedEntries((prev) => [...prev, ...validEditingEntries]);
      }
    }

    setEditingEntries([emptyLanguage()]);
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyLanguage()]);
  };

  // ✅ UPDATED: Delete with API call
  const removeLanguage = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const languageToDelete = savedEntries[index];
    const itemId = languageToDelete.id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      // // console.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("language", index);
      reindexErrors("language", index);
      return;
    }

    try {
      setDeletingIndex(index);
      // // console.log("🗑️ Deleting language item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "languages", itemId);

      // // console.log("✅ Language item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("language", index);
      reindexErrors("language", index);

    } catch (error) {
      // // console.error("❌ Failed to delete language item:", error);
      toast.error("Failed to delete language. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  const editEntry = (index: number) => {
    const entryToEdit = savedEntries[index];
    setEditingOriginalIndex(index);
    setEditingOriginalEntry(entryToEdit);
    const updatedSaved = [...savedEntries];
    updatedSaved.splice(index, 1);
    setSavedEntries(updatedSaved);
    setEditingEntries([entryToEdit]);
  };

  const cancelEdit = () => {
    if (editingOriginalEntry !== null && editingOriginalIndex !== null) {
      setSavedEntries(prev => {
        const restored = [...prev];
        restored.splice(editingOriginalIndex, 0, editingOriginalEntry);
        return restored;
      });
    }
    setEditingEntries([]);
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
  };

  const proficiencyLevels = [
    "native",
    "fluent",
    "advanced",
    "intermediate",
    "beginner",
  ];

  return (
    <div className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((language, index) => (
              <div key={index} className="flex items-center justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex items-center gap-4">
                  <div className="text-base font-bold text-gray-900">
                    {language.language || "No language"}
                  </div>
                  
                  <div className="text-xs font-semibold text-[#2557a7] bg-blue-50 px-3 py-1 rounded-full">
                    {language.proficiency || "No level"}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => editEntry(index)}
                    disabled={deletingIndex === index}
                    className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full disabled:opacity-50"
                  >
                    <RiEdit2Fill size={20} className="text-[#595959]"/>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    disabled={deletingIndex === index}
                    className={`p-2 text-xs hover:bg-[#e5e5e5] rounded-full ${
                      deletingIndex === index ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Trash2 
                      size={20} 
                      className={`text-[#595959] hover:text-red-500 ${
                        deletingIndex === index ? "animate-pulse" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={addNewEntry}
              className="flex w-fit p-3 items-center justify-center text-xs font-semibold bg-[#e5e5e5] hover:bg-[#2557a7] rounded-full transition-colors group"
            >
              <LuPlus size={20} className="text-[#595959] group-hover:text-white"/>
            </button>
          </div>
        </div>
      )}

      {/* Editing Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          <div 
            ref={formScrollRef}
            className="flex-1 mt-6 pr-2"
          >
            <div className="flex flex-col gap-3">
              {(editingOriginalEntry !== null || savedEntries.length > 0) && (
                <button type="button" onClick={cancelEdit}
                  className="flex items-center gap-1 text-xs font-semibold text-black mb-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={18} />
                  </span>
                  Back
                </button>
              )}
              {editingEntries.map((language, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-4 pb-4 relative">
                    {/* Language Field */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">
                        Language <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={language.language}
                        placeholder="e.g., English, Spanish, Mandarin Chinese"
                        onChange={(e) => handleChange(editIndex, "language", e.target.value)}
                        onBlur={() => validateRequired("language", globalIndex, { language: language.language })}
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors[`language-${globalIndex}-language`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      />
                      {errors[`language-${globalIndex}-language`] && (
                        <span className="text-xs text-red-500">
                          {errors[`language-${globalIndex}-language`]}
                        </span>
                      )}
                    </div>

                    {/* Proficiency Level */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">
                        Proficiency Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={language.proficiency}
                        onChange={(e) => handleChange(editIndex, "proficiency", e.target.value)}
                        onBlur={() => validateRequired("language", globalIndex, { proficiency: language.proficiency })}
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors[`language-${globalIndex}-proficiency`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                      >
                        <option value="">Select proficiency level</option>
                        {proficiencyLevels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors[`language-${globalIndex}-proficiency`] && (
                        <span className="text-xs text-red-500">
                          {errors[`language-${globalIndex}-proficiency`]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addLanguage}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          <div className="w-80 flex-shrink-0 sticky top-2">
            {showTips && (
              <SectionTipsPanel
                sectionKey="Languages"
                entryContent={[editingEntries[0]?.language].filter(Boolean) as string[]}
                staticTips={
                  <div className="bg-[#faf9f8] rounded-lg p-5">
                    <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                    <div className="border-t border-gray-300 mb-3"></div>
                    <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                      <p>
                        List the languages you speak and your proficiency level for each. Be honest about your abilities - recruiters often conduct interviews in listed languages.
                      </p>
                      <p>
                        Use standard proficiency levels: Native, Fluent, Advanced, Intermediate, or Beginner. This helps employers quickly assess your communication capabilities.
                      </p>
                      <p className="text-xs text-gray-500 italic mt-6">
                        *Multilingual candidates are 50% more likely to get international job opportunities.
                      </p>
                    </div>
                  </div>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Languages;

