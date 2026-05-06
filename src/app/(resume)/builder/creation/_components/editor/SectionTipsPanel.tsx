"use client";
import React, { useState } from "react";
import { useResume } from "../../_context/ResumeContext";

// Maps each section component's key to the suggestion `section` values from the API.
// Section values come from enhancer_state.suggestions[].section in the backend response.
const SUGGESTION_SECTION_MAP: Record<string, string[]> = {
  PersonalInfo: ["Contact"],
  // Formatting suggestions (e.g. low word count) are surfaced in the Summary section
  ProfessionalSummary: ["Summary", "Formatting"],
  Skills: ["Skills", "Keywords"],
  Education: ["Education"],
  // ContentQuality covers bullet-level suggestions; entryContent filtering scopes them per-entry
  // Leadership suggestions reference specific bullet text — same entry-level filtering applies
  WorkExperience: ["WorkExperience", "Experience", "ContentQuality", "Leadership"],
  Projects: ["Projects", "ContentQuality", "Leadership"],
  Certifications: ["Certifications"],
  Internships: ["Internships", "ContentQuality", "Leadership"],
  Achievements: ["Achievements"],
  Volunteering: ["Volunteering"],
  Awards: ["Awards"],
  Hobbies: ["Hobbies"],
  Interests: ["Interests"],
  // IntelligencePenalty suggestions are about missing language proficiency
  Languages: ["Languages", "IntelligencePenalty"],
  Publications: ["Publications"],
  References: ["References"],
};

interface SectionTipsPanelProps {
  /** Key matching one of the entries in SUGGESTION_SECTION_MAP */
  sectionKey: string;
  /** Static tips JSX shown for builder resumes (or when no suggestions match) */
  staticTips: React.ReactNode;
  /**
   * Optional per-entry identifiers (e.g. cert name, project title, bullet snippets).
   * When provided, only suggestions whose message contains at least one identifier are shown.
   * If none match, the entry falls back to staticTips.
   * When omitted (single-entry sections like PersonalInfo, Skills), all section suggestions show.
   */
  entryContent?: string[];
}

type ButtonState = "idle" | "loading" | "success" | "error";

const SectionTipsPanel: React.FC<SectionTipsPanelProps> = ({
  sectionKey,
  staticTips,
  entryContent,
}) => {
  const { resumeSource, enhancedSuggestions, applyAutoFix } = useResume();
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonState>>({});

  const setButtonState = (id: string, state: ButtonState) =>
    setButtonStates(prev => ({ ...prev, [id]: state }));

  const handleAutoFix = async (id: string) => {
    setButtonState(id, "loading");
    try {
      await applyAutoFix(id);
      setButtonState(id, "success");
      // Suggestion is removed from context after success; state cleanup is a no-op
    } catch {
      setButtonState(id, "error");
      setTimeout(() => setButtonState(id, "idle"), 2500);
    }
  };

  if (resumeSource === "enhanced" && enhancedSuggestions.length > 0) {
    const sectionKeys = SUGGESTION_SECTION_MAP[sectionKey] ?? [];

    // Step 1: filter by section
    let matched = enhancedSuggestions.filter((s) => sectionKeys.includes(s.section));

    // Step 2: if entryContent provided, further filter to only suggestions that mention
    // at least one identifier from this specific entry (case-insensitive)
    if (entryContent !== undefined) {
      const identifiers = entryContent.map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (identifiers.length === 0) {
        // entry has no identifiable content — show static tips
        return <>{staticTips}</>;
      }
      matched = matched.filter((s) =>
        identifiers.some((id) => s.message.toLowerCase().includes(id))
      );
    }

    if (matched.length > 0) {
      return (
        <div className="bg-[#faf9f8] rounded-lg p-5">
          <h3 className="text-base font-bold text-[#2d2d2d] mb-3">ATS Suggestions</h3>
          <div className="border-t border-gray-300 mb-3"></div>
          <div className="space-y-2">
            {matched.map((s) => {
              const btnState = buttonStates[s.id] ?? "idle";
              const isAuto = s.fix_type === "auto";
              const isLoading = btnState === "loading";

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isAuto || isLoading}
                  onClick={isAuto ? () => handleAutoFix(s.id) : undefined}
                  title={isAuto ? "Click to auto-apply this fix" : "Manual fix — update this section yourself"}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm leading-relaxed transition-all duration-200 border flex flex-col gap-1.5 group ${
                    isAuto
                      ? isLoading
                        ? "bg-blue-50 border-blue-300 text-blue-800 opacity-75 cursor-wait"
                        : "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-400 cursor-pointer"
                      : "bg-amber-50 border-amber-200 text-amber-900 cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        isAuto ? "bg-blue-200 text-blue-700" : "bg-amber-200 text-amber-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAuto ? "bg-blue-500" : "bg-amber-500"}`} />
                      {isAuto ? "Auto Fix" : "Manual Fix"}
                    </span>

                    {isAuto && (
                      <span className={`shrink-0 text-xs font-semibold transition-all duration-150 ${
                        btnState === "loading" ? "text-blue-500" :
                        btnState === "success" ? "text-green-600" :
                        btnState === "error"   ? "text-red-500" :
                        "text-blue-500 opacity-0 group-hover:opacity-100"
                      }`}>
                        {btnState === "loading" ? "Applying…" :
                         btnState === "success" ? "Applied!" :
                         btnState === "error"   ? "Failed" :
                         "Apply Fix"}
                      </span>
                    )}
                  </div>
                  <span>{s.message}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 italic mt-4">
            * Auto Fix buttons apply changes automatically. Manual Fix items require your own edits.
          </p>
        </div>
      );
    }

    // Enhanced but no matching suggestions for this section — fall through to static tips
  }

  // Builder resume OR no matching suggestions: show static tips
  return <>{staticTips}</>;
};

export default SectionTipsPanel;
