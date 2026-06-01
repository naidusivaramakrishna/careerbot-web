"use client";

import React, { useRef, useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Scan,
  ClipboardList,
  X,
  CheckCircle2,
  Loader2,
  Clock,
  Trash2,
} from "lucide-react";
import { FaFileUpload } from "react-icons/fa";
import { formatFileSize } from "../../utils/helpers";
import { processResumeComplete } from "@/api/resumeatsapi";

const PRIMARY_COLOR = "#0275dd";

const ResumeUpload: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImageBased, setIsImageBased] = useState<boolean>(false);

  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const progressOffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isProcessing) {
      timer = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getStatusMessage = (t: number) => {
    if (t < 10) return "Validating file format...";
    if (t < 30) return "Uploading resume to AI analysis...";
    if (t < 60) return "AI is parsing document content...";
    if (t < 90) return "Analyzing resume structure...";
    if (t < 120) return "Calculating ATS compatibility...";
    if (t < 150) return "Generating recommendations...";
    return "Finalizing analysis...";
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => {
        reject(reader.error ?? new DOMException("File read error"));
      };
    });

  const validateFileContent = async (file: File, ext: string): Promise<boolean> => {
    const buffer = await file.slice(0, 512).arrayBuffer();
    const view = new Uint8Array(buffer);

    if (ext === "pdf") {
      return String.fromCharCode(...Array.from(view.slice(0, 5))) === "%PDF-";
    }
    if (ext === "docx") {
      if (view[0] !== 0x50 || view[1] !== 0x4b || view[2] !== 0x03 || view[3] !== 0x04)
        return false;
      return new TextDecoder().decode(buffer).includes("[Content_Types].xml");
    }
    return false;
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["pdf", "docx"];
    if (!allowed.includes(ext)) {
      setError("Invalid file type. Only .pdf, .docx are allowed.");
      return;
    }

    setError(null);
    setIsImageBased(false);

    const valid = await validateFileContent(f, ext);
    if (!valid) {
      setError(`Invalid ${ext.toUpperCase()} file – corrupted or wrong format.`);
      return;
    }

    setUploadedFile(f);
    setStep(2);
    setProgress(5);
    setIsProcessing(true);

    try {
      const b64 = await fileToBase64(f);
      localStorage.setItem("uploadedResumeFile", b64);
      localStorage.setItem("uploadedFileName", f.name);
      localStorage.setItem("uploadedFileSize", String(f.size));
      localStorage.setItem("uploadedFileType", f.type);
    } catch {
      // ignore preview failures
    }

    const progInt = setInterval(() => {
      setProgress((p) => (p < 95 ? Math.min(p + 1, 95) : p));
    }, 600);

    try {
      const result = await processResumeComplete(f);
      clearInterval(progInt);
      setIsProcessing(false);

      if (!result.success) {
        setIsImageBased(true);
        setCurrentScore(0);
        setProgress(100);
        setStep(3);
        localStorage.setItem("isImageBased", "true");
        localStorage.setItem("currentScore", "0");
        return;
      }

      if (result.parsed_data?.error || result.parsed_data?.ocr_needed) {
        setIsImageBased(true);
        setCurrentScore(0);
        setProgress(100);
        setStep(3);
        localStorage.setItem("isImageBased", "true");
        localStorage.setItem("currentScore", "0");
        return;
      }

      setCurrentScore(result.finalWeightedScore ?? 0);

      localStorage.setItem(
        "atsAnalysisData",
        JSON.stringify({
          ...result,
          file_name: f.name,
          file_size: f.size,
          file_type: f.type,
          upload_time: new Date().toISOString(),
          missingFields: result.missingFields ?? [],
        })
      );
      localStorage.setItem("currentScore", String(result.finalWeightedScore ?? 0));
      localStorage.setItem("isImageBased", "false");
      setProgress(100);
      setTimeout(() => setStep(3), 500);
    } catch (err: unknown) {
      clearInterval(progInt);
      let message = "Processing failed. Try again.";
      if (err instanceof Error && err.message) message = err.message;
      else if (typeof err === "string") message = err;
      setError(message);
      setStep(0);
      setUploadedFile(null);
      setIsProcessing(false);
      localStorage.clear();
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setStep(0);
    setProgress(0);
    setError(null);
    setCurrentScore(0);
    setIsProcessing(false);
    setIsImageBased(false);
    localStorage.clear();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const viewReport = () => {
    if (step === 3) {
      if (isImageBased) {
        // For image-based resumes, redirect to resume enhancer with parsed data
        router.push(`/enhancer/builder`);
      } else {
        router.push(`/atslogin/report`);
      }
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="flex flex-col items-center justify-start font-sans py-4 px-4">
        <div className="text-center mb-4 max-w-lg">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1.5">
            Get Your Free ATS Resume Score
          </h1>
          <p className="text-xs text-gray-600">
            Get instant AI analysis and discover your resume&apos;s compatibility with employer ATS systems.
          </p>
        </div>

        <div className="relative w-full max-w-lg mx-auto mb-5 px-4">
          <div className="grid grid-cols-3 items-center" style={{ height: 90 }}>
            {[
              { icon: Upload, label: "Upload Resume", minStep: 1 },
              { icon: Scan, label: "ATS Scan", minStep: 2 },
              { icon: ClipboardList, label: "View Results", minStep: 3 },
            ].map(({ icon: Icon, label, minStep }, idx) => (
              <div key={idx} className="flex flex-col items-center z-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step >= minStep
                      ? "bg-white shadow-[0_8px_20px_rgba(2,117,221,0.2)]"
                      : "bg-gray-100"
                  }`}
                  style={{
                    transform: step >= minStep ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: step >= minStep ? PRIMARY_COLOR : "#9ca3af" }}
                  />
                </div>
                <p
                  className="mt-2 text-xs font-semibold leading-none"
                  style={{ color: step >= minStep ? PRIMARY_COLOR : "#6b7280" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0" style={{ top: 10 }}>
            <svg width="100%" height="80" viewBox="0 0 1000 80" preserveAspectRatio="none">
              <path
                d="M 210 35 C 300 80, 400 80, 500 35"
                stroke={step >= 2 ? PRIMARY_COLOR : "#E5E7EB"}
                strokeWidth="2.5"
                strokeDasharray="1 10"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <path
                d="M 500 35 C 600 -10, 700 -10, 790 35"
                stroke={step >= 3 ? PRIMARY_COLOR : "#E5E7EB"}
                strokeWidth="2.5"
                strokeDasharray="1 10"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
          </div>
        </div>

        <div className="w-full max-w-lg mx-auto">
          <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#0275dd] relative transition-all duration-300 min-h-80 flex flex-col items-center justify-center text-center">
            {error && (
              <div className="absolute top-3 left-3 right-3 bg-red-50 border border-red-200 rounded-lg p-2 animate-pulse z-10">
                <p className="text-red-600 font-semibold text-xs flex items-center gap-2 justify-center">
                  <X className="w-3 h-3" />
                  {error}
                </p>
              </div>
            )}

            {step < 1 && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  className="hidden"
                  accept=".pdf,.docx"
                />
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-50 to-blue-100" />
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 m-auto w-12 h-12"
                    >
                      <rect
                        x="30"
                        y="20"
                        width="30"
                        height="42"
                        rx="2"
                        fill="white"
                        stroke="#0275dd"
                        strokeWidth="2.5"
                      />
                      <line x1="35" y1="28" x2="55" y2="28" stroke="#0275dd" strokeWidth="2" />
                      <line x1="35" y1="35" x2="55" y2="35" stroke="#0275dd" strokeWidth="2" />
                      <line x1="35" y1="42" x2="50" y2="42" stroke="#0275dd" strokeWidth="2" />
                      <line x1="35" y1="49" x2="55" y2="49" stroke="#0275dd" strokeWidth="2" />
                      
                      <circle cx="58" cy="52" r="12" fill="#10b981" />
                      <path
                        d="M 53 52 L 56 55 L 63 48"
                        stroke="white"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Get Your Resume Analyzed
                  </h2>
                  <p className="text-gray-500 mb-4 text-sm">
                    Upload in seconds, get instant feedback
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                    {["PDF", "DOCX"].map((ext) => (
                      <span
                        key={ext}
                        className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                      >
                        {ext}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold rounded-full shadow-lg transition-all duration-300 hover:scale-105 text-sm"
                  >
                    <FaFileUpload className="w-4 h-4" />
                    Upload Your resume
                  </button>
                </div>
              </>
            )}

            {step >= 1 && step < 3 && (
              <div className="flex flex-col items-center w-full">

                {/* Gradient arc ring + pulse */}
                <div style={{ position: "relative", width: 148, height: 148, marginBottom: 18, flexShrink: 0 }}>

                  {/* Expanding pulse rings */}
                  <div style={{
                    position: "absolute", inset: 8, borderRadius: "50%",
                    border: "1.5px solid rgba(2,117,221,0.35)",
                    animation: "ats-pulse 2.2s ease-out infinite",
                  }} />
                  <div style={{
                    position: "absolute", inset: 8, borderRadius: "50%",
                    border: "1.5px solid rgba(2,117,221,0.2)",
                    animation: "ats-pulse 2.2s ease-out 0.75s infinite",
                  }} />

                  {/* Gradient progress arc */}
                  <svg
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}
                    viewBox="0 0 148 148"
                  >
                    <defs>
                      <linearGradient id="atsArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0275dd" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    {/* Track */}
                    <circle cx="74" cy="74" r="58" fill="none" stroke="#EFF6FF" strokeWidth="10" />
                    {/* Progress */}
                    <circle
                      cx="74" cy="74" r="58"
                      fill="none"
                      stroke="url(#atsArcGrad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 58}
                      strokeDashoffset={2 * Math.PI * 58 * (1 - progress / 100)}
                      style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
                    />
                  </svg>

                  {/* Center % */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                      {Math.round(progress)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>%</span>
                  </div>
                </div>

                {/* Status message + timer */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                    <Loader2 className="animate-spin" style={{ width: 13, height: 13, color: "#0275dd" }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                      {getStatusMessage(elapsedTime)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: "#94A3B8" }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    <span>{formatTime(elapsedTime)}</span>
                  </div>
                </div>

                {/* Stage tracker */}
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {[
                    { label: "Upload",  pct: 8  },
                    { label: "Parse",   pct: 35 },
                    { label: "Analyze", pct: 65 },
                    { label: "Score",   pct: 90 },
                  ].map(({ label, pct }, i) => (
                    <React.Fragment key={label}>
                      {i > 0 && (
                        <div style={{
                          width: 22, height: 2, borderRadius: 2,
                          background: progress >= pct ? "linear-gradient(90deg,#0275dd,#06b6d4)" : "#E2E8F0",
                          transition: "background 0.3s",
                          flexShrink: 0,
                        }} />
                      )}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{
                          width: 9, height: 9, borderRadius: "50%",
                          background: progress >= pct ? "#0275dd" : "#E2E8F0",
                          boxShadow: progress >= pct ? "0 0 8px rgba(2,117,221,0.55)" : "none",
                          transition: "all 0.35s ease",
                        }} />
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: progress >= pct ? "#0275dd" : "#CBD5E1",
                          transition: "color 0.35s",
                        }}>
                          {label}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {elapsedTime > 60 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-3 animate-fade-in">
                    <p className="text-xs text-yellow-800 text-center">
                      <strong>Deep Analysis in Progress</strong><br />
                      AI is performing comprehensive analysis.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* NOT ATS FRIENDLY - Document with Person and RED X */}
            {step === 3 && uploadedFile && isImageBased && (
              <div className="w-full animate-fade-in flex flex-col h-full justify-center">
                <div className="flex items-center p-2.5 bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-100 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <rect x="6" y="4" width="12" height="16" rx="1" fill="none" stroke="#0275dd" strokeWidth="1.5" />
                      <line x1="8" y1="8" x2="16" y2="8" stroke="#0275dd" strokeWidth="1.5" />
                      <line x1="8" y1="11" x2="16" y2="11" stroke="#0275dd" strokeWidth="1.5" />
                      <line x1="8" y1="14" x2="13" y2="14" stroke="#0275dd" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="ml-2 text-left overflow-hidden flex-1">
                    <p className="font-semibold text-gray-900 truncate text-xs">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.size)} • {formatTime(elapsedTime)}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-600 transition-all hover:scale-110 hover:bg-red-50 rounded-lg flex-shrink-0"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center mb-3">
                  {/* MATCHING ICON - Document with Person and RED X Circle */}
                  <div className="relative w-20 h-20 mb-2">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                      {/* Document with folded corner */}
                      <path
                        d="M 20 10 L 20 110 L 80 110 L 80 25 L 65 10 Z"
                        fill="white"
                        stroke="#4a5568"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 65 10 L 65 25 L 80 25"
                        fill="#e2e8f0"
                        stroke="#4a5568"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      
                      {/* Person icon - head */}
                      <circle cx="50" cy="45" r="8" fill="#2563eb" />
                      
                      {/* Person icon - body */}
                      <path
                        d="M 35 70 Q 35 58, 50 58 Q 65 58, 65 70 L 65 78 L 35 78 Z"
                        fill="#2563eb"
                      />
                      
                      {/* Document lines */}
                      <line x1="30" y1="88" x2="70" y2="88" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="30" y1="96" x2="60" y2="96" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="30" y1="104" x2="65" y2="104" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* RED X Circle - bottom right */}
                      <circle cx="75" cy="100" r="18" fill="#ef4444" stroke="#dc2626" strokeWidth="2.5" />
                      
                      {/* X mark */}
                      <line x1="67" y1="92" x2="83" y2="108" stroke="white" strokeWidth="4" strokeLinecap="round" />
                      <line x1="83" y1="92" x2="67" y2="108" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </div>

                  <h3 className="text-base font-bold text-red-600 mb-3">
                    Not ATS‑Friendly Template
                  </h3>

                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 w-full h-24 flex flex-col items-center justify-center mb-3">
                    <p className="text-xs text-gray-600 mb-0.5">Your ATS Score</p>
                    <p className="text-4xl font-extrabold text-red-600">
                      0%
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-2 mt-auto">
                  <button
                    onClick={viewReport}
                    className="px-6 py-2.5 bg-[#0275dd] text-white font-semibold rounded-xl hover:bg-[#0261b8] transition-all shadow-lg hover:scale-105 text-sm"
                  >
                    Enhance the Resume →
                  </button>
                  <button
                    onClick={removeFile}
                    className="px-6 py-2.5 bg-white text-gray-700 font-semibold border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-105 text-sm"
                  >
                    Upload & Rescan
                  </button>
                </div>
              </div>
            )}

            {/* ATS FRIENDLY - Document with Person and GREEN CHECK */}
            {step === 3 && uploadedFile && !isImageBased && (
              <div className="w-full animate-fade-in flex flex-col h-full justify-center">
                <div className="flex items-center p-2.5 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-100 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="ml-2 text-left overflow-hidden flex-1">
                    <p className="font-semibold text-gray-900 truncate text-xs">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.size)} • {formatTime(elapsedTime)}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-600 transition-all hover:scale-110 hover:bg-red-50 rounded-lg flex-shrink-0"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center mb-4">
                  {/* MATCHING ICON - Document with Person and GREEN CHECKMARK */}
                  <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                      {/* Document with folded corner */}
                      <path
                        d="M 20 10 L 20 110 L 80 110 L 80 25 L 65 10 Z"
                        fill="white"
                        stroke="#4a5568"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 65 10 L 65 25 L 80 25"
                        fill="#e2e8f0"
                        stroke="#4a5568"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      
                      {/* Person icon - head */}
                      <circle cx="50" cy="45" r="8" fill="#2563eb" />
                      
                      {/* Person icon - body */}
                      <path
                        d="M 35 70 Q 35 58, 50 58 Q 65 58, 65 70 L 65 78 L 35 78 Z"
                        fill="#2563eb"
                      />
                      
                      {/* Document lines */}
                      <line x1="30" y1="88" x2="70" y2="88" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="30" y1="96" x2="60" y2="96" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="30" y1="104" x2="65" y2="104" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* GREEN Checkmark Circle - bottom right */}
                      <circle cx="75" cy="100" r="18" fill="#10b981" stroke="#059669" strokeWidth="2.5" />
                      
                      {/* Checkmark */}
                      <path
                        d="M 65 100 L 72 107 L 85 92"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="text-base font-bold text-gray-900 mb-3">
                    ATS Friendly Resume Template
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 w-full h-24 flex flex-col items-center justify-center">
                    <p className="text-xs text-gray-600 mb-0.5">Your ATS Score</p>
                    <p className="text-4xl font-extrabold text-[#0275dd]">
                      {currentScore}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-2 mt-auto">
                  <button
                    onClick={viewReport}
                    className="px-6 py-2.5 bg-[#0275dd] text-white font-semibold rounded-xl hover:bg-[#0261b8] transition-all shadow-lg hover:scale-105 text-sm"
                  >
                    View Detailed Report →
                  </button>
                  <button
                    onClick={removeFile}
                    className="px-6 py-2.5 bg-white text-gray-700 font-semibold border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-105 text-sm"
                  >
                    Upload & Rescan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.4s ease-out;
          }
          @keyframes ats-pulse {
            0%   { transform: scale(1);   opacity: 0.7; }
            100% { transform: scale(1.6); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ResumeUpload;
