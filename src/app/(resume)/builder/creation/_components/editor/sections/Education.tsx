// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation"; // adjust import path

// interface EducationEntry {
//   degree: string;
//   school: string;
//   startDate: string;
//   endDate: string;
// }

// const Education: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
//     useValidation();

//   const education: EducationEntry[] = resumeData.education || [
//     { degree: "", school: "", startDate: "", endDate: "" },
//   ];

//   const handleChange = (
//     index: number,
//     field: keyof EducationEntry,
//     value: string
//   ) => {
//     const updated = [...education];
//     updated[index][field] = value;
//     setResumeData({ ...resumeData, education: updated });

//     clearError("education", index, field);
//   };

//   const handleBlur = (index: number, entry: EducationEntry) => {
//     const requiredFields: Record<string, string> = {
//       degree: entry.degree || "",
//       school: entry.school || "",
//     };
//     validateRequired("education", index, requiredFields);
//   };

//   const addEducation = () => {
//     setResumeData({
//       ...resumeData,
//       education: [...education, { degree: "", school: "", startDate: "", endDate: "" }],
//     });
//   };

//   const removeEducation = (index: number) => {
//     const updated = [...education];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, education: updated });

//     clearSectionIndexErrors("education", index);
//     reindexErrors("education", index);
//   };

//   return (
//     <div className="flex flex-col gap-4 ml-8 mt-3">
//       {education.map((entry, index) => (
//         <div
//           key={index}
//           className="p-3 border rounded-lg shadow-sm bg-gray-50 flex flex-col gap-3"
//         >
//           {/* Degree */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">
//               Degree <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={entry.degree}
//               placeholder="Enter Degree"
//               onChange={(e) => handleChange(index, "degree", e.target.value)}
//               onBlur={() => handleBlur(index, entry)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`education-${index}-degree`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`education-${index}-degree`]}
//               </span>
//             )}
//           </div>

//           {/* School */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">
//               School / University <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={entry.school}
//               placeholder="Enter School / University"
//               onChange={(e) => handleChange(index, "school", e.target.value)}
//               onBlur={() => handleBlur(index, entry)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`education-${index}-school`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`education-${index}-school`]}
//               </span>
//             )}
//           </div>

//           {/* Start Date */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">Start Date</label>
//             <input
//               type="month"
//               value={entry.startDate}
//               onChange={(e) => handleChange(index, "startDate", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>

//           {/* End Date */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-semibold text-gray-700">End Date</label>
//             <input
//               type="month"
//               value={entry.endDate}
//               onChange={(e) => handleChange(index, "endDate", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>

//           {/* Remove button */}
//           <button
//             type="button"
//             onClick={() => removeEducation(index)}
//             className="text-xs text-red-600 hover:underline self-start mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       <button
//         type="button"
//         onClick={addEducation}
//         className="w-fit px-14 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
//       >
//         + Add Education
//       </button>
//     </div>
//   );
// };

// export default Education;

// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation"; // adjust import path

// interface EducationEntry {
//   degree: string;
//   school: string;
//   startDate: string;
//   endDate: string;
// }

// const Education: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
//     useValidation();

//   const education: EducationEntry[] = resumeData.education || [
//     { degree: "", school: "", startDate: "", endDate: "" },
//   ];

//   const handleChange = (
//     index: number,
//     field: keyof EducationEntry,
//     value: string
//   ) => {
//     const updated = [...education];
//     updated[index][field] = value;
//     setResumeData({ ...resumeData, education: updated });
//     clearError("education", index, field);
//   };

//   const handleBlur = (index: number, entry: EducationEntry) => {
//     const requiredFields: Record<string, string> = {
//       degree: entry.degree || "",
//       school: entry.school || "",
//     };
//     validateRequired("education", index, requiredFields);
//   };

//   const addEducation = () => {
//     setResumeData({
//       ...resumeData,
//       education: [...education, { degree: "", school: "", startDate: "", endDate: "" }],
//     });
//   };

//   const removeEducation = (index: number) => {
//     const updated = [...education];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, education: updated });

