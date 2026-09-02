"use client";
import React, { useState, useRef } from "react";
import { CheckCircle2, Undo2 } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";

// Maps each section component's key to the suggestion `section` values from the API.
// Section values come from enhancer_state.suggestions[].section in the backend response.
const SUGGESTION_SECTION_MAP: Record<string, string[]> = {
  PersonalInfo: ["Contact"],
  // Formatting suggestions (e.g. low word count) are surfaced in the Summary section
  // "content" covers buzzword/repetition/weak-phrase deductions from the ATS scorer
  ProfessionalSummary: ["Summary", "Formatting", "content"],
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
  const { resumeSource, resumeData, enhancedSuggestions, applyAutoFix, applyManualFix, undoFix } = useResume();
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonState>>({});
  const [undoStates, setUndoStates] = useState<Record<string, ButtonState>>({});
  // Snapshot section values at the time each suggestion first renders.
  // Used to detect whether the user has actually edited the field before marking as done.
  const originalValuesRef = useRef<Record<string, string>>({});

  const getSectionValue = (section: string, suggestion?: { message: string }): string => {
    const s = section.toLowerCase();
    if (["summary", "formatting", "content"].includes(s)) {
      return resumeData.professionalSummary?.summary ?? "";
    }
    if (s === "contact") {
      const p = resumeData.personalInfo ?? {};
      if (suggestion) {
        const msg = suggestion.message.toLowerCase();
        if (msg.includes("github")) return p.githubUrl ?? "";
        if (msg.includes("linkedin")) return p.linkedinUrl ?? "";
        if (msg.includes("portfolio")) return p.portfolioUrl ?? "";
        if (msg.includes("email")) return p.email ?? "";
        if (msg.includes("phone")) return p.phone ?? "";
        if (msg.includes("location")) return p.location ?? "";
      }
      return [p.fullname, p.email, p.phone, p.location, p.linkedinUrl, p.githubUrl, p.portfolioUrl]
        .filter(Boolean).join(", ");
    }
    if (["skills", "keywords"].includes(s)) {
      if (resumeData.categorizedSkills) {
        return Object.values(resumeData.categorizedSkills).flat().join(", ");
      }
      return (resumeData.skills ?? []).join(", ");
    }
    if (["workexperience", "experience", "contentquality", "leadership"].includes(s)) {
      return (resumeData.workExperience ?? []).map(e => e.description).filter(Boolean).join(" ");
    }
    if (s === "projects") {
      return (resumeData.projects ?? []).map(e => e.description).filter(Boolean).join(" ");
    }
    if (s === "education") {
      return (resumeData.education ?? []).map(e => `${e.degree} ${e.school}`).filter(Boolean).join(", ");
    }
    if (s === "certifications") {
      return (resumeData.certifications ?? []).map(e => e.name).filter(Boolean).join(", ");
    }
    if (s === "internships") {
      return (resumeData.internships ?? []).map(e => e.description).filter(Boolean).join(" ");
    }
    if (s === "achievements") {
      return (resumeData.achievements ?? []).map(e => `${e.title} ${e.description ?? ""}`).join(" ");
    }
    if (s === "awards") {
      return (resumeData.awards ?? []).map(e => e.title).filter(Boolean).join(", ");
    }
    if (s === "hobbies") {
      return (resumeData.hobbies ?? []).map(e => `${e.name} ${e.description ?? ""}`).join(" ");
    }
    if (s === "interests") {
      return (resumeData.interests ?? []).map(e => `${e.name} ${e.description ?? ""}`).join(" ");
    }
    if (["languages", "intelligencepenalty"].includes(s)) {
      return (resumeData.languages ?? []).map(e => `${e.name} ${e.proficiency ?? ""}`).join(", ");
    }
    if (s === "publications") {
      return (resumeData.publications ?? []).map(e => e.title).filter(Boolean).join(", ");
    }
    return "";
  };

  const setButtonState = (id: string, state: ButtonState) =>
    setButtonStates(prev => ({ ...prev, [id]: state }));

  const setUndoState = (id: string, state: ButtonState) =>
    setUndoStates(prev => ({ ...prev, [id]: state }));

  const handleUndo = async (id: string) => {
    setUndoState(id, "loading");
    try {
      await undoFix(id);
      // Reset both button states so the suggestion card returns to idle
      setButtonState(id, "idle");
      setUndoState(id, "idle");
    } catch {
      setUndoState(id, "error");
      setTimeout(() => setUndoState(id, "idle"), 2500);
    }
  };

  const handleAutoFix = async (id: string) => {
    setButtonState(id, "loading");
    try {
      await applyAutoFix(id);
      setButtonState(id, "success");
    } catch {
      setButtonState(id, "error");
      setTimeout(() => setButtonState(id, "idle"), 2500);
    }
  };

  const handleManualFix = async (id: string, value: string) => {
    setButtonState(id, "loading");
    try {
      await applyManualFix(id, value);
      setButtonState(id, "success");
    } catch {
      setButtonState(id, "error");
      setTimeout(() => setButtonState(id, "idle"), 2500);
    }
  };

  if (resumeSource === "enhanced" && enhancedSuggestions.length > 0) {
    const sectionKeys = SUGGESTION_SECTION_MAP[sectionKey] ?? [];

    // Step 1: filter by section
    let matched = enhancedSuggestions.filter((s) => sectionKeys.includes(s.section));

    // Step 2: if entryContent provided, try to scope suggestions to this specific entry.
    // ATS section_breakdown deductions are section-level (generic messages) and won't match
    // any entry identifier — in that case keep all section-level suggestions visible.
    if (entryContent !== undefined) {
      const identifiers = entryContent.map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (identifiers.length === 0) {
        // entry has no identifiable content — show static tips
        return <>{staticTips}</>;
      }
      const entryMatched = matched.filter((s) =>
        identifiers.some((id) => s.message.toLowerCase().includes(id))
      );
      // Prefer entry-specific matches; fall back to all section suggestions (e.g. ATS issues)
      if (entryMatched.length > 0) {
        matched = entryMatched;
      }
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

              // Snapshot section value on first render of this suggestion
              if (!isAuto && !(s.id in originalValuesRef.current)) {
                originalValuesRef.current[s.id] = getSectionValue(s.section, s);
              }
              const currentValue = isAuto ? "" : getSectionValue(s.section, s);
              const isEdited = isAuto || currentValue.trim() !== originalValuesRef.current[s.id]?.trim();
              const checkDisabled = btnState === "loading" || btnState === "success" || !isEdited;

              const undoBtnState = undoStates[s.id] ?? "idle";
              const isUndoing = undoBtnState === "loading";
              // Applied fixes and in-flight ones are not re-appliable.
              const isDisabled = isLoading || isUndoing || btnState === "success";

              return isAuto ? (
                // ── Auto fix: a clickable CARD, not a <button> ──
                //
                // It has to be a div: the Undo control below is itself a
                // <button>, and the HTML spec forbids interactive content
                // inside <button>. React renders it, but the parser implicitly
                // closes the outer button when it meets the inner one, so the
                // server DOM and the client tree disagree — Next 15 raises a
                // hydration error and discards the mismatched subtree. The
                // visible result was an Undo control rendered in the wrong
                // place and dead to clicks, because a disabled ancestor
                // suppresses pointer events on its descendants in WebKit.
                //
                // The manual-fix branch below already uses a div for exactly
                // this reason and its Undo button works.
                <div
                  key={s.id}
                  // role="button" + tabIndex + key handling, NOT role="group".
                  // The first pass used "group", which fixed the hydration
                  // error and quietly removed keyboard activation: a native
                  // <button> is focusable and fires on Enter and Space for
                  // free, and a plain div is neither. Anyone not using a mouse
                  // lost the ability to apply a fix at all.
                  role={isDisabled ? undefined : "button"}
                  tabIndex={isDisabled ? undefined : 0}
                  aria-disabled={isDisabled || undefined}
                  onClick={() => {
                    if (isDisabled) return;
                    handleAutoFix(s.id);
                  }}
                  onKeyDown={(e) => {
                    if (isDisabled) return;
                    // Space scrolls the panel by default; a button must not.
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAutoFix(s.id);
                    }
                  }}
                  title={btnState === "success" ? undefined : "Click to auto-apply this fix"}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm leading-relaxed transition-all duration-200 border flex flex-col gap-1.5 group ${
                    isLoading || isUndoing
                      ? "bg-blue-50 border-blue-300 text-blue-800 opacity-75 cursor-wait"
                      : btnState === "success"
                        ? "bg-green-50 border-green-300 text-green-900 cursor-default"
                        : "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-400 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      btnState === "success" ? "bg-green-200 text-green-700" : "bg-blue-200 text-blue-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${btnState === "success" ? "bg-green-500" : "bg-blue-500"}`} />
                      Auto Fix
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold transition-all duration-150 ${
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
                      {btnState === "success" && (
                        <button
                          type="button"
                          disabled={isUndoing}
                          onClick={(e) => { e.stopPropagation(); handleUndo(s.id); }}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border transition-all duration-150 ${
                            isUndoing
                              ? "bg-gray-100 border-gray-300 text-gray-400 cursor-wait"
                              : undoBtnState === "error"
                                ? "bg-red-50 border-red-300 text-red-600"
                                : "bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 cursor-pointer"
                          }`}
                          title="Undo this fix"
                        >
                          <Undo2 size={10} />
                          {isUndoing ? "Undoing…" : undoBtnState === "error" ? "Failed" : "Undo"}
                        </button>
                      )}
                    </div>
                  </div>
                  <span>{s.message}</span>
                </div>
              ) : (
                // ── Manual fix: non-clickable card + mark-as-done icon ──
                <div
                  key={s.id}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm leading-relaxed transition-all duration-200 border flex flex-col gap-1.5 group ${
                    btnState === "loading" || isUndoing
                      ? "bg-amber-50 border-amber-300 text-amber-900 opacity-75"
                      : btnState === "success"
                        ? "bg-green-50 border-green-300 text-green-900"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      btnState === "success" ? "bg-green-200 text-green-700" : "bg-amber-200 text-amber-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${btnState === "success" ? "bg-green-500" : "bg-amber-500"}`} />
                      Manual Fix
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {btnState === "success" ? (
                        <button
                          type="button"
                          disabled={isUndoing}
                          onClick={() => handleUndo(s.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border transition-all duration-150 ${
                            isUndoing
                              ? "bg-gray-100 border-gray-300 text-gray-400 cursor-wait"
                              : undoBtnState === "error"
                                ? "bg-red-50 border-red-300 text-red-600"
                                : "bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 cursor-pointer"
                          }`}
                          title="Undo this fix"
                        >
                          <Undo2 size={10} />
                          {isUndoing ? "Undoing…" : undoBtnState === "error" ? "Failed" : "Undo"}
                        </button>
                      ) : (
                        <div className="relative flex items-center">
                          <button
                            type="button"
                            disabled={checkDisabled}
                            onClick={() => handleManualFix(s.id, currentValue)}
                            className={`flex items-center justify-center rounded-full w-6 h-6 transition-all duration-150 peer ${
                              btnState === "loading" ? "text-amber-400 cursor-wait" :
                              btnState === "error"   ? "text-red-400 hover:text-red-600 cursor-pointer" :
                              !isEdited             ? "text-gray-300 cursor-not-allowed" :
                              "text-amber-400 hover:text-green-500 cursor-pointer"
                            }`}
                            aria-label="Mark as done"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <span className="absolute right-7 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-white opacity-0 peer-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                            {btnState === "loading" ? "Marking…" :
                             btnState === "error"   ? "Failed" :
                             !isEdited             ? "Edit the field first" :
                             "Mark as done"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span>{s.message}</span>
                </div>
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
