"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardSummary } from "@/api/dashboardApi";
import { DashboardSummary } from "@/types/dashboard.types";
import { Loader2 } from "lucide-react";
import {
  Crown,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Upload,
  ScanSearch,
  Briefcase,
  MessageSquare,
  FileText,
  Search,
  Wand2,
  Lock,
  ArrowRight,
  TrendingUp,
  Clock,
  User,
  BarChart3,
  Zap,
  X,
} from "lucide-react";
import ProfileFillModal from "./ProfileFillModal";
import { useResumeProfileFill } from "@/hooks/useResumeProfileFill";
import { toast } from "sonner";

/* ── Helpers ──────────────────────────────────────────── */
const getStatusBadge = (pct: number) => {
  if (pct >= 100) return { label: "Complete!", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" };
  if (pct >= 75)  return { label: "Almost There!", color: "#2557a7", bg: "#eff6ff", border: "#bfdbfe" };
  if (pct >= 50)  return { label: "Good Progress", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" };
  if (pct >= 25)  return { label: "In Progress",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
  return               { label: "Just Starting",  color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/* ── Plan & Credit Card ─────────────────────────────────── */
const PlanCreditCard: React.FC<{
  planId: string;
  creditsRemaining: number;
  creditsTotal: number;
}> = ({ planId, creditsRemaining, creditsTotal }) => {
  const pct = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;
  const low = pct < 20;

  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200">
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,87,167,0.06) 0%, transparent 70%)" }}
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #5896d7, #2557a7)" }}
          >
            <Crown size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5">Current Plan</p>
            <p className="text-sm font-bold text-gray-900 capitalize leading-none">{planId}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#ecfdf5", color: "#16a34a", border: "1px solid #bbf7d0" }}
        >
          Active
        </span>
      </div>

      <div className="mb-1.5 my-auto">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-xl font-black tabular-nums" style={{ color: low ? "#ef4444" : "#1f4e98" }}>
            {creditsRemaining.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 font-medium">/ {creditsTotal.toLocaleString()}</span>
        </div>
        <p className="text-[11px] text-gray-500">Credits remaining</p>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: low ? "linear-gradient(to right, #ef4444, #f97316)" : "linear-gradient(to right, #5896d7, #2557a7)",
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{Math.round(100 - pct)}% used</span>
        {low && (
          <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-0.5">
            <Zap size={9} /> Low credits
          </span>
        )}
      </div>

      <div className="border-t border-gray-100 mt-3 mb-2" />

      <Link href="/pricing" className="flex items-center gap-1.5 text-[#2557a7] text-xs font-semibold hover:gap-2.5 transition-all group/cta">
        <Crown size={12} />
        Upgrade Plan
        <ArrowRight size={11} className="ml-auto opacity-0 group-hover/cta:opacity-100 transition-opacity" />
      </Link>
    </div>
  );
};

/* ── Job Market Insights Card ───────────────────────────── */
const JobMarketInsightsCard: React.FC<{ roles: DashboardSummary["trending_roles"] }> = ({ roles }) => (
  <div className="relative bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: "linear-gradient(135deg, #5896d7, #2557a7)" }}
        >
          <TrendingUp size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5">Market</p>
          <p className="text-sm font-bold text-gray-900 leading-none">Job Insights</p>
        </div>
      </div>
      <span
        className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
        style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse inline-block" />
        LIVE
      </span>
    </div>

    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trending Roles</p>
    <div className="space-y-0.5">
      {roles.map((role) => (
        <div key={role.title} className="flex items-center gap-2 py-0.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: role.dot }} />
          <span className="flex-1 text-xs font-medium text-gray-700 truncate">{role.title}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ color: role.tag_color, background: role.tag_bg }}
          >
            {role.tag}
          </span>
          <span className="text-[11px] font-black shrink-0" style={{ color: "#2557a7" }}>
            {role.growth}
          </span>
        </div>
      ))}
    </div>

    <div className="border-t border-gray-100 mt-2 mb-2" />

    <Link href="/jobs" className="flex items-center gap-1.5 text-[#2557a7] text-xs font-semibold hover:gap-2.5 transition-all group/cta">
      <Briefcase size={12} />
      Explore Jobs
      <ArrowRight size={11} className="ml-auto opacity-0 group-hover/cta:opacity-100 transition-opacity" />
    </Link>
  </div>
);

/* ── Profile Completeness Card ──────────────────────────── */
const ProfileCompletenessCard: React.FC<{ profileCompleteness: number }> = ({ profileCompleteness }) => {
  const badge = getStatusBadge(profileCompleteness);
  const r = 26, sw = 6, circ = 2 * Math.PI * r;
  const offset = circ - (profileCompleteness / 100) * circ;

  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: "linear-gradient(135deg, #5896d7, #2557a7)" }}
        >
          <User size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5">Your</p>
          <p className="text-sm font-bold text-gray-900 leading-none">Profile</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-1 mb-2">
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: 48, height: 48 }}>
          <svg width="48" height="48" className="-rotate-90" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="pc-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5896d7" />
                <stop offset="100%" stopColor="#1f4e98" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r={r} fill="none" stroke="#e8f0fa" strokeWidth={sw} />
            <circle
              cx="24" cy="24" r={r}
              fill="none"
              stroke="url(#pc-arc)"
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black" style={{ color: "#1f4e98" }}>{profileCompleteness}%</span>
          </div>
        </div>

        <div>
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5"
            style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}
          >
            {badge.label}
          </span>
          <p className="text-[11px] text-gray-500">of profile complete</p>
        </div>
      </div>

      <div className="border-t border-gray-100 mb-2 mt-auto" />

      <Link href="/profile" className="flex items-center gap-1.5 text-[#2557a7] text-xs font-semibold hover:gap-2.5 transition-all group/cta">
        Complete Profile
        <ArrowRight size={11} className="ml-auto opacity-0 group-hover/cta:opacity-100 transition-opacity" />
      </Link>
    </div>
  );
};

