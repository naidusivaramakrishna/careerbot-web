// import React, { useRef, useState, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";

// interface InternshipEntry {
//   company: string;role: string;startDate: string;endDate: string;currentlyWorking: boolean;description: string;
// }
// const Internships: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { loadingIndex, suggestions, activePopup, setActivePopup, generateSuggestions } =
//     useAISuggestions();
//   const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
//     useValidation();
//   const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const handleChange = (index: number, field: keyof InternshipEntry, value: string | boolean) => {
//     const updated = [...(resumeData.internships || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, internships: updated });
//     clearError("intern", index, field);
//   };
//   const addInternship = () => {
//     setResumeData({
//       ...resumeData,
//       internships: [
//         ...(resumeData.internships || []),
//         {company: "",role: "",startDate: "",endDate: "",currentlyWorking: false,description: "",},
//       ],
//     });
//   };
//   const removeInternship = (index: number) => {
//     const updated = [...(resumeData.internships || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, internships: updated });
//     clearSectionIndexErrors("intern", index);
//     reindexErrors("intern", index);
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
//       {(resumeData.internships || []).map((intern, index) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Company */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Company <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={intern.company}
//               placeholder="Enter Company"
//               onChange={(e) => handleChange(index, "company", e.target.value)}
//               onBlur={() => validateRequired("intern", index, { company: intern.company })}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`intern-${index}-company`] && (
//               <span className="text-xs text-red-500">{errors[`intern-${index}-company`]}</span>
//             )}
//           </div>
//           {/* Role */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Role <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={intern.role}
//               placeholder="Enter Role"
//               onChange={(e) => handleChange(index, "role", e.target.value)}
//               onBlur={() => validateRequired("intern", index, { role: intern.role })}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`intern-${index}-role`] && (
//               <span className="text-xs text-red-500">{errors[`intern-${index}-role`]}</span>
//             )}
//           </div>
//           {/* Dates */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">Start Date</label>
//               <input
//                 type="month"
//                 value={intern.startDate || ""}
//                 onChange={(e) => handleChange(index, "startDate", e.target.value)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               />
//             </div>
//             {!intern.currentlyWorking && (
//               <div className="flex flex-col gap-1">
//                 <label className="text-sm font-semibold text-gray-700">End Date</label>
//                 <input type="month" value={intern.endDate || ""} onChange={(e) => handleChange(index, "endDate", e.target.value)}
//                   className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//                 />
//               </div>
//             )}            
//           {/* Currently Working */}
//           <div className="flex items-center gap-2">
//             <input type="checkbox" checked={intern.currentlyWorking} onChange={(e) => handleChange(index, "currentlyWorking", e.target.checked)} className="w-4 h-4"
//             />
//             <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
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
//               value={intern.description || ""}
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
//                   !validateRequired("intern", index, {
//                     company: intern.company,
//                     role: intern.role,
//                   })
//                 )
//                   return;
//                 const prompt = `Generate 3 concise internship description options for a resume based on the following details:
// Company: ${intern.company}
// Role: ${intern.role}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense: developed, implemented, designed, optimized, etc.)
// - Focus on specific accomplishments, quantifiable results, and technical skills
// - Include relevant industry keywords for ATS optimization
// - Highlight impact and value delivered to the company
// - Avoid generic phrases like "responsible for," "helped with," or "worked on"
// - Each description should emphasize a different aspect: technical execution, business impact, or collaboration/leadership
// Formatting rules:
// - Return ONLY the 3 descriptions
// - Each description on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels
// - Start each description directly with an action verb
// - Separate descriptions with a blank line
// Example format:
// Developed a machine learning model that improved prediction accuracy by 25% using Python and TensorFlow, reducing processing time by 40%

// Collaborated with cross-functional teams to design and implement a mobile app feature that increased user engagement by 30% within the first month

// Optimized database queries and API endpoints resulting in 50% faster load times and enhanced user experience for 10,000+ daily active users`;
//                 generateSuggestions(index, prompt);
//               }}
//               className="mt-2 w-fit px-3 py-1 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 rounded-lg disabled:bg-gray-400"
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
//                     onSelect={(s) => { handleChange(index, "description", s); setActivePopup(null);}}
//                     onClose={() => setActivePopup(null)}
//                   />
//                 </div>,
//                 document.body
//               )}
//           </div>
//           {/* Remove */}
//           <button type="button"
//             onClick={() => removeInternship(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}
//       <button type="button" onClick={addInternship}
//         className="w-fit px-11 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Internship
//       </button>
//     </div>
//   );
// };
// export default Internships;

// import React, { useRef, useState, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";

