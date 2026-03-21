"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
  Check,
  Upload,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.18) 0%,rgba(99,102,241,0.18) 100%)", backdropFilter: "blur(12px)" }}>

      {/* fix #7: shadow-xl + subtle gradient bg */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(180deg,#ffffff 0%,#F8FAFF 100%)", boxShadow: "0 24px 64px 0 rgba(37,99,235,0.18), 0 2px 8px 0 rgba(0,0,0,0.06)" }}>
        <div className="h-1.5 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <div className="px-10 pt-8 pb-8">
          <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-blue-200 opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-200 opacity-20 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">

            {/* fix #1: ring with stronger glow on active arc */}
            <div className="relative mb-5" style={{ width: 176, height: 176 }}>
              {!isComplete && (
                <span className="absolute inset-2 rounded-full bg-blue-50/40 animate-ping opacity-10" />
              )}
              <svg width="176" height="176" viewBox="0 0 120 120" className="-rotate-90"
                role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#E8EDFF" strokeWidth={strokeWidth} />
                <circle cx="60" cy="60" r={radius} fill="none" stroke="url(#ringGrad)" strokeWidth={strokeWidth}
                  strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  filter="url(#glow)" className="transition-all duration-700 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                {isComplete ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold leading-none"
                      style={{ background: "linear-gradient(135deg,#2563EB,#6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {progress}%
                    </span>
                    {/* fix #2: larger + darker "scanning" label */}
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500 mt-0.5">scanning</span>
                  </>
                )}
              </div>
            </div>

            <h3 className="text-[1.35rem] font-bold text-gray-900 leading-tight mb-1">
              {isComplete ? "Analysis Complete!" : "Analyzing Your Resume"}
            </h3>

            {/* fix #8: shorter, sharper microcopy */}
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              {isComplete
                ? "Your personalised ATS report is ready to view."
                : "Scanning for ATS issues and missing keywords."}
            </p>

            {/* fix #5: reduced opacity dots so they don't compete */}
            {!isComplete && (
              <div className="flex items-center gap-1.5 mb-5 opacity-50">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
            {isComplete && <div className="mb-5" />}

            {/* fix #3 + #4: active row gets bg tint, inactive clearly dimmed */}
            <div className="w-full text-left mb-5">
              {steps.map((step, idx) => {
                const done = isComplete || stepIndex > idx;
                const active = !isComplete && stepIndex === idx;
                return (
                  <div key={idx} className="flex items-stretch gap-3.5">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-500 ${
                        done
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                          : active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-300/60"
                          : "bg-gray-100 text-gray-300"}`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <span>{idx + 1}</span>}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-px flex-1 my-1 rounded-full transition-colors duration-500 ${done ? "bg-emerald-200" : "bg-gray-100"}`} />
                      )}
                    </div>
                    {/* active row: subtle blue tint background */}
                    <div className={`flex items-center gap-2 pb-4 flex-1 rounded-lg transition-all duration-300 ${
                      idx === steps.length - 1 ? "pb-0" : ""} ${active ? "px-2 -mx-2 bg-blue-50/60" : ""}`}>
                      <span className={`text-sm transition-all duration-300 ${
                        done ? "font-medium text-emerald-600"
                          : active ? "font-semibold text-blue-700"
                          : "font-normal text-gray-300"}`}>
                        {step.label}
                      </span>
                      {active && (
                        <span className="flex gap-0.5 items-center opacity-60">
                          {[0, 100, 200].map((d) => (
                            <span key={d} className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </span>
                      )}
                      {done && <span className="text-xs text-emerald-500 font-semibold ml-0.5">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* fix #6: higher contrast time estimate */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100/80 rounded-xl px-4 py-2.5 w-full justify-center">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
   Score Preview (right panel)
───────────────────────────────────────────── */
function ScorePreview() {
  const [score, setScore] = useState(42);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const circum = 2 * Math.PI * 40;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated) {
        setAnimated(true);
        let cur = 42;
        const tick = () => {
          cur = Math.min(cur + 1, 92);
          setScore(cur);
          if (cur < 92) requestAnimationFrame(tick);
        };
        setTimeout(() => requestAnimationFrame(tick), 500);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [animated]);

  const pct = score / 100;

  return (
    <div ref={ref} className="flex flex-col items-center gap-5 select-none w-full max-w-[280px] mx-auto">

      {/* Score cards row */}
      <div className="flex items-center gap-4 w-full">
        {/* Before — fix #3: faded/muted */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 opacity-70">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Before</span>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 96 96" className="w-16 h-16 -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#FEE2E2" strokeWidth="7" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="#FCA5A5" strokeWidth="7"
                strokeLinecap="round" strokeDasharray={circum} strokeDashoffset={circum * (1 - 0.42)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-red-400">42</span>
          </div>
          <span className="text-[10px] font-semibold text-red-300">Rejected</span>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span className="text-[9px] font-extrabold text-blue-500">+50 pts</span>
        </div>

        {/* After — fix #3: strong glow, prominent */}
        <div className="flex-1 bg-white rounded-2xl p-4 flex flex-col items-center gap-2"
          style={{ boxShadow: "0 0 0 2px #93C5FD, 0 6px 28px 0 rgba(59,130,246,0.22)" }}>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">After</span>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 96 96" className="w-16 h-16 -rotate-90">
              <defs>
                <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <circle cx="48" cy="48" r="40" fill="none" stroke="#DBEAFE" strokeWidth="8" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="url(#sg)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circum}
                strokeDashoffset={circum * (1 - pct)}
                style={{ transition: "stroke-dashoffset 0.03s linear" }} />
            </svg>
            {score >= 90 && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-10"
                style={{ background: "radial-gradient(circle,rgba(99,102,241,0.5) 0%,transparent 70%)" }} />
            )}
            <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-blue-600">
              {score}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-blue-500">
            {score >= 90 ? "🎉 Interview!" : "Improving…"}
          </span>
        </div>
      </div>

      {/* What changes — fix #5: stronger contrast, larger checks */}
      <div className="w-full bg-white rounded-2xl border border-gray-200/70 px-4 py-3.5 space-y-2.5"
        style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)" }}>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">What AI fixes for you</p>
        {[
          { label: "Missing keywords added", color: "bg-blue-500" },
          { label: "Format issues corrected", color: "bg-indigo-500" },
          { label: "Section headers optimised", color: "bg-violet-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
            <span className="text-xs text-gray-700 font-medium">{item.label}</span>
            <div className="ml-auto">
              <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step Indicator  (fix #4 — stronger hierarchy)
───────────────────────────────────────────── */
function StepIndicator({ active }: { active: 0 | 1 | 2 }) {
  const steps = ["Upload", "Analyse", "Improve"];
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-300 ${
            i < active
              ? "bg-emerald-100 text-emerald-700 font-semibold"
              : i === active
              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-300"
              : "bg-gray-100 text-gray-300 font-medium"}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i < active ? "bg-emerald-200 text-emerald-700"
                : i === active ? "bg-white/25 text-white"
                : "bg-gray-200 text-gray-400"}`}>
              {i < active ? "✓" : i + 1}
            </span>
            {step}
          </div>
          {i < 2 && <div className={`w-5 h-px shrink-0 ${i < active ? "bg-emerald-200" : "bg-gray-200"}`} />}
        </div>
      ))}
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<AnalysisPhase | "">("");
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (f: File) => {
    setError("");
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx", "doc"].includes(ext)) {
      setError("Invalid file type. Only PDF, DOCX, and DOC are allowed."); return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB. Please upload a smaller file."); return;
    }
    setFile(f);
  };

  const handleRemoveFile = () => { setFile(null); setError(""); };

  const handleScanResume = async () => {
    if (!file) return;
    setError(""); setIsLoading(true); setProgress(0);
    try {
      setLoadingPhase(AnalysisPhase.Uploading); setProgress(30);
      const result = await processResumeComplete(file);
      setProgress(70); setLoadingPhase(AnalysisPhase.Analyzing);
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
      setProgress(100); setLoadingPhase(AnalysisPhase.Complete);
      const resumeId = "resume_id" in result ? result.resume_id : "";
      setTimeout(() => router.push(`/atslogin/report?resume_id=${resumeId}`), 600);
    } catch (err: unknown) {
      let msg = "Unable to process your resume. Please try again.";
      if (err instanceof Error) {
        try {
          const p = JSON.parse(err.message);
          const m = p.message || p.error?.message || p.error || p.detail;
          msg = typeof m === "string" ? m : err.message;
        } catch { msg = err.message || msg; }
      }
      setError(msg); setIsLoading(false); setProgress(0); setLoadingPhase("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024, sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  /* ── shared right panel ── */
  const RightPanel = () => (
    <div className="hidden lg:flex items-center justify-center p-10 bg-linear-to-br from-slate-50 to-blue-50/40 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle,#6366F1 0%,transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle,#3B82F6 0%,transparent 70%)" }} />
      <ScorePreview />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-linear-to-b from-blue-50 via-indigo-50/50 to-white">
      <LoadingModal isOpen={isLoading} phase={loadingPhase} progress={progress} />

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-xl"><AlertCircle className="h-6 w-6 text-red-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
            <button onClick={() => setError("")}
              className="w-full py-3 bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold rounded-xl transition-all">
              Close
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6">

        {/* ── Hero — fix #5 tighter spacing ── */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Zap className="w-3 h-3" />
            AI-Powered ATS Scanner
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2.5 leading-[1.1]">
            Stop Getting Rejected by ATS —{" "}
            <span style={{ background: "linear-gradient(135deg,#2563EB,#4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Fix Your Resume in Seconds
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
            See exactly what&apos;s blocking your resume and{" "}
            <span className="font-semibold text-gray-700">fix it instantly with AI.</span>
          </p>
        </div>

        {/* ── Upload Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-7"
          style={{ boxShadow: "0 8px 40px 0 rgba(37,99,235,0.09), 0 1px 4px 0 rgba(0,0,0,0.05)" }}>

          {!file ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
              {/* Left */}
              <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
                <StepIndicator active={0} />

                <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Your Resume</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Drop your file and get an instant ATS score with AI-powered improvement suggestions.
                </p>

                {/* Drag & Drop Zone — fix #1: thinner border + inner shadow + glow hover */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border border-blue-400 bg-blue-50/80 shadow-[inset_0_1px_4px_rgba(59,130,246,0.1),0_0_0_4px_rgba(59,130,246,0.12)]"
                      : "border border-blue-150 bg-linear-to-br from-blue-50/40 to-indigo-50/20 hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-[inset_0_1px_3px_rgba(59,130,246,0.07),0_0_0_3px_rgba(59,130,246,0.06)]"
                  }`}
                  style={{ borderColor: isDragging ? "#93C5FD" : "#DBEAFE" }}
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* fix #6: icon box micro-interaction */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isDragging ? "bg-blue-200 scale-110 rotate-3" : "bg-blue-100 group-hover:bg-blue-200"}`}>
                      <Upload className={`w-6 h-6 transition-all duration-300 ${isDragging ? "text-blue-700 -translate-y-1" : "text-blue-600"}`} />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800 mb-0.5 text-base">
                        {isDragging ? "Drop your resume here 🚀" : "Drag & drop your resume here"}
                      </p>
                      <p className="text-xs text-gray-400">or click below to browse files</p>
                    </div>

                    <input type="file" onChange={handleFileChange} accept=".pdf,.docx,.doc" className="hidden" id="file-upload" />

                    {/* fix #2: CTA — deeper gradient + glow + arrow slide */}
                    <label htmlFor="file-upload"
                      className="group relative w-full max-w-xs py-3 px-6 text-white font-semibold rounded-xl cursor-pointer text-sm text-center
                        hover:scale-[1.03] active:scale-[0.98] transition-all duration-200
                        flex items-center justify-center gap-2 overflow-hidden
                        shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-400/40"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #4338CA 100%)" }}>
                      <span className="relative z-10 flex items-center gap-2">
                        Scan Resume for ATS Issues
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                      </span>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 55%)" }} />
                    </label>

                    <p className="text-xs text-blue-600 font-semibold">⚡ Takes &lt; 10 seconds</p>
                  </div>
                </div>

                {/* Trust signals — fix #7 + tighter gap to upload box */}
                <div className="flex flex-wrap gap-5 mt-3">
                  {[
                    { icon: Shield, text: "Your data is secure" },
                    { icon: Check, text: "No signup required" },
                    { icon: FileText, text: "PDF & DOCX supported" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                      <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <RightPanel />
            </div>
          ) : (
            /* File selected */
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
              <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
                <StepIndicator active={1} />

                <h2 className="text-xl font-bold text-gray-900 mb-5">Ready to Analyse</h2>

                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-5">
                  <div className="shrink-0 p-3 bg-blue-100 rounded-xl">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button onClick={handleRemoveFile} disabled={isLoading}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <button onClick={handleScanResume} disabled={isLoading}
                  className="group relative w-full py-3.5 px-6 text-white font-semibold rounded-xl text-sm
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center justify-center gap-2
                    shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-400/40
                    hover:scale-[1.02] active:scale-[0.99] mb-3 overflow-hidden"
                  style={{ background: isLoading ? "#2563EB" : "linear-gradient(135deg, #2563EB 0%, #4338CA 100%)" }}>
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /><span>Scanning…</span></>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Analyse Resume &amp; Get Score</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 55%)" }} />
                </button>

                {!isLoading && (
                  <button onClick={handleRemoveFile}
                    className="w-full py-2.5 text-sm text-gray-500 hover:text-blue-600 font-medium border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200">
                    Change file
                  </button>
                )}
              </div>

              <RightPanel />
            </div>
          )}
        </div>

        {/* ── Feature Cards ── */}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">What&apos;s included</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
          {[
            {
              bg: "bg-blue-100", icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>),
              title: "ATS Score Breakdown",
              desc: "See exactly why your resume fails filters — section by section.",
            },
            {
              bg: "bg-teal-100", icon: (
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>),
              title: "Missing Keywords Finder",
              desc: "Match your resume to job descriptions and instantly close keyword gaps.",
            },
            {
              bg: "bg-green-100", icon: (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>),
              title: "Formatting Fix Suggestions",
              desc: "Make your resume readable by ATS bots with targeted format corrections.",
            },
          ].map((card) => (
            <div key={card.title}
              className="group p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex gap-4 items-start cursor-default">
              <div className={`shrink-0 w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200`}>
                {card.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pro Tip — fix #6: softer tint + border ── */}
        <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-xl px-5 py-3.5">
          <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-700/80">
            <span className="font-semibold text-blue-700">Pro Tip:</span>{" "}
            Text-based resumes work best. Scanned PDFs and images can&apos;t be parsed by ATS systems.
          </p>
        </div>

      </main>
    </div>
  );
}
