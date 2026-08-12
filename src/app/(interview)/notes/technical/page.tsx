"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, Brain, MessageSquare, BarChart2, ChevronRight,
  Lightbulb, Sparkles, Loader2, AlertCircle,
} from "lucide-react";
import { generateMrTrQuestions } from "@/api/mockInterviewApi";

// ─── Static data ──────────────────────────────────────────────────────────────

const STATS = [
  { value: "10",  label: "Questions" },
  { value: "AI",  label: "Feedback" },
];

const HOW_IT_WORKS = [
  {
    icon: Brain,
    title: "Questions from your resume",
    body: "AI asks questions based on the skills and projects on your resume, combined with the most commonly asked technical interview questions.",
  },
  {
    icon: Mic,
    title: "Speak or type your answer",
    body: "Answer out loud to simulate a real interview. Text fallback is available if mic is unavailable.",
  },
  {
    icon: MessageSquare,
    title: "Get instant feedback",
    body: "AI reviews your answer for accuracy, clarity, and depth — with specific improvement tips.",
  },
  {
    icon: BarChart2,
    title: "Track your progress",
    body: "Scores and feedback are saved after every session so you can see improvement over time.",
  },
];

const TIPS = [
  "Think out loud — interviewers value your reasoning process, not just the final answer.",
  "Structure answers with a brief approach before diving into details.",
  "Mention edge cases and trade-offs — it separates good candidates from great ones.",
  "If you're stuck, say what you do know and work toward the answer — never go silent.",
  "Aim for 60–120 seconds per answer. Too short = shallow. Too long = unfocused.",
];

export const TECH_QUESTIONS_KEY = "tech_generated_questions";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TechnicalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const resumeId = localStorage.getItem("current_resume_id") ?? undefined;
      const data = await generateMrTrQuestions({
        mode: "TR",
        num_questions: 10,
        resume_id: resumeId,
        industry: "General",
        focus_areas: [],
        question_bank_gaps: [],
      });
      sessionStorage.setItem(TECH_QUESTIONS_KEY, JSON.stringify(data.questions));
      router.push("/notes/technical/practice");
    } catch {
      setError("Could not load questions. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-3">
          <Sparkles size={11} /> Technical Practice
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Technical Interview Prep</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
          AI-powered mock Q&amp;A on the topics that matter most in technical interviews.
          Practice answering out loud, get scored feedback, and build confidence for the real thing.
        </p>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <p className="text-xl font-black text-[#2557a7]">{s.value}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2557a7]/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-[#2557a7]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tips ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-[#2557a7]" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tips for Technical Interviews</p>
        </div>
        <ul className="space-y-2.5">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-[#2557a7]/10 text-[#2557a7] text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">{tip}</p>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle size={13} className="shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* ── CTA ── */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-3.5 bg-[#2557a7] text-white rounded-xl font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>Start Technical Practice <ChevronRight size={16} /></>
        )}
      </button>

    </div>
  );
}