// interface InternshipEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const Internships: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { loadingIndex, suggestions, activePopup, setActivePopup, generateSuggestions } =
//     useAISuggestions();
//   const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
//     useValidation();

//   const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

//   const handleChange = (index: number, field: keyof InternshipEntry, value: string | boolean) => {
//     const updated = [...(resumeData.internships || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, internships: updated });
//     clearError("intern", index, field);
//   };

//   const addInternship = () => {
//     setResumeData({
//       ...resumeData,
//       internships: [
//         ...(resumeData.internships || []),
//         {
//           company: "",
//           role: "",
//           startDate: "",
//           endDate: "",
//           currentlyWorking: false,
//           description: "",
//         },
//       ],
//     });
//   };

//   const removeInternship = (index: number) => {
//     const updated = [...(resumeData.internships || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, internships: updated });
//     clearSectionIndexErrors("intern", index);
//     reindexErrors("intern", index);
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
//       {(resumeData.internships || []).map((intern, index) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Company */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Company <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={intern.company}
//               placeholder="Enter Company"
//               onChange={(e) => handleChange(index, "company", e.target.value)}
//               onBlur={() => validateRequired("intern", index, { company: intern.company })}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`intern-${index}-company`] && (
//               <span className="text-xs text-red-500">{errors[`intern-${index}-company`]}</span>
//             )}
//           </div>

//           {/* Role */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Role <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={intern.role}
//               placeholder="Enter Role"
//               onChange={(e) => handleChange(index, "role", e.target.value)}
//               onBlur={() => validateRequired("intern", index, { role: intern.role })}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`intern-${index}-role`] && (
//               <span className="text-xs text-red-500">{errors[`intern-${index}-role`]}</span>
//             )}
//           </div>

//           {/* Dates Row (Start + End Date in one line) */}
//           <div className="flex gap-4">
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-sm font-semibold text-gray-700">Start Date</label>
//               <input
//                 type="month"
//                 value={intern.startDate || ""}
//                 onChange={(e) => handleChange(index, "startDate", e.target.value)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               />
//             </div>

//             {!intern.currentlyWorking && (
//               <div className="flex flex-col gap-1 w-1/2">
//                 <label className="text-sm font-semibold text-gray-700">End Date</label>
//                 <input
//                   type="month"
//                   value={intern.endDate || ""}
//                   onChange={(e) => handleChange(index, "endDate", e.target.value)}
//                   className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Currently Working */}
//           <div className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={intern.currentlyWorking}
//               onChange={(e) => handleChange(index, "currentlyWorking", e.target.checked)}
//               className="w-4 h-4"
//             />
//             <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
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
//               value={intern.description || ""}
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
//                     !validateRequired("intern", index, {
//                       company: intern.company,
//                       role: intern.role,
//                     })
//                   )
//                     return;

//                   const prompt = `Generate 3 concise internship description options for a resume based on the following details:
// Company: ${intern.company}
// Role: ${intern.role}

// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense: developed, implemented, designed, optimized, etc.)
// - Focus on specific accomplishments, quantifiable results, and technical skills
// - Include relevant industry keywords for ATS optimization
// - Highlight impact and value delivered to the company
// - Avoid generic phrases like "responsible for," "helped with," or "worked on"
// - Each description should emphasize a different aspect: technical execution, business impact, or collaboration/leadership

// Formatting rules:
// - Return ONLY the 3 descriptions
// - Each description on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels
// - Start each description directly with an action verb
// - Separate descriptions with a blank line

// Example format:
// Developed a machine learning model that improved prediction accuracy by 25% using Python and TensorFlow, reducing processing time by 40%

// Collaborated with cross-functional teams to design and implement a mobile app feature that increased user engagement by 30% within the first month

// Optimized database queries and API endpoints resulting in 50% faster load times and enhanced user experience for 10,000+ daily active users`;

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

//           {/* Remove */}
//           <button
//             type="button"
//             onClick={() => removeInternship(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       {/* Add Internship */}
//       <button
//         type="button"
//         onClick={addInternship}
//         className="w-fit px-11 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Internship
//       </button>
//     </div>
//   );
// };

// export default Internships; before modifying relate to workexperience



// import React, { useRef, useEffect, useState } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// import MonthYearPicker from "../MonthYearPicker";
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

// interface InternshipEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
//   location: string;
// }

// const emptyInternship = (): InternshipEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
//   location: "",
// });

// const Internships: React.FC = () => {
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

