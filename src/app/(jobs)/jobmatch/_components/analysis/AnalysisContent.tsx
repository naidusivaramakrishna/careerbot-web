"use client";

import React from "react";
import ResumePreview from "../resume/ResumePreview";
import PDFPreviewError from "./PDFPreviewError";
import { AnalysisContentProps } from "../_types";
import {
  FileText, User, Briefcase, GraduationCap,
  Star, Award, ArrowLeft, ChevronRight, BookOpen, Trophy,
  Heart, Building2, Plus, Globe, AlignLeft, Users, Download, Pencil, Sparkles,
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { RiSparkling2Fill } from "react-icons/ri";
import JobMatchSectionEditor from "../resume/JobMatchSectionEditor";
import JDHighlighter from "../highlighter/JDHighlighter";
import { downloadResumePdf, parserAddSkills, parserRemoveSkills, matcherUpdateSections, matcherEnhanceApply, matcherEnhanceRemove, getResume } from "@/api/parserApi";
import { toast } from "sonner";
import ScoreBreakdown from "./ScoreBreakdown";
import MatchPenalties from "./MatchPenalties";
import { MatchScoreSummary } from "./TopAnalysisBar";

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ring-1 ring-inset ring-black/5 ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}

// Maps a penalty's category to the single {section, field} its fix touches
// — only job_title and summary resolve to one unambiguous field the preview
// can highlight the way it already highlights added skills. Bullet-level
// rewrites (star_pattern / experience / capabilities / requirements) don't
// carry an index in the penalty payload, so there's no reliable target to
// highlight for those yet.
const HIGHLIGHTABLE_FIX_FIELD: Record<string, { section: string; field: string }> = {
  job_title: { section: "contact", field: "title" },
  summary: { section: "summary", field: "text" },
};

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

// selected_summary / summary_variants outrank the plain summary fields once a
// summary-rewrite fix has run (see repository.set_resume_summary on the
// backend) — check them first so a refreshed resume shows the rewritten text.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSummaryText(val: any): string {
  if (!val) return "";
  if (Array.isArray(val)) {
    for (const v of val) { const t = extractSummaryText(v); if (t) return t; }
    return "";
  }
  if (typeof val === "object") return String(val.summary ?? val.value ?? "");
  return typeof val === "string" ? val : "";
}

// There is no working "add this literal skill to the resume" endpoint —
// /matcher/enhance/apply is the only call that actually persists a skill (it
// writes into the resume document server-side), and it needs the
// suggestion_id from the matching Match_Penalties entry. MatchPenalties rows
// already carry their own suggestion_id; the JD highlighter only has the
// skill's text, so resolve it here by matching on `target`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findSkillSuggestionId(matchResults: any, skill: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const penalties: any[] = matchResults?.data?.match_result?.Match_Penalties?.penalties ?? [];
  const norm = skill.trim().toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hit = penalties.find((p: any) =>
    (p.category === "technical_skills" || p.category === "soft_skills") &&
    !p.is_bulk_parent &&
    typeof p.target === "string" &&
    p.target.trim().toLowerCase() === norm
  );
  return hit?.suggestion_id;
}

// Build the editable-section map from a parsed-resume payload — shared by the
// initial load and by the post-fix refresh (job title / summary / bullet
// rewrites land in the resume document, not in matchResults, so re-reading
// the resume is how the preview picks them up).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSectionsFromParsedData(parsedResumeData: any): Record<string, any> {
  const d = parsedResumeData?.parsed_data || parsedResumeData || {};
  const llm = d?.llm_data || {};
  return {
    contact:        d.contact ?? d.personalInfo ?? llm.contact ?? llm.personal_info ?? {},
    summary:        extractSummaryText(d.selected_summary) || extractSummaryText(d.summary_variants) ||
                    d.professionalSummary || d.professional_summary || d.summary || d.career_objective ||
                    llm.professionalSummary || llm.summary || "",
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
}

