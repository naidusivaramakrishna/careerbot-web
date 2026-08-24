"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Info,
  MessageCircle,
  Sparkles,
  Flame,
  Star,
  Briefcase,
  UsersRound,
  Target,
  ListChecks,
  Tag,
  History,
  FileText,
  GraduationCap,
  Award,
  FileCheck2,
  TrendingUp,
  ClipboardCheck,
  ThumbsUp,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScore(raw: any): number {
  if (typeof raw === "number") return Math.min(100, Math.max(0, raw));
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace("%", ""));
    return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
  }
  return 0;
}

function prettify(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type PriorityLevel = "high" | "medium" | "low";

// Card-level priority accent — icon circle, badge colors. Text labels stay
// exactly what each call site passes; this only drives color/icon.
const PRIORITY_STYLES: Record<PriorityLevel, { Icon: LucideIcon; text: string; bg: string; border: string }> = {
  high:   { Icon: Flame, text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  medium: { Icon: Star,  text: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  low:    { Icon: Info,  text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
};

type ChipTone = "red" | "blue" | "green";

const CHIP_TONE_STYLES: Record<ChipTone, { text: string; chipBg: string; chipBorder: string; dot: string }> = {
  red:   { text: "text-[#c2413a]", chipBg: "bg-[#fff5f4]", chipBorder: "border-[#f5d5d2]", dot: "bg-[#df5b54]" },
  blue:  { text: "text-[#3A4F7A]", chipBg: "bg-[#f3f6fb]", chipBorder: "border-[#dce5f1]", dot: "bg-[#5d759f]" },
  green: { text: "text-[#16803c]", chipBg: "bg-[#f0fdf4]", chipBorder: "border-[#bbf7d0]", dot: "bg-[#22c55e]" },
};

// Modern rounded chips for a labeled skill group (Required / Nice to have / Missing).
function SkillChipGroup({
  heading, count, icon: Icon, items, tone,
}: {
  heading: string;
  count: number;
  icon: LucideIcon;
  items: string[];
  tone: ChipTone;
}) {
  if (items.length === 0) return null;
  const s = CHIP_TONE_STYLES[tone];

  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-[12px] font-bold ${s.text}`}>
        <Icon className="h-3.5 w-3.5" />
        {heading} <span className="font-semibold text-slate-400">· {count}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`inline-flex items-center gap-1.5 rounded-full border ${s.chipBorder} ${s.chipBg} px-3 py-1.5 text-[12.5px] font-medium text-[#2f2f2f]`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SectionCardProps {
  label: string;
  subtitle: string;
  icon: LucideIcon;
  priorityLabel: string;
  priorityLevel: PriorityLevel;
  score: number;
  passText: string;
  children?: React.ReactNode;
  missingCount?: number;
  /** This check crashed server-side — the score is not a real measurement, so render as a recoverable state instead of "0% failed". */
  errorMessage?: string;
}

function SectionCard({
  label, subtitle, icon: Icon, priorityLabel, priorityLevel, score, passText, children, missingCount, errorMessage,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const prio = PRIORITY_STYLES[priorityLevel];

  // Recoverable AI-processing issue (e.g. Soft Skills scoring crashed) — warm,
  // calm amber treatment, not a red "error" state.
  if (errorMessage) {
    return (
      <div className="overflow-hidden rounded-[14px] border border-amber-200 bg-[#fffdf7] shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:h-11 sm:w-11">
              <Icon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[15px] font-bold leading-tight text-slate-900">{label}</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
              style={{ color: prio.text, background: prio.bg, borderColor: prio.border }}
            >
              <prio.Icon className="h-3 w-3" />
              {priorityLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              Couldn&apos;t check
              <Info className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className="mx-4 mb-4 flex items-start gap-2.5 rounded-xl border border-dashed border-amber-300 bg-white/70 px-4 py-3.5 sm:mx-5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <MessageCircle className="h-3.5 w-3.5 text-amber-600" />
          </span>
          <p className="text-[13px] leading-relaxed text-slate-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const passed = score >= 100;
  const hasDetails = !!children && !passed;

  const barColor  = passed ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const iconBg    = passed ? "#dcfce7" : prio.bg;
  const iconColor = passed ? "#16a34a" : prio.text;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#dfe5ee] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-[0_5px_18px_rgba(58,79,122,0.07)]">
      <div className="px-4 py-4 sm:px-5">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11" style={{ background: iconBg }}>
              <Icon className="h-5 w-5" style={{ color: iconColor }} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[15px] font-bold leading-tight text-slate-900">{label}</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 sm:gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
              style={{ color: prio.text, background: prio.bg, borderColor: prio.border }}
            >
              <prio.Icon className="h-3 w-3" />
              {priorityLabel}
            </span>

            {missingCount !== undefined ? (
              <div className="flex items-center gap-2.5 text-[12px] whitespace-nowrap">
                <span className="font-extrabold" style={{ color: barColor }}>
                  {Math.round(score)}% <span className="font-semibold text-slate-500">matched</span>
                </span>
                <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
                <span className="font-semibold text-slate-500">
                  <span className="font-extrabold text-slate-900">{missingCount}</span> missing
                </span>
              </div>
            ) : (
              <span
                className="text-[12.5px] font-extrabold px-2.5 py-1 rounded-full"
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

      {/* Details */}
      {hasDetails && expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ScoreBreakdown({ matchResult, currentSummary = "" }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchResult: any;
  currentSummary?: string;
}) {
  if (!matchResult) return null;

  const tech = matchResult.Technical_Skills ?? {};
  const soft = matchResult.Soft_Skills ?? {};
  const cap  = matchResult.Capabilities_Check ?? {};
  const star = matchResult.STAR_Pattern_Check ?? {};
  const summary = matchResult.Summary_Check ?? {};
  const exp  = matchResult.Experience_Check ?? {};
  const edu  = matchResult.Education_Check ?? {};
  const job  = matchResult.Job_Title_Check ?? {};
  const cert = matchResult.Certifications_Check ?? {};
  const fmt  = matchResult.Formatting_Check ?? {};
  const careerProg    = matchResult.Career_Progression_Check ?? {};
  const growthQuality = careerProg.growth_quality ?? {};
  const levelAlignment = careerProg.level_alignment ?? {};

  const techScore = parseScore(tech.match_score);
  const softScore = parseScore(soft.match_score);
  const capScore  = parseScore(cap.match_score);
  const starScore = parseScore(star.match_score);
  const summaryScore = parseScore(summary.match_score);
  const expScore  = parseScore(exp.match_score);
  const eduScore  = parseScore(edu.match_score);
  const jobScore  = parseScore(job.match_score);
  const certScore = parseScore(cert.match_score);
  const fmtScore  = parseScore(fmt.match_score);
  const careerProgScore = parseScore(careerProg.match_score);

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
    ? "We couldn't score this section this time. It won't affect your other results."
    : undefined;
  const missingCap: string[] = (cap.missing_capabilities ?? []).map((c: { capability: string }) => c.capability);
  const weakBullets: { original: string; improved: string }[] = star.weak_bullets ?? [];
  const starSuggestion: string = star.suggestion ?? "";
  const starSeniority: string  = star.seniority ?? "";

  return (
    <section className="space-y-4" aria-labelledby="jobmatch-suggestions-heading">
      {/* Section header */}
      <div className="flex items-start gap-3 px-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf0f8]">
          <Sparkles className="h-5 w-5 text-[#3A4F7A]" />
        </div>
        <div className="pt-0.5">
          <h3 id="jobmatch-suggestions-heading" className="text-[19px] font-extrabold text-[#1f2937] leading-tight">Suggestion</h3>
          <p className="mt-0.5 text-[13px] text-slate-500">Improve your match score by addressing these suggestions.</p>
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard
          label="Hard Skills"
          subtitle="Skills & technical abilities"
          icon={Briefcase}
          priorityLabel="High priority"
          priorityLevel="high"
          score={techScore}
          passText="Your resume includes all of the Hard skills."
          missingCount={missingTech.length}
        >
          {missingTech.length > 0 && (
            <div className="space-y-4">
              <SkillChipGroup
                heading="Required"
                count={requiredTech.length}
                icon={ClipboardCheck}
                tone="red"
                items={requiredTech.map((item) => item.skill)}
              />
              {requiredTech.length > 0 && optionalTech.length > 0 && (
                <div className="border-t border-dashed border-slate-200" aria-hidden="true" />
              )}
              <SkillChipGroup
                heading="Nice to have"
                count={optionalTech.length}
                icon={ThumbsUp}
                tone="green"
                items={optionalTech.map((item) => item.skill)}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          label="Soft Skills"
          subtitle="Behavioral & interpersonal skills"
          icon={UsersRound}
          priorityLabel="Medium priority"
          priorityLevel="medium"
          score={softScore}
          passText="Your resume includes all of the Soft skills."
          missingCount={softError ? undefined : missingSoft.length}
          errorMessage={softError}
        >
          {missingSoft.length > 0 && (
            <SkillChipGroup heading="Missing" count={missingSoft.length} icon={CircleAlert} tone="red" items={missingSoft} />
          )}
        </SectionCard>

        <SectionCard
          label="Capabilities"
          subtitle="Skills you can apply in the role"
          icon={Target}
          priorityLabel="Medium priority"
          priorityLevel="medium"
          score={capScore}
          passText="Your resume demonstrates all required capabilities."
          missingCount={missingCap.length}
        >
          {missingCap.length > 0 && (
            <SkillChipGroup heading="Missing" count={missingCap.length} icon={CircleAlert} tone="red" items={missingCap} />
          )}
        </SectionCard>

        <SectionCard
          label="STAR Pattern"
          subtitle="Structured, results-driven bullet points"
          icon={ListChecks}
          priorityLabel="Medium priority"
          priorityLevel="medium"
          score={starScore}
          passText="Your bullets follow the STAR format with measurable results."
        >
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

        <SectionCard
          label="Summary"
          subtitle="Professional summary alignment with the role"
          icon={FileText}
          priorityLabel="Medium priority"
          priorityLevel="medium"
          score={summaryScore}
          passText="Your professional summary aligns well with the role."
        >
          {/* Gated on reason OR suggested_summary, not reason alone. The API can
              return Summary_Check with a suggested_summary and no reason -- its
              own fixture does exactly that (careerbot-api
              tests/unit/api/test_job_matcher_fix_apply.py:56-59) -- and gating
              the whole block on reason rendered an empty card for that shape. */}
          {(summary.reason || summary.suggested_summary) && (
            <div className="space-y-3">
              {summary.reason && (
                <p className="text-[13px] text-gray-600 leading-relaxed">{summary.reason}</p>
              )}
              {summary.suggested_summary && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                  {currentSummary && (
                    <div className="rounded-xl border border-[#f3d3d0] bg-[#fff6f5] px-4 py-3">
                      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#c2413a]">Before · Current</p>
                      <p className="text-[12px] leading-relaxed text-[#6d3a37]">{currentSummary}</p>
                    </div>
                  )}
                  {currentSummary && <div className="hidden items-center text-[#90a0b8] md:flex">→</div>}
                  <div className="rounded-xl border border-[#ccebd8] bg-[#f1fbf5] px-4 py-3">
                    <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#16803c]">After · Suggested</p>
                    <p className="text-[12px] font-medium leading-relaxed text-[#245a38]">{summary.suggested_summary}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          label="Job Title Match"
          subtitle="Alignment with the target role's title"
          icon={Tag}
          priorityLabel="Low priority"
          priorityLevel="low"
          score={jobScore}
          passText="Your job title aligns well with the role."
        >
          {/* Same sibling issue as Summary above: the API fixture supplies
              Job_Title_Check with jd_title/matched_title and no reason
              (test_job_matcher_fix_apply.py:55), so gating on reason alone hid
              the titles entirely. */}
          {(job.reason || job.matched_title || job.jd_title) && (
            <div className="space-y-1.5">
              {job.reason && (
                <p className="text-[13px] text-gray-600 leading-relaxed">{job.reason}</p>
              )}
              {(job.matched_title || job.jd_title) && (
                <p className="text-[12px] text-gray-500">
                  Your title <span className="font-bold text-gray-800">{job.matched_title || "—"}</span>
                  {job.jd_title && <> vs. the JD&apos;s <span className="font-bold text-green-700">{job.jd_title}</span></>}
                </p>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          label="Experience"
          subtitle="Years and depth of relevant experience"
          icon={History}
          priorityLabel="Low priority"
          priorityLevel="low"
          score={expScore}
          passText="Your experience level matches the role requirements."
        >
          {exp.reason && expScore < 100 && <p className="text-[13px] text-gray-600 leading-relaxed">{exp.reason}</p>}
        </SectionCard>

        <SectionCard
          label="Education"
          subtitle="Degree and academic requirements"
          icon={GraduationCap}
          priorityLabel="Low priority"
          priorityLevel="low"
          score={eduScore}
          passText="Your education meets the role requirements."
        >
          {edu.reason && eduScore < 100 && <p className="text-[13px] text-gray-600 leading-relaxed">{edu.reason}</p>}
        </SectionCard>

        <SectionCard
          label="Certifications"
          subtitle="Relevant professional certifications"
          icon={Award}
          priorityLabel="Low priority"
          priorityLevel="low"
          score={certScore}
          passText="Your certifications meet the role requirements."
        >
          {cert.reason && certScore < 100 && <p className="text-[13px] text-gray-600 leading-relaxed">{cert.reason}</p>}
        </SectionCard>

        <SectionCard
          label="ATS Formatting"
          subtitle="Resume structure & parseability"
          icon={FileCheck2}
          priorityLabel="Low priority"
          priorityLevel="low"
          score={fmtScore}
          passText="Your resume formatting is ATS-friendly."
        >
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

        {careerProg.applicable !== false && careerProg.match_score !== undefined && (
          <SectionCard
            label="Career Progression"
            subtitle="Growth trajectory and job stability"
            icon={TrendingUp}
            priorityLabel="Low priority"
            priorityLevel="low"
            score={careerProgScore}
            passText="Your career shows strong, stable progression."
          >
            {careerProg.reason && careerProgScore < 100 && (
              <div className="space-y-1.5">
                <p className="text-[13px] text-gray-600 leading-relaxed">{careerProg.reason}</p>
                {(growthQuality.progression_type || growthQuality.job_stability) && (
                  <div className="flex flex-wrap gap-1.5">
                    {growthQuality.progression_type && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        {prettify(growthQuality.progression_type)}
                      </span>
                    )}
                    {growthQuality.job_stability && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {prettify(growthQuality.job_stability)} job stability
                      </span>
                    )}
                  </div>
                )}
                {(levelAlignment.candidate_current_level && levelAlignment.jd_expected_level) && (
                  <p className="text-[12px] text-gray-500">
                    Your level <span className="font-bold text-gray-800">{prettify(levelAlignment.candidate_current_level)}</span>
                    {" "}vs. the JD&apos;s <span className="font-bold text-green-700">{prettify(levelAlignment.jd_expected_level)}</span>
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </section>
  );
}
