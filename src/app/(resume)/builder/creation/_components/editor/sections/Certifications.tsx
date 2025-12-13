// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";

// interface CertificationEntry {
//   name: string;
//   issuedBy?: string;
//   year?: string;
// }

// const Certifications: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const {
//     errors,
//     validateRequired,
//     clearError,
//     clearSectionIndexErrors,
//     reindexErrors,
//   } = useValidation();

//   const handleChange = (index: number, field: keyof CertificationEntry, value: string) => {
//     const updated = [...(resumeData.certifications || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, certifications: updated });
//     clearError("cert", index, field); // ✅ clear error while typing
//   };

//   const addCertification = () => {
//     setResumeData({
//       ...resumeData,
//       certifications: [
//         ...(resumeData.certifications || []),
//         { name: "", issuedBy: "", year: "" },
//       ],
//     });
//   };

//   const removeCertification = (index: number) => {
//     const updated = [...(resumeData.certifications || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, certifications: updated });

//     clearSectionIndexErrors("cert", index); // ✅ clear removed field errors
//     reindexErrors("cert", index); // ✅ reindex shifted items
//   };

//   return (
//     <div className="flex flex-col gap-6 ml-8 mt-3">
//       {(resumeData.certifications || []).map((cert: CertificationEntry, index: number) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4">
//           {/* Certification Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Certification Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={cert.name}
//               placeholder="Enter Certification Name"
//               onChange={(e) => handleChange(index, "name", e.target.value)}
//               onBlur={() => validateRequired("cert", index, { name: cert.name })} // ✅ validate on blur
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`cert-${index}-name`] && (
//               <span className="text-xs text-red-500">{errors[`cert-${index}-name`]}</span>
//             )}
//           </div>

//           {/* Issued By */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">Issued By</label>
//             <input
//               type="text"
//               value={cert.issuedBy || ""}
//               placeholder="Enter Issued By"
//               onChange={(e) => handleChange(index, "issuedBy", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>

//           {/* Year */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">Year</label>
//             <input
//               type="text"
//               value={cert.year || ""}
//               placeholder="Enter Year"
//               onChange={(e) => handleChange(index, "year", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>

//           {/* Remove Button */}
//           <button
//             type="button"
//             onClick={() => removeCertification(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}

//       {/* Add Certification Button */}
//       <button
//         type="button"
//         onClick={addCertification}
//         className="w-fit px-10 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Certification
//       </button>
//     </div>
//   );
// };

// export default Certifications; before tips



// import React, { useRef, useEffect, useState } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// import { RiEdit2Fill } from 'react-icons/ri';
// import { Trash2 } from 'lucide-react';
// import { LuPlus } from 'react-icons/lu';

// interface CertificationEntry {
//   name: string;
//   issuedBy: string;
//   year: string;
// }

// const emptyCertification = (): CertificationEntry => ({
//   name: "",
//   issuedBy: "",
//   year: "",
// });

// const Certifications: React.FC = () => {
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

//   const hasValidData = (entry: CertificationEntry): boolean => {
//     return !!(entry.name || entry.issuedBy || entry.year);
//   };

//   const [savedEntries, setSavedEntries] = useState<CertificationEntry[]>(() => {
//     if (resumeData.certifications && resumeData.certifications.length) {
//       const validEntries = resumeData.certifications.filter(hasValidData);
//       return validEntries;
//     }
//     return [];
//   });

//   const [editingEntries, setEditingEntries] = useState<CertificationEntry[]>(() => {
//     if (savedEntries.length === 0) {
//       return [emptyCertification()];
//     }
//     return [];
//   });

//   useEffect(() => {
//     const allEntries = [...savedEntries, ...editingEntries];
//     if (JSON.stringify(resumeData.certifications) !== JSON.stringify(allEntries)) {
//       setResumeData({ ...resumeData, certifications: allEntries });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [savedEntries, editingEntries]);

//   const handleChange = <K extends keyof CertificationEntry>(
//     index: number,
//     field: K,
//     value: CertificationEntry[K]
//   ) => {
//     const updated = [...editingEntries];
//     updated[index] = { ...updated[index], [field]: value };
//     setEditingEntries(updated);
//     clearError("certification", savedEntries.length + index, field as string);
//   };

//   const addCertification = () => {
//     const validEditingEntries = editingEntries.filter(hasValidData);

//     if (validEditingEntries.length > 0) {
//       setSavedEntries((prev) => [...prev, ...validEditingEntries]);
//     }

//     setEditingEntries([emptyCertification()]);
//   };

//   const addNewEntry = () => {
//     setEditingEntries([emptyCertification()]);
//   };

//   const removeCertification = (index: number) => {
//     const updated = [...savedEntries];
//     updated.splice(index, 1);
//     setSavedEntries(updated);
//     clearSectionIndexErrors("certification", index);
//     reindexErrors("certification", index);
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
//       {/* Saved Entries List with Add Button */}
//       {savedEntries.length > 0 && editingEntries.length === 0 && (
//         <div className="flex flex-col gap-4 mt-8">
//           <div className="flex flex-col gap-4">
//             {savedEntries.map((certification, index) => (
//               <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
//                 <div className="flex-1 flex flex-col gap-1">
//                   {/* Name - Main heading */}
//                   <div className="text-base font-bold text-gray-900">
//                     {certification.name || "No certification name"}
//                   </div>
                  
//                   {/* Issued By */}
//                   {certification.issuedBy && (
//                     <div className="text-sm text-gray-700">
//                       {certification.issuedBy}
//                     </div>
//                   )}
                  
//                   {/* Year */}
//                   {certification.year && (
//                     <div className="text-xs text-gray-600">
//                       {certification.year}
//                     </div>
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
//                     onClick={() => removeCertification(index)}
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
//               {editingEntries.map((certification, editIndex) => {
//                 const globalIndex = savedEntries.length + editIndex;
//                 return (
//                   <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
//                     {/* Certification Name & Issued By */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Certification Name <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={certification.name}
//                           placeholder="Certification Name"
//                           onChange={(e) => handleChange(editIndex, "name", e.target.value)}
//                           onBlur={() => validateRequired("certification", globalIndex, { name: certification.name })}
//                         className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
//                         />
//                         {errors[`certification-${globalIndex}-name`] && (
//                           <span className="text-xs text-red-500">
//                             {errors[`certification-${globalIndex}-name`]}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">
//                           Issued By
//                         </label>
//                         <input
//                           type="text"
//                           value={certification.issuedBy}
//                           placeholder="Organization Name"
//                           onChange={(e) => handleChange(editIndex, "issuedBy", e.target.value)}
//                           className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
//                         />
//                       </div>
//                     </div>

//                     {/* Year */}
//                     <div className="flex gap-4">
//                       <div className="flex flex-col gap-1 flex-1">
//                         <label className="text-sm font-semibold text-[#3b3b3b]">Year</label>
//                         <input
//                           type="text"
//                           value={certification.year}
//                           placeholder="YYYY"
//                           onChange={(e) => handleChange(editIndex, "year", e.target.value)}
//                           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]"
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
//                   onClick={addCertification}
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
//                     Certifications validate your expertise and commitment to professional development. List relevant certifications that align with your career goals and industry standards.*
//                   </p>
//                   <p>
//                     Include the full certification name, issuing organization, and year obtained. Prioritize recent and industry-recognized certifications that demonstrate your qualifications.
//                   </p>
//                   <p className="text-xs text-gray-500 italic mt-6">
//                     *80% of hiring managers consider certifications when evaluating candidates.
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

// export default Certifications; before expiry id n other



import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';


interface CertificationEntry {
  name: string;
  issuedBy: string;
  year: string;
  expiryDate?: string;
  credentialId?: string;
}


const emptyCertification = (): CertificationEntry => ({
  name: "",
  issuedBy: "",
  year: "",
  expiryDate: "",
  credentialId: "",
});


const Certifications: React.FC = () => {
  const { resumeData, setResumeData } = useResume();


  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  } = useValidation();


  const [showTips] = useState(true);


  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);


  const hasValidData = (entry: CertificationEntry): boolean => {
    return !!(entry.name || entry.issuedBy || entry.year || entry.expiryDate || entry.credentialId);
  };


  const [savedEntries, setSavedEntries] = useState<CertificationEntry[]>(() => {
    if (resumeData.certifications && resumeData.certifications.length) {
      const validEntries = resumeData.certifications.filter(hasValidData);
      return validEntries;
    }
    return [];
  });


  const [editingEntries, setEditingEntries] = useState<CertificationEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyCertification()];
    }
    return [];
  });


  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.certifications) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, certifications: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);


  const handleChange = <K extends keyof CertificationEntry>(
    index: number,
    field: K,
    value: CertificationEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("certification", savedEntries.length + index, field as string);
  };


  const addCertification = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);


    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }


    setEditingEntries([emptyCertification()]);
  };


  const addNewEntry = () => {
    setEditingEntries([emptyCertification()]);
  };


  const removeCertification = (index: number) => {
    const updated = [...savedEntries];
    updated.splice(index, 1);
    setSavedEntries(updated);
    clearSectionIndexErrors("certification", index);
    reindexErrors("certification", index);
  };


  const editEntry = (index: number) => {
    const entryToEdit = savedEntries[index];
    const updatedSaved = [...savedEntries];
    updatedSaved.splice(index, 1);
    setSavedEntries(updatedSaved);
    setEditingEntries([entryToEdit]);
  };


  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List with Add Button */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((certification, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* Name - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {certification.name || "No certification name"}
                  </div>
                  
                  {/* Issued By */}
                  {certification.issuedBy && (
                    <div className="text-sm text-gray-700">
                      {certification.issuedBy}
                    </div>
                  )}
                  
                  {/* Year and Expiry Date */}
                  <div className="flex gap-2 text-xs text-gray-600">
                    {certification.year && (
                      <span>Issued: {certification.year}</span>
                    )}
                    {certification.expiryDate && (
                      <span>• Expires: {certification.expiryDate}</span>
                    )}
                  </div>

                  {/* Credential ID */}
                  {certification.credentialId && (
                    <div className="text-xs text-gray-500">
                      ID: {certification.credentialId}
                    </div>
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
                    onClick={() => removeCertification(index)}
                    className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full "
                  >
                    <Trash2 size={20} className="text-[#595959] hover:text-red-500"/>
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
              {editingEntries.map((certification, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Certification Name & Issued By */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Certification Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={certification.name}
                          placeholder="Certification Name"
                          onChange={(e) => handleChange(editIndex, "name", e.target.value)}
                          onBlur={() => validateRequired("certification", globalIndex, { name: certification.name })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
                        />
                        {errors[`certification-${globalIndex}-name`] && (
                          <span className="text-xs text-red-500">
                            {errors[`certification-${globalIndex}-name`]}
                          </span>
                        )}
                      </div>


                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Issued By
                        </label>
                        <input
                          type="text"
                          value={certification.issuedBy}
                          placeholder="Organization Name"
                          onChange={(e) => handleChange(editIndex, "issuedBy", e.target.value)}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]`}
                        />
                      </div>
                    </div>


                    {/* Year & Expiry Date */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Year</label>
                        <input
                          type="text"
                          value={certification.year}
                          placeholder="YYYY"
                          onChange={(e) => handleChange(editIndex, "year", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]"
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Expiry Date <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={certification.expiryDate || ""}
                          placeholder="YYYY or MM/YYYY"
                          onChange={(e) => handleChange(editIndex, "expiryDate", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]"
                        />
                      </div>
                    </div>

                    {/* Credential ID */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Credential ID <span className="text-xs text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={certification.credentialId || ""}
                          placeholder="Certificate or License Number"
                          onChange={(e) => handleChange(editIndex, "credentialId", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7]"
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
                  onClick={addCertification}
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
                    Certifications validate your expertise and commitment to professional development. List relevant certifications that align with your career goals and industry standards.
                  </p>
                  <p>
                    Include the full certification name, issuing organization, and year obtained. Add credential IDs and expiry dates when applicable to verify authenticity and currency.
                  </p>
                  <p>
                    Prioritize recent and industry-recognized certifications that demonstrate your qualifications and keep your credentials current.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *80% of hiring managers consider certifications when evaluating candidates.
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


export default Certifications;