export default function AnalysisContent({
  jdText,
  matchResults,
  parsedResumeData,
  onBackToUpload,
}: AnalysisContentProps) {
  const [pdfBlobUrl]  = React.useState<string>("");
  const [isLoading]   = React.useState(false);
  const [pdfError]    = React.useState<string | null>(null);
  const [isUpdating]  = React.useState(false);
  const [isDocx]      = React.useState(false);
  const [docxBlob]    = React.useState<Blob | null>(null);

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [isSavingSection, setIsSavingSection] = React.useState(false);

  // Track which skills were added (for green highlight in resume template)
  const [addedSkillFields, setAddedSkillFields] = React.useState<string[]>([]);

  // Green-highlight tracking for non-skill fixes (job title, summary) —
  // mirrors addedSkillFields but keyed by section since these are single
  // named fields, not array items. See HIGHLIGHTABLE_FIX_FIELD.
  const [extraAddedFields, setExtraAddedFields] = React.useState<Record<string, string[]>>({});

  // Active section IDs (from parsed data + user-added)
  const [activeSectionIds, setActiveSectionIds] = React.useState<string[]>(
    () => detectActiveSections(parsedResumeData)
  );

  const [deletedSectionIds, setDeletedSectionIds] = React.useState<string[]>([]);

  // Custom sections added by user
  const [customSections, setCustomSections] = React.useState<{ id: string; label: string }[]>([]);
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customName, setCustomName] = React.useState("");

  // Resume section data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeSections, setResumeSections] = React.useState<Record<string, any>>(
    () => buildSectionsFromParsedData(parsedResumeData)
  );

  // Re-fetched resume document — replaces the (otherwise-stale) parsedResumeData
  // prop after a job-title / summary / bullet fix so the preview's primary
  // field-resolution chain (contact.jobTitle, selected_summary, etc.) reads
  // the current text rather than the value the page loaded with.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [refreshedResumeData, setRefreshedResumeData] = React.useState<any | null>(null);

  const matchId: string | undefined =
    matchResults?.data?.id ??
    matchResults?.data?._id ??
    matchResults?.data?.match_id ??
    matchResults?.match_id;

  const resumeId: string | undefined =
    matchResults?.data?.resume_id ??
    matchResults?.resume_id ??
    parsedResumeData?.resume_id ??
    parsedResumeData?.parsed_data?.resume_id ??
    parsedResumeData?.data?.resume_id;

  // Live ATS score — updates when skills are added/removed
  const initialScore = Math.min(100, Math.max(0, parseFloat(String(matchResults?.data?.ats_score || "0"))));
  const [liveScore, setLiveScore] = React.useState<number>(initialScore);

  // Request queue for non-skill backend fixes (applyPenaltyFix / undoPenaltyFix).
  // Spaces calls to avoid 429s on the enhance/apply endpoint.
  const MIN_REQUEST_GAP_MS = 700;
  const MAX_429_RETRIES = 3;
  const requestQueueRef = React.useRef<Promise<unknown>>(Promise.resolve());
  const lastRequestAtRef = React.useRef<number>(0);
  const enqueueRequest = React.useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = async (): Promise<T> => {
      const gap = MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAtRef.current);
      if (gap > 0) await new Promise((resolve) => setTimeout(resolve, gap));
      for (let attempt = 0; ; attempt++) {
        try {
          lastRequestAtRef.current = Date.now();
          return await task();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          if (err?.response?.status === 429 && attempt < MAX_429_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
    };
    const result = requestQueueRef.current.then(run, run);
    requestQueueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, []);

  // Add a skill: update score locally from penalty (no backend call = no credit charge)
  // + parserAddSkills persists to resume doc for download
  const directAddSkill = React.useCallback(async (skill: string, _suggestion_id?: string, penalty?: number) => {
    const s = skill.trim();
    if (!s) return;
    setAddedSkillFields((prev) => prev.includes(s) ? prev : [...prev, s]);
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      if (existing.includes(s)) return prev;
      return { ...prev, skills: [...existing, s] };
    });
    if (penalty && penalty > 0) {
      setLiveScore((prev) => Math.min(100, prev + penalty));
    }
    if (resumeId) {
      try { await parserAddSkills(resumeId, s); } catch { /* best effort */ }
    }
  }, [resumeId]);

  // Remove a skill: update score locally from penalty (no backend call = no credit charge)
  // + parserRemoveSkills persists the change to resume doc
  const directRemoveSkill = React.useCallback(async (skill: string, _suggestion_id?: string, penalty?: number) => {
    const s = skill.trim();
    const resolvedId = suggestion_id ?? findSkillSuggestionId(matchResults, s);
    if (!matchId || !resolvedId) {
      toast.error(`Couldn't remove "${s}" — no matching suggestion for this match.`);
      return;
    }
    setAddedSkillFields((prev) => prev.filter((x) => x !== s));
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      return { ...prev, skills: existing.filter((x) => x !== s) };
    });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await enqueueRequest(() => matcherEnhanceRemove(matchId, resolvedId)) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = parseFloat(newScore);
        if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Failed to remove "${s}": ${err?.message || err}`);
    }
  }, [matchId, matchResults, enqueueRequest]);

  // Re-read the resume document so job-title / summary / bullet fixes (which
  // land directly on the resume, not on matchResults) show up in the preview
  // — same source of truth the PDF download already reads.
  const refreshResumeSections = React.useCallback(async () => {
    if (!resumeId) return;
    try {
      const fresh = await getResume(resumeId);
      setRefreshedResumeData(fresh);
      // buildSectionsFromParsedData only rebuilds the fixed predefined
      // sections — preserve any custom sections the user added locally
      // (editOverrides keys outside that fixed set) so they don't vanish
      // from the preview every time a penalty fix triggers a refresh.
      setResumeSections((prev) => {
        const rebuilt = buildSectionsFromParsedData(fresh);
        const customEntries = Object.entries(prev).filter(([k]) => !(k in rebuilt));
        return { ...rebuilt, ...Object.fromEntries(customEntries) };
      });
    } catch { /* keep existing local state on failure */ }
  }, [resumeId]);

  // Apply any non-skill fix (job title, summary rewrite, STAR/verb/experience
  // bullet rewrite) — the backend resolves what to do from suggestion_id alone.
  const applyPenaltyFix = React.useCallback(async (suggestion_id: string, category?: string) => {
    if (!matchId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await enqueueRequest(() => matcherEnhanceApply(matchId, suggestion_id)) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = parseFloat(newScore);
        if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
      }
      await refreshResumeSections();
      const target = category ? HIGHLIGHTABLE_FIX_FIELD[category] : undefined;
      if (target) {
        setExtraAddedFields((prev) => {
          const existing = prev[target.section] ?? [];
          if (existing.includes(target.field)) return prev;
          return { ...prev, [target.section]: [...existing, target.field] };
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Failed to apply fix: ${err?.message || err}`);
    }
  }, [matchId, refreshResumeSections, enqueueRequest]);

  // Undo a previously-applied non-skill fix.
  const undoPenaltyFix = React.useCallback(async (suggestion_id: string, category?: string) => {
    if (!matchId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await enqueueRequest(() => matcherEnhanceRemove(matchId, suggestion_id)) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = parseFloat(newScore);
        if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
      }
      await refreshResumeSections();
      const target = category ? HIGHLIGHTABLE_FIX_FIELD[category] : undefined;
      if (target) {
        setExtraAddedFields((prev) => {
          const existing = prev[target.section] ?? [];
          if (!existing.includes(target.field)) return prev;
          return { ...prev, [target.section]: existing.filter((f) => f !== target.field) };
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Failed to undo fix: ${err?.message || err}`);
    }
  }, [matchId, refreshResumeSections, enqueueRequest]);

  const handleDownload = React.useCallback(async () => {
    if (!resumeId) return;
    try { await downloadResumePdf(resumeId); } catch { /* silent */ }
  }, [resumeId]);

  const score = liveScore;

  // Merge newly-added skills back into parsedData so the template renders them.
  // Sources from the re-fetched resume (after a job-title/summary/bullet fix)
  // when available, falling back to the prop the page loaded with.
  const mergedParsedData = React.useMemo(() => {
    const source = refreshedResumeData ?? parsedResumeData;
    if (!addedSkillFields.length) return source;
    const base = source?.parsed_data ?? source ?? {};
    const existing: string[] = Array.isArray(base.skills)
      ? base.skills
      : Array.isArray(base.technical_skills)
      ? base.technical_skills
      : [];
    const merged = Array.from(new Set([...existing, ...addedSkillFields]));
    return { ...source, parsed_data: { ...base, skills: merged } };
  }, [parsedResumeData, refreshedResumeData, addedSkillFields]);

  const matchResult = matchResults?.data?.match_result ?? {};
  const techSkills   = matchResult?.Technical_Skills ?? {};
  const softSkills   = matchResult?.Soft_Skills ?? {};

  const matchedTechSkills: string[] = [
    ...(techSkills.matched_critical_skills ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.matched_important_skills ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.matched_nice_to_have    ?? []).map((s: { skill: string }) => s.skill),
  ];
  const missingTechSkills: string[] = [
    ...(techSkills.missing_critical_skills  ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.missing_important_skills ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.missing_nice_to_have     ?? []).map((s: { skill: string }) => s.skill),
  ];
  const matchedSoftSkills: string[] = softSkills.matched_skills ?? [];
  const missingSoftSkills: string[] = softSkills.missing_skills ?? [];
  const capSkills   = matchResult?.Capabilities_Check ?? {};
  const certSkills  = matchResult?.Certifications_Check ?? {};
  const jobTitle    = matchResult?.Job_Title_Check ?? {};
  const starCheck   = matchResult?.STAR_Pattern_Check ?? {};

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

  const totalMatchedCount = matchedTechSkills.length + matchedSoftSkills.length;
  const totalMissingCount = missingTechSkills.length + missingSoftSkills.length;

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

  // Custom-section display labels, keyed by id — the preview template can't
  // derive a human label from a "custom_171..." id on its own.
  const customSectionLabels = React.useMemo(
    () => Object.fromEntries(customSections.map((c) => [c.id, c.label])),
    [customSections]
  );

  // All sections in the active list (predefined + custom)
  const allActiveSections = [
    ...activePredefined,
    ...customSections.filter((c) => activeSectionIds.includes(c.id)).map((c) => ({
      id: c.id, label: c.label, icon: AlignLeft, hasAI: false,
    })),
  ];

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] min-h-0 w-full flex-col overflow-hidden bg-[#f5f7fa]">
      <style>{`
        .jobmatch-report-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .jobmatch-report-scroll::-webkit-scrollbar-track { background: transparent; }
        .jobmatch-report-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border: 2px solid transparent; background-clip: padding-box; border-radius: 999px; }
        .jobmatch-report-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; background-clip: padding-box; }
      `}</style>
      <div className="jobmatch-report-scroll grid min-h-0 flex-1 grid-cols-1 items-start gap-x-6 gap-y-6 overflow-y-auto bg-[#f7f8fa] px-4 pb-10 pt-4 sm:px-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,.72fr)] xl:px-8 xl:pt-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#94a3b8 transparent" }}>

        <section className="flex min-h-12 flex-wrap items-center gap-3 xl:col-span-2 xl:gap-4" aria-labelledby="match-report-title">
          <button type="button" onClick={onBackToUpload} className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to scans</button>
          <span className="h-5 w-px bg-slate-200" />
          <div>
            <h1 id="match-report-title" className="text-base font-extrabold tracking-[-0.02em] text-slate-950">Match report</h1>
            <p className="text-xs text-slate-500">Resume evidence compared with the role</p>
          </div>
          <div className="hidden flex-1 sm:block" />
          <button type="button" onClick={handleDownload} aria-label="Download resume" disabled={!resumeId || isSavingSection} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" aria-pressed={isEditMode} onClick={() => setIsEditMode((value) => !value)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><Pencil className="h-4 w-4" aria-hidden="true" /> {isEditMode ? "Close editor" : "Edit resume"}</button>
          {totalMissingCount > 0 && <button type="button" onClick={() => document.getElementById("jobmatch-improvements")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2557a7] px-4 text-sm font-bold text-white shadow-[0_8px_18px_-12px_rgba(37,87,167,.8)] hover:bg-[#1e4b94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><Sparkles className="h-4 w-4" aria-hidden="true" /> Review top fixes</button>}
        </section>

        {/* LEFT — Section list sidebar (edit mode only) — fixed overlay, does not disturb layout */}
        {isEditMode && (
          <>
            {/* Backdrop blur — only within the content area */}
            <div
              className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsEditMode(false)}
            />
          <div className="absolute top-0 left-0 h-full z-50 w-[320px] bg-white border-r border-gray-100 overflow-y-auto flex flex-col animate-slide-in-left shadow-2xl" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            {/* Sidebar Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0">
              <button
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-[#2557a7] mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Preview
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-[#2557a7]" />
                <div>
                  <p className="text-[16px] font-bold text-gray-900">Resume Sections</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click a section to edit its content</p>
                </div>
              </div>
            </div>

            {/* Active sections */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Sections</p>
              {allActiveSections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setOpenSection(section.id)}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 text-gray-500 group-hover:text-[#2557a7] transition-all">
                      <section.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-700 group-hover:text-[#2557a7] transition-colors">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {section.hasAI && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-violet-50 font-semibold text-violet-600 rounded-full border border-violet-100">
                        <RiSparkling2Fill size={10} className="mr-0.5" />AI
                      </span>
                    )}
                    <FaCheckCircle size={12} className="text-emerald-400" />
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-[#2557a7] transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Sections */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Add Sections</p>
              <div className="space-y-1.5">
                {additionalPredefined.map((section) => (
                  <div
                    key={section.id}
                    className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => addSection(section.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-blue-100 group-hover:border-blue-200 text-gray-400 group-hover:text-[#2557a7] transition-all">
                        <section.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-semibold text-gray-500 group-hover:text-[#2557a7]">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {section.hasAI && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-violet-50 font-semibold text-violet-600 rounded-full border border-violet-100">
                          <RiSparkling2Fill size={10} className="mr-0.5" />AI
                        </span>
                      )}
                      <Plus size={14} className="text-gray-300 group-hover:text-[#2557a7] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Sections */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Custom Sections</p>
              {showCustomInput ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") setShowCustomInput(false); }}
                    placeholder="e.g. Patents, Volunteer Work"
                    className="w-full px-3 py-2 text-[13px] border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={addCustomSection} className="flex-1 py-2 text-[12px] font-semibold bg-[#2557a7] text-white rounded-xl hover:bg-[#1f4e98] transition-colors">Add</button>
                    <button onClick={() => { setShowCustomInput(false); setCustomName(""); }} className="flex-1 py-2 text-[12px] font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold text-[#2557a7] border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Plus size={13} /> Add Custom Section
                </button>
              )}
            </div>
          </div>
          </>
        )}

        {/* CENTER — Resume Preview (always visible) */}
        <main className="min-w-0 space-y-5" aria-label="Resume and match overview">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]">
            {/* Toolbar */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FileText className="h-4 w-4" /></span>
                  <div><h2 className="text-sm font-extrabold text-slate-900">Resume preview</h2><p className="mt-0.5 text-[11px] text-slate-500">Current version used for this analysis</p></div>
                </div>
              </div>
            </div>
            <div className="max-h-[760px] overflow-auto bg-[#f5f6f8] p-5 sm:p-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}>
              {pdfError ? (
                <PDFPreviewError error={pdfError} />
              ) : (
                <ResumePreview
                  pdfBlobUrl={pdfBlobUrl}
                  pdfError={pdfError}
                  isLoading={isLoading}
                  isUpdating={isUpdating}
                  isDocx={isDocx}
                  docxBlob={docxBlob}
                  parsedData={mergedParsedData}
                  resumeId=""
                  addedFields={{ skills: addedSkillFields, ...extraAddedFields }}
                  editOverrides={resumeSections}
                  onEditSection={(key) => { setIsEditMode(true); setOpenSection(key); }}
                  onDeleteSection={(key) => { setDeletedSectionIds((prev) => [...prev, key]); setActiveSectionIds((prev) => prev.filter((id) => id !== key)); }}
                  deletedSections={deletedSectionIds}
                  customSectionLabels={customSectionLabels}
                />
              )}
            </div>

          </div>

        </main>

        {/* RIGHT — ATS Score + Job Description */}
        <aside className="min-w-0 space-y-5 xl:sticky xl:top-0 xl:row-span-2" aria-label="Job description evidence">

          <MatchScoreSummary matchScore={score} totalMissing={totalMissingCount} matchedSkills={totalMatchedCount} />

          {/* Job Description Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Briefcase className="h-4 w-4" /></span>
                <div><h2 className="text-sm font-extrabold text-slate-900">Job description</h2><p className="mt-0.5 text-[11px] text-slate-500">Requirements used for matching</p></div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(jdText);
                    toast.success("Job description copied");
                  } catch {
                    toast.error("Could not copy the job description");
                  }
                }}
                aria-label="Copy job description"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <FileText className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] font-semibold text-slate-600" aria-label="Highlight legend">
              <LegendSwatch color="bg-emerald-100" label="Matched" />
              <LegendSwatch color="bg-red-100" label="Missing — select to add" />
              <LegendSwatch color="bg-blue-100" label="Related capability" />
            </div>
            <div className="max-h-[760px] min-h-[520px] overflow-y-auto p-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#c5cbd3 transparent" }}>
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
                <p className="text-sm text-slate-500" role="status">No job description available</p>
              )}
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-8 border-t border-slate-200 pt-7" aria-label="Detailed match analysis">
          <ScoreBreakdown matchResult={matchResult} />
          <div id="jobmatch-improvements" className="scroll-mt-6 border-t border-slate-200 pt-7">
            <MatchPenalties matchResult={matchResult} onAddSkill={directAddSkill} onRemoveSkill={directRemoveSkill} onApplyFix={applyPenaltyFix} onUndoFix={undoPenaltyFix} />
          </div>
        </section>
      </div>

      {/* Section Editor Modal — popup with blur like Resume Builder */}
      {openSection && (
        <JobMatchSectionEditor
          sectionKey={openSection}
          sectionLabel={openSectionLabel}
          initialData={resumeSections[openSection] ?? []}
          onSave={(key, data) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setResumeSections((prev: Record<string, any>) => ({ ...prev, [key]: data }));
            setOpenSection(null);
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
              matcherUpdateSections(matchId, [{ sectionName: sectionLabel, items }])
                .then(() => toast.success(`${sectionLabel} saved — ready to download`))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .catch((err: any) => { console.error("[JobMatch] sections save failed", err); toast.error(`Failed to save ${sectionLabel}: ${err?.message || err}`); })
                .finally(() => setIsSavingSection(false));
            }
          }}
          onClose={() => setOpenSection(null)}
        />
      )}
    </div>
  );
}
