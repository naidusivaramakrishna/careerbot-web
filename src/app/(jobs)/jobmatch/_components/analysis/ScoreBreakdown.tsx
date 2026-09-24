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
  Flame,
  Star,
  Code2,
  Briefcase,
  UsersRound,
  Target,
  ListChecks,
  Tag,
  FileText,
  GraduationCap,
  Award,
  FileCheck2,
  TrendingUp,
  ClipboardCheck,
  ThumbsUp,
  Crown,
  Zap,
  Plus,
  Loader2,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScore(raw: any): number {
  if (typeof raw === "number") return Math.min(100, Math.max(0, raw));
  if (typeof raw === "string") {
    const n = Number.parseFloat(raw.replace("%", ""));
    return Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
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
  high:   { Icon: Flame, text: "#B42318", bg: "#FEF3F2", border: "#fecaca" },
  medium: { Icon: Star,  text: "#92400E", bg: "#FFFBEB", border: "#fde68a" },
  low:    { Icon: Info,  text: "#2257A7", bg: "#EEF3FB", border: "#bfdbfe" },
};

type ChipTone = "red" | "blue" | "green";

const CHIP_TONE_STYLES: Record<ChipTone, { text: string; chipBg: string; chipBorder: string; dot: string }> = {
  red:   { text: "text-[#c2413a]", chipBg: "bg-[#fff5f4]", chipBorder: "border-[#f5d5d2]", dot: "bg-[#df5b54]" },
  blue:  { text: "text-[#3A4F7A]", chipBg: "bg-[#f3f6fb]", chipBorder: "border-[#dce5f1]", dot: "bg-[#5d759f]" },
  green: { text: "text-[#16803c]", chipBg: "bg-[#f0fdf4]", chipBorder: "border-[#bbf7d0]", dot: "bg-[#167044]" },
};

/** Points + suggestion id an individual missing-skill chip can be added from, looked up by skill name. */
interface ChipAddInfo {
  suggestionId: string;
  points: number;
}

// Modern rounded chips for a labeled skill group (Required / Nice to have / Missing).
// When `resolveAdd` is given (Hard/Soft Skills only — see ScoreBreakdown below;
// Capabilities has no one-click add route), each chip becomes a small button
// showing its own point value on the right with an inline "Add"/"Added" state,
// instead of a plain read-only pill.
function SkillChipGroup({
  heading, count, icon: Icon, items, tone, resolveAdd, addedIds, onAdd,
}: {
  readonly heading: string;
  readonly count: number;
  readonly icon: LucideIcon;
  readonly items: string[];
  readonly tone: ChipTone;
  readonly resolveAdd?: (item: string) => ChipAddInfo | undefined;
  readonly addedIds?: Set<string>;
  readonly onAdd?: (item: string, suggestionId: string) => Promise<boolean> | boolean;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  if (items.length === 0) return null;
  const s = CHIP_TONE_STYLES[tone];

  const handleAdd = async (item: string, info: ChipAddInfo) => {
    if (!onAdd || loadingId) return;
    setLoadingId(info.suggestionId);
    try {
      await onAdd(item, info.suggestionId);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-[12px] font-bold ${s.text}`}>
        <Icon className="h-3.5 w-3.5" />
        {heading} <span className="font-semibold text-slate-400">· {count}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const addInfo = resolveAdd?.(item);
          const isAdded = !!addInfo && !!addedIds?.has(addInfo.suggestionId);
          const isLoading = !!addInfo && loadingId === addInfo.suggestionId;

          if (!addInfo) {
            return (
              <span
                key={`${item}-${index}`}
                className={`inline-flex items-center gap-1.5 rounded-full border ${s.chipBorder} ${s.chipBg} px-3 py-1.5 text-[12.5px] font-medium text-[#2f2f2f]`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {item}
              </span>
            );
          }

          return (
            <button
              key={`${item}-${index}`}
              type="button"
              onClick={() => handleAdd(item, addInfo)}
              disabled={isAdded || isLoading}
              className={`inline-flex items-center gap-2 rounded-full border pl-3 pr-1.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                isAdded
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#16803c]"
                  : `${s.chipBorder} ${s.chipBg} text-[#2f2f2f] hover:brightness-95`
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAdded ? "bg-[#167044]" : s.dot}`} />
              {item}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  isAdded ? "bg-[#167044] text-white" : "bg-white/70 text-[#526174]"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : isAdded ? (
                  <CheckCircle2 className="h-2.5 w-2.5" />
                ) : (
                  <Plus className="h-2.5 w-2.5" />
                )}
                {isAdded ? "Added" : `+${addInfo.points.toFixed(1)} pts`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SectionCardProps {
  readonly label: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly priorityLabel: string;
  readonly priorityLevel: PriorityLevel;
  readonly score: number;
  readonly passText: string;
  readonly children?: React.ReactNode;
  readonly missingCount?: number;
  /** This check crashed server-side — the score is not a real measurement, so render as a recoverable state instead of "0% failed". */
  readonly errorMessage?: string;
}

// The errorMessage early-return branch of SectionCard, below, used to be a
// large inline JSX block that counted toward SectionCard's own cognitive
// complexity. Extracted verbatim (same markup, same props) as its own
// component so SectionCard's complexity reflects only its normal-path logic.
// Renders as one compact row (icon + title + meta + status tag) inside the
// shared divide-y list, matching the other rows' height — not its own boxed
// card — with the explanation always shown below since there's no score to
// expand/collapse.
function ErrorSectionCard({
  label, subtitle, icon: Icon, errorMessage,
}: {
  readonly label: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly errorMessage: string;
}) {
  return (
    <div className="bg-[#fffdf7] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Icon className="h-4 w-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold leading-tight text-slate-900">{label}</p>
          <p className="mt-0.5 truncate text-[12px] text-[#526174]">{subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[12px] font-bold text-amber-800">
          <Info className="h-3 w-3" />
          Couldn&apos;t check
        </span>
      </div>

      <div className="mt-3 ml-12 flex items-start gap-2.5 rounded-lg border border-dashed border-amber-300 bg-white/70 px-4 py-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <MessageCircle className="h-3 w-3 text-amber-600" />
        </span>
        <p className="text-[12.5px] leading-relaxed text-slate-700">{errorMessage}</p>
      </div>
    </div>
  );
}

// scoreColor: SectionCard used to compute this with a nested ternary inline
// (passed ? A : score >= 60 ? B : C). Same three-way logic, same literal
// values, just named and taken out of the render body so the ternary
// nesting doesn't count against SectionCard's own complexity.
function scoreColor(score: number, passed: boolean): string {
  if (passed) return "#167044";
  if (score >= 60) return "#92400E";
  return "#B42318";
}

// One compact row (icon + title + meta on the left, score % + chevron on the
// right) — collapsed by default so the list reads as a single dense scan,
// matching the reference layout's row height. Expanding a row reveals the
// same detail content as before, indented under it.
function SectionCard({
  label, subtitle, icon: Icon, priorityLevel, score, passText, children, missingCount, errorMessage,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const prio = PRIORITY_STYLES[priorityLevel];

  // Recoverable AI-processing issue (e.g. Soft Skills scoring crashed) — warm,
  // calm amber treatment, not a red "error" state.
  if (errorMessage) {
    return <ErrorSectionCard label={label} subtitle={subtitle} icon={Icon} errorMessage={errorMessage} />;
  }

  const passed = score >= 100;
  const hasDetails = !!children && !passed;

  const color     = scoreColor(score, passed);

  let meta: React.ReactNode;
  if (passed) {
    meta = (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> {passText}
      </span>
    );
  } else if (missingCount !== undefined) {
    meta = <span className="text-[12px] text-[#526174]">{missingCount} missing</span>;
  } else {
    meta = <p className="text-[12px] leading-4 text-[#526174]">{subtitle}</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#DCE3EB] bg-white">
      <div
        role={hasDetails ? "button" : undefined}
        aria-expanded={hasDetails ? expanded : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        onClick={hasDetails ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={hasDetails ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } } : undefined}
        className={`flex items-center gap-2.5 bg-white px-3 ${passed ? "min-h-12 py-2" : "min-h-16 py-2.5"} ${hasDetails ? "cursor-pointer hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" : ""}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EEF3FB] text-[#2257A7]">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[14px] font-semibold leading-tight text-slate-800">{label}</p>
            {!passed && <span className="rounded px-2 py-1 text-[12px] font-semibold" style={{ background: prio.bg, color: prio.text }}>{priorityLevel === "high" ? "High Impact" : priorityLevel === "medium" ? "Medium Impact" : "Low Impact"}</span>}
          </div>
          <div className="mt-0.5">{meta}</div>
        </div>
        <div className="flex w-[76px] shrink-0 items-center justify-between gap-2">
          <span className="min-w-10 text-right text-[16px] font-bold tabular-nums" style={{ color }}>{Math.round(score)}%</span>
          {hasDetails && (
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      {hasDetails && expanded && (
        <div className="border-t border-[#DCE3EB] bg-white p-3 sm:p-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ScoreBreakdown({
  matchResult, currentSummary = "", onAddSkill, appliedSuggestionIds,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly matchResult: any;
  readonly currentSummary?: string;
  /** When given, missing Hard/Soft Skill chips below become one-click "+pts / Add" buttons instead of plain pills. */
  readonly onAddSkill?: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  readonly appliedSuggestionIds?: string[];
}) {
  if (!matchResult) return null;

  const appliedIdSet = new Set(appliedSuggestionIds ?? []);
  // Same source MatchPenalties itself reads — each entry carries the point
  // value and suggestion_id a chip's one-click "Add" needs. Capabilities gets
  // no such lookup: its missing items resolve to a resume-section edit, not a
  // one-click add, same as MatchPenalties treats them (see AnalysisContent's
  // findSkillSuggestionId, which this mirrors for exactly technical/soft skills).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const penalties: any[] = matchResult.Match_Penalties?.penalties ?? [];
  const resolveSkillAdd = (category: "technical_skills" | "soft_skills") => (skillName: string): ChipAddInfo | undefined => {
    const target = skillName.trim().toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = penalties.find((item: any) => item.category === category && item.target?.trim().toLowerCase() === target);
    return p ? { suggestionId: p.suggestion_id, points: Math.abs(p.penalty ?? 0) } : undefined;
  };
  const resolveHardSkillAdd = resolveSkillAdd("technical_skills");
  const resolveSoftSkillAdd = resolveSkillAdd("soft_skills");

  // AI layer renamed these two keys (Technical_Skills -> Technical_Skills_Check,
  // Soft_Skills -> Soft_Skills_Check) but match_result documents stored before
  // the rename keep the old name forever (see careerbot-api
  // app/shared/contracts/matcher_keys.py) — the score is mirrored under both
  // names, these two blocks are not, so both must be checked here.
  const tech = matchResult.Technical_Skills_Check ?? matchResult.Technical_Skills ?? {};
  const soft = matchResult.Soft_Skills_Check ?? matchResult.Soft_Skills ?? {};
  const cap  = matchResult.Capabilities_Check ?? {};
  const star = matchResult.STAR_Pattern_Check ?? {};
  const summary = matchResult.Summary_Check ?? {};
  const req  = matchResult.Requirements_Check ?? {};
  const exp  = matchResult.Experience_Check ?? {};
  const edu  = matchResult.Education_Check ?? {};
  const job  = matchResult.Job_Title_Check ?? {};
  const cert = matchResult.Certifications_Check ?? {};
  const fmt  = matchResult.Formatting_Check ?? {};
  const careerProg    = matchResult.Career_Progression_Check ?? {};
  const growthQuality = careerProg.growth_quality ?? {};
  const levelAlignment = careerProg.level_alignment ?? {};
  const leadership    = matchResult.Leadership_Check ?? {};

  const techScore = parseScore(tech.match_score);
  const softScore = parseScore(soft.match_score);
  const capScore  = parseScore(cap.match_score);
  const starScore = parseScore(star.match_score);
  const summaryScore = parseScore(summary.match_score);
  const reqScore = parseScore(req.match_score);
  const expScore  = parseScore(exp.match_score);
  const eduScore  = parseScore(edu.match_score);
  const jobScore  = parseScore(job.match_score);
  const certScore = parseScore(cert.match_score);
  const fmtScore  = parseScore(fmt.match_score);
  const careerProgScore = parseScore(careerProg.match_score);
  const leadershipScore = parseScore(leadership.match_score);

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
  const missingVerbs: string[] = (req.missing_verbs ?? []).map((v: { verb: string }) => v.verb);

  return (
    <section aria-label="Score breakdown by category">
      <div className="space-y-2">
        <SectionCard
          label="Hard Skills"
          subtitle="Skills & technical abilities"
          icon={Code2}
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
                resolveAdd={onAddSkill ? resolveHardSkillAdd : undefined}
                addedIds={appliedIdSet}
                onAdd={onAddSkill}
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
                resolveAdd={onAddSkill ? resolveHardSkillAdd : undefined}
                addedIds={appliedIdSet}
                onAdd={onAddSkill}
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
            <SkillChipGroup
              heading="Missing"
              count={missingSoft.length}
              icon={CircleAlert}
              tone="red"
              items={missingSoft}
              resolveAdd={onAddSkill ? resolveSoftSkillAdd : undefined}
              addedIds={appliedIdSet}
              onAdd={onAddSkill}
            />
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
                    <p className="text-[14px] text-gray-600 leading-relaxed flex-1">
                      <span className="font-semibold text-gray-800">Tip:</span> {starSuggestion}
                    </p>
                  )}
                  {starSeniority && (
                    <span className="shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      {starSeniority}
                    </span>
                  )}
                </div>
              )}
              {weakBullets.length > 0 && (
                <ul className="space-y-3">
                  {weakBullets.map((b, i) => (
                    <li key={`${b.original}-${i}`} className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 border-b border-red-100">
                        <span className="text-[12px] font-bold text-red-400 uppercase tracking-wider mt-0.5 shrink-0">Before</span>
                        <p className="text-[12px] text-red-500 line-through leading-snug">{b.original}</p>
                      </div>
                      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-green-50">
                        <span className="text-[12px] font-bold text-green-600 uppercase tracking-wider mt-0.5 shrink-0">After</span>
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
          label="Action Verbs"
          subtitle="JD action verbs reflected in your bullet points"
          icon={Zap}
          priorityLabel="Medium priority"
          priorityLevel="medium"
          score={reqScore}
          passText="Your bullets use all the action verbs the JD calls for."
          missingCount={missingVerbs.length}
        >
          {missingVerbs.length > 0 && (
            <SkillChipGroup heading="Missing" count={missingVerbs.length} icon={CircleAlert} tone="red" items={missingVerbs} />
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
                <p className="text-[14px] text-gray-600 leading-relaxed">{summary.reason}</p>
              )}
              {summary.suggested_summary && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                  {currentSummary && (
                    <div className="rounded-lg border border-[#f3d3d0] bg-[#fff6f5] px-4 py-3">
                      <p className="mb-1.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#c2413a]">Before · Current</p>
                      <p className="text-[12px] leading-relaxed text-[#6d3a37]">{currentSummary}</p>
                    </div>
                  )}
                  {currentSummary && <div className="hidden items-center text-[#90a0b8] md:flex">→</div>}
                  <div className="rounded-lg border border-[#ccebd8] bg-[#f1fbf5] px-4 py-3">
                    <p className="mb-1.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#16803c]">After · Suggested</p>
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
                <p className="text-[14px] text-gray-600 leading-relaxed">{job.reason}</p>
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
          icon={Briefcase}
          priorityLabel="Low priority"
          priorityLevel="low"
          score={expScore}
          passText="Your experience level matches the role requirements."
        >
          {exp.reason && expScore < 100 && <p className="text-[14px] text-gray-600 leading-relaxed">{exp.reason}</p>}
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
          {edu.reason && eduScore < 100 && <p className="text-[14px] text-gray-600 leading-relaxed">{edu.reason}</p>}
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
          {cert.reason && certScore < 100 && <p className="text-[14px] text-gray-600 leading-relaxed">{cert.reason}</p>}
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
                <li key={`${r}-${i}`} className="flex items-start gap-2 text-[14px] text-gray-600 leading-relaxed">
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
                <p className="text-[14px] text-gray-600 leading-relaxed">{careerProg.reason}</p>
                {(growthQuality.progression_type || growthQuality.job_stability) && (
                  <div className="flex flex-wrap gap-1.5">
                    {growthQuality.progression_type && (
                      <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        {prettify(growthQuality.progression_type)}
                      </span>
                    )}
                    {growthQuality.job_stability && (
                      <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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

        {/* Rendered only when the payload actually carries a leadership block.
            Leadership_Check is NOT one of the keys the AI layer emits today
            (match_engine.py enumerates them: Technical_Skills,
            Capabilities_Check, STAR_Pattern_Check, Soft_Skills,
            Experience_Check, Education_Check, Requirements_Check,
            Job_Title_Check, Certifications_Check, Formatting_Check,
            Summary_Check, Match_Penalties, ATS_SCORE). Unguarded, parseScore
            turned the missing block into 0 and every user saw a red "0%
            Leadership" with no explanation -- a fabricated score on a report
            people make decisions from. The Career Progression card directly
            above already guards itself the same way. */}
        {leadership.match_score !== undefined && (
          <SectionCard
            label="Leadership"
            subtitle="Ownership, initiative & team leadership signals"
            icon={Crown}
            priorityLabel="Low priority"
            priorityLevel="low"
            score={leadershipScore}
            passText="Your resume shows leadership and ownership where it's needed."
          >
            {leadership.reason && leadershipScore < 100 && (
              <p className="text-[13px] text-gray-600 leading-relaxed">{leadership.reason}</p>
            )}
          </SectionCard>
        )}
      </div>
    </section>
  );
}
