import React, { useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation"; // ✅ Import validation hook

interface VolunteeringEntry {
  organization: string;role: string;startDate: string;endDate: string;
}
const Volunteering: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const {errors,validateRequired,clearError,clearSectionIndexErrors,reindexErrors,} = useValidation();
  // ✅ Track touched fields individually
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const volunteering: VolunteeringEntry[] = resumeData.volunteering || [
    { organization: "", role: "", startDate: "", endDate: "" },
  ];
  const markTouched = (section: string, index: number, field: string) => {
    const key = `${section}-${index}-${field}`;
    setTouched((prev) => ({ ...prev, [key]: true }));
  };
  const handleChange = (index: number, field: keyof VolunteeringEntry, value: string) => {
    const updated = [...(resumeData.volunteering || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, volunteering: updated });
    // ✅ Clear error once user types
    clearError("volunteering", index, field);
  };
  const handleBlur = (index: number, field: keyof VolunteeringEntry, value: string) => {
    // ✅ Mark this field as touched
    markTouched("volunteering", index, field);
    // ✅ Validate ONLY this field
    validateRequired("volunteering", index, {
      [field]: value,
    });
  };
  const addVolunteering = () => {
    setResumeData({
      ...resumeData,
      volunteering: [
        ...(resumeData.volunteering || []),
        { organization: "", role: "", startDate: "", endDate:"" },
      ],
    });
  };
  const removeVolunteering = (index: number) => {
    const updated = [...(resumeData.volunteering || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, volunteering: updated });
    // ✅ Clear and reindex errors
    clearSectionIndexErrors("volunteering", index);
    reindexErrors("volunteering", index);
  };
  return (
    <div className="flex flex-col gap-6 ml-8 mt-3">
      {volunteering.map((entry, index) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4">
          {/* Organization */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Organization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={entry.organization}
              placeholder="Enter Organization"
              onChange={(e) => handleChange(index, "organization", e.target.value)}
              onBlur={(e) => handleBlur(index, "organization", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {touched[`volunteering-${index}-organization`] &&
              errors[`volunteering-${index}-organization`] && (
                <span className="text-xs text-red-500">
                  {errors[`volunteering-${index}-organization`]}
                </span>
              )}
          </div>
          {/* Role */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={entry.role}
              placeholder="Enter Role"
              onChange={(e) => handleChange(index, "role", e.target.value)}
              onBlur={(e) => handleBlur(index, "role", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {touched[`volunteering-${index}-role`] &&
              errors[`volunteering-${index}-role`] && (
                <span className="text-xs text-red-500">
                  {errors[`volunteering-${index}-role`]}
                </span>
              )}
          </div>
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Start Date</label>
            <input
              type="month"
              value={entry.startDate}
              onChange={(e) => handleChange(index, "startDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>
          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">End Date</label>
            <input
              type="month"
              value={entry.endDate}
              onChange={(e) => handleChange(index, "endDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeVolunteering(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}
      {/* Add Volunteering */}
      <button
        type="button"
        onClick={addVolunteering}
        className="w-fit px-17 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Volunteering
      </button>
    </div>
  );
};
export default Volunteering;
