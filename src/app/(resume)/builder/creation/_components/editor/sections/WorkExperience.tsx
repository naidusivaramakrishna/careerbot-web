import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import SafeHTML from "@/components/common/SafeHTML";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
import MonthYearPicker from "../MonthYearPicker";
import AutocompleteInput from "../AutocompleteInput";
import { companies } from "../../../../../../../types/companies";
import { locations } from "../../../../../../../types/locations";
import { roles } from "../../../../../../../types/roles";
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
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import NibPenSparkleIcon from "../NibPenSparkleIcon";
import { deleteResumeSectionItem } from "@/api/resumeApi"; // ✅ Import the API
import logger from "@/lib/logger";

interface WorkEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  location: string;
  _id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyWork = (): WorkEntry => ({
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  description: "",
  location: "",
});

// Reusable Toolbar Button Component
interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, icon, isActive = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition ${
      isActive ? "text-[#2557a7] border border-[#2557a7] bg-blue-50" : "text-gray-400 hover:text-blue-600"
    }`}
    title={title}
  >
    {icon}
  </button>
);

const WorkExperience: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
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
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null); // ✅ NEW: Track deleting state

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: WorkEntry): boolean => {
    return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description || entry.location);
  };

  const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
    if (resumeData.workExperience && resumeData.workExperience.length) {
      const validEntries = resumeData.workExperience.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyWork()];
    }
    return [];
  });

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.workExperience) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, workExperience: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  const handleChange = <K extends keyof WorkEntry>(
    index: number,
    field: K,
    value: WorkEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("work", savedEntries.length + index, field as string);
  };

  const addWork = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyWork()]);

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyWork()]);

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };

  // ✅ UPDATED: Delete with API call
  const removeWork = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const workToDelete = savedEntries[index];
    const itemId = workToDelete._id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      logger.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("work", index);
      reindexErrors("work", index);
      return;
    }

    try {
      setDeletingIndex(index);
      logger.info("🗑️ Deleting work experience item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "workExperience", itemId);

      logger.info("✅ Work experience item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("work", index);
      reindexErrors("work", index);

    } catch (error) {
      logger.error("❌ Failed to delete work experience item:", error);
      alert("Failed to delete work experience. Please try again.");
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

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (el.childNodes.length > 0) {
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
    }, 0);
  };

  const exec = (idx: number, command: string, value?: string) => {
    const editor = editorRefs.current[idx];
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    
    setTimeout(() => {
      handleChange(idx, "description", editor.innerHTML || "");
    }, 0);
  };

  const onEditorInput = (idx: number) => {
    const el = editorRefs.current[idx];
    if (!el) return;
    handleChange(idx, "description", el.innerHTML || "");
  };

  function startToLabel(val: string) {
    if (!val) return "";
    const [y, m] = val.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(m, 10) - 1;
    return `${monthNames[mIdx]} ${y.slice(-2)}`;
  }

  const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
    if (!validateRequired("work", globalIndex, {
      company: work.company,
      role: work.role,
    })) return;

    const descBox = descriptionRefs.current[editIndex];
    const formContainer = formScrollRef.current;
    
    if (descBox && formContainer) {
      const descBoxTop = descBox.offsetTop;
      formContainer.scrollTo({
        top: descBoxTop - 50,
        behavior: "smooth"
      });
    }

    setShowTips(false);

    const prompt = `Generate 5 impactful unique(different) work experience description options for a resume based on the following details:

Role: ${work.role}
Company: ${work.company}

Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: led, managed, developed, designed, implemented, optimized, spearheaded, etc.)
- Focus on quantifiable achievements, measurable outcomes, and business impact
- Include metrics or scale (e.g., "increased revenue by 30%", "managed team of 15", "reduced costs by $50K")
- Emphasize leadership, technical skills, and problem-solving
- Use industry keywords relevant to ${work.role} for ATS optimization
- Avoid generic phrases like "worked on," "responsible for," or "helped with"
- Each description must be unique and focus on different aspects: leadership, technical achievement, business impact, process improvement, or team collaboration

Formatting rules:
- Return ONLY the 5 unique(different) descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
- Start each description directly with an action verb
- Separate descriptions with a blank line

Example format:
Led cross-functional team of 12 engineers to deliver enterprise SaaS platform, achieving 99.9% uptime and generating $2M ARR within first year

Optimized database queries and implemented caching strategy that reduced API response time by 65% and improved user satisfaction scores by 40%

