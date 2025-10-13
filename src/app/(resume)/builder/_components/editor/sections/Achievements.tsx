import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";

interface AchievementsEntry {
  title: string;
  date: string;
  description: string;
}

const Achievements: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { loadingIndex, suggestions, activePopup, setActivePopup, generateSuggestions } =
    useAISuggestions();
  const { errors, validateRequired, clearError, clearSectionIndexErrors, reindexErrors } =
    useValidation();

  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleChange = (index: number, field: keyof AchievementsEntry, value: string | boolean) => {
    const updated = [...(resumeData.achievements || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, achievements: updated });
    clearError("achieve", index, field);
  };

  const addAchievement = () => {
    setResumeData({
      ...resumeData,
      achievements: [
        ...(resumeData.achievements || []),
        {
          title: "",
          date: "",
          description: "",
        },
      ],
    });
  };

  const removeAchievement = (index: number) => {
    const updated = [...(resumeData.achievements || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, achievements: updated });
    clearSectionIndexErrors("achieve", index);
    reindexErrors("achieve", index);
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
      {(resumeData.achievements || []).map((achieve, index) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4 relative">
          {/* Company */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={achieve.title}
              placeholder="Enter Company"
              onChange={(e) => handleChange(index, "title", e.target.value)}
              onBlur={() => validateRequired("achieve", index, { title: achieve.title })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`achieve-${index}-title`] && (
              <span className="text-xs text-red-500">{errors[`achieve-${index}-title`]}</span>
            )}
          </div>

          {/* Date */}        
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Date</label>
            <input
              type="month"
              value={achieve.date || ""}
              onChange={(e) => handleChange(index, "date", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>

          {/* Description + AI Suggestions */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Description{" "}
              <span className="text-orange-500 text-[10px]">&#39; Strongly Recommend for ATS</span>
            </label>
            <textarea
              value={achieve.description || ""}
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
                  !validateRequired("achieve", index, {
                    company: achieve.title,                   
                  })
                )
                  return;
//                 const prompt = `Write 3 impactful internship resume bullet points:
// - Title: ${achieve.title}
// Focus on achievements, measurable results, and impact. Use strong action verbs.`;
                const prompt = `Generate 3 compelling achievement description options for a resume based on the following:

Achievement Title: ${achieve.title}

Requirements for each description:
- Length: 1-2 lines maximum (approximately 15-25 words)
- Start directly with a strong action verb (past tense: achieved, earned, secured, won, recognized, awarded, accomplished, attained, etc.)
- Highlight the significance, impact, and context of the achievement
- Include specific details: competition scale, selection criteria, percentile ranking, or number of participants/candidates
- Emphasize what made this achievement noteworthy (e.g., "selected from 500+ applicants", "top 5% nationally", "first place among 50 teams")
- Use concrete metrics and numbers to demonstrate prestige and competitive advantage
- Avoid vague phrases like "received recognition," "participated in," or "was honored"
- Each description should present the achievement from a different angle: competitive achievement, recognition/award, or impactful contribution

Formatting rules:
- Return ONLY the 3 descriptions
- Each description on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels, NO dashes
- Start each description directly with an action verb
- Separate descriptions with a blank line

Example format:
Won first place in National Hackathon among 200+ competing teams by developing an AI-powered healthcare solution that reduced patient wait times by 40%

Secured prestigious Dean's Merit Scholarship awarded to top 3% of students based on academic excellence and leadership achievements across 5,000+ applicants

Recognized as Employee of the Year for spearheading process improvements that increased team productivity by 35% and saved $100K in operational costs`;
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
                    onSelect={(s) => {
                      handleChange(index, "description", s);
                      setActivePopup(null);
                    }}
                    onClose={() => setActivePopup(null)}
                  />
                </div>,
                document.body
              )}
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeAchievement(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addAchievement}
        className="w-fit px-11 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Achievement
      </button>
    </div>
  );
};
export default Achievements;

