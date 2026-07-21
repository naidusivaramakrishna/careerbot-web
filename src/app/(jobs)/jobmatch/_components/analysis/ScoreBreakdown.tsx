"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

const IMPORTANCE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  required: { bg: "#fff0f0", border: "#fecaca", color: "#dc2626" },
  important: { bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
  "nice to have": { bg: "#f8fafc", border: "#e2e8f0", color: "#64748b" },
};

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

  const barGradient = passed
    ? "linear-gradient(90deg,#4ade80,#22c55e)"
    : score >= 60
    ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
    : "linear-gradient(90deg,#f87171,#ef4444)";
  const barColor  = passed ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const titleColor = passed ? "#16a34a" : "#dc2626";
  const iconColor  = passed ? "#22c55e" : "#ef4444";
  const cardBg    = passed ? "linear-gradient(145deg,#f0fdf4,#fff)" : "linear-gradient(145deg,#fff,#fff)";

  return (
    <div className="rounded-lg border border-[#dce8fb] shadow-[0_10px_26px_rgba(37,87,167,0.07)] overflow-hidden" style={{ background: cardBg }}>
      <div className="flex">
        <div className="flex-1 px-5 py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {passed
                ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
                : <XCircle className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
              }
              <span className="text-[15px] font-bold" style={{ color: titleColor }}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] font-extrabold px-2 py-0.5 rounded-full"
                style={{
                  color: barColor,
                  background: passed ? "#dcfce7" : score >= 60 ? "#fef3c7" : "#fee2e2",
                  border: `1px solid ${passed ? "#bbf7d0" : score >= 60 ? "#fde68a" : "#fecaca"}`,
                }}
              >
                {score.toFixed(score % 1 === 0 ? 0 : 1)}%
              </span>
              {hasDetails && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                >
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${score}%`,
                background: barGradient,
                boxShadow: `0 0 6px ${barColor}55`,
              }}
            />
          </div>

          {/* Pass message */}
          {passed && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <p className="text-[12.5px] text-green-700">
                <span className="font-semibold">Way to go!</span> {passText}
              </p>
            </div>
          )}
        </div>
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
  const style = bolts >= 3
    ? { bg: "#fff3f0", border: "#fecaca", text: "#c2410c", dot: "#ef4444" }
    : bolts === 2
    ? { bg: "#fffbeb", border: "#fde68a", text: "#b45309", dot: "#f59e0b" }
    : { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" };

  return (
    <div className="space-y-3">
      <div
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 shadow-sm"
        style={{ background: style.bg, border: `1px solid ${style.border}` }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: style.dot, boxShadow: `0 0 5px ${style.dot}88` }}
        />
        <span className="text-[12px] font-bold tracking-wide" style={{ color: style.text }}>
          {Array.from({ length: bolts }).map(() => "⚡").join("")} {label}
        </span>
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
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#5896d7,#2557a7)" }} />
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Score Breakdown</h3>
      </div>

      {/* HIGH IMPACT */}
      <ImpactGroup label="High Impact" bolts={3}>
        <SectionCard label="Hard Skills" score={techScore} passText="Your resume includes all of the Hard skills.">
          {missingTech.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missingTech.map((s, i) => {
                const style = IMPORTANCE_STYLES[s.importance] ?? IMPORTANCE_STYLES.required;
                return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                  style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}
                >
                  <XCircle className="w-3 h-3 shrink-0" />
                  {s.skill}
                  <span className="text-[10px] font-medium opacity-60">· {s.importance}</span>
                </span>
                );
              })}
            </div>
          )}
        </SectionCard>
      </ImpactGroup>

      {/* MEDIUM IMPACT */}
      <ImpactGroup label="Medium Impact" bolts={2}>
        <SectionCard label="Soft Skills" score={softScore} passText="Your resume includes all of the Soft skills.">
          {missingSoft.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missingSoft.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                  style={{ background: "#fff0f0", border: "1px solid #fecaca", color: "#dc2626" }}
                >
                  <XCircle className="w-3 h-3 shrink-0" />{s}
                </span>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard label="Capabilities" score={capScore} passText="Your resume demonstrates all required capabilities.">
          {missingCap.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missingCap.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                  style={{ background: "#fff0f0", border: "1px solid #fecaca", color: "#dc2626" }}
                >
                  <XCircle className="w-3 h-3 shrink-0" />{c}
                </span>
              ))}
            </div>
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
                    <li key={i} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 border-b border-red-100">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5 shrink-0">Before</span>
                        <p className="text-[12px] text-red-500 line-through leading-snug">{b.original}</p>
                      </div>
                      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-green-50">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-0.5 shrink-0">After</span>
                        <p className="text-[12px] text-green-700 leading-snug font-medium">{b.improved}</p>
                      </div>
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
