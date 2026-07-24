"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FileText, BookOpen, Mic, Video, Sparkles, History,
  ArrowRight, ChevronDown, ChevronRight, Zap, BarChart3,
  Award, Brain, Star, MessageCircle, ShieldCheck, Clock,
  TrendingUp, Users, Trophy,
} from "lucide-react";

// ─── Static Data ─────────────────────────────────────────────────────────────

const stages = [
  {
    number: "01",
    badge: "Optional Prep",
    icon: FileText,
    title: "Generate Interview Notes",
    description:
      "Want to warm up first? Use Interview Prep to create personalised scripts for your self-intro, project walkthroughs, and HR answers.",
    time: "~15 min",
    highlight: "Personalised to your resume",
    color: "#2557a7",
    bg: "#eef4ff",
  },
  {
    number: "02",
    badge: "Optional Prep",
    icon: BookOpen,
    title: "English Essentials",
    description:
      "Review interview phrases, professional filler replacements, and common mistakes before your live mock if you want extra polish.",
    time: "5–10 min",
    highlight: "Instant confidence boost",
    color: "#7c3aed",
    bg: "#f3eeff",
  },
  {
    number: "03",
    badge: "Optional Prep",
    icon: Mic,
    title: "Practice Your Answers",
    description:
      "Run guided practice rounds separately, then return to the live mock interview whenever you feel ready.",
    time: "~30 min",
    highlight: "Optional guided warm-up",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    number: "04",
    badge: "Start Anytime",
    icon: Video,
    title: "Live Mock Interview",
    description:
      "Start directly with a full AI-powered voice interview: spoken questions, real-time transcription, scoring, and a detailed report.",
    time: "~20 min",
    highlight: "Start whenever you are ready",
    color: "#059669",
    bg: "#ecfdf5",
  },
];

const stats = [
  { icon: Users,     value: "50,000+", label: "Candidates Prepared",     color: "#2557a7", bg: "#eef4ff" },
  { icon: Trophy,    value: "10,000+", label: "Mock Interviews Done",     color: "#7c3aed", bg: "#f3eeff" },
  { icon: Star,      value: "4.8 / 5", label: "Average User Rating",     color: "#f59e0b", bg: "#fffbeb" },
  { icon: TrendingUp, value: "85%",    label: "Reported Score Improvement", color: "#059669", bg: "#ecfdf5" },
];

const features = [
  {
    icon: Brain,
    badge: "AI Voice",
    title: "Real AI Interviewer",
    description:
      "Our AI speaks your questions aloud — just like a real interviewer. You respond naturally, training your brain to think and speak under pressure.",
    points: ["AI speaks each question aloud", "Real-time voice detection", "Simulates actual interview pressure"],
    iconBg: "#EEF4FF", iconColor: "#2557a7", checkColor: "#2557a7", checkBg: "#EEF4FF",
  },
  {
    icon: BarChart3,
    badge: "Live Scoring",
    title: "Instant Answer Scoring",
    description:
      "Every answer is scored on 4 dimensions: Content, Clarity, Structure, and Length. See exactly where you're strong and where to improve.",
    points: ["4-dimension scoring breakdown", "Real-time feedback per answer", "Track improvement over rounds"],
    iconBg: "#F3EEFF", iconColor: "#7c3aed", checkColor: "#7c3aed", checkBg: "#F3EEFF",
  },
  {
    icon: Award,
    badge: "Full Report",
    title: "Detailed Interview Report",
    description:
      "Get a full performance report after every mock session — overall score, per-question breakdown, feedback, and an AI-generated improvement plan.",
    points: ["Full session performance report", "Per-question transcripts & scores", "AI-generated action plan"],
    iconBg: "#ECFDF5", iconColor: "#059669", checkColor: "#059669", checkBg: "#ECFDF5",
  },
];

