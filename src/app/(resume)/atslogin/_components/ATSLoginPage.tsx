"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, FileText, Check, Loader2, AlertCircle, Target, BarChart3, FileCheck } from "lucide-react";
import { processResumeComplete } from "@/api/resumeatsapi";

export default function ATSLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImageBased, setIsImageBased] = useState<boolean>(false);

  const handleFileSelect = (file: File) => {
    setError(null);
    setIsImageBased(false);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["pdf", "docx", "doc", "html", "rtf", "txt"];

    if (!allowed.includes(ext)) {
      setError("Invalid file type. Only PDF, DOCX, DOC, HTML, RTF, TXT are allowed.");
      return;
    }

    setSelectedFile(file);
    setStep(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile || isAnalyzing) return;

    setError(null);
    setIsAnalyzing(true);
    setStep(2);

    localStorage.setItem("uploadedResume", selectedFile.name);
    localStorage.setItem("uploadedFileName", selectedFile.name);
    localStorage.setItem("uploadedFileSize", String(selectedFile.size));
    localStorage.setItem("uploadedFileType", selectedFile.type);

    try {
      const result = await processResumeComplete(selectedFile);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      const imageBasedDetected =
        ("parsed_data" in result && (result.parsed_data?.error || result.parsed_data?.ocr_needed)) ||
        ("scanned_pdf" in result && result.scanned_pdf);

      if (imageBasedDetected) {
        setIsImageBased(true);
        setError(null);
        localStorage.setItem("isImageBased", "true");
        localStorage.setItem("currentScore", "0");
        setStep(1);
        setIsAnalyzing(false);
      } else {
        localStorage.setItem("isImageBased", "false");
        const score = "finalWeightedScore" in result ? result.finalWeightedScore : 0;
        localStorage.setItem("currentScore", String(score ?? 0));

        setStep(3);
        setTimeout(() => {
          router.push("/ats/report");
        }, 600);
      }

    } catch (err: unknown) {
      let message = "Unable to process your resume. Please try again.";

      // Extract user-friendly error message
      if (err instanceof Error) {
        // Try to parse JSON error responses
        try {
          const errorObj = JSON.parse(err.message);
          if (errorObj.message) {
            message = errorObj.message;
          } else if (errorObj.error) {
            message = errorObj.error;
          } else {
            message = err.message;
          }
        } catch {
          // If not JSON, use the error message directly
          message = err.message || "An error occurred while processing your resume.";
        }
      } else if (typeof err === "string") {
        try {
          const errorObj = JSON.parse(err);
          message = errorObj.message || errorObj.error || err;
        } catch {
          message = err;
        }
      }

      // Clean up technical error messages
      if (message.includes("HTTP_401") || message.includes("credentials")) {
        message = "Authentication failed. Please try uploading your resume again.";
      } else if (message.includes("network") || message.includes("fetch")) {
        message = "Network error. Please check your connection and try again.";
      } else if (message.length > 150) {
        message = "An error occurred while processing your resume. Please try again.";
      }

      setError(message);
      setStep(1);
      setIsAnalyzing(false);
      localStorage.clear();
    }
  };

  const steps = [
    { label: "Upload Resume", id: 1 },
    { label: "ATS Scan", id: 2 },
    { label: "View Results", id: 3 },
    { label: "Get Insights", id: 4 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen relative">
        {/* CareerBot header positioned near sidebar */}
          <div className="absolute left-4 top-3 md:left-20 md:top-6">
          <h2 className="text-3xl font-bold -translate-x-18 text-gray-900">CareerBot</h2>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Main Card Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

            {/* Header Section */}
            <div className="px-8 py-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ATS Scan
              </h1>
              <p className="text-gray-600 text-sm">
                Upload your resume to analyze ATS compatibility.
                Optimize it to pass through Applicant Tracking Systems.
              </p>
            </div>

            {/* Content Section */}
            <div className="p-8 border-b border-gray-200">

              {/* Robot Illustration and Progress Steps */}
              <div className="flex items-center justify-between gap-8 mb-8">
                {/* Robot Illustration Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 flex-1">
                  <div className="flex justify-center">
                    <Image
                      src="/images/ats-robot-illustration.png"
                      alt="ATS Scan Robot Illustration"
                      width={900}
                      height={450}
                      className="w-full max-w-3xl h-auto"
                      priority
                    />
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex flex-col gap-5 flex-shrink-0">
                  {steps.map(({ label, id }) => (
                    <div key={id} className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          step >= id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {step > id ? (
                          <Check className="w-6 h-6" strokeWidth={2.5} />
                        ) : step === id && isAnalyzing ? (
                          <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2} />
                        ) : (
                          <span className="text-base font-semibold">{id}</span>
                        )}
                      </div>
                      <span className={`text-base font-medium whitespace-nowrap ${
                        step >= id ? "text-blue-600" : "text-gray-500"
                      }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload and Analysis Section */}
              <div className="max-w-5xl mx-auto">
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                  {/* Selected File Display */}
                  {selectedFile && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-7 h-7 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        {!isAnalyzing && (
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-600" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && !isImageBased && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-red-900 mb-1">Upload Failed</h3>
                          <p className="text-sm text-red-800 mb-3">{error}</p>
                          <button
                            onClick={() => {
                              setError(null);
                              setSelectedFile(null);
                            }}
                            className="text-sm font-medium text-red-700 hover:text-red-900 underline"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image-Based Resume Warning */}
                  {isImageBased && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-amber-900 mb-1">Not ATS-Friendly Resume</h3>
                        <p className="text-sm text-amber-800">
                          This appears to be an image-based or scanned document. ATS systems cannot parse image-based resumes.
                          Click &quot;Enhance the Resume&quot; below to rebuild your resume with an ATS-friendly template.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row - always visible */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Upload New Button */}
                    <label className={`cursor-pointer ${isAnalyzing ? "pointer-events-none opacity-50" : ""}`}>
                      <input
                        type="file"
                        accept=".doc,.docx,.pdf,.html,.rtf,.txt"
                        className="hidden"
                        onChange={handleInputChange}
                        disabled={isAnalyzing}
                      />
                      <div className="bg-white border border-gray-300 rounded-xl py-4 px-6 hover:border-gray-400 hover:shadow transition-all flex items-center justify-center gap-3 h-14">
                        <FileText className="w-5 h-5 text-gray-700" strokeWidth={2} />
                        <span className="text-base font-semibold text-gray-900">Upload New Resume</span>
                      </div>
                    </label>

                    {/* Analyze Button */}
                    <button
                      onClick={isImageBased ? () => router.push("/enhancer/builder") : handleStartAnalysis}
                      disabled={isAnalyzing || !selectedFile || (!!error && !isImageBased)}
                      className={`rounded-xl py-4 px-6 font-semibold text-base transition-all flex items-center justify-center gap-3 h-14 ${
                        !isAnalyzing && selectedFile && (!error || isImageBased)
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                          <span>Analyzing...</span>
                        </>
                      ) : isImageBased ? (
                        "Enhance the Resume"
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>Analyze Resume</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* File Type Info */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-medium">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>PDF, DOCX, DOC, HTML, RTF, TXT</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Feature Cards Section */}
            <div className="p-8 border-b border-gray-200">
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">ATS Compatibility Score</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Get instant feedback on how well your resume performs with ATS systems
                  </p>
                  <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">Keyword Optimization</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Discover missing keywords and optimize your content for better matches
                  </p>
                  <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <FileCheck className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">View Results</h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Review detailed scores, suggestions, and one to improve your resume
                  </p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    View Results
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