/* ── ATS Score Popup ────────────────────────────────────────── */
const AtsScorePopup: React.FC<{ score: number; onClose: () => void }> = ({ score, onClose }) => {
  const pct = Math.min(Math.max(score, 0), 100);
  const circ = 2 * Math.PI * 40;
  const offset = circ * (1 - pct / 100);
  const scoreColor = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel = pct >= 70 ? "Good" : pct >= 40 ? "Average" : "Needs Work";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1f4e98, #2557a7, #5896d7)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <ScanSearch size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider leading-none mb-0.5">ATS Analysis</p>
              <p className="text-sm font-bold text-white leading-none">Your ATS Score</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-5">
          {/* Score ring */}
          <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="40"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ color: scoreColor }}>{pct}</span>
              <span className="text-[10px] font-bold text-gray-400">/ 100</span>
            </div>
          </div>

          {/* Badge */}
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: scoreColor + "18", color: scoreColor, border: `1px solid ${scoreColor}40` }}
          >
            {scoreLabel}
          </span>

          {/* Score breakdown hint */}
          <div className="w-full rounded-xl p-4" style={{ background: "#f8faff", border: "1px solid #dbeafe" }}>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              {pct >= 70
                ? "Your resume is ATS-friendly and stands a good chance of passing filters."
                : pct >= 40
                ? "Your resume passes some ATS checks but has room for improvement."
                : "Your resume needs optimization to pass ATS filters effectively."}
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              For a detailed breakdown of sections, keyword gaps, and suggestions, visit the full ATS Scan report.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex gap-2 w-full">
            <Link
              href="/atslogin"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #2557a7, #1f4e98)" }}
              onClick={onClose}
            >
              Full ATS Report <ArrowRight size={12} />
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Hero Action Card (step-driven) ────────────────────────── */
interface HeroStep {
  stepNum: number;
  label: string;
  title: string;
  description: string;
  tags: string[];
  ctaText: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  ctaLoading?: boolean;
  rightLabel: string;
  rightSublabel: string;
  creditCost?: number;
  atsScore?: number;
}

