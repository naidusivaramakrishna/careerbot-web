"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  RefreshCcw,
  Lightbulb,
  MessageSquare,
  X,
  FileText,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";
import AnalysisContent from "./analysis/AnalysisContent";
import LoadingAnimation from "./ui/LoadingAnimation";
import ErrorPopupModal from "@/components/ErrorPopupModal";

import {
  parseResume,
  parseJDFile,
  parseJDText,
  parseJDUrl,
  matchResumeAndJD,
  getResume,
  getMatchAnalytics,
} from "@/api/parserApi";
import { getExtensionSession } from "@/api/extensionApi";

// Add this function if it's missing in your parserApi
async function getMatchByIds(resume_id: string, jd_id: string) {
  // This should call your API endpoint that fetches match by IDs
  const response = await fetch(`/api/v1/matcher/match?resume_id=${resume_id}&jd_id=${jd_id}`);
  if (!response.ok) throw new Error("Failed to fetch match");
  return response.json();
}

const Overview = ({ sessionId }: { sessionId?: string }) => {
  const leaving = false;

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionResumeId, setSessionResumeId] = useState<string | null>(null);
  const [sessionResumeName, setSessionResumeName] = useState<string | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    error_code?: string;
    credits_required?: number;
    credits_remaining?: number;
  }>({});

  const [processingStage, setProcessingStage] = useState<
    "parsing" | "extracting" | "matching" | "scoring" | "generating"
  >("parsing");

  // Lazy initializers read sessionStorage on first render (no flash)
  const [matchResults, setMatchResults] = useState<any>(() => {
    try {
      const mr = sessionStorage.getItem('jm_matchResults');
      return mr ? JSON.parse(mr) : null;
    } catch { return null; }
  });

  const [parsedResumeData, setParsedResumeData] = useState<any>(() => {
    try {
      const prd = sessionStorage.getItem('jm_parsedResumeData');
      return prd ? JSON.parse(prd) : null;
    } catch { return null; }
  });

  const [_parsedJDData, setParsedJDData] = useState<any>(null);

  const [jdText, setJdText] = useState<string>(() => {
    if (sessionId) return ''; // Extension will set its own jdText
    try { return sessionStorage.getItem('jm_jdText') || ''; } catch { return ''; }
  });

  const [activeTab, setActiveTab] = useState<"upload" | "analysis" | "chat">(() => {
    try {
      if (sessionStorage.getItem('jm_matchResults')) return 'analysis';
    } catch {}
    return 'upload';
  });

  const [error, setError] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdUploadRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAnalyzedRef = useRef(false);
  const [sessionJdId, setSessionJdId] = useState<string | null>(null);

  // Load extension session when redirected from Chrome extension
  useEffect(() => {
    if (!sessionId) return;
    getExtensionSession(sessionId)
      .then((session) => {
        if (session.job_description) setJdText(session.job_description);
        if (session.jd_id) setSessionJdId(session.jd_id);
        if (session.resume_id) {
          // Set resume ID immediately so Analyze button enables right away
          setSessionResumeId(session.resume_id);
          setSessionResumeName("Resume from extension");
          // Fetch actual filename in background (non-blocking)
          getResume(session.resume_id)
            .then((resumeData) => {
              if (resumeData?.file_name) setSessionResumeName(resumeData.file_name);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [sessionId]);

  // Auto-trigger analysis once session data (JD + resume) is ready
  useEffect(() => {
    if (!sessionId) return;
    if (autoAnalyzedRef.current) return;
    if (!sessionResumeId) return;
    // If we have a pre-parsed jd_id from extension, no need to wait for jdText
    if (!sessionJdId && !jdText.trim()) return;

    autoAnalyzedRef.current = true;
    analyzeMatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionResumeId, jdText, sessionJdId]);


  const handleResumeUpload = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Resume must be under 10MB.");
      return;
    }
    setUploadedFile(file);
    setError(null);
  };

  const handleJDFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setJdText(e.target?.result as string);
      setJdFile(file);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read job description file");
    };
    reader.readAsText(file);
  };

  const analyzeMatch = async () => {
    setError(null);

    if (!uploadedFile && !sessionResumeId) return setError("Please upload a resume.");
    if (!sessionJdId && !jdFile && !jdText.trim())
      return setError("Please upload a JD file or paste JD text.");

    setIsProcessing(true);
    setProcessingStage("parsing");

    try {
      // Step 1: Parse Resume (skip if resume_id already provided by extension session)
      let resume_id = sessionResumeId;
      let fullResumeData: any = null;

      if (!resume_id) {
        const resumeParsed = await parseResume(uploadedFile!);
        resume_id =
          resumeParsed?.resume_id ??
          (resumeParsed as any)?.id ??
          (resumeParsed as any)?._id ??
          null;

        if (!resume_id)
          throw new Error("Resume parsing failed — no resume_id returned.");

        setProcessingStage("extracting");

        try {
          fullResumeData = await getResume(resume_id);
        } catch {
          fullResumeData = resumeParsed;
        }
      } else {
        setProcessingStage("extracting");
        try {
          fullResumeData = await getResume(resume_id);
        } catch {
          fullResumeData = null;
        }
      }

      setProcessingStage("matching");

      // Step 2: Use pre-parsed jd_id from extension session (skip re-parsing)
      let jd_id: string | null = sessionJdId ?? null;
      let jdParsed: any = null;

      if (!jd_id) {
        // Parse JD (detect URL, text, or file)
        if (jdText.trim()) {
          const trimmedText = jdText.trim();
          const isUrl = /^https?:\/\/.+/i.test(trimmedText);
          jdParsed = isUrl ? await parseJDUrl(trimmedText) : await parseJDText(trimmedText);
        } else if (jdFile) {
          jdParsed = await parseJDFile(jdFile);
        } else {
          throw new Error("No job description provided");
        }
        jd_id = jdParsed?.jd_id ?? null;
      }

      if (!jd_id)
        return setError("JD parsing failed — no JD ID returned.");

      setProcessingStage("scoring");

      // Step 3: Match Resume and JD (with retry for backend errors)
      let matchResp: any;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          matchResp = await matchResumeAndJD(resume_id, jd_id);
          break; // Success
        } catch (err: any) {
          retryCount++;
          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
            );
          } else {
            throw err; // Max retries exceeded
          }
        }
      }

      let finalMatchData = matchResp.data;

      if (matchResp.duplicate) {
        try {
          const existing = await getMatchByIds(resume_id, jd_id);
          if (Array.isArray(existing)) {
            const matched = existing.find(
              (m: any) =>
                m.jd_id === jd_id || m.job_description_id === jd_id
            );
            finalMatchData = matched || existing[0];
          } else {
            finalMatchData = existing;
          }
        } catch {
          finalMatchData = matchResp.data;
        }
      }

      if (!finalMatchData?.match_id && matchResp.match_id) {
        finalMatchData = { ...finalMatchData, match_id: matchResp.match_id };
      }

      setProcessingStage("generating");

      // Step 4: Get Analytics
      try {
        const analytics = await getMatchAnalytics(resume_id, jd_id);
        if (analytics)
          finalMatchData = { ...finalMatchData, analytics };
      } catch {}

      const newMatchResults = {
        data: finalMatchData,
        match_id: matchResp.match_id || finalMatchData?.match_id,
        jd_id: jd_id,
        duplicate: matchResp.duplicate
      };

      setMatchResults(newMatchResults);
      setParsedResumeData(fullResumeData);
      setParsedJDData(jdParsed);

      // Persist to sessionStorage so page reload stays on analysis tab
      try {
        sessionStorage.setItem('jm_matchResults', JSON.stringify(newMatchResults));
        sessionStorage.setItem('jm_parsedResumeData', JSON.stringify(fullResumeData));
        sessionStorage.setItem('jm_parsedJDData', JSON.stringify(jdParsed));
        sessionStorage.setItem('jm_jdText', jdText);
      } catch {}

      setTimeout(() => {
        setIsProcessing(false);
        setActiveTab("analysis");

        if (containerRef.current) {
          const top =
            containerRef.current.getBoundingClientRect().top +
            window.scrollY -
            80;

          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 1500);
    } catch (err: any) {
      // Parse error message from API response
      let errorMessage = "Something went wrong.";
      let details: any = {};

      if (err?.__raw) {
        // Handle error from safePost/safeGet helpers
        const raw = err.__raw;
        if (typeof raw === 'object') {
          const msg = raw.message || raw.error?.message || raw.error || raw.detail;
          // Ensure we have a string, not an object
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(raw);

          // Extract error details
          details.error_code = raw.error_code || raw.error?.error_code;
          if (raw.details) {
            details.credits_required = raw.details.credits_required;
            details.credits_remaining = raw.details.credits_remaining;
          } else if (raw.error?.details) {
            details.credits_required = raw.error.details.credits_required;
            details.credits_remaining = raw.error.details.credits_remaining;
          }
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            const msg = parsed.message || parsed.error?.message || parsed.error || parsed.detail;
            errorMessage = typeof msg === 'string' ? msg : raw;

            // Extract error details
            details.error_code = parsed.error_code || parsed.error?.error_code;
            if (parsed.details) {
              details.credits_required = parsed.details.credits_required;
              details.credits_remaining = parsed.details.credits_remaining;
            } else if (parsed.error?.details) {
              details.credits_required = parsed.error.details.credits_required;
              details.credits_remaining = parsed.error.details.credits_remaining;
            }
          } catch {
            errorMessage = raw;
          }
        }
      } else if (err?.message) {
        // Try to parse JSON from error message
        try {
          const parsed = JSON.parse(err.message);
          const msg = parsed.message || parsed.error?.message || parsed.error || parsed.detail;
          errorMessage = typeof msg === 'string' ? msg : err.message;

          // Extract error details
          details.error_code = parsed.error_code || parsed.error?.error_code;
          if (parsed.details) {
            details.credits_required = parsed.details.credits_required;
            details.credits_remaining = parsed.details.credits_remaining;
          } else if (parsed.error?.details) {
            details.credits_required = parsed.error.details.credits_required;
            details.credits_remaining = parsed.error.details.credits_remaining;
          }
        } catch {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setErrorDetails(details);
      setIsProcessing(false);
    }
  };

  // ── ANALYSIS MODE: full-page layout, no nested containers ──
  if (!isProcessing && activeTab === "analysis" && matchResults) {
    return (
      <>
        <AnalysisContent
          jdText={jdText}
          parsedResumeData={parsedResumeData}
          matchResults={matchResults}
          onBackToUpload={() => setActiveTab("upload")}
        />
        <ErrorPopupModal
          error={error}
          onRetry={() => { setError(null); setErrorDetails({}); }}
          onClose={() => { setError(null); setErrorDetails({}); }}
          details={errorDetails}
        />
      </>
    );
  }

  // ── UPLOAD / EMPTY ANALYSIS / CHAT / LOADING modes ──
  return (
    <>
      <main className={`min-h-1/2 pt-6 bg-white transition-all duration-200 ${leaving ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"}`}>
        <div className="pl-6 pr-8 pb-8">
          {isProcessing ? (
            <LoadingAnimation stage={processingStage} />
          ) : (
            <div className="bg-gray-100 rounded-3xl p-8">
              <div ref={containerRef} className="bg-white rounded-2xl px-8 pt-6 pb-14">
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-[26px] font-bold flex items-center gap-2">
                    Resume <span className="text-[#BDBDBD]">↔</span> Job Match
                  </h2>
                  <p className="text-[15px] text-gray-500">
                    Upload your resume and a job description to get an instant AI-powered match analysis.
                  </p>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8">
                  {([
                    { key: "upload",   label: "Upload",   icon: <Upload className="w-4 h-4" /> },
                    { key: "analysis", label: "Analysis", icon: <RefreshCcw className="w-4 h-4" /> },
                    { key: "chat",     label: "AI Chat",  icon: <MessageSquare className="w-4 h-4" /> },
                  ] as const).map(({ key, label, icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-1.5 px-5 py-3 text-sm border-b-2 transition-all -mb-px ${
                        activeTab === key ? "border-[#2557a7] text-[#2557a7] font-semibold" : "border-transparent text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >{icon}{label}</button>
                  ))}
                </div>

                {/* Upload tab */}
                {activeTab === "upload" && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                      <div className="bg-white border border-gray-300 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-gray-700">Your Resume</p>
                          {!uploadedFile && !sessionResumeId && (
                            <button onClick={() => resumeInputRef.current?.click()} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">Browse</button>
                          )}
                        </div>
                        <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} />
                        {uploadedFile || sessionResumeId ? (
                          <div className="h-65 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center gap-3">
                            <div className="flex items-center gap-2"><CheckCircle className="text-emerald-500 w-5 h-5" /><p className="text-sm font-semibold text-emerald-700">{sessionResumeId && !uploadedFile ? "Resume from Extension" : "Resume Uploaded"}</p></div>
                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-xl shadow-sm flex items-center gap-3 max-w-55 w-full mx-6">
                              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-800 truncate">{uploadedFile ? uploadedFile.name : sessionResumeName}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : "From extension"}</p>
                              </div>
                              <button onClick={() => { setUploadedFile(null); setSessionResumeId(null); setSessionResumeName(null); }} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                            <button onClick={() => resumeInputRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"><RefreshCcw className="w-3 h-3" /> Replace Resume</button>
                          </div>
                        ) : (
                          <div onClick={() => resumeInputRef.current?.click()} className="h-65 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200 group">
                            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors"><Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" /></div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700"><span className="text-[#2557a7]">Click to upload</span> or drag & drop</p>
                              <p className="text-xs text-gray-400 mt-1">PDF · DOC · TXT — up to 10 MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="hidden lg:flex flex-col items-center justify-center pt-32.5 gap-2">
                        <div className="w-11 h-11 rounded-full bg-blue-100 border border-blue-200 shadow-md shadow-blue-100 flex items-center justify-center ring-4 ring-blue-50"><ArrowRight className="w-5 h-5 text-blue-600" /></div>
                        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest text-center leading-tight">AI<br/>Match<br/>Engine</p>
                      </div>
                      <div className="bg-white border border-gray-300 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-gray-700">Job Description</p>
                          <div className="flex gap-2">
                            <input ref={jdUploadRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && handleJDFileUpload(e.target.files[0])} />
                            <button onClick={() => jdUploadRef.current?.click()} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1"><Upload className="w-3 h-3" /> Upload file</button>
                          </div>
                        </div>
                        {!jdFile && (<div className="flex items-center gap-1.5 mb-2"><Sparkles className="w-3 h-3 text-violet-500" /><p className="text-[11px] text-violet-600 font-medium">AI will analyze this job description</p></div>)}
                        {jdFile ? (
                          <div className="h-50 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center gap-3">
                            <div className="flex items-center gap-2"><CheckCircle className="text-emerald-500 w-5 h-5" /><p className="text-sm font-semibold text-emerald-700">JD Uploaded</p></div>
                            <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg text-xs shadow-sm"><FileText className="w-4 h-4 text-blue-500" /><span className="font-medium text-gray-700 max-w-40 truncate">{jdFile.name}</span><button onClick={() => setJdFile(null)} className="text-gray-300 hover:text-red-500 ml-1"><X className="w-3.5 h-3.5" /></button></div>
                          </div>
                        ) : (
                          <textarea value={jdText} onChange={(e) => { setJdText(e.target.value); setJdFile(null); }} placeholder={"Paste job description text or URL…\n\nExample:\nAI Developer — Python, ML, FastAPI\nhttps://linkedin.com/jobs/view/…"} className="w-full h-50 border border-gray-200 rounded-xl p-3 bg-gray-50/50 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white resize-none transition-all" />
                        )}
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3"><Lightbulb className="text-blue-500 w-3.5 h-3.5 mt-0.5 shrink-0" /><p className="text-xs text-blue-700">Paste job description text, a job posting URL, or upload a file</p></div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button onClick={analyzeMatch} disabled={isProcessing || (!uploadedFile && !sessionResumeId) || (!jdFile && !jdText.trim())}
                        className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-sm ${
                          isProcessing ? "bg-blue-400 cursor-not-allowed"
                          : (!uploadedFile && !sessionResumeId) || (!jdFile && !jdText.trim()) ? "bg-gray-300 cursor-not-allowed shadow-none"
                          : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md hover:scale-[1.01]"
                        }`}
                      >
                        {isProcessing ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Analyzing…</>)
                          : (<><Sparkles className="w-4 h-4" />Analyze Match<ArrowRight className="w-4 h-4" /></>)}
                      </button>
                    </div>
                  </>
                )}

                {/* Analysis — no results */}
                {activeTab === "analysis" && !matchResults && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <RefreshCcw className="w-14 h-14 text-gray-300 mb-4" />
                    <p className="text-lg font-semibold text-gray-700">No analysis yet</p>
                    <p className="text-sm text-gray-500 mt-1 mb-6">Upload your resume and job description, then click Analyze Match.</p>
                    <button onClick={() => setActiveTab("upload")} className="px-5 py-2 bg-[#2557a7] text-white text-sm rounded-xl hover:bg-[#1a4a8f]">Go to Upload</button>
                  </div>
                )}

                {/* Chat */}
                {activeTab === "chat" && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">AI Chat coming soon…</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <ErrorPopupModal
        error={error}
        onRetry={() => { setError(null); setErrorDetails({}); }}
        onClose={() => { setError(null); setErrorDetails({}); }}
        details={errorDetails}
      />
    </>
  );
};

export default Overview;
