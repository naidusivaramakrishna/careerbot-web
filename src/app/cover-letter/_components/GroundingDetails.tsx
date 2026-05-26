"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Grounding } from "@/types/coverLetter";

/**
 * Grounding-info collapsible (Screen C bottom section).
 *
 * Collapsed by default. Shows claim-catalog stats from the
 * backend's grounding object.
 *
 * Spec: wireframes §5.
 */
export interface GroundingDetailsProps {
  grounding: Grounding;
}

const COVERAGE_LABEL: Record<NonNullable<Grounding["coverage_status"]>, string> = {
  sufficient: "Sufficient",
  thin: "Thin",
  low_confidence: "Low confidence",
};

export default function GroundingDetails({ grounding }: GroundingDetailsProps) {
  const [open, setOpen] = useState(false);

  const size = grounding.claim_catalog_size ?? 0;
  const highConf = grounding.high_confidence_claims ?? 0;
  const lowConf = grounding.low_confidence_claims_used ?? 0;
  const coverage = grounding.coverage_status;
  const parserWarnings = grounding.parser_warnings_used ?? [];

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-[#2257a7] rounded-lg"
      >
        <span className="text-sm font-semibold text-gray-700">
          Grounding info
          {size > 0 && (
            <span className="text-gray-400 font-normal">
              {" "}
              (claim catalog: {size}
              {highConf > 0 && `, ${highConf} high-confidence`})
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-gray-700 space-y-1.5">
          <DataRow label="Claim catalog size" value={String(size)} />
          <DataRow label="High-confidence claims" value={String(highConf)} />
          <DataRow label="Low-confidence claims used" value={String(lowConf)} />
          {coverage && (
            <DataRow label="Coverage" value={COVERAGE_LABEL[coverage]} />
          )}
          {parserWarnings.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <p className="font-semibold mb-1">Parser warnings used:</p>
              <ul className="font-mono space-y-0.5">
                {parserWarnings.map((w, i) => (
                  <li key={`${w}-${i}`} className="text-gray-600">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-mono">{value}</span>
    </div>
  );
}