//     clearSectionIndexErrors("education", index);
//     reindexErrors("education", index);
//   };

//   return (
//     <div className="flex flex-col gap-4 ml-8 mt-3">
//       {education.map((entry, index) => (
//         <div
//           key={index}
//           className="p-3 border rounded-lg shadow-sm bg-gray-50 flex flex-col gap-3"
//         >
//           {/* Degree */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Degree <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={entry.degree}
//               placeholder="Enter Degree"
//               onChange={(e) => handleChange(index, "degree", e.target.value)}
//               onBlur={() => handleBlur(index, entry)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`education-${index}-degree`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`education-${index}-degree`]}
//               </span>
//             )}
//           </div>

//           {/* School */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               School / University <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={entry.school}
//               placeholder="Enter School / University"
//               onChange={(e) => handleChange(index, "school", e.target.value)}
//               onBlur={() => handleBlur(index, entry)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`education-${index}-school`] && (
//               <span className="text-xs text-red-500">
//                 {errors[`education-${index}-school`]}
//               </span>
//             )}
//           </div>

//           {/* Start Date and End Date in one line */}
//           <div className="flex gap-2">
//             {/* Start Date */}
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-sm font-semibold text-gray-700">
//                 Start Date
//               </label>
//               <input
//                 type="month"
//                 value={entry.startDate}
//                 onChange={(e) => handleChange(index, "startDate", e.target.value)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               />
//             </div>

//             {/* End Date */}
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-sm font-semibold text-gray-700">
//                 End Date
//               </label>
//               <input
//                 type="month"
//                 value={entry.endDate}
//                 onChange={(e) => handleChange(index, "endDate", e.target.value)}
//                 className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//               />
//             </div>
//           </div>

//           {/* Remove button */}
//           <button
//             type="button"
//             onClick={() => removeEducation(index)}
//             className="text-xs text-red-600 hover:underline self-start mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       <button
//         type="button"
//         onClick={addEducation}
//         className="w-fit px-14 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Education
//       </button>
//     </div>
//   );
// };

// export default Education; before tips



// import React, { useRef, useEffect, useState } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// import MonthYearPicker from "../MonthYearPicker";
// import { RiEdit2Fill } from 'react-icons/ri';
// import { Trash2 } from 'lucide-react';
// import { LuPlus } from 'react-icons/lu';

// interface EducationEntry {
//   school: string;
//   degree: string;
//   startDate: string;
//   endDate: string;
// }

// const emptyEducation = (): EducationEntry => ({
//   school: "",
//   degree: "",
//   startDate: "",
//   endDate: "",
// });

// const Education: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();

//   const {
//     errors,
//     validateRequired,
//     clearError,
//     clearSectionIndexErrors,
//     reindexErrors,
//   } = useValidation();

//   const [showTips] = useState(true);

//   const containerRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);

//   const hasValidData = (entry: EducationEntry): boolean => {
//     return !!(entry.school || entry.degree || entry.startDate || entry.endDate);
//   };

//   const [savedEntries, setSavedEntries] = useState<EducationEntry[]>(() => {
//     if (resumeData.education && resumeData.education.length) {
//       const validEntries = resumeData.education.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<EducationEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyEducation()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     if (JSON.stringify(resumeData.education) !== JSON.stringify(allEntries)) {
//       setResumeData({ ...resumeData, education: allEntries });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof EducationEntry>(
//     index: number,
//     field: K,
//     value: EducationEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("education", savedEntries.length + index, field as string);
//   };

//   const addEducation = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyEducation()]);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyEducation()]);
//   };

//   const removeEducation = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("education", index);
//     reindexErrors("education", index);
//   };

//   const editEntry = (index: number) => {
//     const entryToEdit = savedEntries[index];
//     const updatedSaved = [...savedEntries];
//     updatedSaved.splice(index, 1);
//     setSavedEntries(updatedSaved);
//     setEditingEntries([entryToEdit]);
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Saved Entries List with Add Button */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4 mt-8">
//           <div className="flex flex-col gap-4">
//             {savedEntries.map((education, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Degree - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {education.degree || "No degree"}
//                   </div>
                  
