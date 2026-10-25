"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Check,
  Minus,
  AlertCircle,
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
import { resultColor } from "./resultsSummary";
import { impactFromPenalties } from "@/lib/job-match/sectionImpact";

function parseScore(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw.replace("%", "")) : NaN;
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
}

function prettify(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type PriorityLevel = "high" | "medium" | "low";
const ExpandAllContext = React.createContext<boolean | null>(null);

// Card-level priority accent — icon circle, badge colors. Text labels stay
// exactly what each call site passes; this only drives color/icon.
const PRIORITY_STYLES: Record<PriorityLevel, { Icon: LucideIcon; text: string; bg: string; border: string }> = {
  high:   { Icon: Flame, text: "#B42318", bg: "#FEF3F2", border: "#B42318" },
  medium: { Icon: Star,  text: "#B54708", bg: "#FFFAEB", border: "#FEDF89" },
  low:    { Icon: Info,  text: "#475467", bg: "#F2F4F7", border: "#EAECF0" },
};

type ChipTone = "red" | "blue" | "green";

const CHIP_TONE_STYLES: Record<ChipTone, { text: string; chipBg: string; chipBorder: string; dot: string }> = {
  red:   { text: "text-[#B42318]", chipBg: "bg-[#FEF3F2]", chipBorder: "border-[#B20C0C26]", dot: "bg-[#B42318]" },
  blue:  { text: "text-[#475467]", chipBg: "bg-[#F8FAFC]", chipBorder: "border-[#EAECF0]", dot: "bg-[#2557A7]" },
  green: { text: "text-[#067647]", chipBg: "bg-[#F8FAFC]", chipBorder: "border-[#D1FADF]", dot: "bg-[#067647]" },
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
      <p className={`mb-2 flex items-center gap-1.5 text-body-sm font-bold ${s.text}`}>
        <Icon className="h-3.5 w-3.5" />
        {heading} <span className="font-semibold text-slate-600">· {count}</span>
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
                className={`inline-flex items-center gap-1.5 rounded-full border ${s.chipBorder} ${s.chipBg} px-3 py-1.5 text-body-sm font-medium text-[#101828]`}
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
              className={`inline-flex items-center gap-2 rounded-full border pl-3 pr-1.5 py-1.5 text-body-sm font-medium transition-colors ${
                isAdded
                  ? "border-[#D1FADF] bg-[#F8FAFC] text-[#067647] text-label"
                  : `${s.chipBorder} ${s.chipBg} text-[#101828] hover:brightness-95`
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAdded ? "bg-[#067647]" : s.dot}`} />
              {item}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-sm font-bold ${
                  isAdded ? "bg-[#067647] text-white" : "bg-white/70 text-[#475467]"
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
  readonly score: number | null;
  readonly passText: string;
  readonly children?: React.ReactNode;
  readonly missingCount?: number;
  /** This check crashed server-side — the score is not a real measurement, so render as a recoverable state instead of "0% failed". */
  readonly errorMessage?: string;
  readonly defaultExpanded?: boolean;
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
    <div className="bg-[#F8FAFC] px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-50">
          <Icon className="h-4 w-4 text-warning-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-slate-900">{label}</p>
          <p className="mt-0.5 truncate text-body-sm text-[#475467]">{subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning-200 bg-warning-50 px-2.5 py-1 text-body-sm text-warning-700">
          <Info className="h-3 w-3" />
          Not evaluated
        </span>
      </div>

      <div className="mt-3 ml-12 flex items-start gap-2.5 rounded-lg border border-dashed border-warning-200 bg-warning-50 px-4 py-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning-50">
          <MessageCircle className="h-3 w-3 text-warning-700" />
        </span>
        <p className="text-body-sm text-warning-900">{errorMessage}</p>
      </div>
    </div>
  );
}

// Uses Job Match's shared score bands (resultColor: 85/70/55) so a section's
// color always matches how the overview and detailed-analysis header judge
// the same score.
const scoreColor = resultColor;

// One compact row (icon + title + meta on the left, score % + chevron on the
// right) — collapsed by default so the list reads as a single dense scan,
// matching the reference layout's row height. Expanding a row reveals the
// same detail content as before, indented under it.
function SectionCard({
  label, subtitle, icon: Icon, priorityLevel, score, passText, children, missingCount, errorMessage, defaultExpanded = false,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const expandAll = React.useContext(ExpandAllContext);
  const prio = PRIORITY_STYLES[priorityLevel];

  const unavailable = score == null;
  const passed = score != null && score >= 100;
  const hasDetails = !!children && !passed && !unavailable;

  React.useEffect(() => {
    if (hasDetails && expandAll !== null) setExpanded(expandAll);
  }, [expandAll, hasDetails]);

  // Recoverable AI-processing issue (e.g. Soft Skills scoring crashed) — warm,
  // calm amber treatment, not a red "error" state.
  if (errorMessage) {
    return <ErrorSectionCard label={label} subtitle={subtitle} icon={Icon} errorMessage={errorMessage} />;
  }

  const color     = scoreColor(score);

  let meta: React.ReactNode;
  if (unavailable) {
    meta = <span className="text-body-sm text-[#475467]">No usable score was returned for this check.</span>;
  } else if (passed) {
    meta = (
      <span className="inline-flex items-center gap-1 text-body-sm text-[#067647]">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> {passText}
      </span>
    );
  } else if (missingCount !== undefined) {
    meta = <span className="text-body-sm text-[#475467]">{missingCount} missing · Needs attention</span>;
  } else {
    meta = <p className="text-body-sm text-[#475467]">{subtitle}</p>;
  }

  return (
    <div data-analysis-section className="overflow-hidden rounded-md border border-[#EAECF0] bg-white">
      <div
        role={hasDetails ? "button" : undefined}
        aria-expanded={hasDetails ? expanded : undefined}
        aria-label={hasDetails ? `${label}: ${score}%. Needs attention. ${priorityLevel} impact. Expand for findings and suggested changes.` : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        onClick={hasDetails ? () => setExpanded((v) => !v) : undefined}
        onKeyDown={hasDetails ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } } : undefined}
        className={`flex items-center gap-2.5 bg-white px-3 ${passed ? "min-h-12 py-2" : "min-h-16 py-2.5"} ${hasDetails ? "cursor-pointer hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" : ""}`}
      >
        <div data-analysis-icon data-status={unavailable ? "unavailable" : passed ? "matched" : "attention"} title={unavailable ? "Not evaluated" : passed ? "Matched" : "Needs attention"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F8FAFC] text-[#2557A7]">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          <span data-status-mark aria-hidden="true">{unavailable ? <Minus /> : passed ? <Check /> : <AlertCircle />}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-body-sm text-slate-800">{label}{unavailable && <span className="ml-2 text-body-sm text-[#475467]">Not evaluated</span>}</p>
            {!passed && !unavailable && <span data-analysis-impact className="rounded px-2 py-1 text-body-sm" style={{ background: prio.bg, color: prio.text }}>{priorityLevel === "high" ? "High Impact" : priorityLevel === "medium" ? "Medium Impact" : "Low Impact"}</span>}
          </div>
          <div className="mt-0.5">{meta}</div>
        </div>
        <div className="flex w-[76px] shrink-0 items-center justify-between gap-2">
          <span className="min-w-10 text-right text-body-lg tabular-nums" style={{ color }}>{score == null ? "N/A" : `${Math.round(score)}%`}</span>
          {hasDetails && (
            <span
              aria-hidden="true"
              data-analysis-chevron
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      {hasDetails && expanded && (
        <div className="border-t border-[#EAECF0] bg-white p-3 sm:p-4">
          <p data-section-guidance>{priorityLevel === "high" ? "High impact: prioritize this gap when it reflects your experience." : priorityLevel === "medium" ? "Medium impact: review this area after the highest-priority gaps." : "Low impact: a useful refinement after the main gaps are addressed."} Review the findings below and apply only changes that are accurate. Analyze your updated resume again to refresh this score.</p>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ScoreBreakdown({
  matchResult, currentSummary = "", onAddSkill, appliedSuggestionIds, expandAll = null,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly matchResult: any;
  readonly currentSummary?: string;
  /** When given, missing Hard/Soft Skill chips below become one-click "+pts / Add" buttons instead of plain pills. */
  readonly onAddSkill?: (skill: string, suggestion_id?: string) => Promise<boolean> | boolean;
  readonly appliedSuggestionIds?: string[];
  readonly expandAll?: boolean | null;
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

  // Impact follows the severity of the section's outstanding fixes, the same source the
  // Recommendations tab labels by, so one item cannot read Low here and High there. The
  // fixed value is only the fallback for a section that has no fix rows.
  const sectionImpact = (categories: string[], fallback: "high" | "medium" | "low") =>
    impactFromPenalties(matchResult.Match_Penalties?.penalties, categories, fallback);

  const techScore = parseScore(tech.execution_failed ? null : tech.match_score);
  const softScore = parseScore(soft.execution_failed ? null : soft.match_score);
  const capScore  = parseScore(cap.execution_failed ? null : cap.match_score);
  const starScore = parseScore(star.execution_failed ? null : star.match_score);
  const summaryScore = parseScore(summary.execution_failed ? null : summary.match_score);
  const reqScore = parseScore(req.execution_failed ? null : req.match_score);
  const expScore  = parseScore(exp.execution_failed ? null : exp.match_score);
  const eduScore  = parseScore(edu.execution_failed ? null : edu.match_score);
  const jobScore  = parseScore(job.execution_failed ? null : job.match_score);
  const certScore = parseScore(cert.execution_failed ? null : cert.match_score);
  const fmtScore  = parseScore(fmt.execution_failed ? null : fmt.match_score);
  const careerProgScore = parseScore(careerProg.execution_failed ? null : careerProg.match_score);
  const leadershipScore = parseScore(leadership.execution_failed ? null : leadership.match_score);

  const missingTech: { skill: string; importance: string }[] = [
    ...(tech.missing_critical_skills ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "required" })),
    ...(tech.missing_important_skills ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "important" })),
    ...(tech.missing_nice_to_have ?? []).map((s: { skill: string }) => ({ skill: s.skill, importance: "nice to have" })),
  ];
  const requiredTech = missingTech.filter((item) => item.importance !== "nice to have");
  const optionalTech = missingTech.filter((item) => item.importance === "nice to have");
  const missingSoft: string[] = soft.missing_skills ?? [];
  // Preserve failed checks as unavailable rather than displaying a false zero.
  const softError: string | undefined = soft.execution_failed
    ? "This section could not be evaluated. Run a new analysis to try again."
    : undefined;
  const missingCap: string[] = (cap.missing_capabilities ?? []).map((c: { capability: string }) => c.capability);
  // STAR rewrites have used a few field names across matcher versions. Read
  // the text already returned by the backend instead of leaving the After
  // panel empty when the payload uses improved_bullet/after_example.
  const firstText = (...values: unknown[]): string => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };
  const weakBullets: { original: string; improved: string }[] = (star.weak_bullets ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (bullet: any, index: number) => {
      const original = firstText(
        bullet.original,
        bullet.original_bullet,
        bullet.bullet,
        bullet.text,
        bullet.before,
        bullet.before_example,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingPenalty = penalties.find((penalty: any) =>
        (bullet.suggestion_id && penalty.suggestion_id === bullet.suggestion_id) ||
        (original && penalty.before_example === original)
      );
      return {
        original: firstText(original, matchingPenalty?.before_example),
        improved: firstText(
          bullet.improved,
          bullet.improved_bullet,
          bullet.improved_version,
          bullet.suggested,
          bullet.suggested_text,
          bullet.suggested_bullet,
          bullet.suggested_version,
          bullet.suggested_improvement,
          bullet.rewrite,
          bullet.rewritten_bullet,
          bullet.recommended_rewrite,
          bullet.after,
          bullet.after_example,
          bullet.recommendation?.text,
          bullet.recommendation?.rewrite,
          star.improved_bullets?.[index],
          star.suggested_bullets?.[index],
          matchingPenalty?.after_example,
        ),
      };
    }
  ).filter((bullet: { original: string; improved: string }) => bullet.original || bullet.improved);
  const starSuggestion: string = star.suggestion ?? "";
  const starSeniority: string  = star.seniority ?? "";
  const missingVerbs: string[] = (req.missing_verbs ?? []).map((v: { verb: string }) => v.verb);

  return (
    <ExpandAllContext.Provider value={expandAll}>
    <section data-score-breakdown aria-label="Score breakdown by category" className="overflow-hidden rounded-lg border border-[#EAECF0] bg-white">
      <div className="divide-y divide-[#EAECF0]">
        <SectionCard
          label="Hard Skills"
          subtitle="Skills & technical abilities"
          icon={Code2}
          priorityLabel="High priority"
          priorityLevel={sectionImpact(["technical_skills"], "high")}
          score={techScore}
          passText="Your resume includes all of the Hard skills."
          missingCount={missingTech.length}
          defaultExpanded
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
          priorityLevel={sectionImpact(["soft_skills"], "medium")}
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
          priorityLevel={sectionImpact(["capabilities"], "medium")}
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
          priorityLevel={sectionImpact(["star_pattern"], "medium")}
          score={starScore}
          passText="Your bullets follow the STAR format with measurable results."
        >
          {(starSuggestion || starSeniority || weakBullets.length > 0) && (
            <div className="space-y-3">
              {(starSuggestion || starSeniority) && (
                <div className="flex items-start justify-between gap-3">
                  {starSuggestion && (
                    <p className="text-body-sm text-gray-600 flex-1">
                      <span className="font-semibold text-gray-800">Tip:</span> {starSuggestion}
                    </p>
                  )}
                  {starSeniority && (
                    <span className="shrink-0 text-body-sm px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      {starSeniority}
                    </span>
                  )}
                </div>
              )}
              {weakBullets.length > 0 && (
                <ul className="space-y-3">
                  {weakBullets.map((b, i) => (
                    <li key={`${b.original}-${i}`} className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-[#FEF3F2] border-b border-[#B20C0C26]">
                        <span className="text-body-sm text-[#B42318] uppercase tracking-wider mt-0.5 shrink-0">Before</span>
                        <p className="text-body-sm text-[#B42318] line-through">{b.original}</p>
                      </div>
                      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-success-50">
                        <span className="text-body-sm text-success-700 uppercase tracking-wider mt-0.5 shrink-0">After</span>
                        <p className="text-body-sm text-success-700">{b.improved || "No suggested rewrite was returned for this bullet."}</p>
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
          priorityLevel={sectionImpact(["requirements"], "medium")}
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
          priorityLevel={sectionImpact(["summary"], "medium")}
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
                <p className="text-body-sm text-gray-600">{summary.reason}</p>
              )}
              {summary.suggested_summary && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                  {currentSummary && (
                    <div className="rounded-lg border border-[#B20C0C26] bg-[#FEF3F2] px-4 py-3">
                      <p className="mb-1.5 text-body-sm uppercase tracking-[0.08em] text-[#B42318]">Before · Current</p>
                      <p className="text-body-sm text-[#B42318]">{currentSummary}</p>
                    </div>
                  )}
                  {currentSummary && <div className="hidden items-center text-[#475467] md:flex">→</div>}
                  <div className="rounded-lg border border-[#ABEFC6] bg-[#F8FAFC] px-4 py-3">
                    <p className="mb-1.5 text-body-sm uppercase tracking-[0.08em] text-[#067647]">After · Suggested</p>
                    <p className="text-body-sm text-[#245a38]">{summary.suggested_summary}</p>
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
          priorityLevel={sectionImpact(["job_title"], "low")}
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
                <p className="text-body-sm text-gray-600">{job.reason}</p>
              )}
              {(job.matched_title || job.jd_title) && (
                <p className="text-body-sm text-gray-600">
                  Your title <span className="font-bold text-gray-800">{job.matched_title || "—"}</span>
                  {job.jd_title && <> vs. the JD&apos;s <span className="font-bold text-success-700">{job.jd_title}</span></>}
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
          priorityLevel={sectionImpact(["experience"], "low")}
          score={expScore}
          passText="Your experience level matches the role requirements."
        >
          {exp.reason && (expScore ?? 0) < 100 && <p className="text-body-sm text-gray-600">{exp.reason}</p>}
        </SectionCard>

        <SectionCard
          label="Education"
          subtitle="Degree and academic requirements"
          icon={GraduationCap}
          priorityLabel="Low priority"
          priorityLevel={sectionImpact(["education"], "low")}
          score={eduScore}
          passText="Your education meets the role requirements."
        >
          {edu.reason && (eduScore ?? 0) < 100 && <p className="text-body-sm text-gray-600">{edu.reason}</p>}
        </SectionCard>

        <SectionCard
          label="Certifications"
          subtitle="Relevant professional certifications"
          icon={Award}
          priorityLabel="Low priority"
          priorityLevel={sectionImpact(["certifications"], "low")}
          score={certScore}
          passText="Your certifications meet the role requirements."
        >
          {cert.reason && (certScore ?? 0) < 100 && <p className="text-body-sm text-gray-600">{cert.reason}</p>}
        </SectionCard>

        <SectionCard
          label="ATS Formatting"
          subtitle="Resume structure & parseability"
          icon={FileCheck2}
          priorityLabel="Low priority"
          priorityLevel={sectionImpact(["formatting"], "low")}
          score={fmtScore}
          passText="Your resume formatting is ATS-friendly."
        >
          {fmt.reason && (fmtScore ?? 0) < 100 && (
            <ul className="space-y-2">
              {fmt.reason.split(".,").filter(Boolean).map((r: string, i: number) => (
                <li key={`${r}-${i}`} className="flex items-start gap-2 text-body-sm text-gray-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {r.trim().replace(/\.$/, "")}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {careerProg.applicable !== false && careerProg.match_score != null && (
          <SectionCard
            label="Career Progression"
            subtitle="Growth trajectory and job stability"
            icon={TrendingUp}
            priorityLabel="Low priority"
            priorityLevel="low"
            score={careerProgScore}
            passText="Your career shows strong, stable progression."
          >
            {careerProg.reason && (careerProgScore ?? 0) < 100 && (
              <div className="space-y-1.5">
                <p className="text-body-sm text-gray-600">{careerProg.reason}</p>
                {(growthQuality.progression_type || growthQuality.job_stability) && (
                  <div className="flex flex-wrap gap-1.5">
                    {growthQuality.progression_type && (
                      <span className="text-body-sm px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        {prettify(growthQuality.progression_type)}
                      </span>
                    )}
                    {growthQuality.job_stability && (
                      <span className="text-body-sm px-2.5 py-1 rounded-full bg-blue-50 text-brand-600 border border-blue-200">
                        {prettify(growthQuality.job_stability)} job stability
                      </span>
                    )}
                  </div>
                )}
                {(levelAlignment.candidate_current_level && levelAlignment.jd_expected_level) && (
                  <p className="text-body-sm text-gray-600">
                    Your level <span className="font-bold text-gray-800">{prettify(levelAlignment.candidate_current_level)}</span>
                    {" "}vs. the JD&apos;s <span className="font-bold text-success-700">{prettify(levelAlignment.jd_expected_level)}</span>
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {/* Optional checks appear only when a score is included in the payload. */}
        {leadership.match_score != null && (
          <SectionCard
            label="Leadership"
            subtitle="Ownership, initiative & team leadership signals"
            icon={Crown}
            priorityLabel="Low priority"
            priorityLevel={sectionImpact(["leadership"], "low")}
            score={leadershipScore}
            passText="Your resume shows leadership and ownership where it's needed."
          >
            {leadership.reason && (leadershipScore ?? 0) < 100 && (
              <p className="text-body-sm text-gray-600">{leadership.reason}</p>
            )}
          </SectionCard>
        )}
      </div>
    </section>
    </ExpandAllContext.Provider>
  );
}
