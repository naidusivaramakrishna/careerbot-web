"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { DashboardSummary } from "@/types/dashboard.types";
import { Loader2 } from "lucide-react";
import {
  Crown, Sparkles, ChevronRight, Upload, ScanSearch, Briefcase,
  MessageSquare, FileText, Search, Wand2, ArrowRight,
  User, Zap, X, Activity, Check, TrendingUp,
} from "lucide-react";
import ProfileFillModal from "./ProfileFillModal";
import { useResumeProfileFill } from "@/hooks/useResumeProfileFill";
import { toast } from "sonner";

/* ─── helpers ─────────────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const timeAgo = (ts: string) => {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000), hr = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const STEP_LABELS = ["Upload Resume", "ATS Scan", "AI Enhance", "Build Profile", "Apply to Jobs"];

/* ─── card shell ──────────────────────────────────────────────────── */
const Card: React.FC<{ className?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  className = "", style, children,
}) => (
  <div
    className={`bg-white rounded-2xl ${className}`}
    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.05)", ...style }}
  >
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   1. PAGE HEADER
═══════════════════════════════════════════════════════════════════ */
const PageHeader: React.FC<{
  userName: string; planId: string; creditsRemaining: number;
}> = ({ userName, planId, creditsRemaining }) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div>
        <p className="text-[11px] font-medium text-gray-400 mb-2 tracking-wide">
          {greeting()} — {today}
        </p>
        <h1 className="text-[32px] font-black leading-none tracking-tight text-gray-950">
          Welcome back,{" "}
          <span style={{ color: "#2557a7" }}>{userName.split(" ")[0]}</span>
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-3 shrink-0 pt-1">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-100"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div>
            <p className="text-[15px] font-black text-gray-900 leading-none text-right">
              {creditsRemaining.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{planId} plan</p>
          </div>
          <span className="w-px h-6 bg-gray-100" />
          <span className="text-[11px] font-semibold text-gray-400">Credits</span>
        </div>
        <Link
          href="/payments"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all"
          style={{
            background: "linear-gradient(135deg,#2f68d4,#2557a7)",
            boxShadow: "0 4px 14px rgba(37,87,167,0.32)",
          }}
        >
          <Crown size={13} /> Upgrade
        </Link>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   2. HERO ACTION CARD
═══════════════════════════════════════════════════════════════════ */
interface StepConfig {
  stepNum: number; title: string; description: string; tags: string[];
  ctaText: string; ctaHref?: string; onCtaClick?: () => void;
  ctaLoading?: boolean; creditCost?: number;
  profilePct: number; atsScore?: number | null;
}

const HeroCard: React.FC<{ step: StepConfig }> = ({ step }) => {
  const hasAts  = step.atsScore !== null && step.atsScore !== undefined;
  const ringVal = hasAts ? step.atsScore! : step.profilePct;
  const circ    = 2 * Math.PI * 46;
  const offset  = circ * (1 - Math.min(ringVal, 100) / 100);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden mb-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04),0 8px 28px rgba(0,0,0,0.07)" }}
    >
      {/* Top accent */}
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#1a3f7a,#2557a7,#4a80d4)" }} />

      {/* Stepper */}
      <div className="px-6 py-3.5 border-b border-gray-50">
        <div className="flex items-center">
          {STEP_LABELS.map((label, i) => {
            const done = i + 1 < step.stepNum;
            const curr = i + 1 === step.stepNum;
            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      fontSize: "9px", fontWeight: 700,
                      background: done ? "#2557a7" : curr ? "#eef3fb" : "#f1f5f9",
                      border: curr ? "1.5px solid #2557a7" : "none",
                      color: done ? "#fff" : curr ? "#2557a7" : "#94a3b8",
                    }}
                  >
                    {done ? <Check size={8} strokeWidth={3} /> : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-medium hidden xl:block truncate"
                    style={{ color: done || curr ? "#2557a7" : "#94a3b8" }}
                  >
                    {label}
                  </span>
                </div>
                {i < 4 && (
                  <div
                    className="flex-1 h-px mx-2 min-w-[8px]"
                    style={{ background: done ? "#2557a7" : "#e2e8f0" }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row">
        {/* Content */}
        <div className="flex-1 px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-block text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
              style={{ background: "#eef3fb", color: "#2557a7" }}
            >
              Step {step.stepNum} of 5
            </span>
          </div>
          <h2 className="text-[22px] font-black text-gray-950 leading-tight tracking-tight mb-2">
            {step.title}
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-4 max-w-lg">
            {step.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {step.tags.map(t => (
              <span
                key={t}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg text-gray-500"
                style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {step.ctaHref ? (
              <Link
                href={step.ctaHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all"
                style={{
                  background: "linear-gradient(135deg,#2f68d4,#2557a7)",
                  boxShadow: "0 4px 14px rgba(37,87,167,0.32)",
                }}
              >
                {step.ctaText} <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                onClick={step.onCtaClick}
                disabled={step.ctaLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#2f68d4,#2557a7)",
                  boxShadow: "0 4px 14px rgba(37,87,167,0.32)",
                }}
              >
                {step.ctaLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  : <><Upload size={14} /> {step.ctaText}</>}
              </button>
            )}
            {step.creditCost !== undefined && !step.ctaLoading && (
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Zap size={11} className="text-gray-300" /> {step.creditCost} credits
              </p>
            )}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex items-center justify-center px-6 py-5 lg:w-44 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-50 bg-[#fafbfc]">
          <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: 88, height: 88 }}>
              <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="44" cy="44" r="36" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                <circle
                  cx="44" cy="44" r="36" fill="none" stroke="#2557a7" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - Math.min(ringVal, 100) / 100)}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-black text-gray-950 leading-none">{ringVal}</span>
                <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                  {hasAts ? "ATS" : "Profile"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              {hasAts ? "Resume scanned" : `${100 - step.profilePct}% remaining`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   3. STAT CARDS
═══════════════════════════════════════════════════════════════════ */
const StatCard: React.FC<{
  label: string; value: string | number; sub: string; icon: React.ElementType;
}> = ({ label, value, sub, icon: Icon }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between mb-5">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none">
        {label}
      </p>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50">
        <Icon size={13} className="text-gray-300" strokeWidth={1.75} />
      </div>
    </div>
    <p className="text-[44px] font-black text-gray-950 leading-none tracking-tighter mb-2">
      {value}
    </p>
    <p className="text-[11px] text-gray-400 leading-none">{sub}</p>
  </Card>
);

/* ═══════════════════════════════════════════════════════════════════
   4. CAREER TOOLS
═══════════════════════════════════════════════════════════════════ */
const TOOLS = [
  { Icon: ScanSearch,    title: "ATS Scan",       desc: "Instant compatibility score with keyword gap analysis.",          href: "/atslogin"      },
  { Icon: FileText,      title: "Resume Builder", desc: "AI-assisted templates with live scoring and real-time feedback.", href: "/builder/start" },
  { Icon: Search,        title: "Jobs",           desc: "Browse 150+ curated listings matched to your experience.",        href: "/jobs"          },
  { Icon: Briefcase,     title: "Job Match",      desc: "Paste any job description for instant AI-powered fit analysis.",  href: "/jobmatch"      },
  { Icon: Wand2,         title: "AI Enhance",     desc: "AI rewrites bullet points for maximum recruiter impact.",         href: "/enhancer"      },
  { Icon: MessageSquare, title: "Interview Prep", desc: "Practice with live AI mock interviews and real-time coaching.",   href: "/communication" },
];

const ToolCard: React.FC<{
  Icon: React.ElementType; title: string; desc: string; href: string;
}> = ({ Icon, title, desc, href }) => (
  <div
    className="relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(37,87,167,0.13)] cursor-pointer"
    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)" }}
  >
    <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#2557a7,#4a80d4)" }} />
    <div className="p-5 flex flex-col flex-1">
      <div className="mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#eef3fb" }}>
          <Icon size={17} style={{ color: "#2557a7" }} strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-[13px] font-bold text-gray-900 mb-1.5">{title}</p>
      <p className="text-[11px] text-gray-400 leading-relaxed flex-1 mb-4">{desc}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-0.5 text-[12px] font-bold transition-all group hover:gap-1.5"
        style={{ color: "#2557a7" }}
      >
        Get started
        <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   5. ACTIVITY FEED
═══════════════════════════════════════════════════════════════════ */
const ICON_MAP: Record<string, React.ElementType> = {
  ats_scan: ScanSearch, resume_enhanced: Wand2, profile_updated: User,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActivityFeed: React.FC<{ activities: any[] }> = ({ activities }) => (
  <Card className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
      <h3 className="text-[14px] font-bold text-gray-900">Recent Activity</h3>
      <Link
        href="/dashboard/recent-activity"
        className="text-[12px] font-bold hover:opacity-70 transition-opacity"
        style={{ color: "#2557a7" }}
      >
        View all
      </Link>
    </div>

    {activities.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#eef3fb" }}>
          <Activity size={20} style={{ color: "#2557a7" }} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-gray-700">No activity yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Use any career tool to get started</p>
        </div>
      </div>
    ) : (
      <div className="flex-1 divide-y divide-gray-50">
        {activities.slice(0, 6).map((item, idx) => {
          const IconC = ICON_MAP[item.type?.toLowerCase()] ?? FileText;
          return (
            <div
              key={item.id || idx}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#eef3fb" }}
              >
                <IconC size={13} style={{ color: "#2557a7" }} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{item.feature_label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(item.timestamp)}</p>
              </div>
              {item.credits_used > 0 && (
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: "#eef3fb", color: "#2557a7" }}
                >
                  {item.credits_used}cr
                </span>
              )}
            </div>
          );
        })}
      </div>
    )}

    {activities.length > 0 && (
      <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          Showing {Math.min(activities.length, 6)} of {activities.length}
        </span>
        <Link
          href="/dashboard/recent-activity"
          className="text-[11px] font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
          style={{ color: "#2557a7" }}
        >
          Full history <ArrowRight size={10} />
        </Link>
      </div>
    )}
  </Card>
);

/* ═══════════════════════════════════════════════════════════════════
   6. JOB TRENDS
═══════════════════════════════════════════════════════════════════ */
const MarketCard: React.FC<{ roles: DashboardSummary["trending_roles"] }> = ({ roles }) => (
  <Card className="flex flex-col">
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#eef3fb" }}>
          <TrendingUp size={13} style={{ color: "#2557a7" }} strokeWidth={2} />
        </div>
        <h3 className="text-[14px] font-bold text-gray-900">Job Trends</h3>
      </div>
      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 px-2.5 py-1.5 rounded-full bg-gray-100">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2557a7] animate-pulse" />
        Live
      </span>
    </div>
    <div className="p-3 flex-1">
      {roles.map((role, idx) => (
        <div
          key={role.title}
          className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <span className="text-[10px] font-black text-gray-200 w-5 shrink-0 tabular-nums text-right">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 text-[13px] font-semibold text-gray-800 truncate">{role.title}</span>
          <span className="text-[12px] font-black tabular-nums shrink-0" style={{ color: "#2557a7" }}>
            {role.growth}
          </span>
        </div>
      ))}
    </div>
    <div className="px-6 py-4 border-t border-gray-50">
      <Link
        href="/jobs"
        className="flex items-center justify-between text-[12px] font-bold hover:opacity-70 transition-opacity"
        style={{ color: "#2557a7" }}
      >
        Explore all jobs <ArrowRight size={13} />
      </Link>
    </div>
  </Card>
);

/* ═══════════════════════════════════════════════════════════════════
   7. CREDIT USAGE
═══════════════════════════════════════════════════════════════════ */
const UsagePanel: React.FC<{
  creditsUsed: number; creditsTotal: number;
  featureData: Array<{ feature: string; usage: number }>;
}> = ({ creditsUsed, creditsTotal, featureData }) => {
  const pct = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0;
  const max = Math.max(...featureData.map(d => d.usage), 1);
  const remaining = creditsTotal - creditsUsed;

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
        <h3 className="text-[14px] font-bold text-gray-900">Credit Usage</h3>
        <div className="text-right">
          <p className="text-[17px] font-black text-gray-900 leading-none">{creditsUsed.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">of {creditsTotal.toLocaleString()} used</p>
        </div>
      </div>
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-gray-500">Total usage</span>
          <span className="text-[11px] font-black text-gray-700">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2557a7,#4a80d4)" }}
          />
        </div>
      </div>
      <div className="px-6 py-5 space-y-4 flex-1">
        {featureData.map((d, i) => {
          const w   = max > 0 ? (d.usage / max) * 100 : 0;
          const op  = [1, 0.7, 0.5, 0.3][i % 4];
          return (
            <div key={d.feature}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-500">{d.feature}</span>
                <span className="text-[11px] font-bold text-gray-700 tabular-nums">{d.usage}</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${w}%`, background: "#2557a7", opacity: op }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Remaining</span>
        <span className="text-[12px] font-black" style={{ color: "#2557a7" }}>
          {remaining.toLocaleString()} credits
        </span>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   8. ATS POPUP
═══════════════════════════════════════════════════════════════════ */
const AtsPopup: React.FC<{ score: number; onClose: () => void }> = ({ score, onClose }) => {
  const pct    = Math.min(Math.max(score, 0), 100);
  const circ   = 2 * Math.PI * 46;
  const offset = circ * (1 - pct / 100);
  const label  = pct >= 70 ? "ATS-Friendly" : pct >= 40 ? "Needs Improvement" : "Poor Match";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-sm overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="text-[14px] font-bold text-gray-900">ATS Score Report</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="p-8 flex flex-col items-center gap-5">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="60" cy="60" r="46" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="46" fill="none" stroke="#2557a7" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[34px] font-black text-gray-950 leading-none">{pct}</span>
              <span className="text-[10px] text-gray-400 mt-1">/ 100</span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 tracking-wide">
            {label}
          </span>
          <p className="text-[13px] text-gray-500 text-center leading-relaxed">
            {pct >= 70
              ? "Your resume is well-optimized for ATS screening systems."
              : pct >= 40
              ? "A few targeted tweaks will significantly improve your score."
              : "Your resume needs optimization to pass ATS filters effectively."}
          </p>
          <div className="flex gap-3 w-full">
            <Link
              href="/atslogin"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition-opacity"
              style={{
                background: "linear-gradient(135deg,#2f68d4,#2557a7)",
                boxShadow: "0 4px 12px rgba(37,87,167,0.3)",
              }}
            >
              Full Report <ArrowRight size={13} />
            </Link>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-[13px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   9. DASHBOARD CONTENT
═══════════════════════════════════════════════════════════════════ */
const DashboardContent: React.FC<{ data: DashboardSummary }> = ({ data }) => {
  const { user, plan, profile, usage_counts, recent_activity, trending_roles } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { step, error: fillError, result: fillResult, resumeId, fill, reset } = useResumeProfileFill();

  const [atsScanLoading, setAtsScanLoading] = useState(false);
  const [atsScore,       setAtsScore]       = useState<number | null>(null);
  const [showAtsPopup,   setShowAtsPopup]   = useState(false);

  const modalOpen    = step !== "idle";
  const resumeFilled = step === "done";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) fill(file);
    e.target.value = "";
  };

  const handleAtsScan = async () => {
    const rid = resumeId ?? localStorage.getItem("dashboard_resume_id");
    if (!rid) { toast.error("Please upload your resume first."); return; }
    setAtsScanLoading(true);
    try {
      const { enhanceResume } = await import("@/api/enhancerApi");
      const res        = await enhanceResume({ resume_id: rid });
      const breakdown  = (res as unknown as Record<string, unknown>)?.enhancer_state as Record<string, unknown> | undefined;
      const atsBreak   = breakdown?.ats_breakdown as Record<string, unknown> | undefined;
      const score      = Number(
        atsBreak?.FinalScore ?? atsBreak?.Percentage ?? atsBreak?.overall_score ??
        atsBreak?.final_score ?? atsBreak?.percentage ?? atsBreak?.score ??
        atsBreak?.TotalScore ?? 0
      );
      localStorage.setItem("atsAnalysisData", JSON.stringify({
        resume_id: rid, ats_score: atsBreak ?? {},
        finalWeightedScore: score, missingFields: [], scanned_pdf: false,
      }));
      localStorage.setItem("currentScore", String(score));
      localStorage.setItem("isImageBased", "false");
      setAtsScore(score);
      setShowAtsPopup(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ATS scan failed.");
    } finally {
      setAtsScanLoading(false);
    }
  };

  const hasResume   = usage_counts.resumes_parsed > 0 || usage_counts.resumes_created > 0 || resumeFilled;
  const hasAtsScan  = usage_counts.ats_scans > 0;
  const hasEnhanced = usage_counts.resumes_enhanced > 0;
  const currentStep = !hasResume ? 1 : !hasAtsScan ? 2 : !hasEnhanced ? 3 : profile.completeness < 80 ? 4 : 5;

  const stepConfig: StepConfig = !hasResume
    ? {
        stepNum: 1, title: "Upload Your Resume",
        description: "Let AI parse and analyze your resume for an instant ATS score, keyword gap analysis, and tailored career suggestions.",
        tags: ["AI Analysis", "ATS Score", "Instant Feedback"],
        ctaText: "Upload Resume", onCtaClick: () => fileInputRef.current?.click(), creditCost: 5,
        profilePct: profile.completeness,
      }
    : !hasAtsScan
    ? {
        stepNum: 2, title: "Check Your ATS Score",
        description: "See how your resume performs against ATS filters. Get a detailed compatibility report and know exactly which keywords to add.",
        tags: ["ATS Compatibility", "Keyword Gaps", "Instant Report"],
        ctaText: "Scan Resume", onCtaClick: handleAtsScan, ctaLoading: atsScanLoading, creditCost: 3,
        profilePct: profile.completeness, atsScore,
      }
    : !hasEnhanced
    ? {
        stepNum: 3, title: "Enhance with AI",
        description: "AI rewrites and strengthens every section of your resume. Stand out with compelling, recruiter-optimized content.",
        tags: ["AI Rewrite", "Stronger Bullets", "Keyword Boost"],
        ctaText: "Enhance Resume", ctaHref: "/enhancer", creditCost: 10,
        profilePct: profile.completeness,
      }
    : profile.completeness < 80
    ? {
        stepNum: 4, title: "Complete Your Profile",
        description: "A complete profile unlocks AI job matching, personalized interview prep, and career-specific recommendations built around you.",
        tags: ["Job Matching", "Interview Prep", "Career Insights"],
        ctaText: "Complete Profile", ctaHref: "/profile",
        profilePct: profile.completeness,
      }
    : {
        stepNum: 5, title: "Browse & Apply to Jobs",
        description: "You're all set. Explore curated job listings matched to your profile and apply in seconds.",
        tags: ["Curated Listings", "AI Job Match", "1-Click Apply"],
        ctaText: "Explore Jobs", ctaHref: "/jobs",
        profilePct: profile.completeness,
      };

  const featureData = [
    { feature: "Resume",    usage: usage_counts.resumes_created + usage_counts.resumes_parsed },
    { feature: "Jobs",      usage: usage_counts.job_matches + usage_counts.job_applications },
    { feature: "Interview", usage: usage_counts.assessments_taken },
    { feature: "ATS Scans", usage: usage_counts.ats_scans },
  ];

  const creditsUsed = Math.max(0, plan.credits_total - plan.credits_remaining);
  const creditPct   = plan.credits_total > 0
    ? Math.round((plan.credits_remaining / plan.credits_total) * 100)
    : 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file" accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      {modalOpen && (
        <ProfileFillModal
          isOpen={modalOpen}
          step={step as "parsing" | "saving" | "done" | "error"}
          result={fillResult} error={fillError} onClose={reset}
        />
      )}
      {showAtsPopup && atsScore !== null && (
        <AtsPopup score={atsScore} onClose={() => setShowAtsPopup(false)} />
      )}

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">

        {/* ── 1. Header ───────────────────────────────────────── */}
        <PageHeader
          userName={user.name}
          planId={plan.plan_id}
          creditsRemaining={plan.credits_remaining}
        />

        {/* ── 2. Hero action card ─────────────────────────────── */}
        <HeroCard step={stepConfig} />

        {/* ── 3. Stat row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard
            icon={User} label="Profile Score"
            value={`${profile.completeness}%`}
            sub={profile.completeness >= 75 ? "Almost complete" : profile.completeness >= 50 ? "Good progress" : "In progress"}
          />
          <StatCard
            icon={Zap} label="Credits Left"
            value={plan.credits_remaining.toLocaleString()}
            sub={`${creditPct}% of total plan`}
          />
          <StatCard
            icon={ScanSearch} label="ATS Score"
            value={atsScore !== null ? atsScore : "—"}
            sub={atsScore !== null
              ? (atsScore >= 70 ? "ATS-Friendly" : atsScore >= 40 ? "Needs work" : "Poor match")
              : "Not yet scanned"}
          />
          <StatCard
            icon={Activity} label="Career Step"
            value={`${currentStep}/5`}
            sub={STEP_LABELS[currentStep - 1]}
          />
        </div>

        {/* ── 4. Career tools ─────────────────────────────────── */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-black text-gray-950">Career Tools</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Complete your journey to unlock all features
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TOOLS.map(tool => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </div>

        {/* ── 5. Activity + side column ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          <div className="lg:col-span-7">
            <ActivityFeed activities={recent_activity} />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-5">
            <MarketCard roles={trending_roles ?? []} />
            <UsagePanel
              creditsUsed={creditsUsed}
              creditsTotal={plan.credits_total}
              featureData={featureData}
            />
          </div>
        </div>

        {/* ── 6. Upgrade strip ────────────────────────────────── */}
        <div
          className="relative rounded-2xl px-8 py-6 flex items-center justify-between gap-6 overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0f2551 0%,#1a3f7a 40%,#2557a7 80%,#3a6fc2 100%)" }}
        >
          <div
            className="absolute -top-12 -right-12 w-60 h-60 rounded-full pointer-events-none"
            style={{ border: "1.5px solid rgba(255,255,255,0.08)" }}
          />
          <div
            className="absolute -bottom-8 left-40 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
          <div className="flex items-center gap-5 relative z-10">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Crown size={19} className="text-yellow-200" />
            </div>
            <div>
              <p className="text-[15px] font-black text-white leading-tight">
                Unlock unlimited access
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                More credits, AI job matching, and priority support on Pro.
              </p>
            </div>
          </div>
          <Link
            href="/payments"
            className="relative z-10 shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold text-[#2557a7] bg-white hover:bg-gray-50 active:scale-[0.98] transition-all"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
          >
            <Sparkles size={13} /> Upgrade to Pro
          </Link>
        </div>

      </div>
    </>
  );
};

export default function FirstTimeDashboard({ data }: { data: DashboardSummary }) {
  return <DashboardContent data={data} />;
}
