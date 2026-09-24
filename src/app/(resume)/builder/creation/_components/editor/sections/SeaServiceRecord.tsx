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

interface SeaServiceRecordEntry {
  rankProgression: string;
  totalSeaService: string;
  licenseType: string;
  currentRank: string;
  currentStatus: string;
  verificationDate: string;
  id?: string;
}

const emptyRecord = (): SeaServiceRecordEntry => ({
  rankProgression: "",
  totalSeaService: "",
  licenseType: "",
  currentRank: "",
  currentStatus: "",
  verificationDate: "",
});

const SeaServiceRecord: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { validateRequired, clearError } = useValidation();

  const showTips = true;
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: SeaServiceRecordEntry): boolean => {
    return !!(entry.currentRank || entry.rankProgression || entry.totalSeaService || entry.licenseType);
  };

  const [savedEntries, setSavedEntries] = useState<SeaServiceRecordEntry[]>(() => {
    if (resumeData.seaServiceRecord && resumeData.seaServiceRecord.length) {
      const validEntries = resumeData.seaServiceRecord.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<SeaServiceRecordEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyRecord()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Sea Service Record") return;
      let allValid = true;
      editingEntries.forEach((record, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("sea_service_record", globalIndex, {
          currentRank: record.currentRank,
          rankProgression: record.rankProgression,
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
      const prevItems = (prev.seaServiceRecord ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.seaServiceRecord) === JSON.stringify(merged)) return prev;
      return { ...prev, seaServiceRecord: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.seaServiceRecord?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.seaServiceRecord!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.seaServiceRecord!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.seaServiceRecord![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.seaServiceRecord]);

  const handleChange = <K extends keyof SeaServiceRecordEntry>(
    index: number,
    field: K,
    value: SeaServiceRecordEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("sea_service_record", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyRecord()]);
  };

  const removeRecord = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const recordToDelete = savedEntries[index];
    const itemId = recordToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "sea_service_record", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "sea_service_record", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete sea service record. Please try again.");
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
            {savedEntries.map((record, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {record.currentRank || "Rank"}
                  </div>

                  <div className="text-sm text-gray-700">
                    Status: {record.currentStatus || "—"} | Sea Service: {record.totalSeaService || "—"}
                  </div>

                  {record.licenseType && (
                    <div className="text-sm text-gray-600">
                      License: {record.licenseType}
                    </div>
                  )}

                  {record.rankProgression && (
                    <div className="text-sm text-gray-600">
                      Progression: {record.rankProgression}
                    </div>
                  )}

                  {record.verificationDate && (
                    <div className="text-xs text-gray-500">
                      Verified: {record.verificationDate}
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
                    onClick={() => removeRecord(index)}
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
              <LuPlus size={16} /> Add Sea Service Record
            </button>
          )}
        </div>
      )}

      {/* Edit/Add Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          <div ref={formScrollRef} className="flex-1 mt-6 pr-2">
            <div className="flex flex-col gap-3">
          {editingEntries.map((record, editIndex) => (
              <div key={editIndex} className="flex flex-col gap-3 pb-4">
                {/* Current Rank & Status */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Current Rank</label>
                    <input
                      type="text"
                      placeholder="e.g., Captain, Chief Officer"
                      value={record.currentRank}
                      onChange={(e) => handleChange(editIndex, 'currentRank', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Current Status</label>
                    <input
                      type="text"
                      placeholder="e.g., Active, Retired"
                      value={record.currentStatus}
                      onChange={(e) => handleChange(editIndex, 'currentStatus', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Total Sea Service & License Type */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Total Sea Service</label>
                    <input
                      type="text"
                      placeholder="e.g., 15 years"
                      value={record.totalSeaService}
                      onChange={(e) => handleChange(editIndex, 'totalSeaService', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">License Type</label>
                    <input
                      type="text"
                      placeholder="e.g., STCW Class A, B"
                      value={record.licenseType}
                      onChange={(e) => handleChange(editIndex, 'licenseType', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Rank Progression */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#3b3b3b]">Rank Progression</label>
                  <textarea
                    placeholder="e.g., Officer Cadet → 3rd Officer → 2nd Officer → Chief Officer → Captain"
                    value={record.rankProgression}
                    onChange={(e) => handleChange(editIndex, 'rankProgression', e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                  />
                </div>

                {/* Verification Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#3b3b3b]">Verification Date</label>
                  <input
                    type="text"
                    placeholder="e.g., Jan 2024"
                    value={record.verificationDate}
                    onChange={(e) => handleChange(editIndex, 'verificationDate', e.target.value)}
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
                  <p>Document your entire maritime career progression from cadet to current position.</p>
                  <p>Include all ranks held and total years of sea service experience.</p>
                  <p>Specify your STCW license class (A, B, etc.) and current employment status.</p>
                  <p>Example: Captain | Active | 20 years | STCW Class A | Verified Jan 2024</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeaServiceRecord;