//   const hasValidData = (entry: InternshipEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<InternshipEntry[]>(() => {
//     if (resumeData.internships && resumeData.internships.length) {
//       const validEntries = resumeData.internships.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<InternshipEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyInternship()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     if (JSON.stringify(resumeData.internships) !== JSON.stringify(allEntries)) {
//       setResumeData({ ...resumeData, internships: allEntries });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof InternshipEntry>(
//     index: number,
//     field: K,
//     value: InternshipEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("internship", savedEntries.length + index, field as string);
//   };

//   const addInternship = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyInternship()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyInternship()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeInternship = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("internship", index);
//     reindexErrors("internship", index);
//   };

//   const editEntry = (index: number) => {
//     const entryToEdit = savedEntries[index];
//     const updatedSaved = [...savedEntries];
//     updatedSaved.splice(index, 1);
//     setSavedEntries(updatedSaved);
//     setEditingEntries([entryToEdit]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const exec = (idx: number, command: string, value?: string) => {
//     const editor = editorRefs.current[idx];
//     if (!editor) return;
    
//     editor.focus();
//     document.execCommand(command, false, value);
    
//     // Update the state after executing command
//     setTimeout(() => {
//       handleChange(idx, "description", editor.innerHTML || "");
//     }, 0);
//   };

//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, internship: InternshipEntry) => {
//     if (!validateRequired("internship", globalIndex, {
//       company: internship.company,
//       role: internship.role,
//     })) return;

//     // Scroll to description box within the scrollable form container
//     const descBox = descriptionRefs.current[editIndex];
//     const formContainer = formScrollRef.current;
    
//     if (descBox && formContainer) {
//       const descBoxTop = descBox.offsetTop;
//       formContainer.scrollTo({
//         top: descBoxTop - 50,
//         behavior: "smooth"
//       });
//     }

//     // Hide tips and show suggestions
//     setShowTips(false);

//     const prompt = `Generate 3 impactful internship description options for a resume based on the following details:
// Role: ${internship.role}
// Company: ${internship.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased efficiency by 30%")
// - Use industry keywords for ATS
// - Highlight learning and contributions made during internship
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//     generateSuggestions(editIndex, prompt);
//   };

//   const handleSuggestionSelect = (editIndex: number, suggestion: string) => {
//     handleChange(editIndex, "description", suggestion);
//     const el = editorRefs.current[editIndex];
//     if (el) el.innerHTML = suggestion;
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

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Saved Entries List with Add Button */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4 mt-8">
//           <div className="flex flex-col gap-4">
//             {savedEntries.map((internship, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Role - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {internship.role || "No role"}
//                   </div>
                  
//                   {/* Company */}
//                   <div className="text-sm text-gray-700">
//                     {internship.company || "No company"}
//                   </div>
                  
//                   {/* Dates */}
//                   <div className="text-xs text-gray-600">
//                     {internship.startDate ? startToLabel(internship.startDate) : ""} 
//                     {internship.startDate && " - "}
//                     {internship.currentlyWorking ? "Present" : (internship.endDate ? startToLabel(internship.endDate) : "")}
//                   </div>
                  
//                   {/* Location */}
//                   {internship.location && (
//                     <div className="text-xs text-gray-600">
//                       {internship.location}
//                     </div>
//                   )}
                  
//                   {/* Description */}
//                   {internship.description && (
//                     <div 
//                       className="text-sm text-[#404040] mt-1 line-clamp-2" 
//                       dangerouslySetInnerHTML={{ __html: internship.description }} 
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
//                     onClick={() => removeInternship(index)}
//                     className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full "
//                   >
//                     <Trash2 size={20} className="text-[#595959] hover:text-red-500"/>
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Add Button in Entry List */}
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

//       {/* Editing Form with Tips Panel */}
//       {editingEntries.length > 0 && (
//         <div className="flex gap-6 items-start">
//           {/* Left Side: Scrollable Form Fields Section */}
//           <div 
//             ref={formScrollRef}
//             className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
//           >
//             <div className="flex flex-col gap-3">
//               {editingEntries.map((internship, editIndex) => {
//                 const globalIndex = savedEntries.length + editIndex;
//                 return (
//                   <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//                     {/* Company & Role */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Company <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={internship.company}
//                           placeholder="Company"
//                           onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                           onBlur={() => validateRequired("internship", globalIndex, { company: internship.company })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`internship-${globalIndex}-company`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`internship-${globalIndex}-company`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Role or job title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={internship.role}
//                           placeholder="Role"
//                           onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                           onBlur={() => validateRequired("internship", globalIndex, { role: internship.role })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`internship-${globalIndex}-role`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`internship-${globalIndex}-role`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={internship.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       {!internship.currentlyWorking && (
//                         <div className="flex flex-col gap-1 flex-1">
//                           <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                           <MonthYearPicker
//                             value={internship.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         </div>
//                       )}

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Location</label>
//                         <input
//                           type="text"
//                           value={internship.location || ""}
//                           placeholder="City, State"
//                           onChange={(e) => handleChange(editIndex, "location", e.target.value)}
//                           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                         />
//                       </div>
//                     </div>