//                   {/* School */}
//                   <div className="text-sm text-gray-700">
//                     {education.school || "No school"}
//                   </div>
                  
//                   {/* Dates */}
//                   <div className="text-xs text-gray-600">
//                     {education.startDate ? startToLabel(education.startDate) : ""} 
//                     {education.startDate && education.endDate && " - "}
//                     {education.endDate ? startToLabel(education.endDate) : ""}
//                   </div>
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
//                     onClick={() => removeEducation(index)}
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
//               {editingEntries.map((education, editIndex) => {
//                 const globalIndex = savedEntries.length + editIndex;
//                 return (
//                   <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
//                     {/* School & Degree */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           School <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={education.school}
//                           placeholder="School Name"
//                           onChange={(e) => handleChange(editIndex, "school", e.target.value)}
//                           onBlur={() => validateRequired("education", globalIndex, { school: education.school })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`education-${globalIndex}-school`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`education-${globalIndex}-school`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Degree <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={education.degree}
//                           placeholder="Bachelor's, Master's, etc."
//                           onChange={(e) => handleChange(editIndex, "degree", e.target.value)}
//                           onBlur={() => validateRequired("education", globalIndex, { degree: education.degree })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`education-${globalIndex}-degree`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`education-${globalIndex}-degree`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={education.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                         <MonthYearPicker
//                           value={education.endDate}
//                           onChange={(val) => handleChange(editIndex, "endDate", val)}
//                           placeholder="MM/YY"
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
//                   onClick={addEducation}
//                   className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//                 >
//                   + Add Additional
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Right Side: Fixed Tips Section */}
//           <div className="w-80 flex-shrink-0 sticky top-2">
//             {showTips && (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//                 <div className="border-t border-gray-300 mb-3"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Education credentials validate your qualifications and academic foundation. List your most recent and relevant educational achievements in reverse chronological order.*
//                   </p>
//                   <p>
//                     Include the institution name, degree earned, and dates attended. Highlight honors, relevant coursework, or academic achievements that strengthen your candidacy.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *95% of employers verify education credentials during the hiring process.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Education; before fields error to save


// import React, { useRef, useEffect, useState } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// import MonthYearPicker from "../MonthYearPicker";
// import { RiEdit2Fill } from 'react-icons/ri';
// import { Trash2 } from 'lucide-react';
// import { LuPlus } from 'react-icons/lu';

// interface EducationEntry {
//   school: string;
//   degree: string;
//   startDate: string;
//   endDate: string;
// }

// const emptyEducation = (): EducationEntry => ({
//   school: "",
//   degree: "",
//   startDate: "",
//   endDate: "",
// });

// const Education: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();

//   const {
//     errors,
//     validateRequired,
//     clearError,
//     clearSectionIndexErrors,
//     reindexErrors,
//   } = useValidation();

//   const [showTips] = useState(true);

//   const containerRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);

//   const hasValidData = (entry: EducationEntry): boolean => {
//     return !!(entry.school || entry.degree || entry.startDate || entry.endDate);
//   };

//   const [savedEntries, setSavedEntries] = useState<EducationEntry[]>(() => {
//     if (resumeData.education && resumeData.education.length) {
//       const validEntries = resumeData.education.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<EducationEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyEducation()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     if (JSON.stringify(resumeData.education) !== JSON.stringify(allEntries)) {
//       setResumeData({ ...resumeData, education: allEntries });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof EducationEntry>(
//     index: number,
//     field: K,
//     value: EducationEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("education", savedEntries.length + index, field as string);
//   };

//   // ✅ FIXED: Validate before saving
//   const addEducation = () => {
//     // ✅ Step 1: Validate all editing entries first
//     let hasErrors = false;
    
//     editingEntries.forEach((entry, editIndex) => {
//       const globalIndex = savedEntries.length + editIndex;
      
//       // Clear old errors for this entry first
//       clearSectionIndexErrors("education", globalIndex);
      
//       // Validate required fields
//       const isValid = validateRequired("education", globalIndex, {
//         school: entry.school,
//         degree: entry.degree,
//       });
      
