import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useAISuggestions } from "../../../_hooks/useAISuggestions";
import SectionTipsPanel from "../SectionTipsPanel";
import { useValidation } from "../../../_hooks/useValidation";
import AISuggestions from "../AISuggestions";
import AutocompleteInput from "../AutocompleteInput";
import { roles } from "../../../../../../../types/roles";
import {
  FaSpellCheck,
  FaListUl,
  FaListOl,
  FaBold,
  FaItalic,
  FaUnderline,
  FaUndoAlt,
  FaRedoAlt,
} from "react-icons/fa";
import { toast } from "sonner";
import NibPenSparkleIcon from "../NibPenSparkleIcon";
import GeneratingLabel from "../GeneratingLabel";
import { appendSuggestionBullet } from '../../../_lib/appendSuggestionBullet';
import {
  SUMMARY_MAX_LENGTH,
  SUMMARY_MAX_STORED_LENGTH,
  SUMMARY_WARN_AT,
  clipTextToRoom,
  summaryVisibleLength,
} from '../../../_lib/summaryLimit';


// Reusable Toolbar Button Component
interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, icon, isActive = false }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition ${
      isActive ? "text-[#2557a7] border border-[#2557a7] bg-blue-50" : "text-gray-400 hover:text-blue-600"
    }`}
    title={title}
  >
    {icon}
  </button>
);


const TOO_MUCH_FORMATTING_MESSAGE =
  "Too much formatting for this summary — remove some bullets or bold and try again.";

const ProfessionalSummary: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const {
    loadingIndex,
    suggestions,
    activePopup,
    setActivePopup,
    generateSuggestions,
  } = useAISuggestions();


  const { clearError } = useValidation();


  const [showTips, setShowTips] = useState(true);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [aiRoleHint, setAIRoleHint] = useState("");
  // No default: the user must explicitly pick Fresher or Experienced.
  // AI Writer's prompt materially differs by level (years of experience,
  // metrics, tone) -- silently defaulting to "experienced" meant a user
  // who never touched this toggle got that prompt without ever choosing
  // it. handleAIWriterClick below now requires an explicit selection,
  // the same way it already requires Target Role.
  const [careerLevel, setCareerLevel] = useState<"fresher" | "experienced" | null>(null);

  // Local draft, not written straight to the shared resumeData context on
  // every keystroke. The live preview and autosave both read that SAME
  // shared context, so typing directly into it (the previous behavior) made
  // an in-progress, optional Target Role edit appear in the preview before
  // Summary -- the field actually marked required ("*") -- had any content
  // at all, and before Save was ever clicked. Confirmed via a real report:
  // entering only Target Role updated the live preview immediately.
  // draftSummary/draftTargetRole seed from the shared context on mount (this
  // modal fully unmounts/remounts on open/close, so that only happens once
  // per open) and are committed back to it -- which is what the preview and
  // autosave observe -- only once Summary has real content. See the sync
  // effect below.
  const [draftSummary, setDraftSummary] = useState(resumeData.professionalSummary.summary || "");
  const [draftTargetRole, setDraftTargetRole] = useState(resumeData.professionalSummary.targetRole || "");
  const hasSyncedSummaryRef = useRef(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // Last editor content that was within the limit. When an edit (typing, a
  // paste, an AI suggestion) would push the summary past SUMMARY_MAX_LENGTH
  // visible characters the editor goes back to it, so the box never holds text
  // the API would silently cut off. Formatting adds no visible characters, so
  // bullets, numbering and bold keep working on a full summary.
  const lastAcceptedRef = useRef<string>(draftSummary);
  const [limitHit, setLimitHit] = useState(false);

  const moveCaretToEnd = (el: HTMLElement) => {
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const handleChange = (value: string) => {
    setDraftSummary(value);
    clearError("", 0, "summary");
  };

  // Applies editor content `content`, or rejects it when it would grow the
  // summary beyond the limit. Shrinking is always allowed, so a summary that
  // is already over the limit (older data) can still be edited down.
  const acceptEditorContent = (
    el: HTMLElement,
    content: string,
    source: "input" | "format" = "input",
  ): boolean => {
    const previous = lastAcceptedRef.current;
    const length = summaryVisibleLength(content);
    const previousLength = summaryVisibleLength(previous);
    const overVisible = length > SUMMARY_MAX_LENGTH && length > previousLength;
    // The stored HTML (text plus markup) has its own, much larger ceiling.
    const overStored = content.length > SUMMARY_MAX_STORED_LENGTH && content.length > previous.length;
    if (overVisible || overStored) {
      el.innerHTML = lastAcceptedRef.current;
      moveCaretToEnd(el);
      setLimitHit(true);
      if (source === "format" || overStored) {
        // Only the markup was refused, so typing feels fine while the button
        // seems dead -- and the counter line can be scrolled out of sight. Say
        // why, where it cannot be missed.
        toast.error(TOO_MUCH_FORMATTING_MESSAGE, { id: "summary-limit" });
      }
      return false;
    }
    lastAcceptedRef.current = content;
    setLimitHit(length >= SUMMARY_MAX_LENGTH);
    handleChange(content);
    return true;
  };

  const handleTargetRoleChange = (value: string) => {
    setDraftTargetRole(value);
    clearError("summary", 0, "targetRole");
    if (value.trim()) setAIRoleHint("");
  };

  // Commits the draft into the shared context (and so into the live preview
  // and whatever autosave picks up next) once Summary has real content --
  // and, from that point on, keeps committing every further edit to either
  // field, matching ordinary live-editing behavior once the required field
  // is actually satisfied. hasSyncedSummaryRef makes that "from then on"
  // durable even if the user later clears Summary back out again (that
  // clearing itself is then a real edit to already-synced content, not a
  // still-incomplete draft, so it must still reach the preview).
  useEffect(() => {
    if (!draftSummary.trim() && !hasSyncedSummaryRef.current) return;
    hasSyncedSummaryRef.current = true;
    setResumeData((previous) => ({
      ...previous,
      professionalSummary: {
        ...previous.professionalSummary,
        summary: draftSummary,
        targetRole: draftTargetRole,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSummary, draftTargetRole]);


  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";
    const textOnly = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!textOnly) return "";
    return html
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  const exec = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, value);

    setTimeout(() => {
      acceptEditorContent(editor, cleanHtmlContent(editor.innerHTML), "format");
    }, 0);
  };


  const onEditorInput = () => {
    const el = editorRef.current;
    if (!el) return;
    acceptEditorContent(el, cleanHtmlContent(el.innerHTML));
  };

  // A paste that does not fit is trimmed to the room left (as plain text),
  // instead of being dropped whole or cut off later by the API. Pastes that
  // fit keep the browser's normal behavior (and so their formatting).
  const onEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const el = editorRef.current;
    if (!el) return;
    const text = e.clipboardData.getData("text/plain");
    // The paste replaces any selection inside the editor, so that text is room
    // too. Line breaks are not counted (they are free in the limit), which
    // errs toward trimming a little more rather than rejecting the paste.
    const selection = window.getSelection();
    const selected = selection && selection.rangeCount > 0
      && el.contains(selection.getRangeAt(0).commonAncestorContainer)
      ? Array.from(selection.toString().replace(/[\r\n]/g, "")).length
      : 0;
    const room = SUMMARY_MAX_LENGTH - summaryVisibleLength(lastAcceptedRef.current) + selected;
    const clipped = clipTextToRoom(text, room);
    if (clipped.length === text.length) return;
    e.preventDefault();
    if (clipped) document.execCommand("insertText", false, clipped);
    setLimitHit(true);
  };


  const handleAIWriterClick = () => {
    if (!draftTargetRole.trim()) {
      setAIRoleHint("Please enter a target role to generate an AI description.");
      return;
    }
    if (!careerLevel) {
      setAIRoleHint("Please select a Career Level (Fresher or Experienced) to generate an AI description.");
      return;
    }
    setAIRoleHint("");


    const summaryBox = summaryRef.current;
    const formContainer = formScrollRef.current;

    if (summaryBox && formContainer) {
      const summaryBoxTop = summaryBox.offsetTop;
      formContainer.scrollTo({
        top: summaryBoxTop - 50,
        behavior: "smooth"
      });
    }


    setShowTips(false);

        const role = draftTargetRole;
        const isFresher = careerLevel === "fresher";

        const prompt = isFresher
          ? `Generate 5 concise unique professional summary options for a FRESHER or RECENT GRADUATE targeting the following role:
