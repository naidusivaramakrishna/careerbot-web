import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { toast } from "sonner";
import { Trash2, ArrowLeft } from 'lucide-react';
import { RiEdit2Fill } from 'react-icons/ri';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { deleteSectionItemFromEnhancedResume } from "@/api/enhancerApi";
import { useSearchParams } from "next/navigation";

interface PortEntry {
  portName: string;
  region: string;
  countryCode: string;
  portCalls: string;
  id?: string;
}

const emptyPort = (): PortEntry => ({
  portName: "",
  region: "",
  countryCode: "",
  portCalls: "",
});

const PortsExperience: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { errors, validateRequired, clearError } = useValidation();

  const showTips = true;
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: PortEntry): boolean => {
    return !!(entry.portName || entry.region);
  };

  const [savedEntries, setSavedEntries] = useState<PortEntry[]>(() => {
    if (resumeData.portsExperience && resumeData.portsExperience.length) {
      const validEntries = resumeData.portsExperience.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<PortEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyPort()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Ports Experience") return;
      let allValid = true;
      editingEntries.forEach((port, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("ports_experience", globalIndex, {
          portName: port.portName,
          region: port.region,
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
      const prevItems = (prev.portsExperience ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.portsExperience) === JSON.stringify(merged)) return prev;
      return { ...prev, portsExperience: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.portsExperience?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.portsExperience!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.portsExperience!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.portsExperience![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.portsExperience]);

  const handleChange = <K extends keyof PortEntry>(
    index: number,
    field: K,
    value: PortEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("ports_experience", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyPort()]);
  };

  const removePort = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const portToDelete = savedEntries[index];
    const itemId = portToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "ports_experience", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "ports_experience", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete port. Please try again.");
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
            {savedEntries.map((port, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {port.portName || "Port"}
                  </div>

                  <div className="text-sm text-gray-700">
                    {port.region && `Region: ${port.region}`}
                    {port.region && port.countryCode && " • "}
                    {port.countryCode && `Country: ${port.countryCode}`}
                  </div>

                  {port.portCalls && (
                    <div className="text-xs text-gray-600">
                      Port Calls: {port.portCalls}
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
                    onClick={() => removePort(index)}
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
              {editingEntries.map((port, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4">
                    {/* Port Name & Region */}
                    <div className="flex gap-4">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Port Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g., Shanghai, Rotterdam, Singapore"
                          value={port.portName}
                          onChange={(e) => handleChange(editIndex, "portName", e.target.value)}
                          onBlur={() => validateRequired("ports_experience", globalIndex, { portName: port.portName })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 ${
                            errors[`ports_experience-${globalIndex}-portName`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#2557a7]"
                          } focus:outline-none`}
                          maxLength={100}
                        />
                      </div>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Region <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g., Asia, Europe, Americas"
                          value={port.region}
                          onChange={(e) => handleChange(editIndex, "region", e.target.value)}
                          onBlur={() => validateRequired("ports_experience", globalIndex, { region: port.region })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 ${
                            errors[`ports_experience-${globalIndex}-region`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#2557a7]"
                          } focus:outline-none`}
                          maxLength={50}
                        />
                      </div>
                    </div>

                    {/* Country Code & Port Calls */}
                    <div className="flex gap-4">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Country Code</label>
                        <input
                          type="text"
                          placeholder="e.g., CN, NL, SG"
                          value={port.countryCode}
                          onChange={(e) => handleChange(editIndex, "countryCode", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                          maxLength={5}
                        />
                      </div>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Port Calls</label>
                        <input
                          type="text"
                          placeholder="e.g., 25, 10-15"
                          value={port.portCalls}
                          onChange={(e) => handleChange(editIndex, "portCalls", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                          maxLength={50}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          <div className="w-80 flex-shrink-0 sticky top-2">
            {showTips ? (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>List the major international ports where you have worked. This demonstrates your global maritime experience.</p>
                  <p>Include port name, region, country code, and number of port calls at each location.</p>
                  <p>Example: Shanghai | Asia | CN | 15 calls | Rotterdam | Europe | NL | 12 calls</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortsExperience;
