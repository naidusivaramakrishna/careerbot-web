import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { countryCodes } from "../../../_utils/sectionsConfig";

interface Field {
  field: string;
  key: "fullname" | "email" | "phone" | "countryCode" | "location" | "linkedinUrl" | "portfolioUrl";
  required: boolean;
  type?: string;
}

interface PersonalInfoProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ formData, errors, onChange, onBlur }) => {
  const { resumeData, setResumeData } = useResume();

  const fields: Field[] = [
    { field: "Full Name", key: "fullname", required: true },
    { field: "Email", key: "email", required: true, type: "email" },
    { field: "Location", key: "location", required: true },
    { field: "LinkedIn URL", key: "linkedinUrl", required: false, type: "url" },
    { field: "Portfolio URL", key: "portfolioUrl", required: false, type: "url" },
  ];

  const handleChange = (field: Field["key"], value: string) => {
    // ✅ Update context for preview
    let phoneValue = value;

    // If this is a phone or countryCode change, combine them for preview
    if (field === "phone" || field === "countryCode") {
      const countryCode = field === "countryCode" ? value : (formData["countryCode"] || "+91");
      const phone = field === "phone" ? value : (formData["phone"] || "");
      // Combine for preview: countryCode + phone (no gap)
      phoneValue = phone ? `${countryCode}${phone}` : "";
    }

    setResumeData({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field === "countryCode" || field === "phone" ? "phone" : field]: phoneValue
      },
    });

    // ✅ Update formData for saving
    onChange(field, value);
  };

  const handleBlur = (field: Field) => {
    const value = formData[field.key] || "";
    onBlur(field.key, value);
  };

  const renderField = (f: Field) => (
    <div key={f.key} className="flex flex-col gap-1 w-full">
      <label className="text-sm font-semibold text-[#3b3b3b]">
        {f.field} {f.required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={f.key}
        type={f.type ?? "text"}
        value={formData[f.key] || ""}
        placeholder={`Enter ${f.field}`}
        onChange={(e) => handleChange(f.key, e.target.value)}
        onBlur={() => handleBlur(f)}
        className="w-55 px-2 py-3.5 rounded-md text-sm text-[#7b7b7a] bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7] transition-all duration-200 hover:bg-[#f3f2f1]"
      />
      {errors[f.key] && (
        <span className="text-xs text-red-500">
          {errors[f.key]}
        </span>
      )}
    </div>
  );

  const renderPhoneField = () => (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-semibold text-[#3b3b3b]">
        Phone Number <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center rounded-md bg-[#faf9f8] border-b-2 border-transparent focus-within:border-[#5896d7] hover:bg-[#f3f2f1] transition-all duration-200">
        {/* Country Code Dropdown */}
        <select
          value={formData["countryCode"] || "+91"}
          onChange={(e) => handleChange("countryCode", e.target.value)}
          className="px-1 py-3.5 text-xs bg-transparent text-black outline-none cursor-pointer font-medium appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundPosition: "right 2px center",
            backgroundRepeat: "no-repeat",
            paddingRight: "4px"
          }}
        >
          {countryCodes.map((cc) => (
            <option key={cc.code} value={cc.code}>
              {cc.flag} {cc.code}
            </option>
          ))}
        </select>

        {/* Vertical Separator */}
        <div className="w-px h-6 bg-gray-300 ml-0.5" />

        {/* Phone Number Input */}
        <input
          type="tel"
          name="phone"
          value={formData["phone"] || ""}
          placeholder="Enter phone number"
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => onBlur("phone", formData["phone"] || "")}
          className="flex-1 px-1 py-3.5 text-sm bg-transparent text-black outline-none"
          // className="w-35 px-1 py-3.5 rounded-md text-sm text-[#7b7b7a] bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7] transition-all duration-200 hover:bg-[#f3f2f1]"
        />
      </div>
      {(errors["phone"] || errors["countryCode"]) && (
        <span className="text-xs text-red-500">
          {errors["phone"] || errors["countryCode"]}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex gap-6 ml-6 items-start">
      {/* Left Side: Form Fields */}
      <div className="flex flex-col gap-3 flex-1 mt-10">
        {/* Row 1: Full Name + Email */}
        <div className="flex gap-4">
          {renderField(fields[0])}
          {renderField(fields[1])}
        </div>

        {/* Row 2: Phone Number (with Country Code) + Location */}
        <div className="flex gap-4">
          {renderPhoneField()}
          {renderField(fields[2])}
        </div>

        {/* Row 3: LinkedIn URL + Portfolio URL */}
        <div className="flex gap-4">
          {renderField(fields[3])}
          {renderField(fields[4])}
        </div>
      </div>

      {/* Right Side: Tips Panel */}
      <div className="w-80 bg-[#faf9f8] rounded-lg p-5 flex-shrink-0 mt-0">
        <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
        
        {/* Divider Line */}
        <div className="border-t border-gray-300 mb-4"></div>
        
         <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
          <p>
            Always include your full name, professional email address, current phone number with voicemail, and city-state location to help recruiters contact you for interviews easily.
          </p>
          
          <p>
            Add LinkedIn profile and portfolio links only when they are current, professional, relevant to your industry, and showcase your work effectively to potential employers consistently.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