//                     {/* Currently Working */}
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         checked={internship.currentlyWorking}
//                         onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                         className="w-4 h-4"
//                       />
//                       <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Internship description at {internship.company || "the company"}
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, internship)}
//                           className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                         >
//                           <NibPenSparkleIcon className="w-4 h-4" />
//                           {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                         </button>
//                       </div>

//                       {/* Description Box with Toolbar Inside */}
//                       <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
//                         {/* Toolbar */}
//                         <div className="flex items-center gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "bold")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Bold"
//                           >
//                             <FaBold />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "italic")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Italic"
//                           >
//                             <FaItalic />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "underline")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Underline"
//                           >
//                             <FaUnderline />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "insertUnorderedList")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Bullet List"
//                           >
//                             <FaListUl />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "insertOrderedList")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Numbered List"
//                           >
//                             <FaListOl />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "undo")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Undo"
//                           >
//                             <FaUndoAlt />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => exec(editIndex, "redo")}
//                             className="w-7 h-7 flex items-center justify-center text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 transition"
//                             title="Redo"
//                           >
//                             <FaRedoAlt />
//                           </button>

//                           <button
//                             type="button"
//                             onClick={() => {
//                               const newState = !spellCheckEnabled;
//                               setSpellCheckEnabled(newState);
//                               const ed = editorRefs.current[editIndex];
//                               if (ed) ed.spellcheck = newState;
//                             }}
//                             className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition ${
//                               spellCheckEnabled ? "text-[#2557a7] border border-[#2557a7] bg-blue-50" : "text-gray-700"
//                             }`}
//                             title="Toggle Spellcheck"
//                           >
//                             <FaSpellCheck />
//                           </button>
//                         </div>

//                         {/* Editor */}
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

//               {/* Add Another Button in Editing Form */}
//               <div className="pt-2">
//                 <button
//                   type="button"
//                   onClick={addInternship}
//                   className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//                 >
//                   + Add Additional
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Right Side: Fixed Tips Section */}
//           <div className="w-80 flex-shrink-0 sticky top-2">
//             {showTips && activePopup === null ? (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//                 <div className="border-t border-gray-300 mb-3"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Internship experiences demonstrate initiative and practical skills. Highlight specific contributions, projects completed, and skills gained during your internship.*
//                   </p>
//                   <p>
//                     Emphasize measurable achievements and how you added value to the organization, even in a learning capacity. Use action verbs and quantify results whenever possible.
//                   </p>
//                   <p>
//                     Internships are valued by 85% of employers as relevant work experience.
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

// export default Internships; before company n roles list




import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
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


interface InternshipEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  location: string;
}


