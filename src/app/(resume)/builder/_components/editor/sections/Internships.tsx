import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";

interface InternshipEntry {
  company: string;role: string;startDate: string;endDate: string;currentlyWorking: boolean;description: string;
}
const Internships: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { loadingIndex, suggestions, activePopup, setActivePopup, generateSuggestions } =
    useAISuggestions();
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
    useValidation();
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleChange = (index: number, field: keyof InternshipEntry, value: string | boolean) => {
    const updated = [...(resumeData.internships || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, internships: updated });
    clearError("intern", index, field);
  };
  const addInternship = () => {
    setResumeData({
      ...resumeData,
      internships: [
        ...(resumeData.internships || []),
        {company: "",role: "",startDate: "",endDate: "",currentlyWorking: false,description: "",},
      ],
    });
  };
  const removeInternship = (index: number) => {
    const updated = [...(resumeData.internships || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, internships: updated });
    clearSectionIndexErrors("intern", index);
    reindexErrors("intern", index);
  };
  useEffect(() => {
    if (activePopup !== null && buttonRefs.current[activePopup]) {
      const rect = buttonRefs.current[activePopup]!.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY - 260,
        left: rect.right + window.scrollX + 8,
      });
    }
  }, [activePopup, suggestions]);
  return (
    <div className="flex flex-col gap-6 ml-8 mt-3">
      {(resumeData.internships || []).map((intern, index) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
          {/* Company */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={intern.company}
              placeholder="Enter Company"
              onChange={(e) => handleChange(index, "company", e.target.value)}
              onBlur={() => validateRequired("intern", index, { company: intern.company })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`intern-${index}-company`] && (
              <span className="text-xs text-red-500">{errors[`intern-${index}-company`]}</span>
            )}
          </div>
          {/* Role */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={intern.role}
              placeholder="Enter Role"
              onChange={(e) => handleChange(index, "role", e.target.value)}
              onBlur={() => validateRequired("intern", index, { role: intern.role })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`intern-${index}-role`] && (
              <span className="text-xs text-red-500">{errors[`intern-${index}-role`]}</span>
            )}
          </div>
          {/* Dates */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">Start Date</label>
              <input
                type="month"
                value={intern.startDate || ""}
                onChange={(e) => handleChange(index, "startDate", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
              />
            </div>
            {!intern.currentlyWorking && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">End Date</label>
                <input type="month" value={intern.endDate || ""} onChange={(e) => handleChange(index, "endDate", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
                />
              </div>
            )}            
          {/* Currently Working */}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={intern.currentlyWorking} onChange={(e) => handleChange(index, "currentlyWorking", e.target.checked)} className="w-4 h-4"
            />
            <label className="text-xs font-semibold text-gray-700">Currently Working Here</label>
          </div>
          {/* Description + AI Suggestions */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Description{" "}<span className="text-orange-500 text-[10px]">Strongly Recommend for ATS</span>
            </label>
            <textarea
              value={intern.description || ""}
              placeholder="Enter Description or click Generate"
              onChange={(e) => handleChange(index, "description", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
              rows={3}
            />
            <button
              type="button"
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              disabled={loadingIndex === index}
              onClick={() => {
                if (
                  !validateRequired("intern", index, {
                    company: intern.company,
                    role: intern.role,
                  })
                )
                  return;
                const prompt = `Generate 3 concise internship description options for a resume based on the following details:
Company: ${intern.company}
Role: ${intern.role}
Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: developed, implemented, designed, optimized, etc.)
- Focus on specific accomplishments, quantifiable results, and technical skills
- Include relevant industry keywords for ATS optimization
- Highlight impact and value delivered to the company
- Avoid generic phrases like "responsible for," "helped with," or "worked on"
- Each description should emphasize a different aspect: technical execution, business impact, or collaboration/leadership
Formatting rules:
- Return ONLY the 3 descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels
- Start each description directly with an action verb
- Separate descriptions with a blank line
Example format:
Developed a machine learning model that improved prediction accuracy by 25% using Python and TensorFlow, reducing processing time by 40%

Collaborated with cross-functional teams to design and implement a mobile app feature that increased user engagement by 30% within the first month

Optimized database queries and API endpoints resulting in 50% faster load times and enhanced user experience for 10,000+ daily active users`;
                generateSuggestions(index, prompt);
              }}
              className="mt-2 w-fit px-3 py-1 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 rounded-lg disabled:bg-gray-400"
            >
              {loadingIndex === index ? "Generating..." : "✨ Generate Description"}
            </button>
            {activePopup === index &&
              suggestions[index] &&
              ReactDOM.createPortal(
                <div
                  className="absolute z-[9999]"
                  style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
                >
                  <AISuggestions
                    options={suggestions[index]}
                    onSelect={(s) => { handleChange(index, "description", s); setActivePopup(null);}}
                    onClose={() => setActivePopup(null)}
                  />
                </div>,
                document.body
              )}
          </div>
          {/* Remove */}
          <button type="button"
            onClick={() => removeInternship(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addInternship}
        className="w-fit px-11 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Internship
      </button>
    </div>
  );
};
export default Internships;

