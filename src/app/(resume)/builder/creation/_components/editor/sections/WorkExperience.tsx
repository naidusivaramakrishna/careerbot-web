// import React, { useRef, useEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// interface WorkEntry { company: string;role: string;startDate: string;endDate: string;currentlyWorking: boolean;description: string;}
// const WorkExperience: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { loadingIndex,suggestions,activePopup,setActivePopup,generateSuggestions, } = useAISuggestions();
//   // ✅ useValidation Hook
//   const { errors,validateRequired,clearError,clearSectionIndexErrors,reindexErrors, } = useValidation();
//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0, });
//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const handleChange = <K extends keyof WorkEntry>( index: number, field: K, value: WorkEntry[K] ) => {
//     const updated = [...(resumeData.workExperience || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, workExperience: updated });
//     clearError("work", index, field as string);
//   };
//   const addWork = () => {
//     setResumeData({
//       ...resumeData,
//       workExperience: [
//         ...(resumeData.workExperience || []),
//         { company: "",role: "",startDate: "",endDate: "",currentlyWorking: false,description: "", },
//       ],
//     });
//   };
//   const removeWork = (index: number) => {
//     const updated = [...(resumeData.workExperience || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, workExperience: updated });
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
//   };
//   // Position popup near clicked "Generate" button
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
//       {(resumeData.workExperience || []).map((work, index) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Company */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">
//               Company <span className="text-red-500">*</span>
//             </label>
//             <input type="text" value={work.company} placeholder="Enter Company"
//               onChange={(e) => handleChange(index, "company", e.target.value)}
//               onBlur={() =>
//                 validateRequired("work", index, { company: work.company })
//               }
//               className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
//                 errors[`work-${index}-company`]
//                   ? "border-gray-300" : "border-gray-300 hover:border-gray-700"
//               }`}
//             />
//             {errors[`work-${index}-company`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`work-${index}-company`]}
//               </span>
//             )}
//           </div>
//           {/* Role */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">
//               Role <span className="text-red-500">*</span>
//             </label>
//             <input type="text" value={work.role} placeholder="Enter Role"
//               onChange={(e) => handleChange(index, "role", e.target.value)}
//               onBlur={() => validateRequired("work", index, { role: work.role })}
//               className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
//                 errors[`work-${index}-role`]
//                   ? "border-gray-300" : "border-gray-300 hover:border-gray-700"
//               }`}
//             />
//             {errors[`work-${index}-role`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`work-${index}-role`]}
//               </span>
//             )}
//           </div>
//           {/* Start Date */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">Start Date</label>
//             <input type="month" value={work.startDate || ""}
//               onChange={(e) => handleChange(index, "startDate", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>
//           {/* End Date */}
//           {!work.currentlyWorking && (
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-semibold text-gray-700">End Date</label>
//               <input type="month" value={work.endDate || ""}
//                 onChange={(e) => handleChange(index, "endDate", e.target.value)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               />
//             </div>
//           )}
//           {/* Currently Working */}
//           <div className="flex items-center gap-2">
//             <input type="checkbox" checked={work.currentlyWorking} onChange={(e) => handleChange(index, "currentlyWorking", e.target.checked)} className="w-4 h-4"
//             />
//             <label className="text-xs font-semibold text-gray-700"> Currently Working Here </label>
//           </div>
//           {/* Description */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">
//               Description{" "} <span className="text-orange-500 text-[10px]"> &#39; Strongly Recommend for Good ATS Score &#39; </span>
//             </label>
//             <textarea
//               value={work.description || ""}
//               placeholder="Enter Description or click Generate"
//               onChange={(e) => handleChange(index, "description", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               rows={3}
//             />
//             {/* Generate Button */}
//             <button type="button"
//               ref={(el) => { buttonRefs.current[index] = el; }}
//               disabled={loadingIndex === index}
//               onClick={() => {
//                 if (
//                   !validateRequired("work", index, {
//                     company: work.company, role: work.role,
//                   })
//                 )
//                   return;
//                 const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense: led, developed, implemented, spearheaded, optimized, delivered, etc.)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include specific metrics, percentages, dollar amounts, or scale (e.g., "increased revenue by 30%", "managed team of 10", "reduced costs by $50K")
// - Use industry-relevant keywords and technical skills for ATS optimization
// - Demonstrate problem-solving, leadership, or innovation
// - Avoid generic phrases like "responsible for," "worked on," "assisted with," or "helped to"
// - Each description should highlight a different accomplishment: technical achievement, business impact, or process improvement
// Formatting rules:
// - Return ONLY the 3 descriptions
// - Each description on a new line
// - NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
// - Start each description directly with an action verb
// - Separate descriptions with a blank line
// Example format:
// Led cross-functional team of 8 engineers to deliver a customer portal that increased user retention by 45% and generated $2M in additional revenue within 6 months

// Architected and implemented microservices infrastructure using AWS and Docker, reducing deployment time by 70% and improving system uptime to 99.9%

// Optimized database queries and API performance resulting in 60% faster response times, enhancing user experience for 500K+ daily active users`;

//                 generateSuggestions(index, prompt);
//               }}
//               className="mt-2 w-fit px-3 py-1 text-xs font-medium border bg-orange-600 text-white hover:bg-orange-700 rounded-lg disabled:bg-gray-400"
//             >
//               {loadingIndex === index ? "Generating..." : "✨ Generate Description"}
//             </button>
//             {/* AI Suggestions Popup */}
//             {activePopup === index &&
//               suggestions[index] &&
//               ReactDOM.createPortal(
//                 <div
//                   className="absolute z-[9999]"
//                   style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute",}}
//                 >
//                   <AISuggestions
//                     options={suggestions[index]}
//                     onSelect={(s) => {
//                       handleChange(index, "description", s); setActivePopup(null);
//                     }}
//                     onClose={() => setActivePopup(null)}
//                   />
//                 </div>,
//                 document.body
//               )}
//           </div>
//           {/* Remove button */}
//           <button type="button" onClick={() => removeWork(index)} className="self-start text-xs text-red-500 hover:underline mt-1">
//             Remove
//           </button>
//         </div>
//       ))}
//       <button type="button" onClick={addWork} className="w-fit px-6 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600">
//         + Add Work Experience
//       </button>
//     </div>
//   );
// };
// export default WorkExperience;


// import React, { useRef, useEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const WorkExperience: React.FC = () => {
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

//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });

//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...(resumeData.workExperience || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, workExperience: updated });
//     clearError("work", index, field as string);
//   };

//   const addWork = () => {
//     setResumeData({
//       ...resumeData,
//       workExperience: [
//         ...(resumeData.workExperience || []),
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

//   const removeWork = (index: number) => {
//     const updated = [...(resumeData.workExperience || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, workExperience: updated });
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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
//       {(resumeData.workExperience || []).map((work, index) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Company */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Company <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={work.company}
//               placeholder="Enter Company"
//               onChange={(e) => handleChange(index, "company", e.target.value)}
//               onBlur={() =>
//                 validateRequired("work", index, { company: work.company })
//               }
//               className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
//                 errors[`work-${index}-company`]
//                   ? "border-gray-300"
//                   : "border-gray-300 hover:border-gray-700"
//               }`}
//             />
//             {errors[`work-${index}-company`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`work-${index}-company`]}
//               </span>
//             )}
//           </div>

//           {/* Role */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Role <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={work.role}
//               placeholder="Enter Role"
//               onChange={(e) => handleChange(index, "role", e.target.value)}
//               onBlur={() => validateRequired("work", index, { role: work.role })}
//               className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
//                 errors[`work-${index}-role`]
//                   ? "border-gray-300"
//                   : "border-gray-300 hover:border-gray-700"
//               }`}
//             />
//             {errors[`work-${index}-role`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`work-${index}-role`]}
//               </span>
//             )}
//           </div>

//           {/* Start and End Date - same line */}
//           <div className="flex gap-2">
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-sm font-semibold text-gray-700">
//                 Start Date
//               </label>
//               <input
//                 type="month"
//                 value={work.startDate || ""}
//                 onChange={(e) => handleChange(index, "startDate", e.target.value)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               />
//             </div>

//             {!work.currentlyWorking && (
//               <div className="flex flex-col gap-1 w-1/2">
//                 <label className="text-sm font-semibold text-gray-700">
//                   End Date
//                 </label>
//                 <input
//                   type="month"
//                   value={work.endDate || ""}
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
//               checked={work.currentlyWorking}
//               onChange={(e) =>
//                 handleChange(index, "currentlyWorking", e.target.checked)
//               }
//               className="w-4 h-4"
//             />
//             <label className="text-xs font-semibold text-gray-700">
//               Currently Working Here
//             </label>
//           </div>

//           {/* Description + Generate button (right aligned) */}
//           <div className="flex flex-col gap-1 relative">
//             <label className="text-sm font-semibold text-gray-700">
//               Description{" "}
//               <span className="text-blue-500 text-[10px]">
//                 &#39; Strongly Recommend for Good ATS Score &#39;
//               </span>
//             </label>
//             <textarea
//               value={work.description || ""}
//               placeholder="Enter Description or click Generate"
//               onChange={(e) => handleChange(index, "description", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               rows={5}
//             />

//             {/* Generate Button (right below textarea, right-aligned) */}
//             <div className="flex justify-end mt-3">
//               <button
//                 type="button"
//                 ref={(el) => {
//                   buttonRefs.current[index] = el;
//                 }}
//                 disabled={loadingIndex === index}
//                 onClick={() => {
//                   if (
//                     !validateRequired("work", index, {
//                       company: work.company,
//                       role: work.role,
//                     })
//                   )
//                     return;

//                   const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//                   generateSuggestions(index, prompt);
//                 }}
//                 className="w-fit px-3 py-1 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//               >
//                 {loadingIndex === index
//                   ? "Generating..."
//                   : "✨ Generate Description"}
//               </button>
//             </div>

//             {/* AI Suggestions Popup */}
//             {activePopup === index &&
//               suggestions[index] &&
//               ReactDOM.createPortal(
//                 <div
//                   className="absolute z-[9999]"
//                   style={{
//                     top: `${popupPosition.top}px`,
//                     left: `${popupPosition.left}px`,
//                     position: "absolute",
//                   }}
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

