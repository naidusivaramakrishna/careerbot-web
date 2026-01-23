// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// // Common skill suggestions
// const SKILL_SUGGESTIONS = [
//   "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js",
//   "MongoDB", "Python", "Django", "Flask", "Java", "Spring Boot", "C++",
//   "HTML", "CSS", "Tailwind CSS", "Redux", "Git", "GitHub", "Docker", "Kubernetes",
//   "PostgreSQL", "MySQL", "AWS", "Firebase", "REST API", "GraphQL", "Machine Learning",
//   "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Data Analysis", "Excel",
//   "Power BI", "Figma", "UI/UX", "Communication", "Leadership", "Problem Solving",
// ];
// const Skills: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();
//   const [inputValue, setInputValue] = useState("");
//   const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
//   const inputRef = useRef<HTMLInputElement | null>(null);
//   const errorKey = "Skills-0-list";
//   // ✅ Add skill to list
//   const addSkill = (skill: string) => {
//     if (skill.trim() !== "" && !resumeData.skills.includes(skill)) {
//       const updated = [...resumeData.skills, skill.trim()];
//       setResumeData({ ...resumeData, skills: updated });
//       clearError("Skills", 0, "list");
//     }
//     setInputValue("");
//     setShowDropdown(false);
//   };
//   // ✅ Handle typing & filter dropdown
//   const handleChange = (value: string) => {
//     setInputValue(value);
//     if (value.trim() === "") {
//       setFilteredSkills([]);
//       setShowDropdown(false);
//       return;
//     }
//     const filtered = SKILL_SUGGESTIONS.filter(
//       (skill) =>
//         skill.toLowerCase().includes(value.toLowerCase()) &&
//         !resumeData.skills.includes(skill)
//     );
//     setFilteredSkills(filtered);
//     setShowDropdown(filtered.length > 0);
//   };
//   // ✅ Add skill on Enter or comma
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" || e.key === ",") {
//       e.preventDefault();
//       addSkill(inputValue);
//     }
//   };
//   // ✅ Remove skill chip
//   const removeSkill = (skill: string) => {
//     const updated = resumeData.skills.filter((s) => s !== skill);
//     setResumeData({ ...resumeData, skills: updated });
//   };
//   // ✅ Validate on blur
//   const handleBlur = () => {
//     validateRequired("Skills", 0, { list: resumeData.skills.join(", ") });
//     setTimeout(() => setShowDropdown(false), 150);
//   };
//   // ✅ Calculate dropdown position (below input box)
//   useEffect(() => {
//     if (showDropdown && inputRef.current) {
//       const rect = inputRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom + window.scrollY,
//         left: rect.left + window.scrollX,
//         width: rect.width,
//       });
//     }
//   }, [showDropdown, filteredSkills]);
//   return (
//     <div className="flex flex-col gap-2 ml-8 mt-3 relative">
//       <label className="text-sm font-semibold text-gray-700">
//         Skills <span className="text-red-500">*</span>
//       </label>
//       {/* Input field */}
//       <input
//         ref={inputRef}
//         type="text"
//         value={inputValue}
//         placeholder="Type a skill and press Enter"
//         onChange={(e) => handleChange(e.target.value)}
//         onKeyDown={handleKeyDown}
//         onBlur={handleBlur}
//         onFocus={() => {
//           if (filteredSkills.length > 0) setShowDropdown(true);
//         }}
//         className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
//       />
//       {/* 🔽 Dropdown (rendered outside card via portal) */}
//       {showDropdown &&
//         filteredSkills.length > 0 &&
//         ReactDOM.createPortal(
//           <ul
//             className="absolute z-[9999] bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg"
//             style={{
//               position: "absolute",
//               top: `${dropdownPos.top}px`,
//               left: `${dropdownPos.left}px`,
//               width: `${dropdownPos.width}px`,
//             }}
//           >
//             {filteredSkills.map((skill, idx) => (
//               <li
//                 key={idx}
//                 onMouseDown={() => addSkill(skill)}
//                 className="px-3 py-2 text-sm text-gray-800 hover:bg-blue-100 cursor-pointer"
//               >
//                 {skill}
//               </li>
//             ))}
//           </ul>,
//           document.body
//         )}
//       {/* Error message */}
//       {errors[errorKey] && (
//         <span className="text-xs text-red-500">{errors[errorKey]}</span>
//       )}
//       {/* Skill Chips */}
//       {resumeData.skills.length > 0 && (
//         <div className="flex flex-wrap gap-2 mt-2">
//           {resumeData.skills.map((skill, i) => (
//             <span
//               key={i}
//               className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-xs text-gray-800 rounded-full border border-blue-300"
//             >
//               {skill}
//               <button
//                 type="button"
//                 onClick={() => removeSkill(skill)}
//                 className="ml-1 text-red-500 hover:text-red-700"
//               >
//                 ×
//               </button>
//             </span>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };
// export default Skills; before tips




// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import ReactDOM from "react-dom";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";

// // Common skill suggestions
// const SKILL_SUGGESTIONS = [
//   "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js",
//   "MongoDB", "Python", "Django", "Flask", "Java", "Spring Boot", "C++",
//   "HTML", "CSS", "Tailwind CSS", "Redux", "Git", "GitHub", "Docker", "Kubernetes",
//   "PostgreSQL", "MySQL", "AWS", "Firebase", "REST API", "GraphQL", "Machine Learning",
//   "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Data Analysis", "Excel",
//   "Power BI", "Figma", "UI/UX", "Communication", "Leadership", "Problem Solving",
// ];

// const Skills: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();

//   const [inputValue, setInputValue] = useState("");
//   const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

//   const inputRef = useRef<HTMLInputElement | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);

//   const errorKey = "Skills-0-list";

//   // ✅ Add skill to list
//   const addSkill = (skill: string) => {
//     if (skill.trim() !== "" && !resumeData.skills.includes(skill)) {
//       const updated = [...resumeData.skills, skill.trim()];
//       setResumeData({ ...resumeData, skills: updated });
//       clearError("Skills", 0, "list");
//     }
//     setInputValue("");
//     setShowDropdown(false);
//   };

//   // ✅ Handle typing & filter dropdown
//   const handleChange = (value: string) => {
//     setInputValue(value);
//     if (value.trim() === "") {
//       setFilteredSkills([]);
//       setShowDropdown(false);
//       return;
//     }
//     const filtered = SKILL_SUGGESTIONS.filter(
//       (skill) =>
//         skill.toLowerCase().includes(value.toLowerCase()) &&
//         !resumeData.skills.includes(skill)
//     );
//     setFilteredSkills(filtered);
//     setShowDropdown(filtered.length > 0);
//   };

//   // ✅ Add skill on Enter or comma
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" || e.key === ",") {
//       e.preventDefault();
//       addSkill(inputValue);
//     }
//   };

//   // ✅ Remove skill chip
//   const removeSkill = (skill: string) => {
//     const updated = resumeData.skills.filter((s) => s !== skill);
//     setResumeData({ ...resumeData, skills: updated });
//   };

//   // ✅ Validate on blur
//   const handleBlur = () => {
//     validateRequired("Skills", 0, { list: resumeData.skills.join(", ") });
//     setTimeout(() => setShowDropdown(false), 150);
//   };

//   // ✅ Calculate dropdown position (below input box)
//   useEffect(() => {
//     if (showDropdown && inputRef.current) {
//       const rect = inputRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom + window.scrollY,
//         left: rect.left + window.scrollX,
//         width: rect.width,
//       });
//     }
//   }, [showDropdown, filteredSkills]);

//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Form with Tips Panel */}
//       <div className="flex gap-6 items-start">
//         {/* Left Side: Scrollable Form Section */}
//         <div 
//           ref={formScrollRef}
//           className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2"
//         >
//           <div className="flex flex-col gap-3">
//             {/* Skills Input */}
//             <div className="flex flex-col gap-1 relative">
//               <label className="text-sm font-semibold text-[#3b3b3b]">
//                 Skills <span className="text-red-500">*</span>
//               </label>
//               <input
//                 ref={inputRef}
//                 type="text"
//                 value={inputValue}
//                 placeholder="Type a skill and press Enter"
//                 onChange={(e) => handleChange(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 onBlur={handleBlur}
//                 onFocus={() => {
//                   if (filteredSkills.length > 0) setShowDropdown(true);
//                 }}
//                 className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//               />

