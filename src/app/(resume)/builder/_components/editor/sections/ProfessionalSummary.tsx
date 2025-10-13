import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
interface Props {
  errors: Record<string, string>;
}
const ProfessionalSummary: React.FC<Props> = ({ errors }) => {
  const { resumeData, setResumeData } = useResume();
  const {
    loadingIndex,
    suggestions,
    activePopup,
    setActivePopup,
    generateSuggestions,
  } = useAISuggestions();
  const { clearError } = useValidation();
  const [targetRole, setTargetRole] = useState("");
  const [targetRoleError, setTargetRoleError] = useState("");
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const key = "summary";
  const handleChange = (value: string) => {
    setResumeData({
      ...resumeData,
      professionalSummary: value,
    });
    clearError("", 0, key);
  };
  const handleGenerate = () => {
    if (!targetRole.trim()) {
      setTargetRoleError("This field is required.");
      return;
    }
    setTargetRoleError("");

    // ✅ Prompt for AI
      const prompt = `Generate 3 concise professional summary options for a resume targeting the following role:
Target Role: ${targetRole}
Requirements for each summary:
- Length: 1-2 lines maximum (approximately 20-30 words)
- Start directly with your professional identity or key strength (e.g., "Results-driven software engineer...", "Strategic marketing professional...", "Detail-oriented data analyst...")
- Highlight years of experience, core competencies, and measurable achievements
- Include industry-specific keywords and technical skills relevant to ${targetRole}
- Focus on unique value proposition and tangible impact
- Avoid generic phrases like "hardworking," "team player," "seeking opportunities," or "passionate professional"
- Each summary should emphasize a different angle: technical expertise, leadership/impact, or specialized skills
Formatting rules:
- Return ONLY the 3 summaries
- Each summary on a new line
- NO numbering (1, 2, 3), NO bullet points, NO labels
- Start each summary directly with a descriptor or professional title
- Separate summaries with a blank line
Example format:
Results-driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users

Strategic Product Manager with proven ability to launch 10+ successful features, drive 35% revenue growth, and lead cross-functional teams of 15+ members in agile environments

Innovative UX Designer specializing in user-centered design methodologies, creating intuitive interfaces that improved user satisfaction scores by 50% and reduced customer support tickets by 30%`;
    generateSuggestions(0, prompt);
  };
  // 📌 Position popup beside the button
  useEffect(() => {
    if (activePopup === 0 && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY - 260, // adjust vertical offset
        left: rect.right + window.scrollX + 8,   // align beside button
      });
    }
  }, [activePopup, suggestions]);
  return (
    <div className="flex flex-col gap-2 ml-8 mt-3 relative">
      {/* Target Role Input */}
      <label className="text-xs font-semibold text-gray-700">
        Target Role (for AI generation only)
      </label>
      <input
        type="text"
        value={targetRole}
        placeholder="e.g., Frontend Developer, Data Analyst"
        onChange={(e) => {
          setTargetRole(e.target.value);
          setTargetRoleError("");
        }}
        className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
      />
      {targetRoleError && (
        <span className="text-xs text-red-500">{targetRoleError}</span>
      )}
      {/* Professional Summary */}
      <label className="text-xs font-semibold text-gray-700 mt-2">
        Summary <span className="text-red-500">*</span>
      </label>
      <textarea
        value={resumeData.professionalSummary || ""}
        placeholder="Enter summary or click Generate"
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-2 py-1 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
        rows={4}
      />
      {errors[key] && (
        <span className="text-xs text-red-500">{errors[key]}</span>
      )}
      {/* Generate Button */}
      <div className="relative flex items-center w-fit">
        <button
          type="button"
          ref={buttonRef}
          disabled={loadingIndex === 0}
          onClick={handleGenerate}
          className="mt-2 w-fit px-3 py-1 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 rounded-lg disabled:bg-gray-400"
        >
          {loadingIndex === 0 ? "Generating..." : "✨ Generate Summary"}
        </button>
      </div>
      {/* AI Suggestions Popup */}
      {activePopup === 0 && suggestions[0] &&
        ReactDOM.createPortal(
          <div
            className="absolute z-[9999]"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              position: "absolute",
            }}
          >
            <AISuggestions
              options={suggestions[0]}
              onSelect={(s) => {
                handleChange(s);
                setActivePopup(null);
              }}
              onClose={() => setActivePopup(null)}
            />
          </div>,
          document.body
        )}
    </div>
  );
};
export default ProfessionalSummary;