//           {/* Remove button */}
//           <button
//             type="button"
//             onClick={() => removeWork(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       {/* Add Button */}
//       <button
//         type="button"
//         onClick={addWork}
//         className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Work Experience
//       </button>
//     </div>
//   );
// };

// export default WorkExperience; before resume related changes




// WorkExperience.tsx
// import React, { useRef, useEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// import MonthYearPicker from "../MonthYearPicker"; // adjust import path if needed

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string; // store HTML from editor
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });

//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [localEntries, setLocalEntries] = useState<WorkEntry[]>(
//     () => (resumeData.workExperience && resumeData.workExperience.length ? resumeData.workExperience : [emptyWork()])
//   );

//   // sync local to global whenever localEntries changes
//   useEffect(() => {
//     setResumeData({ ...resumeData, workExperience: localEntries });
//   }, [localEntries]);

//   // ensure at least one form visible on initial open
//   useEffect(() => {
//     if (!localEntries || localEntries.length === 0) {
//       setLocalEntries([emptyWork()]);
//       setEditingIndex(0);
//       return;
//     }
//     // if entries exist, editingIndex default to 0 (open first) so form visible
//     if (editingIndex === null) setEditingIndex(0);
//   }, []);

//   useEffect(() => {
//     if (activePopup !== null && buttonRefs.current[activePopup]) {
//       const rect = buttonRefs.current[activePopup]!.getBoundingClientRect();
//       setPopupPosition({
//         top: rect.bottom + window.scrollY - 260,
//         left: rect.right + window.scrollX + 8,
//       });
//     }
//   }, [activePopup, suggestions]);

//   const handleChange = <K extends keyof WorkEntry>(index: number, field: K, value: WorkEntry[K]) => {
//     const updated = [...localEntries];
//     updated[index] = { ...updated[index], [field]: value } as WorkEntry;
//     setLocalEntries(updated);
//     clearError("work", index, field as string);
//   };

//   const addWork = () => {
//     // ensure current form saved (we already update on change), then push new blank and open it
//     setLocalEntries((prev) => {
//       const next = [...prev, emptyWork()];
//       return next;
//     });
//     setEditingIndex((prev) => {
//       const newIndex = (localEntries.length); // will be previous length
//       return newIndex;
//     });
//     // reset refs length
//     setTimeout(() => {
//       const newIdx = localEntries.length;
//       const el = editorRefs.current[newIdx];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...localEntries];
//     updated.splice(index, 1);
//     setLocalEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);

//     // adjust editing index
//     if (updated.length === 0) {
//       setLocalEntries([emptyWork()]);
//       setEditingIndex(0);
//     } else {
//       setEditingIndex((curr) => {
//         if (curr === null) return 0;
//         if (index < curr) return curr - 1;
//         if (index === curr) return Math.max(0, curr - 1);
//         return curr;
//       });
//     }
//   };

//   // editor commands
//   const exec = (command: string, value?: string) => {
//     document.execCommand(command, false, value);
//   };

//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };

//   const openEntry = (index: number) => {
//     setEditingIndex(index);
//     // focus after render
//     setTimeout(() => {
//       const ed = editorRefs.current[index];
//       if (ed) ed.focus();
//     }, 0);
//   };

//   // summary view for entries list (small preview)
//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//     const mIdx = parseInt(m,10)-1;
//     return `${monthNames[mIdx]} ${y}`;
//   }

//   return (
//     <div className="flex flex-col gap-6 ml-8 mt-3">
//       {/* Entries list + Add another below */}
//       <div className="flex flex-col gap-2">
//         {(localEntries || []).map((work, index) => (
//           <div key={index} className="flex items-start justify-between gap-2">
//             <button
//               type="button"
//               onClick={() => openEntry(index)}
//               className={`w-full text-left px-3 py-2 rounded ${editingIndex === index ? "bg-gray-50" : ""}`}
//             >
//               <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//               {work.description && (
//                 <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//               )}
//             </button>

//             <div className="flex flex-col gap-1">
//               <button
//                 type="button"
//                 onClick={() => { openEntry(index); }}
//                 className="text-xs text-blue-600 hover:underline"
//               >
//                 Edit
//               </button>
//               <button
//                 type="button"
//                 onClick={() => removeWork(index)}
//                 className="text-xs text-red-500 hover:underline"
//               >
//                 Remove
//               </button>
//             </div>
//           </div>
//         ))}

//         {/* Add another below the list */}
//         <div className="pt-2">
//           <button
//             type="button"
//             onClick={addWork}
//             className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//           >
//             + Add Work Experience
//           </button>
//         </div>
//       </div>

//       {/* Active editing form (only one) */}
//       {editingIndex !== null && localEntries[editingIndex] && (
//         <div className="flex flex-col gap-3 border-b pb-4 relative">
//           {/* Company */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Company <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={localEntries[editingIndex].company}
//               placeholder="Enter Company"
//               onChange={(e) => handleChange(editingIndex, "company", e.target.value)}
//               onBlur={() => validateRequired("work", editingIndex, { company: localEntries[editingIndex].company })}
//               className={`w-full px-3 py-2 text-sm text-black bg-transparent focus:outline-none border-b border-gray-300 ${errors[`work-${editingIndex}-company`] ? "" : "hover:border-b-2 hover:border-gray-700"} focus:border-b-2 focus:border-blue-500`}
//             />
//             {errors[`work-${editingIndex}-company`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`work-${editingIndex}-company`]}
//               </span>
//             )}
//           </div>

//           {/* Role */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Role <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={localEntries[editingIndex].role}
//               placeholder="Enter Role"
//               onChange={(e) => handleChange(editingIndex, "role", e.target.value)}
//               onBlur={() => validateRequired("work", editingIndex, { role: localEntries[editingIndex].role })}
//               className={`w-full px-3 py-2 text-sm text-black bg-transparent focus:outline-none border-b border-gray-300 ${errors[`work-${editingIndex}-role`] ? "" : "hover:border-b-2 hover:border-gray-700"} focus:border-b-2 focus:border-blue-500`}
//             />
//             {errors[`work-${editingIndex}-role`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`work-${editingIndex}-role`]}
//               </span>
//             )}
//           </div>

//           {/* Start and End Date - same line */}
//           <div className="flex gap-2">
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-sm font-semibold text-gray-700">Start Date</label>
//               <MonthYearPicker
//                 value={localEntries[editingIndex].startDate}
//                 onChange={(val) => handleChange(editingIndex, "startDate", val)}
//                 placeholder="Select month"
//               />
//             </div>

//             {!localEntries[editingIndex].currentlyWorking && (
//               <div className="flex flex-col gap-1 w-1/2">
//                 <label className="text-sm font-semibold text-gray-700">End Date</label>
//                 <MonthYearPicker
//                   value={localEntries[editingIndex].endDate}
//                   onChange={(val) => handleChange(editingIndex, "endDate", val)}
//                   placeholder="Select month"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Currently Working */}
//           <div className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={localEntries[editingIndex].currentlyWorking}
//               onChange={(e) => handleChange(editingIndex, "currentlyWorking", e.target.checked)}
//               className="w-4 h-4"
//             />
//             <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//           </div>

//           {/* Description + Generate button (right aligned) */}
//           <div className="flex flex-col gap-1 relative">
//             <label className="text-sm font-semibold text-gray-700">
//               Description{" "}
//               <span className="text-blue-500 text-[10px]">
//                 &#39; Strongly Recommend for Good ATS Score &#39;
//               </span>
//             </label>

//             {/* Toolbar */}
//             <div className="flex gap-2 items-center mb-2">
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("bold")}>B</button>
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("italic")}>I</button>
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("underline")}>U</button>
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("insertOrderedList")}>OL</button>
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("insertUnorderedList")}>UL</button>
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("undo")}>Undo</button>
//               <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("redo")}>Redo</button>
//               <label className="ml-2 text-xs">Spellcheck
//                 <input
//                   type="checkbox"
//                   defaultChecked
//                   className="ml-1"
//                   onChange={(e) => {
//                     const ed = editorRefs.current[editingIndex];
//                     if (ed) ed.spellcheck = e.target.checked;
//                   }}
//                 />
//               </label>
//             </div>

//             {/* Editor */}
//             <div
//               ref={(el) => (editorRefs.current[editingIndex] = el)}
//               contentEditable
//               suppressContentEditableWarning
//               onInput={() => onEditorInput(editingIndex)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 min-h-[120px] hover:border-gray-700 focus:outline-none"
//               dangerouslySetInnerHTML={{ __html: localEntries[editingIndex].description || "" }}
//               spellCheck
//             />

//             {/* Generate Button (right below textarea, right-aligned) */}
//             <div className="flex justify-end mt-3">
//               <button
//                 type="button"
//                 ref={(el) => {
//                   buttonRefs.current[editingIndex] = el;
//                 }}
//                 disabled={loadingIndex === editingIndex}
//                 onClick={() => {
//                   if (!validateRequired("work", editingIndex, {
//                     company: localEntries[editingIndex].company,
//                     role: localEntries[editingIndex].role,
//                   })) return;

//                   const work = localEntries[editingIndex];
//                   const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//                   generateSuggestions(editingIndex, prompt);
//                 }}
//                 className="w-fit px-3 py-1 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//               >
//                 {loadingIndex === editingIndex ? "Generating..." : "✨ Generate Description"}
//               </button>
//             </div>

//             {/* AI Suggestions Popup */}
//             {activePopup === editingIndex &&
//               suggestions[editingIndex] &&
//               ReactDOM.createPortal(
//                 <div
//                   className="absolute z-[9999]"
//                   style={{
//                     top: `${popupPosition.top}px`,
//                     left: `${popupPosition.left}px`,
//                     position: "absolute",
//                   }}
//                 >
//                   <AISuggestions
//                     options={suggestions[editingIndex]}
//                     onSelect={(s) => {
//                       handleChange(editingIndex, "description", s);
//                       const el = editorRefs.current[editingIndex];
//                       if (el) el.innerHTML = s;
//                       setActivePopup(null);
//                     }}
//                     onClose={() => setActivePopup(null)}
//                   />
//                 </div>,
//                 document.body
//               )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default WorkExperience; before perplexity 


// import React, { useRef, useEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// import MonthYearPicker from "../MonthYearPicker";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });

//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  
//   // Saved entries (list view)
//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       // Check if entries have meaningful data
//       const validEntries = resumeData.workExperience.filter(
//         (e) => e.company || e.role || e.startDate || e.endDate || e.description
//       );
//       return validEntries;
//     }
//     return [];
//   });