//               {/* 🔽 Dropdown (rendered outside card via portal) */}
//               {showDropdown &&
//                 filteredSkills.length > 0 &&
//                 ReactDOM.createPortal(
//                   <ul
//                     className="absolute z-[9999] bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg"
//                     style={{
//                       position: "absolute",
//                       top: `${dropdownPos.top}px`,
//                       left: `${dropdownPos.left}px`,
//                       width: `${dropdownPos.width}px`,
//                     }}
//                   >
//                     {filteredSkills.map((skill, idx) => (
//                       <li
//                         key={idx}
//                         onMouseDown={() => addSkill(skill)}
//                         className="px-3 py-2 text-sm text-gray-800 hover:bg-blue-100 cursor-pointer"
//                       >
//                         {skill}
//                       </li>
//                     ))}
//                   </ul>,
//                   document.body
//                 )}

//               {/* Error message */}
//               {errors[errorKey] && (
//                 <span className="text-xs text-red-500">{errors[errorKey]}</span>
//               )}
//             </div>

//             {/* Skill Chips */}
//             {resumeData.skills.length > 0 && (
//               <div className="flex flex-wrap gap-2 mt-2">
//                 {resumeData.skills.map((skill, i) => (
//                   <span
//                     key={i}
//                     className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-sm text-gray-800 rounded-full border border-blue-300"
//                   >
//                     {skill}
//                     <button
//                       type="button"
//                       onClick={() => removeSkill(skill)}
//                       className="ml-1 text-red-500 hover:text-red-700 text-base font-bold"
//                     >
//                       ×
//                     </button>
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Side: Fixed Tips Section */}
//         <div className="w-80 flex-shrink-0 sticky top-2">
//           <div className="bg-[#faf9f8] rounded-lg p-5">
//             <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//             <div className="border-t border-gray-300 mb-3"></div>
//             <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//               <p>
//                 List relevant technical and soft skills that align with your target role. Include both hard skills (programming languages, tools, technologies) and soft skills (communication, leadership, teamwork).*
//               </p>
//               <p>
//                 Prioritize skills mentioned in job descriptions and industry-standard competencies. Use specific, searchable keywords that ATS systems recognize and hiring managers value.
//               </p>
//               <p className="text-xs text-gray-500 italic mt-6">
//                 *70% of recruiters use ATS to filter candidates based on skills matching.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Skills; before list seperate




// "use client";
// import React, { useRef } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// import TechnologyChipsInput from "../TechnologyChipsInput";
// import { technologies } from "../../../../../../types/technologies";


// const Skills: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();


//   const containerRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);


//   const errorKey = "Skills-0-list";


//   // Handle skills change
//   const handleSkillsChange = (updatedSkills: string[]) => {
//     setResumeData({ ...resumeData, skills: updatedSkills });
//     if (updatedSkills.length > 0) {
//       clearError("Skills", 0, "list");
//     }
//   };


//   // Validate on blur
//   const handleBlur = () => {
//     validateRequired("Skills", 0, { list: resumeData.skills.join(", ") });
//   };


//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Form with Tips Panel */}
//       <div className="flex gap-6 items-start">
//         {/* Left Side: Scrollable Form Section */}
//         <div 
//           ref={formScrollRef}
//           className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2"
//         >
//           <div className="flex flex-col gap-3">
//             {/* Skills Input with Chips */}
//             <div className="flex flex-col gap-1 relative">
//               <TechnologyChipsInput
//                 label="Skills"
//                 selectedTechnologies={resumeData.skills || []}
//                 onTechnologiesChange={handleSkillsChange}
//                 suggestions={technologies}
//                 placeholder="Type to add skills..."
//                 error={errors[errorKey]}
//               />
//               <div onBlur={handleBlur} className="hidden" />
//             </div>
//           </div>
//         </div>


