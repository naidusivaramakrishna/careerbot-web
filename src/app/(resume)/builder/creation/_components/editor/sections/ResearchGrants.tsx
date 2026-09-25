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

interface GrantEntry {
  grantTitle: string;
  fundingAgency: string;
  amount: string;
  startYear: string;
  endYear: string;
  role: string;
  status: string;
  id?: string;
}

const emptyGrant = (): GrantEntry => ({
  grantTitle: "",
  fundingAgency: "",
  amount: "",
  startYear: "",
  endYear: "",
  role: "",
  status: "",
});

const ResearchGrants: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { validateRequired, clearError } = useValidation();

  const showTips = true;
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: GrantEntry): boolean => {
    return !!(entry.grantTitle || entry.fundingAgency);
  };

  const [savedEntries, setSavedEntries] = useState<GrantEntry[]>(() => {
    if (resumeData.researchGrants && resumeData.researchGrants.length) {
      const validEntries = resumeData.researchGrants.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<GrantEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyGrant()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Research Grants") return;
      let allValid = true;
      editingEntries.forEach((grant, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("research_grants", globalIndex, {
          grantTitle: grant.grantTitle,
          fundingAgency: grant.fundingAgency,
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
      const prevItems = (prev.researchGrants ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.researchGrants) === JSON.stringify(merged)) return prev;
      return { ...prev, researchGrants: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.researchGrants?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.researchGrants!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.researchGrants!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.researchGrants![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.researchGrants]);

  const handleChange = <K extends keyof GrantEntry>(
    index: number,
    field: K,
    value: GrantEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("research_grants", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyGrant()]);
  };

  const removeGrant = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const grantToDelete = savedEntries[index];
    const itemId = grantToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "research_grants", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "research_grants", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete research grant. Please try again.");
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
            {savedEntries.map((grant, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {grant.grantTitle || "Grant Title"}
                  </div>

                  <div className="text-sm text-gray-700">
                    {grant.fundingAgency || "—"} | {grant.amount || "—"}
                  </div>

                  <div className="text-sm text-gray-600">
                    {grant.startYear && grant.endYear ? `${grant.startYear}-${grant.endYear}` : "—"} | {grant.role || "—"}
                  </div>

                  {grant.status && (
                    <div className="text-xs text-gray-500 inline-block px-2 py-1 bg-gray-100 rounded">
                      {grant.status}
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
                    onClick={() => removeGrant(index)}
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
              <LuPlus size={16} /> Add Research Grant
            </button>
          )}
        </div>
      )}

      {/* Edit/Add Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          <div ref={formScrollRef} className="flex-1 mt-6 pr-2">
            <div className="flex flex-col gap-3">
          {editingEntries.map((grant, editIndex) => (
              <div key={editIndex} className="flex flex-col gap-3 pb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grant Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Machine Learning for Cancer Treatment"
                    value={grant.grantTitle}
                    onChange={(e) => handleChange(editIndex, 'grantTitle', e.target.value)}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funding Agency *
                    </label>
                    <input
                      type="text"
                      placeholder="NIH, NSF, EU, Foundation, etc."
                      value={grant.fundingAgency}
                      onChange={(e) => handleChange(editIndex, 'fundingAgency', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="text"
                      placeholder="$500,000 or €200,000"
                      value={grant.amount}
                      onChange={(e) => handleChange(editIndex, 'amount', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Year
                    </label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={grant.startYear}
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
                      placeholder="2026"
                      value={grant.endYear}
                      onChange={(e) => handleChange(editIndex, 'endYear', e.target.value)}
                      maxLength={4}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={grant.role}
                      onChange={(e) => handleChange(editIndex, 'role', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    >
                      <option value="">Select Role</option>
                      <option value="PI">Principal Investigator (PI)</option>
                      <option value="Co-PI">Co-Principal Investigator (Co-PI)</option>
                      <option value="Co-Investigator">Co-Investigator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={grant.status}
                      onChange={(e) => handleChange(editIndex, 'status', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Awarded">Awarded</option>
                      <option value="Pending">Pending</option>
                    </select>
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
                  <p>Add all research grants secured or awarded.</p>
                  <p>Include grant title and funding agency (NIH, NSF, etc.).</p>
                  <p>Specify your role (PI, Co-PI, Co-Investigator).</p>
                  <p>Note grant amount and duration.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchGrants;
