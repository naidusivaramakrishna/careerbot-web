import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation"; // adjust import path

interface EducationEntry {
  degree: string;
  school: string;
  startDate: string;
  endDate: string;
}

const Education: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
    useValidation();

  const education: EducationEntry[] = resumeData.education || [
    { degree: "", school: "", startDate: "", endDate: "" },
  ];

  const handleChange = (
    index: number,
    field: keyof EducationEntry,
    value: string
  ) => {
    const updated = [...education];
    updated[index][field] = value;
    setResumeData({ ...resumeData, education: updated });

    clearError("education", index, field);
  };

  const handleBlur = (index: number, entry: EducationEntry) => {
    const requiredFields: Record<string, string> = {
      degree: entry.degree || "",
      school: entry.school || "",
    };
    validateRequired("education", index, requiredFields);
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [...education, { degree: "", school: "", startDate: "", endDate: "" }],
    });
  };

  const removeEducation = (index: number) => {
    const updated = [...education];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, education: updated });

    clearSectionIndexErrors("education", index);
    reindexErrors("education", index);
  };

  return (
    <div className="flex flex-col gap-4 ml-8 mt-3">
      {education.map((entry, index) => (
        <div
          key={index}
          className="p-3 border rounded-lg shadow-sm bg-gray-50 flex flex-col gap-3"
        >
          {/* Degree */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Degree <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={entry.degree}
              placeholder="Enter Degree"
              onChange={(e) => handleChange(index, "degree", e.target.value)}
              onBlur={() => handleBlur(index, entry)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`education-${index}-degree`] && (
              <span className="text-xs text-red-500">
                {errors[`education-${index}-degree`]}
              </span>
            )}
          </div>

          {/* School */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              School / University <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={entry.school}
              placeholder="Enter School / University"
              onChange={(e) => handleChange(index, "school", e.target.value)}
              onBlur={() => handleBlur(index, entry)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`education-${index}-school`] && (
              <span className="text-xs text-red-500">
                {errors[`education-${index}-school`]}
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
            onClick={() => removeEducation(index)}
            className="text-xs text-red-600 hover:underline self-start mt-1"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addEducation}
        className="w-fit px-14 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Education
      </button>
    </div>
  );
};

export default Education;

