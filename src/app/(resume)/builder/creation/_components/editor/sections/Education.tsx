import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import MonthYearPicker, { toYearMonth } from "../MonthYearPicker";
import SectionTipsPanel from "../SectionTipsPanel";
import { toast } from "sonner";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2, ArrowLeft } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { deleteSectionItemFromEnhancedResume } from "@/api/enhancerApi";
import { useSearchParams } from "next/navigation";

type ScoreType = "CGPA" | "Marks" | "GPA" | "Percentage";

interface EducationEntry {
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  scoreType?: ScoreType; // ✅ Type of score (CGPA, Marks, GPA, Percentage)
  scoreValue?: string; // ✅ Score value (e.g., 3.8, 85, etc.)
  id?: string; // ✅ Backend uses "id" field, not "_id"
}

const SCORE_TYPES: ScoreType[] = ["CGPA", "Marks", "GPA", "Percentage"];

const normalizeScoreValue = (value: string, scoreType?: ScoreType): string =>
  scoreType === "Percentage"
    ? value.replace(/\s*(?:%|percent(?:age)?)\s*$/i, "").trim()
    : value;

const displayScoreValue = (value: string, scoreType?: ScoreType): string => {
  const normalized = normalizeScoreValue(value, scoreType);
  return scoreType === "Percentage" ? `${normalized}%` : normalized;
};

const compactNumber = (value: number): string => Number(value.toFixed(2)).toString();

