"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateNotes, getNotes, updateNotes } from "@/api/mockInterviewApi";
import { getAllResumesUnified } from "@/api/resumeApi";
import type { ResumeResponse } from "@/api/resumeApi";
import type { EnhancedResumeSummary } from "@/types/api.types";
import { useMockInterview } from "../_context/MockInterviewContext";
import {
  FileText,
  Briefcase,
  MessageSquare,
  MoreHorizontal,
  Edit3,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HRAnswer {
  question_id: string;
  question_text: string;
  why_asked: string;
  answer_script: string;
  practice_tip: string;
  common_mistake: string;
  experience_level: "fresher" | "experienced" | "both";
}

interface ProjectNote {
  project_name: string;
  overview: string;
  your_role: string;
  tech_stack: string;
  how_it_works: string;
  challenges: string;
  results: string;
  follow_up_questions: { q: string; hint: string }[];
}

interface NotesData {
  self_introduction: string;
  project_explanations: ProjectNote[];
  hr_answers: HRAnswer[];
  additional_notes: {
    hobbies: string[];
    hobbies_custom: string;
    career_goals_short: string;
    career_goals_long: string;
    why_this_field: string;
    teamwork_example: string;
    handling_gaps: string;
    learning_attitude: string;
  };
  unfilled_count: number;
}

// ─── API → NotesData mapper ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToNotesData(apiNotes: Record<string, any>): NotesData {
  // Self-introduction: API may return {script, sections, key_phrases} or plain string
  const selfIntroRaw = apiNotes.self_introduction;
  const selfIntroStr =
    typeof selfIntroRaw === "string" ? selfIntroRaw : (selfIntroRaw?.script ?? "");

  // HR Answers: API returns hr_answers[] directly OR inside common_answers.answers[]
  let hrAnswers: HRAnswer[] = [];
  if (Array.isArray(apiNotes.hr_answers)) {
    hrAnswers = apiNotes.hr_answers as HRAnswer[];
  } else if (Array.isArray(apiNotes.common_answers?.answers)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hrAnswers = (apiNotes.common_answers.answers as any[]).map((a) => ({
      question_id: a.question_id ?? String(Math.random()),
      question_text: a.question_text ?? a.question ?? "",
      why_asked: a.why_asked ?? "",
      answer_script: a.answer_script ?? a.model_answer ?? "",
      practice_tip: a.practice_tip ?? a.tip ?? "",
      common_mistake: a.common_mistake ?? a.mistake ?? "",
      experience_level: (a.experience_level ?? "both") as HRAnswer["experience_level"],
    }));
  }

  // Project explanations: API may use different field names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectExplanations: ProjectNote[] = (apiNotes.project_explanations ?? []).map((p: any) => {
    const techStack = Array.isArray(p.tech_stack)
      ? p.tech_stack.join(", ")
      : p.tech_stack ?? (Array.isArray(p.key_tech_terms) ? p.key_tech_terms.join(", ") : (p.key_tech_terms ?? ""));

    const followUpQuestions = Array.isArray(p.follow_up_questions)
      ? p.follow_up_questions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : Array.isArray(p.common_questions) ? p.common_questions.map((q: any) =>
          typeof q === "string" ? { q, hint: "" } : { q: q.q ?? q.question ?? "", hint: q.hint ?? q.answer ?? "" }
        )
      : [];

    return {
      project_name: p.project_name ?? "",
      overview: p.overview ?? p.one_liner ?? "",
      your_role: p.your_role ?? p.role ?? "",
      tech_stack: techStack,
      how_it_works: p.how_it_works ?? p.explanation_script ?? "",
      challenges: p.challenges ?? "",
      results: p.results ?? "",
      follow_up_questions: followUpQuestions,
    };
  });

  // Additional notes: map from API keys to frontend keys
  const additional = apiNotes.additional_notes ?? {};
  const additionalNotes: NotesData["additional_notes"] = {
    hobbies: Array.isArray(additional.hobbies) ? additional.hobbies : [],
    hobbies_custom: additional.hobbies_custom ?? "",
    career_goals_short: additional.career_goals_short ?? additional.short_term_goals ?? "",
    career_goals_long: additional.career_goals_long ?? additional.long_term_goals ?? "",
    why_this_field: additional.why_this_field ?? "",
    teamwork_example: additional.teamwork_example ?? "",
    handling_gaps: additional.handling_gaps
      ?? (Array.isArray(additional.employment_gaps?.talking_points)
        ? additional.employment_gaps.talking_points.join("\n")
        : ""),
    learning_attitude: additional.learning_attitude ?? "",
  };

  return {
    self_introduction: selfIntroStr,
    project_explanations: projectExplanations,
    hr_answers: hrAnswers,
    additional_notes: additionalNotes,
    unfilled_count: apiNotes.unfilled_count ?? 0,
  };
}