//         {/* Right Side: Fixed Tips Section */}
//         <div className="w-80 flex-shrink-0 sticky top-2">
//           <div className="bg-[#faf9f8] rounded-lg p-5">
//             <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//             <div className="border-t border-gray-300 mb-3"></div>
//             <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//               <p>
//                 List relevant technical and soft skills that align with your target role. Include both hard skills (programming languages, tools, technologies) and soft skills (communication, leadership, teamwork).*
//               </p>
//               <p>
//                 Prioritize skills mentioned in job descriptions and industry-standard competencies. Use specific, searchable keywords that ATS systems recognize and hiring managers value.
//               </p>
//               <p className="text-xs text-gray-500 italic mt-6">
//                 *70% of recruiters use ATS to filter candidates based on skills matching.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// export default Skills; before skills vertical



// "use client";
// import React, { useRef } from "react";
// import { useResume } from "../../../_context/ResumeContext";
// import { useValidation } from "../../../_hooks/useValidation";
// import TechnologyChipsInput from "../TechnologyChipsInput";
// import { technologies } from "../../../../../../../types/technologies";


// const Skills: React.FC = () => {
//   const { resumeData, setResumeData } = useResume();
//   const { errors, validateRequired, clearError } = useValidation();


//   const containerRef = useRef<HTMLDivElement>(null);
//   const formScrollRef = useRef<HTMLDivElement>(null);


//   const errorKey = "Skills-0-list";


//   // Handle skills change
//   const handleSkillsChange = (updatedSkills: string[]) => {
//     setResumeData({ ...resumeData, skills: updatedSkills });
//     if (updatedSkills.length > 0) {
//       clearError("Skills", 0, "list");
//     }
//   };


//   // Validate on blur
//   const handleBlur = () => {
//     validateRequired("Skills", 0, { list: resumeData.skills.join(", ") });
//   };


//   return (
//     <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
//       {/* Form with Tips Panel */}
//       <div className="flex gap-6 items-start">
//         {/* Left Side: Scrollable Form Section */}
//         <div 
//           ref={formScrollRef}
//           className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2"
//         >
//           <div className="flex flex-col gap-3">
//             {/* Skills Input with Chips - VERTICAL LAYOUT */}
//             <div className="flex flex-col gap-1 relative">
//               <TechnologyChipsInput
//                 label="Skills"
//                 selectedTechnologies={resumeData.skills || []}
//                 onTechnologiesChange={handleSkillsChange}
//                 suggestions={technologies}
//                 placeholder="Type to add skills..."
//                 error={errors[errorKey]}
//                 layout="vertical"
//               />
//               <div onBlur={handleBlur} className="hidden" />
//             </div>
//           </div>
//         </div>


//         {/* Right Side: Fixed Tips Section */}
//         <div className="w-80 flex-shrink-0 sticky top-2">
//           <div className="bg-[#faf9f8] rounded-lg p-5">
//             <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
//             <div className="border-t border-gray-300 mb-3"></div>
//             <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
//               <p>
//                 List relevant technical and soft skills that align with your target role. Include both hard skills (programming languages, tools, technologies) and soft skills (communication, leadership, teamwork).*
//               </p>
//               <p>
//                 Prioritize skills mentioned in job descriptions and industry-standard competencies. Use specific, searchable keywords that ATS systems recognize and hiring managers value.
//               </p>
//               <p className="text-xs text-gray-500 italic mt-6">
//                 *70% of recruiters use ATS to filter candidates based on skills matching.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// export default Skills;


"use client";
import React, { useRef } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import TechnologyChipsInput from "../TechnologyChipsInput";
// import { technologies } from "../../../../../../../types/technologies";

