// import React, { useRef, useState, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";

// interface AchievementsEntry {
//   title: string;
//   date: string;
//   description: string;
// }

// const Achievements: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { loadingIndex, suggestions, activePopup, setActivePopup, generateSuggestions } =
//     useAISuggestions();
//   const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
//     useValidation();

//   const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

//   const handleChange = (index: number, field: keyof AchievementsEntry, value: string | boolean) => {
//     const updated = [...(resumeData.achievements || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, achievements: updated });
//     clearError("achieve", index, field);
//   };

//   const addAchievement = () => {
//     setResumeData({
//       ...resumeData,
//       achievements: [
//         ...(resumeData.achievements || []),
//         {
//           title: "",
//           date: "",
//           description: "",
//         },
//       ],
//     });
//   };

//   const removeAchievement = (index: number) => {
//     const updated = [...(resumeData.achievements || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, achievements: updated });
//     clearSectionIndexErrors("achieve", index);
//     reindexErrors("achieve", index);
//   };

//   useEffect(() => {
//     if (activePopup !== null && buttonRefs.current[activePopup]) {
//       const rect = buttonRefs.current[activePopup]!.getBoundingClientRect();
//       setPopupPosition({
//         top: rect.bottom + window.scrollY - 260,
//         left: rect.right + window.scrollX + 8,
//       });
//     }
//   }, [activePopup, suggestions]);

//   return (
//     <div className="flex flex-col gap-6 ml-8 mt-3">
//       {(resumeData.achievements || []).map((achieve, index) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Company */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Title <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={achieve.title}
//               placeholder="Enter Company"
//               onChange={(e) => handleChange(index, "title", e.target.value)}
//               onBlur={() => validateRequired("achieve", index, { title: achieve.title })}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`achieve-${index}-title`] && (
//               <span className="text-xs text-red-500">{errors[`achieve-${index}-title`]}</span>
//             )}
//           </div>

//           {/* Date */}        
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">Date</label>
//             <input
//               type="month"
//               value={achieve.date || ""}
//               onChange={(e) => handleChange(index, "date", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>

//           {/* Description + AI Suggestions */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Description{" "}
//               <span className="text-blue-500 text-[10px]">
//                 &#39; Strongly Recommend for Good ATS Score &#39;
//               </span>
//             </label>
//             <textarea
//               value={achieve.description || ""}
//               placeholder="Enter Description or click Generate"
//               onChange={(e) => handleChange(index, "description", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               rows={5}
//             />
//             <button
//               type="button"
//               ref={(el) => {
//                 buttonRefs.current[index] = el;
//               }}
//               disabled={loadingIndex === index}
//               onClick={() => {
//                 if (
//                   !validateRequired("achieve", index, {
//                     company: achieve.title,                   
//                   })
//                 )
//                   return;
// //                 const prompt = `Write 3 impactful internship resume bullet points:
// // - Title: ${achieve.title}
// // Focus on achievements, measurable results, and impact. Use strong action verbs.`;
//                 const prompt = `Generate 3 compelling achievement description options for a resume based on the following:

// Achievement Title: ${achieve.title}

// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense: achieved, earned, secured, won, recognized, awarded, accomplished, attained, etc.)
// - Highlight the significance, impact, and context of the achievement
// - Include specific details: competition scale, selection criteria, percentile ranking, or number of participants/candidates
// - Emphasize what made this achievement noteworthy (e.g., "selected from 500+ applicants", "top 5% nationally", "first place among 50 teams")
// - Use concrete metrics and numbers to demonstrate prestige and competitive advantage
// - Avoid vague phrases like "received recognition," "participated in," or "was honored"
// - Each description should present the achievement from a different angle: competitive achievement, recognition/award, or impactful contribution

// Formatting rules:
// - Return ONLY the 3 descriptions
// - Each description on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
// - Start each description directly with an action verb
// - Separate descriptions with a blank line

// Example format:
// Won first place in National Hackathon among 200+ competing teams by developing an AI-powered healthcare solution that reduced patient wait times by 40%

// Secured prestigious Dean's Merit Scholarship awarded to top 3% of students based on academic excellence and leadership achievements across 5,000+ applicants

// Recognized as Employee of the Year for spearheading process improvements that increased team productivity by 35% and saved $100K in operational costs`;
//                 generateSuggestions(index, prompt);
//               }}
//               className="mt-2 w-fit px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//             >
//               {loadingIndex === index ? "Generating..." : "✨ Generate Description"}
//             </button>

