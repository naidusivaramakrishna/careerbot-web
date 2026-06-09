"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

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
  const passed = score >= 100;
  const hasMissing = !!children;

  const barColor = passed
    ? "linear-gradient(90deg,#22c55e,#16a34a)"
    : score >= 60
    ? "linear-gradient(90deg,#f59e0b,#d97706)"
    : "linear-gradient(90deg,#ef4444,#dc2626)";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        {/* Row: icon + label + bar + % */}
        <div className="flex items-center gap-3">
          {passed ? (
            <CheckCircle className="w-4.5 h-4.5 text-green-500 shrink-0" />
          ) : (
            <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
          )}
          <span className={`text-[13px] font-bold shrink-0 w-32 ${passed ? "text-green-700" : "text-red-600"}`}>
            {label}
          </span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: barColor }}
            />
          </div>
          <span className={`text-[13px] font-bold shrink-0 w-10 text-right ${passed ? "text-green-600" : "text-red-600"}`}>
            {score.toFixed(score % 1 === 0 ? 0 : 1)}%
          </span>
        </div>

        {/* Way to go message */}
        {passed && (
          <p className="text-[12px] text-gray-400 pl-7.5">
            <span className="font-semibold text-gray-600">Way to go!</span> {passText}
          </p>
        )}
      </div>

      {/* Missing items — always visible, pure white */}
      {hasMissing && !passed && (
        <div className="border-t border-gray-100 bg-white px-5 py-3">
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
  const boltEl = Array.from({ length: bolts }).map((_, i) => (
    <span key={i} className="text-[#f59e0b]">⚡</span>
  ));
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm text-[11px] font-semibold text-gray-700">
        {boltEl} {label}
      </div>
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ScoreBreakdown({ matchResult }: { matchResult: any }) {
  if (!matchResult) return null;

  const tech = matchResult.Technical_Skills ?? {};
  const soft = matchResult.Soft_Skills ?? {};
  const cap = matchResult.Capabilities_Check ?? {};
  const star = matchResult.STAR_Pattern_Check ?? {};
  const exp = matchResult.Experience_Check ?? {};
  const edu = matchResult.Education_Check ?? {};
  const job = matchResult.Job_Title_Check ?? {};
  const cert = matchResult.Certifications_Check ?? {};
  const fmt = matchResult.Formatting_Check ?? {};

  const techScore = parseScore(tech.match_score);
  const softScore = parseScore(soft.match_score);
  const capScore  = parseScore(cap.match_score);
  const starScore = parseScore(star.match_score);
  const expScore  = parseScore(exp.match_score);
  const eduScore  = parseScore(edu.match_score);
  const jobScore  = parseScore(job.match_score);
  const certScore = parseScore(cert.match_score);
  const fmtScore  = parseScore(fmt.match_score);

  // Missing tech skills
  const missingTech: { skill: string; importance: string }[] = [
    ...(tech.missing_critical_skills ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "required" })),
    ...(tech.missing_important_skills ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "important" })),
    ...(tech.missing_nice_to_have ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "nice to have" })),
  ];

  const missingSoft: string[] = soft.missing_skills ?? [];
  const matchedCap: string[] = (cap.matched_capabilities ?? []).map((c: { capability: string }) => c.capability);
  const missingCap: string[] = (cap.missing_capabilities ?? []).map((c: { capability: string }) => c.capability);
  const allCap = [...matchedCap.map(c => ({ label: c, matched: true })), ...missingCap.map(c => ({ label: c, matched: false }))];
  const weakBullets: { original: string; improved: string }[] = star.weak_bullets ?? [];
  const starSuggestion: string = star.suggestion ?? "";
  const starSeniority: string  = star.seniority ?? "";

  return (
    <div className="space-y-4">
      <h3 className="text-[12px] font-bold text-gray-600 uppercase">Score Breakdown</h3>

      {/* HIGH IMPACT */}
      <ImpactGroup label="High Impact" bolts={3}>
        <SectionCard
          label="Hard Skills"
          score={techScore}
          passText="Your resume includes all of the Hard skills."
        >
          {missingTech.length > 0 && (
            <ul className="space-y-1">
              {missingTech.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold">{s.skill}</span>
                    <span className="text-gray-400 ml-1">({s.importance})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </ImpactGroup>

      {/* MEDIUM IMPACT */}
      <ImpactGroup label="Medium Impact" bolts={2}>
        <SectionCard
          label="Soft Skills"
          score={softScore}
          passText="Your resume includes all of the Soft skills."
        >
          {missingSoft.length > 0 && (
            <ul className="space-y-1">
              {missingSoft.map((s, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          label="Capabilities"
          score={capScore}
          passText="Your resume demonstrates all required capabilities."
        >
          {missingCap.length > 0 && (
            <ul className="space-y-1">
              {missingCap.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          label="STAR Pattern"
          score={starScore}
          passText="Your bullets follow the STAR format with measurable results."
        >
          {(starSuggestion || starSeniority || weakBullets.length > 0) && (
            <div className="space-y-3">
              {/* Tip + seniority row */}
              {(starSuggestion || starSeniority) && (
                <div className="flex items-start justify-between gap-3">
                  {starSuggestion && (
                    <p className="text-[11px] text-gray-500 leading-snug flex-1">
                      <span className="font-semibold text-gray-700">Tip:</span> {starSuggestion}
                    </p>
                  )}
                  {starSeniority && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      {starSeniority}
                    </span>
                  )}
                </div>
              )}
              {/* Weak bullets */}
              {weakBullets.length > 0 && (
                <ul className="space-y-3">
                  {weakBullets.map((b, i) => (
                    <li key={i} className="space-y-1">
                      <p className="text-[11px] text-red-500 line-through leading-snug">{b.original}</p>
                      <p className="text-[11px] text-green-700 leading-snug">→ {b.improved}</p>
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
        <SectionCard
          label="Job Title Match"
          score={jobScore}
          passText="Your job title aligns well with the role."
        >
          {job.reason && (
            <p className="text-[11px] text-gray-600 leading-snug">
              The job title <span className="font-semibold">{job.matched_title}</span> was not found in your resume.
              {job.jd_title && (
                <> Suggested: <span className="font-semibold text-green-700">{job.jd_title}</span></>
              )}
            </p>
          )}
        </SectionCard>

        <SectionCard
          label="Experience"
          score={expScore}
          passText="Your experience level matches the role requirements."
        >
          {exp.reason && expScore < 100 && (
            <p className="text-[11px] text-gray-600 leading-snug">{exp.reason}</p>
          )}
        </SectionCard>

        <SectionCard
          label="Education"
          score={eduScore}
          passText="Your education meets the role requirements."
        >
          {edu.reason && eduScore < 100 && (
            <p className="text-[11px] text-gray-600 leading-snug">{edu.reason}</p>
          )}
        </SectionCard>

        <SectionCard
          label="Certifications"
          score={certScore}
          passText="Your certifications meet the role requirements."
        >
          {cert.reason && certScore < 100 && (
            <p className="text-[11px] text-gray-600 leading-snug">{cert.reason}</p>
          )}
        </SectionCard>

        <SectionCard
          label="ATS Formatting"
          score={fmtScore}
          passText="Your resume formatting is ATS-friendly."
        >
          {fmt.reason && fmtScore < 100 && (
            <ul className="space-y-1">
              {fmt.reason.split(".,").filter(Boolean).map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                  <span className="text-amber-500 shrink-0">•</span>
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
