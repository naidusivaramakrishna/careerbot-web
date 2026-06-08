"use client";
import React from "react";
import MultiColorCircularScore from "./MultiColorCircularScore";
import type { PreviewScoreResult } from "../../_lib/computePreviewScore";

interface PreviewScoreCardProps {
  previewScore: PreviewScoreResult;
}

export default function PreviewScoreCard({ previewScore }: PreviewScoreCardProps) {
  const topSuggestions = previewScore.suggestions.slice(0, 2);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-md border border-blue-100">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Preview Score</h2>
        <p className="text-xs text-gray-500 mt-1">Updates as you edit. Estimate only.</p>
      </div>

      <div className="flex flex-col items-center justify-center mb-6">
        <MultiColorCircularScore value={previewScore.score} />
        <p className="mt-3 text-sm font-medium text-gray-700 capitalize">
          {previewScore.band}
        </p>
      </div>

      {topSuggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Quick Tips</h3>
          {topSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`text-xs rounded px-3 py-2 ${
                suggestion.severity === "warning"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              <span className="font-medium">{suggestion.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
