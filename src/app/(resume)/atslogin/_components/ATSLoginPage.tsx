"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { processResumeComplete } from "@/api/resumeatsapi";

enum AnalysisPhase {
  Uploading = "Uploading resume...",
  Parsing = "Parsing content...",
  Analyzing = "Analyzing content...",
  Generating = "Generating report...",
  Complete = "Complete!",
}

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

  const steps = [
    { label: "Uploading resume", phase: AnalysisPhase.Uploading },
    { label: "Parsing content", phase: AnalysisPhase.Parsing },
    { label: "Analyzing keywords", phase: AnalysisPhase.Analyzing },
    { label: "Generating report", phase: AnalysisPhase.Generating },
  ];

  const circumference = 2 * Math.PI * 40;
  const phases = Object.values(AnalysisPhase).filter(
    (p) => p !== AnalysisPhase.Complete
  );
  const rawIndex = phases.findIndex((p) => p === phase);
  const stepIndex = rawIndex === -1 ? 0 : rawIndex;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 96 96"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#EEF2FF"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{progress}%</span>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Analyzing Your Resume
          </h3>
          <p className="text-blue-600 text-sm font-medium mb-8">
            {phase || "Processing..."}
          </p>

          <div className="space-y-3 mb-6">
            {steps.map((step, idx) => {
              const isCompleted = stepIndex > idx;
              const isActive = stepIndex === idx;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 text-xs font-bold ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isCompleted
                        ? "text-emerald-600"
                        : isActive
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400">Usually takes 30–60 seconds</p>
        </div>
      </div>
    </div>
  );
}

export default function ATSLoginPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<AnalysisPhase | "">("");
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError("");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["pdf", "docx", "doc"];

    if (!allowed.includes(ext)) {
      setError("Invalid file type. Only PDF, DOCX, and DOC are allowed.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds 10MB. Please upload a smaller file.");
      return;
    }

    setFile(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
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
        let errorMessage = "Upload failed";
        if (result && typeof result === "object" && "error" in result) {
          const errorObj = (result as Record<string, unknown>).error;
          if (typeof errorObj === "object" && errorObj !== null && "message" in errorObj) {
            errorMessage = String((errorObj as Record<string, unknown>).message);
          } else if (typeof errorObj === "string") {
            errorMessage = errorObj;
          }
        }
        throw new Error(errorMessage);
      }

      setProgress(100);
      setLoadingPhase(AnalysisPhase.Complete);

      const resumeId = "resume_id" in result ? result.resume_id : "";
      setTimeout(() => {
        router.push(`/atslogin/report?resume_id=${resumeId}`);
      }, 600);
    } catch (err: unknown) {
      let errorMessage = "Unable to process your resume. Please try again.";

      if (err instanceof Error) {
        // Try to parse JSON from error message
        try {
          const parsed = JSON.parse(err.message);
          const msg = parsed.message || parsed.error?.message || parsed.error || parsed.detail;
          errorMessage = typeof msg === "string" ? msg : err.message;
        } catch {
          // If JSON parsing fails, use error message as is
          errorMessage = err.message || errorMessage;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
      setProgress(0);
      setLoadingPhase("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <style>{`
        @keyframes premium-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2); }
          50% { box-shadow: 0 0 30px rgba(79, 70, 229, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .premium-glow {
          animation: premium-glow 3s ease-in-out infinite;
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
        @keyframes float-blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        .float-blob {
          animation: float-blob 6s ease-in-out infinite;
        }
      `}</style>

      <LoadingModal isOpen={isLoading} phase={loadingPhase} progress={progress} />

      <main className="py-6">
        <div className="bg-gray-200 py-3 rounded-tl-[20px] rounded-bl-[20px]">
          <div className="px-6">
            <div className="mb-5">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                Optimize Your Resume for ATS
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Get instant AI-powered analysis to ensure your resume passes
                applicant tracking systems and reaches hiring managers.
              </p>
            </div>

          {/* Error Modal Popup */}
          {error && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Error</h3>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
                <button
                  onClick={() => setError("")}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-4 lg:col-span-3">
              {/* Score Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h4 className="text-lg font-bold text-gray-900 mb-2">Resume Match Score</h4>
                <div className="flex gap-4 items-center">
                  <div className="flex-shrink-0">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full" viewBox="0 0 180 180">
                        <circle cx="90" cy="90" r="80" fill="none" stroke="#e8eff9" strokeWidth="10" />
                        <circle cx="90" cy="90" r="80" fill="none" stroke="#2557a7" strokeWidth="10"
                          strokeDasharray="251.2" strokeDashoffset="61" strokeLinecap="round" transform="rotate(-90 90 90)" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-5xl font-bold text-gray-900">51%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">MATCH SCORE</p>
                    <h5 className="text-xl font-bold text-gray-900 mb-1">51% Match Rate</h5>
                    <p className="text-gray-700 mb-1 leading-tight text-xs">Your resume matches 51% of job requirements.</p>
                    <ul className="text-gray-700 mb-1 text-xs space-y-0.5">
                      <li className="flex gap-1.5"><span>•</span><span>Adding missing technical keywords</span></li>
                      <li className="flex gap-1.5"><span>•</span><span>Expanding measurable achievements</span></li>
                      <li className="flex gap-1.5"><span>•</span><span>Optimizing formatting for ATS</span></li>
                    </ul>
                    <p className="text-gray-600 mb-1 text-xs">A score above 75% significantly increases interview chances.</p>
                    <button className="px-4 py-1.5 bg-[#2557a7] hover:bg-[#1a4a8f] text-white font-bold rounded transition-all text-xs">
                      Download ATS Report
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mt-2 pt-2 border-t border-gray-100">
                  {[
                    { label: "ATS Compatibility", value: "89%", width: "89%" },
                    { label: "Technical Skills",  value: "31%", width: "31%" },
                    { label: "Soft Skills",        value: "7%",  width: "7%"  },
                    { label: "Industry Relevance", value: "75%", width: "75%" },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-xs font-bold text-gray-700 mb-1">{m.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{m.value}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-[#2557a7]" style={{ width: m.width }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Did You Know */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Did You Know?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { emoji: "📄", stat: "75%",   text: "of resumes never reach a human" },
                      { emoji: "⏱️", stat: "6 sec", text: "average recruiter scan time" },
                      { emoji: "🚀", stat: "3×",    text: "more interviews with optimized resume" },
                    ].map((d) => (
                      <div key={d.stat} className="bg-[#f0f5ff] rounded-xl p-4 text-center border border-[#dce8f8]">
                        <div className="text-3xl mb-2">{d.emoji}</div>
                        <p className="text-xl font-bold text-[#2557a7]">{d.stat}</p>
                        <p className="text-xs text-gray-600 leading-snug mt-1">{d.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Best Practices + Common Issues */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#e8eff9] rounded-lg">
                      <Check className="h-5 w-5 text-[#2557a7]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">ATS Best Practices</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {["Use standard fonts and simple formatting","Include relevant industry keywords","Use bullet points for easy parsing","Maintain consistent spacing and margins"].map((t) => (
                      <li key={t} className="flex gap-2.5 text-sm">
                        <span className="text-[#2557a7] font-bold flex-shrink-0">✓</span>
                        <span className="text-gray-700">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Common Issues to Avoid</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {["Scanned or image-based PDFs","Complex layouts, tables, or graphics","Unusual fonts or heavy formatting","Employment gaps without explanation"].map((t) => (
                      <li key={t} className="flex gap-2.5 text-sm">
                        <span className="text-gray-400 font-bold flex-shrink-0">✕</span>
                        <span className="text-gray-700">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Upload Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-6 text-center transition-all cursor-pointer ${
                      isDragging ? "bg-[#f0f5ff] border-[#2557a7]" : "bg-gray-50 hover:bg-[#f8faff]"
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all ${
                      isDragging ? "bg-[#dce8f8] scale-110" : "bg-[#e8eff9]"
                    }`}>
                      <Upload className="h-8 w-8 text-[#2557a7]" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h3>
                    <p className="text-gray-600 mb-4 font-medium">Drag and drop your resume here or click to browse</p>
                    <p className="text-sm text-gray-500 mb-6 font-medium">PDF, DOCX, DOC • Up to 10 MB</p>
                    <input type="file" onChange={handleFileChange} accept=".pdf,.docx,.doc" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="inline-block px-8 py-3 bg-[#2557a7] hover:bg-[#1a4a8f] text-white font-bold rounded-xl cursor-pointer transition-all">
                      Browse Files
                    </label>
                  </div>
                ) : (
                  <div className="p-8 space-y-4 flex flex-col">
                    <div className="flex items-center gap-4 p-4 bg-[#f0f5ff] rounded-xl border border-[#dce8f8]">
                      <div className="flex-shrink-0 p-3 bg-[#e8eff9] rounded-lg">
                        <FileText className="h-6 w-6 text-[#2557a7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{file.name}</p>
                        <p className="text-sm text-gray-600 font-medium">{formatFileSize(file.size)}</p>
                      </div>
                      <button onClick={handleRemoveFile} disabled={isLoading} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-grow flex items-center justify-center py-6 text-center">
                      <div>
                        <p className="text-gray-700 font-medium mb-2">Ready to optimize your resume?</p>
                        <p className="text-sm text-gray-500">Get instant AI-powered feedback in 30-60 seconds</p>
                      </div>
                    </div>

                    <button onClick={handleScanResume} disabled={isLoading}
                      className="w-full py-4 px-8 bg-[#2557a7] hover:bg-[#1a4a8f] text-white font-bold rounded-xl text-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <><Loader2 className="h-6 w-6 animate-spin" /><span>Scanning Resume...</span></>
                      ) : (
                        <><Sparkles className="h-6 w-6" /><span>Analyze Resume</span></>
                      )}
                    </button>

                    {!isLoading && (
                      <button onClick={handleRemoveFile} className="w-full text-sm text-gray-500 hover:text-[#2557a7] font-semibold transition-colors">
                        Change file
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* What You Get */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resume Analysis Includes</h3>
                <ul className="space-y-3">
                  {[
                    { title: "ATS Compatibility Score",  sub: "See your resume's effectiveness rating" },
                    { title: "Keyword Optimization",     sub: "Identify missing keywords to boost visibility" },
                    { title: "Format Analysis",          sub: "Check for ATS-friendly formatting issues" },
                    { title: "Detailed Feedback",        sub: "Get specific recommendations to improve" },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3 text-sm">
                      <span className="text-[#2557a7] font-bold flex-shrink-0">✓</span>
                      <div>
                        <p className="font-bold text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="bg-[#f0f5ff] rounded-lg p-4 mt-4 border border-[#dce8f8]">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <strong className="font-bold text-[#2557a7]">Pro Tip:</strong> Text-based resumes work best. Scanned PDFs and images can&apos;t be parsed by ATS systems.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
        </div>

      </main>
    </div>
  );
}
