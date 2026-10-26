"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const JOBS_PATH = "/jobslogin";

/** The Job Match tab's right-hand side: in place of the resume preview, one clear action. */
const FindMatchingJobsPanel: React.FC = () => {
  const router = useRouter();
  return (
    <section
      aria-label="Find your matching jobs"
      className="flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-xl border border-[#e3e9f2] bg-white px-8 py-10 text-center"
    >
      <svg width="170" height="130" viewBox="0 0 170 130" fill="none" aria-hidden="true">
        <circle cx="85" cy="62" r="52" fill="#eaf1fb" />
        <rect x="52" y="22" width="52" height="68" rx="6" fill="#dbe8fb" />
        <rect x="60" y="34" width="28" height="5" rx="2.5" fill="#5b8fd9" />
        <rect x="60" y="45" width="36" height="4" rx="2" fill="#b9cff0" />
        <rect x="60" y="54" width="30" height="4" rx="2" fill="#b9cff0" />
        <rect x="60" y="63" width="34" height="4" rx="2" fill="#b9cff0" />
        <circle cx="106" cy="76" r="17" fill="#fff" stroke="#1d4fa8" strokeWidth="5" />
        <rect x="118" y="88" width="22" height="7" rx="3.5" transform="rotate(45 118 88)" fill="#1d4fa8" />
        <path d="M122 22l8-10M130 34l12-6" stroke="#1d4fa8" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h2 className="mt-4 text-[22px] font-bold text-gray-900">Find Your Matching Jobs</h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-gray-600">
        Discover job opportunities tailored to your skills, experience and career goals.
      </p>
      <button
        type="button"
        onClick={() => router.push(JOBS_PATH)}
        className="group mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1d4fa8] px-6 text-[15px] font-semibold text-white transition hover:bg-[#184488]"
      >
        Find My Matching Jobs
        <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
      </button>
      <p className="mt-4 max-w-xs text-[12px] text-gray-500">
        We&apos;ll analyze your resume and show you the most relevant job opportunities.
      </p>
    </section>
  );
};

export default FindMatchingJobsPanel;
