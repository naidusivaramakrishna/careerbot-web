// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";

// interface Field {
//   field: string;
//   key: "name" | "email" | "phone" | "location" | "linkedinurl";
//   required: boolean;
//   type?: string;
// }

// const PersonalInfo: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();

//   const fields: Field[] = [
//     { field: "Full Name", key: "name", required: true },
//     { field: "Email", key: "email", required: true, type: "email" },
//     { field: "Phone Number", key: "phone", required: true, type: "tel" },
//     { field: "Location", key: "location", required: false },
//     { field: "LinkedIn URL", key: "linkedinurl", required: false, type: "url" },
//   ];

//   const handleChange = (field: Field["key"], value: string) => {
//     setResumeData({
//       ...resumeData,
//       personalInfo: { ...resumeData.personalInfo, [field]: value },
//     });
//     clearError("personalInfo", 0, field);
//   };

//   const handleBlur = (field: Field) => {
//     if (field.required) {
//       validateRequired("personalInfo", 0, {
//         [field.key]: resumeData.personalInfo[field.key] || "",
//       });
//     }
//   };

//   return (
//     <div className="flex flex-col gap-3 ml-8 mt-3">
//       {fields.map((f) => (
//         <div key={f.key} className="flex flex-col gap-1">
//           <label className="text-xs font-semibold text-gray-700">
//             {f.field} {f.required && <span className="text-red-500">*</span>}
//           </label>
//           <input
//             name={f.key}
//             type={f.type ?? "text"}
//             value={resumeData.personalInfo[f.key] || ""}
//             placeholder={`Enter ${f.field}`}
//             onChange={(e) => handleChange(f.key, e.target.value)}
//             onBlur={() => handleBlur(f)}
//             className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//           />
//           {errors[`personalInfo-0-${f.key}`] && (
//             <span className="text-xs text-red-500">
//               {errors[`personalInfo-0-${f.key}`]}
//             </span>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default PersonalInfo;




// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";

// interface Field {
//   field: string;
//   key: "name" | "email" | "phone" | "location" | "linkedinurl";
//   required: boolean;
//   type?: string;
// }

// const PersonalInfo: React.FC = () => {
  
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();

//   const fields: Field[] = [
//     { field: "Full Name", key: "name", required: true },
//     { field: "Email", key: "email", required: true, type: "email" },
//     { field: "Phone Number", key: "phone", required: true, type: "tel" },
//     { field: "Location", key: "location", required: false },
//     { field: "LinkedIn URL", key: "linkedinurl", required: false, type: "url" },
//   ];

//   const handleChange = (field: Field["key"], value: string) => {
//     setResumeData({
//       ...resumeData,
//       personalInfo: { ...resumeData.personalInfo, [field]: value },
//     });
//     clearError("personalInfo", 0, field);
//   };

//   const handleBlur = (field: Field) => {
//     if (field.required) {
//       validateRequired("personalInfo", 0, {
//         [field.key]: resumeData.personalInfo[field.key] || "",
//       });
//     }
//   };

//   // Helper to render input field (keeps DRY and identical styling)
//   const renderField = (f: Field) => (
//     <div key={f.key} className="flex flex-col gap-1 w-full">
//       <label className="text-sm font-semibold text-gray-700">
//         {f.field} {f.required && <span className="text-red-500">*</span>}
//       </label>
//       <input
//         name={f.key}
//         type={f.type ?? "text"}
//         value={resumeData.personalInfo[f.key] || ""}
//         placeholder={`Enter ${f.field}`}
//         onChange={(e) => handleChange(f.key, e.target.value)}
//         onBlur={() => handleBlur(f)}
//         className="w-full px-2 py-3 rounded text-sm text-black bg-[#F5F5F5] hover:bg-gray-300"
//       />
//       {errors[`personalInfo-0-${f.key}`] && (
//         <span className="text-xs text-red-500">
//           {errors[`personalInfo-0-${f.key}`]}
//         </span>
//       )}
//     </div>
//   );

//   return (
//     <div className="flex flex-col gap-3 ml-6 mt-6 ">
//       {/* Row 1: Full Name + Email */}
//       <div className="flex gap-4">
//         {renderField(fields[0])}
//         {renderField(fields[1])}
//       </div>

//       {/* Row 2: Phone Number + Location */}
//       <div className="flex gap-4">
//         {renderField(fields[2])}
//         {renderField(fields[3])}
//       </div>

//       {/* Row 3: LinkedIn URL (single field) */}
//       <div className="flex gap-4">{renderField(fields[4])}</div>
//     </div>
//   );
// };

// export default PersonalInfo; before line border



// import React from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";

