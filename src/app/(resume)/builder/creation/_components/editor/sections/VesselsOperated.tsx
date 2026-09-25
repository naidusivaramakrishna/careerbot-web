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

interface VesselEntry {
  vesselType: string;
  vesselSize: string;
  crewSize: string;
  tenure: string;
  positionHeld: string;
  id?: string;
}

const emptyVessel = (): VesselEntry => ({
  vesselType: "",
  vesselSize: "",
  crewSize: "",
  tenure: "",
  positionHeld: "",
});

const VesselsOperated: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { errors, validateRequired, clearError } = useValidation();

  const [showTips, setShowTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: VesselEntry): boolean => {
    return !!(entry.vesselType || entry.vesselSize || entry.crewSize || entry.tenure);
  };

  const [savedEntries, setSavedEntries] = useState<VesselEntry[]>(() => {
    if (resumeData.vesselsOperated && resumeData.vesselsOperated.length) {
      const validEntries = resumeData.vesselsOperated.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<VesselEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyVessel()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Vessels Operated") return;
      let allValid = true;
      editingEntries.forEach((vessel, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("vessels_operated", globalIndex, {
          vesselType: vessel.vesselType,
          vesselSize: vessel.vesselSize,
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
      const prevItems = (prev.vesselsOperated ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.vesselsOperated) === JSON.stringify(merged)) return prev;
      return { ...prev, vesselsOperated: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.vesselsOperated?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.vesselsOperated!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.vesselsOperated!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.vesselsOperated![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.vesselsOperated]);

  const handleChange = <K extends keyof VesselEntry>(
    index: number,
    field: K,
    value: VesselEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("vessels_operated", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyVessel()]);
  };

  const removeVessel = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const vesselToDelete = savedEntries[index];
    const itemId = vesselToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "vessels_operated", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "vessels_operated", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete vessel. Please try again.");
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
            {savedEntries.map((vessel, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {vessel.vesselType || "Vessel Type"}
                  </div>

                  <div className="text-sm text-gray-700">
                    Size: {vessel.vesselSize || "—"} | Crew: {vessel.crewSize || "—"}
                  </div>

                  {vessel.positionHeld && (
                    <div className="text-sm text-gray-600">
                      Position: {vessel.positionHeld}
                    </div>
                  )}

                  {vessel.tenure && (
                    <div className="text-xs text-gray-600">
                      Tenure: {vessel.tenure}
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
                    onClick={() => removeVessel(index)}
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
          <div ref={formScrollRef} className="flex-1 mt-6 pr-2">
            <div className="flex flex-col gap-3">
              {editingEntries.map((vessel, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4">
                    {/* Vessel Type & Size */}
                    <div className="flex gap-4">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Vessel Type <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g., Container Ship, General Cargo, Bulk Carrier"
                          value={vessel.vesselType}
                          onChange={(e) => handleChange(editIndex, "vesselType", e.target.value)}
                          onBlur={() => validateRequired("vessels_operated", globalIndex, { vesselType: vessel.vesselType })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 ${
                            errors[`vessels_operated-${globalIndex}-vesselType`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#2557a7]"
                          } focus:outline-none`}
                          maxLength={100}
                        />
                      </div>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Vessel Size <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g., 12,000 TEU, 25,000 DWT"
                          value={vessel.vesselSize}
                          onChange={(e) => handleChange(editIndex, "vesselSize", e.target.value)}
                          onBlur={() => validateRequired("vessels_operated", globalIndex, { vesselSize: vessel.vesselSize })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 ${
                            errors[`vessels_operated-${globalIndex}-vesselSize`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#2557a7]"
                          } focus:outline-none`}
                          maxLength={50}
                        />
                      </div>
                    </div>

                    {/* Crew Size & Tenure */}
                    <div className="flex gap-4">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Crew Size</label>
                        <input
                          type="text"
                          placeholder="e.g., 20 personnel, 15-20"
                          value={vessel.crewSize}
                          onChange={(e) => handleChange(editIndex, "crewSize", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                          maxLength={50}
                        />
                      </div>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Tenure</label>
                        <input
                          type="text"
                          placeholder="e.g., 2.5 years, 2020-2023"
                          value={vessel.tenure}
                          onChange={(e) => handleChange(editIndex, "tenure", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                          maxLength={50}
                        />
                      </div>
                    </div>

                    {/* Position Held */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">Position Held</label>
                      <input
                        type="text"
                        placeholder="e.g., Second Officer, Chief Officer, Master"
                        value={vessel.positionHeld}
                        onChange={(e) => handleChange(editIndex, "positionHeld", e.target.value)}
                        className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                        maxLength={100}
                      />
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          <div className="w-80 shrink-0 sticky top-2">
            {showTips ? (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>List the vessels you have operated or commanded. This shows your maritime experience breadth.</p>
                  <p>Include vessel type, size (TEU for containers, DWT for cargo), crew size, and your position held on each vessel.</p>
                  <p>Example: Container Ship | 12,000 TEU | 20 crew | Second Officer | 2.5 years</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default VesselsOperated;
