"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
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
  CheckCircle2,
  WrenchIcon,
} from "lucide-react";

/* ---------------------------------------------------
   TYPES
---------------------------------------------------- */
interface BreakdownItem {
  score?: number;
  raw_score?: number;
  max?: number;
  max_score?: number;
  max_raw_score?: number;
  deductions?: string[];
  percentage?: number;
  file?: string;
  details?: { [key: string]: any };
}

interface ResumeScoreData {
  TotalScore: number;
  FinalWeightedScore: number;
  MaxScore: number;
  Breakdown: { [key: string]: BreakdownItem | string[] | undefined };
  Fresher: boolean;
  Domain: string;
}

interface ScoreItem {
  name: string;
  score: number;
  icon: React.ElementType;
}

interface IssueCard {
  id: string;
  priority: "urgent" | "critical" | "optional";
  section: string;
  description: string;
  suggestion: string;
}

/* ---------------------------------------------------
   HELPERS
---------------------------------------------------- */
function extractIssueCards(breakdown: ResumeScoreData["Breakdown"]): IssueCard[] {
  const cards: IssueCard[] = [];
  let idCounter = 0;
  const seenIssues = new Set<string>();

  Object.entries(breakdown).forEach(([section, data]) => {
    if (section === "Suggestions") return;
    if (section === "Formatting" && breakdown.FormattingEnhanced) return;

    const item = data as BreakdownItem;
    if (!item || typeof item !== "object") return;

    const deductions = item.deductions || [];
    const directPct = item.percentage;
    const maxScore = item.max_raw_score || item.max || item.max_score || 0;
    const score = item.raw_score ?? item.score ?? 0;
    const percentage = typeof directPct === "number" ? directPct
      : maxScore > 0 ? (score / maxScore) * 100 : 100;

    const displaySection = section.replace(/Enhanced$/, "");

    deductions.forEach((deduction: string) => {
      const uniqueKey = `${displaySection}:${deduction}`;
      if (seenIssues.has(uniqueKey)) return;
      seenIssues.add(uniqueKey);
      const priority = percentage === 0 || section === "Experience" ? "critical" : percentage < 80 ? "urgent" : "optional";
      cards.push({ id: `issue-${idCounter++}`, priority, section: displaySection, description: deduction, suggestion: `Review and improve the ${displaySection} section to increase your ATS score.` });
    });

    if (item.details) {
      if (item.details.grammar_errors) {
        const key = `${displaySection}:grammar`;
        if (!seenIssues.has(key)) { seenIssues.add(key); cards.push({ id: `issue-${idCounter++}`, priority: "urgent", section: displaySection, description: `${item.details.grammar_errors} grammar error(s) detected`, suggestion: "Proofread and correct all grammar mistakes." }); }
      }
      if (item.details.spelling_errors) {
        const key = `${displaySection}:spelling`;
        if (!seenIssues.has(key)) { seenIssues.add(key); cards.push({ id: `issue-${idCounter++}`, priority: "urgent", section: displaySection, description: `${item.details.spelling_errors} spelling error(s) detected`, suggestion: "Fix spelling errors for a professional impression." }); }
      }
    }
  });

  const suggestions = breakdown.Suggestions as string[] | undefined;
  if (Array.isArray(suggestions)) {
    suggestions.forEach((s: string) => {
      const colonIdx = s.indexOf(":");
      const sectionName = colonIdx > 0 ? s.slice(0, colonIdx).trim() : "General";
      const description = colonIdx > 0 ? s.slice(colonIdx + 1).trim() : s;
      const key = `${sectionName}:${description}`;
      if (seenIssues.has(key)) return;
      seenIssues.add(key);
      cards.push({ id: `issue-${idCounter++}`, priority: "optional", section: sectionName, description, suggestion: `Address this suggestion in ${sectionName} to strengthen your resume.` });
    });
  }

  return cards;
}