//             {activePopup === index &&
//               suggestions[index] &&
//               ReactDOM.createPortal(
//                 <div
//                   className="absolute z-[9999]"
//                   style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
//                 >
//                   <AISuggestions
//                     options={suggestions[index]}
//                     onSelect={(s) => {
//                       handleChange(index, "description", s);
//                       setActivePopup(null);
//                     }}
//                     onClose={() => setActivePopup(null)}
//                   />
//                 </div>,
//                 document.body
//               )}
//           </div>

//           {/* Remove */}
//           <button
//             type="button"
//             onClick={() => removeAchievement(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       <button
//         type="button"
//         onClick={addAchievement}
//         className="w-fit px-11 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Achievement
//       </button>
//     </div>
//   );
// };
// export default Achievements;


// import React, { useRef, useState, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";

// interface AchievementsEntry {
//   title: string;
//   date: string;
//   description: string;
// }

// const Achievements: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { loadingIndex, suggestions, activePopup, setActivePopup, generateSuggestions } =
//     useAISuggestions();
//   const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
//     useValidation();

//   const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

//   const handleChange = (index: number, field: keyof AchievementsEntry, value: string | boolean) => {
//     const updated = [...(resumeData.achievements || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, achievements: updated });
//     clearError("achieve", index, field);
//   };

//   const addAchievement = () => {
//     setResumeData({
//       ...resumeData,
//       achievements: [
//         ...(resumeData.achievements || []),
//         {
//           title: "",
//           date: "",
//           description: "",
//         },
//       ],
//     });
//   };

//   const removeAchievement = (index: number) => {
//     const updated = [...(resumeData.achievements || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, achievements: updated });
//     clearSectionIndexErrors("achieve", index);
//     reindexErrors("achieve", index);
//   };

//   useEffect(() => {
//     if (activePopup !== null && buttonRefs.current[activePopup]) {
//       const rect = buttonRefs.current[activePopup]!.getBoundingClientRect();
//       setPopupPosition({
//         top: rect.bottom + window.scrollY - 260,
//         left: rect.right + window.scrollX + 8,
//       });
//     }
//   }, [activePopup, suggestions]);

//   return (
//     <div className="flex flex-col gap-6 ml-8 mt-3">
//       {(resumeData.achievements || []).map((achieve, index) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Title */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Title <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={achieve.title}
//               placeholder="Enter Title"
//               onChange={(e) => handleChange(index, "title", e.target.value)}
//               onBlur={() => validateRequired("achieve", index, { title: achieve.title })}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`achieve-${index}-title`] && (
//               <span className="text-xs text-red-500">{errors[`achieve-${index}-title`]}</span>
//             )}
//           </div>

//           {/* Date */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">Date</label>
//             <input
//               type="month"
//               value={achieve.date || ""}
//               onChange={(e) => handleChange(index, "date", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>

//           {/* Description + AI Suggestions */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Description{" "}
//               <span className="text-blue-500 text-[10px]">
//                 &#39; Strongly Recommend for Good ATS Score &#39;
//               </span>
//             </label>
//             <textarea
//               value={achieve.description || ""}
//               placeholder="Enter Description or click Generate"
//               onChange={(e) => handleChange(index, "description", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               rows={5}
//             />

//             {/* Right-aligned Generate Button */}
//             <div className="flex justify-end mt-2">
//               <button
//                 type="button"
//                 ref={(el) => {
//                   buttonRefs.current[index] = el;
//                 }}
//                 disabled={loadingIndex === index}
//                 onClick={() => {
//                   if (
//                     !validateRequired("achieve", index, {
//                       company: achieve.title,
//                     })
//                   )
//                     return;

//                   const prompt = `Generate 3 compelling achievement description options for a resume based on the following:

// Achievement Title: ${achieve.title}

// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense: achieved, earned, secured, won, recognized, awarded, accomplished, attained, etc.)
// - Highlight the significance, impact, and context of the achievement
// - Include specific details: competition scale, selection criteria, percentile ranking, or number of participants/candidates
// - Emphasize what made this achievement noteworthy (e.g., "selected from 500+ applicants", "top 5% nationally", "first place among 50 teams")
// - Use concrete metrics and numbers to demonstrate prestige and competitive advantage
// - Avoid vague phrases like "received recognition," "participated in," or "was honored"
// - Each description should present the achievement from a different angle: competitive achievement, recognition/award, or impactful contribution

