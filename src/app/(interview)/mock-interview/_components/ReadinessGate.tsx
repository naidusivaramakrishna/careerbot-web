"use client";

import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

interface WeakQuestion {
  question_id: string;
  question_text: string;
  score: number;
}

interface ReadinessGateProps {
  isReady: boolean;
  avgScore: number;
  weakQuestions: WeakQuestion[];
  reasons?: string[];
  onPracticeMore: () => void;
}

export default function ReadinessGate({
  isReady,
  avgScore,
  weakQuestions,
  reasons = [],
  onPracticeMore,
}: ReadinessGateProps) {
  const router = useRouter();

  if (isReady) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="px-5 pt-5 pb-4 text-center">
            <div className="w-12 h-12 bg-[#2557a7]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-[#2557a7]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">You Are Ready!</h2>
            <p className="text-xs text-gray-500 mt-1">Average score: {avgScore.toFixed(1)}/10</p>
          </div>

          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={() => router.push("/mock-interview/live")}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-lg font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-sm"
            >
              Start Live Interview <ArrowRight size={14} />
            </button>
            <button
              onClick={onPracticeMore}
              className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> Practice More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="px-5 pt-5 pb-4 text-center border-b border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Not Ready Yet</h2>
          <p className="text-xs text-gray-500 mt-1">Score: {avgScore.toFixed(1)}/10 (need 6.0)</p>
        </div>

        <div className="px-5 py-4">
          {reasons.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {reasons.map((r) => (
                <div key={r} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <AlertCircle size={12} className="shrink-0 mt-0.5 text-[#2557a7]" />
                  {r}
                </div>
              ))}
            </div>
          )}

          {weakQuestions.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <TrendingUp size={10} /> Improve
              </p>
              {weakQuestions.map((q) => (
                <div key={q.question_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-xs text-gray-600 flex-1 mr-2">{q.question_text}</p>
                  <span className={`text-xs font-semibold tabular-nums shrink-0 ${
                    q.score < 4 ? "text-gray-500" : "text-[#2557a7]"
                  }`}>
                    {q.score.toFixed(1)}/10
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onPracticeMore}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-lg font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-sm"
          >
            <RotateCcw size={13} /> Practice Weak Questions
          </button>
        </div>
      </div>
    </div>
  );
}