//   // Currently editing entries (form view)
//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     // If no saved entries, show one empty form
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   // Sync to global context whenever saved or editing entries change
//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     // Save all current editing entries to saved list
//     const validEditingEntries = editingEntries.filter(
//       (e) => e.company || e.role || e.startDate || e.endDate || e.description
//     );
    
//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     // Add new empty form
//     setEditingEntries([emptyWork()]);

//     // Focus new form
//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
//   };

//   const editEntry = (index: number) => {
//     // Move entry from saved to editing
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

//   const exec = (command: string, value?: string) => {
//     document.execCommand(command, false, value);
//   };

//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//     const mIdx = parseInt(m,10)-1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

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
//       {/* Show list view only when there are saved entries */}
//       {savedEntries.length > 0 && (
//         <div className="flex flex-col gap-2">
//           {savedEntries.map((work, index) => (
//             <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//               <div className="flex-1">
//                 <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                 {work.description && (
//                   <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                 )}
//               </div>

//               <div className="flex flex-col gap-1">
//                 <button
//                   type="button"
//                   onClick={() => editEntry(index)}
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => removeWork(index)}
//                   className="text-xs text-red-500 hover:underline"
//                 >
//                   Remove
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Show editing forms */}
//       {editingEntries.map((work, editIndex) => {
//         const globalIndex = savedEntries.length + editIndex;
//         return (
//           <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//             {/* Company */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">
//                 Company <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={work.company}
//                 placeholder="Enter Company"
//                 onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                 onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                 className={`w-full px-3 py-2 text-sm text-black bg-transparent focus:outline-none border-b border-gray-300 ${errors[`work-${globalIndex}-company`] ? "" : "hover:border-b-2 hover:border-gray-700"} focus:border-b-2 focus:border-blue-500`}
//               />
//               {errors[`work-${globalIndex}-company`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`work-${globalIndex}-company`]}
//                 </span>
//               )}
//             </div>

//             {/* Role */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">
//                 Role <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={work.role}
//                 placeholder="Enter Role"
//                 onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                 onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                 className={`w-full px-3 py-2 text-sm text-black bg-transparent focus:outline-none border-b border-gray-300 ${errors[`work-${globalIndex}-role`] ? "" : "hover:border-b-2 hover:border-gray-700"} focus:border-b-2 focus:border-blue-500`}
//               />
//               {errors[`work-${globalIndex}-role`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`work-${globalIndex}-role`]}
//                 </span>
//               )}
//             </div>

//             {/* Start and End Date */}
//             <div className="flex gap-2">
//               <div className="flex flex-col gap-1 w-1/2">
//                 <label className="text-sm font-semibold text-gray-700">Start Date</label>
//                 <MonthYearPicker
//                   value={work.startDate}
//                   onChange={(val) => handleChange(editIndex, "startDate", val)}
//                   placeholder="Select month"
//                 />
//               </div>

//               {!work.currentlyWorking && (
//                 <div className="flex flex-col gap-1 w-1/2">
//                   <label className="text-sm font-semibold text-gray-700">End Date</label>
//                   <MonthYearPicker
//                     value={work.endDate}
//                     onChange={(val) => handleChange(editIndex, "endDate", val)}
//                     placeholder="Select month"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Currently Working */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={work.currentlyWorking}
//                 onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                 className="w-4 h-4"
//               />
//               <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//             </div>

//             {/* Description */}
//             <div className="flex flex-col gap-1 relative">
//               <label className="text-sm font-semibold text-gray-700">
//                 Description{" "}
//                 <span className="text-blue-500 text-[10px]">
//                   &#39; Strongly Recommend for Good ATS Score &#39;
//                 </span>
//               </label>

//               {/* Toolbar */}
//               <div className="flex gap-2 items-center mb-2">
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("bold")}>B</button>
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("italic")}>I</button>
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("underline")}>U</button>
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("insertOrderedList")}>OL</button>
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("insertUnorderedList")}>UL</button>
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("undo")}>Undo</button>
//                 <button type="button" className="px-2 py-1 text-xs border rounded" onClick={() => exec("redo")}>Redo</button>
//                 <label className="ml-2 text-xs">Spellcheck
//                   <input
//                     type="checkbox"
//                     defaultChecked
//                     className="ml-1"
//                     onChange={(e) => {
//                       const ed = editorRefs.current[editIndex];
//                       if (ed) ed.spellcheck = e.target.checked;
//                     }}
//                   />
//                 </label>
//               </div>

//               {/* Editor */}
//               <div
//                 ref={(el) => (editorRefs.current[editIndex] = el)}
//                 contentEditable
//                 suppressContentEditableWarning
//                 onInput={() => onEditorInput(editIndex)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 min-h-[120px] hover:border-gray-700 focus:outline-none"
//                 dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                 spellCheck
//               />

//               {/* Generate Button */}
//               <div className="flex justify-end mt-3">
//                 <button
//                   type="button"
//                   ref={(el) => {
//                     buttonRefs.current[editIndex] = el;
//                   }}
//                   disabled={loadingIndex === editIndex}
//                   onClick={() => {
//                     if (!validateRequired("work", globalIndex, {
//                       company: work.company,
//                       role: work.role,
//                     })) return;

//                     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//                     generateSuggestions(editIndex, prompt);
//                   }}
//                   className="w-fit px-3 py-1 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//                 >
//                   {loadingIndex === editIndex ? "Generating..." : "✨ Generate Description"}
//                 </button>
//               </div>

//               {/* AI Suggestions Popup */}
//               {activePopup === editIndex &&
//                 suggestions[editIndex] &&
//                 ReactDOM.createPortal(
//                   <div
//                     className="absolute z-[9999]"
//                     style={{
//                       top: `${popupPosition.top}px`,
//                       left: `${popupPosition.left}px`,
//                       position: "absolute",
//                     }}
//                   >
//                     <AISuggestions
//                       options={suggestions[editIndex]}
//                       onSelect={(s) => {
//                         handleChange(editIndex, "description", s);
//                         const el = editorRefs.current[editIndex];
//                         if (el) el.innerHTML = s;
//                         setActivePopup(null);
//                       }}
//                       onClose={() => setActivePopup(null)}
//                     />
//                   </div>,
//                   document.body
//                 )}
//             </div>
//           </div>
//         );
//       })}

//       {/* Add Another Button - bottom left */}
//       <div className="pt-2">
//         <button
//           type="button"
//           onClick={addWork}
//           className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//         >
//           + Add Work Experience
//         </button>
//       </div>
//     </div>
//   );
// };

// export default WorkExperience;  with working code




// import React, { useRef, useEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useAISuggestions } from "../../../_hooks/useAISuggestions";
// import { useValidation } from "../../../_hooks/useValidation";
// import AISuggestions from "../AISuggestions";
// import MonthYearPicker from "../MonthYearPicker";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });

//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  
//   // Helper function to check if entry has meaningful data
//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   // Saved entries (list view)
//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   // Currently editing entries (form view)
//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     // If no saved entries, show one empty form
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   // Sync to global context whenever saved or editing entries change
//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     // Only save current editing entries if they have valid data
//     const validEditingEntries = editingEntries.filter(hasValidData);
    
//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     // Clear editing entries and add new empty form
//     setEditingEntries([emptyWork()]);

//     // Focus new form
//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
//   };

//   const editEntry = (index: number) => {
//     // Move entry from saved to editing
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

//   const exec = (command: string, value?: string) => {
//     document.execCommand(command, false, value);
//   };

//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//     const mIdx = parseInt(m,10)-1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

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
//       {/* Show list view only when there are saved entries AND no editing entries */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-2">
//           {savedEntries.map((work, index) => (
//             <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//               <div className="flex-1">
//                 <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                 {work.description && (
//                   <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                 )}
//               </div>

//               <div className="flex flex-col gap-1">
//                 <button
//                   type="button"
//                   onClick={() => editEntry(index)}
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => removeWork(index)}
//                   className="text-xs text-red-500 hover:underline"
//                 >
//                   Remove
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Show editing forms */}
//       {editingEntries.map((work, editIndex) => {
//         const globalIndex = savedEntries.length + editIndex;
//         return (
//           <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//             {/* Company */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">
//                 Company <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={work.company}
//                 placeholder="Enter Company"
//                 onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                 onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                 className={`w-full px-3 py-2 text-sm text-black bg-transparent focus:outline-none border-b border-gray-300 ${errors[`work-${globalIndex}-company`] ? "" : "hover:border-b-2 hover:border-gray-700"} focus:border-b-2 focus:border-blue-500`}
//               />
//               {errors[`work-${globalIndex}-company`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`work-${globalIndex}-company`]}
//                 </span>
//               )}
//             </div>

//             {/* Role */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">
//                 Role <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={work.role}
//                 placeholder="Enter Role"
//                 onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                 onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                 className={`w-full px-3 py-2 text-sm text-black bg-transparent focus:outline-none border-b border-gray-300 ${errors[`work-${globalIndex}-role`] ? "" : "hover:border-b-2 hover:border-gray-700"} focus:border-b-2 focus:border-blue-500`}
//               />
//               {errors[`work-${globalIndex}-role`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`work-${globalIndex}-role`]}
//                 </span>
//               )}
//             </div>

//             {/* Start and End Date */}
//             <div className="flex gap-2">
//               <div className="flex flex-col gap-1 w-1/2">
//                 <label className="text-sm font-semibold text-gray-700">Start Date</label>
//                 <MonthYearPicker
//                   value={work.startDate}
//                   onChange={(val) => handleChange(editIndex, "startDate", val)}
//                   placeholder="Select month"
//                 />
//               </div>

//               {!work.currentlyWorking && (
//                 <div className="flex flex-col gap-1 w-1/2">
//                   <label className="text-sm font-semibold text-gray-700">End Date</label>
//                   <MonthYearPicker
//                     value={work.endDate}
//                     onChange={(val) => handleChange(editIndex, "endDate", val)}
//                     placeholder="Select month"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Currently Working */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={work.currentlyWorking}
//                 onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                 className="w-4 h-4"
//               />
//               <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//             </div>

//             {/* Description */}
//             <div className="flex flex-col gap-1 relative">
//               <label className="text-sm font-semibold text-gray-700">
//                 Description{" "}
//                 <span className="text-blue-500 text-[10px]">
//                   ' Strongly Recommend for Good ATS Score '
//                 </span>
//               </label>

