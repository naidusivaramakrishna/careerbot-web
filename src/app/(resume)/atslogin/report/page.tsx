"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  CheckCircle2,
  BarChart3,
  Target,
  Sparkles,
  Lightbulb,
  RefreshCw,
  User,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Award,
  Code,
  BookOpen,
  TrendingUp,
  FileText,
  ArrowRight,
  WrenchIcon,
  XCircle,
  ChevronDown,
  MousePointerClick,
} from "lucide-react";

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
        suggestion:  `Review and improve the ${display} section to increase your ATS score.`,
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
      cards.push({ id: `i-${id++}`, priority: "optional", section: sectionName, description, suggestion: `Address this suggestion in ${sectionName} to strengthen your resume.` });
    });
  }

  return cards;
}

/* ─── PRIORITY META ───────────────────────────────────── */
const PRIORITY_META = {
  critical: {
    borderColor: "border-red-200",
    leftBorder:  "border-l-red-500",
    cardBg:      "bg-red-50/40",
    badge:       "text-red-600 bg-red-50 border border-red-200",
    icon:        AlertTriangle,
    label:       "Critical Fix",
    chipActive:  "text-red-500",
    bgColor:     "bg-red-50/50",
    hoverBg:     "hover:bg-red-50",
    dot:         "bg-red-500",
    iconBg:      "bg-red-100",
  },
  urgent: {
    borderColor: "border-yellow-200",
    leftBorder:  "border-l-yellow-400",
    cardBg:      "bg-yellow-50/40",
    badge:       "text-yellow-700 bg-yellow-50 border border-yellow-200",
    icon:        AlertCircle,
    label:       "Urgent Fix",
    chipActive:  "text-yellow-600",
    bgColor:     "bg-yellow-50/50",
    hoverBg:     "hover:bg-yellow-50",
    dot:         "bg-yellow-400",
    iconBg:      "bg-yellow-100",
  },
  optional: {
    borderColor: "border-gray-200",
    leftBorder:  "border-l-gray-300",
    cardBg:      "bg-gray-50/30",
    badge:       "text-gray-600 bg-gray-100 border border-gray-200",
    icon:        Info,
    label:       "Optional",
    chipActive:  "text-gray-500",
    bgColor:     "bg-gray-50/50",
    hoverBg:     "hover:bg-gray-50",
    dot:         "bg-gray-400",
    iconBg:      "bg-gray-100",
  },
};

/* ─── SECTION META ────────────────────────────────────── */
const SECTION_META: Record<string, { icon: React.ElementType; color: string; bar: string }> = {
  Contact:          { icon: User,          color: "text-blue-600",    bar: "bg-gradient-to-r from-blue-300 to-blue-500" },
  Education:        { icon: GraduationCap, color: "text-purple-600",  bar: "bg-gradient-to-r from-purple-300 to-purple-500" },
  Experience:       { icon: Briefcase,     color: "text-indigo-600",  bar: "bg-gradient-to-r from-indigo-300 to-indigo-500" },
  Projects:         { icon: FolderKanban,  color: "text-cyan-600",    bar: "bg-gradient-to-r from-cyan-300 to-cyan-500" },
  Skills:           { icon: Code,          color: "text-green-600",   bar: "bg-gradient-to-r from-green-300 to-green-500" },
  Certifications:   { icon: Award,         color: "text-amber-600",   bar: "bg-gradient-to-r from-amber-300 to-amber-500" },
  Summary:          { icon: FileText,      color: "text-gray-600",    bar: "bg-gradient-to-r from-gray-300 to-gray-500" },
  Internships:      { icon: Briefcase,     color: "text-pink-600",    bar: "bg-gradient-to-r from-pink-300 to-pink-500" },
  Keywords:         { icon: Target,        color: "text-emerald-600", bar: "bg-gradient-to-r from-emerald-300 to-emerald-500" },
  Formatting:       { icon: BarChart3,     color: "text-sky-600",     bar: "bg-gradient-to-r from-sky-300 to-sky-500" },
  FormattingEnhanced: { icon: BarChart3,   color: "text-sky-600",     bar: "bg-gradient-to-r from-sky-300 to-sky-500" },
  ContentQuality:   { icon: BookOpen,      color: "text-orange-600",  bar: "bg-gradient-to-r from-orange-300 to-orange-500" },
  ATSCompatibility: { icon: Sparkles,      color: "text-violet-600",  bar: "bg-gradient-to-r from-violet-300 to-violet-500" },
  LengthScore:      { icon: FileText,      color: "text-teal-600",    bar: "bg-gradient-to-r from-teal-300 to-teal-500" },
  StructureScore:   { icon: BarChart3,     color: "text-rose-600",    bar: "bg-gradient-to-r from-rose-300 to-rose-500" },
};

