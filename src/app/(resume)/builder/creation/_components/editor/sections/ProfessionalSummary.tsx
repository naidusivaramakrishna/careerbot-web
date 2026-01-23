// import React, { useRef, useState, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// interface Props {
//   errors: Record<string, string>;
// }
// const ProfessionalSummary: React.FC<Props> = ({ errors }) => {
//   const { resumeData, setResumeData } = useResume();
//   const {
//     loadingIndex,
//     suggestions,
//     activePopup,
//     setActivePopup,
//     generateSuggestions,
//   } = useAISuggestions();
//   const { clearError } = useValidation();
//   const [targetRole, setTargetRole] = useState("");
//   const [targetRoleError, setTargetRoleError] = useState("");
//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });
//   const buttonRef = useRef<HTMLButtonElement | null>(null);
//   const key = "summary";
//   const handleChange = (value: string) => {
//     setResumeData({
//       ...resumeData,
//       professionalSummary: value,
//     });
//     clearError("", 0, key);
//   };
//   const handleGenerate = () => {
//     if (!targetRole.trim()) {
//       setTargetRoleError("This field is required.");
//       return;
//     }
//     setTargetRoleError("");

//     // ✅ Prompt for AI
//       const prompt = `Generate 3 concise professional summary options for a resume targeting the following role:
// Target Role: ${targetRole}
// Requirements for each summary:
// - Length: 1-2 lines maximum (approximately 15-20 words)
// - Start directly with your professional identity or key strength (e.g., "Results-driven software engineer...", "Strategic marketing professional...", "Detail-oriented data analyst...")
// - Highlight years of experience, core competencies, and measurable achievements
// - Include industry-specific keywords and technical skills relevant to ${targetRole}
// - Focus on unique value proposition and tangible impact
// - Avoid generic phrases like "hardworking," "team player," "seeking opportunities," or "passionate professional"
// - Each summary should emphasize a different angle: technical expertise, leadership/impact, or specialized skills
// Formatting rules:
// - Return ONLY the 3 summaries
// - Each summary on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels
// - Start each summary directly with a descriptor or professional title
// - Separate summaries with a blank line
// Example format:
// Results-driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users

// Strategic Product Manager with proven ability to launch 10+ successful features, drive 35% revenue growth, and lead cross-functional teams of 15+ members in agile environments

// Innovative UX Designer specializing in user-centered design methodologies, creating intuitive interfaces that improved user satisfaction scores by 50% and reduced customer support tickets by 30%`;
//     generateSuggestions(0, prompt);
//   };
//   // 📌 Position popup beside the button
//   useEffect(() => {
//     if (activePopup === 0 && buttonRef.current) {
//       const rect = buttonRef.current.getBoundingClientRect();
//       setPopupPosition({
//         top: rect.bottom + window.scrollY - 260, // adjust vertical offset
//         left: rect.right + window.scrollX + 8,   // align beside button
//       });
//     }
//   }, [activePopup, suggestions]);
//   return (
//     <div className="flex flex-col gap-2 ml-8 mt-3 relative">
//       {/* Target Role Input */}
//       <label className="text-sm font-semibold text-gray-700">
//         Target Role (for AI generation only)
//       </label>
//       <input
//         type="text"
//         value={targetRole}
//         placeholder="e.g., Frontend Developer, Data Analyst"
//         onChange={(e) => {
//           setTargetRole(e.target.value);
//           setTargetRoleError("");
//         }}
//         className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//       />
//       {targetRoleError && (
//         <span className="text-xs text-red-500">{targetRoleError}</span>
//       )}
//       {/* Professional Summary */}
//       <label className="text-sm font-semibold text-gray-700 mt-2">
//         Summary <span className="text-red-500">*</span>
//       </label>
//       <textarea
//         value={resumeData.professionalSummary || ""}
//         placeholder="Enter summary or click Generate"
//         onChange={(e) => handleChange(e.target.value)}
//         className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//         rows={5}
//       />
//       {errors[key] && (
//         <span className="text-xs text-red-500">{errors[key]}</span>
//       )}
//       {/* Generate Button */}
//       <div className="relative flex justify-end w-full">
//         <button
//           type="button"
//           ref={buttonRef}
//           disabled={loadingIndex === 0}
//           onClick={handleGenerate}
//           className="mt-2 w-fit px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//         >
//           {loadingIndex === 0 ? "Generating..." : "✨ Generate Summary"}
//         </button>
//       </div>
//       {/* AI Suggestions Popup */}
//       {activePopup === 0 && suggestions[0] &&
//         ReactDOM.createPortal(
//           <div
//             className="absolute z-[9999]"
//             style={{
//               top: `${popupPosition.top}px`,
//               left: `${popupPosition.left}px`,
//               position: "absolute",
//             }}
//           >
//             <AISuggestions
//               options={suggestions[0]}
//               onSelect={(s) => {
//                 handleChange(s);
//                 setActivePopup(null);
//               }}
//               onClose={() => setActivePopup(null)}
//             />
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };
// export default ProfessionalSummary; before tips