// Formatting rules:
// - Return ONLY the 3 descriptions
// - Each description on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
// - Start each description directly with an action verb
// - Separate descriptions with a blank line`;

//                   generateSuggestions(index, prompt);
//                 }}
//                 className="px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//               >
//                 {loadingIndex === index ? "Generating..." : "✨ Generate Description"}
//               </button>
//             </div>

//             {activePopup === index &&
//               suggestions[index] &&
//               ReactDOM.createPortal(
//                 <div
//                   className="absolute z-[9999]"
//                   style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
//                 >
//                   <AISuggestions
//                     options={suggestions[index]}
//                     onSelect={(s) => {
//                       handleChange(index, "description", s);
//                       setActivePopup(null);
//                     }}
//                     onClose={() => setActivePopup(null)}
//                   />
//                 </div>,
//                 document.body
//               )}
//           </div>

//           {/* Remove Button */}
//           <button
//             type="button"
//             onClick={() => removeAchievement(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       {/* Add Achievement */}
//       <button
//         type="button"
//         onClick={addAchievement}
//         className="w-fit px-11 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Achievement
//       </button>
//     </div>
//   );
// };

// export default Achievements; before tips



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
// import { RiEdit2Fill } from 'react-icons/ri';
// import { Trash2 } from 'lucide-react';
// import { LuPlus } from 'react-icons/lu';
// import NibPenSparkleIcon from "../NibPenSparkleIcon";


// interface AchievementEntry {
//   title: string;
//   date: string;
//   description: string;
// }


// const emptyAchievement = (): AchievementEntry => ({
//   title: "",
//   date: "",
//   description: "",
// });


// // Reusable Toolbar Button Component
// interface ToolbarButtonProps {
//   onClick: () => void;
//   title: string;
//   icon: React.ReactNode;
//   isActive?: boolean;
// }

// const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, icon, isActive = false }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition ${
//       isActive ? "text-[#2557a7] border border-[#2557a7] bg-blue-50" : "text-gray-400 hover:text-blue-600"
//     }`}
//     title={title}
//   >
//     {icon}
//   </button>
// );


// const Achievements: React.FC = () => {
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
//     clearSectionIndexErrors,
//     reindexErrors,
//   } = useValidation();


//   const [showTips, setShowTips] = useState(true);
//   const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);


//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const descriptionRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const formScrollRef = useRef<HTMLDivElement>(null);


//   const hasValidData = (entry: AchievementEntry): boolean => {
//     return !!(entry.title || entry.date || entry.description);
//   };


//   const [savedEntries, setSavedEntries] = useState<AchievementEntry[]>(() => {
//     if (resumeData.achievements && resumeData.achievements.length) {
//       const validEntries = resumeData.achievements.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });


//   const [editingEntries, setEditingEntries] = useState<AchievementEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyAchievement()];
//     }
//     return [];
//   });


//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     if (JSON.stringify(resumeData.achievements) !== JSON.stringify(allEntries)) {
//       setResumeData({ ...resumeData, achievements: allEntries });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [savedEntries, editingEntries]);


//   const handleChange = <K extends keyof AchievementEntry>(
//     index: number,
//     field: K,
//     value: AchievementEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("achievement", savedEntries.length + index, field as string);
//   };


//   const addAchievement = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyAchievement()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };


//   const addNewEntry = () => {
//     setEditingEntries([emptyAchievement()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };


//   const removeAchievement = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("achievement", index);
//     reindexErrors("achievement", index);
//   };


//   const editEntry = (index: number) => {
//     const entryToEdit = savedEntries[index];
//     const updatedSaved = [...savedEntries];
//     updatedSaved.splice(index, 1);
//     setSavedEntries(updatedSaved);
//     setEditingEntries([entryToEdit]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) {
//         el.focus();
//         const range = document.createRange();
//         const sel = window.getSelection();
//         if (el.childNodes.length > 0) {
//           range.selectNodeContents(el);
//           range.collapse(false);
//           sel?.removeAllRanges();
//           sel?.addRange(range);
//         }
//       }
//     }, 0);
//   };


//   const exec = (idx: number, command: string, value?: string) => {
//     const editor = editorRefs.current[idx];
//     if (!editor) return;
    
//     editor.focus();
//     document.execCommand(command, false, value);
    
//     setTimeout(() => {
//       handleChange(idx, "description", editor.innerHTML || "");
//     }, 0);
//   };


//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };


