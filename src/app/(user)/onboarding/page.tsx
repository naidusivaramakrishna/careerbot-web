"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Upload,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useResumeProfileFill } from "@/hooks/useResumeProfileFill";

const ACCEPTED_RESUME_TYPES = ".pdf,.doc,.docx";

type OnboardingStage = "upload" | "ready";

const CelebrationPopper = () => (
  <svg width="78" height="78" viewBox="0 0 78 78" fill="none" aria-hidden="true" className="mx-auto">
    <g transform="translate(8 7)">
      <path d="M13.5 49.8L22.2 25.1C22.7 23.7 24.3 23.2 25.4 24.2L44 41.2C45.1 42.2 44.6 43.9 43.2 44.3L17.7 52.2C15.1 53 12.6 52.3 13.5 49.8Z" fill="#2557A7" />
      <path d="M17.5 46.6L23.7 29.2L37.1 41.5L19.2 47.1C18.1 47.5 17.2 47.5 17.5 46.6Z" fill="#F8FBFF" />
      <path d="M19.6 40.5L27.1 47.2" stroke="#2557A7" strokeWidth="3" strokeLinecap="round" />
      <path d="M22.3 33.8L32.8 43.4" stroke="#2557A7" strokeWidth="3" strokeLinecap="round" />
      <path d="M37.4 19.1C40.7 21.6 40.6 25.2 37.5 26.9C34.8 28.4 35.7 31.3 39.3 31.7" stroke="#2557A7" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M48.9 17.5C51.7 20.5 50.5 24.3 46.8 26.1" stroke="#2557A7" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M49.6 35.3C53.5 35.1 56.2 36.8 58.2 40" stroke="#2557A7" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M30.4 16.4C31.5 19.5 30.8 22.1 28.4 24.1" stroke="#2557A7" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M55.5 28.6C58.2 27.8 60.5 28.4 62 30.7" stroke="#2557A7" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="42.8" cy="12.5" r="3" fill="#2557A7" />
      <circle cx="57.9" cy="20.5" r="2.7" fill="#2557A7" />
      <circle cx="52.6" cy="48.2" r="2.7" fill="#2557A7" />
      <circle cx="43.8" cy="42.7" r="2.4" fill="#2557A7" />
      <circle cx="31.9" cy="27.2" r="2.2" fill="#2557A7" />
    </g>
  </svg>
);
export default function UserOnboardingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<OnboardingStage>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skippedUpload, setSkippedUpload] = useState(false);
  const { step, error, fill, reset } = useResumeProfileFill();

  const isProcessing = step === "parsing" || step === "saving";
  const sideTitle = stage === "ready"
    ? skippedUpload
      ? "You are ready to continue"
      : "Your resume setup is ready"
    : "Build a job-ready workspace in two steps";
  const sideDescription = stage === "ready"
    ? skippedUpload
      ? "No problem. You can continue now and upload your resume whenever you are ready."
      : "Your resume has been received. Continue with confidence and finish the remaining setup at your pace."
    : "Uploading a resume gives CareerBot enough context to personalize profile gaps, ATS readiness, and job matching from the first dashboard visit.";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setSkippedUpload(false);
    reset();
  };

  const handleContinue = async () => {
    if (!selectedFile) {
      toast.info("Upload a resume or skip this step to continue.");
      return;
    }

    await fill(selectedFile);
    window.sessionStorage.setItem("careerbot_onboarding_just_completed", "1");
    setStage("ready");
  };

  const handleSkip = () => {
    window.sessionStorage.setItem("careerbot_onboarding_just_completed", "1");
    setSkippedUpload(true);
    setSelectedFile(null);
    reset();
    setStage("ready");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f9] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(37,87,167,0.12),transparent_58%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-48px)] max-w-[820px] items-center">
        <section className="w-full overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.09)]">
          <div className="grid lg:grid-cols-[390px_1fr]">
            <aside className="relative overflow-hidden border-b border-gray-200 bg-[#fbfcfd] px-6 py-7 sm:px-8 lg:border-b-0 lg:border-r">
              <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-[#eef4ff]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e4f6] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#2557a7]">
                  <Image src="/assets/icons/Logo.png" alt="CareerBot" width={36} height={36} className="h-8 w-8 shrink-0" /> CareerBot onboarding
                </div>
                <h1 className="mt-5 text-[28px] font-black leading-tight tracking-[-0.04em] text-gray-950">
                  {sideTitle}
                </h1>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {sideDescription}
                </p>


                <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Progress</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${stage === "ready" && !skippedUpload ? "bg-[#2557a7] text-white" : "bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#2557a7]"}`}>
                        {stage === "ready" && !skippedUpload ? <Check size={14} strokeWidth={3} /> : 1}
                      </span>
                      <div>
                        <p className="text-sm font-black text-gray-950">Upload resume</p>
                        <p className="text-xs font-semibold text-gray-500">Optional, but recommended</p>
                      </div>
                    </div>
                    <div className="ml-4 h-6 w-px bg-gray-200" />
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${stage === "ready" ? "bg-[#2557a7] text-white" : "bg-gray-100 text-gray-400"}`}>
                        {stage === "ready" ? <Check size={14} strokeWidth={3} /> : 2}
                      </span>
                      <div>
                        <p className="text-sm font-black text-gray-950">Open dashboard</p>
                        <p className="text-xs font-semibold text-gray-500">Continue with next best action</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {stage === "upload" ? (
              <section className="px-6 py-8 sm:px-8 lg:px-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2557a7]">Step 1 of 2</p>
                    <h2 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-gray-950">Upload your resume</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                      Upload your resume to auto-fill your profile and prepare the next dashboard step. You can skip this now and add it later from your dashboard.
                    </p>
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept={ACCEPTED_RESUME_TYPES} className="hidden" onChange={handleFileSelect} />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group mt-7 grid w-full place-items-center rounded-[22px] border border-dashed border-[#b9cbed] bg-[#f8fbff] px-6 py-9 text-center transition hover:border-[#2557a7] hover:bg-[#f2f7ff]"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2557a7] shadow-sm ring-1 ring-[#d8e4f6] transition group-hover:scale-105"><Upload size={24} /></span>
                  <span className="mt-4 text-base font-black text-gray-950">Drop or choose your resume</span>
                  <span className="mt-1 text-sm font-semibold text-gray-500">PDF, DOC, or DOCX</span>
                </button>

                {selectedFile && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2557a7]"><FileText size={18} /></span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-gray-950">{selectedFile.name}</p>
                        <p className="text-xs font-semibold text-gray-500">Ready to parse and save</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedFile(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Remove selected resume">
                      <X size={15} />
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-4 rounded-2xl border border-[#c8d7ef] bg-[#f8fbff] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Loader2 size={17} className="animate-spin text-[#2557a7]" />
                      <div>
                        <p className="text-sm font-black text-gray-950">{step === "parsing" ? "Parsing resume" : "Saving profile"}</p>
                        <p className="text-xs font-semibold text-gray-500">Keep this page open while we prepare your workspace.</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={handleSkip} disabled={isProcessing} className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-60">
                    Skip for now
                  </button>
                  <button type="button" onClick={handleContinue} disabled={isProcessing || !selectedFile} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91] disabled:cursor-not-allowed disabled:opacity-60">
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {isProcessing ? (step === "parsing" ? "Parsing" : "Saving") : "Continue"}
                  </button>
                </div>
              </section>
            ) : (
              <section className="flex min-h-[540px] items-center justify-center px-6 py-8 text-center sm:px-8 lg:px-10">
                <div className="w-full max-w-[360px]">
                  <CelebrationPopper />

                  <h2 className="mt-5 text-lg font-black tracking-[-0.02em] text-gray-950">Welcome to CareerBot!</h2>
                  <p className="mx-auto mt-1.5 max-w-[270px] text-xs leading-5 text-gray-600">
                    {skippedUpload
                      ? "We are so happy to have you with us. You can upload your resume later."
                      : "We are so happy to have you with us. Your resume setup has started."}
                  </p>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-3 text-left ring-1 ring-gray-100">
                    <div className="flex items-start gap-3 rounded-xl px-2 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2557a7] shadow-sm"><UserRoundCheck size={15} /></span>
                      <div>
                        <p className="text-xs font-black text-gray-950">Get Started</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-gray-500">Set up your profile and preferences</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl px-2 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2557a7] shadow-sm"><FileText size={15} /></span>
                      <div>
                        <p className="text-xs font-black text-gray-950">Learn</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-gray-500">Explore profile, ATS, and job matching guidance</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl px-2 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2557a7] shadow-sm"><Check size={15} /></span>
                      <div>
                        <p className="text-xs font-black text-gray-950">Engage</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-gray-500">Continue to your dashboard and take action</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/dashboard" className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#2557a7] bg-white px-4 text-xs font-black text-[#2557a7] transition hover:bg-[#eef4ff]">
                    Go to Dashboard <ArrowRight size={14} />
                  </Link>
                </div>
              </section>            )}
          </div>
        </section>
      </div>
    </main>
  );
}

