const Skills: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError } = useValidation();

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // Skill categories configuration
  const skillCategories = [
    {
      key: "programming_languages",
      label: "Programming Languages",
      placeholder: "e.g., Python, JavaScript, Java...",
      suggestions: ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby"]
    },
    {
      key: "frameworks",
      label: "Frameworks & Libraries",
      placeholder: "e.g., React, Django, FastAPI...",
      suggestions: ["React", "Angular", "Vue.js", "Next.js", "Django", "FastAPI", "Flask", "Node.js", "Express.js", "Spring Boot", "ASP.NET", "Laravel"]
    },
    {
      key: "databases",
      label: "Databases",
      placeholder: "e.g., PostgreSQL, MongoDB...",
      suggestions: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "DynamoDB", "Firebase", "Cassandra", "Oracle", "SQL Server", "SQLite"]
    },
    {
      key: "tools",
      label: "Tools & Technologies",
      placeholder: "e.g., Docker, Git, Jenkins...",
      suggestions: ["Docker", "Kubernetes", "Git", "Jenkins", "JIRA", "GitHub", "GitLab", "CircleCI", "Terraform", "Ansible", "Webpack", "Babel"]
    },
    {
      key: "cloud_platforms",
      label: "Cloud Platforms",
      placeholder: "e.g., AWS, Azure, Google Cloud...",
      suggestions: ["AWS", "Azure", "Google Cloud", "Heroku", "DigitalOcean", "Netlify", "Vercel", "IBM Cloud"]
    },
    {
      key: "soft_skills",
      label: "Soft Skills",
      placeholder: "e.g., Leadership, Communication...",
      suggestions: ["Leadership", "Team Collaboration", "Problem Solving", "Communication", "Time Management", "Critical Thinking", "Adaptability", "Creativity"]
    }
  ];

  // Initialize categorized skills if not present
  const categorizedSkills = resumeData.categorizedSkills || {
    programming_languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    cloud_platforms: [],
    soft_skills: []
  };

  // Handle skills change for a specific category
  const handleCategorySkillsChange = (category: string, updatedSkills: string[]) => {
    const newCategorizedSkills = {
      ...categorizedSkills,
      [category]: updatedSkills
    };

    // Flatten all skills into the main skills array for backward compatibility
    const allSkills = Object.values(newCategorizedSkills).flat();

    setResumeData({ 
      ...resumeData, 
      categorizedSkills: newCategorizedSkills,
      skills: allSkills // Keep flattened version for templates
    });

    if (updatedSkills.length > 0) {
      clearError("Skills", 0, category);
    }
  };

  // Validate on blur
  const handleBlur = (category: string) => {
    const categorySkills = categorizedSkills[category as keyof typeof categorizedSkills] || [];
    validateRequired("Skills", 0, { [category]: categorySkills.join(", ") });
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Form with Tips Panel */}
      <div className="flex gap-6 items-start">
        {/* Left Side: Scrollable Form Section */}
        <div 
          ref={formScrollRef}
          className="flex-1 h-[500px] overflow-y-auto mt-6 scrollbar-hide pr-2"
        >
          <div className="flex flex-col gap-6">
            {/* Render each skill category */}
            {skillCategories.map((category) => {
              const categoryKey = `Skills-0-${category.key}`;
              const currentSkills = categorizedSkills[category.key as keyof typeof categorizedSkills] || [];

              return (
                <div key={category.key} className="flex flex-col gap-1 relative">
                  <TechnologyChipsInput
                    label={category.label}
                    selectedTechnologies={currentSkills}
                    onTechnologiesChange={(skills) => handleCategorySkillsChange(category.key, skills)}
                    suggestions={category.suggestions}
                    placeholder={category.placeholder}
                    error={errors[categoryKey]}
                    // layout="vertical"
                  />
                  <div onBlur={() => handleBlur(category.key)} className="hidden" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Fixed Tips Section */}
        <div className="w-80 flex-shrink-0 sticky top-2">
          <div className="bg-[#faf9f8] rounded-lg p-5">
            <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
            <div className="border-t border-gray-300 mb-3"></div>
            <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
              <p>
                <strong>Categorize your skills</strong> to make them easy to scan. Group them by Programming Languages, Frameworks, Databases, Tools, Cloud Platforms, and Soft Skills.
              </p>
              <p>
                List relevant technical and soft skills that align with your target role. Prioritize skills mentioned in job descriptions and industry-standard competencies.
              </p>
              <p>
                Use specific, searchable keywords that ATS systems recognize. Include both hard skills (technical) and soft skills (communication, leadership).
              </p>
              <p className="text-xs text-gray-500 italic mt-6">
                *70% of recruiters use ATS to filter candidates based on skills matching.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;







