"use client";

import React, { useId, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Info, RefreshCw, Sparkles } from "lucide-react";
import {
  FIX_KIND_LABEL,
  IMPACT_LABEL,
  canFix,
  groupByImpact,
  type AtsReportModel,
  type AutoFixedItem,
  type ImpactGroup,
  type ReportImpact,
  type ReportItem,
  type ReportSection,
} from "../report/atsReportModel";

interface ATSScanReportProps {
  model: AtsReportModel;
  /** True once the scanned resume has an enhancer record the Fix buttons can open. */
  fixReady: boolean;
  /** The enhancer record is still being set up. */
  preparing: boolean;
  /** Why the enhancer could not be prepared; Fix stays disabled until retried. */
  setupError: string | null;
  onRetrySetup: () => void;
  /** Open the enhancer, on `atsSectionName` when given. */
  onFix: (atsSectionName?: string) => void;
  onScanAnother: () => void;
}

const TONE = {
  good: { ring: "#16a34a", chip: "bg-green-50 text-green-700 border-green-200" },
  fair: { ring: "#d97706", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  poor: { ring: "#dc2626", chip: "bg-red-50 text-red-700 border-red-200" },
} as const;

function barColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "#d97706";
  return "#dc2626";
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`ATS score ${Math.round(score)} out of 100`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span data-testid="ats-score" className="text-4xl font-extrabold tabular-nums text-slate-900">{Math.round(score)}</span>
        <span className="text-xs font-semibold text-slate-500">out of 100</span>
      </div>
    </div>
  );
}

/** How many suggestions a section shows before "Show more"; the rest are one click away. */
const MAX_SHOWN = 3;

/** Whole points read better than "+4.2"; a fix worth under half a point shows no chip. */
const pointsLabel = (points: number | null) => (points !== null && points >= 0.5 ? `+${Math.round(points)} pts` : null);

