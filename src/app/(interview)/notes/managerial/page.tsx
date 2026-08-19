"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Mic, MessageSquare, Users } from "lucide-react";
import { generateMrTrQuestions } from "@/api/mockInterviewApi";
import PracticeLandingPage from "../_components/PracticeLandingPage";

// Not exported: see notes/technical/page.tsx. Nothing imports this -
// notes/managerial/practice declares the same literal locally.
const MANAGERIAL_QUESTIONS_KEY = "managerial_generated_questions";

const STATS = [
  { value: "10", label: "questions" },
  { value: "2", label: "rounds" },
  { value: "AI", label: "feedback" },
  { value: "STAR", label: "structure" },
];

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Leadership scenarios",
    body: "Prepare for stakeholder conflict, team ownership, decision-making under pressure, and cross-functional influence questions.",
  },
  {
    icon: Mic,
    title: "Speak the STAR frame",
    body: "Practice structuring answers aloud so situation, task, action, and result flow naturally without sounding rehearsed.",
  },
  {
    icon: MessageSquare,
    title: "Conciseness coaching",
    body: "AI feedback highlights when answers run too long or lack a clear outcome — keeping you within the 60–120 second sweet spot.",
  },
  {
    icon: BarChart2,
    title: "Round-based recall",
    body: "Start with full notes, then advance to keywords-only to build interview-level recall under realistic conditions.",
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
