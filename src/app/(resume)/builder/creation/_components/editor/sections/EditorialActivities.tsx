import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { toast } from "sonner";
import { Trash2 } from 'lucide-react';
import { RiEdit2Fill } from 'react-icons/ri';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { deleteSectionItemFromEnhancedResume } from "@/api/enhancerApi";
import { useSearchParams } from "next/navigation";

interface EditorialEntry {
  activityType: string;
  organizationJournal: string;
  startYear: string;
  endYear: string;
  reviewCount: string;
  id?: string;
}

const emptyActivity = (): EditorialEntry => ({
  activityType: "",
  organizationJournal: "",
  startYear: "",
  endYear: "",
  reviewCount: "",
});

const EditorialActivities: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { validateRequired, clearError } = useValidation();

  const showTips = true;
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: EditorialEntry): boolean => {
    return !!(entry.activityType || entry.organizationJournal);
  };

  const [savedEntries, setSavedEntries] = useState<EditorialEntry[]>(() => {
    if (resumeData.editorialActivities && resumeData.editorialActivities.length) {
      const validEntries = resumeData.editorialActivities.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<EditorialEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyActivity()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Editorial Activities") return;
      let allValid = true;
      editingEntries.forEach((activity, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("editorial_activities", globalIndex, {
          activityType: activity.activityType,
          organizationJournal: activity.organizationJournal,
        });
        if (!isValid) allValid = false;
      });
      e.detail.resultRef.valid = allValid;
    };
    window.addEventListener("resume-validate-section", handleValidateSave as EventListener);
    return () => window.removeEventListener("resume-validate-section", handleValidateSave as EventListener);
  }, [editingEntries, savedEntries, validateRequired]);

  useEffect(() => {
    const validEntries = [
      ...savedEntries,
      ...editingEntries.filter(hasValidData)
    ];
    setResumeData(prev => {
      const prevItems = (prev.editorialActivities ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.editorialActivities) === JSON.stringify(merged)) return prev;
      return { ...prev, editorialActivities: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.editorialActivities?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.editorialActivities!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.editorialActivities!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.editorialActivities![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.editorialActivities]);

  const handleChange = <K extends keyof EditorialEntry>(
    index: number,
    field: K,
    value: EditorialEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("editorial_activities", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyActivity()]);
  };

  const removeActivity = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const activityToDelete = savedEntries[index];
    const itemId = activityToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "editorial_activities", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "editorial_activities", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete editorial activity. Please try again.");
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

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((activity, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {activity.activityType || "Activity"}
                  </div>

                  <div className="text-sm text-gray-700">
                    {activity.organizationJournal || "—"}
                  </div>

                  {activity.startYear && activity.endYear && (
                    <div className="text-sm text-gray-600">
                      {activity.startYear}-{activity.endYear}
                    </div>
                  )}

                  {activity.reviewCount && (
                    <div className="text-xs text-gray-500">
                      Reviews: {activity.reviewCount}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editEntry(index)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <RiEdit2Fill size={18} />
                  </button>
                  <button
                    onClick={() => removeActivity(index)}
                    disabled={deletingIndex === index}
                    className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingEntries.length === 0 && (
            <button
              onClick={addNewEntry}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mt-4"
            >
              <LuPlus size={16} /> Add Editorial Activity
            </button>
          )}
        </div>
      )}

      {/* Edit/Add Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 mt-6 pr-2">
            <div className="flex flex-col gap-3">
          {editingEntries.map((activity, editIndex) => (
              <div key={editIndex} className="flex flex-col gap-3 pb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type *
                  </label>
                  <select
                    value={activity.activityType}
                    onChange={(e) => handleChange(editIndex, 'activityType', e.target.value)}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Editor-in-Chief">Editor-in-Chief</option>
                    <option value="Associate Editor">Associate Editor</option>
                    <option value="Editorial Board">Editorial Board Member</option>
                    <option value="Guest Editor">Guest Editor</option>
                    <option value="Peer Reviewer">Peer Reviewer</option>
                    <option value="Study Section">Study Section Member</option>
                    <option value="Review Panel">Review Panel Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Journal/Organization Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Nature, Science, NIH Study Section, etc."
                    value={activity.organizationJournal}
                    onChange={(e) => handleChange(editIndex, 'organizationJournal', e.target.value)}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Year
                    </label>
                    <input
                      type="text"
                      placeholder="2022"
                      value={activity.startYear}
                      onChange={(e) => handleChange(editIndex, 'startYear', e.target.value)}
                      maxLength={4}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Year
                    </label>
                    <input
                      type="text"
                      placeholder="Present or 2024"
                      value={activity.endYear}
                      onChange={(e) => handleChange(editIndex, 'endYear', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Count / Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 15-20 reviews/year, 50+ lifetime reviews"
                    value={activity.reviewCount}
                    onChange={(e) => handleChange(editIndex, 'reviewCount', e.target.value)}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                  />
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="w-80 shrink-0 sticky top-2">
            {showTips ? (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>Add editorial board positions and roles.</p>
                  <p>Include journal peer review activities.</p>
                  <p>Track study section and review panel memberships.</p>
                  <p>Note approximate review count (e.g., 15+ reviews/year).</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorialActivities;
