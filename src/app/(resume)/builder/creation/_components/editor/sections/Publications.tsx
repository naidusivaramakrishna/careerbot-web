"use client";
import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import MonthYearPicker from "../MonthYearPicker";
import { toast } from "sonner";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2, ArrowLeft } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi"; // ✅ Import the API
import SectionTipsPanel from "../SectionTipsPanel";

interface PublicationEntry {
  title: string;
  authors: string;
  publicationName: string;
  date: string;
  url: string;
  id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyPublication = (): PublicationEntry => ({
  title: "",
  authors: "",
  publicationName: "",
  date: "",
  url: "",
});

const Publications: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } = useValidation();

  const [showTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null); // ✅ NEW: Track deleting state
  const [editingOriginalIndex, setEditingOriginalIndex] = useState<number | null>(null);
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<PublicationEntry | null>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: PublicationEntry): boolean => {
    return !!(entry.title && entry.publicationName);
  };

  const [savedEntries, setSavedEntries] = useState<PublicationEntry[]>(() => {
    if (resumeData.publications && resumeData.publications.length) {
      const validEntries = resumeData.publications.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<PublicationEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyPublication()];
    }
    return [];
  });

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries.filter(hasValidData)];
    if (JSON.stringify(resumeData.publications) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, publications: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (editingEntries.length > 0) return;
    if (!resumeData.publications?.length) return;
    setSavedEntries(prev => {
      if (prev.length !== resumeData.publications!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.publications![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.publications]);

  const handleChange = <K extends keyof PublicationEntry>(
    index: number,
    field: K,
    value: PublicationEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("publication", savedEntries.length + index, field as string);
  };

  const addPublication = () => {
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

    setEditingEntries([emptyPublication()]);
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyPublication()]);
  };

  // ✅ UPDATED: Delete with API call
  const removePublication = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const publicationToDelete = savedEntries[index];
    const itemId = publicationToDelete.id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      // // console.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("publication", index);
      reindexErrors("publication", index);
      return;
    }

    try {
      setDeletingIndex(index);
      // // console.log("🗑️ Deleting publication item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "publications", itemId);

      // // console.log("✅ Publication item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("publication", index);
      reindexErrors("publication", index);

    } catch (error) {
      // // console.error("❌ Failed to delete publication item:", error);
      toast.error("Failed to delete publication. Please try again.");
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

  function dateToLabel(val: string) {
    if (!val) return "";
    const [y, m] = val.split("-");
    if (!y || !m) return val; // Return as-is if not in YYYY-MM format
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(m, 10) - 1;
    if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return val;
    return `${monthNames[mIdx]} ${y}`;
  }

  return (
    <div className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((publication, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {publication.title || "No title"}
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {publication.authors && <span>{publication.authors}</span>}
                    {publication.date && <span> • {dateToLabel(publication.date)}</span>}
                  </div>
                  
                  {publication.publicationName && (
                    <div className="text-sm text-[#2557a7] italic">
                      {publication.publicationName}
                    </div>
                  )}
                  
                  {publication.url && (
                    <div className="text-xs text-gray-600 hover:text-blue-600">
                      <a href={publication.url} target="_blank" rel="noopener noreferrer" className="underline">
                        View Publication
                      </a>
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
                    onClick={() => removePublication(index)}
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
              {(editingOriginalEntry !== null || savedEntries.length > 0) && (
                <button type="button" onClick={cancelEdit}
                  className="flex items-center gap-1 text-xs font-semibold text-black mb-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={18} />
                  </span>
                  Back
                </button>
              )}
              {editingEntries.map((publication, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Publication Title */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">
                        Publication Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={publication.title}
                        placeholder="Title of your publication"
                        onChange={(e) => handleChange(editIndex, "title", e.target.value)}
                        onBlur={() => validateRequired("publication", globalIndex, { title: publication.title })}
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                      />
                      {errors[`publication-${globalIndex}-title`] && (
                        <span className="text-xs text-red-500">
                          {errors[`publication-${globalIndex}-title`]}
                        </span>
                      )}
                    </div>

                    {/* Authors */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">
                        Authors
                      </label>
                      <input
                        type="text"
                        value={publication.authors}
                        placeholder="Your name and co-authors"
                        onChange={(e) => handleChange(editIndex, "authors", e.target.value)}
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                      />
                    </div>

                    {/* Publication Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">
                        Publication Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={publication.publicationName}
                        placeholder="Journal, Magazine, or Website name"
                        onChange={(e) => handleChange(editIndex, "publicationName", e.target.value)}
                        onBlur={() => validateRequired("publication", globalIndex, { publicationName: publication.publicationName })}
                        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                      />
                      {errors[`publication-${globalIndex}-publicationName`] && (
                        <span className="text-xs text-red-500">
                          {errors[`publication-${globalIndex}-publicationName`]}
                        </span>
                      )}
                    </div>

                    {/* Date & URL */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Date
                        </label>
                        <MonthYearPicker
                          value={publication.date}
                          onChange={(val) => handleChange(editIndex, "date", val)}
                          placeholder="MM/YY"
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          URL
                        </label>
                        <input
                          type="url"
                          value={publication.url}
                          placeholder="https://example.com"
                          onChange={(e) => handleChange(editIndex, "url", e.target.value)}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addPublication}
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
                sectionKey="Publications"
                entryContent={[editingEntries[0]?.title, editingEntries[0]?.authors].filter(Boolean) as string[]}
                staticTips={
                  <div className="bg-[#faf9f8] rounded-lg p-5">
                    <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                    <div className="border-t border-gray-300 mb-3"></div>
                    <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                      <p>
                        Publications demonstrate expertise and thought leadership. Include peer-reviewed articles, blog posts, whitepapers, and research papers you have authored or co-authored.
                      </p>
                      <p>
                        Include the publication title, your name and co-authors, the publication venue (journal, magazine, or website), date of publication, and a link to access it.
                      </p>
                      <p className="text-xs text-gray-500 italic mt-6">
                        *Publications increase credibility and demonstrate industry expertise to potential employers.
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

export default Publications;

