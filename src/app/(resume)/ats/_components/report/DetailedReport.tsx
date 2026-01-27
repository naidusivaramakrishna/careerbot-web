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
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/* ---------------------------------------------------
   TYPES
---------------------------------------------------- */
interface BreakdownItem {
  score: number;
  max?: number;
  max_score?: number;
  deductions?: string[];
  percentage?: number;
  file?: string;
  details?: {
    [key: string]: any;
  };
}

interface ResumeScoreData {
  TotalScore: number;
  FinalWeightedScore: number;
  MaxScore: number;
  Breakdown: {
    [key: string]: BreakdownItem | string[];
    Suggestions?: string[];
  };
  Fresher: boolean;
  Domain: string;
}

interface ScoreItem {
  name: string;
  score: number;
  color: string;
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

  // Track unique issues to prevent duplicates
  const seenIssues = new Set<string>();

  Object.entries(breakdown).forEach(([section, data]) => {
    if (section === "Suggestions") return;

    // Skip old Formatting section if FormattingEnhanced exists
    if (section === "Formatting" && breakdown.FormattingEnhanced) return;

    const item = data as BreakdownItem;
    if (!item || typeof item !== "object") return;

    const deductions = item.deductions || [];
    const maxScore = item.max || item.max_score || 0;
    const score = item.score || 0;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 100;

    // Normalize section name for display (remove "Enhanced" suffix)
    const displaySection = section.replace(/Enhanced$/, "");

    deductions.forEach((deduction: string) => {
      // Create unique key for deduplication
      const uniqueKey = `${displaySection}:${deduction}`;
      if (seenIssues.has(uniqueKey)) return;
      seenIssues.add(uniqueKey);

      const priority =
        percentage === 0 || section === "Experience"
          ? "urgent"
          : percentage < 80
          ? "critical"
          : "optional";

      cards.push({
        id: `issue-${idCounter++}`,
        priority,
        section: displaySection,
        description: deduction,
        suggestion: `Fix the issue in ${displaySection.toLowerCase()} to improve your score.`,
      });
    });

    if (item.details) {
      if (item.details.grammar_errors) {
        const uniqueKey = `${displaySection}:grammar_errors`;
        if (!seenIssues.has(uniqueKey)) {
          seenIssues.add(uniqueKey);
          cards.push({
            id: `issue-${idCounter++}`,
            priority: "critical",
            section: displaySection,
            description: `${item.details.grammar_errors} grammar error(s) detected`,
            suggestion: "Review grammar for clarity.",
          });
        }
      }
      if (item.details.spelling_errors) {
        const uniqueKey = `${displaySection}:spelling_errors`;
        if (!seenIssues.has(uniqueKey)) {
          seenIssues.add(uniqueKey);
          cards.push({
            id: `issue-${idCounter++}`,
            priority: "critical",
            section: displaySection,
            description: `${item.details.spelling_errors} spelling error(s) detected`,
            suggestion: "Correct spelling mistakes.",
          });
        }
      }
      if (item.details.issues) {
        item.details.issues.forEach((issue: string) => {
          const uniqueKey = `${displaySection}:${issue}`;
          if (!seenIssues.has(uniqueKey)) {
            seenIssues.add(uniqueKey);
            cards.push({
              id: `issue-${idCounter++}`,
              priority: "optional",
              section: displaySection,
              description: issue,
              suggestion: "Improve formatting for better readability.",
            });
          }
        });
      }
    }
  });

  return cards;
}