function transformATSDataToScoreFormat(atsData: any): ResumeScoreData {
  const breakdown =
    atsData?.ats_score?.SectionBreakdown ||
    atsData?.ats_score?.section_breakdown ||
    atsData?.ats_score?.breakdown ||
    atsData?.ats_score?.Breakdown ||
    atsData?.breakdown || {};

  const finalWeightedScore =
    atsData?.finalWeightedScore ||
    atsData?.ats_score?.FinalScore ||
    atsData?.ats_score?.Percentage ||
    atsData?.ats_score?.overall_score ||
    atsData?.ats_score?.FinalWeightedScore ||
    atsData?.ats_score?.TotalScore ||
    atsData?.ats_score?.score || 0;

  return {
    TotalScore: atsData?.ats_score?.FinalScore || atsData?.ats_score?.TotalScore || atsData?.ats_score?.score || finalWeightedScore,
    FinalWeightedScore: finalWeightedScore,
    MaxScore: 100,
    Breakdown: {
      Contact: breakdown.Contact || { score: 0, max: 5, deductions: [] },
      Education: breakdown.Education || { score: 0, max: 15, deductions: [] },
      Experience: breakdown.Experience || { score: 0, max: 0, deductions: [] },
      Projects: breakdown.Projects || { score: 0, max: 20, deductions: [] },
      Skills: breakdown.Skills || { score: 0, max: 20, deductions: [] },
      Certifications: breakdown.Certifications || { score: 0, max: 10, deductions: [] },
      Summary: breakdown.Summary || { score: 0, max: 5, deductions: [] },
      Formatting: breakdown.Formatting || { score: 0, max: 10, deductions: [] },
      FormattingEnhanced: breakdown.FormattingEnhanced || { score: 0, max_score: 20, percentage: 0, details: {} },
      Internships: breakdown.Internships || { score: 0, max: 10, deductions: [] },
      ContentQuality: breakdown.ContentQuality || { score: 0, max_score: 15, details: {} },
      ATSCompatibility: breakdown.ATSCompatibility || breakdown.ats_compatibility || { score: 0, max_score: 5, details: {} },
      Keywords: breakdown.Keywords || breakdown.keywords || { score: 0, max_score: 30, details: {} },
      LengthScore: breakdown.LengthScore || breakdown.length_score || { score: 0, max_score: 10, details: {} },
      StructureScore: breakdown.StructureScore || breakdown.structure_score || { score: 0, max_score: 20, details: {} },
      Suggestions: atsData?.ats_score?.Suggestions || breakdown.Suggestions || [],
    },
    Fresher: atsData?.Fresher ?? true,
    Domain: atsData?.Domain || "General",
  };
}

/* ---------------------------------------------------
   PRIORITY META
---------------------------------------------------- */
const PRIORITY_META = {
  critical: {
    borderColor: "border-red-100",
    badge: "text-red-600 bg-red-50 border border-red-100",
    icon: AlertTriangle,
    label: "Critical Fix",
    chipActive: "text-red-500",
    bgColor: "bg-red-50/50",
    dot: "bg-red-500",
  },
  urgent: {
    borderColor: "border-orange-100",
    badge: "text-orange-600 bg-orange-50 border border-orange-100",
    icon: AlertCircle,
    label: "Urgent Fix",
    chipActive: "text-orange-500",
    bgColor: "bg-orange-50/50",
    dot: "bg-orange-400",
  },
  optional: {
    borderColor: "border-gray-200",
    badge: "text-gray-600 bg-gray-100 border border-gray-200",
    icon: Info,
    label: "Optional Fix",
    chipActive: "text-gray-500",
    bgColor: "bg-gray-50/50",
    dot: "bg-gray-400",
  },
};

const SECTION_META: Record<string, { icon: React.ElementType }> = {
  Contact:           { icon: User },
  Education:         { icon: GraduationCap },
  Experience:        { icon: Briefcase },
  Projects:          { icon: FolderKanban },
  Skills:            { icon: Code },
  Certifications:    { icon: Award },
  Summary:           { icon: FileText },
  Internships:       { icon: Briefcase },
  Keywords:          { icon: Target },
  Formatting:        { icon: BarChart3 },
  FormattingEnhanced:{ icon: BarChart3 },
  ContentQuality:    { icon: BookOpen },
  ATSCompatibility:  { icon: Sparkles },
  LengthScore:       { icon: FileText },
  StructureScore:    { icon: BarChart3 },
};

