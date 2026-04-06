"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  BarChart3,
  ChevronDown,
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
}

interface IssueCard {
  id: string;
  priority: "urgent" | "critical" | "optional";
  section: string;
  description: string;
  suggestion: string;
}

/* ---------------------------------------------------
   CONSTANTS
---------------------------------------------------- */
const PRIORITY_META = {
  critical: {
    icon: AlertTriangle,
    label: "Critical Fix",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  urgent: {
    icon: AlertCircle,
    label: "Urgent Fix",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  optional: {
    icon: Info,
    label: "Optional",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

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

    deductions.forEach((deduction: any) => {
      let deductionText: string;
      if (typeof deduction === "string") {
        deductionText = deduction;
      } else if (typeof deduction === "object" && deduction !== null) {
        deductionText = deduction.message || deduction.description || JSON.stringify(deduction);
      } else {
        return;
      }

      const uniqueKey = `${displaySection}:${deductionText}`;
      if (seenIssues.has(uniqueKey)) return;
      seenIssues.add(uniqueKey);
      const priority = percentage === 0 || section === "Experience" ? "critical" : percentage < 80 ? "urgent" : "optional";
      cards.push({ id: `issue-${idCounter++}`, priority, section: displaySection, description: deductionText, suggestion: `Review and improve the ${displaySection} section.` });
    });
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
      cards.push({ id: `issue-${idCounter++}`, priority: "optional", section: sectionName, description, suggestion: `Improve ${sectionName}.` });
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
   ISSUE CARD
---------------------------------------------------- */
function IssueCardComponent({ issue }: { issue: IssueCard }) {
  const meta = PRIORITY_META[issue.priority];
  const IconComponent = meta.icon;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${meta.borderColor} ${meta.bgColor} hover:shadow-md transition-all cursor-pointer`}>
      <div className="shrink-0 w-6 h-6 mt-0.5">
        <IconComponent className={`w-6 h-6 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-900">{issue.section}</p>
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${meta.bgColor} ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm text-gray-700 mb-1">{issue.description}</p>
        <p className="text-xs text-gray-600 italic">{issue.suggestion}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   SECTION BAR
---------------------------------------------------- */
function SectionBar({ name, score }: { name: string; score: number }) {
  const label = name.replace(/Enhanced$/, "").replace(/([A-Z])/g, " $1").trim();
  const getColor = (s: number) => {
    if (s >= 80) return "#10b981";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs font-bold text-gray-800">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: getColor(score) }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   MAIN COMPONENT
---------------------------------------------------- */
export default function ResumeScorePage() {
  const router = useRouter();
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"critical" | "urgent" | "optional">("critical");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("atsAnalysisData") || localStorage.getItem("ats_analysis");
      if (raw) setScoreData(transformATSDataToScoreFormat(JSON.parse(raw)));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const issues = useMemo(() => scoreData ? extractIssueCards(scoreData.Breakdown) : [], [scoreData]);

  const grouped = useMemo(() => ({
    critical: issues.filter(i => i.priority === "critical"),
    urgent: issues.filter(i => i.priority === "urgent"),
    optional: issues.filter(i => i.priority === "optional"),
  }), [issues]);

  const allScoreItems: ScoreItem[] = useMemo(() => {
    if (!scoreData) return [];
    const b = scoreData.Breakdown;
    const calcPct = (key: string): number => {
      const item = b[key] as BreakdownItem;
      if (!item || typeof item !== "object") return -1;
      const directPct = item.percentage;
      if (typeof directPct === "number") return Math.min(100, Math.round(directPct));
      const max = item.max_raw_score || item.max || item.max_score || 0;
      const s = item.raw_score ?? item.score ?? 0;
      if (max > 0) return Math.min(100, Math.round((s / max) * 100));
      return -1;
    };
    const isReal = (key: string): boolean => {
      const item = b[key] as Record<string, unknown>;
      return !!item && ("percentage" in item || Number((item as BreakdownItem).raw_score) > 0);
    };
    return ["Contact", "Education", "Experience", "Projects", "Skills", "Certifications", "Summary", "Internships",
      "Keywords", "Formatting", "ContentQuality", "ATSCompatibility", "LengthScore", "StructureScore"]
      .filter(k => isReal(k))
      .map(k => ({ name: k, score: Math.max(0, calcPct(k)) }));
  }, [scoreData]);

  const pct = scoreData ? Math.min(100, Math.round(scoreData.FinalWeightedScore)) : 0;

  const criticalIssues = issues.filter(i => i.priority === "critical");
  const urgentIssues = issues.filter(i => i.priority === "urgent");

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

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
        <p className="text-gray-500 mb-8">Upload and scan your resume first.</p>
        <button onClick={() => router.push("/ats")}
          className="w-full px-6 py-3 bg-[#2557a7] text-white rounded-xl font-bold hover:bg-[#1a4a8f] shadow-sm transition-all flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5" />
          Go to ATS Scanner
        </button>
      </div>
    </div>
  );


  return (
    <div className="w-full bg-gray-50 min-h-screen">

      {/* HERO SECTION */}
      <div className="w-full bg-white border-b border-gray-200 px-6 pt-20 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">

            {/* Left: Title & CTA */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">ATS Resume Analysis Report</h1>
              <p className="text-sm text-gray-500 mb-4">Boost your resume to meet top recruiter standards</p>
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
                Fix {criticalIssues.length + urgentIssues.length} high-impact areas → Reach 90+
              </div>
              <div>
                <button onClick={handleFixNow}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all group">
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Improve with AI
                </button>
              </div>
            </div>

            {/* Right: Score + Info */}
            <div className="flex items-center gap-6 shrink-0">
              {/* Circle Score */}
              <div className="relative w-36 h-36">
                <svg className="-rotate-90 w-full h-full" viewBox="0 0 144 144">
                  <circle cx="72" cy="72" r="62" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="72" cy="72" r="62" fill="none" stroke="#f59e0b" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${(pct / 100) * 390} 390`}
                    style={{ transition: "stroke-dasharray 1s ease-in-out" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-orange-500 leading-none">{pct}</span>
                  <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">ATS Score</span>
                  <span className="text-[9px] text-gray-400 mt-1">
                    {pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : "Needs Work"}
                  </span>
                </div>
              </div>
              {/* Info */}
              <div className="border-l border-gray-200 pl-6 space-y-1">
                <p className="text-sm font-semibold text-gray-800">Fix {criticalIssues.length + urgentIssues.length} high-impact</p>
                <p className="text-sm font-semibold text-gray-800">areas → Reach 90+</p>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  Confidence: {Math.min(5, Math.round((pct / 20)))}/5
                  <ChevronDown className="w-3 h-3" />
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Body */}
      <div className="w-full px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT: Issues (8 cols) */}
            <div className="lg:col-span-8 space-y-4">

              {/* Issues Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Issues Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    {/* Title */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${issues.length === 0 ? "bg-emerald-100" : "bg-gray-100"}`}>
                        {issues.length === 0
                          ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                          : <AlertCircle className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          {issues.length === 0 ? "Perfect Resume!" : "Issues Detected"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {issues.length === 0 ? "Fully optimized" : `${issues.length} items need your attention`}
                        </p>
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    {issues.length > 0 && (
                      <div className="flex items-center gap-2">
                        {(["critical", "urgent", "optional"] as const).map(type => {
                          const dotColor = type === "critical" ? "bg-red-500" : type === "urgent" ? "bg-orange-400" : "bg-gray-400";
                          const activeStyle = type === "critical"
                            ? "bg-red-50 border-red-300 text-red-700"
                            : type === "urgent"
                            ? "bg-orange-50 border-orange-300 text-orange-700"
                            : "bg-gray-100 border-gray-300 text-gray-700";
                          const inactiveStyle = "bg-white border-gray-200 text-gray-400 hover:bg-gray-50";
                          const chipLabel = type === "critical" ? "Critical Issues" : type === "urgent" ? "Urgent Fixes" : "Optional";
                          return (
                            <button
                              key={type}
                              onClick={() => setFilter(type)}
                              className={`flex flex-col items-center px-4 py-2.5 rounded-xl border text-center min-w-[100px] transition-all ${filter === type ? activeStyle : inactiveStyle}`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                <span className="text-2xl font-black leading-none">{grouped[type].length}</span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wide">{chipLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Issues Content */}
                <div className="p-5">
                  {issues.length === 0 ? (
                    <div className="py-12 text-center bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-emerald-700 mb-1">All Clear!</h3>
                      <p className="text-sm text-emerald-600/80">Your resume is in excellent shape.</p>
                    </div>
                  ) : grouped[filter].length === 0 ? (
                    <div className="py-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                      <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-gray-600 capitalize">No {filter} issues</h3>
                      <p className="text-sm text-gray-400 mt-1">Great job on this category!</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar space-y-3">
                      {(() => {
                        const sectionGroups: Record<string, IssueCard[]> = {};
                        grouped[filter].forEach(issue => {
                          if (!sectionGroups[issue.section]) sectionGroups[issue.section] = [];
                          sectionGroups[issue.section].push(issue);
                        });
                        return Object.entries(sectionGroups).map(([section, sectionIssues]) => {
                          const isCollapsed = collapsedSections.has(section);
                          return (
                            <div key={section}>
                              <button
                                onClick={() => toggleSection(section)}
                                className="flex items-center gap-2 w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                              >
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{section}</span>
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  {sectionIssues.length}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-300 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                              </button>
                              {!isCollapsed && (
                                <div className="mt-2 space-y-2">
                                  {sectionIssues.map(issue => (
                                    <IssueCardComponent key={issue.id} issue={issue} />
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

            {/* RIGHT: Score Breakdown (4 cols) */}
            <div className="lg:col-span-4 space-y-4">

              {/* Score Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2557a7] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Score Breakdown</h2>
                </div>

                <div className="px-5 py-5 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
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
