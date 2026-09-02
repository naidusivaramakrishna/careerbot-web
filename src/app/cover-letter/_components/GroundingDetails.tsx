"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import type { Grounding } from "@/types/coverLetter";

export interface GroundingDetailsProps {
  grounding: Grounding;
}

const COVERAGE_LABEL: Record<NonNullable<Grounding["coverage_status"]>, string> = {
  sufficient: "Strong evidence",
  thin: "Limited evidence",
  low_confidence: "Low confidence",
};

const COVERAGE_STYLE: Record<NonNullable<Grounding["coverage_status"]>, string> = {
  sufficient: "bg-emerald-50 text-emerald-700",
  thin: "bg-amber-50 text-amber-700",
  low_confidence: "bg-red-50 text-red-700",
};

export default function GroundingDetails({ grounding }: GroundingDetailsProps) {
  const [open, setOpen] = useState(false);

  const size = grounding.claim_catalog_size ?? 0;
  const highConf = grounding.high_confidence_claims ?? 0;
  const lowConf = grounding.low_confidence_claims_used ?? 0;
  const coverage = grounding.coverage_status;
  const parserWarnings = grounding.parser_warnings_used ?? [];
  const coverageLabel = coverage ? COVERAGE_LABEL[coverage] : "Evidence checked";
  const coverageStyle = coverage ? COVERAGE_STYLE[coverage] : "bg-slate-50 text-slate-600";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 rounded-2xl px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
      >
        <span className="flex min-w-0 flex-1 gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2557a7]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-slate-900">Evidence check</span>
              <span className={["rounded-full px-2 py-0.5 text-xs font-medium", coverageStyle].join(" ")}>
                {coverageLabel}
              </span>
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              {highConf} high-confidence claim{highConf === 1 ? "" : "s"} found from a catalog of {size}.
            </span>
          </span>
        </span>
        {open ? (
          <ChevronUp className="mt-1 h-4 w-4 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 text-slate-400" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-4 text-sm text-slate-700">
          <div className="grid gap-3 sm:grid-cols-3">
            <DataTile label="Claim catalog" value={String(size)} />
            <DataTile label="High-confidence" value={String(highConf)} />
            <DataTile label="Low-confidence used" value={String(lowConf)} />
          </div>
          {parserWarnings.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Parser notes
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {parserWarnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DataTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
