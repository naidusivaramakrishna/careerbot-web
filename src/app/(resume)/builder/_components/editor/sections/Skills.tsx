"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
// Common skill suggestions
const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js",
  "MongoDB", "Python", "Django", "Flask", "Java", "Spring Boot", "C++",
  "HTML", "CSS", "Tailwind CSS", "Redux", "Git", "GitHub", "Docker", "Kubernetes",
  "PostgreSQL", "MySQL", "AWS", "Firebase", "REST API", "GraphQL", "Machine Learning",
  "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Data Analysis", "Excel",
  "Power BI", "Figma", "UI/UX", "Communication", "Leadership", "Problem Solving",
];
const Skills: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError } = useValidation();
  const [inputValue, setInputValue] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorKey = "Skills-0-list";
  // ✅ Add skill to list
  const addSkill = (skill: string) => {
    if (skill.trim() !== "" && !resumeData.skills.includes(skill)) {
      const updated = [...resumeData.skills, skill.trim()];
      setResumeData({ ...resumeData, skills: updated });
      clearError("Skills", 0, "list");
    }
    setInputValue("");
    setShowDropdown(false);
  };
  // ✅ Handle typing & filter dropdown
  const handleChange = (value: string) => {
    setInputValue(value);
    if (value.trim() === "") {
      setFilteredSkills([]);
      setShowDropdown(false);
      return;
    }
    const filtered = SKILL_SUGGESTIONS.filter(
      (skill) =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !resumeData.skills.includes(skill)
    );
    setFilteredSkills(filtered);
    setShowDropdown(filtered.length > 0);
  };
  // ✅ Add skill on Enter or comma
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    }
  };
  // ✅ Remove skill chip
  const removeSkill = (skill: string) => {
    const updated = resumeData.skills.filter((s) => s !== skill);
    setResumeData({ ...resumeData, skills: updated });
  };
  // ✅ Validate on blur
  const handleBlur = () => {
    validateRequired("Skills", 0, { list: resumeData.skills.join(", ") });
    setTimeout(() => setShowDropdown(false), 150);
  };
  // ✅ Calculate dropdown position (below input box)
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showDropdown, filteredSkills]);
  return (
    <div className="flex flex-col gap-2 ml-8 mt-3 relative">
      <label className="text-xs font-semibold text-gray-700">
        Skills <span className="text-red-500">*</span>
      </label>
      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        placeholder="Type a skill and press Enter"
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (filteredSkills.length > 0) setShowDropdown(true);
        }}
        className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
      />
      {/* 🔽 Dropdown (rendered outside card via portal) */}
      {showDropdown &&
        filteredSkills.length > 0 &&
        ReactDOM.createPortal(
          <ul
            className="absolute z-[9999] bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg"
            style={{
              position: "absolute",
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
            }}
          >
            {filteredSkills.map((skill, idx) => (
              <li
                key={idx}
                onMouseDown={() => addSkill(skill)}
                className="px-3 py-2 text-sm text-gray-800 hover:bg-orange-100 cursor-pointer"
              >
                {skill}
              </li>
            ))}
          </ul>,
          document.body
        )}
      {/* Error message */}
      {errors[errorKey] && (
        <span className="text-xs text-red-500">{errors[errorKey]}</span>
      )}
      {/* Skill Chips */}
      {resumeData.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {resumeData.skills.map((skill, i) => (
            <span
              key={i}
              className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-xs text-gray-800 rounded-full border border-orange-300"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
export default Skills;