//               {/* Toolbar */}
//               <div className="flex gap-2 items-center mb-2 border border-gray-100 hover:border-blue-500 text-blue-500">
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("bold")}>B</button>
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("italic")}>I</button>
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("underline")}>U</button>
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("insertOrderedList")}>OL</button>
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("insertUnorderedList")}>UL</button>
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("undo")}>Undo</button>
//                 <button type="button" className="px-2 py-1 text-xs  rounded" onClick={() => exec("redo")}>Redo</button>
//                 <label className="ml-2 text-xs">Spellcheck
//                   <input
//                     type="checkbox"
//                     defaultChecked
//                     className="ml-1"
//                     onChange={(e) => {
//                       const ed = editorRefs.current[editIndex];
//                       if (ed) ed.spellcheck = e.target.checked;
//                     }}
//                   />
//                 </label>
//               </div>

//               {/* Editor */}
//               <div
//                 ref={(el) => (editorRefs.current[editIndex] = el)}
//                 contentEditable
//                 suppressContentEditableWarning
//                 onInput={() => onEditorInput(editIndex)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 min-h-[120px] hover:border-gray-700 focus:outline-none"
//                 dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                 spellCheck
//               />

//               {/* Generate Button */}
//               <div className="flex justify-end mt-3">
//                 <button
//                   type="button"
//                   ref={(el) => {
//                     buttonRefs.current[editIndex] = el;
//                   }}
//                   disabled={loadingIndex === editIndex}
//                   onClick={() => {
//                     if (!validateRequired("work", globalIndex, {
//                       company: work.company,
//                       role: work.role,
//                     })) return;

//                     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//                     generateSuggestions(editIndex, prompt);
//                   }}
//                   className="w-fit px-3 py-1 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//                 >
//                   {loadingIndex === editIndex ? "Generating..." : "✨ Generate Description"}
//                 </button>
//               </div>

//               {/* AI Suggestions Popup */}
//               {activePopup === editIndex &&
//                 suggestions[editIndex] &&
//                 ReactDOM.createPortal(
//                   <div
//                     className="absolute z-[9999]"
//                     style={{
//                       top: `${popupPosition.top}px`,
//                       left: `${popupPosition.left}px`,
//                       position: "absolute",
//                     }}
//                   >
//                     <AISuggestions
//                       options={suggestions[editIndex]}
//                       onSelect={(s) => {
//                         handleChange(editIndex, "description", s);
//                         const el = editorRefs.current[editIndex];
//                         if (el) el.innerHTML = s;
//                         setActivePopup(null);
//                       }}
//                       onClose={() => setActivePopup(null)}
//                     />
//                   </div>,
//                   document.body
//                 )}
//             </div>
//           </div>
//         );
//       })}

//       {/* Add Another Button - bottom left */}
//       <div className="pt-2">
//         <button
//           type="button"
//           onClick={addWork}
//           className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//         >
//           + Add Work Experience
//         </button>
//       </div>
//     </div>
//   );
// };

// export default WorkExperience;

 


// import React, { useRef, useEffect, useState } from "react";
// import ReactDOM from "react-dom";
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

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
//     top: 0,
//     left: 0,
//   });

//   const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
//   const editorRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const exec = (command: string, value?: string) => {
//     document.execCommand(command, false, value);
//   };

//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//     const mIdx = parseInt(m,10)-1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

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
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-2">
//           {savedEntries.map((work, index) => (
//             <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//               <div className="flex-1">
//                 <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                 {work.description && (
//                   <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                 )}
//               </div>