Target Role: ${role}
Requirements for each summary:
- Length: 2-3 lines maximum (approximately 25-35 words)
- Do NOT mention years of work experience or fabricate metrics — this person is just starting their career
- Emphasize academic background, internships, academic projects, or relevant coursework where applicable
- Highlight eagerness to learn, adaptability, and relevant technical or soft skills
- Include keywords relevant to ${role}
- Each summary should emphasize a different angle: academic strength, technical skills, or project/internship experience
Formatting rules:
- Return ONLY the 5 summaries
- NO numbering, NO bullet points, NO labels
- Separate summaries with a blank line
Example format:
Recent Computer Science graduate with hands-on project experience in full-stack development, strong fundamentals in data structures, and a drive to build scalable user-focused applications as a ${role}
 
Motivated ${role} fresher with internship experience in agile teams, proficient in modern development tools and eager to contribute innovative ideas in a collaborative professional environment`
          : `Generate 5 concise unique professional summary options for an EXPERIENCED professional targeting the following role:
Target Role: ${role}
Requirements for each summary:
- Length: 3-4 lines maximum (approximately 25-35 words)
- Start with a strong professional identity (e.g., "Results-driven ${role}...", "Strategic ${role}...")
- Highlight years of experience, measurable achievements, and core competencies
- Include industry-specific keywords and technical skills relevant to ${role}
- Focus on unique value proposition and tangible impact
- Avoid generic phrases like "hardworking," "team player," "seeking opportunities," or "passionate professional"
- Each summary should emphasize a different angle: technical expertise, leadership/impact, or specialized skills
Formatting rules:
- Return ONLY the 5 summaries
- NO numbering, NO bullet points, NO labels
- Separate summaries with a blank line
Example format:
Results-driven Full Stack Developer with 5+ years building scalable web applications, expertise in React and Node.js, and a track record of reducing load times by 40% while serving 100K+ users
 
