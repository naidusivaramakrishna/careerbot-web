"use client";

import { CheckCircle2, Clock, Code2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CRITERION_ORDER } from "@/app/coding-test/_lib/types";
import type { GradingResult } from "@/app/coding-test/_lib/types";

const CRITERION_LABEL: Record<string, string> = {
  correctness: "Correctness",
  efficiency: "Efficiency",
  code_quality: "Code Quality",
  edge_cases: "Edge Cases",
};

const LANG_LABEL: Record<string, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
};

function barColor(pct: number) {
  if (pct >= 75) return "bg-[#2557a7]";
  if (pct >= 50) return "bg-gray-400";
  return "bg-gray-300";
}

function scoreText(pct: number) {
  if (pct >= 70) return "text-[#2557a7]";
  if (pct >= 50) return "text-gray-600";
  return "text-gray-400";
}

function scoreLabel(pct: number) {
  if (pct >= 80) return "Excellent";
  if (pct >= 70) return "Great";
  if (pct >= 60) return "Good";
  if (pct >= 50) return "Average";
  return "Needs Work";
}

export interface CodingFollowupAnswer {
  attempt_number: number;
  follow_up_question: string;
  score: number;
  max_score: number;
}

export interface CodingRoundData {
  problem_slug: string;
  problem_title: string;
  language: string;
  score: number | null;
  grading_result: GradingResult | null;
  time_taken_s: number;
  followup_answers?: CodingFollowupAnswer[];
}

export function CodingPerformanceSection({ data }: { data: CodingRoundData }) {
  const [expandedFollowup, setExpandedFollowup] = useState<number | null>(null);
  const pct = data.score ?? 0;
  const mins = Math.floor(data.time_taken_s / 60);
  const secs = data.time_taken_s % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const avgFollowupScore = data.followup_answers && data.followup_answers.length > 0
    ? data.followup_answers.reduce((sum, a) => sum + a.score, 0) / data.followup_answers.length
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-5 mb-5">
      {/* Header */}
      <p className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Code2 size={14} className="text-[#2557a7]" />
        Coding Round
      </p>

      {/* Summary row */}
      <div className="flex flex-wrap items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-mono mb-0.5">{data.problem_slug}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{data.problem_title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
              {LANG_LABEL[data.language] ?? data.language}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {timeStr}
            </span>
          </div>
        </div>

        {data.score !== null ? (
          <div className="text-right shrink-0">
            <div className={`text-3xl font-black tabular-nums ${scoreText(pct)}`}>
              {Math.round(pct)}
            </div>
            <div className="text-xs text-gray-400">/ 100</div>
            <div className={`text-xs font-bold mt-0.5 ${scoreText(pct)}`}>
              {scoreLabel(pct)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
            <AlertCircle size={12} />
            Not graded
          </div>
        )}
      </div>

      {/* Criteria breakdown */}
      {data.grading_result?.breakdown && (
        <div className="space-y-2 mb-4">
          {CRITERION_ORDER.map((key) => {
            const c = data.grading_result!.breakdown[key];
            if (!c) return null;
            const weight =
              Number.isFinite(c.weight) && c.weight > 0 ? Math.round(c.weight) : 0;
            const raw = Number.isFinite(c.score) ? Math.round(c.score) : 0;
            const s = weight > 0 ? Math.min(weight, Math.max(0, raw)) : 0;
            const p = weight > 0 ? Math.round((s / weight) * 100) : 0;

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">
                  {CRITERION_LABEL[key] ?? key}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(p)}`}
                    style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-10 text-right shrink-0">
                  {s}/{weight}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* AI summary */}
      {data.grading_result?.summary && (
        <p className="text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3 mb-3">
          {data.grading_result.summary}
        </p>
      )}

      {/* Follow-up answers section */}
      {data.followup_answers && data.followup_answers.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
            <span>Follow-up Attempts ({data.followup_answers.length})</span>
            {avgFollowupScore > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 ${scoreText(avgFollowupScore)}`}>
                Avg: {Math.round(avgFollowupScore)}
              </span>
            )}
          </p>
          <div className="space-y-1.5">
            {data.followup_answers.map((answer) => (
              <div key={answer.attempt_number} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFollowup(expandedFollowup === answer.attempt_number ? null : answer.attempt_number)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-xs font-semibold text-gray-500 w-6 shrink-0">#{answer.attempt_number}</span>
                  <span className="flex-1 text-xs text-gray-600 truncate">{answer.follow_up_question}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${scoreText(answer.score)} shrink-0`}>
                    {Math.round(answer.score)}/{answer.max_score}
                  </span>
                  {expandedFollowup === answer.attempt_number ? (
                    <ChevronUp size={12} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={12} className="text-gray-400" />
                  )}
                </button>
                {expandedFollowup === answer.attempt_number && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
                    <p className="text-gray-700 font-medium mb-1">Question:</p>
                    <p className="text-gray-600 mb-2">{answer.follow_up_question}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-500">Score</span>
                      <span className={`font-semibold ${scoreText(answer.score)}`}>
                        {Math.round(answer.score)}/{answer.max_score}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {data.grading_result?.suggestions && data.grading_result.suggestions.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-gray-100 pt-3">
          {data.grading_result.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <CheckCircle2 size={11} className="text-[#2557a7] mt-0.5 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
