"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScore(raw: any): number {
  if (typeof raw === "number") return Math.min(100, Math.max(0, raw));
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace("%", ""));
    return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
  }
  return 0;
}

interface SectionCardProps {
  label: string;
  score: number;
  passText: string;
  children?: React.ReactNode;
}

function SectionCard({ label, score, passText, children }: SectionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const passed = score >= 100;
  const hasDetails = !!children && !passed;

  const barColor = passed ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const titleColor = passed ? "#16a34a" : "#dc2626";
  const iconColor = passed ? "#22c55e" : "#ef4444";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {passed
              ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
              : <XCircle className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
            }
            <span className="text-[15px] font-bold" style={{ color: titleColor }}>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold" style={{ color: barColor }}>
              {score.toFixed(score % 1 === 0 ? 0 : 1)}%
            </span>
            {hasDetails && (
              <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors ml-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: barColor }}
          />
        </div>

        {/* Pass message */}
        {passed && (
          <p className="text-[13px] text-gray-500 mt-3">
            <span className="font-semibold text-gray-700">Way to go!</span> {passText}
          </p>
        )}
      </div>

      {/* Details */}
      {hasDetails && expanded && (
        <div className="border-t border-gray-100 px-6 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface ImpactGroupProps {
  label: string;
  bolts: number;
  children: React.ReactNode;
}

function ImpactGroup({ label, bolts, children }: ImpactGroupProps) {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 shadow-sm">
        <span className="text-[13px]">{Array.from({ length: bolts }).map(() => "⚡").join("")}</span>
        <span className="text-[12px] font-semibold text-gray-600">{label}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ScoreBreakdown({ matchResult }: { matchResult: any }) {
  if (!matchResult) return null;

  const tech = matchResult.Technical_Skills ?? {};
  const soft = matchResult.Soft_Skills ?? {};
  const cap  = matchResult.Capabilities_Check ?? {};
  const star = matchResult.STAR_Pattern_Check ?? {};
  const exp  = matchResult.Experience_Check ?? {};
  const edu  = matchResult.Education_Check ?? {};
  const job  = matchResult.Job_Title_Check ?? {};
  const cert = matchResult.Certifications_Check ?? {};
  const fmt  = matchResult.Formatting_Check ?? {};

  const techScore = parseScore(tech.match_score);
  const softScore = parseScore(soft.match_score);
  const capScore  = parseScore(cap.match_score);
  const starScore = parseScore(star.match_score);
  const expScore  = parseScore(exp.match_score);
  const eduScore  = parseScore(edu.match_score);
  const jobScore  = parseScore(job.match_score);
  const certScore = parseScore(cert.match_score);
  const fmtScore  = parseScore(fmt.match_score);

  const missingTech: { skill: string; importance: string }[] = [
    ...(tech.missing_critical_skills ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "required" })),
    ...(tech.missing_important_skills ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "important" })),
    ...(tech.missing_nice_to_have ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "nice to have" })),
  ];
  const missingSoft: string[] = soft.missing_skills ?? [];
  const missingCap: string[] = (cap.missing_capabilities ?? []).map((c: { capability: string }) => c.capability);
  const weakBullets: { original: string; improved: string }[] = star.weak_bullets ?? [];
  const starSuggestion: string = star.suggestion ?? "";
  const starSeniority: string  = star.seniority ?? "";

  return (
    <div className="space-y-5">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Score Breakdown</h3>

      {/* HIGH IMPACT */}
      <ImpactGroup label="High Impact" bolts={3}>
        <SectionCard label="Hard Skills" score={techScore} passText="Your resume includes all of the Hard skills.">
          {missingTech.length > 0 && (
            <ul className="space-y-2">
              {missingTech.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="font-semibold">{s.skill}</span>
                  <span className="text-gray-400 text-[12px]">({s.importance})</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </ImpactGroup>

      {/* MEDIUM IMPACT */}
      <ImpactGroup label="Medium Impact" bolts={2}>
        <SectionCard label="Soft Skills" score={softScore} passText="Your resume includes all of the Soft skills.">
          {missingSoft.length > 0 && (
            <ul className="space-y-2">
              {missingSoft.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />{s}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard label="Capabilities" score={capScore} passText="Your resume demonstrates all required capabilities.">
          {missingCap.length > 0 && (
            <ul className="space-y-2">
              {missingCap.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />{c}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard label="STAR Pattern" score={starScore} passText="Your bullets follow the STAR format with measurable results.">
          {(starSuggestion || starSeniority || weakBullets.length > 0) && (
            <div className="space-y-3">
              {(starSuggestion || starSeniority) && (
                <div className="flex items-start justify-between gap-3">
                  {starSuggestion && (
                    <p className="text-[13px] text-gray-600 leading-relaxed flex-1">
                      <span className="font-semibold text-gray-800">Tip:</span> {starSuggestion}
                    </p>
                  )}
                  {starSeniority && (
                    <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      {starSeniority}
                    </span>
                  )}
                </div>
              )}
              {weakBullets.length > 0 && (
                <ul className="space-y-3">
                  {weakBullets.map((b, i) => (
                    <li key={i} className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 space-y-1.5">
                      <p className="text-[12px] text-red-400 line-through leading-snug">{b.original}</p>
                      <p className="text-[12px] text-green-700 leading-snug font-medium">→ {b.improved}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SectionCard>
      </ImpactGroup>

      {/* LOW IMPACT */}
      <ImpactGroup label="Low Impact" bolts={1}>
        <SectionCard label="Job Title Match" score={jobScore} passText="Your job title aligns well with the role.">
          {job.reason && (
            <p className="text-[13px] text-gray-600 leading-relaxed">
              The job title <span className="font-bold text-gray-800">{job.matched_title}</span> was not found in your resume.
              {job.jd_title && <> Suggested: <span className="font-bold text-green-700">{job.jd_title}</span></>}
            </p>
          )}
        </SectionCard>

        <SectionCard label="Experience" score={expScore} passText="Your experience level matches the role requirements.">
          {exp.reason && expScore < 100 && <p className="text-[13px] text-gray-600 leading-relaxed">{exp.reason}</p>}
        </SectionCard>

        <SectionCard label="Education" score={eduScore} passText="Your education meets the role requirements.">
          {edu.reason && eduScore < 100 && <p className="text-[13px] text-gray-600 leading-relaxed">{edu.reason}</p>}
        </SectionCard>

        <SectionCard label="Certifications" score={certScore} passText="Your certifications meet the role requirements.">
          {cert.reason && certScore < 100 && <p className="text-[13px] text-gray-600 leading-relaxed">{cert.reason}</p>}
        </SectionCard>

        <SectionCard label="ATS Formatting" score={fmtScore} passText="Your resume formatting is ATS-friendly.">
          {fmt.reason && fmtScore < 100 && (
            <ul className="space-y-2">
              {fmt.reason.split(".,").filter(Boolean).map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {r.trim().replace(/\.$/, "")}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </ImpactGroup>
    </div>
  );
}
