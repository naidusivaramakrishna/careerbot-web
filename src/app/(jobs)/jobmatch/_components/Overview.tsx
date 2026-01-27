"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  RefreshCcw,
  Lightbulb,
  MessageSquare,
  X,
  FileText,
  CheckCircle,
} from "lucide-react";
import Card from "./ui/Card";
import Tab from "./ui/Tab";
import AnalysisContent from "./analysis/AnalysisContent";
import LoadingAnimation from "./ui/LoadingAnimation";

import {
  parseResume,
  parseJDFile,
  parseJDText,
  parseJDUrl,
  matchResumeAndJD,
  getResume,
  getMatchAnalytics,
} from "@/api/parserApi";

// Add this function if it's missing in your parserApi
async function getMatchByIds(resume_id: string, jd_id: string) {
  // This should call your API endpoint that fetches match by IDs
  const response = await fetch(`/api/v1/matcher/match?resume_id=${resume_id}&jd_id=${jd_id}`);
  if (!response.ok) throw new Error("Failed to fetch match");
  return response.json();
}

const Overview = () => {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [processingStage, setProcessingStage] = useState<
    "parsing" | "extracting" | "matching" | "scoring" | "generating"
  >("parsing");

  const [activeTab, setActiveTab] = useState<
    "upload" | "analysis" | "chat"
  >("upload");

  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [parsedJDData, setParsedJDData] = useState<any>(null);
  const [matchResults, setMatchResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdUploadRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (href: string) => {
    if (href === "/ats") {
      setLeaving(true);
      setTimeout(() => router.push(href), 220);
    } else {
      router.push(href);
    }
  };

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

    if (!uploadedFile) return setError("Please upload a resume.");
    if (!jdFile && !jdText.trim())
      return setError("Please upload a JD file or paste JD text.");

    setIsProcessing(true);
    setProcessingStage("parsing");

    try {
      // Step 1: Parse Resume
      const resumeParsed = await parseResume(uploadedFile);
      const resume_id =
        resumeParsed?.resume_id ??
        resumeParsed?.id ??
        resumeParsed?._id ??
        null;

      if (!resume_id)
        throw new Error("Resume parsing failed — no resume_id returned.");

      setProcessingStage("extracting");

      let fullResumeData;
      try {
        fullResumeData = await getResume(resume_id);
      } catch {
        fullResumeData = resumeParsed;
      }

      setProcessingStage("matching");

      // Step 2: Parse JD (detect URL, text, or file)
      let jdParsed;
      if (jdText.trim()) {
        const trimmedText = jdText.trim();
        // Check if input is a URL
        const isUrl = /^https?:\/\/.+/i.test(trimmedText);

        if (isUrl) {
          // Parse as URL
          jdParsed = await parseJDUrl(trimmedText);
        } else {
          // Parse as text
          jdParsed = await parseJDText(trimmedText);
        }
      } else if (jdFile) {
        // Only use file parsing if no text is available
        jdParsed = await parseJDFile(jdFile);
      } else {
        throw new Error("No job description provided");
      }

      const jd_id = jdParsed?.jd_id ?? null;
      if (!jd_id)
        return setError("JD parsing failed — no JD ID returned.");

      setProcessingStage("scoring");

      // Step 3: Match Resume and JD (with retry for backend errors)
      let matchResp;
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

      setMatchResults({ 
        data: finalMatchData,
        match_id: matchResp.match_id || finalMatchData?.match_id,
        jd_id: jd_id,
        duplicate: matchResp.duplicate
      });

      setParsedResumeData(fullResumeData);
      setParsedJDData(jdParsed);

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

      if (err?.__raw) {
        // Handle error from safePost/safeGet helpers
        const raw = err.__raw;
        if (typeof raw === 'object') {
          const msg = raw.message || raw.error || raw.detail;
          // Ensure we have a string, not an object
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(raw);
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            const msg = parsed.message || parsed.error || parsed.detail;
            errorMessage = typeof msg === 'string' ? msg : raw;
          } catch {
            errorMessage = raw;
          }
        }
      } else if (err?.message) {
        // Try to parse JSON from error message
        try {
          const parsed = JSON.parse(err.message);
          const msg = parsed.message || parsed.error || parsed.detail;
          errorMessage = typeof msg === 'string' ? msg : err.message;
        } catch {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Clean header without bottom border */}
      <header className="fixed top-0 left-20 right-0 h-16 bg-white z-40">
        <div className="flex items-center h-full px-8">
          <h2 className="text-3xl pt-5.5 -translate-x-6 font-bold text-gray-800">CareerBot</h2>
        </div>
      </header>

      <main
        className={` min-h-1/2 pt-27 bg-white transition-all duration-200  ${
          leaving ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
        }`}
      >
        <div className="pl-6 pr-8 pb-8">
          {isProcessing ? (
            <LoadingAnimation stage={processingStage} />
          ) : (
            <>
              {/* Gray-100 rounded container - moved down and left */}
              <div className="bg-gray-100 rounded-3xl p-8">
                <div
                  ref={containerRef}
                  className="bg-white rounded-2xl px-8 pt-6 pb-14"
                >
                  <div className="mb-8">
                    <h2 className="text-[26px] font-bold flex items-center gap-2">
                      Resume <span className="text-[#BDBDBD]">↔</span> Job Match
                    </h2>
                    <p className="text-[15px] text-gray-600">
                      Upload your resume and provide a job description (text, URL, or file) to get a full match analysis.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                      <X className="text-red-500" />
                      <p className="text-sm text-red-800">{error}</p>
                      <button onClick={() => setError(null)} className="ml-auto text-red-500">
                        <X />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center mb-8">
                    <div className="flex gap-2 px-2 py-1.5 border rounded-xl bg-gray-50 shadow-sm">
                      <Tab label="Upload" icon={<Upload className="w-4 h-4" />} active={activeTab === "upload"} onClick={() => setActiveTab("upload")} />
                      <Tab label="Analysis" icon={<RefreshCcw className="w-4 h-4" />} active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} />
                      <Tab label="AI Chat" icon={<MessageSquare className="w-4 h-4" />} active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
                    </div>
                  </div>

                  {activeTab === "upload" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card
                        title="Upload your resume"
                        action={
                          <button
                            onClick={() => resumeInputRef.current?.click()}
                            className="h-10 px-4 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                          >
                            <Upload className="w-4 h-4 inline-block mr-1" />
                            Upload Resume
                          </button>
                        }
                      >
                        <input
                          ref={resumeInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files?.[0] && handleResumeUpload(e.target.files[0])
                          }
                        />

                        {uploadedFile ? (
                          <div className="h-[320px] bg-[#ecfdf5] border-2 border-dashed border-green-300 rounded-xl flex flex-col items-center justify-center gap-6">
                            <div className="flex gap-2 items-center">
                              <CheckCircle className="text-green-600 w-6 h-6" />
                              <p className="font-medium text-gray-900">Resume uploaded successfully</p>
                            </div>

                            <div className="bg-white border p-4 rounded-xl shadow flex items-center gap-4">
                              <FileText className="w-6 h-6 text-gray-600" />
                              <div>
                                <p className="font-bold truncate">{uploadedFile.name}</p>
                                <p className="text-sm text-gray-600">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button onClick={() => setUploadedFile(null)} className="text-gray-500 hover:text-red-600">
                                <X className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => resumeInputRef.current?.click()}
                            className="h-[320px] border-2 border-dashed border-gray-300 rounded-xl bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer hover:border-[#2557a7]"
                          >
                            <Upload className="w-10 h-10 text-gray-400" />
                            <p className="text-sm text-gray-700 mt-3">
                              <span className="text-[#2557a7] font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF / DOC / TXT (Max 10MB)</p>
                          </div>
                        )}
                      </Card>

                      <Card
                        title="Job Description"
                        action={
                          <>
                            <input
                              ref={jdUploadRef}
                              type="file"
                              accept=".txt,.pdf,.doc,.docx"
                              className="hidden"
                              onChange={(e) =>
                                e.target.files?.[0] && handleJDFileUpload(e.target.files[0])
                              }
                            />
                            <button
                              onClick={() => jdUploadRef.current?.click()}
                              className="h-10 px-4 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            >
                              <Upload className="w-4 h-4 inline-block mr-1" />
                              Upload JD File
                            </button>
                          </>
                        }
                      >
                        <textarea
                          value={jdText}
                          onChange={(e) => {
                            setJdText(e.target.value);
                            setJdFile(null);
                          }}
                          placeholder="Paste job description text or URL here..."
                          className="w-full h-[200px] border border-gray-300 rounded-xl p-3 bg-[#f9fafb] text-sm focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
                        />

                        <div className="bg-[#F3E8FF] p-3 rounded-lg mt-4 flex gap-3">
                          <Lightbulb className="text-[#A78BFA] w-4 h-4 mt-0.5" />
                          <p className="text-xs text-gray-700">Paste job description text, URL, or upload a file</p>
                        </div>

                        <div className="flex justify-end mt-4">
                          <button
                            onClick={analyzeMatch}
                            disabled={!uploadedFile || (!jdFile && !jdText.trim())}
                            className={`px-6 py-2 rounded-xl text-white font-medium ${
                              !uploadedFile || (!jdFile && !jdText.trim())
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[#8B5CF6] hover:bg-[#7C3AED]"
                            }`}
                          >
                            Analyze Match
                          </button>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeTab === "analysis" && (
                    <AnalysisContent
                      jdText={jdText}
                      parsedResumeData={parsedResumeData}
                      matchResults={matchResults}
                    />
                  )}

                  {activeTab === "chat" && (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">AI Chat coming soon…</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Overview;