// import React, { useRef, useEffect, useState } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// import {
//   FaSpellCheck,
//   FaListUl,
//   FaListOl,
//   FaBold,
//   FaItalic,
//   FaUnderline,
//   FaUndoAlt,
//   FaRedoAlt,
// } from "react-icons/fa";
// import NibPenSparkleIcon from "../NibPenSparkleIcon";

// const ProfessionalSummary: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const {
//     loadingIndex,
//     suggestions,
//     activePopup,
//     setActivePopup,
//     generateSuggestions,
//   } = useAISuggestions();

//   const {
//     errors,
//     validateRequired,
//     clearError,
//   } = useValidation();

//   const [showTips, setShowTips] = useState(true);
//   const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
//   const [targetRole, setTargetRole] = useState("");

//   const buttonRef = useRef<HTMLButtonElement | null>(null);
//   const editorRef = useRef<HTMLDivElement | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const summaryRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);

//   const handleChange = (value: string) => {
//     setResumeData({
//       ...resumeData,
//       professionalSummary: value,
//     });
//     clearError("", 0, "summary");
//   };

//   const exec = (command: string, value?: string) => {
//     const editor = editorRef.current;
//     if (!editor) return;
    
//     editor.focus();
//     document.execCommand(command, false, value);
    
//     // Update the state after executing command
//     setTimeout(() => {
//       handleChange(editor.innerHTML || "");
//     }, 0);
//   };

//   const onEditorInput = () => {
//     const el = editorRef.current;
//     if (!el) return;
//     handleChange(el.innerHTML || "");
//   };

//   const handleAIWriterClick = () => {
//     if (!validateRequired("summary", 0, {
//       targetRole: targetRole,
//     })) return;

//     // Scroll to summary box within the scrollable form container
//     const summaryBox = summaryRef.current;
//     const formContainer = formScrollRef.current;
    
//     if (summaryBox && formContainer) {
//       const summaryBoxTop = summaryBox.offsetTop;
//       formContainer.scrollTo({
//         top: summaryBoxTop - 50,
//         behavior: "smooth"
//       });
//     }

//     // Hide tips and show suggestions
//     setShowTips(false);

//     const prompt = `Generate 3 concise professional summary options for a resume targeting the following role:
// Target Role: ${targetRole}
// Requirements for each summary:
// - Length: 1-2 lines maximum (approximately 15-20 words)
// - Start directly with your professional identity or key strength (e.g., "Results-driven software engineer...", "Strategic marketing professional...", "Detail-oriented data analyst...")
// - Highlight years of experience, core competencies, and measurable achievements
// - Include industry-specific keywords and technical skills relevant to ${targetRole}
// - Focus on unique value proposition and tangible impact
// - Avoid generic phrases like "hardworking," "team player," "seeking opportunities," or "passionate professional"
// - Each summary should emphasize a different angle: technical expertise, leadership/impact, or specialized skills
// Formatting rules:
// Return ONLY the 3 summaries on separate lines with a blank line between each.`;

//     generateSuggestions(0, prompt);
//   };

//   const handleSuggestionSelect = (suggestion: string) => {
//     const el = editorRef.current;
//     if (el) {
//       el.innerHTML = suggestion;
//       handleChange(suggestion);
      
//       // Set cursor to end after inserting suggestion
//       setTimeout(() => {
//         el.focus();
//         const range = document.createRange();
//         const sel = window.getSelection();
//         if (el.childNodes.length > 0) {
//           range.selectNodeContents(el);
//           range.collapse(false);
//           sel?.removeAllRanges();
//           sel?.addRange(range);
//         }
//       }, 0);
//     }
    
//     setActivePopup(null);
//     setShowTips(true);

//     // Scroll form container to top
//     setTimeout(() => {
//       if (formScrollRef.current) {
//         formScrollRef.current.scrollTo({
//           top: 0,
//           behavior: "smooth"
//         });
//       }
//     }, 100);
//   };

//   // Set initial content for editor
//   useEffect(() => {
//     const el = editorRef.current;
//     if (el && resumeData.professionalSummary && el.innerHTML !== resumeData.professionalSummary) {
//       el.innerHTML = resumeData.professionalSummary;
//     }
//   }, [resumeData.professionalSummary]);

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Editing Form with Tips Panel */}
//       <div className="flex gap-6 items-start">
//         {/* Left Side: Scrollable Form Fields Section */}
//         <div 
//           ref={formScrollRef}
//           className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
//         >
//           <div className="flex flex-col gap-3">
//             {/* Target Role Input */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-[#3b3b3b]">
//                 Target Role <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={targetRole}
//                 placeholder="e.g., Frontend Developer, Data Analyst"
//                 onChange={(e) => {
//                   setTargetRole(e.target.value);
//                   clearError("summary", 0, "targetRole");
//                 }}
//                 onBlur={() => validateRequired("summary", 0, { targetRole: targetRole })}
//                 className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//               />
//               {errors[`summary-0-targetRole`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`summary-0-targetRole`]}
//                 </span>
//               )}
//             </div>

