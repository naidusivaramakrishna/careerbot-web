"use client";
import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi"; // ✅ Import the API

interface LanguageEntry {
  language: string;
  proficiency: string;
  _id?: string; // ✅ NEW: Add item ID for backend tracking
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

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.languages) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, languages: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

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
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyLanguage()]);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyLanguage()]);
  };

  // ✅ UPDATED: Delete with API call
  const removeLanguage = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const languageToDelete = savedEntries[index];
    const itemId = languageToDelete._id;

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
      alert("Failed to delete language. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  const editEntry = (index: number) => {
    const entryToEdit = savedEntries[index];
    const updatedSaved = [...savedEntries];
    updatedSaved.splice(index, 1);
    setSavedEntries(updatedSaved);
    setEditingEntries([entryToEdit]);
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
            className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2"
          >
            <div className="flex flex-col gap-3">
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
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
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
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Languages;