/* ---------------------------------------------------
   TRANSFORM
---------------------------------------------------- */
function transformATSDataToScoreFormat(atsData: any): ResumeScoreData {
  // Fix: API returns lowercase 'breakdown', not 'Breakdown'
  const breakdown = atsData?.ats_score?.breakdown || atsData?.ats_score?.Breakdown || atsData?.breakdown || {};

  const finalWeightedScore =
    atsData?.finalWeightedScore ||
    atsData?.ats_score?.overall_score ||
    atsData?.ats_score?.breakdown?.FinalWeighted?.score ||
    atsData?.ats_score?.FinalWeightedScore ||
    atsData?.ats_score?.FinalWeighted?.score ||
    atsData?.ats_score?.TotalScore ||
    atsData?.ats_score?.score ||
    0;

  return {
    TotalScore: atsData?.ats_score?.TotalScore || atsData?.ats_score?.score || finalWeightedScore,
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
      FormattingEnhanced: breakdown.FormattingEnhanced || {
        score: 0,
        max_score: 20,
        percentage: 0,
        details: {},
      },
      "Language/Grammar": breakdown["Language/Grammar"] || { score: 0, max: 5, deductions: [] },
      Internships: breakdown.Internships || { score: 0, max: 10, deductions: [] },
      ContentQuality: breakdown.ContentQuality || {
        score: 0,
        max_score: 15,
        details: {},
      },
      SectionCompleteness: breakdown.SectionCompleteness || {
        score: 0,
        max_score: 5,
        details: {},
      },
      Keywords: breakdown.Keywords || { score: 0, max_score: 30, details: {} },
      LengthScore: breakdown.LengthScore || { score: 0, max_score: 10, details: {} },
      StructureScore: breakdown.StructureScore || { score: 0, max_score: 20, details: {} },
      Suggestions: breakdown.Suggestions || atsData?.ats_score?.Suggestions || [],
    },
    Fresher: atsData?.Fresher ?? true,
    Domain: atsData?.Domain || "General",
  };
}

/* ---------------------------------------------------
   PRIORITY META - Lighter Colors
---------------------------------------------------- */
const PRIORITY_META = {
  critical: {
    color: "border-red-100",
    badge: "text-red-600 bg-red-50 border border-red-100",
    icon: AlertTriangle,
    label: "Critical Fix",
    chipActive: "text-red-500",
    bgColor: "bg-red-50/50",
    borderColor: "border-red-100",
    hoverBg: "hover:bg-red-50",
    gradientFrom: "from-red-50",
    gradientTo: "to-red-50",
  },
  urgent: {
    color: "border-amber-100",
    badge: "text-amber-700 bg-amber-50 border border-amber-100",
    icon: AlertCircle,
    label: "Urgent Fix",
    chipActive: "text-amber-500",
    bgColor: "bg-amber-50/50",
    borderColor: "border-amber-100",
    hoverBg: "hover:bg-amber-50",
    gradientFrom: "from-amber-50",
    gradientTo: "to-amber-50",
  },
  optional: {
    color: "border-blue-100",
    badge: "text-blue-700 bg-blue-50 border border-blue-100",
    icon: Info,
    label: "Optional Fix",
    chipActive: "text-blue-500",
    bgColor: "bg-blue-50/50",
    borderColor: "border-blue-100",
    hoverBg: "hover:bg-blue-50",
    gradientFrom: "from-blue-50",
    gradientTo: "to-blue-50",
  },
};

