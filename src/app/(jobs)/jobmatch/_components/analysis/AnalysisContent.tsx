"use client";

import React from "react";
import styles from "./AnalysisContent.module.css";
import ResumePreview from "../resume/ResumePreview";
import { AnalysisContentProps } from "../_types";
import {
  Pencil, User, Briefcase, GraduationCap,
  Star, Award, ArrowLeft, ChevronRight, BookOpen, Trophy,
  Heart, Building2, Plus, Globe, AlignLeft, Users, X,
  Copy, Info, Download, Loader2, CheckCircle2, Sparkles, Minus, Maximize,
} from "lucide-react";
import JobMatchSectionEditor from "../resume/JobMatchSectionEditor";
import JDHighlighter from "../highlighter/JDHighlighter";
import { matcherEnhanceApply, matcherEnhanceRemove, matcherUpdateSections, downloadResumePdf } from "@/api/parserApi";
import { toast } from "sonner";
import ScoreBreakdown from "./ScoreBreakdown";
import KeywordAnalysis from "./KeywordAnalysis";
import MatchPenalties, { getFixImpactCounts, type ApplyFixResult } from "./MatchPenalties";
import {
  addBullet, addCertification, removeBullet, removeCertification, shiftHighlightsAfterRemoval,
} from "../_lib/utils/fixMirror";

const ANALYSIS_DRAFT_KEY = "jm_analysisDraft";

// Match-score band shown in the RIGHT column's header card (donut + label +
// blurb) — same "how good is this score" judgment ScoreBreakdown's per-row
// scoreColor makes, just with a headline label attached.
function matchBand(score: number): { label: string; color: string; description: string } {
  if (score >= 85) {
    return { label: "Excellent Match", color: "#16A34A", description: "Your resume is a strong match for this position." };
  }
  if (score >= 70) {
    return { label: "Good Match", color: "#16A34A", description: "Your resume aligns well with the job requirements. A few improvements can make you a stronger candidate." };
  }
  if (score >= 50) {
    return { label: "Fair Match", color: "#EAB308", description: "Your resume partially matches this role — review the suggestions below to close the gap." };
  }
  return { label: "Needs Improvement", color: "#DC2626", description: "Your resume needs several updates to better match this role." };
}

// Contact fields (email/phone/location) can only be written back onto a
// parser-sourced resume through the suggestion-apply endpoint — matcherEnhanceApply
// resolves `suggest_add_contact_{field}` server-side (job_matcher.py's
// _resolve_contact_fix) and writes straight to the resume the download reads.
// PATCH /resumes/{id} (the Resume Builder's own update route) looks like the
// obvious choice but hard-rejects any resume with source: "ai_parse" — every
// resume that reaches JobMatch — so that path 404s even though the resume is
// real. This only resolves a field while there's still a pending
// "suggest_add_contact_<field>" suggestion for it (i.e. it was detected
// missing); there's no backend path yet to edit an already-present field.
const CONTACT_SUGGESTION_PREFIX = "suggest_add_contact_";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pendingContactSuggestions(matchResult: any): Record<string, string> {
  const penalties = matchResult?.Match_Penalties?.penalties ?? [];
  const byField: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of penalties as any[]) {
    const sid = p?.suggestion_id;
    if (typeof sid === "string" && sid.startsWith(CONTACT_SUGGESTION_PREFIX)) {
      byField[sid.slice(CONTACT_SUGGESTION_PREFIX.length)] = sid;
    }
  }
  return byField;
}

interface AnalysisDraft {
  matchId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resumeSections: Record<string, any>;
  activeSectionIds: string[];
  deletedSectionIds: string[];
  customSections: { id: string; label: string }[];
  addedSkillFields: string[];
  highlightFields: Record<string, string[]>;
  liveScore: number;
  appliedSuggestionIds: string[];
  // Which of appliedSuggestionIds were applied via a BULK parent. The backend
  // only recorded the parent's suggestion_id, so undoing one of these by its
  // own child id 404s. Without persisting this, a restored draft made every
  // child look individually applied and re-enabled an Undo that always failed.
  bulkAppliedSuggestionIds: string[];
}

/**
 * Patches the stored draft's applied-suggestion bookkeeping directly.
 *
 * The draft is normally written by a mounted effect, but an apply/undo request
 * can still be in flight when the user hits Back: the component unmounts, the
 * request commits server-side, and its setState calls are no-ops, so the draft
 * never learns about it. Returning to Analysis would then restore state that
 * disagrees with the server -- an applied fix shown as pending, or an undone
 * one stuck on "Added".
 *
 * Writing through to sessionStorage here works because this runs from a
 * closure that survives unmount, unlike React state.
 */
