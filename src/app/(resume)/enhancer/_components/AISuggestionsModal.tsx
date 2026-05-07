"use client";

import React, { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import type { Improvement } from "@/api/enhancerApi";

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  improvements: Improvement[];
  onAcceptSuggestion: (improvementId: string, newText: string) => void;
  onIgnoreSuggestion: (improvementId: string) => void;
  onContinueToExport: () => void;
}

export default function AISuggestionsModal({
  isOpen,
  onClose,
  improvements,
  onAcceptSuggestion,
  onIgnoreSuggestion,
  onContinueToExport,
}: AISuggestionsModalProps) {
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<Set<string>>(
    new Set()
  );

  if (!isOpen) return null;

  // Filter out low-impact suggestions and format them
  const actionableSuggestions = improvements
    .filter(
      (imp) =>
        imp.impact === "high" || imp.impact === "medium"
    )
    .slice(0, 5); // Show top 5 suggestions

  const handleAccept = (improvement: Improvement) => {
    setAcceptedSuggestions((prev) => new Set([...prev, improvement.id]));
    onAcceptSuggestion(improvement.id, improvement.after || "");
  };

  const handleIgnore = (improvement: Improvement) => {
    setIgnoredSuggestions((prev) => new Set([...prev, improvement.id]));
    onIgnoreSuggestion(improvement.id);
  };

  const isProcessed = (id: string) =>
    acceptedSuggestions.has(id) || ignoredSuggestions.has(id);

  // Get icon color based on impact
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-2">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI Suggestions
              </h2>
              <p className="text-sm text-gray-500">
                Review and apply AI-powered improvements
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {actionableSuggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Suggestions Available
              </h3>
              <p className="text-gray-500">
                Your resume looks great! No major improvements needed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actionableSuggestions.map((improvement, index) => {
                const processed = isProcessed(improvement.id);
                const accepted = acceptedSuggestions.has(improvement.id);

                return (
                  <div
                    key={improvement.id}
                    className={`bg-gray-50 rounded-2xl p-6 transition-all duration-300 ${
                      processed
                        ? accepted
                          ? "bg-green-50 border-2 border-green-200"
                          : "bg-gray-100 opacity-60"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {/* Suggestion Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex-shrink-0 mt-0.5 ${getImpactColor(
                            improvement.impact
                          )}`}
                        >
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {improvement.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {improvement.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Before/After */}
                    {improvement.before && improvement.after && (
                      <div className="mt-4 space-y-3">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-red-700 mb-1">
                            Before:
                          </p>
                          <p className="text-sm text-gray-700 line-through">
                            {improvement.before}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-700 mb-1">
                            After:
                          </p>
                          <p className="text-sm text-gray-900 font-medium">
                            {improvement.after}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!processed && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleIgnore(improvement)}
                          className="flex-1 px-4 py-2.5 bg-white text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all border border-gray-200"
                        >
                          <X className="w-4 h-4 inline-block mr-1.5" />
                          Ignore
                        </button>
                        <button
                          onClick={() => handleAccept(improvement)}
                          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-all"
                        >
                          <Check className="w-4 h-4 inline-block mr-1.5" />
                          Accept
                        </button>
                      </div>
                    )}

                    {/* Status Badge */}
                    {processed && (
                      <div className="mt-4">
                        {accepted ? (
                          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                            <div className="bg-green-600 rounded-full p-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            Applied
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                            <div className="bg-gray-400 rounded-full p-0.5">
                              <X className="w-3 h-3 text-white" />
                            </div>
                            Ignored
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {acceptedSuggestions.size} of {actionableSuggestions.length}{" "}
              suggestions applied
            </p>
            <p className="text-sm font-medium text-indigo-600">
              +{Array.from(acceptedSuggestions).reduce((sum, id) => {
                const imp = improvements.find((i) => i.id === id);
                return sum + (imp?.impact_points || 0);
              }, 0)}{" "}
              points
            </p>
          </div>
          <button
            onClick={onContinueToExport}
            className="w-full px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Continue to Export
          </button>
        </div>
      </div>
    </div>
  );
}