//               <div className="flex flex-col gap-1">
//                 <button
//                   type="button"
//                   onClick={() => editEntry(index)}
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => removeWork(index)}
//                   className="text-xs text-red-500 hover:underline"
//                 >
//                   Remove
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {editingEntries.map((work, editIndex) => {
//         const globalIndex = savedEntries.length + editIndex;
//         return (
//           <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//             {/* Company */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">
//                 Company <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={work.company}
//                 placeholder="Enter Company"
//                 onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                 onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                 className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] focus:outline-none ${errors[`work-${globalIndex}-company`] } focus:border-b-2 focus:border-blue-500`}
//               />
//               {errors[`work-${globalIndex}-company`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`work-${globalIndex}-company`]}
//                 </span>
//               )}
//             </div>

//             {/* Role */}
//             <div className="flex flex-col gap-1">
//               <label className="text-sm font-semibold text-gray-700">
//                 Role <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={work.role}
//                 placeholder="Enter Role"
//                 onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                 onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                 className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] focus:outline-none ${errors[`work-${globalIndex}-role`] } focus:border-b-2 focus:border-blue-500`}
//               />
//               {errors[`work-${globalIndex}-role`] && (
//                 <span className="text-xs text-red-500">
//                   {errors[`work-${globalIndex}-role`]}
//                 </span>
//               )}
//             </div>

//             {/* Dates */}
//             <div className="flex gap-2">
//               <div className="flex flex-col gap-1 w-1/2">
//                 <label className="text-sm font-semibold text-gray-700">Start Date</label>
//                 <MonthYearPicker
//                   value={work.startDate}
//                   onChange={(val) => handleChange(editIndex, "startDate", val)}
//                   placeholder="Select month"
//                 />
//               </div>

//               {!work.currentlyWorking && (
//                 <div className="flex flex-col gap-1 w-1/2">
//                   <label className="text-sm font-semibold text-gray-700">End Date</label>
//                   <MonthYearPicker
//                     value={work.endDate}
//                     onChange={(val) => handleChange(editIndex, "endDate", val)}
//                     placeholder="Select month"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Currently Working */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={work.currentlyWorking}
//                 onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                 className="w-4 h-4"
//               />
//               <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//             </div>

//             {/* Description */}
//             <div className="flex flex-col gap-1 relative">
//               <label className="text-sm font-semibold text-gray-700">
//                 Description{" "}
//                 <span className="text-blue-500 text-[10px]">
//                   Strongly Recommend for Good ATS Score
//                 </span>
//               </label>

//               {/* ✅ Updated Toolbar */}
//               <div className="flex items-center gap-2 mb-2 flex-wrap">
//                 {[
//                   { icon: <FaBold />, cmd: "bold" },
//                   { icon: <FaItalic />, cmd: "italic" },
//                   { icon: <FaUnderline />, cmd: "underline" },
//                   { icon: <FaListOl />, cmd: "insertOrderedList" },
//                   { icon: <FaListUl />, cmd: "insertUnorderedList" },
//                   { icon: <FaUndoAlt />, cmd: "undo" },
//                   { icon: <FaRedoAlt />, cmd: "redo" },
//                 ].map((btn, i) => (
//                   <button
//                     key={i}
//                     type="button"
//                     onClick={() => exec(btn.cmd)}
//                     className="w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                   >
//                     {btn.icon}
//                   </button>
//                 ))}

//                 <label className="flex items-center gap-1 ml-3 text-xs text-gray-700">
//                   <FaSpellCheck onChange={(e) => {
//                       const ed = editorRefs.current[editIndex];
//                       if (ed) ed.spellcheck = e.target.checked;
//                     }}/>
//                   {/* <input
//                     type="checkbox"
//                     defaultChecked
//                     className="w-3 h-3 accent-blue-500"
//                     onChange={(e) => {
//                       const ed = editorRefs.current[editIndex];
//                       if (ed) ed.spellcheck = e.target.checked;
//                     }}
//                   />
//                   Spellcheck */}
//                 </label>
//               </div>

//               {/* Editor */}
//               <div
//                 ref={(el) => (editorRefs.current[editIndex] = el)}
//                 contentEditable
//                 suppressContentEditableWarning
//                 onInput={() => onEditorInput(editIndex)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 min-h-[120px] hover:border-gray-700 focus:outline-none"
//                 dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                 spellCheck
//               />

//               {/* Generate Button */}
//               <div className="flex justify-end mt-3">
//                 <button
//                   type="button"
//                   ref={(el) => {
//                     buttonRefs.current[editIndex] = el;
//                   }}
//                   disabled={loadingIndex === editIndex}
//                   onClick={() => {
//                     if (!validateRequired("work", globalIndex, {
//                       company: work.company,
//                       role: work.role,
//                     })) return;

//                     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//                     generateSuggestions(editIndex, prompt);
//                   }}
//                   className="w-fit px-3 py-1 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400"
//                 >
//                   {loadingIndex === editIndex ? "Generating..." : "✨ Generate Description"}
//                 </button>
//               </div>

//               {activePopup === editIndex &&
//                 suggestions[editIndex] &&
//                 ReactDOM.createPortal(
//                   <div
//                     className="absolute z-[9999]"
//                     style={{
//                       top: `${popupPosition.top}px`,
//                       left: `${popupPosition.left}px`,
//                       position: "absolute",
//                     }}
//                   >
//                     <AISuggestions
//                       options={suggestions[editIndex]}
//                       onSelect={(s) => {
//                         handleChange(editIndex, "description", s);
//                         const el = editorRefs.current[editIndex];
//                         if (el) el.innerHTML = s;
//                         setActivePopup(null);
//                       }}
//                       onClose={() => setActivePopup(null)}
//                     />
//                   </div>,
//                   document.body
//                 )}
//             </div>
//           </div>
//         );
//       })}

//       {/* Add Another Button */}
//       <div className="pt-2">
//         <button
//           type="button"
//           onClick={addWork}
//           className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//         >
//           + Add Work Experience
//         </button>
//       </div>
//     </div>
//   );
// };

// export default WorkExperience; before tips


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
// import { PiPencilLineFill } from "react-icons/pi";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const editorRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const exec = (command: string, value?: string) => {
//     document.execCommand(command, false, value);
//   };

//   const onEditorInput = (idx: number) => {
//     const el = editorRefs.current[idx];
//     if (!el) return;
//     handleChange(idx, "description", el.innerHTML || "");
//   };

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   return (
//     <div className="flex gap-6 ml-8 mt-3 items-start">
//       {/* Left Side: Form */}
//       <div className="flex flex-col gap-6 flex-1">
//         {savedEntries.length > 0 && editingEntries.length === 0 && (
//           <div className="flex flex-col gap-2">
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//                 <div className="flex-1">
//                   <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                   {work.description && (
//                     <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-1">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="text-xs text-blue-600 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeWork(index)}
//                     className="text-xs text-red-500 hover:underline"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {editingEntries.map((work, editIndex) => {
//           const globalIndex = savedEntries.length + editIndex;
//           return (
//             <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//               {/* Company */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-sm font-semibold text-gray-700">
//                   Employer <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={work.company}
//                   placeholder="Company A"
//                   onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                   onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                   className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] focus:outline-none ${errors[`work-${globalIndex}-company`]} focus:border-b-2 focus:border-blue-500`}
//                 />
//                 {errors[`work-${globalIndex}-company`] && (
//                   <span className="text-xs text-red-500">
//                     {errors[`work-${globalIndex}-company`]}
//                   </span>
//                 )}
//               </div>

//               {/* Role */}
//               <div className="flex flex-col gap-1">
//                 <label className="text-sm font-semibold text-gray-700">
//                   Role or job title <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={work.role}
//                   placeholder="Sales Representative"
//                   onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                   onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                   className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] focus:outline-none ${errors[`work-${globalIndex}-role`]} focus:border-b-2 focus:border-blue-500`}
//                 />
//                 {errors[`work-${globalIndex}-role`] && (
//                   <span className="text-xs text-red-500">
//                     {errors[`work-${globalIndex}-role`]}
//                   </span>
//                 )}
//               </div>

//               {/* Dates */}
//               <div className="flex gap-2">
//                 <div className="flex flex-col gap-1 flex-1">
//                   <label className="text-sm font-semibold text-gray-700">Start & end date</label>
//                   <div className="flex gap-2">
//                     <MonthYearPicker
//                       value={work.startDate}
//                       onChange={(val) => handleChange(editIndex, "startDate", val)}
//                       placeholder="MM/YY"
//                     />
//                     {!work.currentlyWorking && (
//                       <MonthYearPicker
//                         value={work.endDate}
//                         onChange={(val) => handleChange(editIndex, "endDate", val)}
//                         placeholder="MM/YY"
//                       />
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-1 flex-1">
//                   <label className="text-sm font-semibold text-gray-700">Location</label>
//                   <input
//                     type="text"
//                     placeholder="City, State"
//                     className="w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] focus:outline-none focus:border-b-2 focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               {/* Currently Working */}
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={work.currentlyWorking}
//                   onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                   className="w-4 h-4"
//                 />
//                 <label className="text-xs font-semibold text-gray-700">I currently work here</label>
//               </div>

//               {/* Description */}
//               <div className="flex flex-col gap-1 relative">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-semibold text-gray-700">
//                     Work description at the company
//                   </label>
//                   <button
//                     type="button"
//                     disabled={loadingIndex === editIndex}
//                     onClick={() => {
//                       if (!validateRequired("work", globalIndex, {
//                         company: work.company,
//                         role: work.role,
//                       })) return;

//                       const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
// Formatting rules:
// Return ONLY the 3 descriptions on separate lines with a blank line between each.`;

//                       generateSuggestions(editIndex, prompt);
//                       setActivePopup(editIndex);
//                     }}
//                     className="flex items-center gap-1 px-3 py-1 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                   >
//                     <PiPencilLineFill className="w-4 h-4" />
//                     {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                   </button>
//                 </div>

//                 {/* Toolbar */}
//                 <div className="flex items-center gap-2 mb-2 flex-wrap">
//                   {[
//                     { icon: <FaBold />, cmd: "bold" },
//                     { icon: <FaItalic />, cmd: "italic" },
//                     { icon: <FaListUl />, cmd: "insertUnorderedList" },
//                     { icon: <FaListOl />, cmd: "insertOrderedList" },
//                     { icon: <FaUnderline />, cmd: "underline" },
//                     { icon: <FaUndoAlt />, cmd: "undo" },
//                     { icon: <FaRedoAlt />, cmd: "redo" },
//                   ].map((btn, i) => (
//                     <button
//                       key={i}
//                       type="button"
//                       onClick={() => exec(btn.cmd)}
//                       className="w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     >
//                       {btn.icon}
//                     </button>
//                   ))}

//                   <button
//                     type="button"
//                     className="w-8 h-8 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                   >
//                     <FaSpellCheck />
//                   </button>
//                 </div>

//                 {/* Editor */}
//                 <div
//                   ref={(el) => (editorRefs.current[editIndex] = el)}
//                   contentEditable
//                   suppressContentEditableWarning
//                   onInput={() => onEditorInput(editIndex)}
//                   className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 min-h-[120px] hover:border-gray-700 focus:outline-none"
//                   dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                   spellCheck
//                 />
//               </div>
//             </div>
//           );
//         })}

//         {/* Add Another Button */}
//         <div className="pt-2">
//           <button
//             type="button"
//             onClick={addWork}
//             className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//           >
//             + Add Additional
//           </button>
//         </div>
//       </div>

//       {/* Right Side: Tips Panel or AI Suggestions */}
//       <div className="w-80 flex-shrink-0">
//         {activePopup !== null && suggestions[activePopup] ? (
//           <AISuggestions
//             options={suggestions[activePopup]}
//             onSelect={(s) => {
//               handleChange(activePopup, "description", s);
//               const el = editorRefs.current[activePopup];
//               if (el) el.innerHTML = s;
//               setActivePopup(null);
//             }}
//             onClose={() => setActivePopup(null)}
//           />
//         ) : (
//           <div className="bg-[#faf9f8] rounded-lg p-5 sticky top-6">
//             <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//             <div className="border-t border-gray-300 mb-4"></div>
//             <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//               <p>
//                 Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume*. Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//               </p>
//               <p className="text-xs text-gray-500 italic mt-6">
//                 *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default WorkExperience;


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
// import { PiPenNibStraightFill } from "react-icons/pi";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
//     })) return;

//     // Scroll to description box
//     const descBox = descriptionRefs.current[editIndex];
//     if (descBox) {
//       descBox.scrollIntoView({ behavior: "smooth", block: "center" });
//     }

//     // Hide tips and show suggestions
//     setShowTips(false);

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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

//     // Scroll to top
//     setTimeout(() => {
//       if (containerRef.current) {
//         containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
//       }
//     }, 100);
//   };

//   return (
//     <div ref={containerRef} className="flex gap-6 ml-6 mt-3 items-start">
//       {/* Left Side: Form Fields */}
//       <div className="flex flex-col gap-3 flex-1 mt-10">
//       <div className="flex flex-col gap-6 flex-1">
//         {savedEntries.length > 0 && editingEntries.length === 0 && (
//           <div className="flex flex-col gap-2">
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//                 <div className="flex-1">
//                   <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                   {work.description && (
//                     <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-1">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="text-xs text-blue-600 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeWork(index)}
//                     className="text-xs text-red-500 hover:underline"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {editingEntries.map((work, editIndex) => {
//           const globalIndex = savedEntries.length + editIndex;
//           return (
//             <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//               {/* Company & Role */}
//               <div className="flex gap-4">
//                 <div className="flex flex-col gap-1 flex-1">
//                   <label className="text-sm font-semibold text-gray-700">
//                     Employer <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={work.company}
//                     placeholder="Company A"
//                     onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                     onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                     className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                   />
//                   {errors[`work-${globalIndex}-company`] && (
//                     <span className="text-xs text-red-500">
//                       {errors[`work-${globalIndex}-company`]}
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-1 flex-1">
//                   <label className="text-sm font-semibold text-gray-700">
//                     Role or job title <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={work.role}
//                     placeholder="Sales Representative"
//                     onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                     onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                     className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                   />
//                   {errors[`work-${globalIndex}-role`] && (
//                     <span className="text-xs text-red-500">
//                       {errors[`work-${globalIndex}-role`]}
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {/* Dates */}
//               <div className="flex gap-4">
//                 <div className="flex flex-col gap-1 flex-1">
//                   <label className="text-sm font-semibold text-gray-700">Start & end date</label>
//                   <div className="flex gap-2">
//                     <MonthYearPicker
//                       value={work.startDate}
//                       onChange={(val) => handleChange(editIndex, "startDate", val)}
//                       placeholder="MM/YY"
//                     />
                    
//                     {!work.currentlyWorking && (
//                       <MonthYearPicker
//                         value={work.endDate}
//                         onChange={(val) => handleChange(editIndex, "endDate", val)}
//                         placeholder="MM/YY"
//                       />
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex flex-col gap-1 flex-1">
//                   <label className="text-sm font-semibold text-gray-700">Location</label>
//                   <input
//                     type="text"
//                     placeholder="City, State"
//                     className="w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                   />
//                 </div>
//               </div>

//               {/* Currently Working */}
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={work.currentlyWorking}
//                   onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                   className="w-4 h-4"
//                 />
//                 <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//               </div>

//               {/* Description */}
//               <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                 <div className="flex justify-between items-center">
//                   <label className="text-sm font-semibold  text-gray-700">
//                     Work description at the company
//                   </label>
//                   <button
//                     type="button"
//                     ref={(el) => {
//                       buttonRefs.current[editIndex] = el;
//                     }}
//                     disabled={loadingIndex === editIndex}
//                     onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                   >
//                     <PiPenNibStraightFill className="w-4 h-4" />
//                     {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                   </button>
//                 </div>

//                 {/* Toolbar */}
//                 <div className="flex items-center gap-1 mt-2 flex-wrap">
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "bold")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Bold"
//                   >
//                     <FaBold />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "italic")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Italic"
//                   >
//                     <FaItalic />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "underline")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Underline"
//                   >
//                     <FaUnderline />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "insertUnorderedList")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Bullet List"
//                   >
//                     <FaListUl />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "insertOrderedList")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Numbered List"
//                   >
//                     <FaListOl />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "indent")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Indent"
//                   >
//                     <FaUndoAlt />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => exec(editIndex, "redo")}
//                     className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                     title="Redo"
//                   >
//                     <FaRedoAlt />
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => {
//                       const newState = !spellCheckEnabled;
//                       setSpellCheckEnabled(newState);
//                       const ed = editorRefs.current[editIndex];
//                       if (ed) ed.spellcheck = newState;
//                     }}
//                     className={`w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 shadow-sm transition ${
//                       spellCheckEnabled ? "text-blue-600 bg-blue-50" : "text-gray-700"
//                     }`}
//                     title="Toggle Spellcheck"
//                   >
//                     <FaSpellCheck />
//                   </button>
//                 </div>

//                 {/* Editor */}
//                 <div
//                   ref={(el) => (editorRefs.current[editIndex] = el)}
//                   contentEditable
//                   suppressContentEditableWarning
//                   onInput={() => onEditorInput(editIndex)}
//                   className="w-full px-3 py-2 border rounded-lg text-sm text-black bg-[#faf9f8] min-h-[120px] hover:bg-[#f3f2f1] focus:outline-none mt-2"
//                   dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                   spellCheck={spellCheckEnabled}
//                 />
//               </div>
//             </div>
//           );
//         })}

//         {/* Add Another Button */}
//         <div className="pt-2">
//           <button
//             type="button"
//             onClick={addWork}
//             className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//           >
//             + Add Additional
//           </button>
//         </div>
//       </div>
//         </div>
//       {/* Right Side: Tips or AI Suggestions */}
//       <div className="w-80 flex-shrink-0 mt-2">
//         {showTips && activePopup === null ? (
//           <div className="bg-[#faf9f8] rounded-lg p-5">
//             <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//             <div className="border-t border-gray-300 mb-4"></div>
//             <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//               <p>
//                 Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//               </p>
//               <p>
//                 Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//               </p>
//               <p className="text-xs text-gray-500 italic mt-6">
//                 *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
//               </p>
//             </div>
//           </div>
//         ) : (
//           activePopup !== null && suggestions[activePopup] && (
//             <AISuggestions
//               options={suggestions[activePopup]}
//               onSelect={(s) => handleSuggestionSelect(activePopup, s)}
//               onClose={() => {
//                 setActivePopup(null);
//                 setShowTips(true);
//               }}
//             />
//           )
//         )}
//       </div>
//     </div>
//   );
// };

// export default WorkExperience; before tip remove beside entry list


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
// import { PiPenNibStraightFill } from "react-icons/pi";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
//     })) return;

//     // Scroll to description box
//     const descBox = descriptionRefs.current[editIndex];
//     if (descBox) {
//       descBox.scrollIntoView({ behavior: "smooth", block: "center" });
//     }

//     // Hide tips and show suggestions
//     setShowTips(false);

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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

//     // Scroll to top
//     setTimeout(() => {
//       if (containerRef.current) {
//         containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
//       }
//     }, 100);
//   };

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Saved Entries List with Add Button */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4">
//           <div className="flex flex-col gap-2">
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//                 <div className="flex-1">
//                   <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                   {work.description && (
//                     <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-1">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="text-xs text-blue-600 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeWork(index)}
//                     className="text-xs text-red-500 hover:underline"
//                   >
//                     Remove
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
//               className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//             >
//               + Add Additional
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Editing Form with Tips Panel */}
//       {editingEntries.length > 0 && (
//         <div className="flex gap-6 items-start">
//           {/* Left Side: Form Fields */}
//       <div className="flex flex-col gap-3 flex-1 mt-10 ">
//           <div className="flex flex-col gap-3 flex-1">
//             {editingEntries.map((work, editIndex) => {
//               const globalIndex = savedEntries.length + editIndex;
//               return (
//                 <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//                   {/* Company & Role */}
//                   <div className="flex gap-4">
//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Employer <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={work.company}
//                         placeholder="Company A"
//                         onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                         onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                         className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                       />
//                       {errors[`work-${globalIndex}-company`] && (
//                         <span className="text-xs text-red-500">
//                           {errors[`work-${globalIndex}-company`]}
//                         </span>
//                       )}
//                     </div>

//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Role or job title <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={work.role}
//                         placeholder="Sales Representative"
//                         onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                         onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                         className={`w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                       />
//                       {errors[`work-${globalIndex}-role`] && (
//                         <span className="text-xs text-red-500">
//                           {errors[`work-${globalIndex}-role`]}
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Dates */}
//                   <div className="flex gap-4">
//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">Start & end date</label>
//                       <div className="flex gap-2">
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
                        
//                         {!work.currentlyWorking && (
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">Location</label>
//                       <input
//                         type="text"
//                         placeholder="City, State"
//                         className="w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                       />
//                     </div>
//                   </div>

//                   {/* Currently Working */}
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="checkbox"
//                       checked={work.currentlyWorking}
//                       onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                       className="w-4 h-4"
//                     />
//                     <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                   </div>

//                   {/* Description */}
//                   <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                     <div className="flex justify-between items-center">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Work description at {work.company}
//                       </label>
//                       <button
//                         type="button"
//                         ref={(el) => {
//                           buttonRefs.current[editIndex] = el;
//                         }}
//                         disabled={loadingIndex === editIndex}
//                         onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                         className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                       >
//                         <PiPenNibStraightFill className="w-4 h-4" />
//                         {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                       </button>
//                     </div>

//                     {/* Toolbar */}
//                     <div className="flex items-center gap-1 mt-2 flex-wrap">
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "bold")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Bold"
//                       >
//                         <FaBold />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "italic")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Italic"
//                       >
//                         <FaItalic />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "underline")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Underline"
//                       >
//                         <FaUnderline />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "insertUnorderedList")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Bullet List"
//                       >
//                         <FaListUl />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "insertOrderedList")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Numbered List"
//                       >
//                         <FaListOl />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "undo")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Undo"
//                       >
//                         <FaUndoAlt />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "redo")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Redo"
//                       >
//                         <FaRedoAlt />
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => {
//                           const newState = !spellCheckEnabled;
//                           setSpellCheckEnabled(newState);
//                           const ed = editorRefs.current[editIndex];
//                           if (ed) ed.spellcheck = newState;
//                         }}
//                         className={`w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 shadow-sm transition ${
//                           spellCheckEnabled ? "text-blue-600 bg-blue-50" : "text-gray-700"
//                         }`}
//                         title="Toggle Spellcheck"
//                       >
//                         <FaSpellCheck />
//                       </button>
//                     </div>

//                     {/* Editor */}
//                     <div
//                       ref={(el) => (editorRefs.current[editIndex] = el)}
//                       contentEditable
//                       suppressContentEditableWarning
//                       onInput={() => onEditorInput(editIndex)}
//                       className="w-full px-3 py-2  rounded-lg text-sm text-black bg-[#faf9f8] min-h-[120px] hover:bg-[#f3f2f1] focus:outline-none mt-2"
//                       dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                       spellCheck={spellCheckEnabled}
//                     />
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Add Another Button in Editing Form */}
//             <div className="pt-2">
//               <button
//                 type="button"
//                 onClick={addWork}
//                 className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//               >
//                 + Add Additional
//               </button>
//             </div>
//           </div>
//             </div>
//           {/* Right Side: Tips or AI Suggestions */}
//           <div className="w-80 flex-shrink-0 mt-2">
//             {showTips && activePopup === null ? (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//                 <div className="border-t border-gray-300 mb-4"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
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

// export default WorkExperience; before tips fixed


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
// import { PiPenNibStraightFill } from "react-icons/pi";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
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

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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
//         <div className="flex flex-col gap-4">
//           <div className="flex flex-col gap-2">
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//                 <div className="flex-1">
//                   <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                   {work.description && (
//                     <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-1">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="text-xs text-blue-600 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeWork(index)}
//                     className="text-xs text-red-500 hover:underline"
//                   >
//                     Remove
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
//               className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//             >
//               + Add Additional
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Editing Form with Tips Panel */}
//       {editingEntries.length > 0 && (
//         <div className="flex gap-6 items-start">
//           {/* Left Side: Form Fields */}
//       <div className="flex flex-col gap-3 flex-1 mt-10 
      