function patchAnalysisDraftApplied(
  matchId: string | undefined,
  suggestionId: string,
  applied: boolean,
): void {
  try {
    if (!matchId) return;
    const raw = sessionStorage.getItem(ANALYSIS_DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw) as AnalysisDraft;
    if (draft.matchId !== matchId) return;

    const ids = new Set(draft.appliedSuggestionIds ?? []);
    const bulk = new Set(draft.bulkAppliedSuggestionIds ?? []);
    if (applied) {
      ids.add(suggestionId);
    } else {
      ids.delete(suggestionId);
      bulk.delete(suggestionId);
    }
    draft.appliedSuggestionIds = Array.from(ids);
    draft.bulkAppliedSuggestionIds = Array.from(bulk);
    sessionStorage.setItem(ANALYSIS_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function readAnalysisDraft(matchId?: string): AnalysisDraft | null {
  try {
    if (!matchId) return null;
    const raw = sessionStorage.getItem(ANALYSIS_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as AnalysisDraft;
    return draft.matchId === matchId ? draft : null;
  } catch {
    return null;
  }
}

// All possible predefined sections
const ALL_SECTIONS = [
  { id: "contact",          label: "Personal Info",         icon: User,         hasAI: false },
  { id: "summary",          label: "Professional Summary",  icon: Briefcase,    hasAI: true  },
  { id: "education",        label: "Education",             icon: GraduationCap,hasAI: false },
  { id: "skills",           label: "Skills",                icon: Star,         hasAI: false },
  { id: "softSkills",       label: "Soft Skills",           icon: Heart,        hasAI: false },
  { id: "experience",       label: "Work Experience",       icon: Briefcase,    hasAI: true  },
  { id: "internships",      label: "Internships",           icon: Building2,    hasAI: true  },
  { id: "projects",         label: "Projects",              icon: Award,        hasAI: true  },
  { id: "certifications",   label: "Certifications",        icon: BookOpen,     hasAI: false },
  { id: "achievements",     label: "Achievements",          icon: Trophy,       hasAI: false },
  { id: "languages",        label: "Languages",             icon: Globe,        hasAI: false },
  { id: "hobbies",          label: "Hobbies",               icon: AlignLeft,    hasAI: true  },
  { id: "references",       label: "References",            icon: Users,        hasAI: false },
];

// Best-effort local mirror of a bullet-text rewrite the backend just applied
// to the resume document (job title / summary already overwrite one known
// field, but a bullet rewrite can live inside experience/internships/projects
// under several different field names depending on the source template).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceInValue(val: any, before: string, after: string): any {
  if (typeof val === "string") {
    return val.includes(before) ? val.split(before).join(after) : val;
  }
  if (Array.isArray(val)) {
    return val.map((v) => replaceInValue(v, before, after));
  }
  if (val && typeof val === "object") {
    const out = { ...val };
    for (const key of ["description", "details", "responsibilities", "achievements", "text", "value", "bullet"]) {
      if (key in out) out[key] = replaceInValue(out[key], before, after);
    }
    return out;
  }
  return val;
}

// Read-only counterpart to replaceInValue/replaceBulletText below — finds which
// (section, idx) items still contain a not-yet-applied suggestion's "before"
// text, so the preview can red-highlight them. Mirrors the same field-name
// list so an item stops matching (and the red highlight clears) the instant
// replaceBulletText actually rewrites it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function containsInValue(val: any, needle: string): boolean {
  if (typeof val === "string") return val.includes(needle);
  if (Array.isArray(val)) return val.some((v) => containsInValue(v, needle));
  if (val && typeof val === "object") {
    return ["description", "details", "responsibilities", "achievements", "text", "value", "bullet"]
      .some((key) => key in val && containsInValue(val[key], needle));
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findPendingBulletItems(sections: Record<string, any>, needle: string): { section: string; idx: number }[] {
  const hits: { section: string; idx: number }[] = [];
  for (const key of ["experience", "internships", "projects"]) {
    const arr = sections[key];
    if (!Array.isArray(arr)) continue;
    arr.forEach((item: unknown, idx: number) => {
      if (containsInValue(item, needle)) hits.push({ section: key, idx });
    });
  }
  return hits;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function replaceBulletText(
  sections: Record<string, any>,
  before: string,
  after: string
): { sections: Record<string, any>; changed: { section: string; idx: number }[] } {
/* eslint-enable @typescript-eslint/no-explicit-any */
  const next = { ...sections };
  const changed: { section: string; idx: number }[] = [];
  for (const key of ["experience", "internships", "projects"]) {
    if (Array.isArray(next[key])) {
      next[key] = next[key].map((item: unknown, idx: number) => {
        const updated = replaceInValue(item, before, after);
        if (JSON.stringify(updated) !== JSON.stringify(item)) changed.push({ section: key, idx });
        return updated;
      });
    }
  }
  return { sections: next, changed };
}

// The AI leaves an unfilled metric as a literal standalone "n" in both the
// before/after suggestion text (e.g. "...with n+ successful integrations")
// rather than invent a number. When the backend reports the blank (via
// details.text) and the user supplies its value, substitute it ONLY at the
// specific "n<suffix>" token the backend described (e.g. "n+", "n%", "n-tier")
// — not every standalone "n" in the text — since one bullet can carry more
// than one such placeholder with unrelated meanings, e.g. "Built n-tier
// architecture serving n+ users" has two independent blanks. A blanket
// replace-all would stamp the same number into both.
function fillManualBlank(
  rawAfter: string | undefined,
  blankText: string | undefined,
  manualValue: string
): string | undefined {
  if (!rawAfter) return rawAfter;
  // Case-insensitive: a blank reported as "N+" would otherwise yield an empty
  // suffix and fall through to the unanchored /\bn\b/ this function exists to
  // avoid.
  const suffixMatch = blankText?.match(/\bn([+%-]?)/i);
  const suffix = suffixMatch?.[1] ?? "";
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  // No /g flag — replaces only the first (and, per the above, only intended) match.
  const pattern = suffix ? new RegExp(String.raw`\bn${escapedSuffix}`, "i") : /\bn\b/i;
  return pattern.test(rawAfter) ? rawAfter.replace(pattern, manualValue + suffix) : rawAfter;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasData(val: any): boolean {
  if (!val) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return true;
}

// Detect which sections exist in parsed resume data - supports all field name variations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectActiveSections(parsed: any): string[] {
  if (!parsed) return ["contact", "summary"];

  // Unwrap nested structure like { parsed_data: { ... } }
  const d = parsed?.parsed_data || parsed;
  const llm = d?.llm_data || {};

  const active: string[] = [];

  // contact / personal info
  if (hasData(d.contact) || hasData(d.personalInfo) || hasData(llm.contact) || hasData(llm.personal_info))
    active.push("contact");

  // professional summary
  if (hasData(d.professionalSummary) || hasData(d.professional_summary) || hasData(d.career_objective) ||
      hasData(d.objective) || hasData(d.summary) || hasData(llm.professionalSummary) || hasData(llm.summary))
    active.push("summary");

  // education
  if (hasData(d.education) || hasData(d.educational_qualifications) || hasData(llm.education))
    active.push("education");

  // skills
  if (hasData(d.skills) || hasData(d.technical_skills) || hasData(llm.skills) || hasData(llm.technical_skills))
    active.push("skills");

  // soft skills
  if (hasData(d.soft_skills) || hasData(d.softSkills) || hasData(llm.soft_skills))
    active.push("softSkills");

  // work experience
  if (hasData(d.workExperience) || hasData(d.work_experience) || hasData(d.experience) ||
      hasData(d.professional_experience) || hasData(llm.workExperience) || hasData(llm.work_experience))
    active.push("experience");

  // internships
  if (hasData(d.internships) || hasData(d.internship) || hasData(llm.internships) || hasData(llm.internship))
    active.push("internships");

  // projects
  if (hasData(d.projects) || hasData(d.project_details) || hasData(llm.projects))
    active.push("projects");

  // certifications
  if (hasData(d.certifications) || hasData(d.certification) || hasData(d.certificates) || hasData(llm.certifications) || hasData(llm.certification))
    active.push("certifications");

  // achievements
  if (hasData(d.achievements) || hasData(d.accomplishments) || hasData(llm.achievements))
    active.push("achievements");

  // languages
  if (hasData(d.languages) || hasData(llm.languages))
    active.push("languages");

  // hobbies
  if (hasData(d.hobbies) || hasData(d.interests) || hasData(llm.hobbies))
    active.push("hobbies");

  // references
  if (hasData(d.references) || hasData(llm.references))
    active.push("references");

  return active.length ? active : ["contact", "summary"];
}

// `text` on the needs_value error payload may arrive as an array of blanks or
// as a bare string — indexing [0] on a string yields its first character,
// which would make fillManualBlank fall back to the unanchored /\bn\b/ form
// it exists to avoid. Normalise both shapes.
function normalizeBlankText(rawBlank: unknown): string | undefined {
  if (Array.isArray(rawBlank)) return rawBlank[0];
  if (typeof rawBlank === "string") return rawBlank;
  return undefined;
}

// Shared by applyTextFix/removeTextFix/directAddSkill/directRemoveSkill's
// score-diff parsing: the backend reports the post-fix ATS score under one of
// a couple of shapes depending on the endpoint, as a number or (occasionally)
// a numeric string. Clamped the same way every call site already clamped it.
function applyClampedScore(newScore: unknown, setLiveScore: (score: number) => void): void {
  if (typeof newScore === "number") {
    setLiveScore(Math.min(100, Math.max(0, newScore)));
  } else if (typeof newScore === "string") {
    const n = Number.parseFloat(newScore);
    if (!Number.isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
  }
}

type ApplyFixAttempt =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: true; res: any; manualValue?: string; blankText?: string }
  | { ok: false };

// Extracted from applyTextFix: runs matcherEnhanceApply and, if the backend
// refuses with "needs_value" (an unfilled metric blank, e.g. "...deployment
// of n+ features"), prompts the user for the number via askForNumber and
// retries once. Behavior (including every toast) is unchanged from the
// original inline try/catch — only pulled out to cut applyTextFix's
// cognitive complexity.
async function attemptEnhanceApply(
  matchId: string,
  suggestion_id: string,
  runSerially: <T,>(fn: () => Promise<T>) => Promise<T>,
  askForNumber: (blankText?: string) => Promise<string | null>
): Promise<ApplyFixAttempt> {
  try {
    const res = await runSerially(() => matcherEnhanceApply(matchId, suggestion_id));
    return { ok: true, res };
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Backend error envelope nests the real code at error.details.error
    // (same shape as the premium-consent 428 flow) — err.response.data.error
    // is the whole { message, error_code, details, ... } object, not a
    // string, so comparing it directly to "needs_value" never matched and
    // this prompt silently never fired. Falls back to the flat shape too,
    // in case a different status/shape is used here.
    const errPayload = err?.response?.data;
    const errCode = errPayload?.error?.details?.error ?? errPayload?.error;
    const isNeedsValue =
      (err?.response?.status === 409 || err?.response?.status === 422) &&
      errCode === "needs_value";
    if (!isNeedsValue) {
      const isRateLimited = err?.response?.status === 429;
      toast.error(
        isRateLimited
          ? "Applying fixes too fast — wait a few seconds and try this one again."
          : "Couldn't apply this fix. Please try again."
      );
      return { ok: false };
    }
    const rawBlank = errPayload?.error?.details?.text ?? errPayload?.text;
    const blankText = normalizeBlankText(rawBlank);
    const answer = await askForNumber(blankText);
    const numeric = answer?.trim().replaceAll(",", "");
    if (!numeric || !/^\d+(\.\d+)?$/.test(numeric)) {
      if (answer !== null) toast.error("Please enter a plain number, e.g. 20.");
      return { ok: false };
    }
    try {
      const res = await runSerially(() => matcherEnhanceApply(matchId, suggestion_id, "manual", numeric));
      return { ok: true, res, manualValue: numeric, blankText };
    } catch {
      toast.error("Couldn't apply this fix. Please try again.");
      return { ok: false };
    }
  }
}

// Extracted from the pendingFields useMemo below: given one Match_Penalties
// entry (already known not to be a skill category), returns the
// {section, field} pairs that should still be red-highlighted as pending —
// or [] if that entry's fix is already reflected in highlightFields /
// resumeSections. Same conditions and order as the original inline branches.
function pendingFieldsForPenalty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: any,
  highlightFields: Record<string, string[]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resumeSections: Record<string, any>
): { section: string; field: string }[] {
  if (p.category === "job_title") {
    return (highlightFields.contact ?? []).includes("title") ? [] : [{ section: "contact", field: "title" }];
  }
  if (p.category === "summary") {
    return (highlightFields.summary ?? []).includes("text") ? [] : [{ section: "summary", field: "text" }];
  }
  const before = p.before_example;
  const after = p.after_example;
  if (before && after && before !== after) {
    return findPendingBulletItems(resumeSections, before).map((hit) => ({ section: hit.section, field: String(hit.idx) }));
  }
  return [];
}

export default function AnalysisContent({
  jdText,
  matchResults,
  parsedResumeData,
  onBackToUpload,
}: AnalysisContentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveMatchResults] = React.useState<any>(matchResults);

  const matchId: string | undefined =
    liveMatchResults?.data?.id ??
    liveMatchResults?.data?._id ??
    liveMatchResults?.data?.match_id ??
    liveMatchResults?.match_id;
  const restoredDraft = React.useMemo(() => readAnalysisDraft(matchId), [matchId]);

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  // Value itself isn't read anywhere now (it used to gate the removed
  // download button's disabled/label state) — only the setter is still
  // needed, to serialize concurrent section-save requests below.
  const [isSavingSection, setIsSavingSection] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const fixesRef = React.useRef<HTMLElement>(null);

  // Resume / Job Description tab (merged preview panel) — see the toolbar
  // below.
  const [previewTab, setPreviewTab] = React.useState<"resume" | "jd">("resume");
  const [zoomPct, setZoomPct] = React.useState(100);
  const [compareDocuments, setCompareDocuments] = React.useState(false);
  const [jdZoomPct, setJdZoomPct] = React.useState(100);
  const documentViewerRef = React.useRef<HTMLDivElement>(null);

  // RIGHT column's tab bar — Analysis Sections (the read-only score
  // breakdown) plus one tab per impact tier, each showing the SAME
  // actionable-fixes list (MatchPenalties) pre-filtered to that severity via
  // its `impactFilter` prop. Replaces the old separate "Recommendations" tab
  // (which had its own internal All/High/Medium/Low sub-tabs — a confusing
  // tab-bar-inside-a-tab-bar) and the "Match Details"/"Keywords" placeholders,
  // which never had real content behind them.
  const [rightTab, setRightTab] = React.useState<"sections" | "keywords" | "all" | "high" | "medium" | "low">("sections");


  // Every matcherEnhanceApply call (skills, bullet/text fixes, contact fields)
  // reads the resume's whole parsed_data, edits one thing, and writes the whole
  // blob back — see set_resume_contact_field / replace_resume_text on the
  // backend. That's only safe one request at a time; the UI lets a user click
  // "Add skill"/"Apply fix" on several different suggestions in quick
  // succession, and each row's own loading state doesn't know about the
  // others, so nothing stops those requests firing concurrently and racing —
  // whichever write lands last silently overwrites the others' edits (or, if
  // the burst is large enough, trips the AI rate limit and shows as "Couldn't
  // apply this fix"). Routing every call through this queue forces them to
  // run one at a time regardless of how fast the user clicks.
  const applyQueueRef = React.useRef<Promise<unknown>>(Promise.resolve());
  const runSerially = React.useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = applyQueueRef.current.then(fn, fn);
    applyQueueRef.current = run.then(() => undefined, () => undefined);
    return run;
  }, []);

  // Fill-in-the-blank prompt for a fix whose suggested text still has an
  // unfilled metric ("...by n%"). Deliberately NOT window.prompt() — native
  // dialogs are commonly blocked or silently no-op in embedded/sandboxed
  // preview contexts, which would make this fail with zero feedback (exactly
  // what "apply all fixes" looked like before: no error, just never applies).
  const [numberPromptState, setNumberPromptState] = React.useState<{ blankText?: string; resolve: (v: string | null) => void } | null>(null);
  // Kept in sync with numberPromptState so the unmount cleanup below can
  // resolve whatever prompt is current, not whatever was current when that
  // effect first ran. Synced in an effect, not the render body: a render that
  // React discards (concurrent rendering, StrictMode double-invoke) must not
  // advance the ref, and only the unmount cleanup reads it — so commit-time
  // is soon enough. Same convention as resumeSectionsRef below.
  const numberPromptStateRef = React.useRef(numberPromptState);
  React.useEffect(() => { numberPromptStateRef.current = numberPromptState; }, [numberPromptState]);

  const askForNumber = React.useCallback((blankText?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setNumberPromptState((prev) => {
        // Only one prompt slot exists. Two suggestions that both come back
        // needs_value (e.g. Apply clicked on two STAR bullets in quick
        // succession — runSerially only serializes the network calls, not
        // this prompt) would otherwise have the second call's state replace
        // the first's, orphaning its resolve — that row's applyTextFix
        // promise never settles and its "Apply fix" spinner never clears.
        // Resolve the outgoing prompt with null (as if cancelled) first.
        prev?.resolve(null);
        return { blankText, resolve };
      });
    });
  }, []);

  // Same leak if the user navigates away (unmounts this component) with the
  // prompt still open — nothing would ever call its resolve otherwise.
  React.useEffect(() => {
    return () => {
      numberPromptStateRef.current?.resolve(null);
    };
  }, []);

  // Track which skills were added (for green highlight in resume template)
  const [addedSkillFields, setAddedSkillFields] = React.useState<string[]>(() => restoredDraft?.addedSkillFields ?? []);

  // suggestion_ids applied via MatchPenalties' "Apply fix"/"Add skill" buttons
  // (skills AND non-skill text fixes) — persisted so those cards still show
  // "Added" instead of resetting to "Apply fix" after navigating away and back.
  const [appliedSuggestionIds, setAppliedSuggestionIds] = React.useState<string[]>(() => restoredDraft?.appliedSuggestionIds ?? []);
  const [bulkAppliedSuggestionIds, setBulkAppliedSuggestionIds] = React.useState<string[]>(() => restoredDraft?.bulkAppliedSuggestionIds ?? []);
  const handleBulkApplied = React.useCallback((suggestionIds: string[]) => {
    setBulkAppliedSuggestionIds((prev) => {
      const next = new Set(prev);
      suggestionIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }, []);
  const handleSuggestionApplied = React.useCallback((suggestionId: string, applied: boolean) => {
    // Write through to the stored draft as well as React state: this callback
    // still runs if the request completes after the user navigated away, when
    // setState no longer does anything.
    patchAnalysisDraftApplied(matchId, suggestionId, applied);
    if (!applied) setBulkAppliedSuggestionIds((prev) => prev.filter((id) => id !== suggestionId));
    setAppliedSuggestionIds((prev) => {
      if (!applied) return prev.filter((id) => id !== suggestionId);
      return prev.includes(suggestionId) ? prev : [...prev, suggestionId];
    });
  }, [matchId]);

  // Track which other fields (job title, summary, individual experience/
  // internship/project bullets) were just changed by an applied fix — same
  // green-highlight mechanism JobMatchTemplateThree already uses for skills
  // (hl()/hlIdx() read this via the addedFields prop), just populated for
  // more than skills now that non-skill fixes are applyable too.
  const [highlightFields, setHighlightFields] = React.useState<Record<string, string[]>>(() => restoredDraft?.highlightFields ?? {});
  const markHighlighted = React.useCallback((section: string, field: string) => {
    setHighlightFields((prev) => {
      const existing = prev[section] ?? [];
      if (existing.includes(field)) return prev;
      return { ...prev, [section]: [...existing, field] };
    });
  }, []);
  const unmarkHighlighted = React.useCallback((section: string, field: string) => {
    setHighlightFields((prev) => {
      const existing = prev[section] ?? [];
      if (!existing.includes(field)) return prev;
      const next = existing.filter((f) => f !== field);
      if (next.length === 0) {
        const rest = { ...prev };
        delete rest[section];
        return rest;
      }
      return { ...prev, [section]: next };
    });
  }, []);

  // Active section IDs (from parsed data + user-added)
  const [activeSectionIds, setActiveSectionIds] = React.useState<string[]>(
    () => restoredDraft?.activeSectionIds ?? detectActiveSections(parsedResumeData)
  );

  const [deletedSectionIds, setDeletedSectionIds] = React.useState<string[]>(() => restoredDraft?.deletedSectionIds ?? []);

  // Custom sections added by user
  const [customSections, setCustomSections] = React.useState<{ id: string; label: string }[]>(() => restoredDraft?.customSections ?? []);
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customName, setCustomName] = React.useState("");

  // Resume section data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeSections, setResumeSections] = React.useState<Record<string, any>>(() => {
    if (restoredDraft?.resumeSections) return restoredDraft.resumeSections;
    const d = parsedResumeData?.parsed_data || parsedResumeData || {};
    const llm = d?.llm_data || {};
    return {
      contact:        d.contact ?? d.personalInfo ?? llm.contact ?? llm.personal_info ?? {},
      summary:        d.professionalSummary ?? d.professional_summary ?? d.summary ?? d.career_objective ?? llm.professionalSummary ?? llm.summary ?? "",
      education:      d.education ?? d.educational_qualifications ?? llm.education ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills:         (d.skills ?? d.technical_skills ?? llm.skills ?? llm.technical_skills ?? []).map((s: any) => typeof s === "string" ? s : (s?.skill ?? s?.name ?? "")).filter(Boolean),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      softSkills:     (d.soft_skills ?? d.softSkills ?? llm.soft_skills ?? []).map((s: any) => typeof s === "string" ? s : (s?.skill ?? s?.name ?? "")).filter(Boolean),
      experience:     d.workExperience ?? d.work_experience ?? d.experience ?? llm.workExperience ?? llm.work_experience ?? [],
      internships:    d.internships ?? d.internship ?? llm.internships ?? llm.internship ?? [],
      projects:       d.projects ?? d.project_details ?? llm.projects ?? [],
      certifications: d.certifications ?? d.certification ?? d.certificates ?? llm.certifications ?? llm.certification ?? [],
      achievements:   d.achievements ?? d.accomplishments ?? llm.achievements ?? [],
      languages:      d.languages ?? llm.languages ?? [],
      hobbies:        d.hobbies ?? d.interests ?? llm.hobbies ?? [],
      references:     d.references ?? llm.references ?? [],
    };
  });

  // Mirrors resumeSections synchronously, for applyTextFix below — a plain
  // React ref, not the state closure, because applyTextFix's useCallback
  // deps deliberately exclude resumeSections (to avoid recreating the
  // callback on every resume edit), and because a setResumeSections updater
  // is not guaranteed to run before the async function that queued it
  // returns (see applyTextFix's use). Kept in sync generally via the effect
  // below, AND updated directly by applyTextFix itself at write time so two
  // concurrent "Apply fix" clicks each see the other's write immediately
  // rather than racing on a stale snapshot.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumeSectionsRef = React.useRef<Record<string, any>>(resumeSections);
  // suggestion_id -> the bullet text apply actually wrote into the preview,
  // so undo can find it again even when a manual value filled a metric blank.
  const appliedTextRef = React.useRef<Record<string, string>>({});
  React.useEffect(() => { resumeSectionsRef.current = resumeSections; }, [resumeSections]);

  const resumeId: string | undefined =
    liveMatchResults?.data?.resume_id ??
    liveMatchResults?.resume_id ??
    parsedResumeData?.resume_id ??
    parsedResumeData?.parsed_data?.resume_id ??
    parsedResumeData?.data?.resume_id;

  const matchResult = liveMatchResults?.data?.match_result ?? {};
  // Same old/new key fallback as ScoreBreakdown.tsx — see the comment there
  // (careerbot-api app/shared/contracts/matcher_keys.py: these two blocks are
  // not mirrored across the rename the way the score is).
  const techSkills   = matchResult?.Technical_Skills_Check ?? matchResult?.Technical_Skills ?? {};
  const softSkills   = matchResult?.Soft_Skills_Check ?? matchResult?.Soft_Skills ?? {};
  const capSkills    = matchResult?.Capabilities_Check ?? {};
  const certSkills   = matchResult?.Certifications_Check ?? {};
  const jobTitle     = matchResult?.Job_Title_Check ?? {};
  const starCheck    = matchResult?.STAR_Pattern_Check ?? {};

  // Live ATS score — updates when skills are added/removed
  const initialScore = Math.min(100, Math.max(0, Number.parseFloat(String(liveMatchResults?.data?.ats_score || "0"))));
  const [liveScore, setLiveScore] = React.useState<number>(() => restoredDraft?.liveScore ?? initialScore);

  React.useEffect(() => {
    try {
      if (!matchId) return;
      const draft: AnalysisDraft = {
        matchId,
        resumeSections,
        activeSectionIds,
        deletedSectionIds,
        customSections,
        addedSkillFields,
        highlightFields,
        liveScore,
        appliedSuggestionIds,
        bulkAppliedSuggestionIds,
      };
      sessionStorage.setItem(ANALYSIS_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [matchId, resumeSections, activeSectionIds, deletedSectionIds, customSections, addedSkillFields, highlightFields, liveScore, appliedSuggestionIds, bulkAppliedSuggestionIds]);

  // Resolve a suggestion_id for a skill name from Match_Penalties — needed
  // when a skill is added/removed from a source that doesn't already carry
  // one (e.g. clicking a missing skill highlighted directly in the JD text).
  const findSkillSuggestionId = React.useCallback((skillName: string): string | undefined => {
    const target = skillName.trim().toLowerCase();
    const penalties = matchResult?.Match_Penalties?.penalties ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const penalty = penalties.find((p: any) =>
      (p.category === "technical_skills" || p.category === "soft_skills") &&
      p.target?.trim().toLowerCase() === target
    );
    return penalty?.suggestion_id;
  }, [matchResult]);

  // Add a skill: enhance/apply updates the match score AND persists the skill
  // into the resume document server-side (see job_matcher.py enhance/apply —
  // it writes added skills via repository.update_resume_with_skill), so a
  // separate parser-side persistence call isn't needed here.
  const directAddSkill = React.useCallback(async (skill: string, suggestion_id?: string): Promise<boolean> => {
    const s = skill.trim();
    if (!s) return false;
    // Optimistic local update
    setAddedSkillFields((prev) => prev.includes(s) ? prev : [...prev, s]);
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      if (existing.includes(s)) return prev;
      return { ...prev, skills: [...existing, s] };
    });
    // Update match score (and persist to resume doc) in the backend
    const resolvedSuggestionId = suggestion_id ?? findSkillSuggestionId(s);
    // No suggestion id means there is no server-side route to persist this
    // skill (enhance/apply resolves the skill FROM the suggestion), so nothing
    // reaches the resume document. Roll the optimistic update back and report
    // failure rather than returning true — the contract is "was it actually
    // persisted", and a false success here leaves the chip green while the
    // downloaded resume silently lacks the skill. Reachable from
    // JDHighlighter's missing-skill chips, which call in with no id and whose
    // wording isn't guaranteed to match a penalty target exactly.
    if (!matchId || !resolvedSuggestionId) {
      setAddedSkillFields((prev) => prev.filter((item) => item !== s));
      setResumeSections((prev: Record<string, unknown>) => {
        const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
        return { ...prev, skills: existing.filter((item) => item !== s) };
      });
      return false;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await runSerially(() => matcherEnhanceApply(matchId, resolvedSuggestionId)) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = Number.parseFloat(newScore);
        if (!Number.isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
      }
      return true;
    } catch {
      setAddedSkillFields((prev) => prev.filter((item) => item !== s));
      setResumeSections((prev: Record<string, unknown>) => {
        const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
        return { ...prev, skills: existing.filter((item) => item !== s) };
      });
      return false;
    }
  }, [matchId, findSkillSuggestionId, runSerially]);

  // ScoreBreakdown's own "+pts / Add" chip controls (Hard/Soft Skills in the
  // Suggestion card) call this instead of directAddSkill directly.
  // MatchPenalties' identical-looking buttons call onSuggestionApplied
  // themselves from inside its own handleAdd — directAddSkill alone never
  // touches appliedSuggestionIds, so without this wrapper a skill added from
  // a ScoreBreakdown chip would never flip that chip to "Added" (it reads
  // appliedSuggestionIds), and MatchPenalties' matching row would stay stuck
  // on "Add skill" too until the page was left and reopened.
  const addSkillFromSuggestionChip = React.useCallback(async (skill: string, suggestion_id?: string): Promise<boolean> => {
    const resolvedId = suggestion_id ?? findSkillSuggestionId(skill.trim());
    const ok = await directAddSkill(skill, suggestion_id);
    if (ok && resolvedId) handleSuggestionApplied(resolvedId, true);
    return ok;
  }, [directAddSkill, findSkillSuggestionId, handleSuggestionApplied]);

  // Apply a non-skill fix (job title / summary / bullet rewrite) — these are
  // resolved entirely server-side from suggestion_id, so unlike skills there's
  // no separate "target" to persist; we just mirror the resulting text change
  // locally so the live preview matches what the backend wrote to the resume.
  const applyTextFix = React.useCallback(async (suggestion_id: string, category: string): Promise<ApplyFixResult> => {
    if (!matchId || !suggestion_id) return false;
    // Set below when the needs_value flow prompted the user for a number —
    // used to patch the cached suggestion text before mirroring it into the
    // preview (see the comment near its use further down).
    const attempt = await attemptEnhanceApply(matchId, suggestion_id, runSerially, askForNumber);
    if (!attempt.ok) return false;
    const { res, manualValue, blankText } = attempt;

    const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
    applyClampedScore(newScore, setLiveScore);

    if (res?.applied === false) {
      toast.info(res?.message || "Nothing to update for this suggestion yet.");
      return false;
    }

    const penalties = matchResult?.Match_Penalties?.penalties ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const penalty = penalties.find((p: any) => p.suggestion_id === suggestion_id);

    // Tracks whether the LOCAL preview mirror actually changed something —
    // stays true for job_title/summary (which don't have a before/after
    // match step to fail) and is only ever flipped to false below, when a
    // bullet rewrite's before text can't be found in resumeSections (e.g.
    // whitespace/normalization drift) despite the backend applying the fix
    // successfully. The caller (MatchPenalties) uses this return value to
    // decide the confident "Added to resume" state, so it must reflect the
    // mirror, not just whether the network call itself succeeded.
    let mirrored: ApplyFixResult = true;
    // careerbot-api reports `resume_updated: false` when it wrote nothing to
    // the stored resume (e.g. suggest_add_cert_* and a bare
    // suggest_demonstrate_* gap resolve no resume edit there). The additive
    // branches below must not invent content the backend never saved, or the
    // preview would disagree with the stored resume and the export. Absent
    // (older responses) is treated as "wrote it", the previous behaviour.
    const backendWroteResume = res?.resume_updated !== false;

    if (category === "job_title") {
      const newTitle = penalty?.target || jobTitle?.jd_title;
      if (newTitle) {
        setResumeSections((prev: Record<string, unknown>) => ({
          ...prev,
          contact: { ...(prev.contact as Record<string, unknown>), jobTitle: newTitle },
        }));
        markHighlighted("contact", "title");
      }
    } else if (category === "summary") {
      const newSummary = penalty?.after_example || matchResult?.Summary_Check?.suggested_summary;
      if (newSummary) {
        setResumeSections((prev) => ({ ...prev, summary: newSummary }));
        markHighlighted("summary", "text");
      }
    } else {
      // Generic bullet/text rewrite — covers requirements/experience/star_pattern,
      // and any other category (e.g. capabilities) whose penalty was merged with
      // a real before/after pair by the backend's bullet-consolidation step. This
      // mirrors _resolve_one_text_edit's catch-all, which works from before/after
      // text alone and doesn't care about category.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weak = (starCheck?.weak_bullets ?? []).find((w: any) => w.suggestion_id === suggestion_id);
      const before = weak?.original || penalty?.before_example;
      // weak.improved/penalty.after_example are cached from the original
      // match-analysis call and may still carry the unfilled "n" metric
      // placeholder (e.g. "...with n+ successful integrations") — the
      // backend resolves it server-side once a manual value is supplied,
      // but this cached copy doesn't know that. Substitute it locally (see
      // fillManualBlank — anchored to the specific blank the backend
      // reported, not every standalone "n") so the preview matches what the
      // backend actually saved (and what the downloaded resume already
      // shows correctly).
      const rawAfter = weak?.improved || penalty?.after_example;
      const after = manualValue ? fillManualBlank(rawAfter, blankText, manualValue) : rawAfter;
      if (before && after && before !== after) {
        // Run the replacement against the ref, NOT inside a setState updater:
        // this function must return whether the mirror actually matched, and
        // an updater is not guaranteed to have run by the time we return
        // (React batches it, and StrictMode double-invokes it — so setting an
        // outer flag from inside one is both late and unsound).
        //
        // The ref also solves what the functional-updater form was there for:
        // runSerially only serializes the network call, not the render cycle,
        // so two quick "Apply fix" clicks could otherwise both read the same
        // stale render-time snapshot and have the second silently erase the
        // first. Advancing resumeSectionsRef synchronously here means the
        // second click sees the first's result immediately.
        const result = replaceBulletText(resumeSectionsRef.current, before, after);
        if (result.changed.length) {
          resumeSectionsRef.current = result.sections;
          setResumeSections(result.sections);
          result.changed.forEach((c) => markHighlighted(c.section, String(c.idx)));
          // Remember the text we ACTUALLY wrote. When a manual value filled a
          // metric blank, `after` differs from the cached after_example, and
          // undo searching for the cached copy would find nothing.
          appliedTextRef.current[suggestion_id] = after;
        } else {
          mirrored = false;
        }
      } else if (backendWroteResume && category === "certifications" && suggestion_id.startsWith("suggest_add_cert_") && typeof penalty?.target === "string") {
        // Additive fixes have no `before` to replace, so the rewrite above
        // never touches them. careerbot-api develop2 writes a generated
        // bullet (append_resume_bullet) but has no certification write yet,
        // so it reports resume_updated:false for suggest_add_cert_* and this
        // branch is skipped by the backendWroteResume gate. It mirrors a
        // certification only once the backend says it saved one. Order: a
        // certification by id prefix (name = penalty.target), then a new
        // bullet placed by mapping_section.
        const added = addCertification(resumeSectionsRef.current, penalty.target);
        if (added.status === "added") {
          resumeSectionsRef.current = added.sections;
          setResumeSections(added.sections);
          markHighlighted("certifications", String(added.index));
          setActiveSectionIds((prev) => (prev.includes("certifications") ? prev : [...prev, "certifications"]));
          appliedTextRef.current[suggestion_id] = penalty.target.trim();
        }
      } else if (backendWroteResume && !before && after && penalty?.mapping_section) {
        const added = addBullet(resumeSectionsRef.current, penalty.mapping_section, after);
        if (added.status === "added") {
          resumeSectionsRef.current = added.sections;
          setResumeSections(added.sections);
          markHighlighted(penalty.mapping_section, String(added.entryIndex));
          appliedTextRef.current[suggestion_id] = after.trim();
        } else if (added.status === "invalid") {
          // The backend refuses the same placements (unknown section, or no
          // entry to append to), so nothing was written to either copy.
          mirrored = false;
        }
      } else if (!penalty?.is_bulk_parent) {
        // No branch could mirror this fix (e.g. a bare "Demonstrate
        // capability: X" gap that carries only a `target`, or a certification
        // the API does not write). The preview did not change, so the row
        // must not claim the confident "Added" state. The score change above
        // still stands -- the backend recorded it -- so the row must not go
        // back to "Apply Fix" either: it shows "Applied" without Undo, since
        // the API keeps no undo bookkeeping for a fix that resolved no resume
        // edit (enhance/remove answers 404 suggestion_not_applied).
        // Bulk parents are excluded: their caller (applyBulkTextFix) already
        // marks the children as "applied, not yet confirmed in preview".
        mirrored = "applied_not_in_preview";
        toast.info("Score updated, but this fix couldn't be added to your resume automatically. Add the details in the editor to complete it.");
      }
    }

    return mirrored;
  }, [matchId, matchResult, jobTitle, starCheck, markHighlighted, runSerially, askForNumber]);

  // Undo a non-skill fix (job title / summary / bullet rewrite) — the inverse
  // of applyTextFix above. The backend endpoint (POST /enhance/remove) fully
  // reverts its own bookkeeping and the stored resume document from what it
  // snapshotted at apply time; this just mirrors that same reversal into the
  // local preview using the same before/after text applyTextFix used to apply
  // it (job_title/summary have no before/after pair on the penalty itself, so
  // those fall back to the untouched parsedResumeData / Job_Title_Check.matched_title
  // — the resume's state before ANY fix was applied).
  const removeTextFix = React.useCallback(async (suggestion_id: string, category: string): Promise<boolean> => {
    if (!matchId || !suggestion_id) return false;
    // Mirrors applyTextFix: true unless the local preview could not be reverted.
    let mirrored = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: any;
    try {
      res = await runSerially(() => matcherEnhanceRemove(matchId, suggestion_id));
    } catch {
      toast.error("Couldn't undo this fix. Please try again.");
      return false;
    }

    const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after;
    applyClampedScore(newScore, setLiveScore);

    const penalties = matchResult?.Match_Penalties?.penalties ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const penalty = penalties.find((p: any) => p.suggestion_id === suggestion_id);
    const original = parsedResumeData?.parsed_data ?? parsedResumeData ?? {};

    if (category === "job_title") {
      const originalTitle = jobTitle?.matched_title;
      if (originalTitle) {
        setResumeSections((prev: Record<string, unknown>) => ({
          ...prev,
          contact: { ...(prev.contact as Record<string, unknown>), jobTitle: originalTitle },
        }));
      }
      unmarkHighlighted("contact", "title");
    } else if (category === "summary") {
      const originalSummary =
        original.professionalSummary ?? original.professional_summary ?? original.summary ?? original.career_objective ?? "";
      setResumeSections((prev) => ({ ...prev, summary: originalSummary }));
      unmarkHighlighted("summary", "text");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weak = (starCheck?.weak_bullets ?? []).find((w: any) => w.suggestion_id === suggestion_id);
      const before = weak?.original || penalty?.before_example;
      // Prefer the text apply actually wrote. The cached after_example may
      // still carry an unfilled "n+" metric placeholder, so searching for it
      // would miss a bullet that was saved as "20+".
      const after = appliedTextRef.current[suggestion_id] ?? (weak?.improved || penalty?.after_example);
      if (before && after && before !== after) {
        const result = replaceBulletText(resumeSectionsRef.current, after, before);
        if (result.changed.length) {
          resumeSectionsRef.current = result.sections;
          setResumeSections(result.sections);
          result.changed.forEach((c) => unmarkHighlighted(c.section, String(c.idx)));
          delete appliedTextRef.current[suggestion_id];
        } else {
          // The server rolled the fix back but the preview still shows the
          // applied text. Reporting success here would clear the card's
          // "Added" state and leave preview and server disagreeing with no
          // way for the user to notice.
          mirrored = false;
        }
      } else if (penalty?.category === "certifications" && suggestion_id.startsWith("suggest_add_cert_") && typeof penalty.target === "string") {
        // Inverse of applyTextFix's additive branches. A miss (the entry was
        // already removed or edited in the preview) needs no revert, so unlike
        // the rewrite undo above it never reports failure.
        const name = appliedTextRef.current[suggestion_id] ?? penalty.target;
        const result = removeCertification(resumeSectionsRef.current, name);
        if (result.removed.length) {
          resumeSectionsRef.current = result.sections;
          setResumeSections(result.sections);
          setHighlightFields((prev) => {
            const existing = prev.certifications ?? [];
            const next = shiftHighlightsAfterRemoval(existing, result.removed);
            if (next.length === existing.length && next.every((h, i) => h === existing[i])) return prev;
            if (next.length === 0) {
              const rest = { ...prev };
              delete rest.certifications;
              return rest;
            }
            return { ...prev, certifications: next };
          });
        }
        delete appliedTextRef.current[suggestion_id];
      } else if (!penalty?.before_example && penalty?.mapping_section) {
        const text = appliedTextRef.current[suggestion_id] ?? penalty.after_example;
        if (text) {
          const result = removeBullet(resumeSectionsRef.current, penalty.mapping_section, text);
          if (result.entryIndexes.length) {
            resumeSectionsRef.current = result.sections;
            setResumeSections(result.sections);
            result.entryIndexes.forEach((idx) => unmarkHighlighted(penalty.mapping_section, String(idx)));
          }
        }
        delete appliedTextRef.current[suggestion_id];
      }
    }

    return mirrored;
  }, [matchId, matchResult, jobTitle, starCheck, parsedResumeData, unmarkHighlighted, runSerially]);

  // Remove a skill: enhance/remove updates the match score AND removes the
  // skill from the resume document server-side (see job_matcher.py
  // enhance/remove — repository.remove_skill_from_resume).
  const directRemoveSkill = React.useCallback(async (skill: string, suggestion_id?: string): Promise<boolean> => {
    const s = skill.trim();
    const wasHighlighted = addedSkillFields.includes(s);
    setAddedSkillFields((prev) => prev.filter((x) => x !== s));
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      return { ...prev, skills: existing.filter((x) => x !== s) };
    });
    const resolvedSuggestionId = suggestion_id ?? findSkillSuggestionId(s);
    // Mirror of directAddSkill's guard above: without a suggestion id there
    // is no server-side route to remove the skill from the resume document,
    // so nothing is persisted. Restore the optimistic removal and report
    // failure rather than returning true — otherwise the chip clears while
    // the downloaded resume still contains the skill.
    if (!matchId || !resolvedSuggestionId) {
      if (wasHighlighted) setAddedSkillFields((prev) => prev.includes(s) ? prev : [...prev, s]);
      setResumeSections((prev: Record<string, unknown>) => {
        const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
        return existing.includes(s) ? prev : { ...prev, skills: [...existing, s] };
      });
      return false;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await runSerially(() => matcherEnhanceRemove(matchId, resolvedSuggestionId)) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = Number.parseFloat(newScore);
        if (!Number.isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
      }
      return true;
    } catch {
      if (wasHighlighted) setAddedSkillFields((prev) => prev.includes(s) ? prev : [...prev, s]);
      setResumeSections((prev: Record<string, unknown>) => {
        const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
        return existing.includes(s) ? prev : { ...prev, skills: [...existing, s] };
      });
      return false;
    }
  }, [matchId, findSkillSuggestionId, addedSkillFields, runSerially]);

  const score = liveScore;
  const fixCounts = getFixImpactCounts(matchResult);
  const potentialScore = Math.min(100, Math.max(score, initialScore + Math.abs(Number(matchResult?.Match_Penalties?.total_penalty) || 0)));
  const potentialGain = Math.max(0, Math.round(potentialScore) - Math.round(score));
  const downloadDisabled = !resumeId || isSavingSection || isDownloading;
  const handleDownload = async () => {
    if (downloadDisabled) return;
    setIsDownloading(true);
    try {
      await runSerially(() => downloadResumePdf(resumeId, undefined, matchId));
      toast.success("Resume downloaded");
    } catch (err) {
      // downloadResumePdf now decodes the backend's actual error detail (see
      // its own comment) instead of leaving every failure as an opaque axios
      // "Request failed with status code 500" — surface it so the reason is
      // visible instead of only ever showing this same generic line.
      const reason = err instanceof Error && err.message ? err.message : null;
      toast.error(reason ? `Couldn't download your resume: ${reason}` : "Couldn't download your resume. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Score header card (RIGHT column) — donut ring + match band.
  const scoreBand = matchBand(score);
  const scoreRingRadius = 30;
  const scoreRingCirc = 2 * Math.PI * scoreRingRadius;
  const scoreRingDash = scoreRingCirc - (Math.min(100, Math.max(0, score)) / 100) * scoreRingCirc;

  // Merge newly-added skills back into parsedData so the template renders them
  const mergedParsedData = React.useMemo(() => {
    if (!addedSkillFields.length) return parsedResumeData;
    const base = parsedResumeData?.parsed_data ?? parsedResumeData ?? {};
    let existing: string[];
    if (Array.isArray(base.skills)) {
      existing = base.skills;
    } else if (Array.isArray(base.technical_skills)) {
      existing = base.technical_skills;
    } else {
      existing = [];
    }
    const merged = Array.from(new Set([...existing, ...addedSkillFields]));
    return { ...parsedResumeData, parsed_data: { ...base, skills: merged } };
  }, [parsedResumeData, addedSkillFields]);

  const matchedTechSkills: string[] = [
    ...(techSkills.matched_critical_skills ?? []).map((s: string | { skill: string }) => typeof s === "string" ? s : s.skill).filter(Boolean),
    ...(techSkills.matched_important_skills ?? []).map((s: string | { skill: string }) => typeof s === "string" ? s : s.skill).filter(Boolean),
    ...(techSkills.matched_nice_to_have    ?? []).map((s: string | { skill: string }) => typeof s === "string" ? s : s.skill).filter(Boolean),
  ];
  const missingTechSkills: string[] = [
    ...(techSkills.missing_critical_skills  ?? []).map((s: string | { skill: string }) => typeof s === "string" ? s : s.skill).filter(Boolean),
    ...(techSkills.missing_important_skills ?? []).map((s: string | { skill: string }) => typeof s === "string" ? s : s.skill).filter(Boolean),
    ...(techSkills.missing_nice_to_have     ?? []).map((s: string | { skill: string }) => typeof s === "string" ? s : s.skill).filter(Boolean),
  ];
  const matchedSoftSkills: string[] = softSkills.matched_skills ?? [];
  const missingSoftSkills: string[] = softSkills.missing_skills ?? [];

  // Missing skills still outstanding after local edits — once a skill is
  // added it lands in addedSkillFields (see directAddSkill), so drop it here
  // rather than showing it as both a real chip and a red "ghost" one.
  const pendingSkills = React.useMemo(
    () => missingTechSkills.filter((s) => !addedSkillFields.some((a) => a.toLowerCase() === s.toLowerCase())),
    [missingTechSkills, addedSkillFields]
  );
  const pendingSoftSkills = React.useMemo(
    () => missingSoftSkills.filter((s) => !addedSkillFields.some((a) => a.toLowerCase() === s.toLowerCase())),
    [missingSoftSkills, addedSkillFields]
  );

  // Same "still outstanding" idea as pendingSkills, but for the non-skill
  // suggestion categories (job title / summary / bullet rewrites) — mirrors
  // the {section: [field, ...]} shape of highlightFields (the green-preview
  // state) so JobMatchTemplateThree can red-highlight anything not in
  // highlightFields yet. job_title/summary flip the instant applyTextFix
  // marks them highlighted; bullets flip the instant their "before" text is
  // no longer found in resumeSections (i.e. replaceBulletText rewrote it) —
  // both conditions are checked here so a fix applied via any other path
  // (e.g. a retried match) still clears the red state correctly.
  const pendingFields = React.useMemo(() => {
    const fields: Record<string, string[]> = {};
    const add = (section: string, field: string) => {
      if (!fields[section]) fields[section] = [];
      if (!fields[section].includes(field)) fields[section].push(field);
    };
    const penalties = matchResult?.Match_Penalties?.penalties ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of penalties as any[]) {
      if (p.category === "technical_skills" || p.category === "soft_skills") continue;
      for (const { section, field } of pendingFieldsForPenalty(p, highlightFields, resumeSections)) {
        add(section, field);
      }
    }
    return fields;
  }, [matchResult, highlightFields, resumeSections]);

  const matchedCapabilities: string[] = [
    // Capabilities
    ...(capSkills.matched_capabilities ?? []).map((c: { capability: string }) => c.capability),
    // Certifications
    ...(certSkills.matched_certifications ?? []).map((c: { certification?: string; name?: string }) => c.certification ?? c.name ?? "").filter(Boolean),
    // Job title
    ...(jobTitle.matched_title ? [jobTitle.matched_title] : []),
    ...(jobTitle.jd_title ? [jobTitle.jd_title] : []),
    // STAR matched bullets (first few words as phrase)
    ...(starCheck.strong_bullets ?? []).map((b: { text?: string; bullet?: string }) => b.text ?? b.bullet ?? "").filter(Boolean),
  ];

  // Sections shown in the active list
  const activePredefined = ALL_SECTIONS.filter((s) => activeSectionIds.includes(s.id));
  // Sections available to add
  const additionalPredefined = ALL_SECTIONS.filter((s) => !activeSectionIds.includes(s.id));

  const addSection = (id: string) => {
    setActiveSectionIds((prev) => [...prev, id]);
  };

  const addCustomSection = () => {
    const name = customName.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    setCustomSections((prev) => [...prev, { id, label: name }]);
    setActiveSectionIds((prev) => [...prev, id]);
    setResumeSections((prev) => ({ ...prev, [id]: [] }));
    setCustomName("");
    setShowCustomInput(false);
  };

  const openSectionLabel =
    ALL_SECTIONS.find((s) => s.id === openSection)?.label ??
    customSections.find((s) => s.id === openSection)?.label ?? "";

  // All sections in the active list (predefined + custom)
  const allActiveSections = [
    ...activePredefined,
    ...customSections.filter((c) => activeSectionIds.includes(c.id)).map((c) => ({
      id: c.id, label: c.label, icon: AlignLeft, hasAI: false,
    })),
  ];

  return (
    <div className={`${styles.analysis} relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-[#F4F8FC]`}>


      {/* ONE grid for the whole page body — header row (title block + score
          card) and content row (resume-preview card + analysis panel) are
          all direct children of this same grid, sharing the same two column
          tracks. That's deliberate: this used to be a separate header grid
          stacked on top of an independent flex row, and the two laid out
          their columns via different mechanisms (grid `fr` vs flex `shrink`)
          that don't resolve to identical pixel widths at every viewport size
          — so the score card (row 1) and the analysis panel beneath it
          (row 2), despite nominally being "the same column", could end up
          different widths. A single grid makes that impossible: both rows
          read from the exact same column tracks, so LEFT-row1 always equals
          LEFT-row2 and RIGHT-row1 always equals RIGHT-row2, by construction.
          `minmax(0,1120fr)_minmax(0,720fr)` keeps the two columns' relative
          proportions constant as the viewport narrows, instead of one column
          (previously `shrink-0` on the right) hoarding its full width and
          dumping the entire deficit on the other. */}
      <div className={`${styles.layout} ${compareDocuments ? styles.comparisonLayout : ""}`}>
        {/* pl-* only (no pr-*) — the gap between columns is the grid's own
            gap-x-5. Padding on BOTH inner faces on top of that gap was
            stacking into a much wider gutter in the middle of the page than
            on the outer left/right edges. */}
        <div className={styles.pageHeading}>
          <div>
          {onBackToUpload && (
            <button
              type="button"
              onClick={onBackToUpload}
              className="mb-2 flex w-fit items-center gap-1.5 text-[14px] font-semibold text-[#2257A7] hover:underline"
            >
              <ArrowLeft className="w-[18px] h-[18px]" /> Back to Results
            </button>
          )}
          <h1 className="text-[28px] font-bold leading-tight text-[#182230]">
            Detailed Analysis
          </h1>
          <p className="mt-1 text-[14px] leading-5 text-[#526174]">
            In-depth insights on how your resume matches with the job description.
          </p>
          </div>

        </div>

        {/* LEFT — Section list sidebar (edit mode only) — fixed overlay, does
            not disturb grid layout: absolutely-positioned children are
            excluded from grid placement entirely. */}
        {isEditMode && (
          <>
            {/* Backdrop blur — only within the content area */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Close section editor"
              className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsEditMode(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsEditMode(false);
                }
              }}
            />
          <div className="absolute top-0 right-0 h-full z-50 w-[320px] bg-white border-l border-gray-100 overflow-y-auto flex flex-col animate-slide-in-right shadow-2xl" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            {/* Sidebar Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-[#2257A7] mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Preview
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-[#2257A7]" />
                <div>
                  <p className="text-[16px] font-bold text-gray-900">Resume Sections</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Click a section to edit its content</p>
                </div>
              </div>
            </div>

            {/* Active sections */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Sections</p>
              {allActiveSections.map((section) => (
                <div
                  key={section.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenSection(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenSection(section.id);
                    }
                  }}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 text-gray-500 group-hover:text-[#2257A7] transition-all">
                      <section.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[14px] font-semibold text-gray-700 group-hover:text-[#2257A7] transition-colors">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {section.hasAI && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[12px] bg-violet-50 font-semibold text-violet-600 rounded-full border border-violet-100">
                        <Sparkles size={12} className="mr-0.5" />AI
                      </span>
                    )}
                    <CheckCircle2 size={16} className="text-[#167044]" />
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-[#2257A7] transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Sections */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Add Sections</p>
              <div className="space-y-1.5">
                {additionalPredefined.map((section) => (
                  <div
                    key={section.id}
                    role="button"
                    tabIndex={0}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => addSection(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        addSection(section.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-blue-100 group-hover:border-blue-200 text-gray-400 group-hover:text-[#2257A7] transition-all">
                        <section.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[14px] font-semibold text-gray-500 group-hover:text-[#2257A7]">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {section.hasAI && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[12px] bg-violet-50 font-semibold text-violet-600 rounded-full border border-violet-100">
                          <Sparkles size={12} className="mr-0.5" />AI
                        </span>
                      )}
                      <Plus size={14} className="text-gray-300 group-hover:text-[#2257A7] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Sections */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Custom Sections</p>
              {showCustomInput ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addCustomSection(); } if (e.key === "Escape") { setShowCustomInput(false); } }}
                    placeholder="e.g. Patents, Volunteer Work"
                    className="w-full px-3 py-2 text-[14px] border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={addCustomSection} className="flex-1 py-2 text-[12px] font-semibold bg-[#2257A7] text-white rounded-lg hover:bg-[#1A4589] transition-colors">Add</button>
                    <button type="button" onClick={() => { setShowCustomInput(false); setCustomName(""); }} className="flex-1 py-2 text-[12px] font-semibold border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold text-[#2257A7] border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus size={13} /> Add Custom Section
                </button>
              )}
            </div>
          </div>
          </>
        )}

        {/* LEFT — Resume / Job Description (main, always visible) —
            no flex-1/flex-grow here: both columns now size to their own
            content (see RIGHT below) and the row's own `gap-6 justify-center`
            sits them directly next to each other. flex-1 on either side would
            eat all the leftover space on a wide screen and shove the other
            column away, opening a dead gap between them.
            lg:sticky pins this column while the page scrolls. The card below
            has a FIXED height (not max-height) matching RIGHT's (see its
            comment below) so both columns are always the same size —
            whichever has less content just shows blank space in its own
            card instead of looking shorter, and whichever overflows scrolls
            internally (overflow-y-auto, never overflow-hidden — nothing is
            ever capped out of reach, only reachable by scrolling that column
            instead of the page). */}
        <div className={styles.documentColumn}>
          <div className="w-full h-full">
          <div ref={documentViewerRef} className={styles.documentCard}>
            {/* Tab bar */}
            <div className={styles.documentTabs}>
              <div className="flex items-center gap-1.5">
                {([
                  { id: "resume", label: "Resume" },
                  { id: "jd", label: "Job Description" },
                ] as const).filter(tab => !compareDocuments || tab.id === "resume").map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={`flex min-h-11 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[14px] font-semibold transition-colors ${
                      (compareDocuments ? "resume" : previewTab) === tab.id
                        ? "border-[#2257A7] text-[#2257A7]"
                        : "border-transparent text-[#526174] hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.viewerToolbar}>
              <span>{compareDocuments ? "Resume preview" : previewTab === "resume" ? "Resume preview" : "Job description"}</span>
              <div><button type="button" aria-label="Zoom out" disabled={zoomPct <= 60} onClick={() => setZoomPct(v => Math.max(60, v - 10))}><Minus/></button><output aria-label="Preview zoom">{zoomPct}%</output><button type="button" aria-label="Zoom in" disabled={zoomPct >= 150} onClick={() => setZoomPct(v => Math.min(150, v + 10))}><Plus/></button></div>
              <div><button type="button" aria-label="Download resume" onClick={handleDownload} disabled={downloadDisabled}><Download/></button><button type="button" aria-label="Fullscreen preview" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void documentViewerRef.current?.requestFullscreen().catch(() => toast.error("Fullscreen is not available in this browser.")); }}><Maximize/></button></div>
            </div>

            {/* File-card sub-toolbar — resume tab only; the JD tab keeps its
                own "Copy" header below instead, since there's no file behind
                it to describe. */}
            {(previewTab !== "jd" || compareDocuments) && (
              <div className={styles.documentFile} style={{ justifyContent: "flex-start" }}>
                <button
                  type="button"
                  onClick={() => setIsEditMode((v) => !v)}
                  className={`flex shrink-0 min-h-9 items-center gap-1.5 px-3.5 py-2 text-[14px] font-bold rounded-lg border transition-all ${isEditMode ? "bg-[#2257A7] text-white border-[#2257A7] hover:bg-[#1A4589]" : "text-[#2257A7] border-[#c7d9f5] hover:bg-blue-50"}`}
                >
                  <Pencil className="w-4 h-4" />
                  {isEditMode ? "Close Editor" : "Edit Resume"}
                </button>
                <button type="button" className={styles.compareButton} aria-pressed={compareDocuments} onClick={() => setCompareDocuments(v => !v)}>{compareDocuments ? "Close Comparison" : "Compare Side by Side"}</button>
              </div>
            )}
            {previewTab === "jd" && !compareDocuments && (
              <div className={`${styles.documentFile} flex items-center justify-between gap-3 px-5 py-4 border-b border-[#e5eaf1] bg-white`}>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(jdText).catch(() => {}); }}
                  className="flex min-h-9 items-center gap-1.5 rounded-lg border border-[#c7d9f5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#2257A7] shadow-sm transition-all hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2257A7] focus-visible:ring-offset-2"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button type="button" className={styles.compareButton} aria-pressed={compareDocuments} onClick={() => setCompareDocuments(v => !v)}>{compareDocuments ? "Close Comparison" : "Compare Side by Side"}</button>
              </div>
            )}

            {/* This view always has parsedData synchronously from props —
                there's no PDF/DOCX blob or async load here — so those
                ResumePreview props are fixed no-ops rather than real state. */}
            {(previewTab === "resume" || compareDocuments) && (
              <div className={styles.resumePreview} data-resume-scroll-container>
                <div className="mx-auto max-w-[960px]" style={{ zoom: zoomPct / 100 }}>
                  <ResumePreview
                    pdfBlobUrl={null}
                    pdfError={null}
                    isLoading={false}
                    isUpdating={false}
                    isDocx={false}
                    docxBlob={null}
                    parsedData={mergedParsedData}
                    resumeId=""
                    addedFields={{ skills: addedSkillFields, ...highlightFields }}
                    matchedKeywords={[...matchedTechSkills, ...matchedSoftSkills, ...addedSkillFields]}
                    pendingSkills={pendingSkills}
                    pendingSoftSkills={pendingSoftSkills}
                    pendingFields={pendingFields}
                    editOverrides={resumeSections}
                    onEditSection={(key) => { setIsEditMode(true); setOpenSection(key); }}
                    onDeleteSection={(key) => { setDeletedSectionIds((prev) => [...prev, key]); setActiveSectionIds((prev) => prev.filter((id) => id !== key)); }}
                    deletedSections={deletedSectionIds}
                  />
                </div>
                <div className={styles.matchLegend} aria-label="Resume keyword highlights"><span><i data-status="matched"/>Present in both (Resume &amp; JD)</span><span><i data-status="missing"/>In JD, missing from Resume</span></div>
              </div>
            )}

            {(previewTab === "jd" && !compareDocuments) && (
              <div className={styles.jdPreview} style={{ zoom: zoomPct / 100 }}>
                {jdText ? (
                  <JDHighlighter
                    text={jdText}
                    matchedSkills={matchedTechSkills}
                    missingSkills={missingTechSkills}
                    matchedSoftSkills={matchedSoftSkills}
                    missingSoftSkills={missingSoftSkills}
                    matchedCapabilities={matchedCapabilities}
                    onMissingSkillClick={directAddSkill}
                  />
                ) : (
                  <p className="text-gray-400 text-sm">No job description available</p>
                )}
              </div>
            )}

          </div>
          </div>
        </div>

        {/* RIGHT — Score summary + Suggestions/Fixes, stacked together in ONE
            column so this whole column is a FIXED height at lg: (not
            max-height), matching LEFT's resume-preview column exactly — the
            score card used to sit in its own header row alongside the page
            title, which meant this column only matched LEFT from the score
            card's bottom edge down, not from the very top. Score card and
            aside must be DOM-adjacent (siblings here) for them to share one
            grid cell like this; CSS Grid can't stack two separately-placed
            items into the same cell.
            The overflow-y-auto lives on the <aside> below, not this wrapper —
            the score card is shrink-0 (fixed size, always visible, never
            scrolls away) and the aside is flex-1 (takes whatever height is
            left in the fixed column and scrolls internally within just that).
            An earlier version of this comment said sticky/max-height/
            internal scroll must never go here because that combination
            "clipped" a long Recommendations list — that was with
            overflow-hidden, which genuinely hides overflow with no way back
            to it. This uses overflow-y-auto instead: nothing is capped out of
            reach, every suggestion is still there, just reachable by
            scrolling the aside instead of the page. If a long fixes list ever
            feels awkward to scroll this way again, revisit — but don't
            silently flip this back to overflow-hidden.
            No max-w/shrink of its own — the shared grid's column track
            (see the grid's `grid-cols` above) already fully determines this
            column's width; a max-w here would just silently override it. */}
        <div className={styles.rightColumn}>
          <div className={styles.scoreCards}>
            <section className={styles.currentScore} aria-label="Current match score">
              <div className={styles.scoreGauge} title={scoreBand.description}>
                <svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r={scoreRingRadius} fill="none" stroke="#e5e7eb" strokeWidth="7"/><circle cx="36" cy="36" r={scoreRingRadius} fill="none" stroke={scoreBand.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={scoreRingCirc} strokeDashoffset={scoreRingDash}/></svg>
                <strong>{Math.round(score)}%</strong>
              </div>
              <div><h2>Current Match Score</h2><span className={styles.scoreBadge} style={{color: scoreBand.color, background: `color-mix(in srgb, ${scoreBand.color} 12%, white)`}}>{scoreBand.label}</span><p>Based on your current resume</p></div>
            </section>
            <section className={styles.potentialScore}><h2>Potential Match Score</h2><strong>{Math.round(potentialScore)}%</strong><p>Estimated with suggested fixes (+{potentialGain} pts)</p></section>
            <section className={styles.downloadCard}><h2>{appliedSuggestionIds.length} of {Math.max(fixCounts.all, appliedSuggestionIds.length)} applied</h2><progress aria-label="Applied fixes" value={appliedSuggestionIds.length} max={Math.max(1, fixCounts.all, appliedSuggestionIds.length)}/><button type="button" onClick={handleDownload} disabled={downloadDisabled}>{isDownloading ? <Loader2 className="animate-spin"/> : <Download/>}{isDownloading ? "Downloading..." : "Download Updated Resume"} <span>({appliedSuggestionIds.length} fixes)</span></button><p>{isSavingSection ? "Saving changes..." : "Review your changes before downloading."}</p></section>
          </div>
        {compareDocuments ? (
          <section className={`${styles.documentColumn} ${styles.comparisonJd}`} aria-label="Job description comparison">
            <div className={styles.documentCard}>
              <div className={styles.documentFile}>
                <button type="button" onClick={() => { void navigator.clipboard.writeText(jdText); }}><Copy/> Copy</button>
              </div>
              <div className={styles.documentTabs}><span>Job description preview</span></div>
              <div className={styles.viewerToolbar}>
                <span>Job Description</span>
                <div><button type="button" aria-label="Zoom out job description" disabled={jdZoomPct <= 60} onClick={() => setJdZoomPct(v => Math.max(60, v - 10))}><Minus/></button><output aria-label="Job description zoom">{jdZoomPct}%</output><button type="button" aria-label="Zoom in job description" disabled={jdZoomPct >= 150} onClick={() => setJdZoomPct(v => Math.min(150, v + 10))}><Plus/></button></div>
              </div>
              <div className={styles.jdPreview} style={{ zoom: jdZoomPct / 100 }}>
                {jdText ? (
                  <JDHighlighter
                    text={jdText}
                    matchedSkills={matchedTechSkills}
                    missingSkills={missingTechSkills}
                    matchedSoftSkills={matchedSoftSkills}
                    missingSoftSkills={missingSoftSkills}
                    matchedCapabilities={matchedCapabilities}
                    onMissingSkillClick={directAddSkill}
                  />
                ) : (
                  <p className="text-gray-400 text-sm">No job description available</p>
                )}
              </div>
            </div>
          </section>
        ) : (
        <aside
          ref={fixesRef}
          className={styles.analysisPanel}
          aria-label="Job match score, suggestions and actionable fixes"
        >
          {/* Tabbed analysis panel */}
          <div className="min-w-0 bg-white">
            <div className={styles.analysisTabs}>
              <div className="flex" role="group" aria-label="Analysis view">
              {([
                { id: "sections", label: "Breakdown" },
                { id: "keywords", label: "Keywords" },
                { id: "all", label: "Recommendations" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={tab.id === "all" ? !["sections", "keywords"].includes(rightTab) : rightTab === tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`min-h-11 shrink-0 border-b-2 px-3 py-2.5 text-[12px] font-semibold transition-colors ${
                    (tab.id === "all" ? !["sections", "keywords"].includes(rightTab) : rightTab === tab.id)
                      ? "border-[#2257A7] text-[#2257A7]"
                      : "border-transparent text-[#526174] hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              </div>

            </div>
            <fieldset className={styles.analysisBody}>
              {rightTab === "sections" && (
                <>
                <p className="mb-2 flex items-start gap-2 px-2 py-2 text-[12px] leading-5 text-[#526174]"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span>Section scores reflect the last full analysis.{appliedSuggestionIds.length > 0 && " Analyze your updated resume again to refresh these scores."}</span></p>
                <ScoreBreakdown
                  matchResult={matchResult}
                  currentSummary={
                    typeof resumeSections.summary === "string"
                      ? resumeSections.summary
                      : resumeSections.summary?.summary ?? resumeSections.summary?.text ?? ""
                  }
                  onAddSkill={addSkillFromSuggestionChip}
                  appliedSuggestionIds={appliedSuggestionIds}
                />
                </>
              )}
              {rightTab === "keywords" && <KeywordAnalysis matchResult={matchResult}/>}
              {rightTab !== "sections" && rightTab !== "keywords" && (
                <MatchPenalties
                  matchResult={matchResult}
                  recommendations
                  impactFilter={rightTab}
                  onAddSkill={directAddSkill}
                  onRemoveSkill={directRemoveSkill}
                  onApplyFix={applyTextFix}
                  onRemoveFix={removeTextFix}
                  onOpenSection={(key) => setOpenSection(key)}
                  appliedSuggestionIds={appliedSuggestionIds}
                  bulkAppliedSuggestionIds={bulkAppliedSuggestionIds}
                  onSuggestionApplied={handleSuggestionApplied}
                  onBulkApplied={handleBulkApplied}
                />
              )}
            </fieldset>

          </div>
        </aside>
        )}
        </div>

      </div>

      {/* Section Editor Modal — popup with blur like Resume Builder */}
      {openSection && (
        <JobMatchSectionEditor
          sectionKey={openSection}
          sectionLabel={openSectionLabel}
          initialData={resumeSections[openSection] ?? []}
          onSave={(key, data) => {
            const previousValue = resumeSections[key];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setResumeSections((prev: Record<string, any>) => ({ ...prev, [key]: data }));
            setOpenSection(null);

            // See CONTACT_SUGGESTION_PREFIX comment above: contact fields can only
            // be persisted through matcherEnhanceApply, one field at a time, and
            // only while a "suggest_add_contact_<field>" suggestion is still
            // pending for it.
            if (key === "contact") {
              if (!resumeId || !matchId) return;

              const suggestionIdByField = pendingContactSuggestions(matchResult);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fieldValues: Record<string, any> = {
                name: data.fullname || data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
              };
              const toApply = Object.entries(suggestionIdByField)
                .filter(([field]) => fieldValues[field] && String(fieldValues[field]).trim())
                .map(([field, suggestionId]) => ({ suggestionId, value: String(fieldValues[field]).trim() }));

              if (!toApply.length) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setResumeSections((prev: Record<string, any>) => ({ ...prev, contact: previousValue }));
                toast.error("Only fields flagged as missing (email, phone, location) can be saved here right now.");
                return;
              }

              setIsSavingSection(true);
              (async () => {
                // Sequential, not Promise.all: set_resume_contact_field does a
                // read-whole-parsed_data → mutate one field → write-whole-parsed_data
                // round trip. Firing email/phone/location concurrently means all
                // three read the same pre-edit snapshot and whichever write lands
                // last overwrites the other two fields' edits with stale data —
                // that's why location silently didn't survive last time even
                // though its own request succeeded. One at a time avoids the race.
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  let last: any = null;
                  for (const { suggestionId, value } of toApply) {
                    last = await runSerially(() => matcherEnhanceApply(matchId, suggestionId, "manual", value));
                  }
                  toast.success("Personal Info saved — ready to download");
                  const newScore = last?.score_diff?.after ?? last?.data?.score_diff?.after ?? last?.match_result?.ats_score;
                  if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
                  else if (typeof newScore === "string") {
                    const n = Number.parseFloat(newScore);
                    if (!Number.isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
                  }
                } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                  console.error("[JobMatch] contact save failed", err);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setResumeSections((prev: Record<string, any>) => ({ ...prev, contact: previousValue }));
                  toast.error(`Failed to save Personal Info: ${err?.message || err}`);
                } finally {
                  setIsSavingSection(false);
                }
              })();
              return;
            }

            if (matchId) {
              const sectionLabel = openSectionLabel || key;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const items = Array.isArray(data) ? data.map((item: any) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                  return { title: item.title || item.name || "", description: item.description || item.text || "" };
                }
                return String(item);
              }) : [];
              setIsSavingSection(true);
              console.warn("[JobMatch] matcherUpdateSections →", { matchId, sectionLabel, items });
              // Same read-modify-write invariant as the enhance calls above:
              // update_resume_custom_sections reads the whole parsed_data,
              // edits custom_sections, and writes the blob back. Unqueued, a
              // section save racing an "Add skill" silently drops one of them.
              runSerially(() => matcherUpdateSections(matchId, [{ sectionName: sectionLabel, items }]))
                .then(() => toast.success(`${sectionLabel} saved — ready to download`))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .catch((err: any) => { console.error("[JobMatch] sections save failed", err); toast.error(`Failed to save ${sectionLabel}: ${err?.message || err}`); })
                .finally(() => setIsSavingSection(false));
            }
          }}
          onClose={() => setOpenSection(null)}
        />
      )}

      {/* Fill-in-the-blank prompt — see askForNumber above */}
      {numberPromptState && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Cancel"
          className="fixed inset-0 z-1200 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { numberPromptState.resolve(null); setNumberPromptState(null); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              numberPromptState.resolve(null);
              setNumberPromptState(null);
            }
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const input = form.elements.namedItem("number-value") as HTMLInputElement;
              numberPromptState.resolve(input.value);
              setNumberPromptState(null);
            }}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-[15px] font-bold text-gray-900">Fill in the number</h3>
              <button
                type="button"
                onClick={() => { numberPromptState.resolve(null); setNumberPromptState(null); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {numberPromptState.blankText && (
              <p className="mb-3 rounded-lg bg-slate-50 p-2.5 text-[12.5px] italic text-gray-600">
                &quot;{numberPromptState.blankText}&quot;
              </p>
            )}
            <label htmlFor="jm-number-fix-value" className="mb-1 block text-[12px] font-semibold text-gray-700">
              This fix needs a real number to replace the blank — e.g. 20
            </label>
            <input
              id="jm-number-fix-value"
              name="number-value"
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="20"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { numberPromptState.resolve(null); setNumberPromptState(null); }}
                className="rounded-lg border border-gray-200 px-3.5 py-2 text-[14px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#2257A7] px-3.5 py-2 text-[14px] font-semibold text-white hover:opacity-90"
              >
                Apply fix
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

