import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
import { toast } from "sonner";
import SectionTipsPanel from "../SectionTipsPanel";
import AutocompleteInput from "../AutocompleteInput";
import { Trash2, ArrowLeft } from 'lucide-react';
import { RiEdit2Fill } from 'react-icons/ri';
import { LuPlus } from 'react-icons/lu';
import NibPenSparkleIcon from "../NibPenSparkleIcon";
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { deleteSectionItemFromEnhancedResume } from "@/api/enhancerApi";
import { useSearchParams } from "next/navigation";

interface ServiceRecordEntry {
  service: string;
  batch: string;
  serviceNumber: string;
  currentDesignation: string;
  currentPosting: string;
  totalServiceDuration: string;
  careerProgression: string;
  status: string;
  id?: string;
}

const emptyServiceRecord = (): ServiceRecordEntry => ({
  service: "",
  batch: "",
  serviceNumber: "",
  currentDesignation: "",
  currentPosting: "",
  totalServiceDuration: "",
  careerProgression: "",
  status: "",
});

const SERVICE_SUGGESTIONS = [
  "IAS (Indian Administrative Service)",
  "IPS (Indian Police Service)",
  "IFS (Indian Forest Service)",
  "Indian Army",
  "Indian Navy",
  "Indian Air Force",
  "Central Police Forces",
  "State Police Service",
  "Defense Service",
];

const BATCH_SUGGESTIONS = [
  "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016",
  "2015", "2014", "2013", "2012", "2011", "2010", "2009", "2008", "2007",
];

