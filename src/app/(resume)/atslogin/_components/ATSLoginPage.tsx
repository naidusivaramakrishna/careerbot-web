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
import SafeHTML from "@/components/common/SafeHTML";

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
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#ffffff 0%,#F8FAFF 100%)",
          boxShadow: "0 24px 64px 0 rgba(37,99,235,0.18), 0 2px 8px 0 rgba(0,0,0,0.06)",
        }}
      >
        <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />
        <div className="px-10 pt-8 pb-8">
          <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-teal-200 opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-cyan-200 opacity-20 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-5" style={{ width: 176, height: 176 }}>
              {!isComplete && (
                <span className="absolute inset-2 rounded-full bg-teal-50/40 animate-ping opacity-10" />
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
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0891b2" />
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
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-200">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <>
                    <span
                      className="text-4xl font-extrabold leading-none"
                      style={{
                        background: "linear-gradient(135deg,#14b8a6,#0891b2)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {progress}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-500 mt-0.5">
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
                    className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
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
                          done
                            ? "bg-teal-500 text-white shadow-sm shadow-teal-200"
                            : active
                            ? "bg-teal-600 text-white shadow-md shadow-teal-300/60"
                            : "bg-gray-100 text-gray-300"
                        }`}
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
                            done ? "bg-teal-200" : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 pb-4 flex-1 rounded-lg transition-all duration-300 ${
                        idx === steps.length - 1 ? "pb-0" : ""
                      } ${active ? "px-2 -mx-2 bg-teal-50/60" : ""}`}
                    >
                      <span
                        className={`text-sm transition-all duration-300 ${
                          done
                            ? "font-medium text-teal-600"
                            : active
                            ? "font-semibold text-teal-700"
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
                              className="w-1 h-1 rounded-full bg-teal-500 animate-bounce"
                              style={{ animationDelay: `${d}ms` }}
                            />
                          ))}
                        </span>
                      )}
                      {done && <span className="text-xs text-teal-500 font-semibold ml-0.5">✓</span>}
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

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={() => setError("")}
              className="w-full py-3 bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Section 1: Hero ── */}
      <section
        className="py-16 lg:py-24"
        style={{ background: "linear-gradient(160deg,#eaf4fb 0%,#f0f7ff 50%,#ffffff 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Hero Text */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-6">
                <div className="w-8 h-[2px] bg-blue-400" />
                <span>ATS Resume Checker by CareerBot</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-[#1a2b4a] leading-[1.1] mb-6">
                Will Your Resume<br />
                Make It Past the{" "}
                <span className="text-[#4299e1]">ATS</span> Bots?
              </h1>
              <p className="text-base text-gray-500 leading-relaxed max-w-md">
                75% of qualified candidates never make it to the interview stage because their resumes
                fail ATS scans. Don&apos;t be one of them. Upload your resume and find out if it will
                survive the digital gatekeepers in just 60 seconds.
              </p>
            </div>

            {/* Right: Upload Card */}
            <div
              className="bg-white rounded-2xl p-10 text-center"
              style={{ boxShadow: "0 4px 40px 0 rgba(60,100,180,0.12), 0 1px 4px 0 rgba(0,0,0,0.04)", border: "1px solid #e8edf5" }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
                Upload Your Resume to See if it Beats the ATS Bots
              </h2>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Our scanner checks for issues in formatting, keywords, and structure that could
                stop your resume from passing.
              </p>

              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc"
                className="hidden"
                id="hero-file-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              />

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label
                    htmlFor="hero-file-upload"
                    className={`inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full text-white font-semibold text-base cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow-lg mb-5 ${
                      isDragging ? "opacity-80 scale-95" : ""
                    }`}
                    style={{ background: "#1a2b4a", minWidth: "260px" }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Your Resume
                  </label>

                  <p className="text-sm text-gray-400 mb-8">or drag and drop it here</p>

                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-xs text-gray-400">Supported formats: PDF.</p>
                    <p className="text-xs text-gray-400 mt-1">Max file size: 5MB.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  {/* File pill — check + truncated name + delete */}
                  <div className="inline-flex items-center gap-3 border border-gray-200 rounded-full px-6 py-3">
                    <Check className="w-4 h-4 text-teal-500 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-medium text-gray-800 max-w-48 truncate">
                      {file.name.replace(/\.[^.]+$/, "")}
                    </span>
                    <button
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Uploaded Successfully */}
                  <p className="text-sm font-semibold text-teal-500">Uploaded Successfully</p>

                  {/* Terms checkbox — user must check manually */}
                  <label className="flex items-start gap-2.5 text-xs text-gray-500 cursor-pointer text-left max-w-xs">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 accent-teal-500 shrink-0 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      I agree to CareerBot&apos;s{" "}
                      <span className="underline">Terms of Service</span>
                      {" "}and{" "}
                      <span className="underline">Privacy Policy</span>
                    </span>
                  </label>

                  {/* Continue button — enabled only after checkbox is checked */}
                  <button
                    onClick={handleScanResume}
                    disabled={isLoading || !agreed}
                    className="inline-flex items-center justify-center gap-2 px-12 py-4 rounded-full text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                    style={{ background: "#14b8a6" }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scanning…</span>
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: 3 Simple Steps ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-3">
            <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">
              how it works
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10">
            3 Simple Steps to Test Your ATS Compatibility
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                num: "1",
                title: "Upload Your Resume",
                desc: "Upload a PDF file, even if it&apos;s not a CareerBot template. Our ATS scanner works with all resume types.",
                icon: <Upload className="w-7 h-7 text-indigo-400" />,
              },
              {
                num: "2",
                title: "Get Your ATS Score",
                desc: "Receive an instant compatibility score showing if your resume would pass or fail real-world ATS systems.",
                icon: (
                  <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
              {
                num: "3",
                title: "Unlock Detailed Insights",
                desc: "See exactly what&apos;s working and what&apos;s not, with personalised recommendations to improve your success rate.",
                icon: <Lightbulb className="w-7 h-7 text-indigo-400" />,
              },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
                  {step.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {step.num}. {step.title}
                </h3>
                <SafeHTML
                  content={step.desc}
                  as="p"
                  className="text-sm text-gray-500 leading-relaxed"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <label
              htmlFor="hero-file-upload"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-sm cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}
            >
              Check Your Resume Now
              <ArrowRight className="w-4 h-4" />
            </label>
          </div>
        </div>
      </section>

      {/* ── Section 4: Choose Your Level ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="mb-3 text-center">
            <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">
              simple options
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">
            Choose Your Level of ATS Insight
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Quick ATS Check */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-1">Quick ATS Check</h3>
              <p className="text-sm text-gray-400 mb-6">no sign-up required</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Basic ATS Compatibility Score",
                  "Primary Formatting Issues Detection",
                  "General ATS Readability Assessment",
                  "Essential AI Recommendations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-gray-500 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <label
                htmlFor="hero-file-upload"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-gray-900 font-semibold text-sm border-2 border-gray-900 cursor-pointer transition-all hover:bg-gray-50"
              >
                Get Basic Score
                <ArrowRight className="w-4 h-4" />
              </label>
            </div>

            {/* Complete ATS Analysis */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "linear-gradient(135deg,#e8f4fd 0%,#dbeafe 100%)", border: "1.5px solid #BFDBFE" }}
            >
              <h3 className="text-2xl font-extrabold text-gray-900 mb-1">Complete ATS Analysis</h3>
              <p className="text-sm text-gray-500 mb-6">get full report to your email</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Detailed ATS Score Across 5 Key Areas",
                  "Keyword Optimization Analysis",
                  "Section-by-Section Feedback",
                  "Format & Structure Evaluation",
                  "Personalized Improvement Suggestions",
                  "Industry-Specific Insights",
                  "One-Click Resume Fix with CareerBot Templates",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <label
                htmlFor="hero-file-upload"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-sm cursor-pointer transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#0d9488,#0891b2)" }}
              >
                Unlock Full Analysis
                <ArrowRight className="w-4 h-4" />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Feature Toolkit ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-2">
          <div className="w-8 h-0.5 bg-teal-400 mb-4" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          The Ultimate{" "}
          <span
            style={{
              background: "linear-gradient(135deg,#0d9488,#0891b2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI Job Search Toolkit
          </span>
        </h2>
        <p className="text-gray-500 mb-10 max-w-xl">
          Get tools and insights for every step of your job search. CareerBot is packed with powerful features and
          valuable guides to help you advance your career.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Sparkles className="w-7 h-7 text-blue-400" />,
              bg: "bg-blue-50",
              title: "AI-Powered Resume Builder",
              desc: "Easily create a tailored resume using AI-driven content suggestions that highlight your abilities and accomplishments for any position.",
            },
            {
              icon: <Heart className="w-7 h-7 text-blue-400" />,
              bg: "bg-blue-50",
              title: "AI-Powered Cover Letter Builder",
              desc: "Instantly generate a personalised cover letter based on your resume, crafted to showcase your strengths and match the job requirements.",
            },
            {
              icon: <FileText className="w-7 h-7 text-blue-400" />,
              bg: "bg-blue-50",
              title: "16+ ATS-Friendly Resume Templates",
              desc: "Choose from over 16 professionally designed, ATS-friendly templates that make your resume stand out to recruiters.",
            },
            {
              icon: <BookOpen className="w-7 h-7 text-blue-400" />,
              bg: "bg-blue-50",
              title: "90+ Inspirational Resume Examples",
              desc: "Access a library of resumes from various industries for inspiration and guidance on how to structure and style your own.",
            },
            {
              icon: <Mail className="w-7 h-7 text-blue-400" />,
              bg: "bg-blue-50",
              title: "16 Cover Letter Templates",
              desc: "Our professional templates are designed to help you stand out from the crowd and impress the hiring manager with a flawless job application.",
            },
            {
              icon: <Lightbulb className="w-7 h-7 text-blue-400" />,
              bg: "bg-blue-50",
              title: "Career Blog",
              desc: "From perfecting your resume to acing interviews: get expert tips, step-by-step guides, and real-world examples to help you advance your career.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div
                className={`w-16 h-16 rounded-xl ${card.bg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200`}
              >
                {card.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-sm">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{card.desc}</p>
              <span className="text-sm text-blue-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Read <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