const scoreAsPercentage = (value: string, scoreType?: ScoreType): number | null => {
  const normalized = normalizeScoreValue(value, scoreType).trim();
  if (!normalized || !scoreType) return null;
  if (scoreType === "Marks") {
    const fraction = normalized.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
    if (fraction) {
      const earned = Number(fraction[1]);
      const total = Number(fraction[2]);
      return total > 0 ? (earned / total) * 100 : null;
    }
    const marks = Number(normalized);
    return Number.isFinite(marks) ? marks : null;
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;
  if (scoreType === "CGPA") return numeric * 10;
  if (scoreType === "GPA") return numeric * 25;
  return numeric;
};

const convertScoreValue = (value: string, fromType: ScoreType | undefined, toType: ScoreType): string => {
  if (!value.trim() || !fromType || fromType === toType) return normalizeScoreValue(value, toType);
  const percentage = scoreAsPercentage(value, fromType);
  if (percentage === null) return normalizeScoreValue(value, toType);
  if (toType === "CGPA") return compactNumber(percentage / 10);
  if (toType === "GPA") return compactNumber(percentage / 25);
  if (toType === "Marks") return `${compactNumber(percentage)}/100`;
  return compactNumber(percentage);
};

const emptyEducation = (): EducationEntry => ({
  school: "",
  degree: "",
  startDate: "",
  endDate: "",
  scoreType: undefined,
  scoreValue: "",
});

const Education: React.FC = () => {
  const { resumeData, setResumeData, resumeSource } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = resumeSource === "enhanced" || searchParams.get("source") === "enhanced";

  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
    setFieldError,
  } = useValidation();

  const [showTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [editingOriginalIndex, setEditingOriginalIndex] = useState<number | null>(null);
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<EducationEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: EducationEntry): boolean => {
    return !!(entry.school || entry.degree || entry.startDate || entry.endDate);
  };

  const [savedEntries, setSavedEntries] = useState<EducationEntry[]>(() => {
    if (resumeData.education && resumeData.education.length) {
      const seen = new Set<string>();
      return resumeData.education.filter(entry => {
        if (!hasValidData(entry)) return false;
        const key = `${entry.school}||${entry.degree}||${entry.startDate}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<EducationEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyEducation()];
    }
    return [];
  });

  // Validate all editing entries when the Save button in EditorTab fires the event.
  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Education") return;
      let allValid = true;
      editingEntries.forEach((edu, editIndex) => {
        const globalIndex = editingOriginalIndex ?? (savedEntries.length + editIndex);
        const isValid = validateRequired("education", globalIndex, {
          school: edu.school,
          degree: edu.degree,
        });
        if (!isValid) allValid = false;

        // Start/End date are optional individually, but if both are filled they
        // must be in order. Malformed/legacy values (toYearMonth returns null,
        // e.g. a bare "2023" instead of "MMM YY") are skipped rather than
        // blocking save — we only enforce the check when both sides are
        // actually comparable.
        const startYM = toYearMonth(edu.startDate);
        const endYM = toYearMonth(edu.endDate);
        if (startYM !== null && endYM !== null && endYM < startYM) {
          setFieldError("education", globalIndex, "endDate", "End date can't be before start date");
          allValid = false;
        }
      });
      e.detail.resultRef.valid = allValid;
    };
    window.addEventListener("resume-validate-section", handleValidateSave as EventListener);
    return () => window.removeEventListener("resume-validate-section", handleValidateSave as EventListener);
  }, [editingEntries, savedEntries, editingOriginalIndex, validateRequired, setFieldError]);

  useEffect(() => {
    type OpenEntryEvent = CustomEvent<{ section: string; entryIndex: number }>;
    const handleOpenEntry = (e: OpenEntryEvent) => {
      if (e.detail.section !== "Education") return;
      const idx = e.detail.entryIndex;
      if (idx >= 0 && idx < savedEntries.length) {
        editEntry(idx);
      }
    };
    window.addEventListener("resume-open-entry", handleOpenEntry as EventListener);
    return () => window.removeEventListener("resume-open-entry", handleOpenEntry as EventListener);
  }, [savedEntries]);

  useEffect(() => {
    const validEditingEntries = editingEntries.filter(hasValidData);
    const validEntries = [...savedEntries];
    if (editingOriginalIndex !== null) {
      validEntries.splice(editingOriginalIndex, 1, ...validEditingEntries);
    } else {
      validEntries.push(...validEditingEntries);
    }
    // An id-less entry is genuinely new and must stay id-less — see
    // Internships.tsx's sibling effect for why backfilling an id by array
    // POSITION is unsound.
    setResumeData(prev => {
      if (JSON.stringify(prev.education) === JSON.stringify(validEntries)) return prev;
      return { ...prev, education: validEntries };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries, editingOriginalIndex]);

  // After save, EditorTab merges backend-assigned IDs into resumeData.education.
  // Sync those IDs back into savedEntries so that subsequent deletes hit the API
  // rather than silently falling back to local-only deletion.
  useEffect(() => {
    if (editingEntries.length > 0) return; // don't disturb mid-edit state
    if (!resumeData.education?.length) return;
    setSavedEntries(prev => {
      if (prev.length !== resumeData.education!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.education![idx]?.id;
        if (backendId && !entry.id) {
          changed = true;
          return { ...entry, id: backendId };
        }
        return entry;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.education]);

  const handleChange = <K extends keyof EducationEntry>(
    index: number,
    field: K,
    value: EducationEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("education", savedEntries.length + index, field as string);
    // The date-order error is always attached to "endDate" (see
    // handleValidateSave) — clear it here too when startDate changes,
    // otherwise fixing the start date leaves a stale error under End date.
    if (field === "startDate" || field === "endDate") {
      clearError("education", savedEntries.length + index, "endDate");
    }
  };

  // ✅ FIXED: Validate before saving
  const addEducation = () => {
    // ✅ Step 1: Validate all editing entries first
    let hasErrors = false;

    editingEntries.forEach((entry, editIndex) => {
      const globalIndex = editingOriginalIndex ?? (savedEntries.length + editIndex);

      // Clear old errors for this entry first
      clearSectionIndexErrors("education", globalIndex);

      // Validate required fields
      const isValid = validateRequired("education", globalIndex, {
        school: entry.school,
        degree: entry.degree,
      });

      if (!isValid) {
        hasErrors = true;
      }
    });

    // ✅ Step 2: If there are validation errors, don't proceed
    if (hasErrors) {
      // // console.log("❌ Validation failed - cannot save education");
      return; // Stop here, errors will be shown in the form
    }

    // ✅ Step 3: Only save valid entries with data
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      if (editingOriginalIndex !== null) {
        // Editing an existing entry — re-insert at the original position
        setSavedEntries((prev) => {
          const updated = [...prev];
          updated.splice(editingOriginalIndex, 1, ...validEditingEntries);
          return updated;
        });
      } else {
        // Adding a new entry — append to end
        setSavedEntries((prev) => [...prev, ...validEditingEntries]);
      }
    }

    setEditingEntries([emptyEducation()]);
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyEducation()]);
  };

  const cancelEdit = () => {
    setEditingEntries([]);
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
  };

  // ✅ UPDATED: Delete with API call
  const removeEducation = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const educationToDelete = savedEntries[index];
    const itemId = educationToDelete.id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      // // console.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("education", index);
      reindexErrors("education", index);
      return;
    }

    try {
      setDeletingIndex(index);
      // // console.log("🗑️ Deleting education item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "education", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "education", itemId);
      }

      // // console.log("✅ Education item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("education", index);
      reindexErrors("education", index);

    } catch (error) {
      // // console.error("❌ Failed to delete education item:", error);
      toast.error("Failed to delete education entry. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  const editEntry = (index: number) => {
    const entryToEdit = savedEntries[index];
    setEditingOriginalIndex(index);
    setEditingOriginalEntry(entryToEdit);
    setEditingEntries([entryToEdit]);
  };

  function startToLabel(val: string): string {
    if (!val) return "";
    // Already in "MMM YY" format from the picker (e.g. "Jun 24") — return as-is
    if (/^[A-Za-z]{3}\s\d{2}$/.test(val)) return val;
    // Backend "YYYY-MM" format (e.g. "2024-06")
    const [y, m] = val.split("-");
    if (!y || !m) return val;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(m, 10) - 1;
    if (mIdx < 0 || mIdx > 11) return val;
    return `${monthNames[mIdx]} ${y.slice(-2)}`;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List with Add Button */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((education, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* Degree - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {education.degree || "No degree"}
                  </div>

                  {/* School */}
                  <div className="text-sm text-gray-700">
                    {education.school || "No school"}
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-600">
                    {education.startDate ? startToLabel(education.startDate) : ""}
                    {education.startDate && education.endDate && " - "}
                    {education.endDate ? startToLabel(education.endDate) : ""}
                  </div>

                  {/* Score */}
                  {education.scoreType && education.scoreValue && (
                    <div className="text-xs text-gray-500 mt-1">
                      {education.scoreType}: {displayScoreValue(education.scoreValue, education.scoreType)}
                    </div>
                  )}
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
                    onClick={() => removeEducation(index)}
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

          {/* Add Button in Entry List */}
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

      {/* Editing Form with Tips Panel */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          {/* Left Side: Scrollable Form Fields Section */}
          <div
            ref={formScrollRef}
            className="flex-1 mt-6 pr-2"
          >
            {(editingOriginalEntry !== null || savedEntries.length > 0) && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1 text-xs font-semibold text-black mb-3"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 transition-colors">
                  <ArrowLeft size={18} />
                </span>
                Back
              </button>
            )}
            <div className="flex flex-col gap-3">
              {editingEntries.map((education, editIndex) => {
                const globalIndex = editingOriginalIndex ?? (savedEntries.length + editIndex);
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* School & Degree */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          School <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.school}
                          placeholder="School Name"
                          onChange={(e) => handleChange(editIndex, "school", e.target.value)}
                          onBlur={() => validateRequired("education", globalIndex, { school: education.school })}
                          maxLength={150}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors[`education-${globalIndex}-school`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                        />
                        {errors[`education-${globalIndex}-school`] && (
                          <span className="text-xs text-red-500">
                            {errors[`education-${globalIndex}-school`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Degree <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.degree}
                          placeholder="Bachelor's, Master's, etc."
                          onChange={(e) => handleChange(editIndex, "degree", e.target.value)}
                          onBlur={() => validateRequired("education", globalIndex, { degree: education.degree })}
                          maxLength={150}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors[`education-${globalIndex}-degree`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#2557a7]"}`}
                        />
                        {errors[`education-${globalIndex}-degree`] && (
                          <span className="text-xs text-red-500">
                            {errors[`education-${globalIndex}-degree`]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
                        <MonthYearPicker
                          value={education.startDate}
                          onChange={(val) => handleChange(editIndex, "startDate", val)}
                          placeholder="MM/YY"
                          maxDate={education.endDate}
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
                        <MonthYearPicker
                          value={education.endDate}
                          onChange={(val) => handleChange(editIndex, "endDate", val)}
                          placeholder="MM/YY"
                          minDate={education.startDate}
                          allowFutureDates
                        />
                        {errors[`education-${globalIndex}-endDate`] && (
                          <span className="text-xs text-red-500">
                            {errors[`education-${globalIndex}-endDate`]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Combined Score Field with Dropdown */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">Score</label>
                      <div className={`flex items-center rounded-md bg-[#faf9f8] border-b-2 hover:bg-gray-100 ${errors[`education-${globalIndex}-scoreValue`] ? "border-red-500" : "border-transparent focus-within:border-blue-500"}`}>
                        {/* Score Value Input */}
                        <input
                          type="text"
                          value={education.scoreValue || ""}
                          placeholder={education.scoreType === "Percentage" ? "e.g., 85" : "e.g., 3.8"}
                          onChange={(e) => {
                            handleChange(
                              editIndex,
                              "scoreValue",
                              normalizeScoreValue(e.target.value, education.scoreType)
                            );
                            clearError("education", globalIndex, "scoreValue");
                          }}
                          onBlur={() => {
                            const val = education.scoreValue?.trim();
                            if (!val || !education.scoreType || education.scoreType === "Marks") {
                              clearError("education", globalIndex, "scoreValue");
                              return;
                            }
                            const num = parseFloat(val);
                            const limits: Record<string, [number, number]> = {
                              Percentage: [0, 100],
                              CGPA: [0, 10],
                              GPA: [0, 4],
                            };
                            const [min, max] = limits[education.scoreType] ?? [0, Infinity];
                            if (isNaN(num)) {
                              setFieldError("education", globalIndex, "scoreValue", `Score must be a number for ${education.scoreType}`);
                            } else if (num < min || num > max) {
                              setFieldError("education", globalIndex, "scoreValue", `${education.scoreType} must be between ${min} and ${max}`);
                            } else {
                              clearError("education", globalIndex, "scoreValue");
                            }
                          }}
                          maxLength={10}
                          className="flex-1 px-3 py-3.5 text-sm bg-transparent text-black outline-none"
                        />

                        {/* Vertical Separator */}
                        <div className="w-px h-6 bg-gray-300 ml-1 mr-8" />

                        {/* Score Type Dropdown */}
                        <select
                          value={education.scoreType || ""}
                          onChange={(e) => {
                            const scoreType = e.target.value as ScoreType | "";
                            const updated = [...editingEntries];
                            const previousType = updated[editIndex].scoreType;
                            updated[editIndex] = {
                              ...updated[editIndex],
                              scoreType: scoreType || undefined,
                              scoreValue: scoreType
                                ? convertScoreValue(
                                    updated[editIndex].scoreValue || "",
                                    previousType,
                                    scoreType
                                  )
                                : updated[editIndex].scoreValue,
                            };
                            setEditingEntries(updated);
                            clearError("education", globalIndex, "scoreValue");
                          }}
                          className="pl-6 pr-3 py-3.5 text-sm bg-transparent text-black outline-none cursor-pointer font-medium appearance-none bg-left bg-no-repeat"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundPosition: "0.5rem center"
                          }}
                        >
                          <option value="">Type</option>
                          {SCORE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      {errors[`education-${globalIndex}-scoreValue`] && (
                        <span className="text-xs text-red-500">
                          {errors[`education-${globalIndex}-scoreValue`]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Another Button in Editing Form */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Fixed Tips Section */}
          <div className="w-80 flex-shrink-0 sticky top-2">
            {showTips && (
              <SectionTipsPanel
                sectionKey="Education"
                entryContent={[editingEntries[0]?.school, editingEntries[0]?.degree].filter(Boolean) as string[]}
                staticTips={
                  <div className="bg-[#faf9f8] rounded-lg p-5">
                    <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                    <div className="border-t border-gray-300 mb-3"></div>
                    <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                      <p>
                        Education credentials validate your qualifications and academic foundation. List your most recent and relevant educational achievements in reverse chronological order.
                      </p>
                      <p>
                        Include the institution name, degree earned, and dates attended. Highlight honors, relevant coursework, or academic achievements that strengthen your candidacy.
                      </p>
                      <p className="text-xs text-gray-500 italic mt-6">
                        *95% of employers verify education credentials during the hiring process.
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

export default Education;