// interface Field {
//   field: string;
//   key: "name" | "email" | "phone" | "location" | "linkedinurl" | "portifoliourl";
//   required: boolean;
//   type?: string;
// }

// const PersonalInfo: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();

//   const fields: Field[] = [
//     { field: "Full Name", key: "name", required: true },
//     { field: "Email", key: "email", required: true, type: "email" },
//     { field: "Phone Number", key: "phone", required: true, type: "tel" },
//     { field: "Location", key: "location", required: true },
//     { field: "LinkedIn URL", key: "linkedinurl", required: false, type: "url" },
//     { field: "Portifolio URL", key: "portifoliourl", required: false, type: "url" },
//   ];

//   const handleChange = (field: Field["key"], value: string) => {
//     setResumeData({
//       ...resumeData,
//       personalInfo: { ...resumeData.personalInfo, [field]: value },
//     });
//     clearError("personalInfo", 0, field);
//   };

//   const handleBlur = (field: Field) => {
//     if (field.required) {
//       validateRequired("personalInfo", 0, {
//         [field.key]: resumeData.personalInfo[field.key] || "",
//       });
//     }
//   };

//   const renderField = (f: Field) => (
//     <div key={f.key} className="flex flex-col gap-1 w-full">
//       <label className="text-sm font-semibold text-[#3b3b3b]">
//         {f.field} {f.required && <span className="text-red-500">*</span>}
//       </label>
//       <input
//         name={f.key}
//         type={f.type ?? "text"}
//         value={resumeData.personalInfo[f.key] || ""}
//         placeholder={`Enter ${f.field}`}
//         onChange={(e) => handleChange(f.key, e.target.value)}
//         onBlur={() => handleBlur(f)}
//         className="
//           w-full 
//           px-2 
//           py-3 
//           rounded-md 
//           text-sm 
//           text-[#7b7b7a]
//           bg-[#faf9f8]
//           border-b-2 border-transparent 
//           focus:outline-none 
//           focus:border-blue-500 
//           transition-all 
//           duration-50
//           hover:bg-gray-100
//         "
//       />
//       {errors[`personalInfo-0-${f.key}`] && (
//         <span className="text-xs text-red-500">
//           {errors[`personalInfo-0-${f.key}`]}
//         </span>
//       )}
//     </div>
//   );

//   return (
//     <div className="flex flex-col gap-3 ml-6 mt-6">
//       {/* Row 1: Full Name + Email */}
//       <div className="flex gap-4">
//         {renderField(fields[0])}
//         {renderField(fields[1])}
//       </div>

//       {/* Row 2: Phone Number + Location */}
//       <div className="flex gap-4">
//         {renderField(fields[2])}
//         {renderField(fields[3])}
//       </div>

//       {/* Row 3: LinkedIn URL */}
//       <div className="flex gap-4">
//         {renderField(fields[4])}
//         {renderField(fields[5])}
//       </div>
//     </div>
//   );
// };

// export default PersonalInfo; before tips added



import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";

interface Field {
  field: string;
  key: "fullName" | "email" | "phone" | "location" | "linkedinUrl" | "portifolioUrl";
  required: boolean;
  type?: string;
}

const PersonalInfo: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError } = useValidation();

  const fields: Field[] = [
    { field: "Full Name", key: "fullName", required: true },
    { field: "Email", key: "email", required: true, type: "email" },
    { field: "Phone Number", key: "phone", required: true, type: "tel" },
    { field: "Location", key: "location", required: true },
    { field: "LinkedIn URL", key: "linkedinUrl", required: false, type: "url" },
    { field: "Portfolio URL", key: "portifolioUrl", required: false, type: "url" },
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

  const renderField = (f: Field) => (
    <div key={f.key} className="flex flex-col gap-1 w-full">
      <label className="text-sm font-semibold text-[#3b3b3b]">
        {f.field} {f.required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={f.key}
        type={f.type ?? "text"}
        value={resumeData.personalInfo[f.key] || ""}
        placeholder={`Enter ${f.field}`}
        onChange={(e) => handleChange(f.key, e.target.value)}
        onBlur={() => handleBlur(f)}
        className="w-55 px-2 py-3.5 rounded-md text-sm text-[#7b7b7a] bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#5896d7] transition-all duration-200 hover:bg-[#f3f2f1]"
      />
      {errors[`personalInfo-0-${f.key}`] && (
        <span className="text-xs text-red-500">
          {errors[`personalInfo-0-${f.key}`]}
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

        {/* Row 2: Phone Number + Location */}
        <div className="flex gap-4">
          {renderField(fields[2])}
          {renderField(fields[3])}
        </div>

        {/* Row 3: LinkedIn URL + Portfolio URL */}
        <div className="flex gap-4">
          {renderField(fields[4])}
          {renderField(fields[5])}
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