const HeroActionCard: React.FC<{
  heroStep: HeroStep;
  progressValue: number;
  progressLabel: string;
  atsScore?: number | null;
}> = ({ heroStep, progressValue, progressLabel, atsScore }) => {
  const hasAts = atsScore !== null && atsScore !== undefined;
  const atsColor = hasAts
    ? (atsScore! >= 70 ? "rgba(74,222,128,0.9)" : atsScore! >= 40 ? "rgba(251,191,36,0.9)" : "rgba(248,113,113,0.9)")
    : "url(#hero-arc)";
  const ringValue = hasAts ? atsScore! : progressValue;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-sm border border-blue-200"
      style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #1f4e98 40%, #2557a7 70%, #3b82f6 100%)" }}
    >
      {/* Decorative mesh */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
        viewBox="0 0 700 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`v${i}`} x1={i * 100 + 50} y1="0" x2={i * 100 + 50} y2="220" stroke="white" strokeWidth="0.5" />
        ))}
        {[0,1,2,3].map(i => (
          <line key={`h${i}`} x1="0" y1={i * 55 + 27} x2="700" y2={i * 55 + 27} stroke="white" strokeWidth="0.5" />
        ))}
        <line x1="500" y1="0" x2="700" y2="220" stroke="white" strokeWidth="1" opacity="0.6" />
        <line x1="450" y1="0" x2="650" y2="220" stroke="white" strokeWidth="0.6" opacity="0.4" />
      </svg>
      <div
        className="absolute right-0 top-0 bottom-0 w-72 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 80% at 60% 50%, rgba(147,197,253,0.18) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch">
        {/* Left */}
        <div className="flex-1 p-5 md:p-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            <span className="text-[10px] font-bold text-white/80 tracking-wide">STEP {heroStep.stepNum} OF 5</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white mb-1.5 leading-tight">
            {heroStep.title}
          </h2>
          <p className="text-white/70 text-xs leading-relaxed mb-3 max-w-md">
            {heroStep.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {heroStep.tags.map((f) => (
              <span
                key={f}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {f}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {heroStep.ctaHref ? (
              <Link
                href={heroStep.ctaHref}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "white", color: "#1f4e98" }}
              >
                <ArrowRight size={14} />
                {heroStep.ctaText}
              </Link>
            ) : (
              <button
                onClick={heroStep.onCtaClick}
                disabled={heroStep.ctaLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                style={{ background: "white", color: "#1f4e98" }}
              >
                {heroStep.ctaLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Scanning…</>
                  : <><Upload size={14} /> {heroStep.ctaText}</>
                }
              </button>
            )}
            {heroStep.creditCost !== undefined && !heroStep.ctaLoading && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
                <Sparkles size={10} className="text-yellow-300" />
                <span className="text-[10px] font-bold text-white/90">{heroStep.creditCost} Credits</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: ring — shows ATS score after scan, profile % otherwise */}
        <div className="flex items-center justify-center px-6 py-5 md:py-0 md:min-w-48 shrink-0" style={{ background: "rgba(0,0,0,0.15)" }}>
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center" style={{ width: 116, height: 116 }}>
              <svg width="116" height="116" className="-rotate-90" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="hero-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="100%" stopColor="rgba(147,197,253,0.9)" />
                  </linearGradient>
                </defs>
                <circle cx="58" cy="58" r="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="8" />
                <circle
                  cx="58" cy="58" r="48"
                  fill="none"
                  stroke={atsColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - ringValue / 100)}
                  style={{ transition: "stroke-dashoffset 0.9s ease", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.4))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{ringValue}%</span>
                <span className="text-[10px] text-white/60 font-medium">{hasAts ? "ATS Score" : progressLabel}</span>
              </div>
            </div>
            <p className="text-white/70 text-[10px] font-medium text-center">
              {hasAts ? `Score saved · tap for details` : heroStep.rightLabel}<br />
              {hasAts ? "View full report on ATS page" : heroStep.rightSublabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Feature Preview Card ───────────────────────────────── */
const FEATURE_CARDS = [
  {
    icon: <ScanSearch size={17} />,
    title: "ATS Scan",
    headline: "Check ATS Compatibility",
    description: "Upload your resume to see your ATS compatibility score and get improvement tips.",
    ctaText: "Scan Now",
    ctaHref: "/atslogin",
    color: "#2557a7",
    forceAvailable: true,
    unlockCondition: "",
    lockedCtaText: "",
    lockedCtaHref: "",
  },
  {
    icon: <FileText size={17} />,
    title: "Resume Builder",
    headline: "Build a Standout Resume",
    description: "Create a professional resume with AI-powered templates and live scoring.",
    ctaText: "Start Building",
    ctaHref: "/builder/start",
    color: "#6366f1",
    forceLocked: true,
    unlockCondition: "Complete your ATS scan to unlock Resume Builder.",
    lockedCtaText: "Scan Resume",
    lockedCtaHref: "/atslogin",
  },
  {
    icon: <Search size={17} />,
    title: "Jobs",
    headline: "Find Your Dream Job",
    description: "Explore 150+ curated job listings matched to your profile and skills.",
    ctaText: "Explore Jobs",
    ctaHref: "/jobs",
    color: "#f59e0b",
    unlockCondition: "Complete your profile to 40% to unlock Jobs.",
    lockedCtaText: "Complete Profile",
    lockedCtaHref: "/profile",
  },
  {
    icon: <Briefcase size={17} />,
    title: "Job Match",
    headline: "AI-Powered Job Match",
    description: "Instantly compare your resume against any job description with AI analysis.",
    ctaText: "Match Now",
    ctaHref: "/jobmatch",
    color: "#8b5cf6",
    unlockCondition: "Complete your profile to 60% to unlock Job Match.",
    lockedCtaText: "Complete Profile",
    lockedCtaHref: "/profile",
  },
  {
    icon: <Wand2 size={17} />,
    title: "Enhance Resume",
    headline: "AI Resume Boost",
    description: "Let AI rewrite and strengthen your resume content for maximum impact.",
    ctaText: "Enhance Now",
    ctaHref: "/builder",
    color: "#ec4899",
    unlockCondition: "Build a resume first to unlock AI Enhancement.",
    lockedCtaText: "Build Resume",
    lockedCtaHref: "/builder/start",
  },
  {
    icon: <MessageSquare size={17} />,
    title: "Communication",
    headline: "Ace Your Interview",
    description: "Practice with AI mock interviews and get real-time feedback on your communication.",
    ctaText: "Start Prep",
    ctaHref: "/communication",
    color: "#0ea5e9",
    unlockCondition: "Complete all steps to unlock Interview Prep.",
    lockedCtaText: "View Steps",
    lockedCtaHref: "/profile",
  },
];

const FeaturePreviewCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  headline: string;
  status: "available" | "locked";
  description: string;
  ctaText: string;
  ctaHref?: string;
  color?: string;
  unlockCondition?: string;
  lockedCtaText?: string;
  lockedCtaHref?: string;
}> = ({ icon, title, headline, status, description, ctaText, ctaHref, color = "#2557a7", unlockCondition, lockedCtaText, lockedCtaHref }) => {
  const isLocked = status === "locked";

  if (isLocked) {
    return (
      <div className="relative bg-gray-50 rounded-2xl p-4 flex flex-col h-full border border-gray-200">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-200">
            <Lock size={15} className="text-gray-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500">{title}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Lock size={9} className="text-gray-400" />
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Locked</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed flex-1 mb-3">{unlockCondition}</p>
        <div className="border-t border-dashed border-gray-200 mb-3" />
        <Link
          href={lockedCtaHref || "#"}
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-[11px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {lockedCtaText}
          <ArrowRight size={11} />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl p-4 flex flex-col overflow-hidden h-full border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Top color accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: color }}
      />

      <div className="flex items-center gap-2.5 mb-3 mt-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: color }}
        >
          <span className="text-white">{icon}</span>
        </div>
        <span className="text-xs font-bold text-gray-900">{title}</span>
      </div>

      <h3 className="text-sm font-bold leading-snug mb-1.5 text-gray-900">{headline}</h3>
      <p className="text-[11px] leading-relaxed flex-1 mb-4 text-gray-500">{description}</p>

      <Link
        href={ctaHref || "#"}
        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-[11px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
        style={{ background: color }}
      >
        {ctaText}
        <ChevronRight size={12} />
      </Link>
    </div>
  );
};

/* ── Features Carousel ──────────────────────────────────── */
const FeaturesCarousel: React.FC<{ profileCompleteness: number }> = ({ profileCompleteness }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const getFeatureStatus = (index: number): "available" | "locked" => {
    if (index === 0) return "available";
    const unlockThresholds = [20, 40, 60, 80, 100];
    return profileCompleteness >= unlockThresholds[index - 1] ? "available" : "locked";
  };

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {FEATURE_CARDS.map((card, index) => {
          const status = card.forceAvailable
            ? "available"
            : (card as { forceLocked?: boolean }).forceLocked
            ? "locked"
            : getFeatureStatus(index);
          return (
            <div key={card.title} className="w-56 shrink-0">
              <FeaturePreviewCard {...card} status={status} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Recent Activity ─────────────────────────────────────── */
const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "ats_scan":        return <ScanSearch size={13} />;
    case "resume_enhanced": return <Wand2 size={13} />;
    case "profile_updated": return <User size={13} />;
    default:                return <FileText size={13} />;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RecentActivitySection: React.FC<{ activities: any[] }> = ({ activities }) => {
  const formatTimeAgo = (timestamp: string): string => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,87,167,0.05) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #5896d7, #2557a7)" }}
          >
            <Clock size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5">History</p>
            <p className="text-sm font-bold text-gray-900 leading-none">Recent Activity</p>
          </div>
        </div>
        <Link
          href="/dashboard/recent-activity"
          className="flex items-center gap-1 text-[11px] font-semibold hover:gap-2 transition-all"
          style={{ color: "#2557a7" }}
        >
          View All <ChevronRight size={11} />
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-5 flex-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}
          >
            <Clock size={20} style={{ color: "#5896d7" }} />
          </div>
          <p className="text-gray-600 text-sm font-semibold mb-1">No activity yet</p>
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            Your recent actions will appear here once you start using features.
          </p>
        </div>
      ) : (
        <div className="flex-1">
          {activities.slice(0, 5).map((item, idx) => {
            const isFree = item.credits_used === 0;
            const icon = getActivityIcon(item.type || "default");

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors group ${idx > 0 ? "border-t border-gray-50" : ""}`}
              >
                {/* Timeline dot + connector */}
                <div className="flex flex-col items-center shrink-0 self-stretch">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}
                  >
                    <span style={{ color: "#2557a7" }}>{icon}</span>
                  </div>
                  {idx < 4 && (
                    <div className="w-px flex-1 mt-1" style={{ background: "linear-gradient(to bottom, #dbeafe, transparent)" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-snug">
                    {item.feature_label}
                  </p>
                  <p className="text-[10px] text-gray-400 tabular-nums mt-0.5">{formatTimeAgo(item.timestamp)}</p>
                </div>

                {/* Credit badge */}
                {isFree ? (
                  <span
                    className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}
                  >
                    Free
                  </span>
                ) : (
                  <span
                    className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#eff6ff", color: "#1f4e98", border: "1px solid #bfdbfe" }}
                  >
                    {item.credits_used} cr
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {activities.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Showing last {Math.min(activities.length, 5)} actions</span>
          <Link
            href="/dashboard/recent-activity"
            className="text-[10px] font-semibold flex items-center gap-0.5 hover:gap-1 transition-all"
            style={{ color: "#5896d7" }}
          >
            Full history <ArrowRight size={10} />
          </Link>
        </div>
      )}
    </div>
  );
};

/* ── Feature-wise Usage Chart ───────────────────────────── */
interface FeatureUsageData { feature: string; usage: number; }

const FeatureWiseUsageChart: React.FC<{
  creditsUsed: number;
  creditsTotal: number;
  featureData?: FeatureUsageData[];
}> = ({ creditsUsed, creditsTotal, featureData }) => {
  const data = featureData || [
    { feature: "Resume", usage: 85 },
    { feature: "Jobs", usage: 90 },
    { feature: "Interview", usage: 60 },
    { feature: "Assessment", usage: 95 },
  ];

  const maxV = Math.max(...data.map(d => d.usage), 1);
  const usedPct = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0;

  // Brand-only opacities for bar fills
  const barOpacities = ["1", "0.75", "0.55", "0.35"];

  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col overflow-hidden">
      {/* Subtle background decoration */}
      <div
        className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,87,167,0.05) 0%, transparent 70%)" }}
      />
      <div className="absolute bottom-0 right-0 pointer-events-none opacity-[0.04]">
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
          {[0,1,2,3,4].flatMap(r => [0,1,2,3,4].map(c => (
            <circle key={`${r}-${c}`} cx={c * 14 + 5} cy={r * 14 + 5} r="1.8" fill="#2557a7" />
          )))}
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #5896d7, #2557a7)" }}
          >
            <BarChart3 size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none mb-0.5">Analytics</p>
            <p className="text-sm font-bold text-gray-900 leading-none">Feature Usage</p>
          </div>
        </div>

        {/* Credits donut summary */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Credits Used</p>
            <p className="text-sm font-black tabular-nums leading-none" style={{ color: "#1f4e98" }}>
              {creditsUsed}<span className="text-[10px] font-medium text-gray-400"> / {creditsTotal}</span>
            </p>
          </div>
          {/* Mini donut */}
          <div className="relative flex items-center justify-center shrink-0" style={{ width: 36, height: 36 }}>
            <svg width="36" height="36" className="-rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e8f0fa" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke="#2557a7"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - usedPct / 100)}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <span className="absolute text-[8px] font-black" style={{ color: "#1f4e98" }}>{usedPct}%</span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3 flex-1">
        {data.map((d, i) => {
          const widthPct = (d.usage / maxV) * 100;
          return (
            <div key={d.feature} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "#2557a7", opacity: parseFloat(barOpacities[i % barOpacities.length]) }}
                  />
                  <span className="text-[11px] font-semibold text-gray-700">{d.feature}</span>
                </div>
                <span className="text-[11px] font-black tabular-nums" style={{ color: "#2557a7", opacity: parseFloat(barOpacities[i % barOpacities.length]) + 0.1 }}>
                  {d.usage}
                </span>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(to right, #1f4e98, #5896d7)`,
                    opacity: parseFloat(barOpacities[i % barOpacities.length]),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Credits usage by feature</span>
        <span className="text-[10px] font-semibold" style={{ color: "#5896d7" }}>{creditsTotal - creditsUsed} remaining</span>
      </div>
    </div>
  );
};

/* ── Dashboard Content ──────────────────────────────────── */
const DashboardContent: React.FC<{ data: DashboardSummary }> = ({ data }) => {
  const { user, plan, profile, usage_counts, recent_activity, trending_roles } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { step, error, result, resumeId, fill, reset } = useResumeProfileFill();
  const [atsScanLoading, setAtsScanLoading] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [showAtsPopup, setShowAtsPopup] = useState(false);

  const modalOpen = step !== "idle";

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) fill(file);
    e.target.value = "";
  };

  const handleAtsScan = async () => {
    const rid = resumeId ?? localStorage.getItem("dashboard_resume_id");
    if (!rid) {
      toast.error("Resume not found. Please upload your resume first.");
      return;
    }
    setAtsScanLoading(true);
    try {
      const { enhanceResume } = await import("@/api/enhancerApi");
      const res = await enhanceResume({ resume_id: rid });
      const breakdown = (res as unknown as Record<string, unknown>)?.enhancer_state as Record<string, unknown> | undefined;
      const atsBreakdown = breakdown?.ats_breakdown as Record<string, unknown> | undefined;
      const score = Number(
        atsBreakdown?.FinalScore ?? atsBreakdown?.Percentage ?? atsBreakdown?.overall_score ??
        atsBreakdown?.final_score ?? atsBreakdown?.percentage ?? atsBreakdown?.score ??
        atsBreakdown?.TotalScore ?? 0
      );
      localStorage.setItem("atsAnalysisData", JSON.stringify({
        resume_id: rid,
        ats_score: atsBreakdown ?? {},
        finalWeightedScore: score,
        missingFields: [],
        scanned_pdf: false,
      }));
      localStorage.setItem("currentScore", String(score));
      localStorage.setItem("isImageBased", "false");
      setAtsScore(score);
      setShowAtsPopup(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ATS scan failed. Please try again.");
    } finally {
      setAtsScanLoading(false);
    }
  };

  // ── Hero step logic (Option A: Value First) ──────────────
  // Step flips immediately when fill completes (resumeFilled flag)
  const resumeFilled = step === "done";
  const hasResume   = usage_counts.resumes_parsed > 0 || usage_counts.resumes_created > 0 || resumeFilled;
  const hasAtsScan  = usage_counts.ats_scans > 0;
  const hasEnhanced = usage_counts.resumes_enhanced > 0;

  const heroStep: HeroStep = !hasResume
    ? {
        stepNum: 1,
        label: "Upload Resume",
        title: "Upload Your Resume",
        description: "Let AI analyze and optimize your resume. Get instant ATS score, keyword improvements, and tailored suggestions.",
        tags: ["AI-Powered Analysis", "ATS Score Check", "Instant Feedback"],
        ctaText: "Upload Resume",
        onCtaClick: handleUploadClick,
        creditCost: 5,
        rightLabel: "Complete your profile",
        rightSublabel: "to unlock all features",
      }
    : !hasAtsScan
    ? {
        stepNum: 2,
        label: "ATS Scan",
        title: "Check Your ATS Score",
        description: "See how your resume performs against ATS filters. Get a detailed compatibility report and fix issues instantly.",
        tags: ["ATS Compatibility", "Keyword Analysis", "Instant Report"],
        ctaText: "Scan Resume",
        onCtaClick: handleAtsScan,
        ctaLoading: atsScanLoading,
        creditCost: 3,
        rightLabel: "Resume uploaded",
        rightSublabel: "ready for scanning",
      }
    : !hasEnhanced
    ? {
        stepNum: 3,
        label: "Enhance Resume",
        title: "AI Resume Enhancement",
        description: "Let AI rewrite and strengthen your resume content for maximum impact and recruiter attention.",
        tags: ["AI Rewrite", "Stronger Bullets", "Keyword Boost"],
        ctaText: "Enhance Now",
        ctaHref: "/builder",
        creditCost: 10,
        rightLabel: "ATS scan done",
        rightSublabel: "now boost your resume",
      }
    : profile.completeness < 80
    ? {
        stepNum: 4,
        label: "Complete Profile",
        title: "Complete Your Profile",
        description: "A complete profile unlocks job matching, interview prep, and personalized career recommendations.",
        tags: ["Job Matching", "Interview Prep", "Career Insights"],
        ctaText: "Complete Profile",
        ctaHref: "/profile",
        rightLabel: "Almost there",
        rightSublabel: "finish your profile",
      }
    : {
        stepNum: 5,
        label: "Browse & Apply",
        title: "Browse & Apply to Jobs",
        description: "You're all set! Explore curated job listings matched to your profile and start applying today.",
        tags: ["Curated Listings", "AI Job Match", "1-Click Apply"],
        ctaText: "Explore Jobs",
        ctaHref: "/jobs",
        rightLabel: "Profile complete",
        rightSublabel: "start applying now",
      };

  const featureData: FeatureUsageData[] = [
    { feature: "Resume",    usage: usage_counts.resumes_created + usage_counts.resumes_parsed },
    { feature: "Jobs",      usage: usage_counts.job_matches + usage_counts.job_applications },
    { feature: "Interview", usage: usage_counts.assessments_taken },
    { feature: "ATS",       usage: usage_counts.ats_scans },
  ];

  const creditsUsed = Math.max(0, plan.credits_total - plan.credits_remaining);

  return (
    <>
      <div className="p-5 md:p-6 max-w-[1400px] mx-auto space-y-4">

        {/* Welcome banner */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
              {getGreeting()}, <span style={{ color: "#2557a7" }}>{user.name}</span> 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Here&apos;s your career progress at a glance.</p>
          </div>
          <div
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
          >
            <Zap size={13} />
            {plan.credits_remaining} credits left
          </div>
        </div>

        {/* Row 1 – 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PlanCreditCard
            planId={plan.plan_id}
            creditsRemaining={plan.credits_remaining}
            creditsTotal={plan.credits_total}
          />
          <ProfileCompletenessCard profileCompleteness={profile.completeness} />
          <JobMarketInsightsCard roles={trending_roles ?? []} />
        </div>

        {/* Row 2 – Step hero card */}
        <HeroActionCard
          heroStep={heroStep}
          progressValue={profile.completeness}
          progressLabel="Profile"
          atsScore={atsScore}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Row 3 – Features */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-gray-500">
              Explore features · unlock more as you progress
            </p>
          </div>
          <FeaturesCarousel profileCompleteness={profile.completeness} />
        </div>

        {/* Row 4 – Activity + Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentActivitySection activities={recent_activity} />
          <FeatureWiseUsageChart
            creditsUsed={creditsUsed}
            creditsTotal={plan.credits_total}
            featureData={featureData}
          />
        </div>

        <div className="h-4" />
      </div>

      <ProfileFillModal
        isOpen={modalOpen}
        onClose={reset}
        step={step}
        error={error}
        result={result}
      />
      {showAtsPopup && atsScore !== null && (
        <AtsScorePopup
          score={atsScore}
          onClose={() => setShowAtsPopup(false)}
        />
      )}
    </>
  );
};

/* ── Main Export ─────────────────────────────────────────── */
const FirstTimeDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-5 md:p-6 max-w-[1400px] mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-44 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="w-56 h-44 bg-gray-100 rounded-2xl shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 bg-gray-100 rounded-2xl" />
          <div className="h-56 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 md:p-6 max-w-[1400px] mx-auto flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold text-sm">Failed to load dashboard</p>
          <p className="text-gray-500 text-xs">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#2557a7] hover:bg-[#1f4e98] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <DashboardContent data={data} />;
};

export default FirstTimeDashboard;
