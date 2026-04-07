import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import SafeHTML from "@/components/common/SafeHTML";
import { setSafeInnerHTML } from "@/lib/setSafeInnerHTML";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
import MonthYearPicker from "../MonthYearPicker";
import TechnologyChipsInput from "../TechnologyChipsInput";
import { technologies } from "../../../../../../../types/technologies";
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

interface ProjectEntry {
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  link: string;
  _id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyProject = (): ProjectEntry => ({
  title: "",
  description: "",
  technologies: [],
  startDate: "",
  endDate: "",
  link: "",
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

const Projects: React.FC = () => {
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

  const hasValidData = (entry: ProjectEntry): boolean => {
    return !!(
      entry.title ||
      entry.description ||
      entry.technologies.length > 0 ||
      entry.startDate ||
      entry.endDate
    );
  };

  const [savedEntries, setSavedEntries] = useState<ProjectEntry[]>(() => {
    if (resumeData.projects && resumeData.projects.length) {
      const validEntries = resumeData.projects.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<ProjectEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyProject()];
    }
    return [];
  });

  // ✅ Sync technologies to skills whenever projects change
  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.projects) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, projects: allEntries });
    }

    // Extract all unique technologies from all projects
    const allTechnologies = allEntries.flatMap(entry => entry.technologies);
    const uniqueTechnologies = Array.from(new Set(allTechnologies));

    // Merge with existing skills (keep existing skills that aren't from projects)
    const currentSkills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
    const mergedSkills = Array.from(new Set([...currentSkills, ...uniqueTechnologies]));

    // Only update if there's a change to avoid infinite loops
    if (JSON.stringify(currentSkills.sort()) !== JSON.stringify(mergedSkills.sort())) {
      setResumeData({ ...resumeData, projects: allEntries, skills: mergedSkills });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  const handleChange = <K extends keyof ProjectEntry>(
    index: number,
    field: K,
    value: ProjectEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("project", savedEntries.length + index, field as string);
  };

  const addProject = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyProject()]);

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyProject()]);

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };

  // ✅ UPDATED: Delete with API call
  const removeProject = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const projectToDelete = savedEntries[index];
    const itemId = projectToDelete._id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      logger.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("project", index);
      reindexErrors("project", index);
      return;
    }

    try {
      setDeletingIndex(index);
      logger.info("🗑️ Deleting project item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "projects", itemId);

      logger.info("✅ Project item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("project", index);
      reindexErrors("project", index);

    } catch (error) {
      logger.error("❌ Failed to delete project item:", error);
      alert("Failed to delete project. Please try again.");
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

  const handleAIWriterClick = (editIndex: number, globalIndex: number, project: ProjectEntry) => {
    if (!validateRequired("project", globalIndex, {
      title: project.title,
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

    const prompt = `Generate 5 impactful unique(different) project description options for a resume based on the following details:

Project Title: ${project.title}
Technologies Used: ${project.technologies}

Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: built, developed, engineered, designed, created, implemented, architected, deployed, etc.)
- Highlight the project's purpose, key features, and measurable impact or results
- Include specific technical implementations using the technologies mentioned: ${project.technologies}
- Emphasize quantifiable outcomes (e.g., "improved performance by 50%", "serving 10K+ users", "reduced processing time by 3 seconds")
- Showcase problem-solving, innovation, or technical complexity
- Use technical keywords relevant to the tech stack for ATS optimization
- Avoid generic phrases like "worked on," "created a project," or "made an application"
- Each description must be unique and focus on different aspects: technical architecture, user impact, or performance/scalability

Formatting rules:
- Return ONLY the 5 unique(different) descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
- Start each description directly with an action verb
- Separate descriptions with a blank line

Example format:
Built a full-stack e-commerce platform using React, Node.js, and MongoDB that handles 50K+ monthly transactions with 99.9% uptime and integrated Stripe payment processing

Developed real-time chat application with WebSocket connections supporting 1000+ concurrent users, implementing Redis caching to reduce latency by 60%

Engineered machine learning recommendation system using Python and TensorFlow that increased user engagement by 35% and generated 20% more revenue through personalized suggestions`;

    generateSuggestions(editIndex, prompt);
  };

  const handleSuggestionSelect = (editIndex: number, suggestion: string) => {
    const el = editorRefs.current[editIndex];
    if (el) {
      setSafeInnerHTML(el, suggestion);
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
    editingEntries.forEach((project, idx) => {
      const el = editorRefs.current[idx];
      if (el && project.description && el.innerHTML !== project.description) {
        setSafeInnerHTML(el, project.description);
      }
    });
  }, [editingEntries]);

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((project, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {project.title || "No title"}
                  </div>
                  
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="inline-flex items-center bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-600">
                    {project.startDate ? startToLabel(project.startDate) : ""} 
                    {project.startDate && project.endDate && " - "}
                    {project.endDate ? startToLabel(project.endDate) : ""}
                  </div>
                  
                  {project.link && (
                    <div className="text-xs text-blue-600 hover:underline">
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        {project.link}
                      </a>
                    </div>
                  )}
                  
                  {project.description && (
                    <SafeHTML
                      content={project.description}
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
                    onClick={() => removeProject(index)}
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
            className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2"
          >
            <div className="flex flex-col gap-3">
              {editingEntries.map((project, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Project Title - Regular Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">
                        Project Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.title}
                        placeholder="Project Title"
                        onChange={(e) => handleChange(editIndex, "title", e.target.value)}
                        onBlur={() => validateRequired("project", globalIndex, { title: project.title })}
                        className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
                      />
                      {errors[`project-${globalIndex}-title`] && (
                        <span className="text-xs text-red-500">
                          {errors[`project-${globalIndex}-title`]}
                        </span>
                      )}
                    </div>

                    {/* Technologies with Chips */}
                    <TechnologyChipsInput
                      label="Technologies Used"
                      selectedTechnologies={project.technologies}
                      onTechnologiesChange={(techs) =>
                        handleChange(editIndex, "technologies", techs)
                      }
                      suggestions={technologies}
                      placeholder="Type to add technologies..."
                    />

                    {/* Dates */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
                        <MonthYearPicker
                          value={project.startDate}
                          onChange={(val) => handleChange(editIndex, "startDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
                        <MonthYearPicker
                          value={project.endDate}
                          onChange={(val) => handleChange(editIndex, "endDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>
                    </div>

                    {/* Project Link */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-[#3b3b3b]">Project Link</label>
                      <input
                        type="text"
                        value={project.link || ""}
                        placeholder="https://github.com/..."
                        onChange={(e) => handleChange(editIndex, "link", e.target.value)}
                        className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">
                          Project description
                        </label>
                        <button
                          type="button"
                          ref={(el) => {
                            buttonRefs.current[editIndex] = el;
                          }}
                          disabled={loadingIndex === editIndex}
                          onClick={() => handleAIWriterClick(editIndex, globalIndex, project)}
                          className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
                        >
                          <NibPenSparkleIcon className="w-4 h-4" />
                          {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
                        </button>
                      </div>

                      <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
                        {/* Toolbar with Reusable Buttons */}
                        <div className="flex items-center gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
                          <ToolbarButton onClick={() => exec(editIndex, "bold")} title="Bold" icon={<FaBold />} />
                          <ToolbarButton onClick={() => exec(editIndex, "italic")} title="Italic" icon={<FaItalic />} />
                          <ToolbarButton onClick={() => exec(editIndex, "underline")} title="Underline" icon={<FaUnderline />} />
                          <ToolbarButton onClick={() => exec(editIndex, "insertUnorderedList")} title="Bullet List" icon={<FaListUl />} />
                          <ToolbarButton onClick={() => exec(editIndex, "insertOrderedList")} title="Numbered List" icon={<FaListOl />} />
                          <ToolbarButton onClick={() => exec(editIndex, "undo")} title="Undo" icon={<FaUndoAlt />} />
                          <ToolbarButton onClick={() => exec(editIndex, "redo")} title="Redo" icon={<FaRedoAlt />} />
                          <ToolbarButton onClick={() => toggleSpellCheck(editIndex)} title="Toggle Spellcheck" icon={<FaSpellCheck size={16} />} isActive={spellCheckEnabled} />
                        </div>

                        {/* Editor */}
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
                  onClick={addProject}
                  className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          {/* Tips Panel */}
          <div className="w-80 flex-shrink-0 overflow-y-auto scrollbar-hide sticky top-2">
            {showTips && activePopup === null ? (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>
                    Projects showcase your practical skills and initiative. Highlight technical challenges solved, technologies used, and measurable outcomes achieved.
                  </p>
                  <p>
                    Include relevant metrics like performance improvements, user engagement, or code efficiency. Link to live demos or GitHub repositories when possible to demonstrate your work.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *Personal projects are valued by 75% of employers when evaluating candidates.
                  </p>
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

export default Projects;

