import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";

interface Field {
  field: string;
  key: "name" | "email" | "phone" | "location" | "linkedinurl";
  required: boolean;
  type?: string;
}

const PersonalInfo: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError } = useValidation();

  const fields: Field[] = [
    { field: "Full Name", key: "name", required: true },
    { field: "Email", key: "email", required: true, type: "email" },
    { field: "Phone Number", key: "phone", required: true, type: "tel" },
    { field: "Location", key: "location", required: false },
    { field: "LinkedIn URL", key: "linkedinurl", required: false, type: "url" },
  ];

  const handleChange = (field: Field["key"], value: string) => {
    setResumeData({
      ...resumeData,
      personalInfo: { ...resumeData.personalInfo, [field]: value },
    });
    clearError("personalInfo", 0, field);
  };

  const handleBlur = (field: Field) => {
    if (field.required) {
      validateRequired("personalInfo", 0, {
        [field.key]: resumeData.personalInfo[field.key] || "",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 ml-8 mt-3">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            {f.field} {f.required && <span className="text-red-500">*</span>}
          </label>
          <input
            name={f.key}
            type={f.type ?? "text"}
            value={resumeData.personalInfo[f.key] || ""}
            placeholder={`Enter ${f.field}`}
            onChange={(e) => handleChange(f.key, e.target.value)}
            onBlur={() => handleBlur(f)}
            className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
          />
          {errors[`personalInfo-0-${f.key}`] && (
            <span className="text-xs text-red-500">
              {errors[`personalInfo-0-${f.key}`]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonalInfo;





