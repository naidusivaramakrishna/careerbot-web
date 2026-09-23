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
import MonthYearPicker from "../MonthYearPicker";

const NEVER_EXPIRES_LABEL = "Never expires";
const isNeverExpiresValue = (v?: string): boolean => {
  const lower = (v ?? "").trim().toLowerCase();
  return lower.includes("never") || lower.includes("lifetime") || lower.includes("permanent");
};

interface CertificationEntry {
  name: string;
  issuedBy: string;
  year: string;
  expiryDate?: string;
  credentialId?: string;
  id?: string;
}

const emptyCertification = (): CertificationEntry => ({
  name: "",
  issuedBy: "",
  year: "",
  expiryDate: "",
  credentialId: "",
});

const Certifications: React.FC = () => {
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
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null); // ✅ NEW: Track deleting state
  const [editingOriginalIndex, setEditingOriginalIndex] = useState<number | null>(null);
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<CertificationEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: CertificationEntry): boolean => {
    return !!(entry.name || entry.issuedBy || entry.year || entry.expiryDate || entry.credentialId);
  };

  const [savedEntries, setSavedEntries] = useState<CertificationEntry[]>(() => {
    if (resumeData.certifications && resumeData.certifications.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validEntries = (resumeData.certifications as any[]).map((c) => ({
        ...c,
        issuedBy: c.issuedBy || c.issuer || '',
        year: c.year || '',
      })).filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<CertificationEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyCertification()];
    }
    return [];
  });

  // Validate all editing entries when the Save button in EditorTab fires the event.
  // Sets field-level errors (red borders) synchronously so the save can be blocked.
  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Certifications") return;
      let allValid = true;
      editingEntries.forEach((certification, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("certification", globalIndex, {
          name: certification.name,
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
      if (e.detail.section !== "Certifications") return;
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
      // Keep builder and AI/parser field names together. The ATS apply
      // endpoint evaluates full_name/issuing_organization while templates
      // and ResumeData use name/issuer. An id-less entry is genuinely new
      // and stays id-less — see Internships.tsx's sibling effect for why
      // backfilling an id by array POSITION is unsound.
      const merged = allEntries.map((entry) => ({
        ...entry,
        issuer: entry.issuedBy,
        issueDate: entry.year,
        full_name: entry.name,
        issuing_organization: entry.issuedBy,
      }));
      if (JSON.stringify(prev.certifications) === JSON.stringify(merged)) return prev;
      return { ...prev, certifications: merged };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (editingEntries.length > 0) return;
    if (!resumeData.certifications?.length) return;
    setSavedEntries(prev => {
      if (prev.length !== resumeData.certifications!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.certifications![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.certifications]);

  const handleChange = <K extends keyof CertificationEntry>(
    index: number,
    field: K,
    value: CertificationEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("certification", savedEntries.length + index, field as string);
  };

  const addCertification = () => {
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

    setEditingEntries([emptyCertification()]);
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyCertification()]);
  };

  // ✅ UPDATED: Delete with API call
  const removeCertification = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const certificationToDelete = savedEntries[index];
    const itemId = certificationToDelete.id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      // // console.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("certification", index);
      reindexErrors("certification", index);
      return;
    }

    try {
      setDeletingIndex(index);
      // Cancel a queued full-section autosave before DELETE starts. Otherwise a
      // pre-delete snapshot can finish while this request is in flight and
      // recreate the item after the endpoint has removed it.
      window.dispatchEvent(new CustomEvent("resume-item-deleted", {
        detail: { section: "Certifications", itemId },
      }));
      // // console.log("🗑️ Deleting certification item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "certifications", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "certifications", itemId);
      }

      // // console.log("✅ Certification item deleted from backend successfully");

      // The delete endpoint is authoritative. Cancel any queued full-section
      // autosave before changing local state; otherwise its pre-delete snapshot
      // can finish after DELETE and restore this exact certification.
      window.dispatchEvent(new CustomEvent("resume-item-deleted", {
        detail: { section: "Certifications", itemId, suppressNext: true },
      }));
      setResumeData(prev => ({
        ...prev,
        certifications: (prev.certifications || []).filter(cert => cert.id !== itemId),
      }));

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("certification", index);
      reindexErrors("certification", index);

    } catch (error) {
      // // console.error("❌ Failed to delete certification item:", error);
      toast.error("Failed to delete certification. Please try again.");
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
            {savedEntries.map((certification, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* Name - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {certification.name || "No certification name"}
                  </div>

                  {/* Issued By */}
                  {certification.issuedBy && (
                    <div className="text-sm text-gray-700">
                      {certification.issuedBy}
                    </div>
                  )}

                  {/* Year and Expiry Date */}
                  <div className="flex gap-2 text-xs text-gray-600">
                    {certification.year && (
                      <span>Issued: {certification.year}</span>
                    )}
                    {certification.expiryDate && (
                      <span>• Expires: {certification.expiryDate}</span>
                    )}
                  </div>

                  {/* Credential ID */}
                  {certification.credentialId && (
                    <div className="text-xs text-gray-500">
                      ID: {certification.credentialId}
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
                    onClick={() => removeCertification(index)}
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
              {editingEntries.map((certification, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Certification Name & Issued By */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Certification Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={certification.name}
                          placeholder="Certification Name"
                          onChange={(e) => handleChange(editIndex, "name", e.target.value)}
                          onBlur={() => validateRequired("certification", globalIndex, { name: certification.name })}
                          maxLength={150}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors[`certification-${globalIndex}-name`] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
                        />
                        {errors[`certification-${globalIndex}-name`] && (
                          <span className="text-xs text-red-500">
                            {errors[`certification-${globalIndex}-name`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Issued By
                        </label>
                        <input
                          type="text"
                          value={certification.issuedBy}
                          placeholder="Organization Name"
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
                          value={certification.year}
                          placeholder="YYYY"
                          maxLength={4}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            handleChange(editIndex, "year", digits);
                            clearError("certification", globalIndex, "year");
                          }}
                          onBlur={() => {
                            const val = certification.year.trim();
                            if (!val) return;
                            if (!/^\d{4}$/.test(val)) {
                              setFieldError("certification", globalIndex, "year", "Year must be exactly 4 digits (e.g., 2024)");
                            } else {
                              clearError("certification", globalIndex, "year");
                            }
                          }}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 focus:outline-none ${errors[`certification-${globalIndex}-year`] ? "border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
                        />
                        {errors[`certification-${globalIndex}-year`] && (
                          <span className="text-xs text-red-500">
                            {errors[`certification-${globalIndex}-year`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Expiry Date <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        {isNeverExpiresValue(certification.expiryDate) ? (
                          <div className="w-full px-3 py-3.5 text-sm rounded-md text-black bg-[#faf9f8] border-b-2 border-transparent">
                            {NEVER_EXPIRES_LABEL}
                          </div>
                        ) : (
                          <MonthYearPicker
                            value={certification.expiryDate}
                            onChange={(val) => {
                              handleChange(editIndex, "expiryDate", val);
                              const issueYear = certification.year?.trim();
                              if (!val || !issueYear || !/^\d{4}$/.test(issueYear)) {
                                clearError("certification", globalIndex, "expiryDate");
                                return;
                              }
                              const issueYearNum = parseInt(issueYear, 10);
                              const expiryYear = 2000 + parseInt(val.split(/\s+/)[1], 10);
                              if (expiryYear < issueYearNum) {
                                setFieldError("certification", globalIndex, "expiryDate", `Expiry cannot be before issue year (${issueYear})`);
                              } else {
                                clearError("certification", globalIndex, "expiryDate");
                              }
                            }}
                            placeholder="MMM YY"
                            allowFutureDates
                          />
                        )}
                        {errors[`certification-${globalIndex}-expiryDate`] && (
                          <span className="text-xs text-red-500">
                            {errors[`certification-${globalIndex}-expiryDate`]}
                          </span>
                        )}
                        <label className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            checked={isNeverExpiresValue(certification.expiryDate)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleChange(editIndex, "expiryDate", checked ? NEVER_EXPIRES_LABEL : "");
                              clearError("certification", globalIndex, "expiryDate");
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-xs font-semibold text-gray-700">Never expires</span>
                        </label>
                      </div>
                    </div>

                    {/* Credential ID */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Credential ID <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={certification.credentialId || ""}
                          placeholder="Certificate or License Number"
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
                  onClick={addCertification}
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
                sectionKey="Certifications"
                entryContent={[editingEntries[0]?.name, editingEntries[0]?.issuedBy].filter(Boolean) as string[]}
                staticTips={
                  <div className="bg-[#faf9f8] rounded-lg p-5">
                    <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                    <div className="border-t border-gray-300 mb-3"></div>
                    <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                      <p>
                        Certifications validate your expertise and commitment to professional development. List relevant certifications that align with your career goals and industry standards.
                      </p>
                      <p>
                        Include the full certification name, issuing organization, and year obtained. Add credential IDs and expiry dates when applicable to verify authenticity and currency.
                      </p>
                      <p>
                        Prioritize recent and industry-recognized certifications that demonstrate your qualifications and keep your credentials current.
                      </p>
                      <p className="text-xs text-gray-500 italic mt-6">
                        *80% of hiring managers consider certifications when evaluating candidates.
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

export default Certifications;
