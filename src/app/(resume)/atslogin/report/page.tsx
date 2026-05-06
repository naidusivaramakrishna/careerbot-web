"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
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

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"] });

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

  const numericKeyword = Number(atsScore?.keyword_score ?? numericBreakdown.keywords ?? 0);
  const numericFormat  = Number(atsScore?.format_score  ?? numericBreakdown.formatting ?? 0);

  function getSection(keys: string[], numericPct: number, maxRaw: number): BreakdownItem {
    for (const k of keys) {
      const v = sectionBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    for (const k of keys) {
      const v = numericBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    if (numericPct > 0) return { percentage: numericPct, deductions: [] };
    return { raw_score: 0, max_raw_score: maxRaw, deductions: [] };
  }

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
      Leadership:       getSection(["Leadership",       "leadership"],                     0,             4),
      CareerProgression:getSection(["CareerProgression","career_progression"],             0,             0),
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
      const isObj = typeof s === "object" && s !== null;
      const suggId = isObj && "id" in (s as Record<string, unknown>)
        ? String((s as Record<string, unknown>).id)
        : "";

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
      <span style={{
        fontSize: 10, fontWeight: 700, color: "#94a3b8",
        border: "1px solid #e2e8f0", borderRadius: 6,
        padding: "2px 6px", cursor: "default", userSelect: "none",
        transition: "all 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = "#2557a7"; (e.currentTarget as HTMLSpanElement).style.borderColor = "rgba(37,87,167,0.3)"; }}
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
  const fixBtnColor = isCritical ? "#dc2626" : isUrgent ? "#d97706" : "#0f172a";

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
          <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            <Icon style={{ width: 16, height: 16, color: "#475569" }} />
          </div>
          <p className="text-[14px] font-bold text-gray-900 leading-snug flex-1">{title}</p>
          <span className="shrink-0 text-[11.5px] font-black whitespace-nowrap px-2.5 py-1 rounded-full"
            style={{ background: "rgba(37,87,167,0.08)", color: "#2557a7", border: "1px solid rgba(37,87,167,0.15)" }}>
            +{impactPts} pts
          </span>
        </div>

        {/* Suggestion box */}
        <div className="rounded-xl px-4 py-3.5 mb-3.5" style={{ background: "#f8fafc", border: "1px solid #e8ecf0" }}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#64748b" }}>{issue.suggestion}</p>
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
          Fix Now
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
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(37,87,167,0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(37,87,167,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0"; }}
    >
      <svg width="16" height="16" fill="none" stroke="#2557a7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 15l-6-6-6 6" />
      </svg>
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.05em", color: "#2557a7", lineHeight: 1, textTransform: "uppercase" }}>TOP</span>
    </button>
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
      "Contact","Education","Experience","Projects","Skills",
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
    setTimeout(() => {
      const el = document.getElementById(`issue-section-${sectionName}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
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

  /* ── helpers ── */
  const gradeLabel  = pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Average" : "Needs Work";
  const gradeUpper  = gradeLabel.toUpperCase();
  const scoreColor  = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
  const scoreLight  = pct >= 70 ? "#f0fdf4" : pct >= 40 ? "#fffbeb" : "#fef2f2";
  const scoreBorder = pct >= 70 ? "#86efac" : pct >= 40 ? "#fcd34d" : "#fca5a5";
  const ptsDiff     = Math.max(0, 90 - pct);

  const SECTION_ICONS: Record<string, React.ElementType> = {
    Contact: User, Education: GraduationCap, Experience: Briefcase,
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
    { key: "urgent",   label: "High Impact",     count: grouped.urgent.length,   color: "#d97706" },
    { key: "optional", label: "Nice to Improve", count: grouped.optional.length, color: "#2557a7" },
  ] as const;

  /* Section checklist for sidebar — top 7 most impactful */
  const CHECKLIST_SECTIONS = ["Contact", "Summary", "Skills", "Experience", "Education", "Keywords", "Formatting"];
  const checklistItems = CHECKLIST_SECTIONS
    .filter(s => allScoreItems.some(a => a.name === s))
    .map(s => ({
      key: s,
      label: s === "ContentQuality" ? "Content Quality" : s === "ATSCompatibility" ? "ATS Compatibility" : s,
      count: sectionIssueCounts[s] ?? 0,
      hasIssue: (sectionIssueCounts[s] ?? 0) > 0,
    }));

  /* ── Loading ─────────────────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4fa" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#2557a7", borderTopColor: "transparent" }} />
        </div>
        <p className={playfair.className} style={{ fontStyle: "italic", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Analyzing your resume…</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Building your personalized report</p>
      </div>
    </div>
  );

  /* ── No data ─────────────────────── */
  if (!scoreData) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4fa", padding: "0 24px" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", background: "#fff", borderRadius: 20, padding: "48px 40px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <XCircle style={{ width: 32, height: 32, color: "#dc2626" }} />
        </div>
        <h2 className={playfair.className} style={{ fontStyle: "italic", fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No Report Found</h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>Upload and scan your resume first to see your full ATS analysis.</p>
        <button onClick={() => router.push("/atslogin")} style={{ width: "100%", padding: "14px 24px", borderRadius: 12, background: "#2557a7", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RefreshCw style={{ width: 16, height: 16 }} /> Go to ATS Scanner
        </button>
      </div>
    </div>
  );

  /* ── Report ──────────────────────── */
  const CARD = { background: "#fff", borderRadius: 16, border: "1px solid #e5eaf2", boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)", overflow: "hidden" as const };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4fa" }}>
      {/* Arc lines background — fixed so it covers viewport at all scroll positions */}
      <svg
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {[280, 440, 600, 760, 920, 1080, 1240, 1400].map((r) => (
          <circle key={r} cx="-60" cy="110%" r={r} fill="none" stroke="rgba(37,87,167,0.07)" strokeWidth="1.2" />
        ))}
      </svg>
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ padding: "18px 40px 16px", borderBottom: "1px solid #e2e8f2" }}>
        <div style={{ maxWidth: 1520, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 4, height: 20, borderRadius: 99, background: "linear-gradient(180deg,#2557a7,#4f8ef7)" }} />
              <p style={{ fontSize: 10, fontWeight: 800, color: "#2557a7", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontFamily: "monospace", margin: 0 }}>
                ATS Resume Report
              </p>
            </div>
            <h1 className={playfair.className} style={{ fontStyle: "italic", fontSize: 36, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              {pct >= 70 ? "Great score! Let’s make it perfect." : "Let’s fine-tune your resume."}
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8, fontWeight: 400 }}>
              We found <span style={{ fontWeight: 700, color: "#0f172a" }}>{issues.length} issues</span> affecting your ATS compatibility score.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, paddingBottom: 4 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 4 }}>Your Score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span className={playfair.className} style={{ fontStyle: "italic", fontSize: 40, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{pct}</span>
                <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>/100</span>
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: "#e2e8f2" }} />
            <span style={{ padding: "8px 20px", borderRadius: 99, background: scoreLight, color: scoreColor, border: `1.5px solid ${scoreBorder}`, fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {gradeUpper}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "32px 40px 64px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

          {/* ── LEFT (4 cols sticky) ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 self-start space-y-5">

            {/* Score card */}
            <div style={CARD}>
              <div style={{ padding: "22px 24px 20px" }}>
                <p className={playfair.className} style={{ fontStyle: "italic", fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Resume Check Score</p>

                {/* Gauge row */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <svg viewBox="0 0 120 120" width="108" height="108">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#e8edf3" strokeWidth="10" />
                      {pct > 0 && (
                        <circle cx="60" cy="60" r="48" fill="none" stroke={scoreColor} strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 48 * pct / 100} ${2 * Math.PI * 48}`}
                          strokeLinecap="round" transform="rotate(-90 60 60)"
                          style={{ filter: `drop-shadow(0 0 8px ${scoreColor}88)` }} />
                      )}
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span className={playfair.className} style={{ fontStyle: "italic", fontSize: 34, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{pct}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginTop: 2 }}>/ 100</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: 6 }}>{gradeUpper}</p>
                    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: scoreLight, color: scoreColor, border: `1.5px solid ${scoreBorder}`, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                      Resume Strength
                    </span>
                    {ptsDiff > 0 && (
                      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10, lineHeight: 1.4 }}>
                        Fix issues to gain <span style={{ color: "#2557a7", fontWeight: 800 }}>+{ptsDiff} pts</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Primary CTA */}
                <button onClick={handleFixNow}
                  style={{ width: "100%", padding: "14px 20px", borderRadius: 12, background: "linear-gradient(135deg,#2557a7,#1a3a8f)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", marginBottom: 10, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(37,87,167,0.3)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
                  Fix My Resume →
                </button>
                <button onClick={() => router.push("/atslogin")}
                  style={{ width: "100%", padding: "11px 20px", borderRadius: 12, background: "transparent", color: "#2557a7", fontWeight: 700, fontSize: 13, border: "1.5px solid #dbeafe", cursor: "pointer", marginBottom: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  Upload &amp; Rescan
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* Section checklist */}
              <div style={{ padding: "18px 24px 22px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 12 }}>Sections to Review</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {checklistItems.map(item => (
                    <div key={item.key}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 10,
                        background: item.hasIssue ? "#fef8f8" : "#f8faf8",
                        border: `1px solid ${item.hasIssue ? "#fee2e2" : "#e8f5e9"}`,
                        cursor: item.hasIssue ? "pointer" : "default",
                        transition: "all 0.15s",
                      }}
                      onClick={item.hasIssue ? () => scrollToSection(item.key) : undefined}
                      onMouseEnter={e => { if (item.hasIssue) { (e.currentTarget as HTMLDivElement).style.background = "#fef2f2"; (e.currentTarget as HTMLDivElement).style.borderColor = "#fca5a5"; } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = item.hasIssue ? "#fef8f8" : "#f8faf8"; (e.currentTarget as HTMLDivElement).style.borderColor = item.hasIssue ? "#fee2e2" : "#e8f5e9"; }}
                    >
                      {item.hasIssue ? (
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(220,38,38,0.3)" }}>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>!</span>
                        </div>
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(22,163,74,0.25)" }}>
                          <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                        </div>
                      )}
                      <span style={{ fontSize: 13, fontWeight: item.hasIssue ? 700 : 500, color: item.hasIssue ? "#0f172a" : "#4b7a57", flex: 1 }}>{item.label}</span>
                      {item.hasIssue && (
                        <span style={{ minWidth: 22, height: 22, borderRadius: 99, padding: "0 6px", background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {item.count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e8ecf0" }}>
                  <svg width="11" height="11" fill="#94a3b8" viewBox="0 0 24 24"><path d="M12 1l9 4v6c0 5.25-3.75 10.14-9 11.25C6.75 21.14 3 16.25 3 11V5l9-4z" /></svg>
                  <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Your data is secure and confidential</p>
                </div>
              </div>
            </div>

            {/* Score Breakdown card */}
            <div style={CARD}>
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <p className={playfair.className} style={{ fontStyle: "italic", fontSize: 19, fontWeight: 700, color: "#0f172a" }}>Score Breakdown</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Click a section to jump to its issues</p>
              </div>
              <div className="custom-scrollbar" style={{ padding: "12px 14px", maxHeight: 440, overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {allScoreItems.map(item => {
                    const count    = sectionIssueCounts[item.name] ?? 0;
                    const hasIssues = count > 0;
                    const label    = item.name.replace(/([A-Z])/g, " $1").trim();
                    const barColor = item.score >= 70 ? "#16a34a" : item.score >= 40 ? "#d97706" : "#dc2626";
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
                                  : <CheckCircle2 style={{ width: 13, height: 13, color: "#16a34a" }} />
                                }
                                <span style={{ fontSize: 12, fontWeight: 800, color: barColor }}>{item.score}%</span>
                              </div>
                            </div>
                            <div style={{ height: 4, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
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
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fbbf24" }} />
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#4ade80" }} />
                    </div>
                    <span className={playfair.className} style={{ fontStyle: "italic", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Resume Preview</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "5px 14px", borderRadius: 99, background: "rgba(37,87,167,0.07)", color: "#2557a7", border: "1.5px solid rgba(37,87,167,0.18)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
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
              <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a3a5c 55%, #2557a7 100%)", padding: "28px 28px 0", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(88,150,215,0.12)", filter: "blur(40px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(37,87,167,0.1)", filter: "blur(30px)", pointerEvents: "none" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontFamily: "monospace" }}>Action Items</p>
                    <h3 className={playfair.className} style={{ fontStyle: "italic", fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
                      {issues.length === 0 ? "Resume Looks Great!" : `${issues.length} Issue${issues.length !== 1 ? "s" : ""} Found`}
                    </h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
                      {issues.length === 0 ? "No issues — your resume is fully optimised" : "Sorted by impact on your ATS score"}
                    </p>
                  </div>
                  {issues.length > 0 && (
                    <button onClick={handleFixNow}
                      style={{ padding: "10px 22px", borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, backdropFilter: "blur(4px)", transition: "background 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.22)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}>
                      Fix All Issues →
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
              <div style={{ padding: 24, background: "#f8fafc" }}>
                {issues.length === 0 ? (
                  <div style={{ padding: "56px 0", textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: "#f0fdf4", border: "1.5px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <CheckCircle2 style={{ width: 36, height: 36, color: "#16a34a" }} />
                    </div>
                    <p className={playfair.className} style={{ fontStyle: "italic", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>All Clear!</p>
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
                      <PriorityGroup title="High Impact" subtitle="Significant score improvements" accent="#d97706" accentBg="#fffbeb"
                        issues={grouped.urgent} sectionIcons={SECTION_ICONS} tooltip="These issues cost meaningful ATS points. Fixing them moves your score into the competitive range."
                        onDismiss={id => setDismissedIds(prev => new Set([...prev, id]))} onFix={handleFixNow} />
                    )}
                    {(filter === "all" || filter === "optional") && (
                      <PriorityGroup title="Nice to Improve" subtitle="Polish that separates good from great" accent="#2557a7" accentBg="#eff6ff"
                        issues={grouped.optional} sectionIcons={SECTION_ICONS} tooltip="Low-severity polish items. Address after fixing critical and urgent issues for maximum ROI."
                        onDismiss={id => setDismissedIds(prev => new Set([...prev, id]))} onFix={handleFixNow} />
                    )}
                    {((filter === "critical" && !grouped.critical.length) || (filter === "urgent" && !grouped.urgent.length) || (filter === "optional" && !grouped.optional.length)) && (
                      <div style={{ padding: "48px 0", textAlign: "center", borderRadius: 14, background: "#f0fdf4", border: "1px solid #86efac" }}>
                        <CheckCircle2 style={{ width: 32, height: 32, color: "#16a34a", margin: "0 auto 10px" }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>No issues in this category</p>
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
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: "linear-gradient(rgba(37,87,167,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,87,167,0.04) 1px, transparent 1px), linear-gradient(135deg, #f8faff 0%, #eff6ff 50%, #dbeafe 100%)",
        backgroundSize: "48px 48px, 48px 48px, 100% 100%",
      }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#fff", border: "1.5px solid #0f172a", boxShadow: "4px 4px 0px #0f172a" }}>
            <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#2557a7", borderTopColor: "transparent" }} />
          </div>
          <p className="font-bold text-gray-700">Loading report…</p>
        </div>
      </div>
    }>
      <ATSLoginReport />
    </Suspense>
  );
}