//       if (!isValid) {
//         hasErrors = true;
//       }
//     });
    
//     // ✅ Step 2: If there are validation errors, don't proceed
//     if (hasErrors) {
//       console.log("❌ Validation failed - cannot save education");
//       return; // Stop here, errors will be shown in the form
//     }
    
//     // ✅ Step 3: Only save valid entries with data
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyEducation()]);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyEducation()]);
//   };

//   const removeEducation = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("education", index);
//     reindexErrors("education", index);
//   };

//   const editEntry = (index: number) => {
//     const entryToEdit = savedEntries[index];
//     const updatedSaved = [...savedEntries];
//     updatedSaved.splice(index, 1);
//     setSavedEntries(updatedSaved);
//     setEditingEntries([entryToEdit]);
//   };

//   function startToLabel(val: string) {
//     if (!val) return "";
//     const [y, m] = val.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const mIdx = parseInt(m, 10) - 1;
//     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   }

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Saved Entries List with Add Button */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4 mt-8">
//           <div className="flex flex-col gap-4">
//             {savedEntries.map((education, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Degree - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {education.degree || "No degree"}
//                   </div>
                  
//                   {/* School */}
//                   <div className="text-sm text-gray-700">
//                     {education.school || "No school"}
//                   </div>
                  
//                   {/* Dates */}
//                   <div className="text-xs text-gray-600">
//                     {education.startDate ? startToLabel(education.startDate) : ""} 
//                     {education.startDate && education.endDate && " - "}
//                     {education.endDate ? startToLabel(education.endDate) : ""}
//                   </div>
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
//                     onClick={() => removeEducation(index)}
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
//               {editingEntries.map((education, editIndex) => {
//                 const globalIndex = savedEntries.length + editIndex;
//                 return (
//                   <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
//                     {/* School & Degree */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           School <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={education.school}
//                           placeholder="School Name"
//                           onChange={(e) => handleChange(editIndex, "school", e.target.value)}
//                           onBlur={() => validateRequired("education", globalIndex, { school: education.school })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`education-${globalIndex}-school`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`education-${globalIndex}-school`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Degree <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={education.degree}
//                           placeholder="Bachelor's, Master's, etc."
//                           onChange={(e) => handleChange(editIndex, "degree", e.target.value)}
//                           onBlur={() => validateRequired("education", globalIndex, { degree: education.degree })}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
//                         />
//                         {errors[`education-${globalIndex}-degree`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`education-${globalIndex}-degree`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Dates */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
//                         <MonthYearPicker
//                           value={education.startDate}
//                           onChange={(val) => handleChange(editIndex, "startDate", val)}
//                           placeholder="MM/YY"
//                         />
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
//                         <MonthYearPicker
//                           value={education.endDate}
//                           onChange={(val) => handleChange(editIndex, "endDate", val)}
//                           placeholder="MM/YY"
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
//                   onClick={addEducation}
//                   className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//                 >
//                   + Add Additional
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Right Side: Fixed Tips Section */}
//           <div className="w-80 flex-shrink-0 sticky top-2">
//             {showTips && (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//                 <div className="border-t border-gray-300 mb-3"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Education credentials validate your qualifications and academic foundation. List your most recent and relevant educational achievements in reverse chronological order.*
//                   </p>
//                   <p>
//                     Include the institution name, degree earned, and dates attended. Highlight honors, relevant coursework, or academic achievements that strengthen your candidacy.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *95% of employers verify education credentials during the hiring process.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Education;  before section item delete api added
// before date format update


import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import MonthYearPicker from "../MonthYearPicker";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi"; // ✅ Import the API

interface EducationEntry {
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  _id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyEducation = (): EducationEntry => ({
  school: "",
  degree: "",
  startDate: "",
  endDate: "",
});

const Education: React.FC = () => {
  const { resumeData, setResumeData } = useResume();

  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  } = useValidation();

