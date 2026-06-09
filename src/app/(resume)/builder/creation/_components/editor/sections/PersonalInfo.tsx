import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useResume } from "../../../_context/ResumeContext";
import { countryCodes } from "../../../_utils/sectionsConfig";
import SectionTipsPanel from "../SectionTipsPanel";
import { ChevronDown } from "lucide-react";
import logger from "@/lib/logger";

interface Field {
  field: string;
  key: "fullname" | "email" | "phone" | "countryCode" | "location" | "linkedinUrl" | "githubUrl" | "portfolioUrl" | "dateOfBirth" | "nationality" | "category" | "languages" | "titlePrefix" | "qualifications";
  required: boolean;
  type?: string;
  maxLength?: number;
  readOnly?: boolean;
}

interface PersonalInfoProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ formData, errors, onChange, onBlur }) => {
  const { resumeData, setResumeData } = useResume();
  const searchParams = useSearchParams();
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const [codeDropdownOpen, setCodeDropdownOpen] = useState(false);
  const [isGovernmentTemplate, setIsGovernmentTemplate] = useState(false);
  const [isHealthcareTemplate, setIsHealthcareTemplate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get domain from localStorage to check if it's government_standard or healthcare
  useEffect(() => {
    try {
      let isGov = false;
      let isHealthcare = false;

      // First, try localStorage
      const userEmail = resumeData.personalInfo?.email || '';
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
      const careerLevelStorage = localStorage.getItem(careerLevelKey);

      if (careerLevelStorage) {
        const careerLevels = JSON.parse(careerLevelStorage) as Array<{
          domain_family?: string;
        }>;
        isGov = careerLevels.some(t => t.domain_family === 'government_standard');
        isHealthcare = careerLevels.some(t => t.domain_family === 'healthcare');
      }

      // If not found in localStorage, check if government/healthcare fields exist in formData
      if (!isGov && !isHealthcare) {
        const hasGovFields = formData['dateOfBirth'] || formData['nationality'] || formData['category'] || formData['languages'];
        const hasHealthcareFields = formData['titlePrefix'] || formData['qualifications'];
        isGov = !!hasGovFields;
        isHealthcare = !!hasHealthcareFields;
      }

      setIsGovernmentTemplate(isGov);
      setIsHealthcareTemplate(isHealthcare);
      logger.info('Government template detected:', isGov);
      logger.info('Healthcare template detected:', isHealthcare);
    } catch (err) {
      logger.warn('Error checking template domain:', err);
    }
  }, [resumeData.personalInfo?.email, formData]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCodeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fields: Field[] = [
    { field: "Full Name", key: "fullname", required: true, maxLength: 100 },
    { field: "Email", key: "email", required: true, type: "email", maxLength: 254, readOnly: !isEnhancedResume },
    { field: "Location", key: "location", required: true, maxLength: 100 },
    { field: "LinkedIn URL", key: "linkedinUrl", required: false, type: "url" },
    { field: "GitHub URL", key: "githubUrl", required: false, type: "url" },
    { field: "Portfolio URL", key: "portfolioUrl", required: false, type: "url" },
  ];

  const handleChange = (field: Field["key"] | "dateOfBirth" | "nationality" | "category" | "languages" | "titlePrefix" | "qualifications", value: string) => {
    // ✅ Update context for preview
    // Store phone and countryCode separately — templates handle combining them for display
    setResumeData({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: value,
      },
    });

    // ✅ Update formData for saving
    onChange(field, value);
  };

  const handleBlur = (field: Field) => {
    const value = formData[field.key] || "";
    onBlur(field.key, value);
  };

  const getFieldValue = (key: string): string => {
    return (formData[key] as string) || "";
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for date picker
  const convertToDatePickerFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return ddmmyyyy;
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY for storage/display
  const convertFromDatePickerFormat = (yyyymmdd: string): string => {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return yyyymmdd;
  };

  const renderGovField = (fieldName: "dateOfBirth" | "nationality" | "category" | "languages" | "titlePrefix" | "qualifications", label: string, placeholder?: string, type: string = "text", maxLength?: number) => {
    if (fieldName === "dateOfBirth") {
      return (
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-semibold text-[#3b3b3b]">{label}</label>
          <input
            type="date"
            name={fieldName}
            value={convertToDatePickerFormat(getFieldValue(fieldName))}
            onChange={(e) => handleChange(fieldName, convertFromDatePickerFormat(e.target.value))}
            onBlur={() => onBlur(fieldName, getFieldValue(fieldName))}
            className={`w-full px-2 py-3.5 rounded-md text-sm text-[#7b7b7a] bg-[#faf9f8] border-2 focus:outline-none transition-all duration-200 hover:bg-[#f3f2f1] ${errors[fieldName] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
          />
          {errors[fieldName] && (
            <span className="text-xs text-red-500">
              {errors[fieldName]}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-[#3b3b3b]">{label}</label>
        <input
          type={type}
          name={fieldName}
          value={getFieldValue(fieldName)}
          placeholder={placeholder}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          onBlur={() => onBlur(fieldName, getFieldValue(fieldName))}
          maxLength={maxLength}
          className={`w-full px-2 py-3.5 rounded-md text-sm text-[#7b7b7a] bg-[#faf9f8] border-2 focus:outline-none transition-all duration-200 hover:bg-[#f3f2f1] ${errors[fieldName] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#5896d7]"}`}
        />
        {errors[fieldName] && (
          <span className="text-xs text-red-500">
            {errors[fieldName]}
          </span>
        )}
      </div>
    );
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
        onChange={(e) => !f.readOnly && handleChange(f.key, e.target.value)}
        onBlur={() => !f.readOnly && handleBlur(f)}
        maxLength={f.readOnly ? undefined : f.maxLength}
        readOnly={f.readOnly}
        className={`w-full px-2 py-3.5 rounded-md text-sm border-2 focus:outline-none transition-all duration-200 ${f.readOnly ? "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent select-none" : `text-[#7b7b7a] bg-[#faf9f8] hover:bg-[#f3f2f1] ${errors[f.key] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[#5896d7]"}`}`}
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
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setCodeDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-3.5 text-xs bg-transparent text-black outline-none cursor-pointer font-medium whitespace-nowrap"
          >
            {formData["countryCode"] || "+91"}
            <ChevronDown className="w-3 h-3" />
          </button>
          {codeDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-24 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {countryCodes.map((cc) => (
                <button
                  key={cc.code}
                  type="button"
                  onClick={() => {
                    handleChange("countryCode", cc.code);
                    setCodeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 ${
                    (formData["countryCode"] || "+91") === cc.code ? "bg-gray-50 font-semibold" : ""
                  }`}
                >
                  <span>{cc.flag}</span>
                  <span>{cc.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
          maxLength={15}
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
        <div className="flex gap-10">
          {renderField(fields[0])}
          {renderField(fields[1])}
        </div>

        {/* Row 2: Phone Number (with Country Code) + Location */}
        <div className="flex gap-10">
          {renderPhoneField()}
          {renderField(fields[2])}
        </div>

        {/* Row 3: LinkedIn URL + GitHub URL */}
        <div className="flex gap-10">
          {renderField(fields[3])}
          {renderField(fields[4])}
        </div>

        {/* Row 4: Portfolio URL */}
        <div className="flex gap-10">
          {renderField(fields[5])}
        </div>

        {/* Government Standard Template Fields */}
        {isGovernmentTemplate && (
          <>
            {/* Divider */}
            <div className="my-2 border-t border-gray-300 w-full"></div>

            {/* Government-Specific Section Label */}
            <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">Government Standard - Additional Information</p>

            {/* Row 5: Date of Birth + Nationality */}
            <div className="flex gap-10">
              {renderGovField("dateOfBirth", "Date of Birth", "", "date")}
              {renderGovField("nationality", "Nationality", "e.g., Indian", "text", 60)}
            </div>

            {/* Row 6: Category + Languages */}
            <div className="flex gap-10">
              {renderGovField("category", "Category", "e.g., General, SC, ST, OBC", "text", 80)}
              {renderGovField("languages", "Languages Known", "e.g., English, Hindi, Tamil", "text", 150)}
            </div>
          </>
        )}

        {/* Healthcare Template Fields */}
        {isHealthcareTemplate && (
          <>
            {/* Divider */}
            <div className="my-2 border-t border-gray-300 w-full"></div>

            {/* Healthcare-Specific Section Label */}
            <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">Healthcare - Professional Details</p>

            {/* Row 5: Title Prefix + Qualifications */}
            <div className="flex gap-10">
              {renderGovField("titlePrefix", "Title/Prefix", "e.g., DR., PROF., MR.", "text", 20)}
              {renderGovField("qualifications", "Qualifications", "e.g., MBBS, MD, DM, MS", "text", 100)}
            </div>
          </>
        )}
      </div>

      {/* Right Side: Tips Panel */}
      <div className="w-80 flex-shrink-0 mt-0">
        <SectionTipsPanel
          sectionKey="PersonalInfo"
          staticTips={
            <div className="bg-[#faf9f8] rounded-lg p-5">
              <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
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
          }
        />
      </div>
    </div>
  );
};

export default PersonalInfo;