// ─── Resume option (for generation picker) ───────────────────────────────────

interface ResumeOption {
  id: string;
  name: string;
  role: string;
}

function toResumeOption(r: ResumeResponse): ResumeOption {
  return {
    id: r.id,
    name: r.personalInfo?.fullname || `Resume …${r.id.slice(-8)}`,
    role:
      typeof r.professionalSummary === "object"
        ? (r.professionalSummary?.targetRole ?? "")
        : "",
  };
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "intro", label: "Self-Intro", icon: FileText },
  { id: "projects", label: "Projects", icon: Briefcase },
  { id: "hr", label: "HR Answers", icon: MessageSquare },
  { id: "additional", label: "Additional Notes", icon: MoreHorizontal },
];

// ─── EditableBlock ─────────────────────────────────────────────────────────────

function EditableBlock({
  label,
  value: rawValue,
  onChange,
  rows = 5,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const value = typeof rawValue === "string" ? rawValue : rawValue != null ? String(rawValue) : "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // escapeHtml first so the bracket markers below are the only real HTML —
  // any markup inside a [CONFIRM:...] / note body renders as inert text.
  const highlighted = escapeHtml(value)
    .replace(
      /\[CONFIRM:[^\]]+\]/g,
      (m) => `<mark class="bg-gray-200 text-gray-700 rounded px-1 cursor-pointer">${m}</mark>`
    )
    .replace(
      /\[ADD YOUR OWN:[^\]]+\]/g,
      (m) => `<mark class="bg-[#2557a7]/15 text-[#2557a7] rounded px-1 cursor-pointer">${m}</mark>`
    )
    .replace(
      /\[ADD YOUR NAME\]/g,
      `<mark class="bg-[#2557a7]/15 text-[#2557a7] rounded px-1 cursor-pointer">[ADD YOUR NAME]</mark>`
    );

  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="group">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
          {!editing && (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#2557a7] hover:text-[#1e4a8f]"
            >
              <Edit3 size={11} /> Edit
            </button>
          )}
        </div>
      )}

      {!label && !editing && (
        <div className="flex justify-end mb-1">
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#2557a7] hover:text-[#1e4a8f]"
          >
            <Edit3 size={11} /> Edit
          </button>
        </div>
      )}

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={rows}
            autoFocus
            className="w-full text-sm text-gray-700 border border-[#2557a7]/30 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#2557a7]/20 focus:border-[#2557a7] leading-relaxed bg-white"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={save}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#2557a7] text-white rounded-lg text-xs font-semibold hover:bg-[#1e4a8f] transition-all"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-all"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className="text-sm text-gray-700 leading-relaxed cursor-text"
          dangerouslySetInnerHTML={{ __html: highlighted }}
          onClick={() => { setDraft(value); setEditing(true); }}
        />
      )}
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
      open
        ? "border-[#2557a7]/20 shadow-[0_2px_12px_rgba(37,87,167,0.08)]"
        : "border-gray-200"
    }`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-left">
          {open && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2557a7] shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge && (
            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={15} className="text-[#2557a7] shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 space-y-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Generation progress ──────────────────────────────────────────────────────

const GEN_STAGES = [
  "Generating self-introduction…",
  "Generating project scripts…",
  "Generating HR answers…",
  "Generating additional notes…",
];

function GenerationProgress({ stage }: { stage: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <Loader2 size={28} className="text-[#2557a7] animate-spin mx-auto mb-4" />
      <p className="text-sm font-bold text-gray-900 mb-1">Creating your notes…</p>
      <p className="text-xs text-gray-500 mb-5">{GEN_STAGES[stage] ?? "Finalising…"}</p>
      <div className="flex gap-1 justify-center mb-3">
        {GEN_STAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i < stage ? "w-8 bg-[#2557a7]" : i === stage ? "w-8 bg-[#2557a7]/40 animate-pulse" : "w-8 bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-400">15–30 seconds</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const router = useRouter();
  const { userId, setNotesGenerated: setContextNotesGenerated, progressLoading } = useMockInterview();
  const [notes, setNotes] = useState<NotesData | null>(null);
  const [activeTab, setActiveTab] = useState("intro");
  const [experienceLevel, setExperienceLevel] = useState<"fresher" | "experienced">("fresher");
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notesGenerated, setNotesGenerated] = useState(false);
  const [notesLoading, setNotesLoading] = useState(true);
  const [targetRole, setTargetRole] = useState("");
  const [resumeId, setResumeId] = useState<string>("");
  const [availableResumes, setAvailableResumes] = useState<ResumeOption[]>([]);

  // ── Load all resumes (builder + enhanced) + existing notes ──
  // Uses the same unified endpoint as the resume list page so all 4 resumes
  // (or however many) appear in the picker, not just builder ones.
  useEffect(() => {
    if (progressLoading) return;

    const storedId = localStorage.getItem("current_resume_id") ?? "";

    getAllResumesUnified()
      .then(({ builder_resumes, enhanced_resumes }) => {
        const builderOptions = (builder_resumes as unknown as ResumeResponse[]).map(toResumeOption);
        const enhancedOptions = (enhanced_resumes as EnhancedResumeSummary[]).map((r) => ({
          id: r.id,
          name: r.display_name || `Uploaded Resume …${r.id.slice(-8)}`,
          role: "",
        }));
        const allOptions: ResumeOption[] = [...builderOptions, ...enhancedOptions];

        if (allOptions.length === 0) {
          setAvailableResumes([]);
          setNotesLoading(false);
          return;
        }

        setAvailableResumes(allOptions);

        // Prefer the stored id if it still exists across both lists; else first
        const bestId = allOptions.some((r) => r.id === storedId)
          ? storedId
          : allOptions[0].id;
        setResumeId(bestId);
        localStorage.setItem("current_resume_id", bestId);
        loadNotes(bestId);
      })
      .catch(() => {
        setNotesLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoading, userId]);

  function loadNotes(_resumeId: string) {
    if (!userId) {
      setNotesLoading(false);
      return;
    }

    getNotes(userId)
      .then((record) => {
        const hasNotes =
          record?.notes != null &&
          typeof record.notes === "object" &&
          Object.keys(record.notes).length > 0;

        if (hasNotes) {
          setNotes(mapApiToNotesData(record.notes as Record<string, unknown>));
          setNotesGenerated(true);
          setContextNotesGenerated(true);
        }
        // notes: {} → fall through, notesGenerated stays false → show generate screen
      })
      .catch(() => {
        // 404 = no notes yet → show generation screen
        setNotesGenerated(false);
      })
      .finally(() => setNotesLoading(false));
  }

  const handleGenerate = async () => {
    if (!resumeId) {
      setGenerateError("No resume found. Please upload or create a resume first.");
      return;
    }

    setGenerating(true);
    setGenStage(0);
    setGenerateError(null);

    let stageInterval = 0;
    const stageTimer = setInterval(() => {
      stageInterval += 1;
      if (stageInterval < GEN_STAGES.length) setGenStage(stageInterval);
    }, 4000);

    try {
      const result = await generateNotes({
        resume_id: resumeId,
        target_role: targetRole || undefined,
        experience_level: experienceLevel === "experienced" ? "mid" : "fresher",
      });
      setNotes(mapApiToNotesData(result.notes as Record<string, unknown>));
      setNotesGenerated(true);
      setContextNotesGenerated(true);
      localStorage.setItem("mock_experience_level", experienceLevel);
    } catch {
      setGenerateError("Failed to generate notes. Please try again.");
    } finally {
      clearInterval(stageTimer);
      setGenerating(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!userId) {
      router.push("/mock-interview/english");
      return;
    }
    setSaving(true);
    try {
      if (notes) await updateNotes(userId, notes as unknown as Record<string, unknown>);
    } catch {
      // Non-blocking — navigate regardless
    } finally {
      setSaving(false);
    }
    router.push("/mock-interview/english");
  };

  const updateSelfIntro = (v: string) =>
    setNotes((n) => n ? { ...n, self_introduction: v } : n);

  const updateProject = (i: number, k: keyof ProjectNote, v: string) =>
    setNotes((n) => {
      if (!n) return n;
      const projs = [...n.project_explanations];
      projs[i] = { ...projs[i], [k]: v } as ProjectNote;
      return { ...n, project_explanations: projs };
    });

  const updateHR = (questionId: string, v: string) =>
    setNotes((n) => n ? ({
      ...n,
      hr_answers: n.hr_answers.map((qa) =>
        qa.question_id === questionId ? { ...qa, answer_script: v } : qa
      ),
    }) : n);

  const updateAdditional = (k: keyof NotesData["additional_notes"], v: string) =>
    setNotes((n) => n ? { ...n, additional_notes: { ...n.additional_notes, [k]: v } } : n);

  const toggleHobby = (hobby: string) =>
    setNotes((n) => {
      if (!n) return n;
      const hobbies = n.additional_notes.hobbies.includes(hobby)
        ? n.additional_notes.hobbies.filter((h) => h !== hobby)
        : [...n.additional_notes.hobbies, hobby];
      return { ...n, additional_notes: { ...n.additional_notes, hobbies } };
    });

  // ── Loading notes ──
  if (notesLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Loader2 size={24} className="text-[#2557a7] animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading your notes…</p>
      </div>
    );
  }

  // ── Pre-generation screen ──
  if (!notesGenerated && !generating) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>

        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Generate Interview Notes</h1>
        <p className="text-sm text-gray-500 mb-5">
          AI-generated scripts for 12+ HR questions from your resume.
        </p>

        {/* Single card: resume + role + what you get */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
          {/* Resume selection */}
          <div className="pb-3 mb-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {availableResumes.length > 1 ? "Select Resume" : "Resume"}
            </p>

            {availableResumes.length === 0 ? (
              /* No resumes */
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText size={13} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">No resume found</p>
                  <a href="/builder/start" className="text-[11px] text-[#2557a7] hover:underline">
                    Create or upload a resume first →
                  </a>
                </div>
              </div>
            ) : availableResumes.length === 1 ? (
              /* Single resume — auto-selected */
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#2557a7]/10 flex items-center justify-center shrink-0">
                  <FileText size={13} className="text-[#2557a7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{availableResumes[0].name}</p>
                  {availableResumes[0].role && (
                    <p className="text-[11px] text-gray-400 truncate">{availableResumes[0].role}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Multiple resumes — radio picker */
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                {availableResumes.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      resumeId === r.id
                        ? "border-[#2557a7]/40 bg-[#2557a7]/5"
                        : "border-gray-200 bg-white hover:border-[#2557a7]/20 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume_select"
                      value={r.id}
                      checked={resumeId === r.id}
                      onChange={() => setResumeId(r.id)}
                      className="accent-[#2557a7] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                      {r.role && (
                        <p className="text-[11px] text-gray-400 truncate">{r.role}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Experience level */}
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Experience Level
          </label>
          <div className="flex gap-2 mb-3">
            {(["fresher", "experienced"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setExperienceLevel(lvl)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  experienceLevel === lvl
                    ? "bg-[#2557a7] text-white border-[#2557a7]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2557a7]/40"
                }`}
              >
                {lvl === "fresher" ? "Fresher" : "Experienced"}
              </button>
            ))}
          </div>

          {/* What you get — compact list */}
          <div className="space-y-1.5 mb-3">
            {[
              "Self-introduction script",
              "Project explanation scripts",
              "12 HR answer scripts",
              "Hobbies, goals, gap talking points",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={12} className="text-[#2557a7] shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Target role */}
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Target Role <span className="normal-case font-normal tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Junior Software Developer, Data Analyst…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2557a7]/25 focus:border-[#2557a7] transition-all"
          />
        </div>

        {generateError && (
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 mb-3">
            <AlertCircle size={12} className="text-gray-400 shrink-0" />
            {generateError}
          </div>
        )}

        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-lg font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-sm shadow-[#2557a7]/20"
        >
          <Sparkles size={14} />
          Generate My Notes
        </button>
      </div>
    );
  }

  // ── Generation in progress ──
  if (generating) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <GenerationProgress stage={genStage} />
      </div>
    );
  }

  // ── Notes editing view ──
  if (!notes) return null;
  const unfilledCount = notes.unfilled_count;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={() => router.push("/mock-interview")}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2 transition-colors"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Interview Notes</h1>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
      </div>

      {/* Unfilled alert + legend — compact inline */}
      {unfilledCount > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-lg">
          <AlertCircle size={12} className="text-[#2557a7] shrink-0" />
          <p className="text-xs text-gray-600">
            <strong className="text-gray-900">{unfilledCount} placeholders</strong> to fill.
            <mark className="bg-gray-200 text-gray-700 rounded px-1 ml-1.5 text-[10px]">CONFIRM</mark>
            <mark className="bg-[#2557a7]/15 text-[#2557a7] rounded px-1 ml-1 text-[10px]">ADD YOUR OWN</mark>
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === id
                ? "bg-[#2557a7] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Self-Intro ── */}
      {activeTab === "intro" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Self-introduction script</p>
            <p className="text-[11px] text-gray-400">~90 seconds · 150–200 words</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <EditableBlock value={notes.self_introduction} onChange={updateSelfIntro} rows={7} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-lg">
            <Info size={11} className="text-[#2557a7] shrink-0" />
            <p className="text-[11px] text-[#2557a7]">
              Read aloud 3 times. Over 2 min? Trim skills section.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab: Projects ── */}
      {activeTab === "projects" && (
        <div className="space-y-3">
          {notes.project_explanations.map((proj, i) => (
            <Accordion
              key={i}
              title={proj.project_name}
              badge={`~60s target`}
              defaultOpen={i === 0}
            >
              <EditableBlock label="Overview" value={proj.overview} onChange={(v) => updateProject(i, "overview", v)} />
              <EditableBlock label="Your Role" value={proj.your_role} onChange={(v) => updateProject(i, "your_role", v)} />
              <EditableBlock label="Tech Stack" value={proj.tech_stack} onChange={(v) => updateProject(i, "tech_stack", v)} rows={2} />
              <EditableBlock label="How It Works" value={proj.how_it_works} onChange={(v) => updateProject(i, "how_it_works", v)} />
              <EditableBlock label="Challenges" value={proj.challenges} onChange={(v) => updateProject(i, "challenges", v)} />
              <EditableBlock label="Results" value={proj.results} onChange={(v) => updateProject(i, "results", v)} />

              {proj.follow_up_questions.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MessageSquare size={11} />
                    Likely Follow-up Questions
                  </p>
                  <div className="space-y-2">
                    {proj.follow_up_questions.map((fq, fi) => (
                      <div key={fi} className="rounded-xl border border-[#2557a7]/15 bg-[#2557a7]/5 px-4 py-3">
                        <p className="text-xs font-semibold text-[#2557a7] mb-1.5">&ldquo;{fq.q}&rdquo;</p>
                        <p className="text-xs text-gray-600">💡 {fq.hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Accordion>
          ))}
        </div>
      )}

      {/* ── Tab: HR Answers ── */}
      {activeTab === "hr" && (
        <div className="space-y-3">
          {/* Fresher / Experienced toggle */}
          <div className="flex items-center gap-3 mb-1 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <span className="text-xs font-bold text-gray-500 mr-1">I am a:</span>
            {(["fresher", "experienced"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setExperienceLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  experienceLevel === lvl
                    ? "bg-[#2557a7] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lvl === "fresher" ? "Fresher / New Graduate" : "Experienced Professional"}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-auto tabular-nums">
              {notes.hr_answers.filter((qa) => qa.experience_level === experienceLevel || qa.experience_level === "both").length} questions
            </span>
          </div>

          {notes.hr_answers
            .filter((qa) => qa.experience_level === experienceLevel || qa.experience_level === "both")
            .map((qa, i) => (
            <Accordion key={qa.question_id} title={qa.question_text} defaultOpen={i === 0}>
              <div className="text-xs text-gray-600 flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                <div className="w-5 h-5 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={10} className="text-[#2557a7]" />
                </div>
                <span><strong className="text-gray-700">Why asked:</strong> {qa.why_asked}</span>
              </div>
              <EditableBlock label="Your Answer Script" value={qa.answer_script} onChange={(v) => updateHR(qa.question_id, v)} rows={6} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl">
                  <p className="text-[10px] font-bold text-[#2557a7] uppercase tracking-widest mb-1.5">Practice Tip</p>
                  <p className="text-xs text-gray-700">{qa.practice_tip}</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Common Mistake</p>
                  <p className="text-xs text-gray-700">{qa.common_mistake}</p>
                </div>
              </div>
            </Accordion>
          ))}
        </div>
      )}

      {/* ── Tab: Additional Notes ── */}
      {activeTab === "additional" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">

          {/* Hobbies */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Hobbies & Interests</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "Reading tech blogs", "Chess", "Coding side projects", "Music",
                "Sports", "Photography", "Gaming", "Cooking", "Travelling", "Volunteering",
              ].map((hobby) => {
                const checked = notes.additional_notes.hobbies.includes(hobby);
                return (
                  <button
                    key={hobby}
                    type="button"
                    onClick={() => toggleHobby(hobby)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      checked
                        ? "bg-[#2557a7] text-white border-[#2557a7] shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#2557a7]/40 hover:text-[#2557a7]"
                    }`}
                  >
                    {checked && <Check size={10} />}
                    {hobby}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Add a custom hobby…"
              value={notes.additional_notes.hobbies_custom}
              onChange={(e) => updateAdditional("hobbies_custom", e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2557a7]/30 focus:border-[#2557a7] transition-all"
            />
            <p className="text-xs text-gray-400 mt-2">💡 Only select hobbies you can talk about confidently for 30+ seconds.</p>
          </div>

          {/* Career goals, why field, teamwork */}
          {[
            { key: "career_goals_short" as const, label: "Short-term Career Goals", note: "1–2 year goal. Should align with the role you're applying for." },
            { key: "career_goals_long" as const, label: "Long-term Career Goals", note: "5-year vision. Realistic and ambitious — shows growth mindset." },
            { key: "why_this_field" as const, label: "Why This Field", note: "Genuine reason only. Interviewers spot fake answers quickly." },
            { key: "teamwork_example" as const, label: "Teamwork Example", note: "Use STAR format: Situation → Task → Action → Result." },
          ].map(({ key, label, note }) => (
            <div key={key} className="border border-gray-100 rounded-xl p-4">
              <EditableBlock label={label} value={notes.additional_notes[key] as string} onChange={(v) => updateAdditional(key, v)} rows={3} />
              <p className="text-xs text-gray-400 mt-2">💡 {note}</p>
            </div>
          ))}

          {/* Handling Gaps */}
          <div className="border border-[#2557a7]/20 bg-[#2557a7]/5 rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#2557a7] uppercase tracking-widest mb-1.5">Handling Employment / Education Gaps</p>
            <p className="text-xs text-gray-600 mb-3">Only fill this if you have a gap. Interviewers may ask about it directly.</p>
            <EditableBlock
              value={notes.additional_notes.handling_gaps}
              onChange={(v) => updateAdditional("handling_gaps", v)}
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-2">💡 Be honest and brief. Always end with something positive you did during the gap.</p>
          </div>

          {/* Learning Attitude */}
          <div className="border border-gray-200 bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Learning Attitude & Self-Development</p>
            <p className="text-xs text-gray-600 mb-3">Interviewers ask: &ldquo;How do you stay updated?&rdquo; or &ldquo;What was the last thing you learned?&rdquo;</p>
            <EditableBlock
              value={notes.additional_notes.learning_attitude}
              onChange={(v) => updateAdditional("learning_attitude", v)}
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-2">💡 Mention a specific resource, course, or recent thing you learned. Makes the answer credible.</p>
          </div>
        </div>
      )}

      {/* Save & Continue */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleSaveAndContinue}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#2557a7] text-white rounded-xl text-sm font-bold hover:bg-[#1e4a8f] transition-all shadow-md shadow-[#2557a7]/20 hover:shadow-lg hover:shadow-[#2557a7]/25 disabled:opacity-70"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving…</>
          ) : (
            <>Save & Continue <ArrowRight size={15} /></>
          )}
        </button>
      </div>
    </div>
  );
}
