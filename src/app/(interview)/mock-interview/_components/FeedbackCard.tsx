"use client";

import { useState } from "react";
import {
  TrendingUp, ThumbsUp, ThumbsDown, AlertTriangle, Mic, Clock, Zap, Pause,
  ChevronDown, ChevronUp, RotateCcw, Star,
} from "lucide-react";
import { rateAnswerFeedback } from "@/api/mockInterviewApi";

interface ScoreDimension { label: string; score: number; weight: string; }

export interface FeedbackCardProps {
  weightedScore: number;
  improvedAnswer: string;
  dimensions: ScoreDimension[];
  onTryAgain?: () => void;
  whatWasGood?: string[];
  whatToImprove?: string[];
  fillerWords?: { word: string; count: number }[];
  fillerTip?: string;
  answerDuration?: number;
  targetDurationMin?: number;
  targetDurationMax?: number;
  lengthNote?: string;
  speechRate?: number;
  pauseAnalysis?: string;
  encouragement?: string;
  attemptNumber?: number;
  feedback?: string;
  answerId?: string;
}

function ScoreBar({ score = 0 }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 7 ? "bg-[#2557a7]" : score >= 5 ? "bg-gray-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right tabular-nums">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function ScoreCircle({ score = 0 }: { score: number }) {
  const size = 80;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  const offset = circ * (1 - pct);
  const color = score >= 7 ? "#2557a7" : score >= 5 ? "#6b7280" : "#9ca3af";
  const label =
    score >= 8
      ? "Excellent"
      : score >= 6
      ? "Good"
      : score >= 4
      ? "Average"
      : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          className="transition-all duration-700"
        />
        <text x="40" y="38" textAnchor="middle" fontSize="16" fontWeight="800" fill={color}>
          {score.toFixed(1)}
        </text>
        <text x="40" y="52" textAnchor="middle" fontSize="7" fill="#6b7280">
          /10
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
          accent ? "bg-[#2557a7]/10" : "bg-gray-100"
        }`}
      >
        <Icon
          size={11}
          className={accent ? "text-[#2557a7]" : "text-gray-500"}
        />
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest ${
          accent ? "text-[#2557a7]" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function LengthBar({
  duration,
  min,
  max,
}: {
  duration: number;
  min: number;
  max: number;
}) {
  const hard = max * 1.8;
  const pct = Math.min((duration / hard) * 100, 100);
  const minPct = (min / hard) * 100;
  const maxPct = (max / hard) * 100;
  const color =
    duration < min ? "bg-gray-400" : duration <= max ? "bg-[#2557a7]" : "bg-gray-500";
  return (
    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
      <div
        className="absolute top-0 h-full bg-[#2557a7]/15"
        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
      />
      <div
        className={`absolute top-0 h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function FeedbackCard({
  weightedScore,
  improvedAnswer,
  dimensions,
  onTryAgain,
  whatWasGood,
  whatToImprove,
  fillerWords,
  fillerTip,
  answerDuration,
  targetDurationMin,
  targetDurationMax,
  lengthNote,
  speechRate,
  pauseAnalysis,
  encouragement,
  attemptNumber,
  feedback,
  answerId,
}: FeedbackCardProps) {
  const [showImproved, setShowImproved] = useState(false);
  const [ratingState, setRatingState] = useState<"idle" | "up" | "down">("idle");

  const handleRate = async (helpful: boolean) => {
    if (!answerId || ratingState !== "idle") return;
    setRatingState(helpful ? "up" : "down");
    rateAnswerFeedback({ answer_id: answerId, helpful }).catch(() => {
      setRatingState("idle");
    });
  };

  const goodPoints = whatWasGood ?? [];
  const improvePoints = whatToImprove ?? (feedback ? [feedback] : []);
  const totalFillers = fillerWords
    ? fillerWords.reduce((s, f) => s + f.count, 0)
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* ── Score header ── */}
      <div className="relative px-5 py-4 flex items-center justify-between overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#2557a7] to-[#5b8fd6]" />
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#2557a7]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-gray-900 font-bold text-sm tracking-tight">AI Feedback</p>
          <p className="text-gray-500 text-xs mt-0.5">
            Content · Clarity · Structure · Length
          </p>
          {attemptNumber && (
            <span className="inline-block mt-1.5 text-[10px] font-bold text-[#2557a7] bg-[#2557a7]/8 px-2 py-0.5 rounded-md tracking-wide">
              Attempt #{attemptNumber}
            </span>
          )}
          {answerId && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400 font-medium">Helpful?</span>
              <button
                onClick={() => handleRate(true)}
                aria-label="Mark feedback helpful"
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  ratingState === "up"
                    ? "bg-[#2557a7] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-[#2557a7]/10 hover:text-[#2557a7]"
                }`}
              >
                <ThumbsUp size={11} />
              </button>
              <button
                onClick={() => handleRate(false)}
                aria-label="Mark feedback not helpful"
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  ratingState === "down"
                    ? "bg-gray-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <ThumbsDown size={11} />
              </button>
            </div>
          )}
        </div>

        <div className="relative z-10">
          <ScoreCircle score={weightedScore} />
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Score breakdown ── */}
        <div>
          <SectionHeader icon={TrendingUp} label="Score Breakdown" />
          <div className="space-y-2.5">
            {dimensions.map(({ label, score, weight }) => (
              <div key={label}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{weight}</span>
                </div>
                <ScoreBar score={score} />
              </div>
            ))}
          </div>
        </div>

        {/* ── What was good ── */}
        {goodPoints.length > 0 && (
          <div className="bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl p-4">
            <SectionHeader icon={ThumbsUp} label="What Was Good" accent />
            <ul className="space-y-2">
              {goodPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug">
                  <div className="w-4 h-4 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#2557a7] text-[10px] font-black leading-none">✓</span>
                  </div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── What to improve ── */}
        {improvePoints.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <SectionHeader icon={AlertTriangle} label="What to Improve" />
            <ul className="space-y-2">
              {improvePoints.slice(0, 3).map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug">
                  <span className="text-gray-400 mt-0.5 shrink-0 text-xs font-bold">→</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Filler words ── */}
        {fillerWords && fillerWords.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <SectionHeader icon={Mic} label="Filler Words" />
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {fillerWords.map(({ word, count }) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold"
                >
                  &ldquo;{word}&rdquo;
                  <span className="bg-gray-100 text-gray-600 rounded-md px-1.5 py-0.5 text-[10px] font-black leading-none">
                    ×{count}
                  </span>
                </span>
              ))}
            </div>
            {totalFillers === 0 ? (
              <p className="text-xs text-[#2557a7] font-semibold">
                No filler words detected — great job!
              </p>
            ) : (
              <p className="text-xs text-gray-500 leading-relaxed">
                {fillerTip ?? "Try pausing silently instead of using filler words."}
              </p>
            )}
          </div>
        )}

        {/* ── Answer length ── */}
        {answerDuration !== undefined &&
          targetDurationMin !== undefined &&
          targetDurationMax !== undefined && (
            <div className="bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl p-4">
              <SectionHeader icon={Clock} label="Answer Length" accent />
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-gray-700 font-medium">
                  Your answer:{" "}
                  <strong className="text-gray-900">{answerDuration}s</strong>
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  Target: {targetDurationMin}–{targetDurationMax}s
                </span>
              </div>
              <LengthBar
                duration={answerDuration}
                min={targetDurationMin}
                max={targetDurationMax}
              />
              {lengthNote && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{lengthNote}</p>
              )}
              {!lengthNote && answerDuration < targetDurationMin && (
                <p className="text-xs text-[#2557a7] mt-2 font-medium">
                  Your answer is a bit short. Try adding a specific example.
                </p>
              )}
              {!lengthNote && answerDuration > targetDurationMax && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Slightly long — try trimming repetitive parts.
                </p>
              )}
            </div>
          )}

        {/* ── Speech rate ── */}
        {speechRate !== undefined && (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0">
                <Zap size={11} className="text-[#2557a7]" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Speech Rate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold ${
                  speechRate >= 100 && speechRate <= 150
                    ? "text-[#2557a7]"
                    : speechRate < 80
                    ? "text-gray-500"
                    : "text-gray-600"
                }`}
              >
                {speechRate} wpm
              </span>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                Ideal 100–150
              </span>
            </div>
          </div>
        )}

        {/* ── Pause analysis ── */}
        {pauseAnalysis && (
          <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <div className="w-5 h-5 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0 mt-0.5">
              <Pause size={11} className="text-[#2557a7]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Pause Analysis
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{pauseAnalysis}</p>
            </div>
          </div>
        )}

        {/* ── Improved version ── */}
        <div className="bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowImproved((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2557a7]/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0">
                <Star size={11} className="text-[#2557a7]" />
              </div>
              <span className="text-[10px] font-bold text-[#2557a7] uppercase tracking-widest">
                Show Improved Version
              </span>
            </div>
            {showImproved ? (
              <ChevronUp size={14} className="text-[#2557a7]" />
            ) : (
              <ChevronDown size={14} className="text-[#2557a7]" />
            )}
          </button>
          {showImproved && (
            <div className="px-4 pb-4 pt-1 border-t border-[#2557a7]/10">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                &ldquo;{improvedAnswer}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* ── Encouragement ── */}
        {encouragement && (
          <div className="flex items-start gap-3 bg-[#2557a7]/5 border border-[#2557a7]/15 rounded-xl px-4 py-3">
            <div className="w-5 h-5 bg-[#2557a7]/10 rounded-md flex items-center justify-center shrink-0 mt-0.5">
              <Star size={11} className="text-[#2557a7]" />
            </div>
            <p className="text-sm text-[#2557a7] leading-relaxed font-medium">{encouragement}</p>
          </div>
        )}

        {/* ── Try Again ── */}
        {onTryAgain && (
          <button
            onClick={onTryAgain}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            <RotateCcw size={14} className="text-gray-500" />
            Try Again
          </button>
        )}

      </div>
    </div>
  );
}