Strategic Product Manager with proven ability to launch 10+ successful features, drive 35% revenue growth, and lead cross-functional teams of 15+ members in agile environments
 
Innovative UX Designer specializing in user-centered design methodologies, creating intuitive interfaces that improved user satisfaction scores by 50% and reduced customer support tickets by 30%`;
 
 
    generateSuggestions(0, prompt, "summary");
  };
 


  const handleSuggestionSelect = (suggestion: string) => {
    const el = editorRef.current;
    if (el) {
      // Single-select in AISuggestions: picking a suggestion REPLACES the
      // summary rather than accumulating with a previous pick (or with
      // anything else already in the box) -- confirmed as the expected
      // workflow ("only one should need to add, not 5; picking another
      // replaces the first"). Clearing first, then appending onto the
      // now-empty editor, reuses appendSuggestionBullet's own
      // bullet-creation logic instead of duplicating it here.
      const before = el.innerHTML;
      el.innerHTML = '';
      appendSuggestionBullet(el, suggestion);
      if (summaryVisibleLength(cleanHtmlContent(el.innerHTML)) > SUMMARY_MAX_LENGTH) {
        // Too long to fit: keep what the user had rather than saving a cut-off suggestion.
        el.innerHTML = before;
        setLimitHit(true);
        toast.error("That suggestion is too long for the 2,000-character summary limit.", { id: "summary-limit" });
        return;
      }
      acceptEditorContent(el, cleanHtmlContent(el.innerHTML));

      setTimeout(() => {
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (el.childNodes.length > 0) {
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
    // Popup stays open — closed only by X button
  };


  const toggleSpellCheck = () => {
    const newState = !spellCheckEnabled;
    setSpellCheckEnabled(newState);
    const ed = editorRef.current;
    if (ed) ed.spellcheck = newState;
  };


  useEffect(() => {
    const el = editorRef.current;
    if (el && draftSummary) {
      if (document.activeElement !== el && el.innerHTML !== draftSummary) {
        el.innerHTML = draftSummary;
      }
    }
  }, [draftSummary]);


  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Editing Form with Tips Panel */}
      <div className="flex gap-6 items-start">
        {/* Left Side: Scrollable Form Fields Section */}
        <div 
          ref={formScrollRef}
          className="flex-1 mt-6 pr-2"
        >
          <div className="flex flex-col gap-3">
            {/* Target Role Input with Autocomplete */}
            <AutocompleteInput
              label="Target Role"
              value={draftTargetRole}
              onChange={(val) => handleTargetRoleChange(val)}
              placeholder="e.g., Frontend Developer, Data Analyst"
              suggestions={roles}
              maxLength={100}
              hint={aiRoleHint}
            />

            {/* Career Level Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Career Level</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
                {(["fresher", "experienced"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setCareerLevel(level)}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                      careerLevel === level
                        ? "bg-[#2557a7] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {level === "fresher" ? "Fresher" : "Experienced"}
                  </button>
                ))}
              </div>
            </div>

            {/* Professional Summary */}
            <div ref={summaryRef} className="flex flex-col gap-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">
                  Professional Summary <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  ref={buttonRef}
                  disabled={loadingIndex === 0}
                  onClick={handleAIWriterClick}
                  className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium border bg-gradient-to-br from-[#194386] to-[#3b6ecb] text-white hover:bg-blue-700 rounded-full disabled:bg-gray-400"
                >
                  <NibPenSparkleIcon className="w-4 h-4" />
                  {loadingIndex === 0 ? <GeneratingLabel /> : "AI Writer"}
                </button>
              </div>


              {/* Summary Box with Toolbar Inside */}
              <div className="w-full rounded-lg bg-[#faf9f8] hover:bg-[#f3f2f1] mt-2 focus:border-b focus:border-b-[#2557a7] overflow-hidden">
                {/* Toolbar with Reusable Buttons */}
                <div className="flex items-center gap-1 px-3 py-2 bg-[#faf9f8] flex-wrap">
                  <ToolbarButton onClick={() => exec("bold")} title="Bold" icon={<FaBold />} />
                  <ToolbarButton onClick={() => exec("italic")} title="Italic" icon={<FaItalic />} />
                  <ToolbarButton onClick={() => exec("underline")} title="Underline" icon={<FaUnderline />} />
                  <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet List" icon={<FaListUl />} />
                  <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered List" icon={<FaListOl />} />
                  <ToolbarButton onClick={() => exec("undo")} title="Undo" icon={<FaUndoAlt />} />
                  <ToolbarButton onClick={() => exec("redo")} title="Redo" icon={<FaRedoAlt />} />
                  <ToolbarButton onClick={toggleSpellCheck} title="Toggle Spellcheck" icon={<FaSpellCheck size={16} />} isActive={spellCheckEnabled} />
                </div>


                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={onEditorInput}
                  onPaste={onEditorPaste}
                  className="w-full px-3 py-2 text-sm text-black min-h-[180px] focus:outline-none border-b-2 border-transparent focus:border-[#2557a7] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  spellCheck={spellCheckEnabled}
                />
              </div>
              {(() => {
                const used = summaryVisibleLength(draftSummary);
                const atLimit = used >= SUMMARY_MAX_LENGTH;
                const nearLimit = used >= SUMMARY_WARN_AT;
                return (
                  <div
                    role="status"
                    aria-live="polite"
                    data-testid="summary-counter"
                    className={`flex justify-between gap-3 text-xs ${
                      atLimit ? "text-red-600" : nearLimit ? "text-amber-600" : "text-gray-500"
                    }`}
                  >
                    <span>
                      {limitHit || atLimit
                        ? `Limit reached — text beyond ${SUMMARY_MAX_LENGTH.toLocaleString()} characters is not saved.`
                        : ""}
                    </span>
                    <span>
                      {used.toLocaleString()} / {SUMMARY_MAX_LENGTH.toLocaleString()}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>


        {/* Right Side: Fixed Tips Section */}
        <div className="w-80 flex-shrink-0 sticky top-2">
          {showTips && activePopup === null ? (
            <SectionTipsPanel
              sectionKey="ProfessionalSummary"
              staticTips={
                <div className="bg-[#faf9f8] rounded-lg p-5">
                  <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                  <div className="border-t border-gray-300 mb-3"></div>
                  <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                    <p>
                      Your professional summary is a brief overview highlighting your experience, skills, and career achievements. Keep it concise, focused, and tailored to your target role.*
                    </p>
                    <p>
                      Include years of experience, key competencies, measurable achievements, and industry-specific keywords. Start with a strong professional descriptor and emphasize your unique value proposition.
                    </p>
                    <p className="text-xs text-gray-500 italic mt-6">
                      *Recruiters spend an average of 6 seconds reviewing a resume—make your summary count.
                    </p>
                  </div>
                </div>
              }
            />
          ) : (
            activePopup !== null && suggestions[activePopup] && (
              <AISuggestions
                options={suggestions[activePopup]}
                // handleSuggestionSelect above clears the editor before
                // appending, i.e. it REPLACES. This is the one call site with
                // that contract -- the other eight append -- so it is the one
                // that opts into single-select.
                selectionMode="single"
                description="Based on your target role and career level, here are some professional summary suggestions."
                onSelect={(s) => handleSuggestionSelect(s)}
                onClose={() => {
                  setActivePopup(null);
                  setShowTips(true);
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};


export default ProfessionalSummary;