Spearheaded migration of legacy monolithic application to microservices architecture, reducing deployment time from 2 hours to 15 minutes`;

    generateSuggestions(editIndex, prompt);
  };

  const handleSuggestionSelect = (editIndex: number, suggestion: string) => {
    const el = editorRefs.current[editIndex];
    if (el) {
      el.innerHTML = suggestion;
      handleChange(editIndex, "description", suggestion);
      
      setTimeout(() => {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (el.childNodes.length > 0) {
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
    
    setActivePopup(null);
    setShowTips(true);

    setTimeout(() => {
      if (formScrollRef.current) {
        formScrollRef.current.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  const toggleSpellCheck = (editIndex: number) => {
    const newState = !spellCheckEnabled;
    setSpellCheckEnabled(newState);
    const ed = editorRefs.current[editIndex];
    if (ed) ed.spellcheck = newState;
  };

  useEffect(() => {
    editingEntries.forEach((work, idx) => {
      const el = editorRefs.current[idx];
      if (el && work.description && el.innerHTML !== work.description) {
        el.innerHTML = work.description;
      }
    });
  }, [editingEntries]);

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((work, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {work.role || "No role"}
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    {work.company || "No company"}
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {work.startDate ? startToLabel(work.startDate) : ""} 
                    {work.startDate && " - "}
                    {work.currentlyWorking ? "Present" : (work.endDate ? startToLabel(work.endDate) : "")}
                  </div>
                  
                  {work.location && (
                    <div className="text-xs text-gray-600">
                      {work.location}
                    </div>
                  )}
                  
                  {work.description && (
                    <SafeHTML
                      content={work.description}
                      className="text-sm text-[#404040] mt-1 line-clamp-2"
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
                    onClick={() => removeWork(index)}
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
            className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
          >
            <div className="flex flex-col gap-3">
              {editingEntries.map((work, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Company & Role with Autocomplete */}
                    <div className="flex gap-4">
                      <AutocompleteInput
                        label="Company"
                        required
                        value={work.company}
                        onChange={(val) => handleChange(editIndex, "company", val)}
                        onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
                        placeholder="Company"
                        suggestions={companies}
                        error={errors[`work-${globalIndex}-company`]}
                      />

                      <AutocompleteInput
                        label="Role or job title"
                        required
                        value={work.role}
                        onChange={(val) => handleChange(editIndex, "role", val)}
                        onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
                        placeholder="Role"
                        suggestions={roles}
                        error={errors[`work-${globalIndex}-role`]}
                      />
                    </div>

                    {/* Dates and Location */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
                        <MonthYearPicker
                          value={work.startDate}
                          onChange={(val) => handleChange(editIndex, "startDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>

                      {!work.currentlyWorking && (
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
                          <MonthYearPicker
                            value={work.endDate}
                            onChange={(val) => handleChange(editIndex, "endDate", val)}
                            placeholder="MM/YY"
                          />
                        </div>
                      )}

                      <AutocompleteInput
                        label="Location"
                        value={work.location}
                        onChange={(val) => handleChange(editIndex, "location", val)}
                        placeholder="City, State"
                        suggestions={locations}
                      />
                    </div>

                    {/* Currently Working */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={work.currentlyWorking}
                        onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
                    </div>

                    {/* Description */}
                    <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">
                          Work description at {work.company || "the company"}
                        </label>
                        <button
                          type="button"
                          ref={(el) => {
                            buttonRefs.current[editIndex] = el;
                          }}
                          disabled={loadingIndex === editIndex}
                          onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
                          className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
                        >
                          <NibPenSparkleIcon className="w-4 h-4" />
                          {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
                        </button>
                      </div>

                      <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
                        {/* Toolbar with Reusable Buttons */}
                        <div className="flex items-center text-gray-400 gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
                          <ToolbarButton onClick={() => exec(editIndex, "bold")} title="Bold" icon={<FaBold />} />
                          <ToolbarButton onClick={() => exec(editIndex, "italic")} title="Italic" icon={<FaItalic />} />
                          <ToolbarButton onClick={() => exec(editIndex, "underline")} title="Underline" icon={<FaUnderline />} />
                          <ToolbarButton onClick={() => exec(editIndex, "insertUnorderedList")} title="Bullet List" icon={<FaListUl />} />
                          <ToolbarButton onClick={() => exec(editIndex, "insertOrderedList")} title="Numbered List" icon={<FaListOl />} />
                          <ToolbarButton onClick={() => exec(editIndex, "undo")} title="Undo" icon={<FaUndoAlt />} />
                          <ToolbarButton onClick={() => exec(editIndex, "redo")} title="Redo" icon={<FaRedoAlt />} />
                          <ToolbarButton onClick={() => toggleSpellCheck(editIndex)} title="Toggle Spellcheck" icon={<FaSpellCheck size={16} />} isActive={spellCheckEnabled} />
                        </div>

                        <div
                          ref={(el) => { editorRefs.current[editIndex] = el; }}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={() => onEditorInput(editIndex)}
                          className="w-full px-3 py-2 text-sm text-black min-h-[180px] focus:outline-none border-b-2 border-transparent focus:border-[#2557a7]"
                          spellCheck={spellCheckEnabled}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addWork}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          <div className="w-80 flex-shrink-0 sticky top-2">
            {showTips && activePopup === null ? (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.</p>
                  <p>Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.</p>
                </div>
              </div>
            ) : (
              activePopup !== null && suggestions[activePopup] && (
                <AISuggestions
                  options={suggestions[activePopup]}
                  onSelect={(s) => handleSuggestionSelect(activePopup, s)}
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

export default WorkExperience;

