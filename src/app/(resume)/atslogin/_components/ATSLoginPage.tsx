"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: "italic",
  weight: "700",
});
import {
  FileText,
  AlertCircle,
  Sparkles,
  Check,
  ArrowRight,
  Lightbulb,
  BookOpen,
  Mail,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { processResumeComplete } from "@/api/resumeatsapi";

const E = [0.22, 1, 0.36, 1] as const;

enum AnalysisPhase {
  Uploading = "Uploading resume...",
  Parsing = "Parsing content...",
  Analyzing = "Analyzing content...",
  Generating = "Generating report...",
  Complete = "Complete!",
}

const CIRC = 2 * Math.PI * 70; // ≈ 439.8 — circumference for progress ring (r=70)

const LOADING_STEPS: { highlight: string; text: string[] }[] = [
  { highlight: "analyze", text: ["We ", "analyze", " your data"] },
  {
    highlight: "ATS score",
    text: ["Calculating your ", "ATS score", " across all sections"],
  },
  {
    highlight: "Gather information",
    text: [
      "Gather information",
      " from job boards and applicant tracking system (ATS) platforms",
    ],
  },
];

/* ── Slide data ─────────────────────────────────────────────────────── */

const SLIDES = [
  {
    src: "/images/atsloginloading1.png",
    title: "Improve Your Resume with AI Auto-Customization",
  },
  {
    src: "/images/atsloginloading2png.png",
    title: "Calculating Your ATS Compatibility Score",
  },
  {
    src: "/images/atsloginloading3.png",
    title: "Generating Your Personalized Action Plan",
  },
];

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function ATSLoginPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<AnalysisPhase | "">("");
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (f: File) => {
    setError("");
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "doc"].includes(ext)) {
      setError("Invalid file type. Only PDF, DOCX, and DOC are allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB. Please upload a smaller file.");
      return;
    }
    setFile(f);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setAgreed(false);
  };

  const handleScanResume = async () => {
    if (!file) return;
    setError("");
    setIsLoading(true);
    setProgress(0);
    try {
      setLoadingPhase(AnalysisPhase.Uploading);
      setProgress(30);
      const result = await processResumeComplete(file);
      setProgress(70);
      setLoadingPhase(AnalysisPhase.Analyzing);
      if (!result.success) {
        let msg = "Upload failed";
        if (result && typeof result === "object" && "error" in result) {
          const e = (result as Record<string, unknown>).error;
          if (typeof e === "object" && e !== null && "message" in e)
            msg = String((e as Record<string, unknown>).message);
          else if (typeof e === "string") msg = e;
        }
        throw new Error(msg);
      }
      setProgress(100);
      setLoadingPhase(AnalysisPhase.Complete);
      const resumeId = "resume_id" in result ? result.resume_id : "";
      setTimeout(() => router.push(`/atslogin/report?resume_id=${resumeId}`), 600);
    } catch (err: unknown) {
      let msg = "Unable to process your resume. Please try again.";
      if (err instanceof Error) {
        try {
          const p = JSON.parse(err.message);
          const m = p.message || p.error?.message || p.error || p.detail;
          msg = typeof m === "string" ? m : err.message;
        } catch {
          msg = err.message || msg;
        }
      }
      setError(msg);
      setIsLoading(false);
      setProgress(0);
      setLoadingPhase("");
    }
  };

  /* Step status driven by displayProgress so it matches the animated ring */
  const stepStatus = (i: number): "done" | "active" | "pending" => {
    const thresholds = [30, 70, 100];
    if (displayProgress > thresholds[i]) return "done";
    if (displayProgress >= (i === 0 ? 0 : thresholds[i - 1])) return "active";
    return "pending";
  };

  /* Smoothly animate displayed progress toward a fake ceiling while API waits */
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setDisplayProgress(0);
      return;
    }
    // Fake ceiling: 68 while API runs (progress=30), 95 after it returns (progress=70), 100 on complete
    const ceiling = progress >= 100 ? 100 : progress >= 70 ? 95 : 68;

    const id = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= ceiling) return prev;
        const step = prev < progress ? 2 : 0.4; // catch up fast, then creep
        return Math.min(prev + step, ceiling);
      });
    }, 120);

    return () => clearInterval(id);
  }, [isLoading, progress]);

  /* Auto-cycle slides every 3.5 s while loading */
  const [displaySlide, setDisplaySlide] = useState(0);

  useEffect(() => {
    if (!isLoading || loadingPhase === AnalysisPhase.Complete) {
      setDisplaySlide(0);
      return;
    }
    const timer = setInterval(() => {
      setDisplaySlide((s) => (s + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isLoading, loadingPhase]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">

      {/* ── Error Modal ── */}
      {error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Unable to Process</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="w-full py-3 text-white font-semibold rounded-xl transition-all"
              style={{ background: "#2557a7" }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ══ Full-page Loading Overlay ══ */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col"
            style={{
              backgroundImage: "linear-gradient(rgba(37,87,167,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,87,167,0.03) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              backgroundColor: "#ffffff",
            }}
          >
            {/* ── Top progress bar ── */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#e2e8f0", zIndex: 10 }}>
              <motion.div
                style={{ height: "100%", background: "linear-gradient(90deg, #2557a7, #6366f1)", borderRadius: "0 2px 2px 0", originX: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* ── Top branding bar ── */}
            <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#2557a7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>CareerBot</span>
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                Analyzing your resume…
              </span>
            </div>

            {/* ── Main content — slightly above center ── */}
            <div className="flex-1 flex flex-col items-center justify-center" style={{ marginTop: "-60px" }}>
              {loadingPhase !== AnalysisPhase.Complete ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: E }}
                  className="flex flex-col items-center"
                >
                  {/* ── Circular progress ring ── */}
                  <div className="relative mb-10" style={{ width: 220, height: 220 }}>
                    {/* Subtle glow behind ring */}
                    <div style={{
                      position: "absolute", inset: 16, borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(37,87,167,0.07) 0%, transparent 70%)",
                    }} />
                    <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="110" cy="110" r="90" fill="none" stroke="#e8edf5" strokeWidth="10" />
                      <motion.circle
                        cx="110" cy="110" r="90"
                        fill="none"
                        stroke="#2557a7"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 90}
                        animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - displayProgress / 100) }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={playfair.className}
                        style={{ fontSize: 72, lineHeight: 1, fontWeight: 400, color: "#0f172a", fontStyle: "italic" }}
                      >
                        {Math.round(displayProgress)}
                      </span>
                      <span style={{ fontSize: 15, color: "#94a3b8", fontWeight: 500, marginTop: 4 }}>%</span>
                    </div>
                  </div>

                  {/* ── Slide title + subtitle ── */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={displaySlide}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: E }}
                      className="text-center mb-5"
                      style={{ maxWidth: 420 }}
                    >
                      <h2
                        className={playfair.className}
                        style={{ fontSize: 24, fontWeight: 400, fontStyle: "italic", color: "#0f172a", margin: "0 0 10px", lineHeight: 1.35 }}
                      >
                        {SLIDES[displaySlide].title}
                      </h2>
                      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, letterSpacing: "0.01em" }}>
                        We&apos;re scanning every word, format choice, and keyword.
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* ── Dot indicators ── */}
                  <div className="flex items-center justify-center gap-2 mb-7">
                    {SLIDES.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          width: i === displaySlide ? 20 : 7,
                          background: i === displaySlide ? "#2557a7" : "#d1d5db",
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ height: 7, borderRadius: 999 }}
                      />
                    ))}
                  </div>

                  {/* ── Step pills ── */}
                  <div className="flex items-center gap-3">
                    {[
                      { label: "Uploading", idx: 0 },
                      { label: "Analyzing", idx: 1 },
                      { label: "Complete",  idx: 2 },
                    ].map(({ label, idx }) => {
                      const status = stepStatus(idx);
                      const isDone   = status === "done";
                      const isActive = status === "active";
                      return (
                        <div
                          key={label}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 7,
                            padding: "9px 20px", borderRadius: 999,
                            fontSize: 13, fontWeight: 600,
                            background: isDone ? "#dcfce7" : isActive ? "rgba(37,87,167,0.06)" : "transparent",
                            border: isDone ? "1.5px solid #86efac" : isActive ? "1.5px solid #2557a7" : "1.5px solid #e2e8f0",
                            color: isDone ? "#15803d" : isActive ? "#2557a7" : "#9ca3af",
                          }}
                        >
                          {isDone ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : isActive ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2557a7" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                          )}
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* ── Complete state ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: E }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{ background: "#dcfce7", boxShadow: "0 6px 24px rgba(34,197,94,0.32)" }}
                  >
                    <Check className="w-10 h-10 text-green-600" strokeWidth={2.5} />
                  </motion.div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">Scan Complete!</p>
                  <p className="text-base text-gray-500">Redirecting to your report…</p>
                  <div className="flex gap-2 mt-6">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2.5 h-2.5 rounded-full animate-bounce"
                        style={{ background: "#2557a7", animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Bottom footer ── */}
            <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
              </svg>
              <span style={{ fontSize: 11, color: "#cbd5e1" }}>Your resume is never stored · TLS encrypted</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ HERO ══ */}
      <section
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 35%, #dbeafe 70%, #bfdbfe 100%)",
          position: "relative",
          overflow: "hidden",
        }}
        className="py-16 lg:py-24 px-6 md:px-16"
      >
        {/* ── Blue glow — top right ── */}
        <div style={{
          position: "absolute", top: "-20%", right: "-8%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,87,167,0.18) 0%, rgba(99,138,215,0.07) 50%, transparent 70%)",
          filter: "blur(56px)", pointerEvents: "none",
        }} />
        {/* ── Light indigo glow — bottom left ── */}
        <div style={{
          position: "absolute", bottom: "-10%", left: "-5%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        {/* ── Decorative arc lines ── */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 1440 600"
          preserveAspectRatio="xMidYMin slice"
          fill="none"
        >
          <path d="M 350 800 A 450 450 0 0 0 -100 350" stroke="rgba(37,87,167,0.18)" strokeWidth="1.2" />
          <path d="M 400 800 A 500 500 0 0 0 -100 300" stroke="rgba(37,87,167,0.12)" strokeWidth="1"   />
          <path d="M 450 800 A 550 550 0 0 0 -100 250" stroke="rgba(37,87,167,0.07)" strokeWidth="0.9" />
          <path d="M 500 800 A 600 600 0 0 0 -100 200" stroke="rgba(37,87,167,0.04)" strokeWidth="0.8" />
          <path d="M 1150 -80 A 450 450 0 0 0 1600 370" stroke="rgba(99,102,241,0.15)" strokeWidth="1.2" />
          <path d="M 1100 -80 A 500 500 0 0 0 1600 420" stroke="rgba(99,102,241,0.10)" strokeWidth="1"   />
          <path d="M 1050 -80 A 550 550 0 0 0 1600 470" stroke="rgba(99,102,241,0.06)" strokeWidth="0.9" />
          <path d="M 1000 -80 A 600 600 0 0 0 1600 520" stroke="rgba(99,102,241,0.03)" strokeWidth="0.8" />
        </svg>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center" style={{ position: "relative", zIndex: 1 }}>

          {/* ── LEFT COPY ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: E }}
          >
            {/* Kicker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: E }}
              className="inline-flex items-center gap-2 mb-6"
              style={{
                padding: "6px 14px",
                background: "rgba(37,87,167,0.08)",
                borderRadius: 999,
                border: "1px solid rgba(37,87,167,0.2)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2557a7" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#2557a7", letterSpacing: "0.12em" }}>
                ✦ Free ATS Resume Checker
              </p>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: E }}
              className="text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight"
              style={{ color: "#0f172a" }}
            >
              Get your ATS score{" "}
              <br className="hidden md:block" />
              in{" "}
              <span style={{ position: "relative", display: "inline-block" }}>
                <span className={playfair.className} style={{ color: "#2557a7" }}>
                  60 seconds.
                </span>
                <svg
                  width="100%"
                  height="14"
                  viewBox="0 0 260 14"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", left: 0, bottom: -10, overflow: "visible" }}
                >
                  <path
                    d="M2 8 Q 52 2, 104 7 T 208 7 T 258 5"
                    stroke="#2557a7"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: E }}
              className="mt-7 text-lg max-w-lg leading-relaxed"
              style={{ color: "#4b5563" }}
            >
              Upload your resume. See exactly what applicant-tracking systems see — what they
              miss, what they reward, and what&apos;s costing you interviews.
            </motion.p>

            {/* Meta row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: E }}
              className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base"
              style={{ color: "#6b7280" }}
            >
              <span>
                <span className="font-semibold" style={{ color: "#0f172a" }}>412k+</span> resumes analyzed
              </span>
              <span style={{ color: "#cbd5e1" }} className="select-none">·</span>
              <span className="flex items-center gap-1">
                <span style={{ color: "#f59e0b" }}>★★★★★</span>
                <span className="font-semibold" style={{ color: "#0f172a" }}>4.8</span>
                <span>from 9,200 reviews</span>
              </span>
              <span style={{ color: "#cbd5e1" }} className="select-none">·</span>
              <span>
                <span className="font-semibold" style={{ color: "#0f172a" }}>~30s</span> scan
              </span>
            </motion.div>

            {/* Avatar trust row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32, ease: E }}
              className="mt-7 flex items-center gap-3"
            >
              <div className="flex -space-x-2.5">
                {[
                  { i: "A", bg: "#ef4444" },
                  { i: "M", bg: "#22c55e" },
                  { i: "K", bg: "#3b82f6" },
                  { i: "J", bg: "#f97316" },
                  { i: "+", bg: "#14b8a6" },
                ].map((av) => (
                  <div
                    key={av.i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: av.bg, boxShadow: "0 0 0 2.5px #ffffff" }}
                  >
                    {av.i}
                  </div>
                ))}
              </div>
              <p className="text-sm max-w-xs leading-snug" style={{ color: "#4b5563" }}>
                Used by engineers, designers and PMs at top tech companies
              </p>
            </motion.div>
          </motion.div>

          {/* ── RIGHT — UPLOAD CARD ── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: E }}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc"
              className="hidden"
              id="hero-file-upload"
            />

            {/* Card */}
            <div
              style={{
                background: "#fff",
                border: "2px solid #0f172a",
                borderRadius: 20,
                boxShadow: "6px 6px 0px #0f172a",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4, fontWeight: 500 }}>Step 01 of 03</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Upload your resume</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>PDF or DOCX, up to 10 MB</p>
                </div>
                {/* Green time pill */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#EAF2EC", border: "1px solid #C8DCCC",
                  color: "#2A3441", padding: "6px 12px", borderRadius: 999,
                  fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3DA463", display: "inline-block" }} />
                  Estimated time: ~30s
                </span>
              </div>

              {/* Dropzone / File state */}
              <AnimatePresence mode="wait">

                {/* ── STATE A: IDLE ── */}
                {!file && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: E }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label
                      htmlFor="hero-file-upload"
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 10,
                        border: `2px dashed ${isDragging ? "#2557a7" : "#9ca3af"}`,
                        borderRadius: 14,
                        background: isDragging ? "rgba(37,87,167,0.04)" : "#f9f9f0",
                        padding: "28px 20px",
                        textAlign: "center",
                        cursor: "pointer",
                        minHeight: 200,
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Black rounded square upload icon */}
                      <div style={{
                        width: 40, height: 40, background: "#1a1a1a",
                        borderRadius: 10, display: "grid", placeItems: "center",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                      </div>

                      <div>
                        <p style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a" }}>
                          Drag &amp; drop, or{" "}
                          <span style={{ color: "#2557a7", fontWeight: 700 }}>browse files</span>
                        </p>
                        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                          .pdf · .docx · .doc · max 10 MB
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        animate={{
                          boxShadow: [
                            "0 4px 12px rgba(37,87,167,0.3)",
                            "0 4px 20px rgba(37,87,167,0.55)",
                            "0 4px 12px rgba(37,87,167,0.3)",
                          ],
                        }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          (document.getElementById("hero-file-upload") as HTMLInputElement)?.click();
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          background: "#2557a7", color: "#fff",
                          border: "none", padding: "12px 22px",
                          borderRadius: 999, fontWeight: 600, fontSize: 14, cursor: "pointer",
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Scan my resume — it&apos;s free
                      </motion.button>

                      <p style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
                        </svg>
                        Never stored · Deleted instantly after scan
                      </p>
                    </label>
                  </motion.div>
                )}

                {/* ── STATE B: FILE READY ── */}
                {file && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: E }}
                    style={{ display: "flex", flexDirection: "column", gap: 14 }}
                  >
                    {/* File row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: 14, borderRadius: 14,
                      background: "#F5F4EC", border: "1.5px solid #d1d5db",
                    }}>
                      {/* Thumbnail */}
                      <div style={{
                        position: "relative", flexShrink: 0,
                        width: 40, height: 52, borderRadius: 8,
                        background: "#fff", border: "1px solid #d1d5db",
                        display: "flex", flexDirection: "column",
                        justifyContent: "center", gap: 5, padding: "6px 8px",
                      }}>
                        <div style={{ height: 3, borderRadius: 999, background: "#d1d5db" }} />
                        <div style={{ height: 3, borderRadius: 999, background: "#d1d5db", width: "75%" }} />
                        <div style={{ height: 3, borderRadius: 999, background: "#d1d5db" }} />
                        <span style={{
                          position: "absolute", bottom: -6, right: -6,
                          fontSize: 8, fontWeight: 800, color: "#fff",
                          background: "#2557a7", padding: "2px 4px", borderRadius: 4, lineHeight: 1.2,
                        }}>
                          {file.name.split(".").pop()?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {(file.size / 1024).toFixed(0)} KB · {file.name.split(".").pop()?.toUpperCase()}
                        </p>
                        <p style={{ fontSize: 12, color: "#16a34a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <Check className="w-3 h-3" /> Looks good — file ready to scan
                        </p>
                      </div>
                      <button onClick={handleRemoveFile} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", flexShrink: 0 }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Terms */}
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        style={{ width: 15, height: 15, marginTop: 2, accentColor: "#2557a7", flexShrink: 0, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.55 }}>
                        I agree to CareerBot&apos;s{" "}
                        <span style={{ color: "#2557a7", textDecoration: "underline" }}>Terms of Service</span>
                        {" "}and acknowledge my resume is processed for analysis only and{" "}
                        <strong style={{ color: "#1a1a1a" }}>never stored</strong>.
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Primary CTA — full width pill, disabled = gray */}
              <button
                onClick={handleScanResume}
                disabled={!file || !agreed}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "16px 28px",
                  background: (!file || !agreed) ? "#a8b0ba" : "#2557a7",
                  color: "#fff", border: "none", borderRadius: 999,
                  fontSize: 15, fontWeight: 600, cursor: (!file || !agreed) ? "not-allowed" : "pointer",
                  transition: "background 0.2s, transform 0.12s",
                }}
                onMouseEnter={(e) => { if (file && agreed) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
              >
                <Sparkles className="w-4 h-4" />
                Scan my resume
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust line */}
              <p style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 11, color: "#6b7280", margin: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                </svg>
                Your data is never stored · TLS encrypted · GDPR compliant
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="px-6 md:px-16 py-16 md:py-24" style={{ background: "linear-gradient(160deg, #ffffff 0%, #eef4ff 60%, #e6f0ff 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 56, gap: 40 }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2557a7" }} />
                <span style={{ color: "#2557a7", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  How it works
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>
                Three steps. Thirty
                <br />
                <em className={playfair.className} style={{ fontStyle: "italic", fontWeight: 400, color: "#2557a7", textTransform: "none" }}>
                  seconds.
                </em>
              </h2>
            </div>
            <p style={{ color: "#4b5563", maxWidth: 460, fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              No account, no upsell wall. Drop your resume, get an honest score,
              and see exactly which lines are losing you interviews.
            </p>
          </div>

          {/* Step cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { num: "01", title: "Upload your resume", desc: "PDF, DOCX, or DOC — any template. We parse it the same way 90% of ATS systems do." },
              { num: "02", title: "Get an instant score", desc: "A 0–100 ATS compatibility score with section-by-section breakdown — formatting, keywords, experience, more." },
              { num: "03", title: "Fix & improve", desc: "Every issue ships with a one-click rewrite. Apply the fixes you like, leave the ones you don't." },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  padding: "32px 28px",
                  background: "#ffffff",
                  border: "1.5px solid #0f172a",
                  borderRadius: 18,
                  boxShadow: "5px 5px 0px #0f172a",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px, -2px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "7px 7px 0px #0f172a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(0, 0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "5px 5px 0px #0f172a";
                }}
              >
                <span className={playfair.className} style={{ fontStyle: "italic", fontSize: 48, lineHeight: 1, fontWeight: 400, color: "#2557a7", display: "block", marginBottom: 20 }}>
                  {step.num}
                </span>
                <h4 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ATS UNDERSTANDING ══ */}
      <section
        className="px-6 md:px-16 py-16 md:py-24"
        style={{ background: "linear-gradient(160deg, #f0f7ff 0%, #ffffff 50%, #eef4ff 100%)" }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center" style={{ gridTemplateColumns: "1fr 0.75fr" }}>

          {/* LEFT — ATS skill match video */}
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <video
              src="/images/atsskillmatch.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 20,
                boxShadow: "none",
              }}
            />

            {/* Floating pills */}
            <div style={{ position: "absolute", top: "8%", left: 0, background: "#d1fae5", border: "1.5px solid #6ee7b7", borderRadius: 999, padding: "7px 16px", fontSize: 12, fontWeight: 700, color: "#065f46", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
              Keywords
            </div>
            <div style={{ position: "absolute", bottom: "26%", left: 0, background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: 999, padding: "7px 16px", fontSize: 12, fontWeight: 700, color: "#92400e", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
              Contact information
            </div>
            <div style={{ position: "absolute", bottom: "5%", right: "6%", background: "#ede9fe", border: "1.5px solid #c4b5fd", borderRadius: 999, padding: "7px 16px", fontSize: 12, fontWeight: 700, color: "#5b21b6", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
              Skills
            </div>
          </div>

          {/* RIGHT — text */}
          <div style={{ paddingLeft: 12 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2557a7" }} />
              <span className="text-xs font-bold uppercase" style={{ color: "#2557a7", letterSpacing: "0.14em" }}>
                How we score
              </span>
            </div>

            <h2 style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: "0 0 20px" }}>
              Get an ATS
              <br />
              <em className={playfair.className} style={{ fontStyle: "italic", fontWeight: 400, color: "#2557a7", textTransform: "none" }}>
                understanding
              </em>{" "}
              check
            </h2>

            <p style={{ color: "#4b5563", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              Our score is based on how well your resume is <strong style={{ color: "#0f172a", fontWeight: 600 }}>parsed by real ATS systems</strong>. We&apos;ve reverse-engineered the most popular applicant tracking platforms to identify exactly what gets flagged, filtered, or rewarded.
            </p>

            {/* Feature bullets */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Keyword alignment", desc: "Matched against your target job role and industry" },
                { label: "Contact parsability", desc: "Checks name, email, phone are machine-readable" },
                { label: "File format & length", desc: "Validates type, page count, and section order" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#dbeafe", border: "1.5px solid #93c5fd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2557a7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#4b5563" }}>
                    <strong style={{ color: "#0f172a", fontWeight: 700 }}>{item.label}</strong>
                    {" — "}{item.desc}
                  </p>
                </div>
              ))}
            </div>

            <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              After the scan, every issue comes with a <strong style={{ color: "#2557a7", fontWeight: 600 }}>one-click fix suggestion</strong> so you know exactly what to change and why.
            </p>
          </div>

        </div>
      </section>

      {/* ══ AI REWRITE ══ */}
      <section
        className="px-6 md:px-16 py-16 md:py-24"
        style={{ background: "linear-gradient(160deg, #eef4ff 0%, #ffffff 50%, #f0f7ff 100%)" }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* LEFT — text */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2557a7" }} />
              <span style={{ color: "#2557a7", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                AI-powered rewrites
              </span>
            </div>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.4vw, 2.2rem)", lineHeight: 1.1, letterSpacing: "-0.02em", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: "0 0 24px", whiteSpace: "nowrap" }}>
              Rewrite your resume{" "}
              <em className={playfair.className} style={{ fontStyle: "italic", fontWeight: 400, color: "#2557a7", textTransform: "none" }}>
                with AI
              </em>
            </h2>
            <p style={{ color: "#374151", fontSize: 16, lineHeight: 1.75, marginBottom: 16 }}>
              Get your resume rewritten by our <strong style={{ color: "#0f172a" }}>AI engine</strong> in combination with tailored prompts and a fine-tuned model based on your resume and the job you&apos;re applying for — saving you hours of manual editing.
            </p>
            <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              Receive content suggestions based on the sections your resume currently has. Generate a resume summary or objective based on your experience. Get skills suggestions based on the industry you&apos;re applying for. Omit buzzwords, filler words, and irrelevant content.
            </p>
          </div>

          {/* RIGHT — skill match image */}
          <div style={{ position: "relative" }}>
            <img
              src="/images/atsskillmatch.png"
              alt="AI resume rewrite preview"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 20,
              }}
            />
          </div>

        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="px-6 md:px-16 py-16 md:py-24" style={{
        backgroundImage: "linear-gradient(rgba(37,87,167,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(37,87,167,0.055) 1px, transparent 1px), linear-gradient(160deg, #ffffff 0%, #eef4ff 60%, #e6f0ff 100%)",
        backgroundSize: "44px 44px, 44px 44px, 100% 100%",
      }}>
        <div className="max-w-7xl mx-auto">

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 48, gap: 40 }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2557a7" }} />
                <span className="text-xs font-bold uppercase" style={{ color: "#2557a7", letterSpacing: "0.14em" }}>
                  Pick your level
                </span>
              </div>
              <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>
                Free is{" "}
                <em className={playfair.className} style={{ fontStyle: "italic", fontWeight: 400, color: "#2557a7", textTransform: "none" }}>
                  enough
                </em>
                .
              </h2>
            </div>
            <p style={{ color: "#4b5563", maxWidth: 460, fontSize: 16, lineHeight: 1.6, margin: 0 }}>
              Most resumes get a meaningful uplift from the free scan. Upgrade only if you want one-click rewrites and industry benchmarks.
            </p>
          </div>

          {/* Two cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* FREE card */}
            <div style={{ background: "#fff", border: "1.5px solid #0f172a", borderRadius: 20, boxShadow: "5px 5px 0px #0f172a", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
                  Free · No account
                </p>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Starter scan</h3>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className={playfair.className} style={{ fontStyle: "italic", fontSize: 48, lineHeight: 1, fontWeight: 400, color: "#1a1a1a" }}>$0</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>/ forever</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {["ATS compatibility score (0–100)", "Formatting & readability detection", "Top-line section feedback", "Essential recommendations"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <label
                htmlFor="hero-file-upload"
                style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 20px", borderRadius: 999, fontWeight: 600, fontSize: 13, background: "#fff", border: "1.5px solid #1a1a1a", color: "#1a1a1a", cursor: "pointer", transition: "background 0.18s, color 0.18s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.background = "#1a1a1a";
                  (e.currentTarget as HTMLLabelElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.background = "#fff";
                  (e.currentTarget as HTMLLabelElement).style.color = "#1a1a1a";
                }}
              >
                Continue with free
              </label>
            </div>

            {/* PRO card — dark navy */}
            <div style={{ position: "relative", background: "#0f172a", border: "1.5px solid #0f172a", borderRadius: 20, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 14, color: "#fff", boxShadow: "5px 5px 0px rgba(0,0,0,0.4)" }}>
              {/* Ribbon */}
              <span style={{ position: "absolute", top: -13, right: 24, background: "#F5A524", color: "#0f172a", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 999 }}>
                Most chosen
              </span>

              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#F5A524", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
                  Complete
                </p>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>CareerBot Pro</h3>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className={playfair.className} style={{ fontStyle: "italic", fontSize: 48, lineHeight: 1, fontWeight: 400, color: "#fff" }}>$9</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>/ month</span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {["Everything in Starter", "Keyword analysis vs. job description", "Per-section deep feedback & rewrites", "One-click apply on every fix", "Industry benchmark + percentile", "Unlimited scans & revisions"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.86)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 20px", borderRadius: 999, fontWeight: 600, fontSize: 13, background: "#F5A524", color: "#0f172a", border: "none", cursor: "pointer" }}>
                Upgrade to Pro
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ══ TOOLKIT ══ */}
      <section className="px-6 md:px-16 py-14 md:py-20" style={{
        backgroundImage: "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(160deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%)",
        backgroundSize: "44px 44px, 44px 44px, 100% 100%",
      }}>
        <div className="max-w-7xl mx-auto">

          <div style={{ marginBottom: 48 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2557a7" }} />
              <span className="text-xs font-bold uppercase" style={{ color: "#2557a7", letterSpacing: "0.14em" }}>
                More from CareerBot
              </span>
            </div>
            <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>
              The full{" "}
              <em className={playfair.className} style={{ fontStyle: "italic", fontWeight: 400, color: "#2557a7", textTransform: "none" }}>
                toolkit
              </em>
              .
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: <Sparkles className="w-5 h-5" />, title: "AI Resume Builder", sub: "Build from scratch in 10 min", color: "#2557a7" },
              { icon: <Mail className="w-5 h-5" />, title: "Cover Letter Builder", sub: "Tailored to each job", color: "#6366f1" },
              { icon: <FileText className="w-5 h-5" />, title: "16+ Templates", sub: "All ATS-tested layouts", color: "#0891b2" },
              { icon: <BookOpen className="w-5 h-5" />, title: "Resume Examples", sub: "By role and seniority", color: "#059669" },
              { icon: <Heart className="w-5 h-5" />, title: "Cover Letter Templates", sub: "Editable, conversion-tested", color: "#dc2626" },
              { icon: <Lightbulb className="w-5 h-5" />, title: "Career Advice Blog", sub: "Weekly playbooks", color: "#d97706" },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "#ffffff",
                  border: "1.5px solid #0f172a",
                  borderRadius: 14,
                  boxShadow: "3px 3px 0px #0f172a",
                  padding: "22px 20px",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(-1px, -1px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "5px 5px 0px #0f172a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(0, 0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "3px 3px 0px #0f172a";
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}15`, border: `1.5px solid ${card.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>{card.title}</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}