//       ">
//           <div 
//             ref={formScrollRef}
//             className="flex flex-col gap-3 flex-1 max-h-[calc(100vh-150px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
//           >
//             {editingEntries.map((work, editIndex) => {
//               const globalIndex = savedEntries.length + editIndex;
//               return (
//                 <div key={`edit-${editIndex}`} className="flex flex-col gap-3 border-b pb-4 relative">
//                   {/* Company & Role */}
//                   <div className="flex gap-4">
//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Employer <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={work.company}
//                         placeholder="Company A"
//                         onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                         onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                         className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                       />
//                       {errors[`work-${globalIndex}-company`] && (
//                         <span className="text-xs text-red-500">
//                           {errors[`work-${globalIndex}-company`]}
//                         </span>
//                       )}
//                     </div>

//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Role or job title <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={work.role}
//                         placeholder="Sales Representative"
//                         onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                         onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                         className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                       />
//                       {errors[`work-${globalIndex}-role`] && (
//                         <span className="text-xs text-red-500">
//                           {errors[`work-${globalIndex}-role`]}
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Dates */}
//                   <div className="flex gap-4">
//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">Start & end date</label>
//                       <div className="flex gap-2">
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
                        
//                         {!work.currentlyWorking && (
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex flex-col gap-1 flex-1">
//                       <label className="text-sm font-semibold text-gray-700">Location</label>
//                       <input
//                         type="text"
//                         placeholder="City, State"
//                         className="w-full px-3 py-2 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                       />
//                     </div>
//                   </div>

//                   {/* Currently Working */}
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="checkbox"
//                       checked={work.currentlyWorking}
//                       onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                       className="w-4 h-4"
//                     />
//                     <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                   </div>

//                   {/* Description */}
//                   <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                     <div className="flex justify-between items-center">
//                       <label className="text-sm font-semibold text-gray-700">
//                         Work description at {work.company || "the company"}
//                       </label>
//                       <button
//                         type="button"
//                         ref={(el) => {
//                           buttonRefs.current[editIndex] = el;
//                         }}
//                         disabled={loadingIndex === editIndex}
//                         onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                         className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border bg-blue-600 text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                       >
//                         <PiPenNibStraightFill className="w-4 h-4" />
//                         {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                       </button>
//                     </div>