const ServiceRecord: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const {
    loadingIndex,
    suggestions,
    activePopup,
    setActivePopup,
    generateSuggestions,
  } = useAISuggestions();

  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  } = useValidation();

  const [showTips, setShowTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [editingOriginalIndex, setEditingOriginalIndex] = useState<number | null>(null);
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<ServiceRecordEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const progressionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const hasValidData = (entry: ServiceRecordEntry): boolean => {
    return !!(
      entry.service ||
      entry.batch ||
      entry.serviceNumber ||
      entry.currentDesignation ||
      entry.currentPosting ||
      entry.totalServiceDuration
    );
  };

  const [savedEntries, setSavedEntries] = useState<ServiceRecordEntry[]>(() => {
    if (resumeData.serviceRecord && resumeData.serviceRecord.length) {
      const validEntries = resumeData.serviceRecord.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<ServiceRecordEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyServiceRecord()];
    }
    return [];
  });

  // Debug logging
  useEffect(() => {
    console.warn("🔍 ServiceRecord State:", {
      savedEntriesCount: savedEntries.length,
      editingEntriesCount: editingEntries.length,
      resumeDataServiceRecord: resumeData.serviceRecord?.length,
      savedEntries,
    });
  }, [savedEntries, editingEntries, resumeData.serviceRecord]);

  // Validate on save
  useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Service Record") return;
      let allValid = true;
      editingEntries.forEach((record, editIndex) => {
        const globalIndex = savedEntries.length + editIndex;
        const isValid = validateRequired("service_record", globalIndex, {
          service: record.service,
          batch: record.batch,
        });
        if (!isValid) allValid = false;
      });
      e.detail.resultRef.valid = allValid;
    };
    window.addEventListener("resume-validate-section", handleValidateSave as EventListener);
    return () => window.removeEventListener("resume-validate-section", handleValidateSave as EventListener);
  }, [editingEntries, savedEntries, validateRequired]);

  // Sync to resume context
  useEffect(() => {
    const validEntries = [
      ...savedEntries,
      ...editingEntries.filter(hasValidData)
    ];
    setResumeData(prev => {
      const prevItems = (prev.serviceRecord ?? []) as Array<Record<string, unknown>>;
      const merged = validEntries.map((entry, idx) => {
        if ((entry as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.serviceRecord) === JSON.stringify(merged)) return prev;
      return { ...prev, serviceRecord: merged };
    });
  }, [savedEntries, editingEntries, setResumeData]);

  useEffect(() => {
    if (!resumeData.serviceRecord?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.serviceRecord!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;

      // Sync IDs from resumeData to savedEntries when backend assigns IDs after auto-save
      // Match entries by comparing field values (not just by index) to handle reordering
      if (prev.length === resumeData.serviceRecord!.length) {
        let changed = false;
        const updated = prev.map((entry) => {
          // If entry already has an ID, keep it
          if (entry.id) return entry;

          // Find matching entry in resumeData by comparing key fields
          const matchingBackendEntry = resumeData.serviceRecord!.find(backend =>
            backend.service === entry.service &&
            backend.batch === entry.batch &&
            backend.serviceNumber === entry.serviceNumber
          );

          if (matchingBackendEntry?.id) {
            changed = true;
            return { ...entry, id: matchingBackendEntry.id };
          }
          return entry;
        });
        return changed ? updated : prev;
      }

      return prev;
    });
  }, [resumeData.serviceRecord, editingEntries]);

  const handleChange = <K extends keyof ServiceRecordEntry>(
    index: number,
    field: K,
    value: ServiceRecordEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("service_record", savedEntries.length + index, field as string);
  };

  const addRecord = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length === 0) {
      toast.error("Please fill in at least Service, Batch, or Designation");
      return;
    }

    if (editingOriginalIndex !== null && editingOriginalEntry !== null) {
      const editedEntry = { ...validEditingEntries[0], id: editingOriginalEntry.id };
      setSavedEntries((prev) => {
        const updated = [...prev];
        updated.splice(editingOriginalIndex, 0, editedEntry);
        return updated;
      });
      setEditingOriginalIndex(null);
      setEditingOriginalEntry(null);
    } else {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([]);
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyServiceRecord()]);
  };

  const removeRecord = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const recordToDelete = savedEntries[index];
    const itemId = recordToDelete.id;

    if (!resumeId || !itemId) {
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("service_record", index);
      reindexErrors("service_record", index);
      return;
    }

    try {
      setDeletingIndex(index);

      if (isEnhancedResume) {
        await deleteSectionItemFromEnhancedResume(resumeId, "service_record", itemId);
      } else {
        await deleteResumeSectionItem(resumeId, "service_record", itemId);
      }

      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("service_record", index);
      reindexErrors("service_record", index);

    } catch (error) {
      toast.error("Failed to delete service record. Please try again.");
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

  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";
    const textOnly = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!textOnly) return "";
    return html
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  const onProgressionInput = (idx: number) => {
    const el = progressionRefs.current[idx];
    if (!el) return;
    const content = cleanHtmlContent(el.innerHTML);
    handleChange(idx, "careerProgression", content);
  };

  const handleAIWriterClick = (editIndex: number, globalIndex: number, record: ServiceRecordEntry) => {
    if (!validateRequired("service_record", globalIndex, {
      service: record.service,
      batch: record.batch,
    })) return;

    const progressionBox = progressionRefs.current[editIndex];
    const formContainer = formScrollRef.current;

    if (progressionBox && formContainer) {
      const boxTop = progressionBox.offsetTop;
      formContainer.scrollTo({
        top: boxTop - 50,
        behavior: "smooth"
      });
    }

    setShowTips(false);

    const prompt = `Generate 5 impactful career progression narratives for a government/civil service officer with the following details:

Service: ${record.service}
Batch: ${record.batch}
Current Designation: ${record.currentDesignation}
Total Service: ${record.totalServiceDuration}

Requirements for each progression narrative:
- Length: 2-4 lines maximum
- Start with career path overview (e.g., "Field Officer → Additional Deputy Commissioner → Joint Commissioner")
- Include key progression milestones with ranks/designations
- Highlight career evolution from entry-level to current position
- Emphasize increasing responsibility and organizational scope
- Use official government terminology

Formatting rules:
- Return ONLY the 5 unique progression narratives
- Each narrative on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
- Separate narratives with a blank line
- Start directly with the career path`;

    generateSuggestions(editIndex, prompt);
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
                    {record.service || "Service"}
                  </div>

                  <div className="text-sm text-gray-700">
                    Batch {record.batch || "—"} • {record.currentDesignation || "—"}
                  </div>

                  <div className="text-xs text-gray-600">
                    Service Number: {record.serviceNumber || "—"}
                  </div>

                  <div className="text-xs text-gray-600">
                    Total Service: {record.totalServiceDuration || "—"}
                  </div>

                  {record.currentPosting && (
                    <div className="text-xs text-gray-600 mt-1">
                      Current Posting: {record.currentPosting}
                    </div>
                  )}

                  {record.careerProgression && (
                    <div
                      className="text-sm text-[#404040] mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: record.careerProgression }}
                    />
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
                    onClick={() => removeRecord(index)}
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

      {/* Debug: Show state when nothing is rendered */}
      {savedEntries.length === 0 && editingEntries.length === 0 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">No entries. Click "Add" to create one.</p>
        </div>
      )}

      {/* Editing Form */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
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
              {editingEntries.map((record, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Service & Batch */}
                    <div className="flex gap-4">
                      <AutocompleteInput
                        label="Service (IAS, IPS, Defence, etc.)"
                        required
                        value={record.service}
                        onChange={(val) => handleChange(editIndex, "service", val)}
                        onBlur={() => validateRequired("service_record", globalIndex, { service: record.service })}
                        placeholder="e.g., IAS, IPS, Indian Army"
                        suggestions={SERVICE_SUGGESTIONS}
                        error={errors[`service_record-${globalIndex}-service`]}
                        className={errors[`service_record-${globalIndex}-service`] ? "border-red-500" : ""}
                        maxLength={100}
                      />

                      <AutocompleteInput
                        label="Batch/Commission Year"
                        required
                        value={record.batch}
                        onChange={(val) => handleChange(editIndex, "batch", val)}
                        onBlur={() => validateRequired("service_record", globalIndex, { batch: record.batch })}
                        placeholder="e.g., 2016, 2020"
                        suggestions={BATCH_SUGGESTIONS}
                        error={errors[`service_record-${globalIndex}-batch`]}
                        className={errors[`service_record-${globalIndex}-batch`] ? "border-red-500" : ""}
                        maxLength={4}
                      />
                    </div>

                    {/* Service Number & Current Designation */}
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Service Number (e.g., IAS-2016-00234)"
                        value={record.serviceNumber}
                        onChange={(e) => handleChange(editIndex, "serviceNumber", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        maxLength={50}
                      />

                      <input
                        type="text"
                        placeholder="Current Designation (e.g., Joint Commissioner)"
                        value={record.currentDesignation}
                        onChange={(e) => handleChange(editIndex, "currentDesignation", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        maxLength={100}
                      />
                    </div>

                    {/* Current Posting & Total Service Duration */}
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Current Posting (e.g., Mumbai District Administration)"
                        value={record.currentPosting}
                        onChange={(e) => handleChange(editIndex, "currentPosting", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        maxLength={100}
                      />

                      <input
                        type="text"
                        placeholder="Total Service Duration (e.g., 8 years)"
                        value={record.totalServiceDuration}
                        onChange={(e) => handleChange(editIndex, "totalServiceDuration", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        maxLength={50}
                      />
                    </div>

                    {/* Status */}
                    <div className="flex gap-4">
                      <select
                        value={record.status}
                        onChange={(e) => handleChange(editIndex, "status", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Retired">Retired</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Deputation">Deputation</option>
                      </select>
                    </div>

                    {/* Career Progression */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">
                          Career Progression
                        </label>
                        <button
                          type="button"
                          disabled={loadingIndex === editIndex}
                          onClick={() => handleAIWriterClick(editIndex, globalIndex, record)}
                          className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
                        >
                          <NibPenSparkleIcon className="w-4 h-4" />
                          {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
                        </button>
                      </div>

                      <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
                        <div className="relative">
                          {!record.careerProgression?.replace(/<[^>]+>/g, '').trim() && (
                            <div className="absolute top-2 left-3 text-xs text-gray-400 pointer-events-none leading-5 z-10">
                              <div>e.g. &quot;Field Officer → Additional Deputy Commissioner → Joint Commissioner&quot;</div>
                            </div>
                          )}
                          <div
                            ref={(el) => { progressionRefs.current[editIndex] = el; }}
                            contentEditable
                            suppressContentEditableWarning
                            lang="en"
                            onInput={() => onProgressionInput(editIndex)}
                            className="w-full px-3 py-2 text-sm text-black min-h-32 focus:outline-none border-b-2 border-transparent focus:border-[#2557a7]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addRecord}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Save Record
                </button>
              </div>
            </div>
          </div>

          <div className="w-80 shrink-0 sticky top-2">
            {showTips && activePopup === null ? (
              <SectionTipsPanel
                sectionKey="ServiceRecord"
                entryContent={[
                  editingEntries[0]?.service,
                  editingEntries[0]?.batch,
                  editingEntries[0]?.currentDesignation,
                  editingEntries[0]?.careerProgression?.slice(0, 60),
                ].filter(Boolean) as string[]}
                staticTips={
                  <div className="bg-[#faf9f8] rounded-lg p-5">
                    <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                    <div className="border-t border-gray-300 mb-3"></div>
                    <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                      <p>Include your complete service history with ranks and designations you&apos;ve held.</p>
                      <p>Career progression shows your growth trajectory within the government service. Include promotions and key milestones.</p>
                      <p>Service number is an official identifier that verifies your government service record.</p>
                    </div>
                  </div>
                }
              />
            ) : (
              activePopup !== null && suggestions[activePopup] && (
                <AISuggestions
                  options={suggestions[activePopup]}
                  onSelect={(s) => {
                    const el = progressionRefs.current[activePopup];
                    if (el) {
                      el.innerHTML = (el.innerHTML || "") + (el.innerHTML ? "\n\n" : "") + s;
                      onProgressionInput(activePopup);
                      el.focus();
                    }
                  }}
                  onClose={() => {
                    setActivePopup(null);
                    setShowTips(true);
                  }}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRecord;