const emptyInternship = (): InternshipEntry => ({
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


const Internships: React.FC = () => {
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


  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const formScrollRef = useRef<HTMLDivElement>(null);


  const hasValidData = (entry: InternshipEntry): boolean => {
    return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description || entry.location);
  };


  const [savedEntries, setSavedEntries] = useState<InternshipEntry[]>(() => {
    if (resumeData.internships && resumeData.internships.length) {
      const validEntries = resumeData.internships.filter(hasValidData);
      return validEntries;
    }
    return [];
  });


  const [editingEntries, setEditingEntries] = useState<InternshipEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyInternship()];
    }
    return [];
  });


  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.internships) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, internships: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);


  const handleChange = <K extends keyof InternshipEntry>(
    index: number,
    field: K,
    value: InternshipEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("internship", savedEntries.length + index, field as string);
  };


  const addInternship = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);


    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }


    setEditingEntries([emptyInternship()]);


    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };


  const addNewEntry = () => {
    setEditingEntries([emptyInternship()]);


    setTimeout(() => {
      const el = editorRefs.current[0];
      if (el) el.focus();
    }, 0);
  };


  const removeInternship = (index: number) => {
    const updated = [...savedEntries];
    updated.splice(index, 1);
    setSavedEntries(updated);
    clearSectionIndexErrors("internship", index);
    reindexErrors("internship", index);
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


  const handleAIWriterClick = (editIndex: number, globalIndex: number, internship: InternshipEntry) => {
    if (!validateRequired("internship", globalIndex, {
      company: internship.company,
      role: internship.role,
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


                    const prompt = `Generate 5 concise unique(different) internship description options for a resume based on the following details:
Company: ${internship.company}
Role: ${internship.role}
Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: developed, implemented, designed, optimized, etc.)
- Focus on specific accomplishments, quantifiable results, and technical skills
- Include relevant industry keywords for ATS optimization
- Highlight impact and value delivered to the company
- Avoid generic phrases like "responsible for," "helped with," or "worked on"
- Each description should emphasize a different aspect: technical execution, business impact, or collaboration/leadership
Formatting rules:
- Return ONLY the 5 unique(different) descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels
- Start each description directly with an action verb
- Separate descriptions with a blank line
Example format:
Developed a machine learning model that improved prediction accuracy by 25% using Python and TensorFlow, reducing processing time by 40%

Collaborated with cross-functional teams to design and implement a mobile app feature that increased user engagement by 30% within the first month

Optimized database queries and API endpoints resulting in 50% faster load times and enhanced user experience for 10,000+ daily active users`;


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
    editingEntries.forEach((internship, idx) => {
      const el = editorRefs.current[idx];
      if (el && internship.description && el.innerHTML !== internship.description) {
        el.innerHTML = internship.description;
      }
    });
  }, [editingEntries]);


  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((internship, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-base font-bold text-gray-900">
                    {internship.role || "No role"}
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    {internship.company || "No company"}
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {internship.startDate ? startToLabel(internship.startDate) : ""} 
                    {internship.startDate && " - "}
                    {internship.currentlyWorking ? "Present" : (internship.endDate ? startToLabel(internship.endDate) : "")}
                  </div>
                  
                  {internship.location && (
                    <div className="text-xs text-gray-600">
                      {internship.location}
                    </div>
                  )}
                  
                  {internship.description && (
                    <div 
                      className="text-sm text-[#404040] mt-1 line-clamp-2" 
                      dangerouslySetInnerHTML={{ __html: internship.description }} 
                    />
                  )}
                </div>


                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => editEntry(index)}
                    className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full"
                  >
                    <RiEdit2Fill size={20} className="text-[#595959]"/>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeInternship(index)}
                    className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full "
                  >
                    <Trash2 size={20} className="text-[#595959] hover:text-red-500"/>
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
              {editingEntries.map((internship, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Company & Role with Autocomplete */}
                    <div className="flex gap-4">
                      <AutocompleteInput
                        label="Company"
                        required
                        value={internship.company}
                        onChange={(val) => handleChange(editIndex, "company", val)}
                        onBlur={() => validateRequired("internship", globalIndex, { company: internship.company })}
                        placeholder="Company"
                        suggestions={companies}
                        error={errors[`internship-${globalIndex}-company`]}
                      />

                      <AutocompleteInput
                        label="Role or job title"
                        required
                        value={internship.role}
                        onChange={(val) => handleChange(editIndex, "role", val)}
                        onBlur={() => validateRequired("internship", globalIndex, { role: internship.role })}
                        placeholder="Role"
                        suggestions={roles}
                        error={errors[`internship-${globalIndex}-role`]}
                      />
                    </div>


                    {/* Dates and Location */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
                        <MonthYearPicker
                          value={internship.startDate}
                          onChange={(val) => handleChange(editIndex, "startDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>


                      {!internship.currentlyWorking && (
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
                          <MonthYearPicker
                            value={internship.endDate}
                            onChange={(val) => handleChange(editIndex, "endDate", val)}
                            placeholder="MM/YY"
                          />
                        </div>
                      )}

                      <AutocompleteInput
                        label="Location"
                        value={internship.location}
                        onChange={(val) => handleChange(editIndex, "location", val)}
                        placeholder="City, State"
                        suggestions={locations}
                      />
                    </div>


                    {/* Currently Working */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={internship.currentlyWorking}
                        onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
                    </div>


                    {/* Description */}
                    <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">
                          Internship description at {internship.company || "the company"}
                        </label>
                        <button
                          type="button"
                          ref={(el) => {
                            buttonRefs.current[editIndex] = el;
                          }}
                          disabled={loadingIndex === editIndex}
                          onClick={() => handleAIWriterClick(editIndex, globalIndex, internship)}
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
                  onClick={addInternship}
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
                    Internship experiences demonstrate initiative and practical skills. Highlight specific contributions, projects completed, and skills gained during your internship.*
                  </p>
                  <p>
                    Emphasize measurable achievements and how you added value to the organization, even in a learning capacity. Use action verbs and quantify results whenever possible.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *Internships are valued by 85% of employers as relevant work experience.
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


export default Internships;