//   const handleAIWriterClick = (editIndex: number, globalIndex: number, achievement: AchievementEntry) => {
//     if (!validateRequired("achievement", globalIndex, {
//       title: achievement.title,
//     })) return;

//     const descBox = descriptionRefs.current[editIndex];
//     const formContainer = formScrollRef.current;
    
//     if (descBox && formContainer) {
//       const descBoxTop = descBox.offsetTop;
//       formContainer.scrollTo({
//         top: descBoxTop - 50,
//         behavior: "smooth"
//       });
//     }

//     setShowTips(false);

//     const prompt = `Generate 5 impactful unique(different) achievement description options for a resume based on the following details:

// Achievement Title: ${achievement.title}

// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense: achieved, earned, awarded, recognized, selected, won, received, etc.)
// - Focus on quantifiable achievements, competitive metrics, and recognition significance
// - Include specific metrics (e.g., "ranked top 5% nationally", "selected from 1000+ applicants", "awarded $10K scholarship")
// - Highlight the competitive nature, exclusivity, or impact of the achievement
// - Emphasize what makes this achievement noteworthy and impressive
// - Use industry keywords for ATS optimization
// - Avoid generic phrases like "received award" or "got recognition"
// - Each description must be unique and emphasize different aspects: scale, competition, impact, or prestige

// Formatting rules:
// - Return ONLY the 5 unique(different) descriptions
// - Each description on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
// - Start each description directly with an action verb
// - Separate descriptions with a blank line

// Example format:
// Awarded Dean's List recognition for academic excellence, ranking in top 3% of engineering cohort of 500+ students with cumulative GPA of 3.9/4.0

// Selected as one of 20 finalists from 5000+ global applicants for prestigious Google Developer Scholarship program worth $15K based on coding portfolio

// Recognized with Employee of the Year award for driving 40% increase in team productivity and mentoring 8 junior developers to successful project launches`;

//     generateSuggestions(editIndex, prompt);
//   };


//   const handleSuggestionSelect = (editIndex: number, suggestion: string) => {
//     const el = editorRefs.current[editIndex];
//     if (el) {
//       el.innerHTML = suggestion;
//       handleChange(editIndex, "description", suggestion);
      
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

//     setTimeout(() => {
//       if (formScrollRef.current) {
//         formScrollRef.current.scrollTo({
//           top: 0,
//           behavior: "smooth"
//         });
//       }
//     }, 100);
//   };


//   const toggleSpellCheck = (editIndex: number) => {
//     const newState = !spellCheckEnabled;
//     setSpellCheckEnabled(newState);
//     const ed = editorRefs.current[editIndex];
//     if (ed) ed.spellcheck = newState;
//   };


//   useEffect(() => {
//     editingEntries.forEach((achievement, idx) => {
//       const el = editorRefs.current[idx];
//       if (el && achievement.description && el.innerHTML !== achievement.description) {
//         el.innerHTML = achievement.description;
//       }
//     });
//   }, [editingEntries]);


//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Saved Entries List */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4 mt-8">
//           <div className="flex flex-col gap-4">
//             {savedEntries.map((achievement, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   <div className="text-base font-bold text-gray-900">
//                     {achievement.title || "No title"}
//                   </div>
                  
//                   {achievement.date && (
//                     <div className="text-xs text-gray-600">
//                       {achievement.date}
//                     </div>
//                   )}
                  
//                   {achievement.description && (
//                     <div 
//                       className="text-sm text-[#404040] mt-1 line-clamp-2" 
//                       dangerouslySetInnerHTML={{ __html: achievement.description }} 
//                     />
//                   )}
//                 </div>

