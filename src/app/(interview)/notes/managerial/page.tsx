"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Mic, MessageSquare, Users } from "lucide-react";
import { generateMrTrQuestions } from "@/api/mockInterviewApi";
import PracticeLandingPage from "../_components/PracticeLandingPage";

export const MANAGERIAL_QUESTIONS_KEY = "managerial_generated_questions";

const STATS = [
  { value: "10", label: "questions" },
  { value: "2", label: "rounds" },
  { value: "AI", label: "feedback" },
  { value: "STAR", label: "structure" },
];

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Role-aware prompts",
    body: "Practice leadership, ownership, conflict, ambiguity, and decision-making questions tailored to your background.",
  },
  {
    icon: Mic,
    title: "Answer out loud",
    body: "Simulate the pressure of a panel interview while keeping your prepared scripts nearby in round one.",
  },
  {
    icon: MessageSquare,
    title: "Feedback that is specific",
    body: "Get concrete coaching on clarity, evidence, structure, and whether your example sounds senior enough.",
  },
  {
    icon: BarChart2,
    title: "Reduce the safety net",
    body: "Round two moves from full notes to key cues so your best stories become natural and recallable.",
  },
];

const TIPS = [
  "Lead with the business context before describing your actions.",
  "Use measurable outcomes whenever possible.",
  "Show the trade-off you considered, not only the decision you made.",
  "Make your learning explicit in conflict or failure stories.",
  "Keep each answer tight: 60 to 120 seconds is the sweet spot.",
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
      sessionStorage.setItem(MANAGERIAL_QUESTIONS_KEY, JSON.stringify(data));
      router.push("/notes/managerial/practice");
    } catch {
      setError("Could not prepare managerial questions. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PracticeLandingPage
      accent="managerial"
      eyebrow="Managerial practice"
      title="Practice the leadership stories interviewers actually score."
      subtitle="Turn experience into crisp, senior-sounding answers for stakeholder conflict, ownership, decision-making, and team leadership questions."
      stats={STATS}
      steps={HOW_IT_WORKS}
      tips={TIPS}
      outcomes={[
        "Sharper STAR storytelling",
        "Stronger executive presence",
        "Better recall under pressure",
      ]}
      ctaLabel="Start Managerial Practice"
      loading={loading}
      error={error}
      onStart={handleStart}
    />
  );
}
