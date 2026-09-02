"use client";
import React from "react";
import MultiColorCircularScore from "./MultiColorCircularScore";

export type CanonicalScoreStatus = "not_calculated" | "calculating" | "ready" | "stale" | "error";

interface FullAtsScoreCardProps {
  score: number | null;
  status: CanonicalScoreStatus;
  isStale: boolean;
  lastCalculatedAt: string | null;
  onCalculate: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function FullAtsScoreCard({
  score,
  status,
  isStale,
  lastCalculatedAt,
  onCalculate,
  isLoading = false,
  error = null,
}: FullAtsScoreCardProps) {
  const displayScore = score ?? 0;
  const showScoreCircle = status === "ready" || status === "stale";

  const statusLabel = (() => {
    if (status === "calculating" || isLoading) return "Calculating...";
    if (status === "not_calculated") return "Not calculated";
    if (isStale) return "Stale after latest edits";
    if (status === "error") return "Calculation failed";
    return "Ready";
  })();

  const statusColor = (() => {
    if (status === "error") return "text-red-600";
    if (isStale) return "text-amber-600";
    if (status === "ready") return "text-green-600";
    return "text-gray-600";
  })();

  const shouldDisableButton = isLoading || status === "calculating";

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Full ATS Score</h2>
        <p className="text-xs text-gray-500 mt-1">Official calculation</p>
      </div>

      {showScoreCircle && (
        <div className="flex flex-col items-center justify-center mb-6">
          <MultiColorCircularScore value={displayScore} />
          <p className="mt-3 text-sm text-gray-600">Score</p>
        </div>
      )}

      {lastCalculatedAt && showScoreCircle && (
        <div className="mb-4 text-xs text-gray-500 text-center">
          <p>Last calculated: {lastCalculatedAt}</p>
        </div>
      )}

      <div className={`mb-4 text-xs font-medium ${statusColor}`}>
        <p>Status: {statusLabel}</p>
      </div>

      {error && status === "error" && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {status === "not_calculated" && (
        <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700">Click below to calculate your official ATS score</p>
        </div>
      )}

      <button
        onClick={onCalculate}
        disabled={shouldDisableButton}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all ${
          shouldDisableButton
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
        }`}
      >
        {isLoading || status === "calculating" ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Calculating...
          </span>
        ) : (
          "Calculate Full ATS Score"
        )}
      </button>
    </div>
  );
}
