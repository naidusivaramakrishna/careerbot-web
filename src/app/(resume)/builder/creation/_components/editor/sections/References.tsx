// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation"; // ✅ Import validation hook
// interface ReferenceEntry {
//   name: string;
//   relation?: string;
//   contact: string;
// }
// const References: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const {
//     errors,
//     validateRequired,
//     clearError,
//     clearSectionIndexErrors,
//     reindexErrors,
//   } = useValidation();
//   const handleChange = (
//     index: number,
//     field: keyof ReferenceEntry,
//     value: string
//   ) => {
//     const updated = [...(resumeData.references || [])];
//     updated[index] = { ...updated[index], [field]: value };
//     setResumeData({ ...resumeData, references: updated });

//     // Clear error when user types
//     clearError("reference", index, field);
//   };
//   const addReference = () => {
//     setResumeData({
//       ...resumeData,
//       references: [
//         ...(resumeData.references || []),
//         { name: "", relation: "", contact: "" },
//       ],
//     });
//   };
//   const removeReference = (index: number) => {
//     const updated = [...(resumeData.references || [])];
//     updated.splice(index, 1);
//     setResumeData({ ...resumeData, references: updated });

//     // Clear related errors and reindex
//     clearSectionIndexErrors("reference", index);
//     reindexErrors("reference", index);
//   };
//   // 🔑 Ensure validation always shows proper messages
//   const validateReferences = () => {
//     let allValid = true;
//     (resumeData.references || []).forEach((ref: ReferenceEntry, index: number) => {
//       const valid = validateRequired("reference", index, {
//         name: ref.name,
//         contact: ref.contact,
//       });
//       if (!valid) allValid = false;
//     });
//     return allValid;
//   };
//   return (
//     <div className="flex flex-col gap-6 ml-8 mt-3">
//       {(resumeData.references || []).map((ref: ReferenceEntry, index: number) => (
//         <div key={index} className="flex flex-col gap-3 border-b pb-4">
//           {/* Name */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={ref.name}
//               placeholder="Enter Name"
//               onChange={(e) => handleChange(index, "name", e.target.value)}
//               onBlur={() =>
//                 validateRequired("reference", index, { name: ref.name })
//               }
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`reference-${index}-name`] && (
//               <span className="text-xs text-red-500">
//                 This field is required
//               </span>
//             )}
//           </div>
//           {/* Relation */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Relation
//             </label>
//             <input
//               type="text"
//               value={ref.relation || ""}
//               placeholder="Enter Relation"
//               onChange={(e) => handleChange(index, "relation", e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//           </div>
//           {/* Contact */}
//           <div className="flex flex-col gap-1">
//             <label className="text-sm font-semibold text-gray-700">
//               Contact <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={ref.contact}
//               placeholder="Enter Contact"
//               onChange={(e) => handleChange(index, "contact", e.target.value)}
//               onBlur={() =>
//                 validateRequired("reference", index, { contact: ref.contact })
//               }
//               className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//             />
//             {errors[`reference-${index}-contact`] && (
//               <span className="text-xs text-red-500">
//                 This field is required
//               </span>
//             )}
//           </div>
//           {/* Remove button */}
//           <button
//             type="button"
//             onClick={() => removeReference(index)}
//             className="self-start text-xs text-red-500 hover:underline mt-1"
//           >
//             Remove
//           </button>
//         </div>
//       ))}
//       {/* Add Reference */}
//       <button
//         type="button"
//         onClick={addReference}
//         className="w-fit px-11 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//       >
//         + Add Reference
//       </button>
//       {/* Validation trigger (for form submission flow) */}
//       <button type="button" onClick={validateReferences} className="hidden">
//         Validate
//       </button>
//     </div>
//   );
// };
// export default References; brfore tips


import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';

interface ReferenceEntry {
  name: string;
  relation: string;
  contact: string;
}

const emptyReference = (): ReferenceEntry => ({
  name: "",
  relation: "",
  contact: "",
});

const References: React.FC = () => {
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

  const hasValidData = (entry: ReferenceEntry): boolean => {
    return !!(entry.name || entry.relation || entry.contact);
  };

  const [savedEntries, setSavedEntries] = useState<ReferenceEntry[]>(() => {
    if (resumeData.references && resumeData.references.length) {
      const validEntries = resumeData.references.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<ReferenceEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyReference()];
    }
    return [];
  });

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.references) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, references: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  const handleChange = <K extends keyof ReferenceEntry>(
    index: number,
    field: K,
    value: ReferenceEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("reference", savedEntries.length + index, field as string);
  };

  const addReference = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyReference()]);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyReference()]);
  };

  const removeReference = (index: number) => {
    const updated = [...savedEntries];
    updated.splice(index, 1);
    setSavedEntries(updated);
    clearSectionIndexErrors("reference", index);
    reindexErrors("reference", index);
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
            {savedEntries.map((reference, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* Name - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {reference.name || "No name"}
                  </div>
                  
                  {/* Relation */}
                  {reference.relation && (
                    <div className="text-sm text-gray-700">
                      {reference.relation}
                    </div>
                  )}
                  
                  {/* Contact */}
                  {reference.contact && (
                    <div className="text-xs text-gray-600">
                      {reference.contact}
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
                    onClick={() => removeReference(index)}
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
              {editingEntries.map((reference, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Reference Name & Relation */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Reference Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={reference.name}
                          placeholder="Full Name"
                          onChange={(e) => handleChange(editIndex, "name", e.target.value)}
                          onBlur={() => validateRequired("reference", globalIndex, { name: reference.name })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                        {errors[`reference-${globalIndex}-name`] && (
                          <span className="text-xs text-red-500">
                            {errors[`reference-${globalIndex}-name`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Relation
                        </label>
                        <input
                          type="text"
                          value={reference.relation}
                          placeholder="Manager, Colleague, Professor, etc."
                          onChange={(e) => handleChange(editIndex, "relation", e.target.value)}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Contact</label>
                        <input
                          type="text"
                          value={reference.contact}
                          placeholder="Email or Phone Number"
                          onChange={(e) => handleChange(editIndex, "contact", e.target.value)}
                          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
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
                  onClick={addReference}
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
                    Professional references strengthen your application by providing third-party validation of your skills and work ethic. Choose references who can speak knowledgeably about your qualifications.*
                  </p>
                  <p>
                    Include their full name, professional relationship to you, and contact information. Always ask permission before listing someone as a reference and keep them informed about your job search.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *90% of employers contact references during the hiring process.
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

export default References;

