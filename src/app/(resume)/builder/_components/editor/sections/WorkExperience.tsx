import React, { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
interface WorkEntry { company: string;role: string;startDate: string;endDate: string;currentlyWorking: boolean;description: string;}
const WorkExperience: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { loadingIndex,suggestions,activePopup,setActivePopup,generateSuggestions, } = useAISuggestions();
  // ✅ useValidation Hook
  const { errors,validateRequired,clearError,clearSectionIndexErrors,reindexErrors, } = useValidation();
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0, });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const handleChange = <K extends keyof WorkEntry>( index: number, field: K, value: WorkEntry[K] ) => {
    const updated = [...(resumeData.workExperience || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, workExperience: updated });
    clearError("work", index, field as string);
  };
  const addWork = () => {
    setResumeData({
      ...resumeData,
      workExperience: [
        ...(resumeData.workExperience || []),
        { company: "",role: "",startDate: "",endDate: "",currentlyWorking: false,description: "", },
      ],
    });
  };
  const removeWork = (index: number) => {
    const updated = [...(resumeData.workExperience || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, workExperience: updated });
    clearSectionIndexErrors("work", index);
    reindexErrors("work", index);
  };
  // Position popup near clicked "Generate" button
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
      {(resumeData.workExperience || []).map((work, index) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
          {/* Company */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Company <span className="text-red-500">*</span>
            </label>
            <input type="text" value={work.company} placeholder="Enter Company"
              onChange={(e) => handleChange(index, "company", e.target.value)}
              onBlur={() =>
                validateRequired("work", index, { company: work.company })
              }
              className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
                errors[`work-${index}-company`]
                  ? "border-gray-300" : "border-gray-300 hover:border-gray-700"
              }`}
            />
            {errors[`work-${index}-company`] && (
              <span className="text-xs text-red-500">
                {errors[`work-${index}-company`]}
              </span>
            )}
          </div>
          {/* Role */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <input type="text" value={work.role} placeholder="Enter Role"
              onChange={(e) => handleChange(index, "role", e.target.value)}
              onBlur={() => validateRequired("work", index, { role: work.role })}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-black ${
                errors[`work-${index}-role`]
                  ? "border-gray-300" : "border-gray-300 hover:border-gray-700"
              }`}
            />
            {errors[`work-${index}-role`] && (
              <span className="text-xs text-red-500">
                {errors[`work-${index}-role`]}
              </span>
            )}
          </div>
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Start Date</label>
            <input type="month" value={work.startDate || ""}
              onChange={(e) => handleChange(index, "startDate", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>
          {/* End Date */}
          {!work.currentlyWorking && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">End Date</label>
              <input type="month" value={work.endDate || ""}
                onChange={(e) => handleChange(index, "endDate", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
              />
            </div>
          )}
          {/* Currently Working */}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={work.currentlyWorking} onChange={(e) => handleChange(index, "currentlyWorking", e.target.checked)} className="w-4 h-4"
            />
            <label className="text-xs font-semibold text-gray-700"> Currently Working Here </label>
          </div>
          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Description{" "} <span className="text-orange-500 text-[10px]"> &#39; Strongly Recommend for Good ATS Score &#39; </span>
            </label>
            <textarea
              value={work.description || ""}
              placeholder="Enter Description or click Generate"
              onChange={(e) => handleChange(index, "description", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
              rows={3}
            />
            {/* Generate Button */}
            <button type="button"
              ref={(el) => { buttonRefs.current[index] = el; }}
              disabled={loadingIndex === index}
              onClick={() => {
                if (
                  !validateRequired("work", index, {
                    company: work.company, role: work.role,
                  })
                )
                  return;
                const prompt = `Generate 3 impactful work experience description options for a resume based on the following details:
Role: ${work.role}
Company: ${work.company}
Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: led, developed, implemented, spearheaded, optimized, delivered, etc.)
- Focus on quantifiable achievements, measurable outcomes, and business impact
- Include specific metrics, percentages, dollar amounts, or scale (e.g., "increased revenue by 30%", "managed team of 10", "reduced costs by $50K")
- Use industry-relevant keywords and technical skills for ATS optimization
- Demonstrate problem-solving, leadership, or innovation
- Avoid generic phrases like "responsible for," "worked on," "assisted with," or "helped to"
- Each description should highlight a different accomplishment: technical achievement, business impact, or process improvement
Formatting rules:
- Return ONLY the 3 descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
- Start each description directly with an action verb
- Separate descriptions with a blank line
Example format:
Led cross-functional team of 8 engineers to deliver a customer portal that increased user retention by 45% and generated $2M in additional revenue within 6 months

Architected and implemented microservices infrastructure using AWS and Docker, reducing deployment time by 70% and improving system uptime to 99.9%

Optimized database queries and API performance resulting in 60% faster response times, enhancing user experience for 500K+ daily active users`;

                generateSuggestions(index, prompt);
              }}
              className="mt-2 w-fit px-3 py-1 text-xs font-medium border bg-orange-600 text-white hover:bg-orange-700 rounded-lg disabled:bg-gray-400"
            >
              {loadingIndex === index ? "Generating..." : "✨ Generate Description"}
            </button>
            {/* AI Suggestions Popup */}
            {activePopup === index &&
              suggestions[index] &&
              ReactDOM.createPortal(
                <div
                  className="absolute z-[9999]"
                  style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute",}}
                >
                  <AISuggestions
                    options={suggestions[index]}
                    onSelect={(s) => {
                      handleChange(index, "description", s); setActivePopup(null);
                    }}
                    onClose={() => setActivePopup(null)}
                  />
                </div>,
                document.body
              )}
          </div>
          {/* Remove button */}
          <button type="button" onClick={() => removeWork(index)} className="self-start text-xs text-red-500 hover:underline mt-1">
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addWork} className="w-fit px-6 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600">
        + Add Work Experience
      </button>
    </div>
  );
};
export default WorkExperience;



