"use client";

import React from "react";
import ResumePreview from "../resume/ResumePreview";
import { AnalysisContentProps } from "../_types";
import {
  FileText, Download, Pencil, User, Briefcase, GraduationCap,
  Star, Award, ArrowLeft, ChevronRight, BookOpen, Trophy,
  Heart, Building2, Plus, Globe, AlignLeft, Users, X,
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { RiSparkling2Fill } from "react-icons/ri";
import JobMatchSectionEditor from "../resume/JobMatchSectionEditor";
import JDHighlighter from "../highlighter/JDHighlighter";
import { matcherEnhanceApply, matcherEnhanceRemove, downloadResumePdf, matcherUpdateSections, matchResumeAndJD } from "@/api/parserApi";
import { toast } from "sonner";
import ScoreBreakdown from "./ScoreBreakdown";
import MatchPenalties from "./MatchPenalties";
import JobMatchScoreGauge from "./JobMatchScoreGauge";

const ANALYSIS_DRAFT_KEY = "jm_analysisDraft";

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

export default function AnalysisContent({
  jdText,
  matchResults,
  parsedResumeData,
  onBackToUpload,
}: AnalysisContentProps) {
  // Lifted into state (rather than read straight off the prop) so a retried
  // match — see handleRetryMatch — can replace it without needing the parent
  // to re-render this component with new props.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveMatchResults, setLiveMatchResults] = React.useState<any>(matchResults);

  const matchId: string | undefined =
    liveMatchResults?.data?.id ??
    liveMatchResults?.data?._id ??
    liveMatchResults?.data?.match_id ??
    liveMatchResults?.match_id;
  const restoredDraft = React.useMemo(() => readAnalysisDraft(matchId), [matchId]);

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [isSavingSection, setIsSavingSection] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

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
  const askForNumber = React.useCallback((blankText?: string): Promise<string | null> => {
    return new Promise((resolve) => setNumberPromptState({ blankText, resolve }));
  }, []);

  // Track which skills were added (for green highlight in resume template)
  const [addedSkillFields, setAddedSkillFields] = React.useState<string[]>(() => restoredDraft?.addedSkillFields ?? []);

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

  const resumeId: string | undefined =
    liveMatchResults?.data?.resume_id ??
    liveMatchResults?.resume_id ??
    parsedResumeData?.resume_id ??
    parsedResumeData?.parsed_data?.resume_id ??
    parsedResumeData?.data?.resume_id;

  const jdId: string | undefined = liveMatchResults?.jd_id;

  const matchResult = liveMatchResults?.data?.match_result ?? {};
  const techSkills   = matchResult?.Technical_Skills ?? {};
  const softSkills   = matchResult?.Soft_Skills ?? {};
  const capSkills    = matchResult?.Capabilities_Check ?? {};
  const certSkills   = matchResult?.Certifications_Check ?? {};
  const jobTitle     = matchResult?.Job_Title_Check ?? {};
  const starCheck    = matchResult?.STAR_Pattern_Check ?? {};

  // Live ATS score — updates when skills are added/removed
  const initialScore = Math.min(100, Math.max(0, parseFloat(String(liveMatchResults?.data?.ats_score || "0"))));
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
      };
      sessionStorage.setItem(ANALYSIS_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [matchId, resumeSections, activeSectionIds, deletedSectionIds, customSections, addedSkillFields, highlightFields, liveScore]);

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
    if (!matchId || !resolvedSuggestionId) return true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await runSerially(() => matcherEnhanceApply(matchId, resolvedSuggestionId)) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = parseFloat(newScore);
        if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
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

  // Apply a non-skill fix (job title / summary / bullet rewrite) — these are
  // resolved entirely server-side from suggestion_id, so unlike skills there's
  // no separate "target" to persist; we just mirror the resulting text change
  // locally so the live preview matches what the backend wrote to the resume.
  const applyTextFix = React.useCallback(async (suggestion_id: string, category: string): Promise<boolean> => {
    if (!matchId || !suggestion_id) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: any;
    try {
      res = await runSerially(() => matcherEnhanceApply(matchId, suggestion_id));
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      // The AI deliberately leaves a metric blank ("...deployment of n+
      // features") rather than invent a number — the backend refuses to
      // apply until the real value is supplied (409 "needs_value"). Prompt
      // for it and retry once instead of failing outright.
      if (err?.response?.status === 409 && err?.response?.data?.error === "needs_value") {
        const blankText: string | undefined = err.response.data?.text?.[0];
        const answer = await askForNumber(blankText);
        const numeric = answer?.trim().replace(/,/g, "");
        if (!numeric || !/^\d+(\.\d+)?$/.test(numeric)) {
          if (answer !== null) toast.error("Please enter a plain number, e.g. 20.");
          return false;
        }
        try {
          res = await runSerially(() => matcherEnhanceApply(matchId, suggestion_id, "manual", numeric));
        } catch {
          toast.error("Couldn't apply this fix. Please try again.");
          return false;
        }
      } else {
        const isRateLimited = err?.response?.status === 429;
        toast.error(
          isRateLimited
            ? "Applying fixes too fast — wait a few seconds and try this one again."
            : "Couldn't apply this fix. Please try again."
        );
        return false;
      }
    }

    const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
    if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
    else if (typeof newScore === "string") {
      const n = parseFloat(newScore);
      if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
    }

    if (res?.applied === false) {
      toast.info(res?.message || "Nothing to update for this suggestion yet.");
      return false;
    }

    const penalties = matchResult?.Match_Penalties?.penalties ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const penalty = penalties.find((p: any) => p.suggestion_id === suggestion_id);

    if (category === "job_title") {
      const newTitle = penalty?.target || jobTitle?.jd_title;
      if (newTitle) {
        setResumeSections((prev: Record<string, unknown>) => ({
          ...prev,
          contact: { ...(prev.contact as Record<string, unknown> ?? {}), jobTitle: newTitle },
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
      const after = weak?.improved || penalty?.after_example;
      if (before && after && before !== after) {
        const result = replaceBulletText(resumeSections, before, after);
        if (result.changed.length) {
          setResumeSections(result.sections);
          result.changed.forEach((c) => markHighlighted(c.section, String(c.idx)));
        }
      }
    }

    return true;
  }, [matchId, matchResult, jobTitle, starCheck, resumeSections, markHighlighted, runSerially, askForNumber]);

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
    if (!matchId || !resolvedSuggestionId) return true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await matcherEnhanceRemove(matchId, resolvedSuggestionId) as any;
      const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
      if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
      else if (typeof newScore === "string") {
        const n = parseFloat(newScore);
        if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
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
  }, [matchId, findSkillSuggestionId, addedSkillFields]);

  const [isRetryingMatch, setIsRetryingMatch] = React.useState(false);

  // Re-runs the match with force_refresh=true, bypassing the backend's
  // (resume+jd+version) result cache — a plain retry without that flag would
  // just re-fetch the same cached response, including whichever sub-check
  // (e.g. Soft_Skills) crashed the first time.
  const handleRetryMatch = React.useCallback(async () => {
    if (!resumeId || !jdId || isRetryingMatch) return;
    setIsRetryingMatch(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchResp = await matchResumeAndJD(resumeId, jdId, { force_refresh: true }) as any;
      const finalMatchData = matchResp?.data;
      if (!finalMatchData) throw new Error("Empty match response");
      const updated = {
        ...liveMatchResults,
        data: finalMatchData,
        match_id: matchResp?.match_id ?? finalMatchData?.match_id,
      };
      setLiveMatchResults(updated);
      const newScore = Math.min(100, Math.max(0, parseFloat(String(finalMatchData?.ats_score ?? liveScore))));
      setLiveScore(newScore);
      try { sessionStorage.setItem("jm_matchResults", JSON.stringify(updated)); } catch {}
      toast.success("Match re-checked.");
    } catch {
      toast.error("Couldn't re-run the match. Please try again.");
    } finally {
      setIsRetryingMatch(false);
    }
  }, [resumeId, jdId, isRetryingMatch, liveMatchResults, liveScore]);

  const handleDownload = React.useCallback(async () => {
    if (!resumeId || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadResumePdf(resumeId, undefined, matchId);
      toast.success("Resume downloaded");
    } catch {
      toast.error("Couldn't download your resume. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [resumeId, matchId, isDownloading]);

  const score = liveScore;

  // Merge newly-added skills back into parsedData so the template renders them
  const mergedParsedData = React.useMemo(() => {
    if (!addedSkillFields.length) return parsedResumeData;
    const base = parsedResumeData?.parsed_data ?? parsedResumeData ?? {};
    const existing: string[] = Array.isArray(base.skills)
      ? base.skills
      : Array.isArray(base.technical_skills)
      ? base.technical_skills
      : [];
    const merged = Array.from(new Set([...existing, ...addedSkillFields]));
    return { ...parsedResumeData, parsed_data: { ...base, skills: merged } };
  }, [parsedResumeData, addedSkillFields]);

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
      if (p.category === "job_title") {
        if (!(highlightFields.contact ?? []).includes("title")) add("contact", "title");
      } else if (p.category === "summary") {
        if (!(highlightFields.summary ?? []).includes("text")) add("summary", "text");
      } else {
        const before = p.before_example;
        const after = p.after_example;
        if (before && after && before !== after) {
          for (const hit of findPendingBulletItems(resumeSections, before)) {
            add(hit.section, String(hit.idx));
          }
        }
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
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-gray-50">
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #e5e7eb; }
      `}</style>
      <div className="flex flex-1 items-start">

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
        <div className="min-w-0 flex-1 space-y-5 bg-[#f3f6fa] px-4 py-4 sm:px-6 lg:px-7">
          <div>
          <div className="mt-0 mb-6 flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#5896d7,#2557a7)" }} />
            <h1 className="text-2xl font-bold uppercase text-[#2557a7]">Tailor Your Resume</h1>
          </div>
          <div className="bg-white rounded-xl border border-[#dce8fb] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(37,87,167,0.10)] flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[#e5ebf3] bg-white shrink-0">
              <div className="flex items-center gap-3">
                {onBackToUpload && (
                  <button
                    onClick={onBackToUpload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#2557a7] hover:bg-blue-50 rounded-lg border border-gray-200 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} disabled={!resumeId || isSavingSection || isDownloading} className="flex min-h-10 items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-gray-600 hover:text-[#2557a7] hover:bg-blue-50 rounded-lg border border-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> {isDownloading ? "Downloading..." : isSavingSection ? "Saving..." : "Download"}
                </button>
                <button
                  onClick={() => setIsEditMode((v) => !v)}
                  className={`flex min-h-10 items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-lg border transition-all ${isEditMode ? "bg-[#2557a7] text-white border-[#2557a7] hover:bg-[#1e4a96]" : "text-[#2557a7] border-[#b9cdec] hover:bg-blue-50"}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditMode ? "Close Editor" : "Edit"}
                </button>
              </div>
            </div>
            <div className="min-h-[34rem] bg-[#f3f6fa] p-4 sm:p-5">
              <div className="mx-auto max-w-[960px]" style={{ zoom: 0.94 }}>
              {/* This view always has parsedData synchronously from props —
                  there's no PDF/DOCX blob or async load here — so those
                  ResumePreview props are fixed no-ops rather than real state. */}
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
                pendingSkills={pendingSkills}
                pendingSoftSkills={pendingSoftSkills}
                pendingFields={pendingFields}
                editOverrides={resumeSections}
                onEditSection={(key) => { setIsEditMode(true); setOpenSection(key); }}
                onDeleteSection={(key) => { setDeletedSectionIds((prev) => [...prev, key]); setActiveSectionIds((prev) => prev.filter((id) => id !== key)); }}
                deletedSections={deletedSectionIds}
              />
              </div>
            </div>

          </div>
          </div>

          <ScoreBreakdown matchResult={matchResult} onRetryMatch={handleRetryMatch} isRetryingMatch={isRetryingMatch} />
          <MatchPenalties
            matchResult={matchResult}
            onAddSkill={directAddSkill}
            onRemoveSkill={directRemoveSkill}
            onApplyFix={applyTextFix}
            onOpenSection={(key) => setOpenSection(key)}
          />
        </div>

        {/* RIGHT — ATS Score + Job Description */}
        <div className="w-[clamp(440px,32vw,520px)] shrink-0" aria-hidden="true" />
        <aside
          className="fixed bottom-0 right-0 top-14 z-20 w-[clamp(440px,32vw,520px)] space-y-3 overflow-y-auto overscroll-contain border-l border-gray-200 bg-[#f6f8fc] p-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#94a3b8 transparent", scrollbarGutter: "stable" }}
          aria-label="Job match score and job description"
        >

          {/* ATS Score Card */}
          <div className="shrink-0 overflow-hidden rounded-xl border border-[#dce8fb] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(37,87,167,0.10)]">
            <div className="p-3">
              <p className="mb-1 text-left text-xl font-extrabold tracking-wide text-slate-900">
                YOUR JD MATCH SCORE
              </p>

              <div className="mb-2">
                <JobMatchScoreGauge value={score} />

              </div>
            </div>
          </div>

          {/* Job Description Card */}
          <div className="min-h-[28rem] overflow-hidden rounded-xl border border-[#dce8fb] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(37,87,167,0.10)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dce8fb]" style={{ background: "linear-gradient(135deg,#f0f5ff,#e8eef8)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#5896d7,#2557a7)" }} />
                <p className="text-[12px] font-bold text-[#1e3a6e] uppercase tracking-widest">Job Description</p>
              </div>
              <button
                onClick={() => { try { navigator.clipboard.writeText(jdText); } catch {} }}
                className="flex min-h-9 items-center gap-1.5 rounded-lg border border-[#c7d9f5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#2557a7] shadow-sm transition-all hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
              >
                <FileText className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="break-words p-5 text-[14px] leading-6">
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
        </aside>
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
                    const n = parseFloat(newScore);
                    if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
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

      {/* Fill-in-the-blank prompt — see askForNumber above */}
      {numberPromptState && (
        <div
          className="fixed inset-0 z-1200 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { numberPromptState.resolve(null); setNumberPromptState(null); }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
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
            <label className="mb-1 block text-[12px] font-semibold text-gray-700">
              This fix needs a real number to replace the blank — e.g. 20
            </label>
            <input
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
                className="rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#2557a7] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
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
