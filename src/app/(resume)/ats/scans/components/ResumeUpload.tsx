"use client";

import React, { useRef, useState, ChangeEvent } from "react";
import {
  Upload,
  Scan,
  ClipboardList,
  FileText,
  X,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize } from "../utils/helpers";
import { breakdownData, initialAnalysisData } from "../utils/data";
import DetailedReport from "../components/DetailedReport";
import ResumeEnhancer from "../components/ResumeEnhancer";
import StepIcon from "../components/StepIcon";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001";
const API_USERNAME = process.env.NEXT_PUBLIC_API_USERNAME || "shiva";
const API_PASSWORD = process.env.NEXT_PUBLIC_API_PASSWORD || "string";

const evaluateResume = (file: File): number => {
  const fileSize = file.size;
  const fileType = file.type;
  let baseScore = 50;
  if (fileType.includes("pdf")) baseScore += 10;
  if (fileType.includes("doc") || fileType.includes("docx")) baseScore += 5;
  if (fileSize > 500000) baseScore -= 10;
  if (fileSize < 10000) baseScore -= 5;
  const keywordScore = Math.floor(Math.random() * 20);
  const formattingScore = Math.floor(Math.random() * 20);
  const finalScore = baseScore + keywordScore + formattingScore;
  return Math.max(0, Math.min(100, finalScore));
};

const ResumeUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [viewingReport, setViewingReport] = useState<boolean>(false);
  const [viewingEnhancer, setViewingEnhancer] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const progressOffset = circumference - (progress / 100) * circumference;

  const getAccessToken = async (): Promise<string | null> => {
    try {
      // Create form data for OAuth2 password flow
      const formData = new URLSearchParams();
      formData.append('username', API_USERNAME);
      formData.append('password', API_PASSWORD);

      console.log('Attempting authentication to:', `${API_URL}/token`);
      
      const response = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      console.log('Auth response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth error response:', errorText);
        throw new Error(`Authentication failed (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Auth successful, token received');
      return data.access_token || null;
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : "Authentication error");
      return null;
    }
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setUploadedFile(f);
      setProgress(0);
      setStep(1);
      setViewingReport(false);
      setViewingEnhancer(false);
      setError(null);

      // Get access token if not already set
      let token = accessToken;
      if (!token) {
        token = await getAccessToken();
        if (!token) {
          setStep(0);
          setProgress(0);
          setUploadedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        setAccessToken(token);
      }

      const formData = new FormData();
      formData.append("file", f);

      try {
        console.log('Uploading resume to:', `${API_URL}/parse_resume/`);
        
        const response = await fetch(`${API_URL}/parse_resume/`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Upload response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload error response:', errorText);
          throw new Error(`Failed to parse resume (${response.status}): ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Resume parsed successfully:', result);
        const score = evaluateResume(f);
        setCurrentScore(score);

        setTimeout(() => {
          setStep(2);
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 100) {
                clearInterval(interval);
                setTimeout(() => setStep(3), 500);
                return 100;
              }
              return prev + Math.floor(Math.random() * 5) + 1;
            });
          }, 50);
        }, 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setStep(0);
        setProgress(0);
        setUploadedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setStep(0);
    setProgress(0);
    setViewingReport(false);
    setViewingEnhancer(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const viewReport = () => {
    if (step === 3) {
      setViewingReport(true);
      setViewingEnhancer(false);
    }
  };

  const openEnhancer = () => {
    setViewingEnhancer(true);
    setViewingReport(false);
  };

  const backToAnalysis = () => {
    setViewingEnhancer(false);
    setViewingReport(true);
  };

  const backToMain = () => {
    setViewingReport(false);
    setViewingEnhancer(false);
    removeFile();
  };

  if (viewingEnhancer) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-start font-sans">
        <ResumeEnhancer
          onBackToAnalysis={backToAnalysis}
          currentScore={currentScore}
          onScoreUpdate={setCurrentScore}
          initialAnalysisData={initialAnalysisData}
        />
      </main>
    );
  }

  if (viewingReport) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-start font-sans">
        <DetailedReport
          onOpenEnhancer={openEnhancer}
          onBackToMain={backToMain}
          score={currentScore}
          analysisData={initialAnalysisData}
          breakdown={breakdownData}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-white px-6 py-14 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
          Your ATS Score Analysis
        </h1>
        <p className="text-gray-600 mt-3 max-w-3xl mx-auto text-lg">
          Comprehensive analysis of your resumes performance across ATS systems
          and recruiter preferences
        </p>
      </div>

      <div className="relative w-full max-w-4xl mx-auto mb-12 flex items-center justify-between px-4">
        <StepIcon icon={Upload} label="Upload Resume" active={step >= 1} />
        <StepIcon icon={Scan} label="ATS Scan" active={step >= 2} />
        <StepIcon
          icon={ClipboardList}
          label="View Results"
          active={step >= 3}
        />
        <div className="absolute top-0 left-0 w-full h-20 pointer-events-none z-0">
          <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path
              d="M 210 45 C 300 100, 400 100, 500 45"
              stroke={step >= 2 ? "#8B5CF6" : "#E5E7EB"}
              strokeWidth="3"
              strokeDasharray="1 12"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <path
              d="M 500 45 C 600 -10, 700 -10, 790 45"
              stroke={step >= 3 ? "#8B5CF6" : "#E5E7EB"}
              strokeWidth="3"
              strokeDasharray="1 12"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto mt-6">
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-300 relative transition-all duration-300 h-80 flex flex-col items-center justify-center text-center">
          {error && (
            <div className="text-red-600 font-semibold mb-4">{error}</div>
          )}
          {step < 1 && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept=".doc,.docx,.pdf,.html,.rtf,.txt"
              />
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">DRAG AND DROP A FILE HERE</h2>
                <p className="text-gray-500 mt-2">
                  We can read: DOC, DOCX, PDF, HTML, RTF, TXT
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                  Upload your resume
                </button>
              </div>
            </>
          )}

          {step >= 1 && step < 3 && (
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-300 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}

          {step === 3 && uploadedFile && (
            <div className="w-full">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 w-full mb-6">
                <FileText className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                <div className="ml-4 text-left overflow-hidden">
                  <p className="font-semibold text-gray-800 truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
                <button onClick={removeFile} className="ml-auto p-2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center text-green-600 font-semibold mb-6">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Scan Complete!
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={viewReport}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View Detailed Report
                </button>
                <button
                  onClick={() => {
                    removeFile();
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="px-6 py-3 bg-white text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload Different File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResumeUpload;