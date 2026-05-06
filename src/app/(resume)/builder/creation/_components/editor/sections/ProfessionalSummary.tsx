import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import SectionTipsPanel from "../SectionTipsPanel";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
import AutocompleteInput from "../AutocompleteInput";
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
import NibPenSparkleIcon from "../NibPenSparkleIcon";


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


const ProfessionalSummary: React.FC = () => {
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
  } = useValidation();


  const [showTips, setShowTips] = useState(true);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const handleChange = (value: string) => {
    setResumeData({
      ...resumeData,
      professionalSummary: {
        ...resumeData.professionalSummary,
        summary: value,
      },
    });
    clearError("", 0, "summary");
  };

  const handleTargetRoleChange = (value: string) => {
    setResumeData({
      ...resumeData,
      professionalSummary: {
        ...resumeData.professionalSummary,
        targetRole: value,
      },
    });
    clearError("summary", 0, "targetRole");
  };


  const exec = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    
    setTimeout(() => {
      handleChange(editor.innerHTML || "");
    }, 0);
  };


  const onEditorInput = () => {
    const el = editorRef.current;
    if (!el) return;
    handleChange(el.innerHTML || "");
  };


  const handleAIWriterClick = () => {
    if (!validateRequired("summary", 0, {
      targetRole: resumeData.professionalSummary.targetRole,
    })) return;


    const summaryBox = summaryRef.current;
    const formContainer = formScrollRef.current;

    if (summaryBox && formContainer) {
      const summaryBoxTop = summaryBox.offsetTop;
      formContainer.scrollTo({
        top: summaryBoxTop - 50,
        behavior: "smooth"
      });
    }


    setShowTips(false);


        const prompt = `Generate 5 concise unique(different) professional summary options for a resume targeting the following role:
Target Role: ${resumeData.professionalSummary.targetRole}
Requirements for each summary:
- Length: 1-2 lines maximum (approximately 15-20 words)
- Start directly with your professional identity or key strength (e.g., "Results-driven software engineer...", "Strategic marketing professional...", "Detail-oriented data analyst...")
- Highlight years of experience, core competencies, and measurable achievements
- Include industry-specific keywords and technical skills relevant to ${resumeData.professionalSummary.targetRole}
- Focus on unique value proposition and tangible impact
- Avoid generic phrases like "hardworking," "team player," "seeking opportunities," or "passionate professional"
- Each summary should emphasize a different angle: technical expertise, leadership/impact, or specialized skills
Formatting rules:
- Return ONLY the 5 unique(different) summaries
- Each summary on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels
- Start each summary directly with a descriptor or professional title
- Separate summaries with a blank line
Example format:
Results-driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users

Strategic Product Manager with proven ability to launch 10+ successful features, drive 35% revenue growth, and lead cross-functional teams of 15+ members in agile environments

Innovative UX Designer specializing in user-centered design methodologies, creating intuitive interfaces that improved user satisfaction scores by 50% and reduced customer support tickets by 30%`;


    generateSuggestions(0, prompt);
  };


  const handleSuggestionSelect = (suggestion: string) => {
    const el = editorRef.current;
    if (el) {
      el.innerHTML = suggestion;
      handleChange(suggestion);
      
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


  const toggleSpellCheck = () => {
    const newState = !spellCheckEnabled;
    setSpellCheckEnabled(newState);
    const ed = editorRef.current;
    if (ed) ed.spellcheck = newState;
  };


  useEffect(() => {
    const el = editorRef.current;
    if (el && resumeData.professionalSummary.summary && el.innerHTML !== resumeData.professionalSummary.summary) {
      el.innerHTML = resumeData.professionalSummary.summary;
    }
  }, [resumeData.professionalSummary.summary]);


  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Editing Form with Tips Panel */}
      <div className="flex gap-6 items-start">
        {/* Left Side: Scrollable Form Fields Section */}
        <div 
          ref={formScrollRef}
          className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
        >
          <div className="flex flex-col gap-3">
            {/* Target Role Input with Autocomplete */}
            <AutocompleteInput
              label="Target Role"
              required
              value={resumeData.professionalSummary.targetRole}
              onChange={(val) => handleTargetRoleChange(val)}
              onBlur={() => validateRequired("summary", 0, { targetRole: resumeData.professionalSummary.targetRole })}
              placeholder="e.g., Frontend Developer, Data Analyst"
              suggestions={roles}
              error={errors[`summary-0-targetRole`]}
            />


            {/* Professional Summary */}
            <div ref={summaryRef} className="flex flex-col gap-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">
                  Professional Summary
                </label>
                <button
                  type="button"
                  ref={buttonRef}
                  disabled={loadingIndex === 0}
                  onClick={handleAIWriterClick}
                  className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
                >
                  <NibPenSparkleIcon className="w-4 h-4" />
                  {loadingIndex === 0 ? "Generating..." : "AI Writer"}
                </button>
              </div>


              {/* Summary Box with Toolbar Inside */}
              <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
                {/* Toolbar with Reusable Buttons */}
                <div className="flex items-center gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
                  <ToolbarButton onClick={() => exec("bold")} title="Bold" icon={<FaBold />} />
                  <ToolbarButton onClick={() => exec("italic")} title="Italic" icon={<FaItalic />} />
                  <ToolbarButton onClick={() => exec("underline")} title="Underline" icon={<FaUnderline />} />
                  <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet List" icon={<FaListUl />} />
                  <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered List" icon={<FaListOl />} />
                  <ToolbarButton onClick={() => exec("undo")} title="Undo" icon={<FaUndoAlt />} />
                  <ToolbarButton onClick={() => exec("redo")} title="Redo" icon={<FaRedoAlt />} />
                  <ToolbarButton onClick={toggleSpellCheck} title="Toggle Spellcheck" icon={<FaSpellCheck size={16} />} isActive={spellCheckEnabled} />
                </div>


                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={onEditorInput}
                  className="w-full px-3 py-2 text-sm text-black min-h-[180px] focus:outline-none border-b-2 border-transparent focus:border-[#2557a7]"
                  spellCheck={spellCheckEnabled}
                />
              </div>
            </div>
          </div>
        </div>


        {/* Right Side: Fixed Tips Section */}
        <div className="w-80 flex-shrink-0 sticky top-2">
          {showTips && activePopup === null ? (
            <SectionTipsPanel
              sectionKey="ProfessionalSummary"
              staticTips={
                <div className="bg-[#faf9f8] rounded-lg p-5">
                  <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                  <div className="border-t border-gray-300 mb-3"></div>
                  <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                    <p>
                      Your professional summary is a brief overview highlighting your experience, skills, and career achievements. Keep it concise, focused, and tailored to your target role.*
                    </p>
                    <p>
                      Include years of experience, key competencies, measurable achievements, and industry-specific keywords. Start with a strong professional descriptor and emphasize your unique value proposition.
                    </p>
                    <p className="text-xs text-gray-500 italic mt-6">
                      *Recruiters spend an average of 6 seconds reviewing a resume—make your summary count.
                    </p>
                  </div>
                </div>
              }
            />
          ) : (
            activePopup !== null && suggestions[activePopup] && (
              <AISuggestions
                options={suggestions[activePopup]}
                onSelect={(s) => handleSuggestionSelect(s)}
                onClose={() => {
                  setActivePopup(null);
                  setShowTips(true);
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};


export default ProfessionalSummary;