//                 <div className="flex gap-3">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full"
//                   >
//                     <RiEdit2Fill size={20} className="text-[#595959]"/>
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeAchievement(index)}
//                     className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full "
//                   >
//                     <Trash2 size={20} className="text-[#595959] hover:text-red-500"/>
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="pt-2">
//             <button
//               type="button"
//               onClick={addNewEntry}
//               className="flex w-fit p-3 items-center justify-center text-xs font-semibold bg-[#e5e5e5] hover:bg-[#2557a7] rounded-full transition-colors group"
//             >
//               <LuPlus size={20} className="text-[#595959] group-hover:text-white"/>
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Editing Form */}
//       {editingEntries.length > 0 && (
//         <div className="flex gap-6 items-start">
//           <div 
//             ref={formScrollRef}
//             className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
//           >
//             <div className="flex flex-col gap-3">
//               {editingEntries.map((achievement, editIndex) => {
//                 const globalIndex = savedEntries.length + editIndex;
//                 return (
//                   <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
//                     {/* Title & Date */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Achievement Title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={achievement.title}
//                           placeholder="Achievement Title"
//                           onChange={(e) => handleChange(editIndex, "title", e.target.value)}
//                           onBlur={() => validateRequired("achievement", globalIndex, { title: achievement.title })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
//                         />
//                         {errors[`achievement-${globalIndex}-title`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`achievement-${globalIndex}-title`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Date
//                         </label>
//                         <input
//                           type="text"
//                           value={achievement.date}
//                           placeholder="YYYY or Month YYYY"
//                           onChange={(e) => handleChange(editIndex, "date", e.target.value)}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
//                         />
//                       </div>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Achievement description
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, achievement)}
//                           className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                         >
//                           <NibPenSparkleIcon className="w-4 h-4" />
//                           {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                         </button>
//                       </div>

//                       <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#5896d7] overflow-hidden">
//                         {/* Toolbar with Reusable Buttons */}
//                         <div className="flex items-center gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
//                           <ToolbarButton onClick={() => exec(editIndex, "bold")} title="Bold" icon={<FaBold />} />
//                           <ToolbarButton onClick={() => exec(editIndex, "italic")} title="Italic" icon={<FaItalic />} />
//                           <ToolbarButton onClick={() => exec(editIndex, "underline")} title="Underline" icon={<FaUnderline />} />
//                           <ToolbarButton onClick={() => exec(editIndex, "insertUnorderedList")} title="Bullet List" icon={<FaListUl />} />
//                           <ToolbarButton onClick={() => exec(editIndex, "insertOrderedList")} title="Numbered List" icon={<FaListOl />} />
//                           <ToolbarButton onClick={() => exec(editIndex, "undo")} title="Undo" icon={<FaUndoAlt />} />
//                           <ToolbarButton onClick={() => exec(editIndex, "redo")} title="Redo" icon={<FaRedoAlt />} />
//                           <ToolbarButton onClick={() => toggleSpellCheck(editIndex)} title="Toggle Spellcheck" icon={<FaSpellCheck size={16} />} isActive={spellCheckEnabled} />
//                         </div>

//                         <div
//                           ref={(el) => { editorRefs.current[editIndex] = el; }}
//                           contentEditable
//                           suppressContentEditableWarning
//                           onInput={() => onEditorInput(editIndex)}
//                           className="w-full px-3 py-2 text-sm text-black min-h-[180px] focus:outline-none border-b-2 border-transparent focus:border-[#2557a7]"
//                           spellCheck={spellCheckEnabled}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}

