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

interface MaritimeCertEntry {
  certificateType: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  rankLevel: string;
  verificationNumber: string;
  id?: string;
}

const emptyCert = (): MaritimeCertEntry => ({
  certificateType: "",
  issuingAuthority: "",
  issueDate: "",
  expiryDate: "",
  rankLevel: "",
  verificationNumber: "",
});

const MaritimeCertifications: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { validateRequired, clearError } = useValidation();

  const [showTips, setShowTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: MaritimeCertEntry): boolean => {
    return !!(entry.certificateType || entry.issuingAuthority);
  };

  const [savedEntries, setSavedEntries] = useState<MaritimeCertEntry[]>(() => {
    if (resumeData.maritimeCertifications && resumeData.maritimeCertifications.length) {
      const validEntries = resumeData.maritimeCertifications.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<MaritimeCertEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyCert()];
    }
    return [];
  });

  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Maritime Certifications") return;
      let allValid = true;
      editingEntries.forEach((cert, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("maritime_certifications", globalIndex, {
          certificateType: cert.certificateType,
          issuingAuthority: cert.issuingAuthority,
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
      const prevItems = (prev.maritimeCertifications ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.maritimeCertifications) === JSON.stringify(merged)) return prev;
      return { ...prev, maritimeCertifications: merged };
    });
  }, [savedEntries, editingEntries]);

  useEffect(() => {
    if (!resumeData.maritimeCertifications?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.maritimeCertifications!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.maritimeCertifications!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.maritimeCertifications![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
  }, [resumeData.maritimeCertifications]);

  const handleChange = <K extends keyof MaritimeCertEntry>(
    index: number,
    field: K,
    value: MaritimeCertEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("maritime_certifications", savedEntries.length + index, field as string);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyCert()]);
  };

  const removeCertification = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const certToDelete = savedEntries[index];
    const itemId = certToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "maritime_certifications", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "maritime_certifications", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);

    } catch (error) {
      toast.error("Failed to delete maritime certification. Please try again.");
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
            {savedEntries.map((cert, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {cert.certificateType || "Certificate"}
                  </div>

                  <div className="text-sm text-gray-700">
                    Issued by: {cert.issuingAuthority || "—"}
                  </div>

                  {cert.rankLevel && (
                    <div className="text-sm text-gray-600">
                      Rank Level: {cert.rankLevel}
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    Valid: {cert.issueDate || "—"} to {cert.expiryDate || "—"}
                  </div>

                  {cert.verificationNumber && (
                    <div className="text-xs text-gray-500">
                      Cert #: {cert.verificationNumber}
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
                    onClick={() => removeCertification(index)}
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
              <LuPlus size={16} /> Add Maritime Certification
            </button>
          )}
        </div>
      )}

      {/* Edit/Add Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          <div ref={formScrollRef} className="flex-1 mt-6 pr-2">
            <div className="flex flex-col gap-3">
          {editingEntries.map((cert, editIndex) => (
              <div key={editIndex} className="flex flex-col gap-3 pb-4">
                {/* Certificate Type & Issuing Authority */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Certificate Type <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g., STCW, ECDIS, Radar, ARPA"
                      value={cert.certificateType}
                      onChange={(e) => handleChange(editIndex, 'certificateType', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Issuing Authority <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g., Maritime Administration"
                      value={cert.issuingAuthority}
                      onChange={(e) => handleChange(editIndex, 'issuingAuthority', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Issue Date & Expiry Date */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Issue Date</label>
                    <input
                      type="text"
                      placeholder="e.g., Jan 2020"
                      value={cert.issueDate}
                      onChange={(e) => handleChange(editIndex, 'issueDate', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="e.g., Jan 2025 or Permanent"
                      value={cert.expiryDate}
                      onChange={(e) => handleChange(editIndex, 'expiryDate', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Rank Level & Verification Number */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Rank Level</label>
                    <input
                      type="text"
                      placeholder="e.g., Master, Chief Officer, Officer"
                      value={cert.rankLevel}
                      onChange={(e) => handleChange(editIndex, 'rankLevel', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 border-transparent focus:border-[#2557a7] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Verification Number</label>
                    <input
                      type="text"
                      placeholder="e.g., Certificate number"
                      value={cert.verificationNumber}
                      onChange={(e) => handleChange(editIndex, 'verificationNumber', e.target.value)}
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
                  <p>Add all maritime certifications including STCW, ECDIS, Radar, and specialized qualifications.</p>
                  <p>Include issue date, expiry date (or &quot;Permanent&quot; if applicable), and the issuing authority.</p>
                  <p>Specify the rank level the certificate applies to and any verification or certificate numbers.</p>
                  <p>Example: STCW Class A | IMO | Issued: Jan 2020 | Expires: Jan 2025 | Master Level | Cert: MC-2020-001</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};

export default MaritimeCertifications;
