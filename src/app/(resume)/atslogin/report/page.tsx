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
} from "lucide-react";
import JobMatchTemplateThree from "@/app/(jobs)/jobmatch/_components/resume/JobMatchTemplateThree";

const PREVIEW_BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";

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

  // The backend returns section objects under SectionBreakdown (new format)
  // or numeric values under breakdown (old ATSBreakdown format)
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

  // Numeric category scores used as fallback when section objects aren't available
  const numericKeyword = Number(atsScore?.keyword_score ?? numericBreakdown.keywords ?? 0);
  const numericFormat  = Number(atsScore?.format_score  ?? numericBreakdown.formatting ?? 0);

  /**
   * Get a section item from the SectionBreakdown (object format) checking multiple
   * key variants (PascalCase, lowercase). Falls back to a numeric percentage item
   * when available, or an empty zero item.
   */
  function getSection(keys: string[], numericPct: number, maxRaw: number): BreakdownItem {
    for (const k of keys) {
      const v = sectionBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    // Also check the old numeric breakdown for matching keys
    for (const k of keys) {
      const v = numericBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    if (numericPct > 0) return { percentage: numericPct, deductions: [] };
    return { raw_score: 0, max_raw_score: maxRaw, deductions: [] };
  }

  // Score extraction — check every known field name
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
  const score = scoreFromStorage || scoreFromAts;

  return {
    TotalScore: score,
    FinalWeightedScore: score,
    MaxScore: 100,
    Breakdown: {
      Contact:          getSection(["Contact",          "contact"],                        0,             5),
      Education:        getSection(["Education",        "education"],                      0,             15),
      Experience:       getSection(["Experience",       "experience", "WorkExperience"],   0,             0),
      Projects:         getSection(["Projects",         "projects"],                       0,             20),
      Skills:           getSection(["Skills",           "skills"],                         numericKeyword, 20),
      Certifications:   getSection(["Certifications",   "certifications"],                 0,             10),
      Summary:          getSection(["Summary",          "summary"],                        0,             5),
      Formatting:       getSection(["Formatting",       "formatting", "FormattingEnhanced"], numericFormat, 10),
      Internships:      getSection(["Internships",      "internships"],                    0,             10),
      ContentQuality:   getSection(["ContentQuality",   "content_quality", "Readability", "readability"], 0, 15),
      ATSCompatibility: getSection(["ATSCompatibility", "ats_compatibility"],              0,             5),
      Keywords:         getSection(["Keywords",         "keywords"],                       numericKeyword, 30),
      LengthScore:      getSection(["LengthScore",      "length_score"],                   0,             10),
      StructureScore:   getSection(["StructureScore",   "structure_score"],                0,             20),
      Suggestions:      (atsScore?.Suggestions as unknown[]) || (numericBreakdown.Suggestions as unknown[]) || [],
    },
    Fresher: (raw?.Fresher as boolean) ?? (atsScore?.Fresher as boolean) ?? true,
    Domain:  (raw?.Domain as string)  || (atsScore?.Domain as string) || "General",
  };
}

function getSuggestion(section: string, description: string): string {
  const d = description.toLowerCase();
  // Skills
  if (section === "Skills") {
    if (d.includes("not demonstrated") || d.includes("listed but")) return "Add this skill to a project or internship bullet — e.g. 'Built X using [skill]' — so it appears in context, not just the skills list.";
    if (d.includes("soft skill") || d.includes("no soft")) return "Add 3 soft skills (e.g. Communication, Problem Solving, Leadership) in a dedicated Soft Skills section.";
    if (d.includes("missing") || d.includes("no ")) return "Add this skill explicitly in your Skills section using the exact term from job postings.";
    return "Expand your Skills section with tools and technologies from the target job description.";
  }
  // Keywords
  if (section === "Keywords") {
    if (d.includes("density") || d.includes("overlap")) return "Mirror exact phrases from the job posting. If the JD says 'CI/CD pipelines', use that exact phrase — not just 'CI/CD'.";
    return "Add missing keywords from the job description verbatim — ATS matches exact phrases, not synonyms.";
  }
  // Summary
  if (section === "Summary") {
    if (d.includes("short") || d.includes("23 word") || d.includes("too short")) return "Expand to 3–5 sentences: include your job title, years of experience, 2–3 top skills, and one career highlight.";
    if (d.includes("objective") || d.includes("challenging position") || d.includes("reputed")) return "Replace generic objective with a targeted professional summary. Start with: '[Title] with [X] years of experience in [domain]...'";
    if (d.includes("technical skill") || d.includes("no mention")) return "Weave 2–3 of your top technical skills directly into the summary paragraph — not just in the skills section.";
    return "Rewrite your summary to include your exact job target, years of experience, and 2–3 measurable strengths.";
  }
  // Experience
  if (section === "Experience") {
    if (d.includes("metric") || d.includes("number") || d.includes("quantif")) return "Add at least one number to each bullet — team size, % improvement, revenue, users, or time saved.";
    if (d.includes("action verb") || d.includes("passive") || d.includes("responsible")) return "Replace 'Responsible for' and 'Worked on' with strong action verbs: Engineered, Reduced, Led, Shipped, Increased.";
    if (d.includes("0%") || d.includes("missing") || d.includes("no experience")) return "Add your internships or projects in an Experience section — even a 1-month role counts.";
    return "Strengthen each bullet with an action verb + specific result. Format: '[Verb] [what you did] resulting in [outcome]'.";
  }
  // Education
  if (section === "Education") {
    if (d.includes("grade") || d.includes("percentage") || d.includes("gpa")) return "Add your grade/percentage/GPA next to the degree. Format: 'B.Tech in CSE — 8.2 CGPA (2021–2025)'.";
    if (d.includes("passed out") || d.includes("year")) return "Add your graduation year next to the degree name. ATS requires a date to parse the entry correctly.";
    return "Complete your education entry: degree name, institution, year, and grade/CGPA on a single line.";
  }
  // Contact
  if (section === "Contact") {
    if (d.includes("linkedin")) return "Add your LinkedIn URL in the contact section. Format: linkedin.com/in/your-name. Recruiters verify your profile before reaching out.";
    if (d.includes("phone") || d.includes("mobile")) return "Add a mobile number with country code. Recruiters use phone for shortlisted candidates.";
    if (d.includes("email")) return "Use a professional email (firstname.lastname@gmail.com). Avoid nicknames or numbers.";
    return "Complete your contact section: name, email, phone, city, and LinkedIn URL on one line.";
  }
  // Formatting
  if (section === "Formatting") {
    if (d.includes("page") || d.includes("long") || d.includes("2 page")) return "Trim to 1 page for under 3 years of experience. Remove older education entries and redundant skill repetitions.";
    if (d.includes("table") || d.includes("column") || d.includes("graphic")) return "Remove tables and multi-column layouts. ATS parsers read left-to-right, single column only.";
    return "Use a clean single-column layout with standard section headings. Avoid text boxes, borders, and graphics.";
  }
  // ContentQuality
  if (section === "ContentQuality") {
    if (d.includes("replace") || d.includes("aimed") || d.includes("suggested")) return "Rewrite this bullet with a specific achievement. Use: '[Action verb] [what] for [who], resulting in [measurable outcome]'.";
    if (d.includes("strong debug") || d.includes("problem solv")) return "Demonstrate this skill with a concrete example: 'Debugged [X] issue that reduced error rate by Y%' rather than claiming it abstractly.";
    return "Replace vague phrases with specific, measurable achievements. Every bullet should answer: what did you do and what was the result?";
  }
  // Certifications
  if (section === "Certifications") {
    if (d.includes("not relevant") || d.includes("domain")) return "Add certifications aligned with your target role — e.g. AWS, Google Cloud, or HackerRank for tech roles.";
    return "Include the certifying body and year: 'AWS Certified Solutions Architect – AWS (2024)'.";
  }
  // Projects
  if (section === "Projects") {
    if (d.includes("generic") || d.includes("description")) return "Add: the problem solved, tech stack used, your specific contribution, and a result — e.g. 'Reduced load time by 40%'.";
    return "Each project needs: title, tech stack, your role, and one measurable outcome. One line minimum per project.";
  }
  // Internships
  if (section === "Internships") {
    if (d.includes("missing") || d.includes("date")) return "Add start and end dates to your internship. Format: 'Company Name — Role (Mon YYYY – Mon YYYY)'.";
    return "Add 2–3 bullet achievements to each internship entry with action verbs and numbers where possible.";
  }
  // ATSCompatibility
  if (section === "ATSCompatibility") {
    return "Use standard section headings (Education, Experience, Skills). Avoid PDFs with embedded fonts or scanned images.";
  }
  // General
  return "Address this issue to strengthen the overall quality and ATS compatibility of your resume.";
}

function extractIssues(breakdown: ResumeScoreData["Breakdown"]): IssueCard[] {
  const cards: IssueCard[] = [];
  let id = 0;
  const seen = new Set<string>();

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
      const dStr = typeof d === "string" ? d
        : typeof d === "object" && d !== null && "message" in d ? String((d as Record<string, unknown>).message)
        : typeof d === "object" && d !== null ? JSON.stringify(d)
        : String(d);
      const key = `${display}:${dStr}`;
      if (seen.has(key)) return;
      seen.add(key);
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
      // Suggestion items are objects { id, section, message, fix_type }
      const isObj = typeof s === "object" && s !== null;
      const suggId = isObj && "id" in (s as Record<string, unknown>)
        ? String((s as Record<string, unknown>).id)
        : "";

      // Skip AI-generated enhancement suggestions (not actionable issues)
      if (
        suggId.startsWith("suggested_summary_") ||
        /_suggested_contribution_\d+$/.test(suggId)
      ) return;

      const description = isObj && "message" in (s as Record<string, unknown>)
        ? String((s as Record<string, unknown>).message)
        : typeof s === "string" ? s : String(s);
      const sectionName = isObj && "section" in (s as Record<string, unknown>)
        ? String((s as Record<string, unknown>).section)
        : "General";
      const key = `${sectionName}:${description}`;
      if (seen.has(key)) return;
      seen.add(key);
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
      <span className="text-[10px] font-semibold text-slate-400 hover:text-indigo-500 border border-slate-200 hover:border-indigo-300 rounded px-1.5 py-0.5 transition-colors cursor-default select-none">
        WHY?
      </span>
      {show && (
        <span
          className="absolute bottom-full right-0 mb-2.5 w-72 rounded-2xl px-4 py-3.5 text-[12px] leading-relaxed text-white z-50 pointer-events-none block"
          style={{ background: "#1a2e5a", boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)" }}
        >
          {text}
          <span
            className="absolute top-full right-3 block"
            style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1a2e5a" }}
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

  const palette = isCritical
    ? { accent: "#ef4444", soft: "#fff5f5", softBorder: "rgba(239,68,68,0.18)", ptsFg: "#dc2626", ptsBg: "#fee2e2", iconRing: "rgba(239,68,68,0.12)" }
    : isUrgent
    ? { accent: "#f59e0b", soft: "#fffbeb", softBorder: "rgba(245,158,11,0.18)", ptsFg: "#b45309", ptsBg: "#fef3c7", iconRing: "rgba(245,158,11,0.12)" }
    : { accent: "#8b5cf6", soft: "#faf5ff", softBorder: "rgba(139,92,246,0.18)", ptsFg: "#6d28d9", ptsBg: "#ede9fe", iconRing: "rgba(139,92,246,0.12)" };

  const rawPts     = SECTION_IMPACT[issue.section] ?? 5;
  const impactPts  = isCritical ? rawPts : isUrgent ? Math.floor(rawPts * 0.65) : Math.floor(rawPts * 0.35);

  const raw   = issue.description;
  const cut   = raw.search(/[.!?]\s/);
  const title = cut > 0 && cut < 90 ? raw.slice(0, cut + 1) : raw.slice(0, 88) + (raw.length > 88 ? "…" : "");

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden transition-all duration-150 cursor-default"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
    >
      <div className="px-4 py-4 flex gap-3.5">

        {/* Icon bubble */}
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
          style={{ background: "#f8fafc", border: "1px solid #edf0f4" }}
        >
          <Icon style={{ width: 16, height: 16, color: "#64748b" }} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">

          {/* Row 1: title + pts */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-[13px] font-bold text-gray-900 leading-snug flex-1">{title}</p>
            <span
              className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap mt-0.5"
              style={{ background: "#f8fafc", color: palette.ptsFg, border: "1px solid #edf0f4" }}
            >
              +{impactPts} pts
            </span>
          </div>

          {/* Row 2: suggestion */}
          <p className="text-[12px] text-gray-400 leading-relaxed mb-3 line-clamp-2">{issue.suggestion}</p>

          {/* Row 3: action */}
          <button
            onClick={onFix}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
            style={{
              background: "#2557a7",
              color: "white",
              boxShadow: "0 2px 8px rgba(37,87,167,0.28)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(37,87,167,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(37,87,167,0.28)"; }}
          >
            Fix Now
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dismiss — only visible on hover */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-150"
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
      {/* Group header pill */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 hover:bg-gray-50 active:scale-[0.998]"
        style={{ background: "#ffffff", border: "1px solid #edf0f4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {/* Priority dot */}
        <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1" style={{ background: accent, outline: `2px solid ${accent}40`, outlineOffset: '1px' }} />

        {/* Title */}
        <span className="text-[13.5px] font-extrabold flex-1 text-left" style={{ color: accent }}>{title}</span>

        {/* Subtitle — hidden on small screens */}
        <span className="text-[11.5px] text-gray-500 hidden sm:block mr-1 font-medium">{subtitle}</span>

        {/* WHY tooltip */}
        <WhyTooltip text={tooltip} />

        {/* Count badge */}
        <span
          className="text-[11px] font-black px-2.5 py-0.5 rounded-full ml-0.5 min-w-[22px] text-center"
          style={{ background: accent, color: "white", boxShadow: `0 2px 6px ${accent}55` }}
        >
          {issues.length}
        </span>

        {/* Chevron */}
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
                <div key={section} id={`issue-section-${section}`}>
                  {/* Section divider */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: accentBg }}>
                      <SectionIcon style={{ width: 12, height: 12, color: accent }} />
                    </div>
                    <span className="text-[10.5px] font-black tracking-[0.15em] uppercase text-gray-400">{label}</span>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accent}30, transparent)` }} />
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: accentBg, color: accent, border: `1px solid ${accent}22` }}
                    >
                      {sectionIssues.length}
                    </span>
                  </div>

                  {/* Cards */}
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

/* ─── MAIN REPORT ─────────────────────────────────────── */
function ATSLoginReport() {
  const router   = useRouter();
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading,   setLoading]   = useState(true);
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
        // Pass the full data object so JobMatchTemplateThree can correctly access
        // data.parsed_data (the template does `data?.parsed_data || data` internally)
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
      if (!item || typeof item !== "object") return -1; // -1 = no data at all

      // 1. Direct percentage field (already 0-100)
      const directPct = item.Percentage ?? item.percentage;
      if (typeof directPct === "number") return Math.min(100, Math.round(directPct));

      // 2. raw_score / max_raw_score (backend native format)
      const max = item.max_raw_score || item.max || item.max_score || 0;
      const s   = item.raw_score ?? item.score ?? 0;
      if (max > 0) return Math.min(100, Math.round((s / max) * 100));

      // 3. score with no max — treat as already a percentage if it's 0-100 range
      if (typeof item.score === "number" && item.score >= 0 && item.score <= 100) {
        return Math.round(item.score);
      }
      return -1; // no usable data
    };

    // Only show sections that came from the real backend response.
    // Fallback items created by getSection use { raw_score, max_raw_score } with no
    // "percentage" key, while every real backend section always has "percentage".
    const isRealSection = (key: string): boolean => {
      const item = b[key] as Record<string, unknown>;
      return !!item && ("percentage" in item || Number((item as BreakdownItem).raw_score) > 0);
    };

    return [
      "Contact","Education","Experience","Projects","Skills",
      "Certifications","Summary","Internships","Keywords",
      "Formatting","ContentQuality","ATSCompatibility","LengthScore","StructureScore",
    ]
      .filter(k => isRealSection(k))
      .map(k => ({ name: k, score: Math.max(0, calcPct(k)) }));
  }, [scoreData]);

  const pct = scoreData ? Math.min(100, Math.round(scoreData.FinalWeightedScore)) : 0;

  // Issue count per section name (for breakdown badges)
  const sectionIssueCounts = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach(i => { map[i.section] = (map[i.section] ?? 0) + 1; });
    return map;
  }, [issues]);

  const issuesPanelRef = useRef<HTMLDivElement>(null);

  // Click a breakdown bar → switch to its priority filter + scroll only the issues panel
  const scrollToSection = useCallback((sectionName: string) => {
    const inCritical = grouped.critical.some(i => i.section === sectionName);
    const inUrgent   = grouped.urgent.some(i => i.section === sectionName);
    const inOptional = grouped.optional.some(i => i.section === sectionName);
    const target = inCritical ? "critical" : inUrgent ? "urgent" : inOptional ? "optional" : null;
    if (!target) return;
    setFilter(target);
    setTimeout(() => {
      const panel = issuesPanelRef.current;
      const el = document.getElementById(`issue-section-${sectionName}`);
      if (panel && el) {
        const top = el.offsetTop - panel.offsetTop;
        panel.scrollTo({ top, behavior: "smooth" });
      }
    }, 80);
  }, [grouped]);

  const handleFixNow = () => {
    try {
      const raw = localStorage.getItem("atsAnalysisData");
      if (raw) {
        const d             = JSON.parse(raw) as Record<string, unknown>;
        const resumeId      = d.resume_id as string;
        const atsBreakdown  = d.ats_breakdown_id as string | undefined;
        if (resumeId) {
          const params = new URLSearchParams({ resume_id: resumeId, from_ats: "true" });
          if (atsBreakdown) params.set("ats_breakdown", atsBreakdown);
          router.push(`/enhancer?${params.toString()}`);
          return;
        }
      }
    } catch { /* ignore */ }
    router.push("/enhancer");
  };

  /* ── Loading ─────────────────────── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f0f4ff 0%,#f8faff 100%)" }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-5" style={{ borderColor: "#1a2e5a", borderTopColor: "transparent" }} />
        <p className="text-base font-bold text-gray-800">Analyzing your resume…</p>
        <p className="text-sm text-gray-400 mt-1.5">Building your personalized report</p>
      </div>
    </div>
  );

  /* ── No data ─────────────────────── */
  if (!scoreData) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg,#f0f4ff 0%,#f8faff 100%)" }}>
      <div className="max-w-md w-full text-center bg-white rounded-3xl p-12" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.10)" }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#fef2f2" }}>
          <XCircle className="w-10 h-10" style={{ color: "#ef4444" }} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">No Report Found</h2>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">Upload and scan your resume first to see your full ATS analysis.</p>
        <button
          onClick={() => router.push("/atslogin")}
          className="w-full px-6 py-3.5 text-white rounded-2xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#1a2e5a,#2d4a8a)" }}
        >
          <RefreshCw className="w-4 h-4" />
          Go to ATS Scanner
        </button>
      </div>
    </div>
  );

  /* ── gauge helpers ── */
  const gaugeColor  = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  const gradeLabel  = pct >= 85 ? "EXCELLENT" : pct >= 70 ? "GOOD" : pct >= 50 ? "AVERAGE" : "NEEDS WORK";

  const SECTION_ICONS: Record<string, React.ElementType> = {
    Contact: User,
    Education: GraduationCap,
    Experience: Briefcase,
    Projects: FolderOpen,
    Skills: Zap,
    Certifications: Award,
    Summary: AlignLeft,
    Internships: Building2,
    Keywords: Tag,
    Formatting: LayoutTemplate,
    ContentQuality: BookOpen,
    ATSCompatibility: ScanLine,
    General: Lightbulb,
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
    General: "General improvements that strengthen overall readability and professionalism across all sections.",
  };

  const TAB_CONFIG = [
    { key: "all",      label: "All",             count: grouped.critical.length + grouped.urgent.length + grouped.optional.length },
    { key: "critical", label: "Fix First",        count: grouped.critical.length,  color: "#ef4444" },
    { key: "urgent",   label: "High Impact",      count: grouped.urgent.length,    color: "#f59e0b" },
    { key: "optional", label: "Nice to Improve",  count: grouped.optional.length,  color: "#8b5cf6" },
  ] as const;

  /* ── Report ──────────────────────── */
  return (
    <div className="w-full min-h-screen" style={{ background: "#f0f4f8" }}>

      {/* ══ BODY ══ */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT: Score card (3 cols, sticky) ────── */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4">

            {/* Score gauge card */}
            <div
              className="rounded-3xl overflow-hidden bg-white"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.07)" }}
            >
              {/* Colored top accent bar */}
              <div className="h-[4px] w-full" style={{ background: gaugeColor }} />

              {/* Score hero */}
              <div className="px-6 pt-5 pb-0">

                {/* Label row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black tracking-[0.18em] uppercase text-gray-400">ATS Score</span>
                  <span
                    className="text-[10px] font-black tracking-[0.12em] px-2.5 py-1 rounded-full uppercase"
                    style={{ background: `${gaugeColor}14`, color: gaugeColor, border: `1.5px solid ${gaugeColor}30` }}
                  >
                    {gradeLabel}
                  </span>
                </div>

                {/* Big number */}
                <div className="flex items-end gap-1 mb-1">
                  <span
                    className="font-black leading-none"
                    style={{ fontSize: 72, color: gaugeColor, letterSpacing: "-4px", lineHeight: 1 }}
                  >
                    {pct}
                  </span>
                  <span className="text-[20px] font-bold pb-2" style={{ color: "#cbd5e1" }}>/100</span>
                </div>

                {/* Pts hint */}
                {pct < 100 && (
                  <p className="text-[11.5px] font-semibold mb-5" style={{ color: "#94a3b8" }}>
                    +{pct >= 90 ? 100 - pct : Math.max(0, 90 - pct)} pts to reach {pct >= 90 ? "perfect score" : "90"}
                  </p>
                )}

                {/* Tiered track */}
                <div className="mb-2">
                  <div className="relative h-[10px] flex gap-[3px] rounded-full overflow-visible">
                    {/* Poor 0–40 */}
                    <div className="rounded-full overflow-hidden" style={{ width: "40%", background: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: pct > 0 ? `${Math.min(100, (pct / 40) * 100)}%` : "0%", background: "#ef4444", transition: "width 1s ease" }} />
                    </div>
                    {/* Average 40–70 */}
                    <div className="rounded-full overflow-hidden" style={{ width: "30%", background: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: pct > 40 ? `${Math.min(100, ((pct - 40) / 30) * 100)}%` : "0%", background: "#f59e0b", transition: "width 1s ease 0.1s" }} />
                    </div>
                    {/* Good 70–90 */}
                    <div className="rounded-full overflow-hidden" style={{ width: "20%", background: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: pct > 70 ? `${Math.min(100, ((pct - 70) / 20) * 100)}%` : "0%", background: "#22c55e", transition: "width 1s ease 0.2s" }} />
                    </div>
                    {/* Best 90–100 */}
                    <div className="rounded-full overflow-hidden" style={{ width: "10%", background: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: pct > 90 ? `${Math.min(100, ((pct - 90) / 10) * 100)}%` : "0%", background: "#2557a7", transition: "width 1s ease 0.3s" }} />
                    </div>
                  </div>

                  {/* Tier labels */}
                  <div className="flex mt-1.5" style={{ gap: "3px" }}>
                    <span className="text-[9px] font-bold text-center" style={{ width: "40%", color: "#ef4444" }}>Poor</span>
                    <span className="text-[9px] font-bold text-center" style={{ width: "30%", color: "#f59e0b" }}>Average</span>
                    <span className="text-[9px] font-bold text-center" style={{ width: "20%", color: "#22c55e" }}>Good</span>
                    <span className="text-[9px] font-bold text-center" style={{ width: "10%", color: "#2557a7" }}>Best</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-5 my-4 border-t border-gray-100" />

              {/* CTA buttons */}
              <div className="px-5 pb-6 space-y-2.5">
                <button
                  onClick={handleFixNow}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "#2557a7", boxShadow: "0 4px 14px rgba(37,87,167,0.30)" }}
                >
                  Fix My Resume
                </button>
                <button
                  onClick={() => router.push("/atslogin")}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: "white", border: "1px solid #e2e8f0", color: "#94a3b8" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#f8fafc")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "white")}
                >
                  Upload &amp; Rescan
                </button>
              </div>
            </div>

            {/* Score Breakdown card */}
            <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.07)" }}>

              {/* Header */}
              <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p className="text-[16px] font-extrabold" style={{ color: "#1a2e5a" }}>Score Breakdown</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Tap a section to view issues</p>
              </div>

              {/* Section rows */}
              <div className="px-3 py-3 space-y-1.5 max-h-[460px] overflow-y-auto custom-scrollbar">
                {allScoreItems.map(item => {
                  const count     = sectionIssueCounts[item.name] ?? 0;
                  const hasIssues = count > 0;
                  const label     = item.name.replace(/([A-Z])/g, " $1").trim();
                  const isGood    = item.score >= 80;
                  const isMid     = item.score >= 50 && item.score < 80;
                  const barColor  = isGood ? "#22c55e" : isMid ? "#f59e0b" : "#ef4444";
                  const badgeBg   = item.score < 50 ? "#ef4444" : "#f59e0b";
                  const SIcon     = SECTION_ICONS[item.name] ?? Lightbulb;

                  return (
                    <button
                      key={item.name}
                      onClick={hasIssues ? () => scrollToSection(item.name) : undefined}
                      className={`w-full text-left rounded-xl px-3 py-2.5 bg-white transition-all duration-150 ${hasIssues ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}
                      style={{ border: "1px solid #eef1f6" }}
                      onMouseEnter={e => hasIssues && ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 10px rgba(0,0,0,0.07)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "none")}
                    >
                      <div className="flex items-center gap-2.5">

                        {/* Icon */}
                        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${barColor}12`, border: `1px solid ${barColor}25` }}>
                          <SIcon style={{ width: 13, height: 13, color: barColor }} />
                        </div>

                        {/* Label + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] font-semibold text-gray-700 truncate leading-none">{label}</span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {hasIssues ? (
                                <span
                                  className="w-[17px] h-[17px] rounded-full text-[9px] font-black text-white flex items-center justify-center"
                                  style={{ background: badgeBg }}
                                >
                                  {count}
                                </span>
                              ) : (
                                <CheckCircle2 style={{ width: 13, height: 13, color: "#22c55e" }} />
                              )}
                              <span className="text-[12px] font-black tabular-nums" style={{ color: barColor }}>{item.score}%</span>
                            </div>
                          </div>
                          <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${item.score}%`, background: barColor, transition: "width 0.8s ease" }}
                            />
                          </div>
                        </div>

                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pb-3" />
            </div>

          </div>

          {/* ── RIGHT: Preview + Issues (9 cols) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Resume Preview */}
            {(parsedData || previewUrl) && (
              <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.07)" }}>
                {/* Preview header bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-600">Resume Preview</span>
                  </div>
                  <button
                    onClick={handleFixNow}
                    className="flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all text-white"
                    style={{ background: "#1a2e5a" }}
                  >
                    Edit Resume
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "860px" }}>
                  {parsedData
                    ? <JobMatchTemplateThree data={parsedData} />
                    : <iframe src={previewUrl!} className="w-full border-none" style={{ height: "860px" }} title="Resume Preview" />
                  }
                </div>
              </div>
            )}

            {/* Issues Card */}
            <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.10)" }}>

              {/* Issues header */}
              <div style={{ background: "#2557a7", padding: "22px 24px 0" }}>

                {/* Decorative glow blobs */}
                <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 blur-3xl" style={{ background: "#4a7fd4" }} />
                <div className="pointer-events-none absolute top-4 left-1/3 w-24 h-24 rounded-full opacity-5 blur-2xl" style={{ background: "#8b5cf6" }} />

                <div className="relative flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <svg className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <h3 className="text-[17px] font-extrabold text-white leading-tight tracking-tight">
                        {issues.length === 0 ? "Resume Looks Great!" : "Action Items"}
                      </h3>
                    </div>
                    <p className="text-[12px] font-medium pl-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {issues.length === 0
                        ? "No issues found — your resume is fully optimised"
                        : `${issues.length} issue${issues.length === 1 ? "" : "s"} found · sorted by impact on your score`}
                    </p>
                  </div>
                  {issues.length > 0 && (
                    <button
                      onClick={handleFixNow}
                      className="flex items-center gap-1.5 text-[12px] font-bold px-4 py-2.5 rounded-xl text-white transition-all shrink-0 hover:brightness-110 active:scale-95"
                      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
                    >
                      Fix All Issues
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Tab bar */}
                {issues.length > 0 && (
                  <div className="relative flex items-end gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {TAB_CONFIG.map(tab => {
                      const isActive = filter === tab.key;
                      const dotColor = "color" in tab ? tab.color : undefined;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setFilter(tab.key)}
                          className="relative flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-bold whitespace-nowrap transition-all duration-150"
                          style={{
                            background: isActive ? "white" : "transparent",
                            color: isActive ? "#1a2e5a" : "rgba(255,255,255,0.75)",
                            borderRadius: isActive ? "10px 10px 0 0" : "8px 8px 0 0",
                          }}
                        >
                          {dotColor && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0 transition-all"
                              style={{ background: isActive ? dotColor : "rgba(255,255,255,0.25)" }}
                            />
                          )}
                          {tab.label}
                          {tab.count > 0 && (
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                              style={{
                                background: isActive ? "#1a2e5a" : "rgba(255,255,255,0.15)",
                                color: isActive ? "white" : "rgba(255,255,255,0.65)",
                              }}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Issues content */}
              <div className="p-5">
                {issues.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
                      <CheckCircle2 className="w-10 h-10" style={{ color: "#16a34a" }} />
                    </div>
                    <p className="text-lg font-black text-gray-800 mb-1.5">All Clear!</p>
                    <p className="text-sm text-gray-400">No issues detected across all resume sections.</p>
                  </div>
                ) : (
                  <div ref={issuesPanelRef} className="space-y-2">

                    {(filter === "all" || filter === "critical") && (
                      <PriorityGroup
                        title="Fix First"
                        subtitle="Blocking your ATS pass rate"
                        accent="#ef4444"
                        accentBg="#fff5f5"
                        issues={grouped.critical}
                        sectionIcons={SECTION_ICONS}
                        tooltip={WHY_TEXT.General}
                        onDismiss={(id: string) => setDismissedIds(prev => new Set([...prev, id]))}
                        onFix={handleFixNow}
                      />
                    )}

                    {(filter === "all" || filter === "urgent") && (
                      <PriorityGroup
                        title="High Impact"
                        subtitle="Significant score improvements"
                        accent="#f59e0b"
                        accentBg="#fffbeb"
                        issues={grouped.urgent}
                        sectionIcons={SECTION_ICONS}
                        tooltip="These issues cost meaningful ATS points. Fixing them moves your score into the competitive range."
                        onDismiss={(id: string) => setDismissedIds(prev => new Set([...prev, id]))}
                        onFix={handleFixNow}
                      />
                    )}

                    {(filter === "all" || filter === "optional") && (
                      <PriorityGroup
                        title="Nice to Improve"
                        subtitle="Polish that separates good from great"
                        accent="#8b5cf6"
                        accentBg="#faf5ff"
                        issues={grouped.optional}
                        sectionIcons={SECTION_ICONS}
                        tooltip="Low-severity polish items. Address after fixing critical and urgent issues for maximum ROI."
                        onDismiss={(id: string) => setDismissedIds(prev => new Set([...prev, id]))}
                        onFix={handleFixNow}
                      />
                    )}

                    {(
                      (filter === "critical" && grouped.critical.length === 0) ||
                      (filter === "urgent"   && grouped.urgent.length === 0)   ||
                      (filter === "optional" && grouped.optional.length === 0)
                    ) && (
                      <div className="py-14 text-center rounded-2xl" style={{ background: "#f9fafb" }}>
                        <CheckCircle2 className="w-9 h-9 mx-auto mb-3 text-emerald-400" />
                        <p className="text-sm font-bold text-gray-500">No issues in this category</p>
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
    </div>
  );
}

/* ─── EXPORT ──────────────────────────────────────────── */
export default function ATSLoginReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="font-semibold text-gray-700">Loading report…</p>
        </div>
      </div>
    }>
      <ATSLoginReport />
    </Suspense>
  );
}
