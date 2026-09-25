"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Brain, Mic, MessageSquare } from "lucide-react";
import { generateMrTrQuestions } from "@/api/interviewPrepApi";
import PracticeLandingPage from "../_components/PracticeLandingPage";

const STATS = [
  { value: "10", label: "questions" },
  { value: "90s", label: "target" },
  { value: "AI", label: "feedback" },
  { value: "DEPTH", label: "focus" },
];

const HOW_IT_WORKS = [
  {
    icon: Brain,
    title: "Resume-aware topics",
    body: "Questions are generated from your skills and projects, with room for DSA, web, backend, database, and core concepts.",
  },
  {
    icon: Mic,
    title: "Explain your reasoning",
    body: "Practice verbal technical communication: approach, constraints, trade-offs, edge cases, and final answer.",
  },
  {
    icon: MessageSquare,
    title: "Depth feedback",
    body: "Get coaching on correctness, clarity, completeness, and whether your explanation sounds interview-ready.",
  },
  {
    icon: BarChart2,
    title: "Track precision",
    body: "Move through focused prompts and review how often your answers hit the expected key points.",
  },
];

const TIPS = [
  "Start with the approach before jumping into implementation details.",
  "Name assumptions and edge cases explicitly.",
  "Explain trade-offs in performance, complexity, and maintainability.",
  "If stuck, narrate what you know and narrow the problem.",
  "Keep answers structured: problem, approach, detail, verification.",
];

// Not exported: a Next.js App Router page file may only export the default
// component and framework-recognised names, and an extra export fails the
// generated route type. Nothing imports this - notes/technical/practice
// declares the same literal locally.
const TECH_QUESTIONS_KEY = "tech_generated_questions";

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
      sessionStorage.setItem(TECH_QUESTIONS_KEY, JSON.stringify(data));
      router.push("/notes/technical/practice");
    } catch {
      setError("Could not prepare technical questions. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PracticeLandingPage
      accent="technical"
      eyebrow="Technical practice"
      title="Explain technical answers with precision and confidence."
      subtitle="Practice the kind of spoken technical reasoning interviewers expect: clear approach, constraints, trade-offs, edge cases, and concise conclusions."
      stats={STATS}
      steps={HOW_IT_WORKS}
      tips={TIPS}
      outcomes={[
        "Sharper technical communication",
        "Better edge-case coverage",
        "Cleaner reasoning under pressure",
      ]}
      ctaLabel="Start Technical Practice"
      loading={loading}
      error={error}
      onStart={handleStart}
    />
  );
}
