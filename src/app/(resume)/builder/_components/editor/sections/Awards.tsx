import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation"; // ✅ Import validation

interface AwardEntry {
  title: string;
  issuedBy?: string;
  year?: string;
}

interface Field {
  field: string;
  key: keyof AwardEntry;
  required?: boolean;
  placeholder: string;
  type?: string;
}

const Awards: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
    useValidation();

  const fields: Field[] = [
    { field: "Award Title", key: "title", required: true, placeholder: "Enter Award Title" },
    { field: "Issued By", key: "issuedBy", required: false, placeholder: "Enter Issuer" },
    { field: "Year", key: "year", required: false, placeholder: "Enter Year" },
  ];

  const handleChange = (index: number, field: keyof AwardEntry, value: string) => {
    const updated = [...(resumeData.awards || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, awards: updated });

    // ✅ Clear error when user types
    clearError("award", index, field);
  };

  const handleBlur = (index: number, award: AwardEntry) => {
    // ✅ Only check required fields
    const requiredFields: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required) {
        requiredFields[f.key] = award[f.key] || "";
      }
    });

    validateRequired("award", index, requiredFields);
  };

  const addAward = () => {
    setResumeData({
      ...resumeData,
      awards: [...(resumeData.awards || []), { title: "", issuedBy: "", year: "" }],
    });
  };

  const removeAward = (index: number) => {
    const updated = [...(resumeData.awards || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, awards: updated });

    // ✅ Clear + reindex errors when removing
    clearSectionIndexErrors("award", index);
    reindexErrors("award", index);
  };

  return (
    <div className="flex flex-col gap-4 ml-4 mt-2">
      {(resumeData.awards || []).map((award: AwardEntry, index: number) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">
                {f.field} {f.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={f.type ?? "text"}
                value={award[f.key] || ""}
                placeholder={f.placeholder}
                onChange={(e) => handleChange(index, f.key, e.target.value)}
                onBlur={() => handleBlur(index, award)} // ✅ Validate on blur
                className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
              />
              {errors[`award-${index}-${f.key}`] && (
                <span className="text-xs text-red-500">
                  {errors[`award-${index}-${f.key}`]}
                </span>
              )}
            </div>
          ))}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeAward(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}

      {/* Add Award */}
      <button
        type="button"
        onClick={addAward}
        className="w-fit px-11 py-1 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Award
      </button>
    </div>
  );
};

export default Awards;
