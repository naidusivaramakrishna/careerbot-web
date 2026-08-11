"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, Users, MessageSquare, BarChart2, ChevronRight,
  Lightbulb, Sparkles, Loader2, AlertCircle,
} from "lucide-react";
import { generateMrTrQuestions } from "@/api/mockInterviewApi";

export const MANAGERIAL_QUESTIONS_KEY = "managerial_generated_questions";

const STATS = [
  { value: "10", label: "Questions" },
  { value: "AI", label: "Feedback" },
];

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Questions from your profile",
    body: "AI asks behavioural and situational questions tailored to your background — covering leadership, teamwork, conflict resolution, and decision-making.",
  },
  {
    icon: Mic,
    title: "Speak your answer",
    body: "Answer out loud to simulate a real interview. Your prepared scripts are shown in round 1 to guide your response.",
  },
  {
    icon: MessageSquare,
    title: "Get instant feedback",
    body: "AI reviews your answer for content, clarity, and structure — with specific tips to make it more compelling.",
  },
  {
    icon: BarChart2,
    title: "Two-round practice",
    body: "Round 1 shows your prepared notes. Round 2 gives keywords only — building recall and confidence without the safety net.",
  },
];

const TIPS = [
  "Use the STAR method (Situation, Task, Action, Result) for behavioural questions.",
  "Be specific — vague answers like \"I handled it well\" don't stand out. Use real examples with measurable outcomes.",
  "Prepare 3–4 strong stories from past experience that can flex to cover multiple question types.",
  "Show self-awareness — acknowledge challenges and what you learned, not just what went right.",
  "Aim for 60–120 seconds per answer. Practise until your stories feel natural, not scripted.",
];

export default function ManagerialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const resumeId = localStorage.getItem("current_resume_id") ?? undefined;
      const data = await generateMrTrQuestions({
        mode: "MR",
        num_questions: 10,
        resume_id: resumeId,
        industry: "General",
        focus_areas: [],
        question_bank_gaps: [],
      });
      sessionStorage.setItem(MANAGERIAL_QUESTIONS_KEY, JSON.stringify(data.questions));
      router.push("/notes/managerial/practice");
    } catch {
      setError("Could not load questions. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2557a7]/10 text-[#2557a7] rounded-full text-xs font-semibold mb-3">
          <Sparkles size={11} /> Managerial Practice
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Managerial Interview Prep</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
          Practise the behavioural and situational questions that managers and panel interviewers rely on.
          Answer out loud, get AI-scored feedback, and build the confidence to tell your story well.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <p className="text-xl font-black text-[#2557a7]">{s.value}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

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

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-[#2557a7]" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tips for Managerial Interviews</p>
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

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-3.5 bg-[#2557a7] text-white rounded-xl font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>Start Managerial Practice <ChevronRight size={16} /></>
        )}
      </button>

    </div>
  );
}
