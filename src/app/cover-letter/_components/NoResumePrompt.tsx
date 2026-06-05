"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { ChevronLeft, FileText, RefreshCw, Upload } from "lucide-react";

export interface NoResumePromptProps {
  isRefreshing?: boolean;
  isUploading?: boolean;
  uploadError?: string | null;
  onRefresh: () => void;
  onUpload: (file: File) => void;
}

export default function NoResumePrompt({
  isRefreshing = false,
  isUploading = false,
  uploadError = null,
  onRefresh,
  onUpload,
}: NoResumePromptProps) {
  const inputId = "cover-letter-resume-upload";

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <div className="mb-4 text-left">
          <Link
            href="/cover-letter/history"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#2557a7] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back to cover letters
          </Link>
        </div>
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 rounded-full p-5">
            <FileText className="w-10 h-10 text-[#2557a7]" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Add a resume to continue
        </h1>
        <p className="text-gray-600 mb-2">
          Cover letters are generated from your parsed resume, so we
          need one resume on file before writing the letter.
        </p>
        <p className="text-gray-600 mb-6">
          Upload a PDF/DOCX resume here so we can parse it for cover-letter
          generation. If you do not have a resume yet, create one in the
          builder, export it, then upload it here.
        </p>

        <input
          id={inputId}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          disabled={isUploading}
          onChange={handleFileChange}
        />
        <label
          htmlFor={inputId}
          className={[
            "inline-flex items-center justify-center gap-2 w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2557a7] focus-within:ring-offset-2",
            isUploading
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-[#1e4a94] cursor-pointer",
          ].join(" ")}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          {isUploading ? "Uploading resume..." : "Upload resume"}
        </label>

        <Link
          href="/builder/start?return_to=/cover-letter/new"
          className="mt-3 inline-flex items-center justify-center gap-2 w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
        >
          Create resume in builder
        </Link>

        {uploadError && (
          <p className="mt-3 text-sm font-medium text-red-600">{uploadError}</p>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || isUploading}
          className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium text-[#2557a7] hover:text-[#1e4a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw
            className={["w-3.5 h-3.5", isRefreshing ? "animate-spin" : ""].join(" ")}
            aria-hidden="true"
          />
          {isRefreshing ? "Checking..." : "I already uploaded one - Check again"}
        </button>
      </div>
    </div>
  );
}