/* ---------------------------------------------------
   CIRCULAR PROGRESS
---------------------------------------------------- */
function CircularProgressBar({ score, maxScore }: { score: number; maxScore: number }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = Math.round((score / maxScore) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getColor = (pct: number) =>
    pct >= 81 ? "#16a34a" : pct > 45 ? "#f59e0b" : "#ef4444";
  
  const getGradient = (pct: number) => {
    if (pct >= 81) return "from-green-400 to-green-500";
    if (pct > 45) return "from-amber-400 to-amber-500";
    return "from-red-400 to-red-500";
  };

  const radius = 85;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative" style={{ width: "240px", height: "240px" }}>
        {/* Outer glow effect - Lighter */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-xl opacity-30"></div>
        
        <svg className="-rotate-90 relative z-10" width="240" height="240" viewBox="0 0 240 240">
          {/* Background circle - Lighter */}
          <circle cx="120" cy="120" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
          
          {/* Progress circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth="12"
            strokeDasharray={`${(animatedPercentage / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
            style={{ 
              transition: "stroke-dasharray 1s ease-in-out, stroke 0.5s ease",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-extrabold bg-gradient-to-br ${getGradient(percentage)} bg-clip-text text-transparent drop-shadow-sm`}>
            {animatedPercentage}
          </div>
          <div className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">
            ATS Score
          </div>
          <div className="mt-3 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <span className="text-xs font-semibold text-gray-600">
              {percentage >= 81 ? "Excellent" : percentage > 45 ? "Good" : "Needs Work"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   STAT CARD - Lighter Version
---------------------------------------------------- */
function StatCard({ icon: Icon, label, value, iconColor, iconBg }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transform transition-all hover:scale-105 hover:shadow-md">
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
   ISSUES SECTION
---------------------------------------------------- */
function IssuesDetectedSection({ issueCards, activeFilter, setActiveFilter }: any) {
  const grouped = useMemo(
    () => ({
      urgent: issueCards.filter((i: IssueCard) => i.priority === "urgent"),
      critical: issueCards.filter((i: IssueCard) => i.priority === "critical"),
      optional: issueCards.filter((i: IssueCard) => i.priority === "optional"),
    }),
    [issueCards]
  );

  return (
    <>
      {/* Pro Tip Banner - Lighter */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 shadow-sm rounded-xl p-6 mb-6 w-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-20"></div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-md flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-800">Pro Tip</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">NEW</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Focus on high-priority issues first for the biggest impact. Each fix brings you closer to standing out in ATS systems and landing more interviews.
            </p>
          </div>
        </div>
      </div>

      {/* Issues Card - Lighter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${issueCards.length === 0 ? 'bg-green-50' : 'bg-red-50'} border ${issueCards.length === 0 ? 'border-green-100' : 'border-red-100'} flex items-center justify-center`}>
                {issueCards.length === 0 ? (
                  <CheckCircle className="w-7 h-7 text-green-500" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-extrabold text-2xl text-gray-800">
                  {issueCards.length === 0 ? "Perfect Resume!" : "Issues Detected"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {issueCards.length === 0
                    ? "Your resume is fully optimized"
                    : `${issueCards.length} ${issueCards.length === 1 ? 'item' : 'items'} need your attention`}
                </p>
              </div>
            </div>

            {issueCards.length > 0 && (
              <div className="flex items-center gap-3">
                {(["critical", "urgent", "optional"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`group rounded-xl px-5 py-3 border min-w-[120px] transition-all transform ${
                      activeFilter === type
                        ? `${PRIORITY_META[type].bgColor} ${PRIORITY_META[type].borderColor} shadow-md scale-105`
                        : `bg-white border-gray-100 hover:shadow-sm hover:scale-105`
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-3xl font-black ${activeFilter === type ? PRIORITY_META[type].chipActive : 'text-gray-300 group-hover:text-gray-400'}`}>
                        {grouped[type].length}
                      </div>
                      <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${activeFilter === type ? PRIORITY_META[type].chipActive : 'text-gray-400'}`}>
                        {type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {issueCards.length === 0 ? (
            <div className="py-16 text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">All Clear!</h3>
              <p className="text-sm text-green-600 max-w-md mx-auto">
                Your resume is in excellent shape. No critical issues detected.
              </p>
            </div>
          ) : (
            <>
              {grouped[activeFilter].length === 0 ? (
                <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-600">
                    No {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Issues
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Great job on this category!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped[activeFilter].map((issue: IssueCard, idx: number) => (
                    <div
                      key={issue.id}
                      className={`group p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${PRIORITY_META[activeFilter].color} ${PRIORITY_META[activeFilter].bgColor} hover:scale-[1.01]`}
                    >
                      {/* Issue Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-lg ${PRIORITY_META[activeFilter].borderColor} border bg-white flex items-center justify-center`}>
                          {React.createElement(PRIORITY_META[activeFilter].icon, {
                            className: `w-5 h-5 ${PRIORITY_META[activeFilter].chipActive}`,
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-lg text-gray-800">{issue.section}</p>
                            <span
                              className={`text-xs px-3 py-1 font-bold rounded-full uppercase tracking-wide ${PRIORITY_META[activeFilter].badge}`}
                            >
                              {PRIORITY_META[activeFilter].label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                        </div>
                      </div>

                      {/* Suggestion Box */}
                      <div className="flex items-start gap-3 bg-white border border-dashed border-gray-200 rounded-lg p-4 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Suggested Fix</p>
                          <p className="text-sm font-medium text-gray-700">{issue.suggestion}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button className="flex-1 border border-gray-200 text-gray-600 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                          Ignore
                        </button>
                        <button className="flex-1 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#3d689d] to-[#2a4a6d] hover:from-[#365b87] hover:to-[#23415e] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                          Fix now
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------
   MAIN PAGE
---------------------------------------------------- */
export default function ResumeScorePage() {
  const router = useRouter();
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"urgent" | "critical" | "optional">("urgent");

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("atsAnalysisData") ||
        localStorage.getItem("ats_analysis");

      if (raw) {
        const atsData = JSON.parse(raw);
        setScoreData(transformATSDataToScoreFormat(atsData));
      }
    } catch (err) {
      console.log("Error reading ATS data");
    } finally {
      setLoading(false);
    }
  }, []);

  const issueCards = useMemo(
    () => (scoreData ? extractIssueCards(scoreData.Breakdown) : []),
    [scoreData]
  );

  useEffect(() => {
    if (!issueCards.length) return;
    const hasCritical = issueCards.some((i) => i.priority === "critical");
    const hasUrgent = issueCards.some((i) => i.priority === "urgent");

    if (hasCritical) {
      setActiveFilter("critical");
    } else if (hasUrgent) {
      setActiveFilter("urgent");
    } else {
      setActiveFilter("optional");
    }
  }, [issueCards]);

  const allScoreItems: ScoreItem[] = useMemo(() => {
    if (!scoreData) return [];

    const breakdown = scoreData.Breakdown;
    const getScore = (key: string) => {
      const item = breakdown[key] as BreakdownItem;
      const max = item.max || item.max_score || 0;
      return max ? Math.round((item.score / max) * 100) : 0;
    };

    return [
      { name: "Contact", score: getScore("Contact"), color: "bg-gradient-to-r from-blue-300 to-blue-400", icon: User },
      { name: "Education", score: getScore("Education"), color: "bg-gradient-to-r from-purple-300 to-purple-400", icon: GraduationCap },
      { name: "Experience", score: getScore("Experience"), color: "bg-gradient-to-r from-indigo-300 to-indigo-400", icon: Briefcase },
      { name: "Projects", score: getScore("Projects"), color: "bg-gradient-to-r from-cyan-300 to-cyan-400", icon: FolderKanban },
      { name: "Skills", score: getScore("Skills"), color: "bg-gradient-to-r from-green-300 to-green-400", icon: Code },
      { name: "Certifications", score: getScore("Certifications"), color: "bg-gradient-to-r from-amber-300 to-amber-400", icon: Award },
      { name: "Internships", score: getScore("Internships"), color: "bg-gradient-to-r from-pink-300 to-pink-400", icon: Briefcase },
      { name: "Keywords", score: getScore("Keywords"), color: "bg-gradient-to-r from-emerald-300 to-emerald-400", icon: Target },
      { name: "FormattingEnhanced", score: getScore("FormattingEnhanced"), color: "bg-gradient-to-r from-blue-400 to-blue-500", icon: BarChart3 },
      { name: "ContentQuality", score: getScore("ContentQuality"), color: "bg-gradient-to-r from-orange-300 to-orange-400", icon: BookOpen },
      { name: "Language/Grammar", score: getScore("Language/Grammar"), color: "bg-gradient-to-r from-sky-300 to-sky-400", icon: Sparkles },
      { name: "LengthScore", score: getScore("LengthScore"), color: "bg-gradient-to-r from-violet-300 to-violet-400", icon: FileText },
      { name: "StructureScore", score: getScore("StructureScore"), color: "bg-gradient-to-r from-teal-300 to-teal-400", icon: BarChart3 },
    ];
  }, [scoreData]);

  const percentage = scoreData
    ? Math.round((scoreData.FinalWeightedScore / scoreData.MaxScore) * 100)
    : 0;

  const getConfidence = (score: number) =>
    score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 45 ? 2 : 1;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3d689d] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg font-semibold text-gray-700">Analyzing your resume...</p>
          <p className="text-sm text-gray-400 mt-2">This won't take long</p>
        </div>
      </div>
    );

  if (!scoreData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md text-center bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">No Data Found</h2>
          <p className="text-gray-500 mb-8">Please upload and scan your resume first to see your detailed analysis.</p>
          <button
            onClick={() => router.push("/ats")}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#3d689d] to-[#2a4a6d] text-white rounded-lg font-bold hover:from-[#365b87] hover:to-[#23415e] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 group"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Upload & Scan Resume
          </button>
        </div>
      </div>
    );

  return (
    <div className="w-full bg-gray-50 min-h-screen pt-18">
      {/* Header - Non-sticky to prevent overlap */}
      <div className="w-full bg-white border-b border-gray-100 px-6 py-6 shadow-sm">
        <div className="max-w-[1650px] mx-auto">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3d689d] to-[#2a4a6d] flex items-center justify-center shadow-md">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Resume Analysis Report</h1>
              <p className="text-sm text-gray-500 mt-1">
                Professional insights to maximize your ATS score and interview chances
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8">
        <div className="max-w-[1650px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Left Column - Issues */}
            <div className="lg:col-span-7 w-full space-y-6">
              <IssuesDetectedSection
                issueCards={issueCards}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
              />
            </div>

            {/* Right Column - Score & Breakdown */}
            <div className="lg:col-span-5 space-y-6 w-full">
              {/* Overall Score Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-[#3d689d] to-[#2a4a6d] flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Overall Score</h2>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold text-white">ATS Ready</span>
                  </div>
                </div>
                
                <CircularProgressBar score={scoreData.FinalWeightedScore} maxScore={100} />
                
                {/* Stats Grid - White Cards */}
                <div className="grid grid-cols-2 gap-4 px-6 pb-6">
                  <StatCard 
                    icon={TrendingUp}
                    label="Confidence"
                    value={`${getConfidence(percentage)}/5`}
                    iconColor="text-blue-500"
                    iconBg="bg-blue-50"
                  />
                  <StatCard 
                    icon={AlertCircle}
                    label="Issues"
                    value={issueCards.length}
                    iconColor="text-purple-500"
                    iconBg="bg-purple-50"
                  />
                </div>

                {/* Rescan Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => router.push("/ats")}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-[#3d689d] to-[#2a4a6d] text-white rounded-lg font-bold hover:from-[#365b87] hover:to-[#23415e] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 group"
                  >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Upload & Rescan
                  </button>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Score Breakdown</h2>
                </div>

                <div className="px-6 py-6 space-y-5 max-h-[550px] overflow-y-auto custom-scrollbar">
                  {allScoreItems.map((item, index) => {
                    const IconComp = item.icon;
                    return (
                      <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <IconComp className="w-5 h-5 text-gray-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">{item.name}</p>
                          </div>
                          <p className="text-base font-extrabold text-gray-800">{item.score}%</p>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all duration-700 ease-out rounded-full`}
                            style={{ width: `${item.score}%` }}
                          ></div>
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

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