//                     {/* Toolbar */}
//                     <div className="flex items-center gap-1 mt-2 flex-wrap">
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "bold")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Bold"
//                       >
//                         <FaBold />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "italic")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Italic"
//                       >
//                         <FaItalic />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "underline")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Underline"
//                       >
//                         <FaUnderline />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "insertUnorderedList")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Bullet List"
//                       >
//                         <FaListUl />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "insertOrderedList")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Numbered List"
//                       >
//                         <FaListOl />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "undo")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Undo"
//                       >
//                         <FaUndoAlt />
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => exec(editIndex, "redo")}
//                         className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                         title="Redo"
//                       >
//                         <FaRedoAlt />
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => {
//                           const newState = !spellCheckEnabled;
//                           setSpellCheckEnabled(newState);
//                           const ed = editorRefs.current[editIndex];
//                           if (ed) ed.spellcheck = newState;
//                         }}
//                         className={`w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 shadow-sm transition ${
//                           spellCheckEnabled ? "text-blue-600 bg-blue-50" : "text-gray-700"
//                         }`}
//                         title="Toggle Spellcheck"
//                       >
//                         <FaSpellCheck />
//                       </button>
//                     </div>

//                     {/* Editor */}
//                     <div
//                       ref={(el) => (editorRefs.current[editIndex] = el)}
//                       contentEditable
//                       suppressContentEditableWarning
//                       onInput={() => onEditorInput(editIndex)}
//                       className="w-full px-3 py-2 rounded-lg text-sm text-black bg-[#faf9f8] min-h-[120px] hover:bg-[#f3f2f1] focus:outline-none mt-2"
//                       dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                       spellCheck={spellCheckEnabled}
//                     />
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Add Another Button in Editing Form */}
//             <div className="pt-2">
//               <button
//                 type="button"
//                 onClick={addWork}
//                 className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//               >
//                 + Add Additional
//               </button>
//             </div>
//           </div>
//             </div>
//           {/* Right Side: Fixed Tips or AI Suggestions */}
//           <div className="w-80 flex-shrink-0 sticky top-2">
//             {showTips && activePopup === null ? (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//                 <div className="border-t border-gray-300 mb-4"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
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

// export default WorkExperience; before scroll move to beside left



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
// import { PiPenNibStraightFill } from "react-icons/pi";
// import NibPenSparkleIcon from "../NibPenSparkleIcon";

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
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

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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
//         <div className="flex flex-col gap-4">
//           <div className="flex flex-col gap-2">
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//                 <div className="flex-1">
//                   <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                   {work.description && (
//                     <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
//                   )}
//                 </div>

//                 <div className="flex flex-col gap-1">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="text-xs text-blue-600 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeWork(index)}
//                     className="text-xs text-red-500 hover:underline"
//                   >
//                     Remove
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
//               className="flex w-fit px-6 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//             >
//               + Add Additional
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
//               {editingEntries.map((work, editIndex) => {
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
//                           value={work.company}
//                           placeholder="Company"
//                           onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-company`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-company`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Role or job title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={work.role}
//                           placeholder="Role"
//                           onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-role`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-role`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       {!work.currentlyWorking && (
//                         <div className="flex flex-col gap-1 flex-1">
//                           <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         </div>
//                       )}

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Location</label>
//                         <input
//                           type="text"
//                           placeholder="City, State"
//                           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                         />
//                       </div>
//                     </div>

//                     {/* Currently Working */}
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         checked={work.currentlyWorking}
//                         onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                         className="w-4 h-4"
//                       />
//                       <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Work description at {work.company || "the company"}
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                           className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                         >
//                           <NibPenSparkleIcon className="w-4 h-4" />
//                           {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                         </button>
//                       </div>

//                       {/* Toolbar */}
//                       <div className="flex items-center gap-1 mt-2 flex-wrap">
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "bold")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Bold"
//                         >
//                           <FaBold />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "italic")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Italic"
//                         >
//                           <FaItalic />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "underline")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Underline"
//                         >
//                           <FaUnderline />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "insertUnorderedList")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Bullet List"
//                         >
//                           <FaListUl />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "insertOrderedList")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Numbered List"
//                         >
//                           <FaListOl />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "undo")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Undo"
//                         >
//                           <FaUndoAlt />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "redo")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Redo"
//                         >
//                           <FaRedoAlt />
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() => {
//                             const newState = !spellCheckEnabled;
//                             setSpellCheckEnabled(newState);
//                             const ed = editorRefs.current[editIndex];
//                             if (ed) ed.spellcheck = newState;
//                           }}
//                           className={`w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 shadow-sm transition ${
//                             spellCheckEnabled ? "text-blue-600 bg-blue-50" : "text-gray-700"
//                           }`}
//                           title="Toggle Spellcheck"
//                         >
//                           <FaSpellCheck />
//                         </button>
//                       </div>

//                       {/* Editor */}
//                       <div
//                         ref={(el) => (editorRefs.current[editIndex] = el)}
//                         contentEditable
//                         suppressContentEditableWarning
//                         onInput={() => onEditorInput(editIndex)}
//                         className="w-full px-3 py-2 rounded-lg text-sm text-black bg-[#faf9f8] min-h-[120px] hover:bg-[#f3f2f1] focus:outline-none mt-2"
//                         dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                         spellCheck={spellCheckEnabled}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}

//               {/* Add Another Button in Editing Form */}
//               <div className="pt-2">
//                 <button
//                   type="button"
//                   onClick={addWork}
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
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
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

// export default WorkExperience; before edit n remove beside



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

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const entrySummary = (e: WorkEntry) => {
//     const role = e.role || "No role";
//     const comp = e.company || "No company";
//     const start = e.startDate ? `${startToLabel(e.startDate)}` : "";
//     const end = e.currentlyWorking ? "Present" : (e.endDate ? `${startToLabel(e.endDate)}` : "");
//     return `${role} • ${comp}${start || end ? ` • ${start}${end ? " - " + end : ""}` : ""}`;
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
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

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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
//           <div className="flex flex-col gap-2">
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-2 border-b pb-2">
//                 <div className="flex-1">
//                   <div className="text-sm font-semibold text-gray-800">{entrySummary(work)}</div>
//                   {work.description && (
//                     <div className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: work.description }} />
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
//                     onClick={() => removeWork(index)}
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
//               className="flex w-fit p-3 items-center justify-center text-xs font-semibold bg-[#e5e5e5] hover:bg-[#2557a7] hover:text-white rounded-full"
//             >
//               <LuPlus size={20} className="text-[#595959]"/>
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
//               {editingEntries.map((work, editIndex) => {
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
//                           value={work.company}
//                           placeholder="Company"
//                           onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-company`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-company`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Role or job title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={work.role}
//                           placeholder="Role"
//                           onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-role`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-role`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       {!work.currentlyWorking && (
//                         <div className="flex flex-col gap-1 flex-1">
//                           <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         </div>
//                       )}

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Location</label>
//                         <input
//                           type="text"
//                           placeholder="City, State"
//                           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                         />
//                       </div>
//                     </div>

//                     {/* Currently Working */}
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         checked={work.currentlyWorking}
//                         onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                         className="w-4 h-4"
//                       />
//                       <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Work description at {work.company || "the company"}
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                           className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                         >
//                           <NibPenSparkleIcon className="w-4 h-4" />
//                           {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                         </button>
//                       </div>

//                       {/* Toolbar */}
//                       <div className="flex items-center gap-1 mt-2 flex-wrap">
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "bold")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Bold"
//                         >
//                           <FaBold />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "italic")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Italic"
//                         >
//                           <FaItalic />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "underline")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Underline"
//                         >
//                           <FaUnderline />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "insertUnorderedList")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Bullet List"
//                         >
//                           <FaListUl />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "insertOrderedList")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Numbered List"
//                         >
//                           <FaListOl />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "undo")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Undo"
//                         >
//                           <FaUndoAlt />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "redo")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Redo"
//                         >
//                           <FaRedoAlt />
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() => {
//                             const newState = !spellCheckEnabled;
//                             setSpellCheckEnabled(newState);
//                             const ed = editorRefs.current[editIndex];
//                             if (ed) ed.spellcheck = newState;
//                           }}
//                           className={`w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 shadow-sm transition ${
//                             spellCheckEnabled ? "text-blue-600 bg-blue-50" : "text-gray-700"
//                           }`}
//                           title="Toggle Spellcheck"
//                         >
//                           <FaSpellCheck />
//                         </button>
//                       </div>

//                       {/* Editor */}
//                       <div
//                         ref={(el) => (editorRefs.current[editIndex] = el)}
//                         contentEditable
//                         suppressContentEditableWarning
//                         onInput={() => onEditorInput(editIndex)}
//                         className="w-full px-3 py-2 rounded-lg text-sm text-black bg-[#faf9f8] min-h-[120px] hover:bg-[#f3f2f1] focus:outline-none mt-2"
//                         dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                         spellCheck={spellCheckEnabled}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}

//               {/* Add Another Button in Editing Form */}
//               <div className="pt-2">
//                 <button
//                   type="button"
//                   onClick={addWork}
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
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
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

// export default WorkExperience; before items one by one 



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

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
//   location?: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
//   location: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
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

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Role - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {work.role || "No role"}
//                   </div>
                  
//                   {/* Company */}
//                   <div className="text-sm text-gray-700">
//                     {work.company || "No company"}
//                   </div>
                  
//                   {/* Dates */}
//                   <div className="text-xs text-gray-600">
//                     {work.startDate ? startToLabel(work.startDate) : ""} 
//                     {work.startDate && " - "}
//                     {work.currentlyWorking ? "Present" : (work.endDate ? startToLabel(work.endDate) : "")}
//                   </div>
                  
//                   {/* Location */}
//                   {work.location && (
//                     <div className="text-xs text-gray-600">
//                       {work.location}
//                     </div>
//                   )}
                  
//                   {/* Description */}
//                   {work.description && (
//                     <div 
//                       className="text-sm text-[#404040] mt-1 line-clamp-2" 
//                       dangerouslySetInnerHTML={{ __html: work.description }} 
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
//                     onClick={() => removeWork(index)}
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
//               className="flex w-fit p-3 items-center justify-center text-xs font-semibold bg-[#e5e5e5] hover:bg-[#2557a7] rounded-full"
//             >
//               <LuPlus size={20} className="text-[#595959] hover:text-white"/>
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
//               {editingEntries.map((work, editIndex) => {
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
//                           value={work.company}
//                           placeholder="Company"
//                           onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-company`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-company`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Role or job title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={work.role}
//                           placeholder="Role"
//                           onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-role`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-role`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       {!work.currentlyWorking && (
//                         <div className="flex flex-col gap-1 flex-1">
//                           <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         </div>
//                       )}

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Location</label>
//                         <input
//                           type="text"
//                           value={work.location || ""}
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
//                         checked={work.currentlyWorking}
//                         onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                         className="w-4 h-4"
//                       />
//                       <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Work description at {work.company || "the company"}
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                           className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                         >
//                           <NibPenSparkleIcon className="w-4 h-4" />
//                           {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                         </button>
//                       </div>

//                       {/* Toolbar */}
//                       <div className="flex items-center gap-1 mt-2 flex-wrap">
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "bold")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Bold"
//                         >
//                           <FaBold />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "italic")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Italic"
//                         >
//                           <FaItalic />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "underline")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Underline"
//                         >
//                           <FaUnderline />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "insertUnorderedList")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Bullet List"
//                         >
//                           <FaListUl />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "insertOrderedList")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Numbered List"
//                         >
//                           <FaListOl />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "undo")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Undo"
//                         >
//                           <FaUndoAlt />
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => exec(editIndex, "redo")}
//                           className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-700 rounded hover:bg-gray-100 hover:text-blue-600 shadow-sm transition"
//                           title="Redo"
//                         >
//                           <FaRedoAlt />
//                         </button>

