"use client";

import { sanitizeHtml } from "@/lib/sanitizeHtml";
import React, { useRef, useState, useEffect } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2, ArrowLeft } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi";
import { deleteSectionItemFromEnhancedResume } from "@/api/enhancerApi";
import { useSearchParams } from "next/navigation";
import SectionTipsPanel from "../SectionTipsPanel";
import { toast } from "sonner";
import {
  FaSpellCheck,
  FaListUl,
  FaListOl,
  FaBold,
  FaItalic,
  FaUnderline,
  FaUndoAlt,
  FaRedoAlt,
} from "react-icons/fa";

interface PatentEntry {
  title: string;
  patentNumber: string;
  status: string;
  date: string;
  description?: string;
  id?: string;
}

const emptyPatent = (): PatentEntry => ({
  title: "",
  patentNumber: "",
  status: "",
  date: "",
  description: "",
});

const STATUS_OPTIONS = ["Filed", "Pending", "Published", "Granted"];

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, icon, isActive = false }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition ${isActive ? "text-[#2557a7] border border-[#2557a7] bg-blue-50" : "text-gray-400 hover:text-blue-600"
      }`}
    title={title}
  >
    {icon}
  </button>
);

const Patents: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } = useValidation();
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [editingOriginalIndex, setEditingOriginalIndex] = useState<number | null>(null);
  const [editingOriginalEntry, setEditingOriginalEntry] = useState<PatentEntry | null>(null);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [bulletWarnings, setBulletWarnings] = useState<Record<number, string>>({});
  const formScrollRef = useRef<HTMLDivElement>(null);
  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const descriptionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const hasValidData = (entry: PatentEntry): boolean => !!(entry.title);

  const [savedEntries, setSavedEntries] = useState<PatentEntry[]>(() =>
    (resumeData.patents || []).filter(hasValidData)
  );

  const [editingEntries, setEditingEntries] = useState<PatentEntry[]>(() =>
    savedEntries.length === 0 ? [emptyPatent()] : []
  );

  // Validate editing entries when EditorTab's Save button fires the event.
  React.useEffect(() => {
    type ValidateEvent = CustomEvent<{ section: string; resultRef: { valid: boolean } }>;
    const handleValidateSave = (e: ValidateEvent) => {
      if (e.detail.section !== "Patents") return;
      let allValid = true;
      editingEntries.forEach((patent) => {
        const isValid = validateRequired("patents", 0, { title: patent.title });
        if (!isValid) allValid = false;
      });
      e.detail.resultRef.valid = allValid;
    };
    window.addEventListener("resume-validate-section", handleValidateSave as EventListener);
    return () => window.removeEventListener("resume-validate-section", handleValidateSave as EventListener);
  }, [editingEntries, savedEntries, validateRequired]);

  // Listen for resume-open-entry event to allow editing from ATS Score tab
  // Note: editEntry will be defined by the time this runs, but we omit it from deps
  // to avoid recreating the listener on every render (editEntry changes with savedEntries)
  React.useEffect(() => {
    type OpenEntryEvent = CustomEvent<{ section: string; entryIndex: number }>;
    const handleOpenEntry = (e: OpenEntryEvent) => {
      if (e.detail.section !== "Patents") return;
      const idx = e.detail.entryIndex;
      if (idx >= 0 && idx < savedEntries.length) {
        // Access via ref to latest savedEntries and handlers
        setEditingOriginalIndex(idx);
        setEditingOriginalEntry(savedEntries[idx]);
        const updated = [...savedEntries];
        updated.splice(idx, 1);
        setSavedEntries(updated);
        setEditingEntries([savedEntries[idx]]);
        formScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener("resume-open-entry", handleOpenEntry as EventListener);
    return () => window.removeEventListener("resume-open-entry", handleOpenEntry as EventListener);
  }, [savedEntries]);

  // Rehydrate savedEntries from resumeData when context updates (e.g. from backend sync)
  React.useEffect(() => {
    if (!resumeData.patents?.length) return;
    setSavedEntries(prev => {
      if (prev.length === 0 && editingEntries.every(e => !hasValidData(e))) {
        setEditingEntries([]);
        return resumeData.patents!.filter(hasValidData);
      }
      if (editingEntries.length > 0) return prev;
      if (prev.length !== resumeData.patents!.length) return prev;
      let changed = false;
      const updated = prev.map((entry, idx) => {
        const backendId = resumeData.patents![idx]?.id;
        if (backendId && !entry.id) { changed = true; return { ...entry, id: backendId }; }
        return entry;
      });
      return changed ? updated : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.patents]);

  // Sync both saved + valid editing entries so a filled-but-not-yet-added entry
  // is included when the main Save button is clicked without clicking "+ Add Additional".
  React.useEffect(() => {
    let allEntries: PatentEntry[];
    if (editingOriginalIndex !== null && editingEntries.filter(hasValidData).length > 0) {
      // When editing an existing entry, reconstruct the full list with edits spliced back at original index
      const validEditing = editingEntries.filter(hasValidData);
      allEntries = [...savedEntries];
      allEntries.splice(editingOriginalIndex, 0, ...validEditing);
    } else {
      // When adding new entries, just append them
      allEntries = [...savedEntries, ...editingEntries.filter(hasValidData)];
    }
    setResumeData(prev => {
      const prevItems = (prev.patents ?? []) as Array<Record<string, unknown>>;
      const merged = allEntries.map((entry, idx) => {
        if ((entry as unknown as Record<string, unknown>).id) return entry;
        const prevId = prevItems[idx]?.id as string | undefined;
        return prevId ? { ...entry, id: prevId } : entry;
      });
      if (JSON.stringify(prev.patents) === JSON.stringify(merged)) return prev;
      return { ...prev, patents: merged };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries, editingOriginalIndex]);

  const handleChange = (field: keyof PatentEntry, value: string) => {
    setEditingEntries(prev => [{ ...prev[0], [field]: value }]);
    clearError("patents", 0, field as string);
  };

  const checkBulletQuality = (html: string): string => {
    const withBreaks = html.replace(/<\/(li|div|p)>|<br\s*\/?>/gi, '\n');
    const plain = withBreaks.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
    const lines = plain.split(/[\n\r]/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^I\s+/i.test(line))
        return 'Avoid starting bullets with "I" — use action verbs instead';
      if (/^responsible for/i.test(line))
        return 'Avoid "Responsible for" — state what you achieved instead';
    }
    return '';
  };

  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";
    const textOnly = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!textOnly) return "";

    // Normalize line breaks: Convert <div>, <p>, and <br> to consistent format
    let normalized = html
      .replace(/(<div>|<p>)/gi, "")  // Remove opening tags
      .replace(/(<\/div>|<\/p>|<br\s*\/?>\s*)/gi, "\n")  // Replace closing tags and br with newline
      .replace(/&nbsp;/g, " ")  // Replace non-breaking spaces
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, "")  // Remove trailing br tags
      .trim();

    // Clean up multiple consecutive newlines to single newlines
    normalized = normalized.replace(/\n\s*\n/g, "\n");

    return normalized;
  };

  const exec = (command: string, value?: string) => {
    const editor = editorRefs.current[0];
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, value);

    setTimeout(() => {
      const content = cleanHtmlContent(editor.innerHTML);
      handleChange("description", content);
    }, 0);
  };

  const onEditorInput = () => {
    const el = editorRefs.current[0];
    if (!el) return;
    const content = cleanHtmlContent(el.innerHTML);
    handleChange("description", content);
    const warning = checkBulletQuality(content);
    setBulletWarnings(prev => ({ ...prev, 0: warning }));
  };

  const toggleSpellCheck = () => {
    const newState = !spellCheckEnabled;
    setSpellCheckEnabled(newState);
    const ed = editorRefs.current[0];
    if (ed) ed.spellcheck = newState;
  };

  useEffect(() => {
    const el = editorRefs.current[0];
    if (el && editingEntries[0]?.description) {
      // Sanitize before injecting: this is stored content and .innerHTML is a
      // live HTML sink. cleanHtmlContent() only strips div/p/br/&nbsp; -- every
      // other tag and every event-handler attribute survives it. sanitizeHtml
      // is the shared DOMPurify allowlist already used by <SafeHTML>.
      const safeDescription = sanitizeHtml(editingEntries[0].description ?? "");
      if (document.activeElement !== el && el.innerHTML !== safeDescription) {
        el.innerHTML = safeDescription;
      }
    }
  }, [editingEntries]);

  const handleSave = () => {
    const valid = editingEntries.filter(hasValidData);
    if (valid.length === 0) {
      validateRequired("patents", 0, { title: "" });
      return;
    }
    setSavedEntries(prev => {
      if (editingOriginalIndex !== null) {
        // Replace the entry at its original index (it was removed before editing)
        const updated = [...prev];
        updated.splice(editingOriginalIndex, 0, { ...valid[0], id: editingOriginalEntry?.id });
        return updated;
      }
      return [...prev, ...valid];
    });
    setEditingEntries([]);
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    clearSectionIndexErrors("patents", 0);
  };

  const editEntry = (index: number) => {
    setEditingOriginalIndex(index);
    setEditingOriginalEntry(savedEntries[index]);
    const updated = [...savedEntries];
    updated.splice(index, 1);
    setSavedEntries(updated);
    setEditingEntries([savedEntries[index]]);
    formScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleDelete = async (index: number) => {
    const entry = savedEntries[index];
    const resumeId = localStorage.getItem("current_resume_id");
    try {
      setDeletingIndex(index);
      if (resumeId && entry.id) {
        if (isEnhancedResume) {
          await deleteSectionItemFromEnhancedResume(resumeId, 'patents', entry.id);
        } else {
          await deleteResumeSectionItem(resumeId, 'patents', entry.id);
        }
      }
      const updated = savedEntries.filter((_, i) => i !== index);
      setSavedEntries(updated);
      clearSectionIndexErrors("patents", index);
      reindexErrors("patents", index);
    } catch {
      toast.error("Failed to delete patent. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  const addNewEntry = () => {
    setEditingOriginalIndex(null);
    setEditingOriginalEntry(null);
    setEditingEntries([emptyPatent()]);
  };

  const isEditing = editingEntries.length > 0;

  return (
    <div className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved entries */}
      {savedEntries.length > 0 && !isEditing && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((entry, index) => (
              <div key={entry.id || index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">{entry.title}</div>
                  {(entry.patentNumber || entry.status) && (
                    <div className="text-xs text-gray-600">
                      {[entry.patentNumber, entry.status].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {entry.date && (
                    <div className="text-sm text-[#2557a7]">{entry.date}</div>
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
                    onClick={() => handleDelete(index)}
                    disabled={deletingIndex === index}
                    className={`p-2 text-xs hover:bg-[#e5e5e5] rounded-full ${deletingIndex === index ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Trash2 size={20} className={`text-[#595959] hover:text-red-500 ${deletingIndex === index ? "animate-pulse" : ""}`} />
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
              <LuPlus size={20} className="text-[#595959] group-hover:text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <div className="flex gap-6 items-start">
          <div ref={formScrollRef} className="flex-1 mt-6 pr-2">
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

              <div className="flex flex-col gap-3 pb-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#3b3b3b]">
                    Patent Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingEntries[0].title}
                    placeholder="e.g., System and Method for..."
                    onChange={e => handleChange('title', e.target.value)}
                    onBlur={() => validateRequired("patents", 0, { title: editingEntries[0].title })}
                    maxLength={200}
                    className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-2 focus:outline-none ${errors['patents-0-title'] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-blue-500"}`}
                  />
                  {errors['patents-0-title'] && <span className="text-xs text-red-500">{errors['patents-0-title']}</span>}
                </div>

                {/* Patent Number + Status */}
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Patent Number</label>
                    <input
                      type="text"
                      value={editingEntries[0].patentNumber}
                      placeholder="e.g., US10,234,567"
                      onChange={e => handleChange('patentNumber', e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-sm font-semibold text-[#3b3b3b]">Status</label>
                    <select
                      value={editingEntries[0].status}
                      onChange={e => handleChange('status', e.target.value)}
                      className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select status</option>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#3b3b3b]">Date</label>
                  <input
                    type="text"
                    value={editingEntries[0].date}
                    placeholder="e.g., Jan 2023"
                    onChange={e => handleChange('date', e.target.value)}
                    maxLength={30}
                    className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div ref={(el) => { descriptionRefs.current[0] = el; }} className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#3b3b3b]">Description <span className="text-gray-400 font-normal">(optional)</span></label>

                  <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center text-gray-400 gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
                      <ToolbarButton onClick={() => exec("bold")} title="Bold" icon={<FaBold />} />
                      <ToolbarButton onClick={() => exec("italic")} title="Italic" icon={<FaItalic />} />
                      <ToolbarButton onClick={() => exec("underline")} title="Underline" icon={<FaUnderline />} />
                      <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet List" icon={<FaListUl />} />
                      <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered List" icon={<FaListOl />} />
                      <ToolbarButton onClick={() => exec("undo")} title="Undo" icon={<FaUndoAlt />} />
                      <ToolbarButton onClick={() => exec("redo")} title="Redo" icon={<FaRedoAlt />} />
                      <ToolbarButton onClick={() => toggleSpellCheck()} title="Toggle Spellcheck" icon={<FaSpellCheck size={16} />} isActive={spellCheckEnabled} />
                    </div>

                    <div className="relative">
                      {!editingEntries[0].description?.replace(/<[^>]+>/g, '').trim() && (
                        <div className="absolute top-2 left-3 text-xs text-gray-400 pointer-events-none leading-5 z-10">
                          <div>• Brief description of the patent</div>
                          <div>• Include co-inventors if applicable</div>
                        </div>
                      )}
                      <div
                        ref={(el) => { editorRefs.current[0] = el; }}
                        contentEditable
                        suppressContentEditableWarning
                        lang="en"
                        onInput={() => onEditorInput()}
                        className="w-full px-3 py-2 text-sm text-black min-h-32 focus:outline-none border-b-2 border-transparent focus:border-[#2557a7] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                        spellCheck={spellCheckEnabled}
                      />
                    </div>
                  </div>
                  {bulletWarnings[0] && (
                    <div className="flex items-start gap-2 mt-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                      <span className="mt-0.5">⚠</span>
                      <span>{bulletWarnings[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          <div className="w-80 shrink-0 sticky top-2">
            <SectionTipsPanel
              sectionKey="Patents"
              staticTips={
                <div className="bg-[#faf9f8] rounded-lg p-5">
                  <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                  <div className="border-t border-gray-300 mb-3"></div>
                  <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                    <p>
                      Include patents you have filed, are pending, published, or have been granted. Patents demonstrate technical innovation and are highly valued in engineering roles.
                    </p>
                    <p>
                      Add the patent number once granted. List co-inventors in the description if applicable.
                    </p>
                    <p className="text-xs text-gray-500 italic mt-6">
                      *Granted patents carry significantly more weight than filed ones on a resume.
                    </p>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Patents;
