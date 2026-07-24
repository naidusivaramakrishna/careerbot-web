"use client";

import React from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Folder,
  GraduationCap,
  HeartHandshake,
  IdCard,
  Languages,
  Mail,
  Medal,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { ATS_TRACKED_SECTIONS, buildAtsSectionIssues } from "../../_utils/atsMissing";

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
  "Additional Information": Sparkles,
};

export default function AtsSectionChecklist() {
  const { resumeData, enhancedAtsScore, enhancedSuggestions } = useResume();
  const issues = buildAtsSectionIssues(enhancedAtsScore, enhancedSuggestions, resumeData);
  const issueBySection = new Map(issues.map(issue => [issue.label, issue]));
  const completed = ATS_TRACKED_SECTIONS.filter(section => !issueBySection.has(section)).length;

  return (
    <aside className="flex w-[360px] min-w-[340px] shrink-0 border-r border-slate-200 bg-[#f8fafd] px-4 py-4">
      <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-slate-950">Resume Sections</h2>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">Complete missing sections first</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-[7px] border-blue-100 border-r-[#2557a7] text-center">
            <span className="text-lg font-black leading-none text-slate-950">{ATS_TRACKED_SECTIONS.length}</span>
            <span className="mt-1 text-[10px] font-black text-slate-500">Total</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
          <div>
            <div className="text-2xl font-black leading-none text-emerald-600">{completed}</div>
            <div className="mt-2 text-sm font-bold text-slate-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-black leading-none text-red-600">{issues.length}</div>
            <div className="mt-2 text-sm font-bold text-slate-500">Remaining</div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {ATS_TRACKED_SECTIONS.map((section) => {
            const issue = issueBySection.get(section);
            const Icon = icons[section] || FileText;
            const isMissing = Boolean(issue);

            return (
              <div
                key={section}
                className={`rounded-lg border p-3 transition ${
                  isMissing
                    ? "border-red-200 bg-red-50/80"
                    : "border-emerald-100 bg-emerald-50/70"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      isMissing ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black leading-5 text-slate-950">{section}</div>
                    <div className={`mt-0.5 truncate text-xs font-black ${isMissing ? "text-red-600" : "text-emerald-600"}`}>
                      {isMissing ? `Missing +${issue?.impact || 1} ATS` : "Complete"}
                    </div>
                  </div>

                  {isMissing ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden rounded-md bg-white px-2 py-1 text-[11px] font-black text-violet-600 shadow-sm ring-1 ring-violet-100 2xl:inline">
                        Generate
                      </span>
                      <AlertTriangle className="text-red-500" size={18} />
                    </div>
                  ) : (
                    <CheckCircle2 className="shrink-0 text-emerald-600" size={18} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
