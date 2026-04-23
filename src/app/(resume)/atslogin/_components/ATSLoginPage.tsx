"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertCircle,
  Sparkles,
  Loader2,
  Check,
  Upload,
  ArrowRight,
  Lightbulb,
  BookOpen,
  Mail,
  Heart,
} from "lucide-react";
import { processResumeComplete } from "@/api/resumeatsapi";

enum AnalysisPhase {
  Uploading = "Uploading resume...",
  Parsing = "Parsing content...",
  Analyzing = "Analyzing content...",
  Generating = "Generating report...",
  Complete = "Complete!",
}

/* ─────────────────────────────────────────────
   Loading Modal
───────────────────────────────────────────── */
function LoadingModal({
  isOpen,
  phase,
  progress,
}: {
  isOpen: boolean;
  phase: AnalysisPhase | "";
  progress: number;
}) {
  if (!isOpen) return null;

  const radius = 52;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const phases = Object.values(AnalysisPhase).filter((p) => p !== AnalysisPhase.Complete);
  const stepIndex = Math.max(0, phases.findIndex((p) => p === phase));
  const isComplete = phase === AnalysisPhase.Complete;
  const steps = [
    { label: "Uploading resume" },
    { label: "Parsing content" },
    { label: "Analyzing keywords" },
    { label: "Generating report" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg,rgba(37,99,235,0.18) 0%,rgba(99,102,241,0.18) 100%)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#ffffff 0%,#F8FAFF 100%)",
          boxShadow: "0 24px 64px 0 rgba(37,99,235,0.18), 0 2px 8px 0 rgba(0,0,0,0.06)",
        }}
      >
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#2557a7,#4a7fd4,#2557a7)" }} />
        <div className="px-10 pt-8 pb-8">
          <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-blue-200 opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-100 opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-5" style={{ width: 176, height: 176 }}>
              {!isComplete && (
                <span className="absolute inset-2 rounded-full bg-blue-50/40 animate-ping opacity-10" />
              )}
              <svg
                width="176"
                height="176"
                viewBox="0 0 120 120"
                className="-rotate-90"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2557a7" />
                    <stop offset="100%" stopColor="#4a7fd4" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#E8EDFF" strokeWidth={strokeWidth} />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  filter="url(#glow)"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                {isComplete ? (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: "#2557a7", boxShadow: "0 4px 12px rgba(37,87,167,0.35)" }}>
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <>
                    <span
                      className="text-4xl font-extrabold leading-none"
                      style={{
                        background: "linear-gradient(135deg,#2557a7,#4a7fd4)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {progress}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] mt-0.5" style={{ color: "#2557a7" }}>
                      scanning
                    </span>
                  </>
                )}
              </div>
            </div>
            <h3 className="text-[1.35rem] font-bold text-gray-900 leading-tight mb-1">
              {isComplete ? "Analysis Complete!" : "Analyzing Your Resume"}
            </h3>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              {isComplete
                ? "Your personalised ATS report is ready to view."
                : "Scanning for ATS issues and missing keywords."}
            </p>
            {!isComplete && (
              <div className="flex items-center gap-1.5 mb-5 opacity-50">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "#2557a7", animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            )}
            {isComplete && <div className="mb-5" />}
            <div className="w-full text-left mb-5">
              {steps.map((step, idx) => {
                const done = isComplete || stepIndex > idx;
                const active = !isComplete && stepIndex === idx;
                return (
                  <div key={idx} className="flex items-stretch gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-500 ${
                          done || active ? "text-white" : "bg-gray-100 text-gray-300"
                        }`}
                        style={done ? { background: "#2557a7" } : active ? { background: "#1a4080" } : undefined}
                      >
                        {done ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : active ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div
                          className={`w-px flex-1 my-1 rounded-full transition-colors duration-500 ${
                            done ? "bg-blue-200" : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 pb-4 flex-1 rounded-lg transition-all duration-300 ${
                        idx === steps.length - 1 ? "pb-0" : ""
                      } ${active ? "px-2 -mx-2 bg-blue-50/60" : ""}`}
                    >
                      <span
                        className={`text-sm transition-all duration-300 ${
                          done
                            ? "font-medium text-[#2557a7]"
                            : active
                            ? "font-semibold text-[#1a4080]"
                            : "font-normal text-gray-300"
                        }`}
                      >
                        {step.label}
                      </span>
                      {active && (
                        <span className="flex gap-0.5 items-center opacity-60">
                          {[0, 100, 200].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full animate-bounce"
                              style={{ background: "#2557a7", animationDelay: `${d}ms` }}
                            />
                          ))}
                        </span>
                      )}
                      {done && <span className="text-xs font-semibold ml-0.5" style={{ color: "#2557a7" }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100/80 rounded-xl px-4 py-2.5 w-full justify-center">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Usually takes 30–60 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


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


  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">
      <LoadingModal isOpen={isLoading} phase={loadingPhase} progress={progress} />

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

      {/* ══ HERO ══ */}
      <section style={{ background: "#eef2ff" }} className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left: copy */}
            <div className="max-w-xl flex flex-col gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit" style={{ background: "rgba(37,87,167,0.08)" }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#2557a7" }} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: "#2557a7" }}>ATS Resume Checker · CareerBot</span>
              </div>

              {/* Heading — strong hierarchy */}
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.15]" style={{ color: "#111827" }}>
                  Will Your Resume Pass
                </h1>
                <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.15]" style={{ background: "linear-gradient(90deg,#2557a7,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  the ATS Filter?
                </h1>
              </div>

              {/* Subtext */}
              <p className="text-base text-gray-500 leading-relaxed">
                75% of qualified candidates never reach the interview stage because their resumes fail ATS scans.
                Upload yours and get an instant score — free, no sign-up required.
              </p>

              {/* Primary CTA */}
              <label
                htmlFor="hero-file-upload"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-base cursor-pointer w-fit transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100"
                style={{ background: "linear-gradient(135deg,#2557a7,#6366f1)", boxShadow: "0 6px 20px rgba(37,87,167,0.35)" }}
              >
                <Upload className="w-4 h-4" />
                Upload Resume — It&apos;s Free
              </label>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mt-2">
                {[
                  { icon: "⚡", value: "60s", label: "Average scan time" },
                  { icon: "📋", value: "10+", label: "Sections analysed" },
                  { icon: "✅", value: "100%", label: "Free to use" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-2xl font-black leading-none" style={{ color: "#2557a7" }}>{s.value}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: upload card */}
            <div className="relative rounded-3xl p-3 overflow-visible" style={{ background: "#ffffff", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", minWidth: 520 }}>

              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc"
                className="hidden"
                id="hero-file-upload"
              />

              {!file ? (
                /* Hero Drop zone */
                <div className="relative" style={{ minHeight: 380 }}>

                  {/* === Main layout: dashed box + badges === */}
                  <div className="relative flex gap-4 items-stretch">

                    {/* Dashed drop box */}
                    <label
                      htmlFor="hero-file-upload"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex-1 flex flex-col items-center justify-between cursor-pointer rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${isDragging ? "scale-[0.99]" : ""}`}
                      style={{
                        border: `2px dashed ${isDragging ? "#6366f1" : "#d1d5db"}`,
                        background: isDragging ? "rgba(99,102,241,0.04)" : "#ffffff",
                        minHeight: 380,
                        overflow: "visible",
                      }}
                    >
                      {/* Upload icon — top center */}
                      <div className="flex justify-center items-center w-full pt-12">
                        <div className="relative flex items-center justify-center">
                          <div
                            className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
                            style={{ background: "#f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                          >
                            <Upload className="w-11 h-11" style={{ color: "#6366f1" }} />
                          </div>
                        </div>
                      </div>

                      {/* Title + subtitle — bottom center */}
                      <div className="flex flex-col items-center gap-2 pb-12 px-6">
                        <p className="text-[1.85rem] font-extrabold text-gray-900 whitespace-nowrap tracking-tight text-center">
                          Upload Your Resume
                        </p>
                        <p className="text-sm text-gray-400 text-center">
                          Drag &amp; drop or click to upload · PDF, DOCX, DOC
                        </p>
                      </div>

                      {/* Person — bottom-right, outside dashed box */}
                      <img
                        src="/images/atsloginhero.png"
                        alt=""
                        className="absolute object-contain pointer-events-none select-none"
                        style={{ height: 210, right: -115, bottom: -55, zIndex: 5 }}
                        draggable={false}
                      />
                    </label>

                    {/* File type badges — right column */}
                    <div className="flex flex-col justify-start gap-3 pt-2 -ml-2" style={{ width: 96, flexShrink: 0 }}>
                      {[
                        { label: "PDF", bg: "#c4b5fd", color: "#4c1d95" },
                        { label: "DOCX", bg: "#a5b4fc", color: "#312e81" },
                      ].map(({ label, bg, color }) => (
                        <span
                          key={label}
                          className="text-sm font-bold px-4 py-2.5 rounded-xl text-center block transition-transform hover:scale-105"
                          style={{ background: bg, color, boxShadow: "0 2px 8px rgba(139,92,246,0.18)" }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              ) : (
                /* File selected state — full-card layout matching upload card */
                <div className="relative flex gap-4 items-stretch" style={{ minHeight: 380 }}>

                  {/* Main card */}
                  <div
                    className="flex-1 flex flex-col items-center justify-between rounded-2xl"
                    style={{ border: "2px dashed #d1d5db", background: "#ffffff", minHeight: 380, overflow: "visible" }}
                  >
                    {/* Top: file icon + ready badge */}
                    <div className="flex flex-col items-center gap-3 pt-12">
                      <div className="relative">
                        <div
                          className="w-24 h-24 rounded-2xl flex items-center justify-center"
                          style={{ background: "#f0fdf4", boxShadow: "0 2px 12px rgba(16,185,129,0.15)" }}
                        >
                          <FileText className="w-11 h-11 text-emerald-500" />
                        </div>
                        <div
                          className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "#10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.40)" }}
                        >
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(16,185,129,0.10)", color: "#059669" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Ready to scan
                      </span>
                    </div>

                    {/* Middle: file info */}
                    <div className="flex flex-col items-center gap-1 px-8 text-center">
                      <p className="text-lg font-bold text-gray-900 truncate max-w-xs">{file.name}</p>
                      <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(0)} KB · {file.name.split(".").pop()?.toUpperCase()}</p>
                    </div>

                    {/* Bottom: terms + CTA + remove */}
                    <div className="flex flex-col items-center gap-4 pb-10 px-8 w-full">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="shrink-0 w-4 h-4 cursor-pointer"
                          style={{ accentColor: "#2557a7" }}
                        />
                        <span className="text-xs text-gray-500 leading-relaxed">
                          I agree to CareerBot&apos;s{" "}
                          <span className="underline underline-offset-2" style={{ color: "#2557a7" }}>Terms of Service</span>
                          {" "}and{" "}
                          <span className="underline underline-offset-2" style={{ color: "#2557a7" }}>Privacy Policy</span>
                        </span>
                      </label>

                      <button
                        onClick={handleScanResume}
                        disabled={isLoading || !agreed}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0"
                        style={{ background: "linear-gradient(135deg,#2557a7,#1a4080)", boxShadow: agreed ? "0 4px 14px rgba(37,87,167,0.30)" : undefined }}
                      >
                        {isLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /><span>Scanning…</span></>
                        ) : (
                          <><Sparkles className="w-4 h-4" /><span>Scan My Resume</span><ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>

                      <button
                        onClick={handleRemoveFile}
                        disabled={isLoading}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Remove file
                      </button>
                    </div>
                  </div>

                  {/* File type badges — same right column as upload state */}
                  <div className="flex flex-col justify-start gap-3 pt-2 -ml-2" style={{ width: 96, flexShrink: 0 }}>
                    {[
                      { label: "PDF", bg: "#c4b5fd", color: "#4c1d95" },
                      { label: "DOCX", bg: "#a5b4fc", color: "#312e81" },
                    ].map(({ label, bg, color }) => (
                      <span
                        key={label}
                        className="text-sm font-bold px-4 py-2.5 rounded-xl text-center block"
                        style={{ background: bg, color, boxShadow: "0 2px 8px rgba(139,92,246,0.18)" }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                </div>
              )}

              {/* Trust note */}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-5">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Your resume is never stored or shared
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: "rgba(37,87,167,0.08)", color: "#2557a7" }}>
              HOW IT WORKS
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">3 Steps to Your ATS Score</h2>
            <p className="text-sm text-gray-400 mt-2">No account needed. Results in under 60 seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                num: "01",
                title: "Upload Your Resume",
                desc: "Upload any PDF, DOCX or DOC file. Our scanner works with all resume formats — CareerBot or otherwise.",
                icon: <Upload className="w-5 h-5" style={{ color: "#2557a7" }} />,
                iconBg: "rgba(37,87,167,0.08)",
              },
              {
                num: "02",
                title: "Get an Instant Score",
                desc: "Receive a detailed compatibility score showing exactly how your resume performs against real ATS systems.",
                icon: <Sparkles className="w-5 h-5 text-violet-600" />,
                iconBg: "#f5f3ff",
              },
              {
                num: "03",
                title: "Fix & Improve",
                desc: "See a section-by-section breakdown with prioritised fixes so you know exactly what to change.",
                icon: <Lightbulb className="w-5 h-5 text-amber-600" />,
                iconBg: "#fffbeb",
              },
            ].map((step) => (
              <div key={step.num} className="relative bg-white rounded-2xl p-7 hover:-translate-y-0.5 transition-all duration-200" style={{ border: "1px solid #e8edf5", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: step.iconBg }}>
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-gray-100 select-none">{step.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <label
              htmlFor="hero-file-upload"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer transition-all hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg,#2557a7,#1a4080)", boxShadow: "0 4px 14px rgba(37,87,167,0.28)" }}
            >
              <Upload className="w-4 h-4" />
              Check Your Resume Now
            </label>
          </div>
        </div>
      </section>

      {/* ══ CHOOSE YOUR LEVEL ══ */}
      <section className="py-16" style={{ background: "#f8faff" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: "rgba(37,87,167,0.08)", color: "#2557a7" }}>
              YOUR OPTIONS
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">Pick Your Level of Insight</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 flex flex-col" style={{ border: "1px solid #e2e8f2" }}>
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Free</p>
                <h3 className="text-xl font-extrabold text-gray-900">Quick ATS Check</h3>
                <p className="text-sm text-gray-400 mt-1">No sign-up required</p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["ATS Compatibility Score","Formatting Issues Detection","ATS Readability Assessment","Essential Recommendations"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-gray-500" strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <label
                htmlFor="hero-file-upload"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm border-2 cursor-pointer transition-all hover:bg-gray-50"
                style={{ borderColor: "#1a202c", color: "#1a202c" }}
              >
                Get Free Score <ArrowRight className="w-4 h-4" />
              </label>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-8 flex flex-col" style={{ background: "linear-gradient(145deg,#eef2ff,#dbeafe)", border: "1.5px solid #bfdbfe" }}>
              <div className="mb-5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold rounded-full mb-2" style={{ background: "#2557a7" }}>
                  <Sparkles className="w-2.5 h-2.5" /> RECOMMENDED
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Complete ATS Analysis</h3>
                <p className="text-sm text-gray-500 mt-1">Full report with AI fixes</p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Detailed Score Across 10+ Areas","Keyword Optimisation Analysis","Section-by-Section Feedback","Format & Structure Evaluation","Personalised Fix Suggestions","Industry-Specific Insights","One-Click Resume Fix"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(37,87,167,0.12)" }}>
                      <Check className="w-2.5 h-2.5" strokeWidth={3} style={{ color: "#2557a7" }} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <label
                htmlFor="hero-file-upload"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#2557a7,#1a4080)" }}
              >
                <Sparkles className="w-4 h-4" /> Unlock Full Analysis
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TOOLKIT ══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: "rgba(37,87,167,0.08)", color: "#2557a7" }}>
              MORE FROM CAREERBOT
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">The Complete Job Search Toolkit</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-lg">
              Everything you need from resume to offer — powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Sparkles className="w-5 h-5" style={{ color: "#2557a7" }} />, iconBg: "rgba(37,87,167,0.08)", title: "AI Resume Builder", desc: "Create a tailored resume using AI-driven suggestions that highlight your strengths for any role.", tag: "Most Popular" },
              { icon: <Heart className="w-5 h-5 text-rose-500" />, iconBg: "#fff1f2", title: "Cover Letter Builder", desc: "Generate a personalised cover letter in seconds, crafted to match the job requirements.", tag: null },
              { icon: <FileText className="w-5 h-5 text-violet-600" />, iconBg: "#f5f3ff", title: "16+ Resume Templates", desc: "Professionally designed, ATS-friendly templates that make your resume stand out to recruiters.", tag: null },
              { icon: <BookOpen className="w-5 h-5 text-amber-600" />, iconBg: "#fffbeb", title: "Resume Examples Library", desc: "90+ industry-specific resume examples for inspiration and guidance.", tag: null },
              { icon: <Mail className="w-5 h-5 text-emerald-600" />, iconBg: "#f0fdf4", title: "Cover Letter Templates", desc: "16 professional templates designed to impress hiring managers with a polished application.", tag: null },
              { icon: <Lightbulb className="w-5 h-5 text-orange-500" />, iconBg: "#fff7ed", title: "Career Advice Blog", desc: "Expert guides, real examples, and step-by-step tips for every stage of your job search.", tag: null },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative bg-white rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-md cursor-pointer transition-all duration-200"
                style={{ border: "1px solid #e8edf5" }}
              >
                {card.tag && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(37,87,167,0.08)", color: "#2557a7" }}>
                    {card.tag}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200" style={{ background: card.iconBg }}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{card.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{card.desc}</p>
                <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#2557a7" }}>
                  Learn more <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