/* ---------------------------------------------------
   CIRCULAR GAUGE
---------------------------------------------------- */
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
  const radius   = 85;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative" style={{ width: 240, height: 240 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-xl opacity-30" />
        <svg className="-rotate-90 relative z-10" width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
          <circle cx="120" cy="120" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(animated / 100) * circumference} ${circumference}`}
            style={{ transition: "stroke-dasharray 1s ease-in-out, stroke 0.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-extrabold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>{animated}</div>
          <div className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">ATS Score</div>
          <div className="mt-3 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <span className="text-xs font-semibold text-gray-600">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   STAT CARD
---------------------------------------------------- */
function StatCard({ icon: Icon, label, value, iconColor, iconBg }: { icon: React.ElementType; label: string; value: string | number; iconColor: string; iconBg: string }) {
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

/* ---------------------------------------------------
   ISSUE CARD
---------------------------------------------------- */
function IssueCardItem({ issue, onFix, onDismiss }: { issue: IssueCard; onFix: () => void; onDismiss: () => void }) {
  const meta = PRIORITY_META[issue.priority];
  const Icon = meta.icon;

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${meta.borderColor}`}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            issue.priority === "critical" ? "bg-red-50" : issue.priority === "urgent" ? "bg-orange-50" : "bg-gray-100"
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

        <div className="flex items-start gap-2 bg-[#f8faff] border border-[#dce8f8] rounded-lg p-3 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#2557a7] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700 leading-relaxed">{issue.suggestion}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onDismiss} className="px-3 py-2 border border-gray-200 text-gray-500 font-medium text-xs rounded-lg hover:bg-gray-50 transition-all">
            Ignore
          </button>
          <button onClick={onFix} className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2557a7] hover:bg-[#1a4a8f] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
            <WrenchIcon className="w-3.5 h-3.5" />
            Fix Now with AI
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   MAIN PAGE
---------------------------------------------------- */
export default function ResumeScorePage() {
  const router = useRouter();
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"critical" | "urgent" | "optional">("critical");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atsAnalysisData") || localStorage.getItem("ats_analysis");
      if (raw) setScoreData(transformATSDataToScoreFormat(JSON.parse(raw)));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const issues = useMemo(() => scoreData ? extractIssueCards(scoreData.Breakdown) : [], [scoreData]);

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

  const allScoreItems: ScoreItem[] = useMemo(() => {
    if (!scoreData) return [];
    const b = scoreData.Breakdown;
    const calcPct = (key: string): number => {
      const item = b[key] as BreakdownItem;
      if (!item || typeof item !== "object") return -1;
      const directPct = item.percentage;
      if (typeof directPct === "number") return Math.min(100, Math.round(directPct));
      const max = item.max_raw_score || item.max || item.max_score || 0;
      const s   = item.raw_score ?? item.score ?? 0;
      if (max > 0) return Math.min(100, Math.round((s / max) * 100));
      return -1;
    };
    const isReal = (key: string): boolean => {
      const item = b[key] as Record<string, unknown>;
      return !!item && ("percentage" in item || Number((item as BreakdownItem).raw_score) > 0);
    };
    return ["Contact","Education","Experience","Projects","Skills","Certifications","Summary","Internships",
      "Keywords","Formatting","ContentQuality","ATSCompatibility","LengthScore","StructureScore"]
      .filter(k => isReal(k))
      .map(k => ({ name: k, score: Math.max(0, calcPct(k)), icon: (SECTION_META[k] || { icon: FileText }).icon }));
  }, [scoreData]);

  const pct = scoreData ? Math.min(100, Math.round(scoreData.FinalWeightedScore)) : 0;
  const getConfidence = (s: number) => s >= 90 ? 5 : s >= 75 ? 4 : s >= 60 ? 3 : s >= 45 ? 2 : 1;

  const handleFixNow = () => {
    try {
      const stored = localStorage.getItem("atsAnalysisData");
      if (stored) {
        const d = JSON.parse(stored) as { resume_id?: string; ats_breakdown_id?: string };
        if (d.resume_id) {
          const params = new URLSearchParams({ resume_id: d.resume_id, from_ats: "true" });
          if (d.ats_breakdown_id) params.set("ats_breakdown", d.ats_breakdown_id);
          router.push(`/enhancer?${params.toString()}`);
          return;
        }
      }
    } catch { /* ignore */ }
    router.push("/enhancer");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-lg font-semibold text-gray-800">Analyzing your resume…</p>
        <p className="text-sm text-gray-500 mt-2">This won&apos;t take long</p>
      </div>
    </div>
  );

  if (!scoreData) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Report Found</h2>
        <p className="text-gray-500 mb-8">Upload and scan your resume first to see your detailed analysis.</p>
        <button onClick={() => router.push("/ats")}
          className="w-full px-6 py-3.5 bg-[#2557a7] text-white rounded-xl font-bold hover:bg-[#1a4a8f] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 group">
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Go to ATS Scanner
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">

      {/* Page Header */}
      <div className="w-full bg-white px-6 pt-24 pb-6">
        <div className="max-w-[1650px] mx-auto flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-[#2557a7] flex items-center justify-center shadow-sm">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">ATS Resume Analysis Report</h1>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="w-full px-6 py-8">
        <div className="max-w-[1650px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT: Issues */}
            <div className="lg:col-span-8 space-y-6">

              {/* Pro Tip */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e8eff9] flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-[#2557a7]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Pro Tip</h3>
                      <span className="px-2 py-0.5 bg-[#e8eff9] text-[#2557a7] text-xs font-bold rounded-full border border-[#dce8f8]">ATS</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Focus on <strong>Critical</strong> issues first — they have the biggest impact on your ATS pass rate.
                      Each fix improves your chances of reaching a human recruiter.
                    </p>
                  </div>
                </div>
              </div>

              {/* Issues Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${issues.length === 0 ? "bg-blue-100 border-blue-200" : "bg-gray-100 border-gray-300"}`}>
                        {issues.length === 0
                          ? <CheckCircle className="w-7 h-7 text-[#2557a7]" />
                          : <AlertCircle className="w-7 h-7 text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-2xl text-gray-900">
                          {issues.length === 0 ? "Perfect Resume!" : "Issues Detected"}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {issues.length === 0 ? "Your resume is fully optimised" : `${issues.length} ${issues.length === 1 ? "item" : "items"} need your attention`}
                        </p>
                      </div>
                    </div>

                    {issues.length > 0 && (
                      <div className="flex items-center gap-3">
                        {(["critical", "urgent", "optional"] as const).map(type => {
                          const emoji = type === "critical" ? "🔴" : type === "urgent" ? "🟠" : "⚪";
                          const chipLabel = type === "critical" ? "Critical" : type === "urgent" ? "Urgent" : "Optional";
                          return (
                            <button key={type} onClick={() => setFilter(type)}
                              className={`group rounded-xl px-5 py-3 border min-w-[110px] transition-all ${
                                filter === type
                                  ? `${PRIORITY_META[type].bgColor} ${PRIORITY_META[type].borderColor} shadow-md scale-105`
                                  : "bg-gray-100 border-gray-300 hover:shadow-sm hover:scale-105 hover:bg-gray-200"
                              }`}>
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

                {/* Content */}
                <div className="p-6">
                  {issues.length === 0 ? (
                    <div className="py-16 text-center bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10 text-[#2557a7]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#2557a7] mb-2">All Clear!</h3>
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
                        <IssueCardItem key={issue.id} issue={issue} onFix={handleFixNow}
                          onDismiss={() => setDismissedIds(prev => new Set([...prev, issue.id]))} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Score + Breakdown */}
            <div className="lg:col-span-4 space-y-6">

              {/* Overall Score Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-[#2557a7] flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Overall Score</h2>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold text-white">ATS Ready</span>
                  </div>
                </div>

                <CircularGauge score={pct} />

                <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                  <StatCard icon={TrendingUp} label="Confidence" value={`${getConfidence(pct)}/5`} iconColor="text-emerald-500" iconBg="bg-emerald-50" />
                  <StatCard icon={AlertCircle} label="Issues" value={issues.length} iconColor="text-purple-500" iconBg="bg-purple-50" />
                </div>

                <div className="px-6 pb-6 space-y-3">
                  <button onClick={handleFixNow}
                    className="w-full px-6 py-3.5 bg-[#2557a7] text-white rounded-xl font-bold hover:bg-[#1a4a8f] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 group">
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Fix with AI Enhancer
                  </button>
                  <button onClick={() => router.push("/ats")}
                    className="w-full py-2 text-gray-500 font-semibold text-sm hover:text-[#2557a7] transition-colors flex items-center justify-center gap-2 group">
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Rescan Resume
                  </button>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2557a7] flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
                </div>
                <div className="px-6 py-6 space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {allScoreItems.map(item => {
                    const Icon = item.icon;
                    const label = item.name.replace(/Enhanced$/, "").replace(/([A-Z])/g, " $1").trim();
                    return (
                      <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Icon className="w-5 h-5 text-[#2557a7]" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">{label}</p>
                          </div>
                          <p className="text-base font-extrabold text-gray-800">{item.score}%</p>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2557a7] transition-all duration-700 ease-out rounded-full" style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
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