  const [showTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null); // ✅ NEW: Track deleting state

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: EducationEntry): boolean => {
    return !!(entry.school || entry.degree || entry.startDate || entry.endDate);
  };

  const [savedEntries, setSavedEntries] = useState<EducationEntry[]>(() => {
    if (resumeData.education && resumeData.education.length) {
      const validEntries = resumeData.education.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<EducationEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyEducation()];
    }
    return [];
  });

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.education) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, education: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  const handleChange = <K extends keyof EducationEntry>(
    index: number,
    field: K,
    value: EducationEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("education", savedEntries.length + index, field as string);
  };

  // ✅ FIXED: Validate before saving
  const addEducation = () => {
    // ✅ Step 1: Validate all editing entries first
    let hasErrors = false;
    
    editingEntries.forEach((entry, editIndex) => {
      const globalIndex = savedEntries.length + editIndex;
      
      // Clear old errors for this entry first
      clearSectionIndexErrors("education", globalIndex);
      
      // Validate required fields
      const isValid = validateRequired("education", globalIndex, {
        school: entry.school,
        degree: entry.degree,
      });
      
      if (!isValid) {
        hasErrors = true;
      }
    });
    
    // ✅ Step 2: If there are validation errors, don't proceed
    if (hasErrors) {
      console.log("❌ Validation failed - cannot save education");
      return; // Stop here, errors will be shown in the form
    }
    
    // ✅ Step 3: Only save valid entries with data
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyEducation()]);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyEducation()]);
  };

  // ✅ UPDATED: Delete with API call
  const removeEducation = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const educationToDelete = savedEntries[index];
    const itemId = educationToDelete._id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      console.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("education", index);
      reindexErrors("education", index);
      return;
    }

    try {
      setDeletingIndex(index);
      console.log("🗑️ Deleting education item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "education", itemId);

      console.log("✅ Education item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("education", index);
      reindexErrors("education", index);

    } catch (error) {
      console.error("❌ Failed to delete education item:", error);
      alert("Failed to delete education entry. Please try again.");
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

  function startToLabel(val: string) {
    if (!val) return "";
    const [y, m] = val.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(m, 10) - 1;
    return `${monthNames[mIdx]} ${y.slice(-2)}`;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List with Add Button */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((education, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* Degree - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {education.degree || "No degree"}
                  </div>
                  
                  {/* School */}
                  <div className="text-sm text-gray-700">
                    {education.school || "No school"}
                  </div>
                  
                  {/* Dates */}
                  <div className="text-xs text-gray-600">
                    {education.startDate ? startToLabel(education.startDate) : ""} 
                    {education.startDate && education.endDate && " - "}
                    {education.endDate ? startToLabel(education.endDate) : ""}
                  </div>
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
                    onClick={() => removeEducation(index)}
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

          {/* Add Button in Entry List */}
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

      {/* Editing Form with Tips Panel */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          {/* Left Side: Scrollable Form Fields Section */}
          <div 
            ref={formScrollRef}
            className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
          >
            <div className="flex flex-col gap-3">
              {editingEntries.map((education, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* School & Degree */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          School <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.school}
                          placeholder="School Name"
                          onChange={(e) => handleChange(editIndex, "school", e.target.value)}
                          onBlur={() => validateRequired("education", globalIndex, { school: education.school })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                        {errors[`education-${globalIndex}-school`] && (
                          <span className="text-xs text-red-500">
                            {errors[`education-${globalIndex}-school`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Degree <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.degree}
                          placeholder="Bachelor's, Master's, etc."
                          onChange={(e) => handleChange(editIndex, "degree", e.target.value)}
                          onBlur={() => validateRequired("education", globalIndex, { degree: education.degree })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                        {errors[`education-${globalIndex}-degree`] && (
                          <span className="text-xs text-red-500">
                            {errors[`education-${globalIndex}-degree`]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
                        <MonthYearPicker
                          value={education.startDate}
                          onChange={(val) => handleChange(editIndex, "startDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
                        <MonthYearPicker
                          value={education.endDate}
                          onChange={(val) => handleChange(editIndex, "endDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Another Button in Editing Form */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Fixed Tips Section */}
          <div className="w-80 flex-shrink-0 sticky top-2">
            {showTips && (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>
                    Education credentials validate your qualifications and academic foundation. List your most recent and relevant educational achievements in reverse chronological order.
                  </p>
                  <p>
                    Include the institution name, degree earned, and dates attended. Highlight honors, relevant coursework, or academic achievements that strengthen your candidacy.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *95% of employers verify education credentials during the hiring process.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Education;



// import React, { useRef, useEffect, useState } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// import MonthYearPicker from "../MonthYearPicker";
// import { RiEdit2Fill } from "react-icons/ri";
// import { Trash2 } from "lucide-react";
// import { LuPlus } from "react-icons/lu";

// interface EducationEntry {
//   school: string;
//   degree: string;
//   startDate: string;
//   endDate: string;
// }

// const emptyEducation = (): EducationEntry => ({
//   school: "",
//   degree: "",
//   startDate: "",
//   endDate: "",
// });

// const Education: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const {
//     errors,
//     validateRequired,
//     clearError,
//     clearSectionIndexErrors,
//     reindexErrors,
//   } = useValidation();

//   const [showTips] = useState(true);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);

//   const hasValidData = (entry: EducationEntry): boolean => {
//     return !!(entry.school || entry.degree || entry.startDate || entry.endDate);
//   };

//   const [savedEntries, setSavedEntries] = useState<EducationEntry[]>(() => {
//     if (resumeData.education && resumeData.education.length) {
//       const validEntries = resumeData.education.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<EducationEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyEducation()];
//     }
//     return [];
//   });

//   // ✅ FIXED: Convert only if not already in "MMM YY" format
//   // useEffect(() => {
//   //   const convertToMMMYY = (val: string): string => {
//   //     if (!val) return "";
//   //     // If already in "MMM YY" format (e.g., Jun 24), skip conversion
//   //     if (/^[A-Za-z]{3}\s\d{2}$/.test(val)) {
//   //       return val;
//   //     }
//   //     const parts = val.split("-");
//   //     if (parts.length !== 2) return val;
//   //     const [y, m] = parts;
//   //     if (!y || !m) return val;
//   //     const monthNames = [
//   //       "Jan",
//   //       "Feb",
//   //       "Mar",
//   //       "Apr",
//   //       "May",
//   //       "Jun",
//   //       "Jul",
//   //       "Aug",
//   //       "Sep",
//   //       "Oct",
//   //       "Nov",
//   //       "Dec",
//   //     ];
//   //     const mIdx = parseInt(m, 10) - 1;
//   //     if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return val;
//   //     return `${monthNames[mIdx]} ${y.slice(-2)}`;
//   //   };

//   //   const convertedEntries = [...savedEntries, ...editingEntries].map((e) => ({
//   //     ...e,
//   //     startDate: convertToMMMYY(e.startDate),
//   //     endDate: convertToMMMYY(e.endDate),
//   //   }));

//   //   if (
//   //     JSON.stringify(resumeData.education) !== JSON.stringify(convertedEntries)
//   //   ) {
//   //     setResumeData({ ...resumeData, education: convertedEntries });
//   //   }
//   //   // eslint-disable-next-line react-hooks/exhaustive-deps
//   // }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof EducationEntry>(
//     index: number,
//     field: K,
//     value: EducationEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("education", savedEntries.length + index, field as string);
//   };

//   const addEducation = () => {
//     let hasErrors = false;
//     editingEntries.forEach((entry, editIndex) => {
//       const globalIndex = savedEntries.length + editIndex;
//       clearSectionIndexErrors("education", globalIndex);
//       const isValid = validateRequired("education", globalIndex, {
//         school: entry.school,
//         degree: entry.degree,
//       });
//       if (!isValid) {
//         hasErrors = true;
//       }
//     });

//     if (hasErrors) {
//       console.log("❌ Validation failed - cannot save education");
//       return;
//     }

//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyEducation()]);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyEducation()]);
//   };

//   const removeEducation = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("education", index);
//     reindexErrors("education", index);
//   };

//   const editEntry = (index: number) => {
//     const entryToEdit = savedEntries[index];
//     const updatedSaved = [...savedEntries];
//     updatedSaved.splice(index, 1);
//     setSavedEntries(updatedSaved);
//     setEditingEntries([entryToEdit]);
//   };

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Saved Entries */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4 mt-8">
//           <div className="flex flex-col gap-4">
//             {savedEntries.map((education, index) => (
//               <div
//                 key={index}
//                 className="flex items-start justify-between gap-4 border-b pb-3"
//               >
//                 <div className="flex-1 flex flex-col gap-1">
//                   <div className="text-base font-bold text-gray-900">
//                     {education.degree || "No degree"}
//                   </div>
//                   <div className="text-sm text-gray-700">
//                     {education.school || "No school"}
//                   </div>
//                   <div className="text-xs text-gray-600">
//                     {education.startDate || ""}
//                     {education.startDate && education.endDate && " - "}
//                     {education.endDate || ""}
//                   </div>
//                 </div>
//                 <div className="flex gap-3">
//                   <button
//                     type="button"
//                     onClick={() => editEntry(index)}
//                     className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full"
//                   >
//                     <RiEdit2Fill size={20} className="text-[#595959]" />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => removeEducation(index)}
//                     className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full"
//                   >
//                     <Trash2
//                       size={20}
//                       className="text-[#595959] hover:text-red-500"
//                     />
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
//               <LuPlus
//                 size={20}
//                 className="text-[#595959] group-hover:text-white"
//               />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Editing Form */}
//       {editingEntries.length > 0 && (
//         <div className="flex gap-6 items-start">
//           <div
//             ref={formScrollRef}
//             className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2"
//           >
//             <div className="flex flex-col gap-3">
//               {editingEntries.map((education, editIndex) => {
//                 const globalIndex = savedEntries.length + editIndex;
//                 return (
//                   <div
//                     key={`edit-${editIndex}`}
//                     className="flex flex-col gap-3 pb-4 relative"
//                   >
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           School <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={education.school}
//                           placeholder="School Name"
//                           onChange={(e) =>
//                             handleChange(editIndex, "school", e.target.value)
//                           }
//                           onBlur={() =>
//                             validateRequired("education", globalIndex, {
//                               school: education.school,
//                             })
//                           }
//                           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                         />
//                         {errors[`education-${globalIndex}-school`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`education-${globalIndex}-school`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Degree <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={education.degree}
//                           placeholder="Bachelor's, Master's, etc."
//                           onChange={(e) =>
//                             handleChange(editIndex, "degree", e.target.value)
//                           }
//                           onBlur={() =>
//                             validateRequired("education", globalIndex, {
//                               degree: education.degree,
//                             })
//                           }
//                           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//                         />
//                         {errors[`education-${globalIndex}-degree`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`education-${globalIndex}-degree`]}
//                           </span>
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Start date
//                         </label>
//                         <MonthYearPicker
//                           value={education.startDate}
//                           onChange={(val) =>
//                             handleChange(editIndex, "startDate", val)
//                           }
//                           placeholder="MM/YY"
//                         />
//                       </div>
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           End date
//                         </label>
//                         <MonthYearPicker
//                           value={education.endDate}
//                           onChange={(val) =>
//                             handleChange(editIndex, "endDate", val)
//                           }
//                           placeholder="MM/YY"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}

//               <div className="pt-2">
//                 <button
//                   type="button"
//                   onClick={addEducation}
//                   className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
//                 >
//                   + Add Additional
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Tips Sidebar */}
//           <div className="w-80 flex-shrink-0 sticky top-2">
//             {showTips && (
//               <div className="bg-[#faf9f8] rounded-lg p-5">
//                 <h3 className="text-base font-bold text-[#2d2d2d] mb-3">
//                   Tips
//                 </h3>
//                 <div className="border-t border-gray-300 mb-3"></div>
//                 <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//                   <p>
//                     Education credentials validate your qualifications and
//                     academic foundation. List your most recent and relevant
//                     educational achievements in reverse chronological order.*
//                   </p>
//                   <p>
//                     Include the institution name, degree earned, and dates
//                     attended. Highlight honors or achievements that strengthen
//                     your candidacy.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *95% of employers verify education credentials during the
//                     hiring process.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Education;



