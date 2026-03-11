"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
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
  ShieldCheck,
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
} from "lucide-react";

/* ─── TYPES ───────────────────────────────────────────── */
interface BreakdownItem {
  score?: number;
  raw_score?: number;
  max?: number;
  max_score?: number;
  max_raw_score?: number;
  deductions?: string[];
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
      Suggestions:      (atsScore?.Suggestions as string[]) || (numericBreakdown.Suggestions as string[]) || [],
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

    (item.deductions || []).forEach((d: string) => {
      const key = `${display}:${d}`;
      if (seen.has(key)) return;
      seen.add(key);
      cards.push({
        id:          `i-${id++}`,
        priority:    pct === 0 || section === "Experience" ? "critical" : pct < 80 ? "urgent" : "optional",
        section:     display,
        description: d,
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

  const suggestions = breakdown.Suggestions as string[] | undefined;
  if (Array.isArray(suggestions)) {
    suggestions.forEach((s: string) => {
      const colonIdx    = s.indexOf(":");
      const sectionName = colonIdx > 0 ? s.slice(0, colonIdx).trim() : "General";
      const description = colonIdx > 0 ? s.slice(colonIdx + 1).trim() : s;
      const key         = `${sectionName}:${description}`;
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
    borderColor: "border-red-100",
    badge:       "text-red-600 bg-red-50 border border-red-100",
    icon:        AlertTriangle,
    label:       "Critical Fix",
    chipActive:  "text-red-500",
    bgColor:     "bg-red-50/50",
    hoverBg:     "hover:bg-red-50",
    dot:         "bg-red-500",
  },
  urgent: {
    borderColor: "border-orange-100",
    badge:       "text-orange-600 bg-orange-50 border border-orange-100",
    icon:        AlertCircle,
    label:       "Urgent Fix",
    chipActive:  "text-orange-500",
    bgColor:     "bg-orange-50/50",
    hoverBg:     "hover:bg-orange-50",
    dot:         "bg-orange-400",
  },
  optional: {
    borderColor: "border-gray-200",
    badge:       "text-gray-600 bg-gray-100 border border-gray-200",
    icon:        Info,
    label:       "Optional Fix",
    chipActive:  "text-gray-500",
    bgColor:     "bg-gray-50/50",
    hoverBg:     "hover:bg-gray-50",
    dot:         "bg-gray-400",
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
function CircularGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min(100, Math.max(0, score));

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  const color    = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const gradient = pct >= 80 ? "from-emerald-400 to-emerald-500" : pct >= 50 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
  const label    = pct >= 80 ? "Excellent" : pct >= 50 ? "Good" : "Needs Work";

  const radius       = 85;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative" style={{ width: 240, height: 240 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-xl opacity-30" />
        <svg className="-rotate-90 relative z-10" width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
          <circle
            cx="120" cy="120" r={radius}
            fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(animated / 100) * circumference} ${circumference}`}
            style={{ transition: "stroke-dasharray 1s ease-in-out, stroke 0.5s ease", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-extrabold bg-gradient-to-br ${gradient} bg-clip-text text-transparent drop-shadow-sm`}>
            {animated}
          </div>
          <div className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">ATS Score</div>
          <div className="mt-3 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <span className="text-xs font-semibold text-gray-600">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── STAT CARD ───────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, iconColor, iconBg }: {
  icon: React.ElementType; label: string; value: string | number; iconColor: string; iconBg: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

/* ─── SECTION BAR ─────────────────────────────────────── */
function SectionBar({ name, score }: { name: string; score: number }) {
  const meta  = SECTION_META[name] || { icon: FileText, color: "text-gray-600", bar: "bg-gradient-to-r from-gray-300 to-gray-500" };
  const Icon  = meta.icon;
  const label = name.replace(/Enhanced$/, "").replace(/([A-Z])/g, " $1").trim();

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>
          <p className="text-sm font-bold text-gray-700">{label}</p>
        </div>
        <p className="text-base font-extrabold text-gray-800">{score}%</p>
      </div>
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div
          className={`h-full ${meta.bar} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${score}%` }}
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
    <div className={`rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${meta.borderColor}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              issue.priority === "critical" ? "bg-red-50" :
              issue.priority === "urgent" ? "bg-orange-50" : "bg-gray-100"
            }`}>
              <Icon className={`w-4 h-4 ${meta.chipActive}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm text-gray-900">{issue.section}</p>
                <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase tracking-wide ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{issue.description}</p>
            </div>
          </div>
        </div>

        {/* Suggestion */}
        <div className="flex items-start gap-2 bg-[#f8faff] border border-[#dce8f8] rounded-lg p-3 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#2557a7] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700 leading-relaxed">{issue.suggestion}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-2 border border-gray-200 text-gray-500 font-medium text-xs rounded-lg hover:bg-gray-50 transition-all"
          >
            Ignore
          </button>
          <button
            onClick={onFix}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2557a7] hover:bg-[#1a4a8f] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <WrenchIcon className="w-3.5 h-3.5" />
            Fix Now with AI
            <ArrowRight className="w-3.5 h-3.5" />
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

  const getConfidence = (s: number) =>
    s >= 90 ? 5 : s >= 75 ? 4 : s >= 60 ? 3 : s >= 45 ? 2 : 1;

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
      <div className="w-full bg-white px-6 pt-4 pb-6">
        <div className="max-w-[1650px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">ATS Resume Analysis Report</h1>
            </div>
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
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
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
                    <div className="space-y-3 max-h-[900px] overflow-y-auto pr-1 custom-scrollbar">
                      {grouped[filter].map(issue => (
                        <IssueCard key={issue.id} issue={issue} onFix={handleFixNow} onDismiss={() => setDismissedIds(prev => new Set([...prev, issue.id]))} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── RIGHT: Score + Breakdown (4 cols) ───── */}
            <div className="lg:col-span-4 space-y-6">

              {/* Overall Score Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="px-6 py-5 bg-[#2557a7] flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Overall Score</h2>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold text-white">ATS Ready</span>
                  </div>
                </div>

                <CircularGauge score={pct} />

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                  <StatCard
                    icon={TrendingUp}
                    label="Confidence"
                    value={`${getConfidence(pct)}/5`}
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-50"
                  />
                  <StatCard
                    icon={AlertCircle}
                    label="Issues"
                    value={issues.length}
                    iconColor="text-purple-500"
                    iconBg="bg-purple-50"
                  />
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6 space-y-3">
                  <button
                    onClick={handleFixNow}
                    className="w-full px-6 py-3.5 bg-[#2557a7] text-white rounded-xl font-bold hover:bg-[#1a4a8f] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 group"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Fix with AI Enhancer
                  </button>
                  <button
                    onClick={() => router.push("/atslogin")}
                    className="w-full py-2 text-gray-500 font-semibold text-sm hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Rescan Resume
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
                  {allScoreItems.map(item => (
                    <SectionBar key={item.name} name={item.name} score={item.score} />
                  ))}
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
