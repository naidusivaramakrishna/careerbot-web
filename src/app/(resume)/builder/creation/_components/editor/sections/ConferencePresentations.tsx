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

interface PresentationEntry {
  presentationType: string;
  title: string;
  conferenceName: string;
  location: string;
  year: string;
  id?: string;
}

const emptyPresentation = (): PresentationEntry => ({
  presentationType: "",
  title: "",
  conferenceName: "",
  location: "",
  year: "",
});

const ConferencePresentations: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { validateRequired, clearError } = useValidation();

  const showTips = true;
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: PresentationEntry): boolean => {
    return !!(entry.title || entry.conferenceName);
  };

  const [savedEntries, setSavedEntries] = useState<PresentationEntry[]>(() => {
    if (resumeData.conferencePresentations && resumeData.conferencePresentations.length) {
      const validEntries = resumeData.conferencePresentations.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<PresentationEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyPresentation()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Conference Presentations") return;
      let allValid = true;
      editingEntries.forEach((presentation, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("conference_presentations", globalIndex, {
          title: presentation.title,
          conferenceName: presentation.conferenceName,
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
      const prevItems = (prev.conferencePresentations ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.conferencePresentations) === JSON.stringify(merged)) return prev;
      return { ...prev, conferencePresentations: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.conferencePresentations?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.conferencePresentations!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.conferencePresentations!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.conferencePresentations![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.conferencePresentations]);

  const handleChange = <K extends keyof PresentationEntry>(
    index: number,
    field: K,
    value: PresentationEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("conference_presentations", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyPresentation()]);
  };

  const removePresentation = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const presentationToDelete = savedEntries[index];
    const itemId = presentationToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "conference_presentations", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "conference_presentations", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete conference presentation. Please try again.");
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
            {savedEntries.map((presentation, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {presentation.title || "Presentation"}
                  </div>

                  <div className="text-sm text-gray-700">
                    {presentation.conferenceName || "—"} | {presentation.location || "—"}
                  </div>

                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    {presentation.presentationType && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {presentation.presentationType}
                      </span>
                    )}
                    {presentation.year && (
                      <span>{presentation.year}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editEntry(index)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <RiEdit2Fill size={18} />
                  </button>
                  <button
                    onClick={() => removePresentation(index)}
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
              <LuPlus size={16} /> Add Conference Presentation
            </button>
          )}
        </div>
      )}

      {/* Edit/Add Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 mt-6 pr-2">
            <div className="flex flex-col gap-3">
          {editingEntries.map((presentation, editIndex) => (
              <div key={editIndex} className="flex flex-col gap-3 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presentation Type *
                    </label>
                    <select
                      value={presentation.presentationType}
                      onChange={(e) => handleChange(editIndex, 'presentationType', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    >
                      <option value="">Select Type</option>
                      <option value="Keynote Speaker">Keynote Speaker</option>
                      <option value="Invited Lecture">Invited Lecture</option>
                      <option value="Oral Presentation">Oral Presentation</option>
                      <option value="Poster Presentation">Poster Presentation</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Panel Discussion">Panel Discussion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={presentation.year}
                      onChange={(e) => handleChange(editIndex, 'year', e.target.value)}
                      maxLength={4}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presentation Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., AI Applications in Precision Medicine"
                    value={presentation.title}
                    onChange={(e) => handleChange(editIndex, 'title', e.target.value)}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conference/Symposium Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., American Association for Cancer Research"
                      value={presentation.conferenceName}
                      onChange={(e) => handleChange(editIndex, 'conferenceName', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Barcelona, Spain"
                      value={presentation.location}
                      onChange={(e) => handleChange(editIndex, 'location', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
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
                  <p>Add all presentations (keynotes, oral, poster).</p>
                  <p>Distinguish between different presentation types.</p>
                  <p>Include conference name and location.</p>
                  <p>Highlight keynote and invited presentations.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferencePresentations;