const faqs = [
  {
    question: "Do I need to practice before the live mock interview?",
    answer:
      "No. The live mock interview is available directly. Notes, English Essentials, HR practice, and technical practice are separate preparation tools you can use before or after a mock session.",
  },
  {
    question: "How does the AI voice interview work?",
    answer:
      "The AI interviewer speaks each question aloud. You respond by speaking into your microphone. Your answer is transcribed, scored on 4 dimensions, and you get instant feedback before the next question.",
  },
  {
    question: "How many questions are in the live interview?",
    answer:
      "The live session has 6–10 questions depending on the session type. You get 2 minutes per question. The AI may ask follow-up questions based on your answers.",
  },
  {
    question: "Can I practice multiple times?",
    answer:
      "Yes. You can do as many practice rounds as you need. Your scores are tracked and you can see improvement over time in your progress stats.",
  },
  {
    question: "Is a microphone and camera required?",
    answer:
      "Microphone is required for all practice and live sessions. Camera is required for the live mock interview to simulate a real video interview environment.",
  },
];

// ─── Interview Browser Mockup ─────────────────────────────────────────────────

const WAVE_HEIGHTS = [12, 22, 18, 28, 16, 24, 20, 14, 26, 18, 22, 16, 24, 20];

function InterviewMockup() {
  const [phase, setPhase] = useState<"question" | "speaking" | "score">("question");

  useEffect(() => {
    const cycle: Array<"question" | "speaking" | "score"> = ["question", "speaking", "score"];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % cycle.length;
      setPhase(cycle[i]);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full" style={{ maxWidth: 440 }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(37,87,167,0.10) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      <div
        className="relative rounded-2xl overflow-hidden bg-white"
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.12)" }}
      >
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="flex-1 mx-3 h-6 bg-white border border-slate-200 rounded flex items-center px-3">
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">
              app.careerbot.ai/mock-interview/live
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-3" style={{ minHeight: 360 }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-[#2557a7] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected · Session: c2b138e
            </span>
            <span className="text-[11px] text-slate-400 font-medium">HR Interview · Q1/6</span>
          </div>

          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2557a7] rounded-full" style={{ width: "16%" }} />
          </div>

          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {phase === "question" && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full border-4 border-[#2557a7] bg-[#eef4ff] flex items-center justify-center">
                    <Video size={22} className="text-[#2557a7]" />
                  </div>
                  <p className="text-[11px] font-bold text-[#2557a7] uppercase tracking-wider">AI is speaking</p>
                  <div className="flex items-end gap-0.5 h-7">
                    {WAVE_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#2557a7] rounded-full opacity-70"
                        style={{
                          height: `${h}px`,
                          animation: `mockWave ${0.55 + i * 0.04}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="bg-[#eef4ff] border border-[#dde8f8] rounded-xl px-4 py-2.5 w-full text-center">
                    <p className="text-[10px] text-slate-400 mb-1">Question 1 of 6</p>
                    <p className="text-[12px] font-semibold text-slate-800 leading-snug">
                      Tell me about yourself and your experience.
                    </p>
                  </div>
                </motion.div>
              )}

              {phase === "speaking" && (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col gap-3"
                >
                  <div className="flex flex-col items-center pt-1 pb-1 gap-1.5">
                    <div className="relative flex items-center justify-center w-12 h-12">
                      <div className="absolute w-12 h-12 rounded-full bg-[#2557a7] opacity-20 animate-ping" />
                      <div className="w-9 h-9 rounded-full bg-[#2557a7] flex items-center justify-center">
                        <Mic size={15} className="text-white" />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-[#2557a7] uppercase tracking-wider">Your turn to speak</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1">
                    <p className="text-[10px] text-slate-400 mb-1.5 font-medium">Live Transcript</p>
                    <p className="text-[12px] text-slate-700 leading-relaxed">
                      I am a frontend developer with 3 years of experience in React and TypeScript
                      <span className="inline-block w-0.5 h-3.5 bg-[#2557a7] ml-0.5 animate-pulse align-middle" />
                    </p>
                  </div>
                  <button className="w-full py-2 bg-[#2557a7] text-white rounded-xl text-[12px] font-bold">
                    Done Speaking →
                  </button>
                </motion.div>
              )}

              {phase === "score" && (
                <motion.div
                  key="score"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col gap-2.5"
                >
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Answer Scored
                  </p>
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center bg-[#eef4ff] border border-[#dde8f8] rounded-2xl px-10 py-2.5">
                      <span className="text-4xl font-black text-[#2557a7]">8.5</span>
                      <span className="text-[11px] text-slate-400">/10</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[["Content", "9"], ["Clarity", "8"], ["Structure", "8"], ["Length", "9"]].map(([label, score]) => (
                      <div key={label} className="bg-white border border-slate-100 rounded-lg px-3 py-1.5">
                        <p className="text-[10px] text-slate-400">{label}</p>
                        <p className="text-[13px] font-bold text-slate-800">{score}/10</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#eef4ff] border border-[#dde8f8] rounded-xl px-3 py-2">
                    <p className="text-[11px] text-[#2557a7] font-semibold">
                      ✓ Good structure. Add specific metrics next time.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {(["question", "speaking", "score"] as const).map((p) => (
          <div
            key={p}
            className="rounded-full transition-all duration-300"
            style={{
              width: phase === p ? 20 : 6,
              height: 6,
              background: phase === p ? "#2557a7" : "#cbd5e1",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes mockWave {
          from { transform: scaleY(0.35); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MockInterviewPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-14 lg:py-20"
        style={{ background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 48%, #eaf7f5 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(37,87,167,0.04) 0%, transparent 65%)" }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 lg:gap-14 items-center">

            <motion.div
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 24 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-white border border-[#2557a7]/15 text-[#2557a7] text-[11px] font-bold px-4 py-2 rounded-full w-fit shadow-sm">
                <Sparkles size={12} />
                AI-POWERED MOCK INTERVIEW
              </div>

              <h1
                className="font-extrabold leading-[1.1] tracking-tight"
                style={{ fontSize: "clamp(1.9rem, 4vw, 3.1rem)" }}
              >
                <span className="text-[#0f172a]">Walk Into Your Interview.</span>
                <br />
                <span
                  style={{
                    background: "linear-gradient(to right, #2557a7, #0f766e)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Walk Out With the Offer.
                </span>
              </h1>

              <p className="text-base text-slate-500 leading-relaxed max-w-lg">
                Start a live AI voice mock interview directly, or warm up first with separate preparation tools for notes, English, HR practice, and technical practice.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push("/mock-interview/live")}
                  className="inline-flex items-center gap-2 bg-[#2557a7] hover:bg-[#1a3a8f] text-white font-bold px-7 py-3.5 rounded-full text-sm shadow-[0_4px_20px_rgba(37,87,167,0.30)] hover:shadow-[0_8px_28px_rgba(37,87,167,0.42)] hover:scale-[1.03] active:scale-100 transition-all duration-300"
                >
                  Start Live Interview <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => router.push("/mock-interview/history")}
                  className="inline-flex items-center gap-2 text-[#2557a7] font-semibold text-sm px-5 py-3.5 rounded-full border border-[#c7d9f5] hover:bg-[#eef4ff] hover:border-[#2557a7] transition-all duration-200"
                >
                  <History size={13} /> View History
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                  ))}
                  <span className="text-slate-500 text-sm ml-2">
                    Trusted by <span className="font-semibold text-[#0f172a]">50,000+</span> users
                  </span>
                </div>
                <span className="hidden sm:block w-px h-4 bg-slate-200" />
                {[["10K+", "Interviews"], ["4.8/5", "Rating"], ["85%", "Score Lift"]].map(([val, label], i) => (
                  <span key={label} className="flex items-center gap-1 text-sm text-slate-500">
                    {i > 0 && <span className="text-slate-200 mr-1">•</span>}
                    <span className="font-bold text-[#0f172a]">{val}</span>
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 28 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <InterviewMockup />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS - live interview with optional prep
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-14 lg:py-20 bg-white" style={{ borderTop: "1px solid #e8edf5" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55 }}
          >
            <span className="inline-block text-[11px] font-bold text-[#2557a7] uppercase tracking-widest bg-[#eef4ff] border border-[#dde8f8] px-4 py-1.5 rounded-full mb-5">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight tracking-tight text-[#0f172a]">
              Start Live. Practice Optional.<br />Land the Job.
            </h2>
            <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
              Jump into the mock interview now, or use preparation tools first if you want a calmer warm-up.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stages.map(({ number, badge, icon: Icon, title, description, time, highlight, color, bg }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="group relative bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-6 overflow-hidden transition-all duration-300"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                {/* Ghost number */}
                <span
                  className="absolute -bottom-4 right-2 text-[110px] font-black leading-none select-none pointer-events-none"
                  style={{ color: `${color}08` }}
                >
                  {number}
                </span>

                {/* Top accent */}
                <div className="h-0.5 w-12 rounded-full mb-5" style={{ background: color }} />

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-shadow duration-300 group-hover:shadow-lg"
                    style={{ background: bg, boxShadow: `0 4px 14px ${color}20` }}
                  >
                    <Icon size={22} style={{ color }} strokeWidth={1.8} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-[15px] font-black text-[#0f172a] leading-snug tracking-tight">
                        {title}
                      </h3>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: bg, color }}
                      >
                        {badge}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                      {description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span
                        className="text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{ background: bg, color }}
                      >
                        ✦ {highlight}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock size={10} /> {time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Flow connector CTA */}
          <motion.div
            className="flex justify-center mt-10"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => router.push("/mock-interview/live")}
              className="inline-flex items-center gap-2 text-[#2557a7] font-bold text-sm px-6 py-3 rounded-full border-2 border-[#2557a7]/20 hover:border-[#2557a7] hover:bg-[#eef4ff] transition-all duration-200"
            >
              Start Live Mock Interview <ChevronRight size={14} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SOCIAL PROOF STATS BAND
      ════════════════════════════════════════════════════════════════ */}
      <section
        className="py-12 lg:py-16"
        style={{ background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 50%, #eaf7f5 100%)", borderTop: "1px solid #e8edf5" }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-bold text-[#2557a7] uppercase tracking-widest">By the numbers</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ icon: Icon, value, label, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex flex-col items-center text-center bg-white border border-slate-100 rounded-2xl px-4 py-6 shadow-sm"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: bg }}
                >
                  <Icon size={22} style={{ color }} strokeWidth={1.8} />
                </div>
                <p className="text-2xl font-black text-[#0f172a] mb-1">{value}</p>
                <p className="text-[12px] text-slate-500 font-medium leading-snug">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════ */}
      <section
        className="relative py-14 lg:py-20 overflow-hidden"
        style={{ background: "#ffffff", borderTop: "1px solid #e8edf5" }}
      >
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55 }}
          >
            <span className="inline-block text-[11px] font-bold text-[#2557a7] uppercase tracking-widest bg-[#eef4ff] border border-[#dde8f8] px-4 py-1.5 rounded-full mb-5">
              What You Get
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight tracking-tight text-[#0f172a]">
              Everything You Need to<br />Walk In Confident
            </h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
              Three core capabilities that transform nervous candidates into confident interviewees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, badge, title, description, points, iconBg, iconColor, checkColor, checkBg }, i) => (
              <motion.div
                key={title}
                className="relative group"
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div
                  className="relative bg-white rounded-2xl flex flex-col h-full border border-slate-100 group-hover:border-slate-200 group-hover:shadow-lg transition-all duration-300 overflow-hidden p-7"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex flex-col items-center text-center mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: iconBg }}
                    >
                      <Icon style={{ width: 28, height: 28, color: iconColor }} strokeWidth={1.6} />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
                      style={{ background: iconBg, color: iconColor }}
                    >
                      {badge}
                    </span>
                    <h3 className="text-[19px] font-black text-[#0f172a] leading-snug tracking-tight">
                      {title}
                    </h3>
                  </div>
                  <p className="text-[13.5px] text-slate-500 leading-relaxed text-center mb-6">
                    {description}
                  </p>
                  <div className="border-t border-slate-100 mb-5" />
                  <ul className="flex flex-col gap-3 flex-1">
                    {points.map((point) => (
                      <li key={point} className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: checkBg }}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke={checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-[13px] text-slate-600 font-medium">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 md:py-24" style={{ borderTop: "1px solid #e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-12 lg:gap-20">

            <div className="lg:sticky lg:top-24 lg:self-start">
              <span className="inline-block px-4 py-1.5 bg-[#eef4ff] text-[#2557a7] rounded-full text-[11px] font-bold mb-5 uppercase tracking-widest">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-black leading-tight mb-4">
                Frequently Asked{" "}
                <span className="text-[#2557a7]">Questions</span>
              </h2>
              <p className="text-base text-slate-500 leading-relaxed mb-8">
                Everything you need to know about CareerBot&apos;s AI Mock Interview system.
              </p>
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 text-[#2557a7]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black mb-0.5">Still have questions?</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Our team typically responds within 24 hours.</p>
                  </div>
                </div>
                <a
                  href="mailto:support@careerbot.ai"
                  className="block w-full text-center px-5 py-2.5 bg-[#2557a7] hover:bg-[#1e4a96] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>

            <div>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`border-b border-slate-100 ${idx === 0 ? "border-t" : ""}`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`text-[15px] font-semibold leading-snug transition-colors duration-200 ${
                          isOpen ? "text-[#2557a7]" : "text-black group-hover:text-[#2557a7]"
                        }`}
                      >
                        {faq.question}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen
                            ? "bg-[#2557a7] border-[#2557a7] rotate-180"
                            : "border-slate-200 group-hover:border-[#2557a7]"
                        }`}
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-colors duration-200 ${
                            isOpen ? "text-white" : "text-slate-400 group-hover:text-[#2557a7]"
                          }`}
                        />
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-60 opacity-100 pb-5" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-[14px] text-slate-500 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA BAND
      ════════════════════════════════════════════════════════════════ */}
      <section
        className="py-20 md:py-24 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef4ff 50%, #e8f5f3 100%)", borderTop: "1px solid #e2e8f0" }}
      >
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.span
            className="inline-block text-[11px] font-bold text-[#2557a7] uppercase tracking-widest bg-[#FFC85E] px-4 py-1.5 rounded-full mb-6"
            initial={{ opacity: 0, y: -8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45 }}
          >
            Start Today — Free
          </motion.span>

          <motion.h2
            className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}
          >
            Your Next Interview Could Be<br />Your Best One Yet
          </motion.h2>

          <motion.p
            className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed mb-10"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          >
            Join thousands of professionals who use CareerBot to rehearse realistic interview pressure. Start the live mock now, or prepare first if that feels better.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
          >
            <button
              onClick={() => router.push("/mock-interview/live")}
              className="inline-flex items-center gap-2 bg-[#2557a7] text-white hover:bg-[#1e4a94] font-bold px-9 py-4 rounded-xl text-sm shadow-[0_8px_32px_rgba(37,87,167,0.25)] hover:shadow-[0_12px_40px_rgba(37,87,167,0.35)] hover:scale-[1.03] active:scale-100 transition-all duration-300"
            >
              Start Live Interview <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.22 }}
          >
            {[
              { icon: ShieldCheck, label: "No credit card required" },
              { icon: Zap,         label: "Optional prep tools" },
              { icon: Star,        label: "50,000+ interviews done" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold px-3.5 py-1.5 rounded-full shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-[#FFC85E] shrink-0" />
                {label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
