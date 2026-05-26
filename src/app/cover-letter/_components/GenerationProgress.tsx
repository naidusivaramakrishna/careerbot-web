"use client";

/**
 * Screen B.2 — generation-in-flight loader.
 *
 * The backend's /generate takes ~30s wall-clock (3 LLM calls + AI
 * verify). The backend doesn't stream events; this component
 * simulates progress with a timed checklist (steps advance on a
 * fixed schedule) plus an elapsed-time counter that's anchored to
 * real wall-clock so the user trusts it.
 *
 * Spec: wireframes §B.2. Cancel semantics: AbortController only
 * stops client waiting; backend may still finish + persist. Caller
 * handles the post-cancel reconciliation via list refetch (§B.2).
 */
import { useEffect, useState } from "react";

const STEPS = [
  { id: "read", label: "Reading your resume", appearAt: 0 },
  { id: "match", label: "Matching against the JD", appearAt: 4 },
  { id: "draft", label: "Drafting paragraphs", appearAt: 12 },
  { id: "verify", label: "Verifying every claim", appearAt: 20 },
  { id: "polish", label: "Polishing", appearAt: 28 },
] as const;

export interface GenerationProgressProps {
  /** Called when the user clicks Cancel. The parent calls the
   *  useGenerateCoverLetter.abort() to stop waiting client-side. */
  onCancel: () => void;
  /** Optional: a one-line note about retrying behavior (e.g.
   *  "Already retried once via cache hit"). */
  note?: string;
}

export default function GenerationProgress({
  onCancel,
  note,
}: GenerationProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - t0) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#2257a7]"
            role="status"
            aria-label="Generating cover letter"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
          Generating your cover letter…
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          This usually takes 20–40 seconds.
        </p>

        <ul role="list" aria-live="polite" className="space-y-2 mb-6">
          {STEPS.map((step) => {
            const status = stepStatus(step.appearAt, elapsed);
            return (
              <li
                key={step.id}
                className="flex items-center gap-3 text-sm"
                aria-label={`${step.label}: ${status}`}
              >
                <StepIcon status={status} />
                <span
                  className={
                    status === "done"
                      ? "text-gray-900"
                      : status === "in_progress"
                        ? "text-gray-900 font-medium"
                        : "text-gray-400"
                  }
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>

        <p
          className="text-center text-xs text-gray-500 mb-4"
          aria-live="polite"
          aria-atomic="true"
        >
          Elapsed: {elapsed}s
        </p>

        {note && (
          <p className="text-center text-xs text-gray-500 mb-4 italic">
            {note}
          </p>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type StepStatus = "pending" | "in_progress" | "done";

function stepStatus(
  appearAtSeconds: number,
  elapsedSeconds: number,
): StepStatus {
  if (elapsedSeconds < appearAtSeconds) return "pending";
  // Step is "in_progress" until the NEXT step's appearAt; here we
  // approximate with a fixed 4s window so the user sees motion.
  if (elapsedSeconds < appearAtSeconds + 4) return "in_progress";
  return "done";
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600"
      >
        ✓
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        aria-hidden="true"
        className="inline-block w-5 h-5 rounded-full border-2 border-[#2257a7] border-t-transparent animate-spin"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-block w-5 h-5 rounded-full border-2 border-gray-200"
    />
  );
}
