"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  User,
  GraduationCap,
  Briefcase,
  FolderOpen,
  Zap,
  Award,
  AlignLeft,
  Building2,
  Tag,
  LayoutTemplate,
  BookOpen,
  ScanLine,
  Lightbulb,
  Trophy,
  TrendingUp,
} from "lucide-react";
import ATSResumePreview from "@/app/(resume)/atslogin/_components/ATSResumePreview";


const API_BASE = process.env.NEXT_PUBLIC_SERVER_URL || '';
const PREVIEW_BASE = `${API_BASE}/api/v1`;

/* ─── TYPES ───────────────────────────────────────────── */
interface BreakdownItem {
  score?: number;
  raw_score?: number;
  max?: number;
  max_score?: number;
  max_raw_score?: number;
  deductions?: unknown[];
  percentage?: number;
  Percentage?: number;
  details?: Record<string, unknown>;
}

interface ResumeScoreData {
  TotalScore: number;
  FinalWeightedScore: number;
  MaxScore: number;
  Breakdown: Record<string, unknown>;
  Fresher: boolean;
  Domain: string;
  Profile: string;
}

interface IssueCard {
  id: string;
  priority: "critical" | "urgent" | "optional";
  section: string;
  description: string;
  suggestion: string;
}

/* ─── HELPERS ─────────────────────────────────────────── */
function transformData(raw: Record<string, unknown>): ResumeScoreData {
  const atsScore = raw?.ats_score as Record<string, unknown> | undefined;

  const sectionBreakdown = (
    atsScore?.SectionBreakdown ||
    atsScore?.section_breakdown ||
    {}
  ) as Record<string, unknown>;

  const numericBreakdown = (
    atsScore?.breakdown ||
    atsScore?.Breakdown ||
    raw?.breakdown ||
    {}
  ) as Record<string, unknown>;

  // Build section map from ats_display.sections (new API format fallback)
  const atsDisplayRaw = raw?.ats_display as {
    score?: number;
    sections?: Array<{
      name: string;
      score_pct: number;
      weighted_pts: number;
      max_pts: number;
      is_not_applicable: boolean;
      deductions: unknown[];
    }>;
    action_items?: Record<string, Array<{ id: string; after_example: string; fix_type?: string; impact?: string }>>;
  } | undefined;

  const atsDisplaySections: Record<string, BreakdownItem> = {};
  if (atsDisplayRaw?.sections) {
    for (const s of atsDisplayRaw.sections) {
      if (!s.is_not_applicable) {
        atsDisplaySections[s.name] = {
          percentage: s.score_pct,
          max_score: s.max_pts,
          raw_score: s.weighted_pts,
          deductions: s.deductions || [],
        };
      }
    }
  }

  const numericKeyword = Number(atsScore?.keyword_score ?? numericBreakdown.keywords ?? 0);
  const numericFormat  = Number(atsScore?.format_score  ?? numericBreakdown.formatting ?? 0);

  function getSection(keys: string[], numericPct: number, maxRaw: number): BreakdownItem {
    for (const k of keys) {
      const v = sectionBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    // Fallback to ats_display.sections (new API format)
    for (const k of keys) {
      const v = atsDisplaySections[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    for (const k of keys) {
      const v = numericBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    if (numericPct > 0) return { percentage: numericPct, deductions: [] };
    return { raw_score: 0, max_raw_score: maxRaw, deductions: [] };
  }

  const scoreFromAtsDisplay = Number((raw?.ats_display as { score?: number } | undefined)?.score ?? 0);
  const scoreFromStorage = Number(raw?.finalWeightedScore) || 0;
  const scoreFromAts = Number(
    atsScore?.FinalScore ??
    atsScore?.final_score ??
    atsScore?.Percentage ??
    atsScore?.percentage ??
    atsScore?.overall_score ??
    atsScore?.total_score ??
    atsScore?.score ??
    atsScore?.TotalScore ??
    0
  );
  const score = scoreFromAtsDisplay || scoreFromStorage || scoreFromAts;

  return {
    TotalScore: score,
    FinalWeightedScore: score,
    MaxScore: 100,
    Breakdown: {
      Contact:          getSection(["Contact",          "contact"],                                                          0,             5),
      Headline:         getSection(["Headline",         "headline"],                                                         0,             0),
      Education:        getSection(["Education",        "education"],                                                        0,             15),
      Experience:       getSection(["Experience",       "experience", "WorkExperience"],                                     0,             0),
      Projects:         getSection(["Projects",         "projects"],                                                         0,             20),
      Skills:           getSection(["Skills",           "skills"],                                                           numericKeyword, 20),
      Certifications:   getSection(["Certifications",   "certifications"],                                                   0,             10),
      Summary:          getSection(["Summary",          "summary"],                                                          0,             5),
      Formatting:       getSection(["Formatting",       "formatting", "FormattingEnhanced", "Format", "format"],             numericFormat, 10),
      Internships:      getSection(["Internships",      "internships"],                                                      0,             10),
      ContentQuality:   getSection(["ContentQuality",   "content_quality", "Content Quality", "Readability", "readability", "content"], 0, 15),
      ATSCompatibility: getSection(["ATSCompatibility", "ats_compatibility", "ATS Compatibility", "ats"],                   0,             5),
      Keywords:         getSection(["Keywords",         "keywords"],                                                         numericKeyword, 30),
      LengthScore:      getSection(["LengthScore",      "length_score"],                                                     0,             10),
      StructureScore:   getSection(["StructureScore",   "structure_score"],                                                  0,             20),
      Leadership:       getSection(["Leadership",       "leadership"],                                                       0,             4),
      CareerProgression:getSection(["CareerProgression","career_progression", "Career Progression"],                         0,             0),
      Suggestions:      (atsScore?.suggestions as unknown[]) || (atsScore?.Suggestions as unknown[]) || (numericBreakdown.Suggestions as unknown[]) || [],
    },
    ...(() => {
      const parsedOverallExp = (raw?.parsed_data as Record<string, unknown> | undefined)
        ?.llm_data as Record<string, unknown> | undefined;
      const overallExp = parsedOverallExp?.overall_experience as Record<string, unknown> | undefined;
      const isFresherFromParser = typeof overallExp?.is_fresher === "boolean" ? overallExp.is_fresher : null;
      const isFresherLegacy = !!(raw?.Fresher ?? atsScore?.Fresher) || (atsScore?.profile as string) === "Fresher";
      const isFresher = isFresherFromParser !== null ? isFresherFromParser : isFresherLegacy;
      const atsProfile = atsScore?.profile as string | undefined;
      return {
        Fresher: isFresher,
        Domain: (raw?.Domain as string) || (atsScore?.Domain as string) || "General",
        Profile: isFresher
          ? "Fresher"
          : (atsProfile && atsProfile !== "Fresher" ? atsProfile : "General"),
      };
    })(),
  };
}

function getSuggestion(section: string, description: string): string {
  const d = description.toLowerCase();
  if (section === "Skills") {
    if (d.includes("not demonstrated") || d.includes("listed but")) return "Add this skill to a project or internship bullet — e.g. 'Built X using [skill]' — so it appears in context, not just the skills list.";
    if (d.includes("soft skill") || d.includes("no soft")) return "Add 3 soft skills (e.g. Communication, Problem Solving, Leadership) in a dedicated Soft Skills section.";
    if (d.includes("missing") || d.includes("no ")) return "Add this skill explicitly in your Skills section using the exact term from job postings.";
    return "Expand your Skills section with tools and technologies from the target job description.";
  }
  if (section === "Keywords") {
    if (d.includes("density") || d.includes("overlap")) return "Mirror exact phrases from the job posting. If the JD says 'CI/CD pipelines', use that exact phrase — not just 'CI/CD'.";
    return "Add missing keywords from the job description verbatim — ATS matches exact phrases, not synonyms.";
  }
  if (section === "Summary") {
    if (d.includes("short") || d.includes("23 word") || d.includes("too short")) return "Expand to 3–5 sentences: include your job title, years of experience, 2–3 top skills, and one career highlight.";
    if (d.includes("objective") || d.includes("challenging position") || d.includes("reputed")) return "Replace generic objective with a targeted professional summary. Start with: '[Title] with [X] years of experience in [domain]...'";
    if (d.includes("technical skill") || d.includes("no mention")) return "Weave 2–3 of your top technical skills directly into the summary paragraph — not just in the skills section.";
    return "Rewrite your summary to include your exact job target, years of experience, and 2–3 measurable strengths.";
  }
  if (section === "Experience") {
    if (d.includes("metric") || d.includes("number") || d.includes("quantif")) return "Add at least one number to each bullet — team size, % improvement, revenue, users, or time saved.";
    if (d.includes("action verb") || d.includes("passive") || d.includes("responsible")) return "Replace 'Responsible for' and 'Worked on' with strong action verbs: Engineered, Reduced, Led, Shipped, Increased.";
    if (d.includes("0%") || d.includes("missing") || d.includes("no experience")) return "Add your internships or projects in an Experience section — even a 1-month role counts.";
    return "Strengthen each bullet with an action verb + specific result. Format: '[Verb] [what you did] resulting in [outcome]'.";
  }
  if (section === "Education") {
    if (d.includes("grade") || d.includes("percentage") || d.includes("gpa")) return "Add your grade/percentage/GPA next to the degree. Format: 'B.Tech in CSE — 8.2 CGPA (2021–2025)'.";
    if (d.includes("passed out") || d.includes("year")) return "Add your graduation year next to the degree name. ATS requires a date to parse the entry correctly.";
    return "Complete your education entry: degree name, institution, year, and grade/CGPA on a single line.";
  }
  if (section === "Contact") {
    if (d.includes("linkedin")) return "Add your LinkedIn URL in the contact section. Format: linkedin.com/in/your-name. Recruiters verify your profile before reaching out.";
    if (d.includes("phone") || d.includes("mobile")) return "Add a mobile number with country code. Recruiters use phone for shortlisted candidates.";
    if (d.includes("email")) return "Use a professional email (firstname.lastname@gmail.com). Avoid nicknames or numbers.";
    return "Complete your contact section: name, email, phone, city, and LinkedIn URL on one line.";
  }
  if (section === "Formatting") {
    if (d.includes("page") || d.includes("long") || d.includes("2 page")) return "Trim to 1 page for under 3 years of experience. Remove older education entries and redundant skill repetitions.";
    if (d.includes("table") || d.includes("column") || d.includes("graphic")) return "Remove tables and multi-column layouts. ATS parsers read left-to-right, single column only.";
    return "Use a clean single-column layout with standard section headings. Avoid text boxes, borders, and graphics.";
  }
  if (section === "ContentQuality") {
    if (d.includes("replace") || d.includes("aimed") || d.includes("suggested")) return "Rewrite this bullet with a specific achievement. Use: '[Action verb] [what] for [who], resulting in [measurable outcome]'.";
    if (d.includes("strong debug") || d.includes("problem solv")) return "Demonstrate this skill with a concrete example: 'Debugged [X] issue that reduced error rate by Y%' rather than claiming it abstractly.";
    return "Replace vague phrases with specific, measurable achievements. Every bullet should answer: what did you do and what was the result?";
  }
  if (section === "Certifications") {
    if (d.includes("not relevant") || d.includes("domain")) return "Add certifications aligned with your target role — e.g. AWS, Google Cloud, or HackerRank for tech roles.";
    return "Include the certifying body and year: 'AWS Certified Solutions Architect – AWS (2024)'.";
  }
  if (section === "Projects") {
    if (d.includes("generic") || d.includes("description")) return "Add: the problem solved, tech stack used, your specific contribution, and a result — e.g. 'Reduced load time by 40%'.";
    return "Each project needs: title, tech stack, your role, and one measurable outcome. One line minimum per project.";
  }
  if (section === "Internships") {
    if (d.includes("missing") || d.includes("date")) return "Add start and end dates to your internship. Format: 'Company Name — Role (Mon YYYY – Mon YYYY)'.";
    return "Add 2–3 bullet achievements to each internship entry with action verbs and numbers where possible.";
  }
  if (section === "ATSCompatibility") {
    return "Use standard section headings (Education, Experience, Skills). Avoid PDFs with embedded fonts or scanned images.";
  }
  return "Address this issue to strengthen the overall quality and ATS compatibility of your resume.";
}

/* Robustly extract a human-readable text string from a deduction/suggestion item.
   Handles: JSON strings, objects with various field names, suggested_keywords arrays. */
function extractText(raw: unknown): string {
  // If it's a JSON string, parse it first
  let item: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try { item = JSON.parse(trimmed); } catch { return raw; }
    } else {
      return raw; // plain string — use as-is
    }
  }

  if (typeof item !== "object" || item === null) return String(item);

  const obj = item as Record<string, unknown>;

  // Ordered preference for text fields across both old and new API formats
  for (const key of ["after_example", "message", "description", "after", "title", "fix_text"]) {
    if (typeof obj[key] === "string" && (obj[key] as string).length > 0) {
      return obj[key] as string;
    }
  }

  // Special case: keywords gap — build a readable string from suggested_keywords
  if (Array.isArray(obj.suggested_keywords) && (obj.suggested_keywords as unknown[]).length > 0) {
    const kws = (obj.suggested_keywords as unknown[]).slice(0, 5).join(", ");
    return `Add missing keywords to your resume: ${kws}`;
  }

  // No usable text field found
  return "";
}

// Maps legacy/lowercase suggestion section names → canonical Breakdown keys
const SUGGESTION_SECTION_MAP: Record<string, string> = {
  format: "Formatting", formatting: "Formatting",
  content: "ContentQuality", content_quality: "ContentQuality", "content quality": "ContentQuality",
  ats: "ATSCompatibility", ats_compatibility: "ATSCompatibility", "ats compatibility": "ATSCompatibility",
  keywords: "Keywords", skills: "Skills", summary: "Summary",
  contact: "Contact", education: "Education", experience: "Experience",
  projects: "Projects", certifications: "Certifications",
  internships: "Internships", leadership: "Leadership",
  career_progression: "CareerProgression", "career progression": "CareerProgression",
};

function extractIssues(breakdown: ResumeScoreData["Breakdown"]): IssueCard[] {
  const cards: IssueCard[] = [];
  let id = 0;
  const seen    = new Set<string>(); // section:key combos
  const seenIds = new Set<string>(); // global IDs — prevent cross-section duplicates

  Object.entries(breakdown).forEach(([section, data]) => {
    if (section === "Suggestions") return;
    if (section === "Formatting" && breakdown.FormattingEnhanced) return;

    const item = data as BreakdownItem;
    if (!item || typeof item !== "object") return;

    const directPct = item.Percentage ?? item.percentage;
    const max       = item.max_raw_score || item.max || item.max_score || 0;
    const itemScore = item.raw_score ?? item.score ?? 0;
    const pct       = typeof directPct === "number" ? directPct
                    : max > 0 ? (itemScore / max) * 100
                    : 100;
    const display   = section.replace(/Enhanced$/, "");

    (item.deductions || []).forEach((d: unknown) => {
      const dStr = extractText(d);
      if (!dStr) return;

      // Get stable ID for deduplication
      let dId = dStr;
      const parsed = typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return null; } })() : d;
      if (parsed && typeof parsed === "object" && typeof (parsed as Record<string, unknown>).id === "string") {
        dId = (parsed as Record<string, unknown>).id as string;
      }

      const key = `${display}:${dId}`;
      if (seen.has(key) || seenIds.has(dId)) return;
      seen.add(key);
      seenIds.add(dId);
      cards.push({
        id:          `i-${id++}`,
        priority:    pct === 0 || section === "Experience" ? "critical" : pct < 80 ? "urgent" : "optional",
        section:     display,
        description: dStr,
        suggestion:  getSuggestion(display, dStr),
      });
    });

    if (item.details) {
      const d = item.details;
      if (d.grammar_errors) {
        const key = `${display}:grammar`;
        if (!seen.has(key)) {
          seen.add(key);
          cards.push({ id: `i-${id++}`, priority: "urgent", section: display, description: `${d.grammar_errors} grammar error(s) detected`, suggestion: "Proofread and correct all grammar mistakes." });
        }
      }
      if (d.spelling_errors) {
        const key = `${display}:spelling`;
        if (!seen.has(key)) {
          seen.add(key);
          cards.push({ id: `i-${id++}`, priority: "urgent", section: display, description: `${d.spelling_errors} spelling error(s) detected`, suggestion: "Fix spelling errors for a professional impression." });
        }
      }
    }
  });

  const suggestions = breakdown.Suggestions as unknown[] | undefined;
  if (Array.isArray(suggestions)) {
    suggestions.forEach((s: unknown) => {
      const isObj = typeof s === "object" && s !== null;
      const sObj = isObj ? s as Record<string, unknown> : null;
      const suggId = sObj && typeof sObj.id === "string" ? sObj.id : "";

      if (
        suggId.startsWith("suggested_summary_") ||
        /_suggested_contribution_\d+$/.test(suggId)
      ) return;

      // Skip if this ID was already rendered from a section's deductions
      if (suggId && seenIds.has(suggId)) return;

      const description = extractText(s);
      if (!description) return;

      const rawSection = sObj && typeof sObj.section === "string" ? sObj.section : "General";
      // Normalize legacy/lowercase section names to canonical Breakdown keys
      const sectionName = SUGGESTION_SECTION_MAP[rawSection.toLowerCase()] ?? SUGGESTION_SECTION_MAP[rawSection] ?? rawSection;
      const dedupeId = suggId || description;
      const key = `${sectionName}:${dedupeId}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (suggId) seenIds.add(suggId);
      cards.push({ id: `i-${id++}`, priority: "optional", section: sectionName, description, suggestion: getSuggestion(sectionName, description) });
    });
  }

  return cards;
}

/* ─── WHY TOOLTIP ─────────────────────────────────────── */
function WhyTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={e => e.stopPropagation()}
    >
      <span style={{
        fontSize: 10, fontWeight: 700, color: "#94a3b8",
        border: "1px solid #e2e8f0", borderRadius: 6,
        padding: "2px 6px", cursor: "default", userSelect: "none",
        transition: "all 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = "#3465BC"; (e.currentTarget as HTMLSpanElement).style.borderColor = "rgba(52,101,188,0.3)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = "#94a3b8"; (e.currentTarget as HTMLSpanElement).style.borderColor = "#e2e8f0"; }}
      >
        WHY?
      </span>
      {show && (
        <span
          className="absolute bottom-full right-0 mb-2.5 w-72 rounded-2xl px-4 py-3.5 text-[12px] leading-relaxed text-white z-50 pointer-events-none block"
          style={{ background: "#0f172a", boxShadow: "0 20px 60px rgba(0,0,0,0.25), 4px 4px 0px rgba(15,23,42,0.5)" }}
        >
          {text}
          <span
            className="absolute top-full right-3 block"
            style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0f172a" }}
          />
        </span>
      )}
    </span>
  );
}

/* ─── ISSUE CARD ──────────────────────────────────────── */
function IssueCard({
  issue, Icon, onDismiss, onFix,
}: {
  issue: IssueCard; Icon: React.ElementType; onDismiss: () => void; onFix: () => void;
}) {
  const SECTION_IMPACT: Record<string, number> = {
    Keywords: 20, Skills: 18, Experience: 16, Summary: 14,
    ContentQuality: 12, ATSCompatibility: 10, Formatting: 9,
    Education: 8, Certifications: 7, Projects: 7,
    Contact: 6, Internships: 5, General: 4,
  };

  const isCritical = issue.priority === "critical";
  const isUrgent   = issue.priority === "urgent";
  const fixBtnColor = "#3465BC";

  const rawPts    = SECTION_IMPACT[issue.section] ?? 5;
  const impactPts = isCritical ? rawPts : isUrgent ? Math.floor(rawPts * 0.65) : Math.floor(rawPts * 0.35);

  const raw   = issue.description;
  const cut   = raw.search(/[.!?]\s/);
  const title = cut > 0 && cut < 90 ? raw.slice(0, cut + 1) : raw.slice(0, 88) + (raw.length > 88 ? "…" : "");

  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative rounded-2xl transition-all duration-150 cursor-default"
      style={{
        background: "#ffffff",
        border: "1px solid #e8ecf0",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-5 pt-5 pb-5">
        {/* Row 1: icon + title + pts */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: isCritical ? "#fef2f2" : isUrgent ? "rgba(254,230,85,0.35)" : "rgba(52,101,188,0.07)",
            border: `1px solid ${isCritical ? "rgba(220,38,38,0.18)" : isUrgent ? "rgba(217,119,6,0.22)" : "rgba(52,101,188,0.15)"}`,
          }}>
            <Icon style={{ width: 16, height: 16, color: isCritical ? "#dc2626" : isUrgent ? "#F59E0B" : "#3465BC" }} />
          </div>
          <p className="text-[14px] font-bold text-gray-900 leading-snug flex-1">{title}</p>
          <span className="shrink-0 text-[11.5px] font-black whitespace-nowrap px-2.5 py-1 rounded-full"
            style={{ background: "rgba(52,101,188,0.08)", color: "#3465BC", border: "1px solid rgba(52,101,188,0.15)" }}>
            +{impactPts} pts
          </span>
        </div>

        {/* Suggestion box */}
        <div className="rounded-xl px-4 py-3.5 mb-3.5" style={{ background: "#f0f4ff", border: "1px solid rgba(52,101,188,0.12)" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>{issue.suggestion}</p>
        </div>

        {/* Fix Now button */}
        <button
          onClick={onFix}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-5 py-2.5 rounded-xl text-white transition-all active:scale-95"
          style={{
            background: fixBtnColor,
            border: `1.5px solid ${fixBtnColor}`,
            boxShadow: `0 2px 8px ${fixBtnColor}44`,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          Fix Now →
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dismiss on hover */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
        title="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ─── PRIORITY GROUP ──────────────────────────────────── */
function PriorityGroup({
  title, subtitle, accent, accentBg, issues, sectionIcons,
  onDismiss, onFix, tooltip,
}: {
  title: string; subtitle: string; accent: string; accentBg: string;
  issues: IssueCard[]; sectionIcons: Record<string, React.ElementType>;
  onDismiss: (id: string) => void;
  onFix: () => void; tooltip: string;
}) {
  const [open, setOpen] = useState(true);
  if (!issues.length) return null;

  return (
    <div className="mb-3">
      {/* Group header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accent, boxShadow: `0 0 0 3px ${accent}22` }} />
        <span className="text-[13.5px] font-extrabold flex-1 text-left" style={{ color: accent }}>{title}</span>
        <span className="text-[11.5px] hidden sm:block mr-1 font-medium" style={{ color: "#94a3b8" }}>{subtitle}</span>
        <WhyTooltip text={tooltip} />
        <span
          className="text-[11px] font-black px-2.5 py-0.5 rounded-full ml-0.5 min-w-[22px] text-center"
          style={{ background: accent, color: "white" }}
        >
          {issues.length}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-250 ml-0.5 shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ color: accent }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Animated body */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "5000px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="pt-3 pb-1 space-y-6">
          {(() => {
            const sectionMap = new Map<string, IssueCard[]>();
            for (const issue of issues) {
              if (!sectionMap.has(issue.section)) sectionMap.set(issue.section, []);
              sectionMap.get(issue.section)!.push(issue);
            }
            return Array.from(sectionMap.entries()).map(([section, sectionIssues]) => {
              const SectionIcon = sectionIcons[section] ?? Lightbulb;
              const label = section.replace(/([A-Z])/g, " $1").trim();
              return (
                <div key={section} id={`issue-section-${section}`} style={{ scrollMarginTop: "80px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: accentBg, border: `1px solid ${accent}22` }}>
                      <SectionIcon style={{ width: 12, height: 12, color: accent }} />
                    </div>
                    <span className="text-[10.5px] font-black tracking-[0.15em] uppercase" style={{ color: "#94a3b8" }}>{label}</span>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accent}30, transparent)` }} />
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: accentBg, color: accent, border: `1px solid ${accent}22` }}
                    >
                      {sectionIssues.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {sectionIssues.map(issue => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        Icon={SectionIcon}
                        onDismiss={() => onDismiss(issue.id)}
                        onFix={onFix}
                      />
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}

/* ─── BACK TO TOP ─────────────────────────────────────── */
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 999,
        width: 48, height: 48, borderRadius: "50%",
        background: "#ffffff", border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
        cursor: "pointer", transition: "all 0.25s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(52,101,188,0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(52,101,188,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; }}
    >
      <svg width="16" height="16" fill="none" stroke="#3465BC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 15l-6-6-6 6" />
      </svg>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.05em", color: "#3465BC", lineHeight: 1, textTransform: "uppercase" }}>TOP</span>
    </button>
  );
}