/* ─── CIRCULAR GAUGE ──────────────────────────────────── */
function CircularGauge({ score, totalIssues }: { score: number; totalIssues: number }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min(100, Math.max(0, score));

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  const color    = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const gradient = pct >= 80 ? "from-emerald-400 to-emerald-500" : pct >= 50 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
  const label    = pct >= 80 ? "Excellent" : pct >= 50 ? "Good" : "Needs Work";
  const confidence = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 45 ? 2 : 1;

  const radius       = 88;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center px-6 pt-5 pb-4">
      {/* Ring */}
      <div className="relative mb-5" style={{ width: 220, height: 220 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-30" />
        <svg className="-rotate-90 relative z-10" width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="110" cy="110" r={radius}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(animated / 100) * circumference} ${circumference}`}
            style={{ transition: "stroke-dasharray 1.2s ease-in-out, stroke 0.5s ease", filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent leading-none`}>
            {animated}
          </div>
          <div className="text-[10px] font-medium text-gray-400 mt-1 tracking-widest uppercase">ATS Score</div>
          {/* Risk badge directly under score */}
          <div className={`mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
            pct >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : pct >= 50 ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {label}
          </div>
        </div>
      </div>

      {/* Two mini stat cards under circle */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xl font-extrabold text-gray-800 leading-none">{confidence}/5</p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">Confidence</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center">
          <p className={`text-xl font-extrabold leading-none ${totalIssues > 0 ? "text-red-500" : "text-emerald-600"}`}>{totalIssues}</p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">Issues</p>
        </div>
      </div>
    </div>
  );
}

/* ─── SECTION BAR ─────────────────────────────────────── */
function SectionBar({ name, score, index, issueCount, onClick }: {
  name: string; score: number; index: number; issueCount: number; onClick?: () => void;
}) {
  const [width, setWidth] = useState(0);
  const meta  = SECTION_META[name] || { icon: FileText, color: "text-gray-600", bar: "bg-gradient-to-r from-gray-300 to-gray-500" };
  const Icon  = meta.icon;
  const label = name.replace(/Enhanced$/, "").replace(/([A-Z])/g, " $1").trim();

  // Score-based color overrides
  const scoreColor = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-yellow-600" : score > 0 ? "text-orange-600" : "text-red-500";
  const barClass   = score >= 70 ? meta.bar
    : score >= 40 ? "bg-gradient-to-r from-yellow-300 to-yellow-500"
    : score >  0  ? "bg-gradient-to-r from-orange-300 to-orange-500"
    : "bg-gradient-to-r from-red-400 to-red-500";
  const statusText = score === 0 ? "Missing section"
    : score < 40   ? "Needs attention"
    : score < 70   ? "Could improve"
    : null;

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 120 + index * 60);
    return () => clearTimeout(t);
  }, [score, index]);

  return (
    <div
      className={`group rounded-lg p-2 -mx-2 transition-all duration-200 ${onClick ? "cursor-pointer hover:bg-blue-50/60" : ""}`}
      onClick={onClick}
      title={onClick ? `Click to jump to ${label} issues` : undefined}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className={`w-4 h-4 ${meta.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 leading-none">{label}</p>
            {statusText && (
              <p className={`text-[10px] font-medium mt-0.5 flex items-center gap-1 ${score === 0 ? "text-red-500" : score < 40 ? "text-orange-500" : "text-yellow-600"}`}>
                <AlertTriangle className="w-2.5 h-2.5" />
                {statusText}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {issueCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${score === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
              {issueCount} issue{issueCount > 1 ? "s" : ""}
            </span>
          )}
          <p className={`text-sm font-extrabold ${scoreColor} w-9 text-right`}>{score}%</p>
          {onClick && issueCount > 0 && (
            <MousePointerClick className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full ${barClass} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ─── ISSUE CARD ──────────────────────────────────────── */
function IssueCard({ issue, onFix, onDismiss }: { issue: IssueCard; onFix: () => void; onDismiss: () => void }) {
  const meta = PRIORITY_META[issue.priority];
  const Icon = meta.icon;

  return (
    <div className={`rounded-lg border ${meta.cardBg} ${meta.borderColor} shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="px-4 py-3">
        {/* Two-line header: section + badge on line 1, description on line 2 */}
        <div className="flex items-start gap-2.5 mb-2">
          <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${meta.chipActive}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="font-semibold text-xs text-gray-800">{issue.section}</p>
              <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-full uppercase tracking-wide ${meta.badge}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{issue.description}</p>
          </div>
        </div>

        {/* Suggestion — borderless subtle bg */}
        <div className="flex items-start gap-1.5 bg-gray-50 rounded-md px-2.5 py-1.5 mb-2.5">
          <Sparkles className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-snug">{issue.suggestion}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={onFix}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <WrenchIcon className="w-3 h-3" />
            Fix with AI
            <ArrowRight className="w-3 h-3" />
          </button>
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
  const [filter,       setFilter]       = useState<"critical" | "urgent" | "optional">("critical");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atsAnalysisData");
      if (raw) {
        const data = JSON.parse(raw);
        setScoreData(transformData(data));

      }
    } catch { /* ignore */ }
    finally   { setLoading(false); }
  }, []);

  const issues = useMemo(() => scoreData ? extractIssues(scoreData.Breakdown) : [], [scoreData]);

  // Auto-select highest priority filter
  useEffect(() => {
    if (!issues.length) return;
    const hasCritical = issues.some(i => i.priority === "critical");
    const hasUrgent   = issues.some(i => i.priority === "urgent");
    setFilter(hasCritical ? "critical" : hasUrgent ? "urgent" : "optional");
  }, [issues]);

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
    setCollapsedSections(prev => { const n = new Set(prev); n.delete(sectionName); return n; });
    setTimeout(() => {
      const panel = issuesPanelRef.current;
      const el = document.getElementById(`issue-section-${sectionName}`);
      if (panel && el) {
        const top = el.offsetTop - panel.offsetTop;
        panel.scrollTo({ top, behavior: "smooth" });
      }
    }, 80);
  }, [grouped]);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  }, []);


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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-lg font-semibold text-gray-800">Analyzing your resume…</p>
        <p className="text-sm text-gray-500 mt-2">This won&apos;t take long</p>
      </div>
    </div>
  );

  /* ── No data ─────────────────────── */
  if (!scoreData) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Report Found</h2>
        <p className="text-gray-500 mb-8">Upload and scan your resume first to see your detailed analysis.</p>
        <button
          onClick={() => router.push("/atslogin")}
          className="w-full px-6 py-3.5 bg-[#2557a7] text-white rounded-xl font-bold hover:bg-[#1a4a8f] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 group"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Go to ATS Scanner
        </button>
      </div>
    </div>
  );

  /* ── Report ──────────────────────── */
  return (
    <div className="w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="w-full bg-white border-b border-gray-100 px-6 pt-5 pb-5">
        <div className="max-w-[1650px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">ATS Resume Analysis Report</h1>
          </div>

        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="w-full px-6 py-8">
        <div className="max-w-[1650px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT: Issues (8 cols) ────────────────── */}
            <div className="lg:col-span-8 space-y-6">

              {/* Pro Tip Banner */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative overflow-hidden hover:shadow-xl hover:shadow-indigo-500/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Pro Tip</h3>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">ATS</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Focus on <strong>Critical</strong> issues first — they have the biggest impact on your ATS pass rate.
                      Each fix improves your chances of reaching a human recruiter.
                    </p>
                  </div>
                </div>
              </div>

              {/* Issues Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">

                {/* Issues Header */}
                <div className="px-6 pt-5 pb-5 bg-gray-50 border-b-2 border-gray-200">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${issues.length === 0 ? "bg-blue-100 border-blue-200" : "bg-gray-100 border-gray-300"}`}>
                        {issues.length === 0
                          ? <CheckCircle className="w-7 h-7 text-blue-600" />
                          : <AlertCircle className="w-7 h-7 text-gray-600" />
                        }
                      </div>
                      <div>
                        <p className="font-extrabold text-2xl text-gray-900">
                          {issues.length === 0 ? "Perfect Resume!" : "Issues Detected"}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {issues.length === 0
                            ? "Your resume is fully optimised"
                            : `${issues.length} ${issues.length === 1 ? "item" : "items"} need your attention`}
                        </p>
                      </div>
                    </div>

                    {issues.length > 0 && (
                      <div className="flex items-center gap-3">
                        {(["critical", "urgent", "optional"] as const).map(type => {
                          const emoji = type === "critical" ? "🔴" : type === "urgent" ? "🟠" : "⚪";
                          const chipLabel = type === "critical" ? "Critical Issues" : type === "urgent" ? "Urgent Fixes" : "Optional";
                          return (
                            <button
                              key={type}
                              onClick={() => setFilter(type)}
                              className={`group rounded-xl px-5 py-3 border min-w-[120px] transition-all transform backdrop-blur-sm ${
                                filter === type
                                  ? `${PRIORITY_META[type].bgColor} ${PRIORITY_META[type].borderColor} shadow-md shadow-indigo-500/20 scale-105`
                                  : "bg-gray-100 border-gray-300 hover:shadow-sm hover:scale-105 hover:bg-gray-200"
                              }`}
                            >
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                  <span className="text-sm">{emoji}</span>
                                  <span className={`text-3xl font-black leading-none ${filter === type ? PRIORITY_META[type].chipActive : "text-gray-300 group-hover:text-gray-400"}`}>
                                    {grouped[type].length}
                                  </span>
                                </div>
                                <div className={`text-xs font-bold tracking-wide ${filter === type ? PRIORITY_META[type].chipActive : "text-gray-400"}`}>
                                  {chipLabel}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

{/* Issues Content */}
                <div className="p-6">
                  {issues.length === 0 ? (
                    <div className="py-16 text-center bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-blue-700 mb-2">All Clear!</h3>
                      <p className="text-sm text-blue-600/80 max-w-md mx-auto">Your resume is in excellent shape. No issues detected.</p>
                    </div>
                  ) : grouped[filter].length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-gray-700 capitalize">No {filter} Issues</h3>
                      <p className="text-sm text-gray-600 mt-1">Great job on this category!</p>
                    </div>
                  ) : (
                    <div ref={issuesPanelRef} className="max-h-[720px] overflow-y-auto pr-1 custom-scrollbar scroll-smooth"
                         style={{ maskImage: "linear-gradient(to bottom, black calc(100% - 32px), transparent 100%)" }}>
                      {/* Group by section with dividers */}
                      {(() => {
                        const sectionGroups: Record<string, IssueCard[]> = {};
                        grouped[filter].forEach(issue => {
                          if (!sectionGroups[issue.section]) sectionGroups[issue.section] = [];
                          sectionGroups[issue.section].push(issue);
                        });
                        return Object.entries(sectionGroups).map(([section, sectionIssues], gIdx) => {
                          const isCollapsed = collapsedSections.has(section);
                          return (
                            <div key={section} id={`issue-section-${section}`} className={gIdx > 0 ? "mt-5" : ""}>
                              {/* Collapsible section header */}
                              <button
                                onClick={() => toggleSection(section)}
                                className="flex items-center gap-2 mb-2 w-full text-left group/hdr hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                              >
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{section}</span>
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  filter === "critical" ? "bg-red-100 text-red-600"
                                  : filter === "urgent" ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-500"
                                }`}>
                                  {sectionIssues.length} issue{sectionIssues.length > 1 ? "s" : ""}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                              </button>
                              {!isCollapsed && (
                                <div className="space-y-2.5">
                                  {sectionIssues.map(issue => (
                                    <IssueCard key={issue.id} issue={issue} onFix={handleFixNow} onDismiss={() => setDismissedIds(prev => new Set([...prev, issue.id]))} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── RIGHT: Score + Breakdown (4 cols) ───── */}
            <div className="lg:col-span-4 space-y-5">

              {/* Overall Score Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="px-6 py-4 bg-[#2557a7]">
                  <h2 className="text-base font-bold text-white">Overall Score</h2>
                </div>

                <CircularGauge score={pct} totalIssues={issues.length} />

                {/* Estimated score after fix */}
                {issues.length > 0 && pct < 95 && (
                  <div className="mx-5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <p className="text-[10px] font-semibold text-emerald-600 mb-3 flex items-center gap-1.5 uppercase tracking-widest">
                      <TrendingUp className="w-3 h-3" />
                      Estimated Score After Fixes
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-black text-gray-400 leading-none">{pct}</p>
                        <p className="text-[9px] text-gray-400 font-medium mt-1 uppercase tracking-wide">Current</p>
                      </div>
                      <ArrowRight className="w-7 h-7 text-emerald-400 flex-shrink-0" strokeWidth={2} />
                      <div className="text-center">
                        <p className="text-3xl font-black text-emerald-600 leading-none">
                          ~{Math.min(100, pct + Math.min(100 - pct, grouped.critical.length * 4 + grouped.urgent.length * 2))}
                        </p>
                        <p className="text-[9px] text-emerald-600 font-medium mt-1 uppercase tracking-wide">Potential</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={handleFixNow}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group text-sm"
                  >
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Fix with AI Enhancer
                  </button>
                  <button
                    onClick={() => router.push("/atslogin")}
                    className="px-4 py-3 text-gray-500 font-semibold text-sm border border-gray-200 rounded-xl hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 group"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Rescan
                  </button>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2557a7] flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
                </div>

                <div className="px-6 py-6 space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {allScoreItems.map((item, idx) => {
                    const count = sectionIssueCounts[item.name] ?? 0;
                    return (
                      <SectionBar
                        key={item.name}
                        name={item.name}
                        score={item.score}
                        index={idx}
                        issueCount={count}
                        onClick={count > 0 ? () => scrollToSection(item.name) : undefined}
                      />
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 10px; }
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
