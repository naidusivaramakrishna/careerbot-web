"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Mic, MessageSquare, Users } from "lucide-react";
import { generateHrQuestions } from "@/api/mockInterviewApi";
import PracticeLandingPage from "../_components/PracticeLandingPage";

const STATS = [
  { value: "10", label: "questions" },
  { value: "2", label: "rounds" },
  { value: "AI", label: "feedback" },
  { value: "FIT", label: "focus" },
];

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: "Fit-first questions",
    body: "Prepare for strengths, weaknesses, motivation, teamwork, culture fit, salary readiness, and common situational prompts.",
  },
  {
    icon: Mic,
    title: "Speak naturally",
    body: "Practice answers aloud so your delivery feels confident, not memorized or overly rehearsed.",
  },
  {
    icon: MessageSquare,
    title: "Tone and clarity review",
  },
  {
    icon: BarChart2,
    title: "Round-based recall",
    body: "Start with your prepared notes, then move to keywords only for interview-like recall.",
];

const HR_QUESTIONS_KEY = "hr_generated_questions";

export default function HRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateHrQuestions(10);
      sessionStorage.setItem(HR_QUESTIONS_KEY, JSON.stringify(data));
      router.push("/notes/hr/practice");
    } catch {
      setError("Could not prepare HR questions. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PracticeLandingPage
      accent="hr"
      eyebrow="HR practice"
      title="Sound confident, self-aware, and easy to hire."
      subtitle="Prepare polished answers for HR screens and final-fit conversations without sounding scripted or generic."
      stats={STATS}
      steps={HOW_IT_WORKS}
      tips={TIPS}
      outcomes={[
        "Cleaner personal positioning",
        "More believable examples",
        "Calmer recruiter conversations",
      ]}
      ctaLabel="Start HR Practice"
      error={error}
      onStart={handleStart}
    />
  );
}
