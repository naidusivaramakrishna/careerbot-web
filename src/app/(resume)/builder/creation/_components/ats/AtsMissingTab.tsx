"use client";

import React, { useState } from "react";
import { ArrowRight, Award, BookOpen, BriefcaseBusiness, CheckCircle2, FileText, Folder, GraduationCap, HeartHandshake, IdCard, Info, Languages, Lightbulb, Mail, Medal, Star, Trophy, Users, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useResume } from "../../_context/ResumeContext";
import { buildAtsSectionIssues, getEstimatedAtsScore, getAtsScoreValue } from "../../_utils/atsMissing";

const icons: Record<string, React.ElementType> = {
  "Personal Info": IdCard,
  "Contact Information": Mail,
  "Professional Summary": FileText,
  "Work Experience": BriefcaseBusiness,
  Skills: Star,
  Projects: Folder,
  Education: GraduationCap,
  Certifications: Award,
  Achievements: Medal,
  Internships: BriefcaseBusiness,
  Awards: Trophy,
  Publications: BookOpen,
  Volunteering: HeartHandshake,
  Languages: Languages,
  References: Users,
  "Additional Information": Info,
};

const severityStyle = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-slate-100 text-slate-600",
};

export default function AtsMissingTab() {
  const { resumeData, enhancedAtsScore, enhancedSuggestions, applyAutoFix } = useResume();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const issues = buildAtsSectionIssues(enhancedAtsScore, enhancedSuggestions, resumeData);
  const currentScore = getAtsScoreValue(enhancedAtsScore);
  const estimatedScore = getEstimatedAtsScore(currentScore, enhancedAtsScore);
  const autoIssues = issues.filter(issue => issue.fixType === "auto");

  const handleFix = async (id: string, isAuto: boolean) => {
    if (!isAuto) {
      toast.info("Open the editor and complete this section manually.");
      return;
    }
    setLoadingId(id);
    try {
      await applyAutoFix(id);
      toast.success("ATS fix applied.");
    } catch {
      toast.error("Failed to apply this fix.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleFixAll = async () => {
    if (autoIssues.length === 0) {
      toast.info("No auto-fixable ATS items available. Please complete the remaining sections manually.");
      return;
    }
    setIsFixingAll(true);
    try {
      for (const issue of autoIssues) {
        setLoadingId(issue.id);
        await applyAutoFix(issue.id);
      }
      toast.success("Auto-fixable ATS items applied.");
    } catch {
      toast.error("Some ATS fixes could not be applied.");
    } finally {
      setLoadingId(null);
      setIsFixingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">ATS Score Lift</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-black text-red-500">{currentScore}%</span>
              <ArrowRight size={18} className="text-slate-400" />
              <span className="text-2xl font-black text-emerald-600">{estimatedScore == null ? "—" : `${estimatedScore}%`}</span>
            </div>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm ring-1 ring-blue-100">
            <div className="text-xl font-black text-red-500">{issues.length}</div>
            <div className="text-[10px] font-bold text-slate-500">missing</div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Address these missing sections</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">High-impact items are shown first. Complete them to improve ATS coverage and score.</p>
          </div>
          <button
            type="button"
            onClick={handleFixAll}
            disabled={isFixingAll}
            className="shrink-0 rounded-lg bg-[#2557a7] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#1f4e98] disabled:cursor-wait disabled:opacity-60"
          >
            {isFixingAll ? "Fixing..." : "Fix All"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {issues.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="mb-2" size={20} />
            No missing ATS sections found.
          </div>
        ) : issues.map((issue) => {
          const Icon = icons[issue.label] || FileText;
          const isAuto = issue.fixType === "auto";
          const loading = loadingId === issue.id;
          return (
            <div key={issue.id} className="rounded-lg border border-red-200 bg-red-50/70 p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">{issue.label}</h4>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${severityStyle[issue.severity]}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-red-600">Missing</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{issue.message}</p>
                  <p className="mt-1 text-xs font-black text-emerald-600">Impact: +{issue.impact} ATS</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFix(issue.id, isAuto)}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-600 shadow-sm transition hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? "Fixing..." : isAuto ? "Fix Now" : "Edit"}
                  <WandSparkles size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        <div className="flex gap-2">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <span><strong>Tip:</strong> Complete high impact sections first to maximize your score.</span>
        </div>
      </div>
    </div>
  );
}