//               <div className="pt-2">
//                 <button
//                   type="button"
//                   onClick={addAchievement}
//                   className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//                 >
//                   + Add Additional
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="w-80 flex-shrink-0 sticky top-2">
//             {showTips && activePopup === null ? (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//                 <div className="border-t border-gray-300 mb-3"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Achievements and awards demonstrate excellence and recognition in your field. Highlight specific accomplishments that set you apart from other candidates.*
//                   </p>
//                   <p>
//                     Include the achievement title, date received, and a brief description of its significance. Quantify your achievements with rankings, percentages, or competitive metrics whenever possible.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *70% of hiring managers value recognition and awards when evaluating candidates.
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               activePopup !== null && suggestions[activePopup] && (
//                 <AISuggestions
//                   options={suggestions[activePopup]}
//                   onSelect={(s) => handleSuggestionSelect(activePopup, s)}
//                   onClose={() => {
//                     setActivePopup(null);
//                     setShowTips(true);
//                   }}
//                 />
//               )
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Achievements; before section item delete api added


import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
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

interface AchievementEntry {
  title: string;
  date: string;
  description: string;
  _id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyAchievement = (): AchievementEntry => ({
  title: "",
  date: "",
  description: "",
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

const Achievements: React.FC = () => {
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

  const hasValidData = (entry: AchievementEntry): boolean => {
    return !!(entry.title || entry.date || entry.description);
  };

  const [savedEntries, setSavedEntries] = useState<AchievementEntry[]>(() => {
    if (resumeData.achievements && resumeData.achievements.length) {
      const validEntries = resumeData.achievements.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<AchievementEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyAchievement()];
    }
    return [];
  });

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.achievements) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, achievements: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  const handleChange = <K extends keyof AchievementEntry>(
    index: number,
    field: K,
    value: AchievementEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("achievement", savedEntries.length + index, field as string);
  };

  const addAchievement = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyAchievement()]);

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyAchievement()]);

    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };

  // ✅ UPDATED: Delete with API call
  const removeAchievement = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const achievementToDelete = savedEntries[index];
    const itemId = achievementToDelete._id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      console.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("achievement", index);
      reindexErrors("achievement", index);
      return;
    }

    try {
      setDeletingIndex(index);
      console.log("🗑️ Deleting achievement item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "achievements", itemId);

      console.log("✅ Achievement item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("achievement", index);
      reindexErrors("achievement", index);

    } catch (error) {
      console.error("❌ Failed to delete achievement item:", error);
      alert("Failed to delete achievement. Please try again.");
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

  const handleAIWriterClick = (editIndex: number, globalIndex: number, achievement: AchievementEntry) => {
    if (!validateRequired("achievement", globalIndex, {
      title: achievement.title,
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

    const prompt = `Generate 5 impactful unique(different) achievement description options for a resume based on the following details:

Achievement Title: ${achievement.title}

Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: achieved, earned, awarded, recognized, selected, won, received, etc.)
- Focus on quantifiable achievements, competitive metrics, and recognition significance
- Include specific metrics (e.g., "ranked top 5% nationally", "selected from 1000+ applicants", "awarded $10K scholarship")
- Highlight the competitive nature, exclusivity, or impact of the achievement
- Emphasize what makes this achievement noteworthy and impressive
- Use industry keywords for ATS optimization
- Avoid generic phrases like "received award" or "got recognition"
- Each description must be unique and emphasize different aspects: scale, competition, impact, or prestige

Formatting rules:
- Return ONLY the 5 unique(different) descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
- Start each description directly with an action verb
- Separate descriptions with a blank line

Example format:
Awarded Dean's List recognition for academic excellence, ranking in top 3% of engineering cohort of 500+ students with cumulative GPA of 3.9/4.0

Selected as one of 20 finalists from 5000+ global applicants for prestigious Google Developer Scholarship program worth $15K based on coding portfolio

Recognized with Employee of the Year award for driving 40% increase in team productivity and mentoring 8 junior developers to successful project launches`;

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
    editingEntries.forEach((achievement, idx) => {
      const el = editorRefs.current[idx];
      if (el && achievement.description && el.innerHTML !== achievement.description) {
        el.innerHTML = achievement.description;
      }
    });
  }, [editingEntries]);

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((achievement, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {achievement.title || "No title"}
                  </div>
                  
                  {achievement.date && (
                    <div className="text-xs text-gray-600">
                      {achievement.date}
                    </div>
                  )}
                  
                  {achievement.description && (
                    <div 
                      className="text-sm text-[#404040] mt-1 line-clamp-2" 
                      dangerouslySetInnerHTML={{ __html: achievement.description }} 
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
                    onClick={() => removeAchievement(index)}
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
              {editingEntries.map((achievement, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Title & Date */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Achievement Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={achievement.title}
                          placeholder="Achievement Title"
                          onChange={(e) => handleChange(editIndex, "title", e.target.value)}
                          onBlur={() => validateRequired("achievement", globalIndex, { title: achievement.title })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
                        />
                        {errors[`achievement-${globalIndex}-title`] && (
                          <span className="text-xs text-red-500">
                            {errors[`achievement-${globalIndex}-title`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Date
                        </label>
                        <input
                          type="text"
                          value={achievement.date}
                          placeholder="YYYY or Month YYYY"
                          onChange={(e) => handleChange(editIndex, "date", e.target.value)}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">
                          Achievement description
                        </label>
                        <button
                          type="button"
                          ref={(el) => {
                            buttonRefs.current[editIndex] = el;
                          }}
                          disabled={loadingIndex === editIndex}
                          onClick={() => handleAIWriterClick(editIndex, globalIndex, achievement)}
                          className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
                        >
                          <NibPenSparkleIcon className="w-4 h-4" />
                          {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
                        </button>
                      </div>

                      <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#5896d7] overflow-hidden">
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
                  onClick={addAchievement}
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
                  <p>
                    Achievements and awards demonstrate excellence and recognition in your field. Highlight specific accomplishments that set you apart from other candidates.
                  </p>
                  <p>
                    Include the achievement title, date received, and a brief description of its significance. Quantify your achievements with rankings, percentages, or competitive metrics whenever possible.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *70% of hiring managers value recognition and awards when evaluating candidates.
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

export default Achievements;