//                         <button
//                           type="button"
//                           onClick={() => {
//                             const newState = !spellCheckEnabled;
//                             setSpellCheckEnabled(newState);
//                             const ed = editorRefs.current[editIndex];
//                             if (ed) ed.spellcheck = newState;
//                           }}
//                           className={`w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 shadow-sm transition ${
//                             spellCheckEnabled ? "text-blue-600 bg-blue-50" : "text-gray-700"
//                           }`}
//                           title="Toggle Spellcheck"
//                         >
//                           <FaSpellCheck />
//                         </button>
//                       </div>

//                       {/* Editor */}
//                       <div
//                         ref={(el) => (editorRefs.current[editIndex] = el)}
//                         contentEditable
//                         suppressContentEditableWarning
//                         onInput={() => onEditorInput(editIndex)}
//                         className="w-full px-3 py-2 rounded-lg text-sm text-black bg-[#faf9f8] min-h-[120px] hover:bg-[#f3f2f1] focus:outline-none mt-2"
//                         dangerouslySetInnerHTML={{ __html: work.description || "" }}
//                         spellCheck={spellCheckEnabled}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}

//               {/* Add Another Button in Editing Form */}
//               <div className="pt-2">
//                 <button
//                   type="button"
//                   onClick={addWork}
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
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
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

// export default WorkExperience; before toolbar move into descrption box



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

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
//   location?: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
//   location: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     setResumeData({ ...resumeData, workExperience: allEntries });
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
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

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Role - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {work.role || "No role"}
//                   </div>
                  
//                   {/* Company */}
//                   <div className="text-sm text-gray-700">
//                     {work.company || "No company"}
//                   </div>
                  
//                   {/* Dates */}
//                   <div className="text-xs text-gray-600">
//                     {work.startDate ? startToLabel(work.startDate) : ""} 
//                     {work.startDate && " - "}
//                     {work.currentlyWorking ? "Present" : (work.endDate ? startToLabel(work.endDate) : "")}
//                   </div>
                  
//                   {/* Location */}
//                   {work.location && (
//                     <div className="text-xs text-gray-600">
//                       {work.location}
//                     </div>
//                   )}
                  
//                   {/* Description */}
//                   {work.description && (
//                     <div 
//                       className="text-sm text-[#404040] mt-1 line-clamp-2" 
//                       dangerouslySetInnerHTML={{ __html: work.description }} 
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
//                     onClick={() => removeWork(index)}
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
//               {editingEntries.map((work, editIndex) => {
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
//                           value={work.company}
//                           placeholder="Company"
//                           onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-company`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-company`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Role or job title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={work.role}
//                           placeholder="Role"
//                           onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-role`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-role`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       {!work.currentlyWorking && (
//                         <div className="flex flex-col gap-1 flex-1">
//                           <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         </div>
//                       )}

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Location</label>
//                         <input
//                           type="text"
//                           value={work.location || ""}
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
//                         checked={work.currentlyWorking}
//                         onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                         className="w-4 h-4"
//                       />
//                       <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => (descriptionRefs.current[editIndex] = el)} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Work description at {work.company || "the company"}
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
//                           className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
//                         >
//                           <NibPenSparkleIcon className="w-4 h-4" />
//                           {loadingIndex === editIndex ? "Generating..." : "AI Writer"}
//                         </button>
//                       </div>

//                       {/* Description Box with Toolbar Inside */}
//                       <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
//                         {/* Toolbar */}
//                         <div className="flex items-center gap-1 px-3 py-2  bg-[#faf9f8] flex-wrap">
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
//                           ref={(el) => (editorRefs.current[editIndex] = el)}
//                           contentEditable
//                           suppressContentEditableWarning
//                           onInput={() => onEditorInput(editIndex)}
//                           className="w-full px-3 py-2 text-sm text-black min-h-[180px] focus:outline-none border-b-2 border-transparent focus:border-[#2557a7]"
//                           dangerouslySetInnerHTML={{ __html: work.description || "" }}
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
//                   onClick={addWork}
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
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *Indeed survey conducted with Lucid, N=2661 employers among 10 industries.
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

// export default WorkExperience; before errors remove



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

// interface WorkEntry {
//   company: string;
//   role: string;
//   startDate: string;
//   endDate: string;
//   currentlyWorking: boolean;
//   description: string;
//   location: string;
// }

// const emptyWork = (): WorkEntry => ({
//   company: "",
//   role: "",
//   startDate: "",
//   endDate: "",
//   currentlyWorking: false,
//   description: "",
//   location: "",
// });

// const WorkExperience: React.FC = () => {
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

//   const hasValidData = (entry: WorkEntry): boolean => {
//     return !!(entry.company || entry.role || entry.startDate || entry.endDate || entry.description || entry.location);
//   };

//   const [savedEntries, setSavedEntries] = useState<WorkEntry[]>(() => {
//     if (resumeData.workExperience && resumeData.workExperience.length) {
//       const validEntries = resumeData.workExperience.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<WorkEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyWork()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     if (JSON.stringify(resumeData.workExperience) !== JSON.stringify(allEntries)) {
//       setResumeData({ ...resumeData, workExperience: allEntries });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof WorkEntry>(
//     index: number,
//     field: K,
//     value: WorkEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("work", savedEntries.length + index, field as string);
//   };

//   const addWork = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyWork()]);

//     setTimeout(() => {
//       const el = editorRefs.current[0];
//       if (el) el.focus();
//     }, 0);
//   };

//   const removeWork = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("work", index);
//     reindexErrors("work", index);
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

//   const handleAIWriterClick = (editIndex: number, globalIndex: number, work: WorkEntry) => {
//     if (!validateRequired("work", globalIndex, {
//       company: work.company,
//       role: work.role,
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

//     const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
// Role: ${work.role}
// Company: ${work.company}
// Requirements for each description:
// - Length: 1-2 lines maximum (approximately 15-25 words)
// - Start directly with a strong action verb (past tense)
// - Focus on quantifiable achievements, measurable outcomes, and business impact
// - Include metrics or scale (e.g., "increased revenue by 30%")
// - Use industry keywords for ATS
// - Avoid generic phrases
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
//             {savedEntries.map((work, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Role - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {work.role || "No role"}
//                   </div>
                  
//                   {/* Company */}
//                   <div className="text-sm text-gray-700">
//                     {work.company || "No company"}
//                   </div>
                  
//                   {/* Dates */}
//                   <div className="text-xs text-gray-600">
//                     {work.startDate ? startToLabel(work.startDate) : ""} 
//                     {work.startDate && " - "}
//                     {work.currentlyWorking ? "Present" : (work.endDate ? startToLabel(work.endDate) : "")}
//                   </div>
                  
//                   {/* Location */}
//                   {work.location && (
//                     <div className="text-xs text-gray-600">
//                       {work.location}
//                     </div>
//                   )}
                  
//                   {/* Description */}
//                   {work.description && (
//                     <div 
//                       className="text-sm text-[#404040] mt-1 line-clamp-2" 
//                       dangerouslySetInnerHTML={{ __html: work.description }} 
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
//                     onClick={() => removeWork(index)}
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
//               {editingEntries.map((work, editIndex) => {
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
//                           value={work.company}
//                           placeholder="Company"
//                           onChange={(e) => handleChange(editIndex, "company", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { company: work.company })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-company`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-company`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Role or job title <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={work.role}
//                           placeholder="Role"
//                           onChange={(e) => handleChange(editIndex, "role", e.target.value)}
//                           onBlur={() => validateRequired("work", globalIndex, { role: work.role })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`work-${globalIndex}-role`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`work-${globalIndex}-role`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={work.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       {!work.currentlyWorking && (
//                         <div className="flex flex-col gap-1 flex-1">
//                           <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                           <MonthYearPicker
//                             value={work.endDate}
//                             onChange={(val) => handleChange(editIndex, "endDate", val)}
//                             placeholder="MM/YY"
//                           />
//                         </div>
//                       )}

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Location</label>
//                         <input
//                           type="text"
//                           value={work.location || ""}
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
//                         checked={work.currentlyWorking}
//                         onChange={(e) => handleChange(editIndex, "currentlyWorking", e.target.checked)}
//                         className="w-4 h-4"
//                       />
//                       <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
//                     </div>

//                     {/* Description */}
//                     <div ref={(el) => { descriptionRefs.current[editIndex] = el; }} className="flex flex-col gap-1 relative">
//                       <div className="flex justify-between items-center">
//                         <label className="text-sm font-semibold text-gray-700">
//                           Work description at {work.company || "the company"}
//                         </label>
//                         <button
//                           type="button"
//                           ref={(el) => {
//                             buttonRefs.current[editIndex] = el;
//                           }}
//                           disabled={loadingIndex === editIndex}
//                           onClick={() => handleAIWriterClick(editIndex, globalIndex, work)}
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
//                   onClick={addWork}
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
//                     Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*
//                   </p>
//                   <p>
//                     Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
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

// export default WorkExperience; before company dropdown



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


interface WorkEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  location: string;
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


  const removeWork = (index: number) => {
    const updated = [...savedEntries];
    updated.splice(index, 1);
    setSavedEntries(updated);
    clearSectionIndexErrors("work", index);
    reindexErrors("work", index);
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
                    <div 
                      className="text-sm text-[#404040] mt-1 line-clamp-2" 
                      dangerouslySetInnerHTML={{ __html: work.description }} 
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
                    onClick={() => removeWork(index)}
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
                  <p>Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume.*</p>
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
