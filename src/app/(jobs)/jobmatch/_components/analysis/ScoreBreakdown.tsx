"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, CircleAlert, Info, RotateCw } from "lucide-react";

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
  missingCount?: number;
  /** This check crashed server-side — the score is not a real measurement, so render as an error state instead of "0% failed". */
  errorMessage?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

function SectionCard({ label, score, passText, children, missingCount, errorMessage, onRetry, isRetrying }: SectionCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (errorMessage) {
    return (
      <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
              <span className="text-[15px] font-bold text-amber-700">{label}</span>
            </div>
            <span className="text-[12px] font-extrabold px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 border border-amber-200">
              Couldn&apos;t check
            </span>
          </div>
          <p className="text-[13px] text-amber-700 leading-relaxed mb-3">{errorMessage}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying…" : "Retry"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const passed = score >= 100;
  const hasDetails = !!children && !passed;

  const barColor  = passed ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const titleColor = passed ? "#16a34a" : missingCount === undefined ? "#dc2626" : "#0f172a";
  const iconColor  = passed ? "#22c55e" : "#ef4444";
  const cardBg    = passed ? "linear-gradient(145deg,#f0fdf4,#fff)" : "linear-gradient(145deg,#fff,#fff)";

  return (
    <div className="overflow-hidden rounded-xl border border-[#dce8fb] shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(37,87,167,0.10)]" style={{ background: cardBg }}>
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
              {missingCount !== undefined ? (
                <div className="flex items-center gap-2.5 text-[12px]">
                  <span className="font-extrabold" style={{ color: barColor }}>
                    {Math.round(score)}% <span className="font-semibold text-slate-600">matched</span>
                  </span>
                  <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                  <span className="font-semibold text-slate-600">
                    <span className="font-extrabold text-slate-900">{missingCount}</span> missing
                  </span>
                </div>
              ) : (
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
              )}
              {hasDetails && (
                <button
                  type="button"
                  onClick={() => setExpanded(v => !v)}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7] focus-visible:ring-offset-2"
                >
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
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
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
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
    ? { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", Icon: AlertTriangle }
    : bolts === 2
    ? { bg: "#fffbeb", border: "#fde68a", text: "#a16207", Icon: CircleAlert }
    : { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", Icon: Info };

  return (
    <div className="space-y-3">
      <div
        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: style.bg, border: `1px solid ${style.border}` }}
      >
        <style.Icon className="h-4 w-4 shrink-0" style={{ color: style.text }} aria-hidden="true" />
        <span className="text-[12px] font-bold" style={{ color: style.text }}>
          {label}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InlineMissingList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold text-red-600">
        Missing <span className="font-semibold text-red-500">· {items.length}</span>
      </p>
      <p className="flex flex-wrap items-center gap-y-1.5 text-[13px] leading-6 text-slate-900">
        {items.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            <span className="font-semibold">{item}</span>
            {index < items.length - 1 && (
              <span className="mx-2 text-red-400" aria-hidden="true">•</span>
            )}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

export default function ScoreBreakdown({ matchResult, onRetryMatch, isRetryingMatch }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchResult: any;
  onRetryMatch?: () => void;
  isRetryingMatch?: boolean;
}) {
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
  const requiredTech = missingTech.filter((item) => item.importance !== "nice to have");
  const optionalTech = missingTech.filter((item) => item.importance === "nice to have");
  const missingSoft: string[] = soft.missing_skills ?? [];
  // A crashed check (execution_failed) returns match_score: null, which parseScore
  // silently reads as 0% — indistinguishable from "genuinely zero soft skills
  // matched" unless we check execution_failed explicitly and say so.
  const softError: string | undefined = soft.execution_failed
    ? "We couldn't score this section this time. Try running the match again."
    : undefined;
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
      <ImpactGroup label="High priority" bolts={3}>
        <SectionCard
          label="Hard Skills"
          score={techScore}
          passText="Your resume includes all of the Hard skills."
          missingCount={missingTech.length}
        >
          {missingTech.length > 0 && (
            <div className="space-y-4">
              {requiredTech.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[12px] font-bold text-red-600">
                    Required <span className="font-semibold text-red-500">· {requiredTech.length}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-y-1.5 text-[13px] leading-6 text-slate-900">
                    {requiredTech.map((item, index) => (
                      <React.Fragment key={`${item.skill}-${index}`}>
                        <span className="font-semibold">{item.skill}</span>
                        {index < requiredTech.length - 1 && (
                          <span className="mx-2 text-red-400" aria-hidden="true">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              )}

              {optionalTech.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[12px] font-bold text-slate-500">
                    Nice to have <span className="font-semibold text-slate-400">· {optionalTech.length}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-y-1.5 text-[13px] leading-6 text-slate-600">
                    {optionalTech.map((item, index) => (
                      <React.Fragment key={`${item.skill}-${index}`}>
                        <span className="font-medium">{item.skill}</span>
                        {index < optionalTech.length - 1 && (
                          <span className="mx-2 text-slate-400" aria-hidden="true">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </ImpactGroup>

      {/* MEDIUM IMPACT */}
      <ImpactGroup label="Medium priority" bolts={2}>
        <SectionCard
          label="Soft Skills"
          score={softScore}
          passText="Your resume includes all of the Soft skills."
          missingCount={softError ? undefined : missingSoft.length}
          errorMessage={softError}
          onRetry={softError ? onRetryMatch : undefined}
          isRetrying={isRetryingMatch}
        >
          {missingSoft.length > 0 && <InlineMissingList items={missingSoft} />}
        </SectionCard>

        <SectionCard
          label="Capabilities"
          score={capScore}
          passText="Your resume demonstrates all required capabilities."
          missingCount={missingCap.length}
        >
          {missingCap.length > 0 && <InlineMissingList items={missingCap} />}
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
      <ImpactGroup label="Low priority" bolts={1}>
        <SectionCard label="Job Title Match" score={jobScore} passText="Your job title aligns well with the role.">
          {job.reason && (
            <div className="space-y-1.5">
              <p className="text-[13px] text-gray-600 leading-relaxed">{job.reason}</p>
              {(job.matched_title || job.jd_title) && (
                <p className="text-[12px] text-gray-500">
                  Your title <span className="font-bold text-gray-800">{job.matched_title || "—"}</span>
                  {job.jd_title && <> vs. the JD&apos;s <span className="font-bold text-green-700">{job.jd_title}</span></>}
                </p>
              )}
            </div>
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