//             {/* Professional Summary */}
//             <div ref={summaryRef} className="flex flex-col gap-1 relative">
//               <div className="flex justify-between items-center">
//                 <label className="text-sm font-semibold text-gray-700">
//                   Professional Summary
//                 </label>
//                 <button
//                   type="button"
//                   ref={buttonRef}
//                   disabled={loadingIndex === 0}
//                   onClick={handleAIWriterClick}
//                   className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                 >
//                   <NibPenSparkleIcon className="w-4 h-4" />
//                   {loadingIndex === 0 ? "Generating..." : "AI Writer"}
//                 </button>
//               </div>

//               {/* Summary Box with Toolbar Inside */}
//               <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
//                 {/* Toolbar */}
//                 <div className="flex items-center gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
//                   <button
//                     type="button"
//                     onClick={() => exec("bold")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Bold"
//                   >
//                     <FaBold />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec("italic")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Italic"
//                   >
//                     <FaItalic />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec("underline")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Underline"
//                   >
//                     <FaUnderline />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec("insertUnorderedList")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Bullet List"
//                   >
//                     <FaListUl />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec("insertOrderedList")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Numbered List"
//                   >
//                     <FaListOl />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec("undo")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Undo"
//                   >
//                     <FaUndoAlt />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec("redo")}
//                     className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                     title="Redo"
//                   >
//                     <FaRedoAlt />
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => {
//                       const newState = !spellCheckEnabled;
//                       setSpellCheckEnabled(newState);
//                       const ed = editorRef.current;
//                       if (ed) ed.spellcheck = newState;
//                     }}
//                     className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition ${
//                       spellCheckEnabled ? "text-[#2557a7] border border-[#2557a7] bg-blue-50" : "text-gray-700"
//                     }`}
//                     title="Toggle Spellcheck"
//                   >
//                     <FaSpellCheck />
//                   </button>
//                 </div>

//                 {/* Editor */}
//                 <div
//                   ref={editorRef}
//                   contentEditable
//                   suppressContentEditableWarning
//                   onInput={onEditorInput}
//                   className="w-full px-3 py-2 text-sm text-black min-h-[180px] focus:outline-none border-b-2 border-transparent focus:border-[#2557a7]"
//                   spellCheck={spellCheckEnabled}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Side: Fixed Tips Section */}
//         <div className="w-80 flex-shrink-0 sticky top-2">
//           {showTips && activePopup === null ? (
//             <div className="bg-[#faf9f8] rounded-lg p-5">
//               <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//               <div className="border-t border-gray-300 mb-3"></div>
//               <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                 <p>
//                   Your professional summary is a brief overview highlighting your experience, skills, and career achievements. Keep it concise, focused, and tailored to your target role.*
//                 </p>
//                 <p>
//                   Include years of experience, key competencies, measurable achievements, and industry-specific keywords. Start with a strong professional descriptor and emphasize your unique value proposition.
//                 </p>
//                 <p className="text-xs text-gray-500 italic mt-6">
//                   *Recruiters spend an average of 6 seconds reviewing a resume—make your summary count.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             activePopup !== null && suggestions[activePopup] && (
//               <AISuggestions
//                 options={suggestions[activePopup]}
//                 onSelect={(s) => handleSuggestionSelect(s)}
//                 onClose={() => {
//                   setActivePopup(null);
//                   setShowTips(true);
//                 }}
//               />
//             )
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfessionalSummary; before roles



import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
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
  const [targetRole, setTargetRole] = useState("");


  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);


  const handleChange = (value: string) => {
    setResumeData({
      ...resumeData,
      professionalSummary: value,
    });
    clearError("", 0, "summary");
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
      targetRole: targetRole,
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
Target Role: ${targetRole}
Requirements for each summary:
- Length: 1-2 lines maximum (approximately 15-20 words)
- Start directly with your professional identity or key strength (e.g., "Results-driven software engineer...", "Strategic marketing professional...", "Detail-oriented data analyst...")
- Highlight years of experience, core competencies, and measurable achievements
- Include industry-specific keywords and technical skills relevant to ${targetRole}
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
    if (el && resumeData.professionalSummary && el.innerHTML !== resumeData.professionalSummary) {
      el.innerHTML = resumeData.professionalSummary;
    }
  }, [resumeData.professionalSummary]);


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
              value={targetRole}
              onChange={(val) => {
                setTargetRole(val);
                clearError("summary", 0, "targetRole");
              }}
              onBlur={() => validateRequired("summary", 0, { targetRole: targetRole })}
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




