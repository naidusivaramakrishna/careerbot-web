"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Info, RefreshCw, Sparkles } from "lucide-react";
import {
  FIX_KIND_LABEL,
  type AtsReportModel,
  type AutoFixedItem,
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

/** Only these can be opened in the enhancer: format findings, an off-field resume and `info` items just explain. */
const canFix = (item: ReportItem) => item.kind !== "info" && !/^ats_|_domain_mismatch$/.test(item.id);

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
  const [open, setOpen] = useState(false);
  const hasExample = Boolean(item.before || item.after);
  const points = pointsLabel(item.points);
  return (
    <li data-testid="ats-suggestion" className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
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

      {hasExample && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="mt-2 text-xs font-bold text-[#2557a7] hover:underline"
          >
            {open ? "Hide example" : "See example"}
          </button>
          {open && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {item.before && (
                <div data-testid="fix-before" className="rounded-md bg-[#2557a7] p-3 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">Your resume now</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-white">{item.before}</p>
                </div>
              )}
              {item.after && (
                <div data-testid="fix-after" className="rounded-md bg-green-600 p-3 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">
                    {item.kind === "manual" ? "Example of what to add" : "Suggested"}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-white">{item.after}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}

function SectionCard({ section, disabled, onFix }: {
  section: ReportSection;
  disabled: boolean;
  onFix: (name?: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const color = barColor(section.scorePct);

  // Nothing to improve here: one quiet line, not a full card. A low score with no listed suggestion keeps its card.
  if (section.items.length === 0 && section.reasons.length === 0 && section.scorePct >= 80) {
    return (
      <section data-testid="ats-section" aria-label={section.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CheckCircle2 size={16} className="text-green-600" aria-hidden="true" />
          {section.name}
        </h3>
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-green-700">Nothing to fix here.</span>
          <span className="tabular-nums">{section.scorePct}%</span>
        </span>
      </section>
    );
  }

  const shown = showAll ? section.items : section.items.slice(0, MAX_SHOWN);
  const hidden = section.items.length - shown.length;
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
          {section.reasons.map((reason) => (
            <li key={reason} className="flex gap-2 text-sm text-slate-600">
              <Info size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {section.items.length === 0 && section.reasons.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No specific suggestions for this section.</p>
      )}

      {section.items.length > 0 && (
        <>
          <ul className="mt-4 space-y-3">
            {shown.map((item) => (
              <Suggestion key={item.id} item={item} />
            ))}
          </ul>
          {section.items.length > MAX_SHOWN && (
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((value) => !value)}
              className="mt-3 text-xs font-bold text-[#2557a7] hover:underline"
            >
              {showAll ? "Show fewer" : `Show ${hidden} more`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** The AI sends field names only: "phone_number" reads "Phone number"; a name already readable ("LinkedIn") is kept. */
const fieldLabel = (field: string) => {
  if (!/[_-]/.test(field)) return field.trim();
  const words = field.replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** What the scan already fixed for the user, so the score above is understood. Undo lives in the enhancer. */
function AutoFixedCard({ items }: { items: AutoFixedItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, MAX_SHOWN);
  return (
    <section aria-label="Fixed automatically" data-testid="auto-fixed" className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">
        Fixed automatically ({items.length})
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
                    <p className="font-semibold text-white/80">Before</p>
                    <p className="mt-0.5 whitespace-pre-line text-white">{item.before}</p>
                  </div>
                )}
                {item.after && (
                  <div data-testid="fix-after" className="rounded-md bg-green-600 p-2 text-white">
                    <p className="font-semibold text-white/80">Now</p>
                    <p className="mt-0.5 whitespace-pre-line text-white">{item.after}</p>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {items.length > MAX_SHOWN && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll((value) => !value)}
          className="mt-3 text-xs font-bold text-[#2557a7] hover:underline"
        >
          {showAll ? "Show fewer changes" : `View all ${items.length} changes`}
        </button>
      )}
    </section>
  );
}

/** How complete the resume is, and which details it still lacks. Both come straight from the scan. */
function CompletenessCard({ scorePct, missingFields, disabled, onAdd }: {
  scorePct: number; missingFields: string[]; disabled: boolean; onAdd: () => void;
}) {
  const pct = Math.max(0, Math.min(100, scorePct));
  return (
    <section aria-label="Resume completeness" data-testid="completeness-card" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">Resume completeness</h2>
        <span data-testid="completeness-pct" className="text-sm font-extrabold tabular-nums text-slate-900">{pct}%</span>
      </div>
      <div
        role="progressbar" aria-label="Resume completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-[#2557a7]" style={{ width: `${pct}%` }} />
      </div>
      {missingFields.length > 0 ? (
        <>
          <p className="mt-3 text-xs text-slate-600">Still missing:</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <li key={field} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {fieldLabel(field)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#2557a7] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add them in the enhancer
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </>
      ) : (
        <p className="mt-3 text-xs text-slate-600">Every detail we look for is on your resume.</p>
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
                <button type="button" onClick={onRetrySetup} className="font-bold underline">Try again</button>
              </p>
            )}
          </div>
        </section>

        {model.autoFixed.length > 0 && <AutoFixedCard items={model.autoFixed} />}

        {model.completeness && (
          <CompletenessCard
            scorePct={model.completeness.scorePct}
            missingFields={model.completeness.missingFields}
            disabled={fixDisabled}
            onAdd={() => onFix()}
          />
        )}

        {applicable.map((section) => (
          <SectionCard key={section.name} section={section} disabled={fixDisabled} onFix={onFix} />
        ))}

        {skipped.length > 0 && (
          <p className="text-xs text-slate-500">
            Not applicable for your profile: {skipped.map((s) => s.name).join(", ")}.
          </p>
        )}
      </main>
    </div>
  );
}
