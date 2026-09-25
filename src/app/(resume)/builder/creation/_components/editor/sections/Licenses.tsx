import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { deleteSectionItemFromEnhancedResume } from "@/api/enhancerApi";
import { useSearchParams } from "next/navigation";
import SectionTipsPanel from "../SectionTipsPanel";

interface LicenseEntry {
  name: string;
  issuedBy: string;
  year: string;
  expiryDate?: string;
  credentialId?: string;
  id?: string;
}

const emptyLicense = (): LicenseEntry => ({
  name: "",
  issuedBy: "",
  year: "",
  expiryDate: "",
  credentialId: "",
});

const Licenses: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";

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
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<LicenseEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: LicenseEntry): boolean => {
    return !!(entry.name || entry.issuedBy || entry.year || entry.expiryDate || entry.credentialId);
  };

  const [savedEntries, setSavedEntries] = useState<LicenseEntry[]>(() => {
    if (resumeData.licenses && resumeData.licenses.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validEntries = (resumeData.licenses as any[]).map((c) => ({
        ...c,
        issuedBy: c.issuedBy || c.issuer || '',
        year: c.year || '',
      })).filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<LicenseEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyLicense()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Licenses") return;
      let allValid = true;
      editingEntries.forEach((license, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("license", globalIndex, {
          name: license.name,
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
      if (e.detail.section !== "Licenses") return;
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
      const prevItems = (prev.licenses ?? []) as Array<Record<string, unknown>>;
      const merged = allEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.licenses) === JSON.stringify(merged)) return prev;
      return { ...prev, licenses: merged };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (editingEntries.length > 0) return;
    if (!resumeData.licenses?.length) return;
    setSavedEntries(prev => {
      if (prev.length !== resumeData.licenses!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.licenses![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.licenses]);

  const handleChange = <K extends keyof LicenseEntry>(
    index: number,
    field: K,
    value: LicenseEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("license", savedEntries.length + index, field as string);
  };

  const addLicense = () => {
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

    setEditingEntries([emptyLicense()]);
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyLicense()]);
  };

  const removeLicense = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const licenseToDelete = savedEntries[index];
    const itemId = licenseToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("license", index);
      reindexErrors("license", index);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "licenses", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "licenses", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("license", index);
      reindexErrors("license", index);

    } catch (error) {
      toast.error("Failed to delete license. Please try again.");
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

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List with Add Button */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((license, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* License Name - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {license.name || "No license name"}
                  </div>

                  {/* Issued By */}
                  {license.issuedBy && (
                    <div className="text-sm text-gray-700">
                      {license.issuedBy}
                    </div>
                  )}

                  {/* Year and Expiry Date */}
                  <div className="flex gap-2 text-xs text-gray-600">
                    {license.year && (
                      <span>Issued: {license.year}</span>
                    )}
                    {license.expiryDate && (
                      <span>• Expires: {license.expiryDate}</span>
                    )}
                  </div>

                  {/* Credential ID */}
                  {license.credentialId && (
                    <div className="text-xs text-gray-500">
                      License #: {license.credentialId}
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
                    <RiEdit2Fill size={20} className="text-[#595959]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLicense(index)}
                    disabled={deletingIndex === index}
                    className={`p-2 text-xs hover:bg-[#e5e5e5] rounded-full ${deletingIndex === index ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    <Trash2
                      size={20}
                      className={`text-[#595959] hover:text-red-500 ${deletingIndex === index ? "animate-pulse" : ""
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
              <LuPlus size={20} className="text-[#595959] group-hover:text-white" />
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
              {editingEntries.map((license, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* License Name & Issued By */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          License Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={license.name}
                          placeholder="e.g., MBBS, MD, MCI License"
                          onChange={(e) => handleChange(editIndex, "name", e.target.value)}
                          onBlur={() => validateRequired("license", globalIndex, { name: license.name })}
                          maxLength={150}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors[`license-${globalIndex}-name`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
                        />
                        {errors[`license-${globalIndex}-name`] && (
                          <span className="text-xs text-red-500">
                            {errors[`license-${globalIndex}-name`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Issued By
                        </label>
                        <input
                          type="text"
                          value={license.issuedBy}
                          placeholder="e.g., University Name, Board, Council"
                          onChange={(e) => handleChange(editIndex, "issuedBy", e.target.value)}
                          maxLength={100}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
                        />
                      </div>
                    </div>

                    {/* Issue Year & Expiry Date */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Issue Year</label>
                        <input
                          type="text"
                          value={license.year}
                          placeholder="YYYY"
                          maxLength={4}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            handleChange(editIndex, "year", digits);
                            clearError("license", globalIndex, "year");
                          }}
                          onBlur={() => {
                            const val = license.year.trim();
                            if (!val) return;
                            if (!/^\d{4}$/.test(val)) {
                              setFieldError("license", globalIndex, "year", "Year must be exactly 4 digits (e.g., 2024)");
                            } else {
                              clearError("license", globalIndex, "year");
                            }
                          }}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 focus:outline-none ${errors[`license-${globalIndex}-year`] ? "border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
                        />
                        {errors[`license-${globalIndex}-year`] && (
                          <span className="text-xs text-red-500">
                            {errors[`license-${globalIndex}-year`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Expiry Date <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={license.expiryDate || ""}
                          placeholder="YYYY or Never expires"
                          onChange={(e) => {
                            handleChange(editIndex, "expiryDate", e.target.value);
                            clearError("license", globalIndex, "expiryDate");
                          }}
                          onBlur={() => {
                            const expiry = license.expiryDate?.trim();
                            const issueYear = license.year?.trim();
                            if (!expiry || !issueYear || !/^\d{4}$/.test(issueYear)) {
                              clearError("license", globalIndex, "expiryDate");
                              return;
                            }
                            const lower = expiry.toLowerCase();
                            if (lower.includes("never") || lower.includes("lifetime") || lower.includes("permanent")) {
                              clearError("license", globalIndex, "expiryDate");
                              return;
                            }
                            const issueYearNum = parseInt(issueYear, 10);
                            let expiryYear: number | null = null;
                            if (/^\d{4}$/.test(expiry)) {
                              expiryYear = parseInt(expiry, 10);
                            }
                            if (expiryYear !== null && expiryYear < issueYearNum) {
                              setFieldError("license", globalIndex, "expiryDate", `Expiry cannot be before issue year (${issueYear})`);
                            } else {
                              clearError("license", globalIndex, "expiryDate");
                            }
                          }}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 focus:outline-none ${errors[`license-${globalIndex}-expiryDate`] ? "border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
                        />
                        {errors[`license-${globalIndex}-expiryDate`] && (
                          <span className="text-xs text-red-500">
                            {errors[`license-${globalIndex}-expiryDate`]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Credential ID / License Number */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          License Number <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={license.credentialId || ""}
                          placeholder="e.g., MCI/12345, Registration #DL/123456"
                          onChange={(e) => handleChange(editIndex, "credentialId", e.target.value)}
                          maxLength={100}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Another Button in Editing Form */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={addLicense}
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
                sectionKey="Licenses"
                entryContent={[editingEntries[0]?.name, editingEntries[0]?.issuedBy].filter(Boolean) as string[]}
                staticTips={
                  <div className="bg-[#faf9f8] rounded-lg p-5">
                    <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                    <div className="border-t border-gray-300 mb-3"></div>
                    <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                      <p>
                        Licenses and credentials validate your professional qualifications and regulatory compliance. List all relevant licenses, certifications, and registrations that are required or valued in your field.
                      </p>
                      <p>
                        Include the full license name (e.g., MBBS, MD, MCI License), issuing authority (University, Board, Council), and year obtained. Add license numbers and expiry dates to verify authenticity and current validity.
                      </p>
                      <p>
                        Prioritize current and regulatory licenses first, followed by professional certifications. Keep licenses current and update expiry dates regularly.
                      </p>
                      <p className="text-xs text-gray-500 italic mt-6">
                        *Professional licenses are critical for healthcare, legal, and regulated profession roles.
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

export default Licenses;