function SectionFixButton({ section, disabled, onFix }: {
  section: ReportSection;
  disabled: boolean;
  onFix: (name?: string) => void;
}) {
  if (section.editorSection === null || !section.items.some(canFix)) return null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onFix(section.name)}
      aria-label={`Fix this section: ${section.name}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#2557a7] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#1e4a91] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles size={13} aria-hidden="true" />
      Fix this section
      <ArrowRight size={13} aria-hidden="true" />
    </button>
  );
}

function Suggestion({ item }: { item: ReportItem }) {
  const points = pointsLabel(item.points);
  return (
    <li data-testid="ats-suggestion" className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-sm font-bold text-slate-900">{item.title}</h5>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">{FIX_KIND_LABEL[item.kind]}</span>
          {points && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#2557a7]">
              {points}
            </span>
          )}
        </div>
      </div>

      {item.reason && <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{item.reason}</p>}
    </li>
  );
}

const IMPACT_TONE: Record<ReportImpact, { dot: string; chip: string }> = {
  high: { dot: "bg-red-500", chip: "border-red-200 bg-red-50 text-red-700" },
  medium: { dot: "bg-amber-500", chip: "border-amber-200 bg-amber-50 text-amber-700" },
  low: { dot: "bg-slate-400", chip: "border-slate-200 bg-slate-50 text-slate-600" },
};

/** A section inside an impact panel: its score and Fix button, why it lost points, and its suggestions of that impact. */
function ImpactSection({ section, items, showReasons, disabled, onFix }: {
  section: ReportSection;
  items: ReportItem[];
  /** The explanation rows are listed once per section, in the first panel it appears in. */
  showReasons: boolean;
  disabled: boolean;
  onFix: (name?: string) => void;
}) {
  const color = barColor(section.scorePct);
  return (
    <section data-testid="impact-section" aria-label={section.name}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-900">{section.name}</h4>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{section.scorePct}%</span>
          <SectionFixButton section={section} disabled={disabled} onFix={onFix} />
        </div>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar" aria-label={`${section.name} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={section.scorePct}
      >
        <div className="h-full rounded-full" style={{ width: `${section.scorePct}%`, background: color }} />
      </div>

      {showReasons && section.reasons.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {section.reasons.map((reason, index) => (
            <li key={`${index}-${reason}`} className="flex gap-2 text-sm text-slate-600">
              <Info size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <Suggestion key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

/**
 * One impact level, in a tab that opens and closes. Which tab is open is decided by the report (one at a time), so this
 * only draws it. Inside it, the sections that have suggestions of this level, each with those suggestions.
 */
function ImpactPanel({ group, open, onToggle, reasonsFor, disabled, onFix }: {
  group: ImpactGroup;
  open: boolean;
  onToggle: () => void;
  /** Sections whose explanation rows are listed in this panel. */
  reasonsFor: ReadonlySet<string>;
  disabled: boolean;
  onFix: (name?: string) => void;
}) {
  const panelId = useId();
  const tone = IMPACT_TONE[group.impact];
  const count = group.items.length;
  const points = pointsLabel(group.points);
  return (
    <section
      data-testid="impact-panel"
      data-impact={group.impact}
      aria-label={IMPACT_LABEL[group.impact]}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={onToggle}
          data-testid="impact-heading"
          className="flex w-full items-center justify-between gap-3 bg-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-200"
        >
          <span className="flex flex-wrap items-center gap-2.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
            <span className="text-base font-bold text-slate-900">{IMPACT_LABEL[group.impact]}</span>
            <span data-testid="impact-count" className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>
              {count} {count === 1 ? "suggestion" : "suggestions"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            {points && <span data-testid="impact-points" className="text-xs font-semibold text-slate-500">{points}</span>}
            <ChevronDown size={18} aria-hidden="true" className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </h3>
      {open && (
        <div id={panelId} data-testid="impact-items" className="space-y-6 border-t border-slate-100 p-5">
          {group.sections.map(({ section, items }) => (
            <ImpactSection
              key={section.name}
              section={section}
              items={items}
              showReasons={reasonsFor.has(section.name)}
              disabled={disabled}
              onFix={onFix}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * The sections with nothing to fix, in one tab at the end (gray heading like the impact tabs): good news in one line
 * instead of a full-width row for each section. Sections the profile does not need are named here too.
 */
function NoIssuesPanel({ sections, notApplicable, open, onToggle }: {
  sections: ReportSection[];
  notApplicable: ReportSection[];
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const count = sections.length;
  return (
    <section
      data-testid="no-issues-panel"
      aria-label="No issues"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={onToggle}
          data-testid="no-issues-heading"
          className="flex w-full items-center justify-between gap-3 bg-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-200"
        >
          <span className="flex flex-wrap items-center gap-2.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-base font-bold text-slate-900">No issues</span>
            <span data-testid="no-issues-count" className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
              {count} {count === 1 ? "section" : "sections"}
            </span>
          </span>
          <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={panelId} data-testid="no-issues-items" className="border-t border-slate-100 p-5">
          <ul className="space-y-2.5">
            {sections.map((section) => (
              <li key={section.name} data-testid="no-issues-section" className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  <CheckCircle2 size={16} className="text-green-600" aria-hidden="true" />
                  {section.name}
                </span>
                <span className="tabular-nums text-slate-500">{section.scorePct}%</span>
              </li>
            ))}
          </ul>
          {notApplicable.length > 0 && (
            <p data-testid="not-applicable" className="mt-4 text-xs text-slate-500">
              Not applicable for your profile: {notApplicable.map((s) => s.name).join(", ")}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** A section with nothing listed to do that is still not fine: a low score, or an explanation of the lost points. */
function SectionCard({ section, disabled, onFix }: {
  section: ReportSection;
  disabled: boolean;
  onFix: (name?: string) => void;
}) {
  const color = barColor(section.scorePct);

  return (
    <section data-testid="ats-section" aria-label={section.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{section.name}</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{section.scorePct}%</span>
          <SectionFixButton section={section} disabled={disabled} onFix={onFix} />
        </div>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar" aria-label={`${section.name} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={section.scorePct}
      >
        <div className="h-full rounded-full" style={{ width: `${section.scorePct}%`, background: color }} />
      </div>

      {section.reasons.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {section.reasons.map((reason, index) => (
            <li key={`${index}-${reason}`} className="flex gap-2 text-sm text-slate-600">
              <Info size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {section.items.length === 0 && section.reasons.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No specific suggestions for this section.</p>
      )}

    </section>
  );
}

/** What the scan already fixed for the user, so the score above is understood. Undo lives in the enhancer. */
function AutoFixedCard({ items, total }: { items: AutoFixedItem[]; total: number }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, MAX_SHOWN);
  // Fixes the ledger cannot describe are still applied and scored: count them, never hide them.
  const undescribed = Math.max(0, total - items.length);
  return (
    <section aria-label="Fixed automatically" data-testid="auto-fixed" className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">
        Fixed automatically ({Math.max(total, items.length)})
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        We applied these changes to your resume and your score includes them. You can undo any of them in the enhancer.
      </p>
      <ul className="mt-3 space-y-3">
        {shown.map((item) => (
          <li key={item.id} data-testid="auto-fixed-item" className="rounded-lg border border-emerald-100 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                {item.section && <span>{item.section}</span>}
                {pointsLabel(item.points) && <span className="font-semibold text-emerald-700">{pointsLabel(item.points)}</span>}
              </span>
            </div>
            {item.reason && <p className="mt-1 text-xs text-slate-600">{item.reason}</p>}
            {(item.before || item.after) && (
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                {item.before && (
                  <div data-testid="fix-before" className="rounded-md bg-[#2557a7] p-2 text-white">
                    <p className="font-semibold text-white">Before</p>
                    <p className="mt-0.5 whitespace-pre-line text-white">{item.before}</p>
                  </div>
                )}
                {item.after && (
                  <div data-testid="fix-after" className="rounded-md bg-green-700 p-2 text-white">
                    <p className="font-semibold text-white">Now</p>
                    <p className="mt-0.5 whitespace-pre-line text-white">{item.after}</p>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {undescribed > 0 && (
        <p className="mt-3 text-xs text-slate-600">
          {undescribed} more {undescribed === 1 ? "change is" : "changes are"} not described here. You can see {undescribed === 1 ? "it" : "them"} in the enhancer.
        </p>
      )}
      {items.length > MAX_SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-3 text-xs font-bold text-[#2557a7] hover:underline"
        >
          {showAll ? "Show fewer changes" : `View all ${items.length} ${undescribed > 0 ? "described " : ""}changes`}
        </button>
      )}
    </section>
  );
}

export default function ATSScanReport({
  model, fixReady, preparing, setupError, onRetrySetup, onFix, onScanAnother,
}: ATSScanReportProps) {
  const tone = TONE[model.band.tone];
  const applicable = model.sections.filter((s) => !s.notApplicable);
  const skipped = model.sections.filter((s) => s.notApplicable);
  const fixDisabled = !fixReady;
  const impactGroups = groupByImpact(model.sections);
  // A section's explanation rows are listed once, in the first panel (High, then Medium, then Low) it appears in.
  const reasonsSeen = new Set<string>();
  const reasonsByImpact = new Map<string, Set<string>>();
  for (const group of impactGroups) {
    const here = new Set<string>();
    for (const { section } of group.sections) {
      if (!reasonsSeen.has(section.name)) {
        reasonsSeen.add(section.name);
        here.add(section.name);
      }
    }
    reasonsByImpact.set(group.impact, here);
  }
  // Sections with suggestions are inside the impact panels. A section with nothing to improve goes in the "No issues"
  // panel; one with no suggestion but a low score (or an explanation of its lost points) is not fine, so it keeps its card.
  const noIssues = applicable.filter((s) => s.items.length === 0 && s.reasons.length === 0 && s.scorePct >= 80);
  const withoutSuggestions = applicable.filter((s) => s.items.length === 0 && !noIssues.includes(s));

  // The tabs work like an accordion: one is open at a time. High impact is the tab open when the report loads (when the
  // report has no High impact suggestion, none is open). Opening another tab closes the open one, and pressing the open
  // tab closes it. `choice` is what the user last did: undefined until they act, null once they closed every tab. If a
  // new report (a re-scan) has no tab the choice named, the default applies again.
  const defaultTab: string | null = impactGroups.some((group) => group.impact === "high") ? "high" : null;
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  const tabs = [...impactGroups.map((group) => group.impact as string), ...(noIssues.length > 0 ? ["no-issues"] : [])];
  const openTab = choice === undefined || (choice !== null && !tabs.includes(choice)) ? defaultTab : choice;
  const toggleTab = (tab: string) => setChoice(openTab === tab ? null : tab);
  const allItems = applicable.flatMap((s) => s.items);
  const quickFixes = allItems.filter((i) => i.kind === "auto").length;
  const needInput = allItems.filter((i) => i.kind === "manual").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-slate-900">ATS Scan Report</h1>
            <p className="text-xs text-slate-500">Your score and what to improve.</p>
          </div>
          <button
            type="button"
            onClick={onScanAnother}
            className="inline-flex items-center gap-2 rounded-md border border-[#9db7e5] bg-white px-3 py-2 text-xs font-bold text-[#2557a7] transition-colors hover:bg-blue-50"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Scan another resume
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <section aria-label="ATS score" className="flex flex-col items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
          <ScoreRing score={model.score} color={tone.ring} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-extrabold text-slate-900">Your ATS score</h2>
              <span data-testid="ats-band" className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone.chip}`}>{model.band.label}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {model.issueCount > 0
                ? `${model.issueCount} ${model.issueCount === 1 ? "suggestion" : "suggestions"} to improve your resume`
                : "No suggestions right now. Your resume is in good shape."}
              {model.potentialScore !== null && (
                <> — fixing them could raise your score to about <strong className="text-slate-900">{model.potentialScore}</strong>.</>
              )}
            </p>
            {quickFixes + needInput > 0 && (
              <p data-testid="ats-breakdown" className="mt-1 text-xs font-medium text-slate-500">
                {quickFixes} quick {quickFixes === 1 ? "fix" : "fixes"} · {needInput} {needInput === 1 ? "needs" : "need"} your input
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <button
                type="button"
                disabled={fixDisabled}
                onClick={() => onFix()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2557a7] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1e4a91] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles size={16} aria-hidden="true" />
                Enhance my resume
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              {preparing && <span className="text-xs text-slate-500" role="status">Getting the enhancer ready…</span>}
            </div>
            {setupError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {setupError}{" "}
                {!fixReady && <button type="button" onClick={onRetrySetup} className="font-bold underline">Try again</button>}
              </p>
            )}
          </div>
        </section>

        {(model.autoFixed.length > 0 || model.autoFixedCount > 0) && (
          <AutoFixedCard items={model.autoFixed} total={model.autoFixedCount} />
        )}

        {(impactGroups.length > 0 || noIssues.length > 0) && (
          <section aria-label="Report by impact" data-testid="impact-groups" className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Report by impact</h2>
            {impactGroups.map((group) => (
              <ImpactPanel
                key={group.impact}
                group={group}
                open={openTab === group.impact}
                onToggle={() => toggleTab(group.impact)}
                reasonsFor={reasonsByImpact.get(group.impact) ?? new Set()}
                disabled={fixDisabled}
                onFix={onFix}
              />
            ))}
            {noIssues.length > 0 && (
              <NoIssuesPanel
                sections={noIssues}
                notApplicable={skipped}
                open={openTab === "no-issues"}
                onToggle={() => toggleTab("no-issues")}
              />
            )}
          </section>
        )}

        {withoutSuggestions.map((section) => (
          <SectionCard key={section.name} section={section} disabled={fixDisabled} onFix={onFix} />
        ))}

        {skipped.length > 0 && noIssues.length === 0 && (
          <p className="text-xs text-slate-500">
            Not applicable for your profile: {skipped.map((s) => s.name).join(", ")}.
          </p>
        )}
      </main>
    </div>
  );
}
