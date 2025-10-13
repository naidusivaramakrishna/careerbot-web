import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation"; // ✅ Import validation hook
interface ReferenceEntry {
  name: string;
  relation?: string;
  contact: string;
}
const References: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  } = useValidation();
  const handleChange = (
    index: number,
    field: keyof ReferenceEntry,
    value: string
  ) => {
    const updated = [...(resumeData.references || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, references: updated });

    // Clear error when user types
    clearError("reference", index, field);
  };
  const addReference = () => {
    setResumeData({
      ...resumeData,
      references: [
        ...(resumeData.references || []),
        { name: "", relation: "", contact: "" },
      ],
    });
  };
  const removeReference = (index: number) => {
    const updated = [...(resumeData.references || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, references: updated });

    // Clear related errors and reindex
    clearSectionIndexErrors("reference", index);
    reindexErrors("reference", index);
  };
  // 🔑 Ensure validation always shows proper messages
  const validateReferences = () => {
    let allValid = true;
    (resumeData.references || []).forEach((ref: ReferenceEntry, index: number) => {
      const valid = validateRequired("reference", index, {
        name: ref.name,
        contact: ref.contact,
      });
      if (!valid) allValid = false;
    });
    return allValid;
  };
  return (
    <div className="flex flex-col gap-6 ml-8 mt-3">
      {(resumeData.references || []).map((ref: ReferenceEntry, index: number) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ref.name}
              placeholder="Enter Name"
              onChange={(e) => handleChange(index, "name", e.target.value)}
              onBlur={() =>
                validateRequired("reference", index, { name: ref.name })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`reference-${index}-name`] && (
              <span className="text-xs text-red-500">
                This field is required
              </span>
            )}
          </div>
          {/* Relation */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Relation
            </label>
            <input
              type="text"
              value={ref.relation || ""}
              placeholder="Enter Relation"
              onChange={(e) => handleChange(index, "relation", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>
          {/* Contact */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Contact <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ref.contact}
              placeholder="Enter Contact"
              onChange={(e) => handleChange(index, "contact", e.target.value)}
              onBlur={() =>
                validateRequired("reference", index, { contact: ref.contact })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`reference-${index}-contact`] && (
              <span className="text-xs text-red-500">
                This field is required
              </span>
            )}
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeReference(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}
      {/* Add Reference */}
      <button
        type="button"
        onClick={addReference}
        className="w-fit px-11 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Reference
      </button>
      {/* Validation trigger (for form submission flow) */}
      <button type="button" onClick={validateReferences} className="hidden">
        Validate
      </button>
    </div>
  );
};
export default References;