/* ─── MAIN REPORT ─────────────────────────────────────── */
function ATSLoginReport() {
  const router   = useRouter();
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [isFixing,  setIsFixing]  = useState(false);
  const [filter,       setFilter]       = useState<"all" | "critical" | "urgent" | "optional">("all");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedData,   setParsedData]   = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atsAnalysisData");
      if (raw) {
        const data = JSON.parse(raw);
        setScoreData(transformData(data));
        if (data?.parsed_data) {
          setParsedData(data);
        }
        const resumeId = data?.resume_id as string | undefined;
        if (resumeId) {
          setPreviewUrl(`${PREVIEW_BASE}/parser/preview/${resumeId}`);
        }
      }
    } catch { /* ignore */ }
    finally   { setLoading(false); }
  }, []);

  const issues = useMemo(() => scoreData ? extractIssues(scoreData.Breakdown) : [], [scoreData]);

  const grouped = useMemo(() => ({
    critical: issues.filter(i => i.priority === "critical" && !dismissedIds.has(i.id)),
    urgent:   issues.filter(i => i.priority === "urgent"   && !dismissedIds.has(i.id)),
    optional: issues.filter(i => i.priority === "optional" && !dismissedIds.has(i.id)),
  }), [issues, dismissedIds]);

  const allScoreItems = useMemo(() => {
    if (!scoreData) return [];
    const b   = scoreData.Breakdown;

    const calcPct = (key: string): number => {
      const item = b[key] as BreakdownItem;
      if (!item || typeof item !== "object") return -1;
      const directPct = item.Percentage ?? item.percentage;
      if (typeof directPct === "number") return Math.min(100, Math.round(directPct));
      const max = item.max_raw_score || item.max || item.max_score || 0;
      const s   = item.raw_score ?? item.score ?? 0;
      if (max > 0) return Math.min(100, Math.round((s / max) * 100));
      if (typeof item.score === "number" && item.score >= 0 && item.score <= 100) {
        return Math.round(item.score);
      }
      return -1;
    };

    const isRealSection = (key: string): boolean => {
      const item = b[key] as Record<string, unknown>;
      return !!item && ("percentage" in item || Number((item as BreakdownItem).raw_score) > 0);
    };

    return [
      "Contact","Headline","Education","Experience","Projects","Skills",
      "Certifications","Summary","Internships","Keywords",
      "Formatting","ContentQuality","ATSCompatibility","Leadership","CareerProgression","LengthScore","StructureScore",
    ]
      .filter(k => isRealSection(k))
      .map(k => ({ name: k, score: Math.max(0, calcPct(k)) }));
  }, [scoreData]);

  const pct = scoreData ? Math.min(100, Math.round(scoreData.FinalWeightedScore)) : 0;

  const sectionIssueCounts = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach(i => { map[i.section] = (map[i.section] ?? 0) + 1; });
    return map;
  }, [issues]);

  const issuesPanelRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((sectionName: string) => {
    const inCritical = grouped.critical.some(i => i.section === sectionName);
    const inUrgent   = grouped.urgent.some(i => i.section === sectionName);
    const inOptional = grouped.optional.some(i => i.section === sectionName);
    const target = inCritical ? "critical" : inUrgent ? "urgent" : inOptional ? "optional" : null;
    if (!target) return;
    setFilter(target);
    // Wait for React to re-render with the new filter, then scrollIntoView the section
    setTimeout(() => {
      const el = document.getElementById(`issue-section-${sectionName}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [grouped]);

  const handleFixNow = async () => {
    if (isFixing) return;
    try {
      const raw = localStorage.getItem("atsAnalysisData");
      if (!raw) { router.push("/builder/start"); return; }

      const d            = JSON.parse(raw) as Record<string, unknown>;
      const resumeId     = d.resume_id as string | undefined;
      const atsBreakdown = d.ats_breakdown_id as string | undefined;

      if (!resumeId) { router.push("/builder/start"); return; }

      setIsFixing(true);
      toast.loading("Preparing your resume for enhancement…", { id: "fix-now" });

      const enhanceResult = await enhanceResume({
        resume_id: resumeId,
        ...(atsBreakdown ? { ats_breakdown: atsBreakdown } : {}),
      });

      const enhancedResumeId = enhanceResult.enhanced_resume_id;

      // Cache the mapped data so ResumeContext loads it instantly on first render
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sourceData = (enhanceResult as any).enhanced_resume
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        || (enhanceResult as any).enhancer_state?.resume
        || {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData = mapParserOutputToBuilderData(sourceData as any);
      localStorage.setItem(
        "cached_resume_data",
        JSON.stringify({ resumeId: enhancedResumeId, data: { ...mappedData, id: enhancedResumeId } })
      );
      localStorage.setItem("current_resume_id", enhancedResumeId);

      // Track enhanced ID so the resume list page can find it
      const existingIds: string[] = JSON.parse(localStorage.getItem("enhanced_resume_ids") || "[]");
      if (!existingIds.includes(enhancedResumeId)) {
        localStorage.setItem("enhanced_resume_ids", JSON.stringify([...existingIds, enhancedResumeId]));
      }

      toast.dismiss("fix-now");
      router.push(`/builder/creation/${enhancedResumeId}?source=enhanced&from_ats=true`);
    } catch {
      toast.dismiss("fix-now");
      toast.error("Failed to open enhancer. Please try again.");
      setIsFixing(false);
    }
  };

  /* ── helpers ── */
  const gradeLabel  = pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Average" : "Needs Work";
  const gradeUpper  = gradeLabel.toUpperCase();
  const scoreColor  = pct >= 70 ? "#00A63E" : pct >= 40 ? "#F59E0B" : "#dc2626";
  const scoreLight  = pct >= 70 ? "#ECFDF5" : pct >= 40 ? "#FEF3C7" : "#fef2f2";
  const scoreBorder = pct >= 70 ? "#6EE7A0" : pct >= 40 ? "#FDE68A" : "#fca5a5";
  const ptsDiff     = Math.max(0, 90 - pct);

  const SECTION_ICONS: Record<string, React.ElementType> = {
    Contact: User, Headline: Tag, Education: GraduationCap, Experience: Briefcase,
    Projects: FolderOpen, Skills: Zap, Certifications: Award,
    Summary: AlignLeft, Internships: Building2, Keywords: Tag,
    Formatting: LayoutTemplate, ContentQuality: BookOpen,
    ATSCompatibility: ScanLine, Leadership: Trophy,
    CareerProgression: TrendingUp, General: Lightbulb,
  };

  const WHY_TEXT: Record<string, string> = {
    Keywords: "Keyword density directly determines your ATS match score. Resumes with less than 60% keyword overlap are typically auto-rejected.",
    Skills: "ATS systems scan for skill keywords matching the job description. Missing skills are the #1 reason resumes get filtered out.",
    Summary: "The summary is the first thing recruiters read. A weak or missing summary wastes your most valuable resume real estate.",
    Experience: "Work experience is the most weighted ATS section. Vague descriptions with no metrics score poorly against structured job requirements.",
    Education: "Incomplete education entries cause ATS parsing failures and signal poor attention to detail.",
    Contact: "ATS systems extract contact info to build your candidate profile. Missing fields prevent recruiter follow-up entirely.",
    Formatting: "Non-standard layouts — tables, columns, headers/footers — cause ATS parsers to misread or skip entire sections.",
    ContentQuality: "Grammar errors, passive voice, and filler phrases reduce readability scores and signal a lack of professionalism.",
    Certifications: "Certifications validate your skills and increase keyword density for technical roles.",
    Projects: "Projects prove applied skills, especially for candidates with limited work experience. Generic descriptions add no signal.",
    Internships: "Internship entries are evaluated the same way as full roles. Incomplete entries weaken the section.",
    ATSCompatibility: "Even a perfect resume gets rejected if the ATS cannot parse it. Compatibility issues are silent failures.",
    Leadership: "Leadership signals — Led, Managed, Coordinated — show ownership and initiative. Resumes without them score lower on impact.",
    CareerProgression: "Clear career growth shows ambition and consistency. Stagnant or unclear progression reduces your overall profile score.",
    General: "General improvements that strengthen overall readability and professionalism across all sections.",
  };

  const TAB_CONFIG = [
    { key: "all",      label: "All",            count: grouped.critical.length + grouped.urgent.length + grouped.optional.length },
    { key: "critical", label: "Fix First",       count: grouped.critical.length, color: "#dc2626" },
    { key: "urgent",   label: "High Impact",     count: grouped.urgent.length,   color: "#F59E0B" },
    { key: "optional", label: "Nice to Improve", count: grouped.optional.length, color: "#3465BC" },
  ] as const;

/* ── Loading ─────────────────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3465BC", borderTopColor: "transparent" }} />
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Analyzing your resume…</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Building your personalized report</p>
      </div>
    </div>
  );

  /* ── No data ─────────────────────── */
  if (!scoreData) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF", padding: "0 24px" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", background: "#fff", borderRadius: 20, padding: "48px 40px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <XCircle style={{ width: 32, height: 32, color: "#dc2626" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No Report Found</h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>Upload and scan your resume first to see your full ATS analysis.</p>
        <button onClick={() => router.push("/atslogin")} style={{ width: "100%", padding: "14px 24px", borderRadius: 12, background: "#3465BC", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RefreshCw style={{ width: 16, height: 16 }} /> Go to ATS Scanner
        </button>
      </div>
    </div>
  );

  /* ── Report ──────────────────────── */
  const CARD = { background: "#fff", borderRadius: 16, border: "1px solid #e5eaf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden" as const };

  return (
    <div style={{ minHeight: "100vh", background: "#EFF6FF" }}>
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── PAGE HEADER ── */}
      <div className="px-4 md:px-10 py-5 md:py-6 border-b border-[#dce8fb]" style={{ background: "#EFF6FF" }}>
        <div style={{ maxWidth: 1520, margin: "0 auto" }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 4, height: 18, borderRadius: 99, background: "linear-gradient(180deg,#3465BC,#4f8ef7)" }} />
              <p style={{ fontSize: 10, fontWeight: 800, color: "#3465BC", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontFamily: "monospace", margin: 0 }}>
                ATS Resume Report
              </p>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              {pct >= 70 ? "Great score! Let’s make it perfect." : "Let’s fine-tune your resume."}
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8, fontWeight: 400 }}>
              We found <span style={{ fontWeight: 700, color: "#0f172a" }}>{issues.length} issues</span> affecting your ATS compatibility score.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>Your Score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{pct}</span>
                <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>/100</span>
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: "#dce8fb" }} />
            <span style={{ padding: "8px 20px", borderRadius: 99, background: scoreLight, color: scoreColor, border: `1.5px solid ${scoreBorder}`, fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {gradeUpper}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ maxWidth: 1520, margin: "0 auto" }} className="px-4 md:px-10 py-6 md:py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

          {/* ── LEFT (4 cols sticky) ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 self-start space-y-5">

            {/* Score card */}
            <div style={CARD}>
              <div style={{ padding: "22px 24px 20px" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Resume Check Score</p>

                {/* Score circle — centered, SaaS-grade */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
                  <div style={{ position: "relative", width: 172, height: 172 }}>
                    {/* Ambient glow */}
                    <div style={{
                      position: "absolute", inset: -14, borderRadius: "50%",
                      background: `radial-gradient(circle, ${scoreColor}1a 0%, transparent 68%)`,
                      filter: "blur(14px)", pointerEvents: "none",
                    }} />
                    <svg viewBox="0 0 200 200" width="172" height="172">
                      <defs>
                        <linearGradient id="scoreArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={scoreColor} stopOpacity="0.6"/>
                          <stop offset="100%" stopColor={scoreColor}/>
                        </linearGradient>
                      </defs>
                      {/* Outer decorative dashed orbit */}
                      <circle cx="100" cy="100" r="95" fill="none"
                        stroke={`${scoreColor}18`} strokeWidth="1.5" strokeDasharray="3 9"/>
                      {/* Track ring */}
                      <circle cx="100" cy="100" r="80" fill="none"
                        stroke="#edf0f5" strokeWidth="13" strokeLinecap="round"/>
                      {/* Progress arc */}
                      {pct > 0 && (
                        <circle cx="100" cy="100" r="80" fill="none"
                          stroke="url(#scoreArcGrad)" strokeWidth="13" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 80 * pct / 100} ${2 * Math.PI * 80}`}
                          transform="rotate(-90 100 100)"
                          style={{ filter: `drop-shadow(0 0 10px ${scoreColor}99)`, transition: "stroke-dasharray 0.9s ease" }}
                        />
                      )}
                      {/* End dot accent */}
                      {pct > 2 && (
                        <circle
                          cx={100 + 80 * Math.cos((Math.PI * 2 * pct / 100) - Math.PI / 2)}
                          cy={100 + 80 * Math.sin((Math.PI * 2 * pct / 100) - Math.PI / 2)}
                          r="5.5" fill={scoreColor}
                          style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
                        />
                      )}
                    </svg>
                    {/* Center label */}
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.18em", color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 1 }}>ATS Score</span>
                      <span style={{ fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: "-0.04em" }}>{pct}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#b0bac8", marginTop: 2 }}>/ 100</span>
                    </div>
                  </div>

                  {/* Grade + badge centered below */}
                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <p style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: 8, letterSpacing: "-0.02em" }}>{gradeUpper}</p>
                    <span style={{
                      display: "inline-block", fontSize: 10, fontWeight: 800,
                      padding: "5px 16px", borderRadius: 99,
                      background: scoreLight, color: scoreColor,
                      border: `1.5px solid ${scoreBorder}`,
                      textTransform: "uppercase" as const, letterSpacing: "0.1em",
                    }}>
                      Resume Strength
                    </span>
                    {ptsDiff > 0 && (
                      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10, lineHeight: 1.4 }}>
                        Fix issues to gain <span style={{ color: "#3465BC", fontWeight: 800 }}>+{ptsDiff} pts</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Primary CTA */}
                <button onClick={handleFixNow} disabled={isFixing}
                  style={{ width: "100%", padding: "14px 20px", borderRadius: 12, background: "linear-gradient(135deg,#2557a7,#1a3a8f)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: isFixing ? "not-allowed" : "pointer", marginBottom: 10, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(37,87,167,0.3)", opacity: isFixing ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!isFixing) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                  onMouseLeave={e => { if (!isFixing) (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
                  {isFixing ? "Preparing…" : "Fix My Resume →"}
                </button>
                <button onClick={() => router.push("/atslogin")}
                  style={{ width: "100%", padding: "11px 20px", borderRadius: 12, background: "transparent", color: "#3465BC", fontWeight: 700, fontSize: 13, border: "1.5px solid #dbeafe", cursor: "pointer", marginBottom: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#EFF6FF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  Upload &amp; Rescan
                </button>
              </div>

            </div>

            {/* Score Breakdown card */}
            <div style={CARD}>
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 19, fontWeight: 700, color: "#0f172a" }}>Score Breakdown</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Click a section to jump to its issues</p>
              </div>
              <div className="custom-scrollbar" style={{ padding: "12px 14px", maxHeight: 440, overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {allScoreItems.map(item => {
                    const count    = sectionIssueCounts[item.name] ?? 0;
                    const hasIssues = count > 0;
                    const label    = item.name.replace(/([A-Z])/g, " $1").trim();
                    const barColor = item.score >= 70 ? "#00A63E" : item.score >= 40 ? "#F59E0B" : "#dc2626";
                    const SIcon    = SECTION_ICONS[item.name] ?? Lightbulb;
                    return (
                      <button key={item.name}
                        onClick={hasIssues ? () => scrollToSection(item.name) : undefined}
                        style={{ width: "100%", textAlign: "left", padding: "10px 10px", borderRadius: 10, background: "#fff", border: "1px solid #f0f3f8", cursor: hasIssues ? "pointer" : "default", transition: "all 0.12s" }}
                        onMouseEnter={e => { if (hasIssues) { (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0f3f8"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${barColor}12`, border: `1px solid ${barColor}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <SIcon style={{ width: 13, height: 13, color: barColor }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{label}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                {hasIssues
                                  ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</span>
                                  : <CheckCircle2 style={{ width: 13, height: 13, color: "#00A63E" }} />
                                }
                                <span style={{ fontSize: 12, fontWeight: 800, color: barColor }}>{item.score}%</span>
                              </div>
                            </div>
                            <div style={{ height: 6, borderRadius: 99, background: "#edf0f7", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${item.score}%`, background: barColor, borderRadius: 99, transition: "width 0.8s ease" }} />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT (8 cols) ── */}
          <div className="lg:col-span-8 space-y-5">

            {/* Resume Preview */}
            {(parsedData || previewUrl) && (
              <div style={CARD}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f87171" }} />
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#F59E0B" }} />
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#4ade80" }} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Resume Preview</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "5px 14px", borderRadius: 99, background: "rgba(52,101,188,0.07)", color: "#3465BC", border: "1.5px solid rgba(52,101,188,0.18)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                    {scoreData?.Fresher ? "Fresher" : "Experienced"}
                  </span>
                </div>
                <div className="custom-scrollbar" style={{ maxHeight: 860, overflowY: "auto" }}>
                  {parsedData
                    ? <ATSResumePreview data={parsedData} />
                    : <iframe src={previewUrl!} className="w-full border-none" style={{ height: 860 }} title="Resume Preview" />
                  }
                </div>
              </div>
            )}

            {/* Issues Card */}
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5eaf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)" }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #3465BC 0%, #4a7fd4 55%, #5e94e8 100%)", padding: "28px 28px 0", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(88,150,215,0.12)", filter: "blur(40px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(52,101,188,0.1)", filter: "blur(30px)", pointerEvents: "none" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontFamily: "monospace" }}>Action Items</p>
                    <h3 style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
                      {issues.length === 0 ? "Resume Looks Great!" : `${issues.length} Issue${issues.length !== 1 ? "s" : ""} Found`}
                    </h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
                      {issues.length === 0 ? "No issues — your resume is fully optimised" : "Sorted by impact on your ATS score"}
                    </p>
                  </div>
                  {issues.length > 0 && (
                    <button onClick={handleFixNow} disabled={isFixing}
                      style={{ padding: "10px 22px", borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: isFixing ? "not-allowed" : "pointer", flexShrink: 0, backdropFilter: "blur(4px)", transition: "background 0.15s", opacity: isFixing ? 0.7 : 1 }}
                      onMouseEnter={e => { if (!isFixing) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.22)"; }}
                      onMouseLeave={e => { if (!isFixing) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}>
                      {isFixing ? "Preparing…" : "Fix All Issues →"}
                    </button>
                  )}
                </div>
                {/* Tabs */}
                {issues.length > 0 && (
                  <div style={{ display: "flex", gap: 3, overflowX: "auto", scrollbarWidth: "none" as const }}>
                    {TAB_CONFIG.map(tab => {
                      const isActive = filter === tab.key;
                      const dotColor = "color" in tab ? tab.color : undefined;
                      return (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "11px 20px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" as const,
                            background: isActive ? "#fff" : "transparent",
                            color: isActive ? "#0f172a" : "rgba(255,255,255,0.6)",
                            borderRadius: isActive ? "10px 10px 0 0" : "8px 8px 0 0",
                            border: "none", cursor: "pointer", transition: "all 0.15s",
                          }}>
                          {dotColor && <span style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? dotColor : "rgba(255,255,255,0.3)", flexShrink: 0 }} />}
                          {tab.label}
                          {tab.count > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: isActive ? "#0f172a" : "rgba(255,255,255,0.15)", color: isActive ? "#fff" : "rgba(255,255,255,0.7)" }}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: 24, background: "#f4f6fa" }}>
                {issues.length === 0 ? (
                  <div style={{ padding: "56px 0", textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: "#ECFDF5", border: "1.5px solid #6EE7A0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <CheckCircle2 style={{ width: 36, height: 36, color: "#00A63E" }} />
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>All Clear!</p>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>No issues detected across all resume sections.</p>
                  </div>
                ) : (
                  <div ref={issuesPanelRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(filter === "all" || filter === "critical") && (
                      <PriorityGroup title="Fix First" subtitle="Blocking your ATS pass rate" accent="#dc2626" accentBg="#fef2f2"
                        issues={grouped.critical} sectionIcons={SECTION_ICONS} tooltip={WHY_TEXT.General}
                        onDismiss={id => setDismissedIds(prev => new Set([...prev, id]))} onFix={handleFixNow} />
                    )}
                    {(filter === "all" || filter === "urgent") && (
                      <PriorityGroup title="High Impact" subtitle="Significant score improvements" accent="#F59E0B" accentBg="#FEF3C7"
                        issues={grouped.urgent} sectionIcons={SECTION_ICONS} tooltip="These issues cost meaningful ATS points. Fixing them moves your score into the competitive range."
                        onDismiss={id => setDismissedIds(prev => new Set([...prev, id]))} onFix={handleFixNow} />
                    )}
                    {(filter === "all" || filter === "optional") && (
                      <PriorityGroup title="Nice to Improve" subtitle="Polish that separates good from great" accent="#3465BC" accentBg="#EFF6FF"
                        issues={grouped.optional} sectionIcons={SECTION_ICONS} tooltip="Low-severity polish items. Address after fixing critical and urgent issues for maximum ROI."
                        onDismiss={id => setDismissedIds(prev => new Set([...prev, id]))} onFix={handleFixNow} />
                    )}
                    {((filter === "critical" && !grouped.critical.length) || (filter === "urgent" && !grouped.urgent.length) || (filter === "optional" && !grouped.optional.length)) && (
                      <div style={{ padding: "48px 0", textAlign: "center", borderRadius: 14, background: "#ECFDF5", border: "1px solid #6EE7A0" }}>
                        <CheckCircle2 style={{ width: 32, height: 32, color: "#00A63E", margin: "0 auto 10px" }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#00A63E" }}>No issues in this category</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      <BackToTop />
      </div>
    </div>
  );
}

/* ─── EXPORT ──────────────────────────────────────────── */
export default function ATSLoginReportPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3465BC", borderTopColor: "transparent" }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Loading report…</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Preparing your ATS analysis</p>
        </div>
      </div>
    }>
      <ATSLoginReport />
    </Suspense>
  );
}
