"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";

const getStatusBadge = (pct: number) => {
  if (pct >= 100) return { label: "Complete! 🎉", color: "#1f4e98", bg: "#e8eff9" };
  if (pct >= 75)  return { label: "Almost There!", color: "#2557a7", bg: "#f0f5fb" };
  if (pct >= 50)  return { label: "Good Progress", color: "#5896d7", bg: "#eff6ff" };
  if (pct >= 25)  return { label: "In Progress",   color: "#5896d7", bg: "#eff6ff" };
  return               { label: "Just Starting",  color: "#6b7280", bg: "#f9fafb" };
};

/* ── Circular Progress ─────────────────────────────── */
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  gradientId?: string;
}> = ({
  percentage,
  size = 76,
  strokeWidth = 7,
  gradientId = "cp-teal-default",
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const large = size >= 110;

  const isUploadPanel = gradientId === "cp-upload-panel";

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUploadPanel ? "#5896d7" : "#0ea5e9"} />
            <stop offset="100%" stopColor={isUploadPanel ? "#5896d7" : "#14b8a6"} />
          </linearGradient>
          {large && (
            <>
              <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={isUploadPanel ? "4.5" : "3"} result="blur" />
                <feColorMatrix in="blur" type="saturate" values={isUploadPanel ? "1.3" : "1"} />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {isUploadPanel && (
                <filter id={`${gradientId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.25" floodColor="#5896d7" />
                </filter>
              )}
            </>
          )}
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} opacity="0.6" />
        {/* Progress arc with enhanced glow */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isUploadPanel ? "#6b7280" : `url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: large && !isUploadPanel ? `url(#${gradientId}-glow)` : undefined,
          }}
        />
      </svg>
      {/* Centre label with premium styling */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{
            fontSize: large ? size * 0.18 : size * 0.2,
            ...(isUploadPanel
              ? { color: "#6b7280" }
              : {
                  background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }),
          }}
        >
          {percentage}%
        </span>
        <span
          className={large ? "text-gray-500 mt-0.5" : "text-gray-400 mt-0.5"}
          style={{ fontSize: large ? size * 0.1 : size * 0.11 }}
        >
          Complete
        </span>
      </div>
    </div>
  );
};

/* ── Plan & Credit Card (merged) ───────────────────── */
const PlanCreditCard: React.FC<{ planId: string; creditsRemaining: number; creditsTotal: number }> = ({
  planId, creditsRemaining, creditsTotal,
}) => {
  const pct = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;
  const low = pct < 20;

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
      {/* Background glow */}
      <div
        className="absolute -top-6 -right-6 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(88,150,215,0.08) 0%, transparent 70%)" }}
      />
      {/* Dot-grid */}
      <svg className="absolute bottom-3 right-3 pointer-events-none opacity-[0.14]" width="48" height="48" aria-hidden="true">
        {[0,1,2,3].flatMap(row => [0,1,2,3].map(col => (
          <circle key={`${row}-${col}`} cx={col * 12 + 4} cy={row * 12 + 4} r="1.5" fill="#5896d7" />
        )))}
      </svg>

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Crown size={12} className="text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{planId} Plan</span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(white,white) padding-box, linear-gradient(135deg,#5896d7,#1f4e98) border-box",
            border: "1.5px solid transparent",
            color: "#1f4e98",
          }}
        >
          Active
        </span>
      </div>

      {/* Credits row */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="text-3xl font-black" style={{ color: low ? "#ef4444" : "#5896d7" }}>
            {creditsRemaining}
          </span>
          <span className="text-xs text-gray-400">/ {creditsTotal} credits</span>
        </div>
        <span className="text-[11px] text-gray-500">Credits Remaining</span>
      </div>

      {/* Horizontal progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: low
              ? "linear-gradient(to right,#ef4444,#f97316)"
              : "linear-gradient(to right,#5896d7,#2557a7,#1f4e98)",
          }}
        />
      </div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-gray-400">Valid till Jan 2026</p>
        <span className="text-[10px] font-bold" style={{ color: low ? "#ef4444" : "#5896d7" }}>
          {Math.round(pct)}% used
        </span>
      </div>
      {low && (
        <p className="text-[10px] text-amber-500 font-medium mb-1">⚠ Credits running low</p>
      )}

      <div className="border-t border-gray-100 my-2" />

      {/* Upgrade CTA */}
      <Link
        href="/pricing"
        className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg border border-[#5896d7] text-[#5896d7] text-xs font-semibold hover:bg-blue-50 transition-colors mt-auto self-start"
      >
        <Crown size={12} />
        Upgrade Plan
      </Link>
    </div>
  );
};

/* ── Job Market Insights Card ──────────────────────── */
const TRENDING_ROLES = [
  { title: "Full Stack Developer", growth: "+23%", tag: "Hot",    tagColor: "#ef4444", tagBg: "#fef2f2", dot: "#ef4444" },
  { title: "Data Analyst",         growth: "+18%", tag: "Rising", tagColor: "#f59e0b", tagBg: "#fffbeb", dot: "#f59e0b" },
  { title: "UX Designer",          growth: "+12%", tag: "Rising", tagColor: "#1f4e98", tagBg: "#eff6ff", dot: "#1f4e98" },
];


const JobMarketInsightsCard: React.FC = () => (
  <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
    {/* Background glow */}
    <div
      className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)" }}
    />

    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <TrendingUp size={13} style={{ color: "#5896d7" }} />
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Job Market Insights
        </span>
      </div>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: "#eff6ff", color: "#1f4e98", border: "1px solid #bfdbfe" }}
      >
        LIVE
      </span>
    </div>

    {/* Trending roles */}
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Trending Roles</p>
    <div className="space-y-1 mb-2">
      {TRENDING_ROLES.map((role) => (
        <div key={role.title} className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: role.dot }}
          />
          <span className="flex-1 text-xs text-gray-700 font-medium truncate">{role.title}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ color: role.tagColor, background: role.tagBg }}
          >
            {role.tag}
          </span>
          <span className="text-[10px] font-black shrink-0" style={{ color: "#5896d7" }}>
            {role.growth}
          </span>
        </div>
      ))}
    </div>

    {/* CTA */}
    <Link
      href="/jobs"
      className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg border border-[#5896d7] text-[#5896d7] text-xs font-semibold hover:bg-blue-50 transition-colors mt-auto self-start"
    >
      <Briefcase size={12} />
      Explore Jobs
    </Link>
  </div>
);

/* ── Profile Completeness Card ─────────────────────── */
const ProfileCompletenessCard: React.FC<{ profileCompleteness: number }> = ({ profileCompleteness }) => {
  const badge = getStatusBadge(profileCompleteness);
  const r = 26, sw = 6, circ = 2 * Math.PI * r;
  const offset = circ - (profileCompleteness / 100) * circ;

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
      {/* Background glow */}
      <div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)" }}
      />

      {/* Title */}
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Profile Completeness
      </span>

      {/* Gauge row */}
      <div className="flex items-center gap-4 mb-3 mt-auto">
        {/* Small donut */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
          <svg width="64" height="64" className="-rotate-90" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="pc-arc" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#5896d7" />
                <stop offset="50%"  stopColor="#2557a7" />
                <stop offset="100%" stopColor="#1f4e98" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
            <circle
              cx="32" cy="32" r={r}
              fill="none"
              stroke="url(#pc-arc)"
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.7s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-black text-gray-800">{profileCompleteness}%</span>
          </div>
        </div>

        {/* Text block */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Complete</p>
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: badge.color, background: badge.bg }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/profile"
        className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-semibold text-white transition-all hover:bg-[#184284] mt-auto self-start bg-[#2557a7]"
      >
        Complete Profile
        <ChevronRight size={12} />
      </Link>
    </div>
  );
};

/* ── Upload Action Card (Row 2) ────────────────────── */
const UploadActionCard: React.FC<{ profileCompleteness: number }> = ({ profileCompleteness }) => {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left */}
        <div className="flex-1 p-5 md:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-4 text-[11px] font-medium text-gray-400">
            <span className="font-semibold text-gray-600">Step 1 of 5</span>
            <ChevronRight size={11} className="text-gray-400" />
            <span>Upload Your Resume</span>
          </div>

          {/* Icon + Title + Credit badge — all in one row */}
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            {/* Gradient icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#2557a7]"
              
            >
              <Upload size={17} className="text-white" />
            </div>

            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
              Upload Your Resume
            </h2>

            {/* Credit badge inline */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full shrink-0">
              <Sparkles size={10} className="text-[#5896d7]" />
              <span className="text-[10px] font-bold text-[#2557a7]">5 Credits</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-xs leading-relaxed mb-4 max-w-sm pl-11.5">
            Let&apos;s start by uploading your resume so we can help optimize it.
          </p>

          {/* CTA — gradient button */}
          <button
            onClick={() => { setUploading(true); window.location.href = "/builder/start"; }}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:opacity-90 hover:shadow-md disabled:opacity-60 ml-11.5"
            style={{ background: "#2557a7" }}
          >
            {uploading ? "Redirecting…" : "Upload Resume"}
            {!uploading && <ChevronRight size={13} />}
          </button>
        </div>

        {/* Right: premium green panel */}
        <div
          className="relative flex items-center justify-center px-10 py-8 md:py-0 md:min-w-72 overflow-hidden shrink-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(88,150,215,0.28) 18%, rgba(191,219,254,0.5) 50%, rgba(147,197,253,0.6) 100%)",
          }}
        >
          {/* Radial light bloom centred on the circle */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 65% 65% at 55% 50%, rgba(255,255,255,0.38) 0%, rgba(88,150,215,0.15) 45%, transparent 70%)",
            }}
          />

          {/* SVG — white/silver lines + glowing white nodes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 290 180"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <filter id="wglow" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="halo" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Network lines */}
            <line x1="30"  y1="12"  x2="110" y2="38"  stroke="white" strokeWidth="0.7" opacity="0.55" />
            <line x1="110" y1="38"  x2="200" y2="15"  stroke="white" strokeWidth="0.7" opacity="0.5"  />
            <line x1="200" y1="15"  x2="270" y2="50"  stroke="white" strokeWidth="0.6" opacity="0.45" />
            <line x1="30"  y1="12"  x2="10"  y2="72"  stroke="white" strokeWidth="0.6" opacity="0.45" />
            <line x1="110" y1="38"  x2="85"  y2="95"  stroke="white" strokeWidth="0.6" opacity="0.48" />
            <line x1="10"  y1="72"  x2="85"  y2="95"  stroke="white" strokeWidth="0.7" opacity="0.52" />
            <line x1="85"  y1="95"  x2="160" y2="112" stroke="white" strokeWidth="0.7" opacity="0.55" />
            <line x1="160" y1="112" x2="235" y2="88"  stroke="white" strokeWidth="0.7" opacity="0.5"  />
            <line x1="235" y1="88"  x2="270" y2="50"  stroke="white" strokeWidth="0.6" opacity="0.45" />
            <line x1="235" y1="88"  x2="275" y2="130" stroke="white" strokeWidth="0.6" opacity="0.42" />
            <line x1="200" y1="15"  x2="235" y2="88"  stroke="white" strokeWidth="0.55" opacity="0.38" />
            <line x1="85"  y1="95"  x2="50"  y2="155" stroke="white" strokeWidth="0.7" opacity="0.5"  />
            <line x1="50"  y1="155" x2="160" y2="168" stroke="white" strokeWidth="0.7" opacity="0.52" />
            <line x1="160" y1="168" x2="248" y2="155" stroke="white" strokeWidth="0.7" opacity="0.5"  />
            <line x1="248" y1="155" x2="275" y2="130" stroke="white" strokeWidth="0.6" opacity="0.45" />
            <line x1="160" y1="112" x2="160" y2="168" stroke="white" strokeWidth="0.55" opacity="0.38" />
            <line x1="160" y1="112" x2="248" y2="155" stroke="white" strokeWidth="0.5"  opacity="0.35" />
            <line x1="10"  y1="72"  x2="50"  y2="155" stroke="white" strokeWidth="0.5"  opacity="0.35" />

            {/* Glowing nodes */}
            <circle cx="30"  cy="12"  r="3"   fill="white" opacity="0.85" filter="url(#wglow)" />
            <circle cx="10"  cy="72"  r="4"   fill="white" opacity="0.95" filter="url(#halo)"  />
            <circle cx="110" cy="38"  r="3"   fill="white" opacity="0.8"  filter="url(#wglow)" />
            <circle cx="200" cy="15"  r="3.5" fill="white" opacity="0.85" filter="url(#wglow)" />
            <circle cx="270" cy="50"  r="3"   fill="white" opacity="0.8"  filter="url(#wglow)" />
            <circle cx="85"  cy="95"  r="4.5" fill="white" opacity="1"    filter="url(#halo)"  />
            <circle cx="160" cy="112" r="4"   fill="white" opacity="0.9"  filter="url(#wglow)" />
            <circle cx="235" cy="88"  r="4"   fill="white" opacity="0.9"  filter="url(#halo)"  />
            <circle cx="275" cy="130" r="2.5" fill="white" opacity="0.75" filter="url(#wglow)" />
            <circle cx="50"  cy="155" r="3.5" fill="white" opacity="0.85" filter="url(#wglow)" />
            <circle cx="160" cy="168" r="3.5" fill="white" opacity="0.85" filter="url(#wglow)" />
            <circle cx="248" cy="155" r="4"   fill="white" opacity="0.9"  filter="url(#halo)"  />

            {/* Halo rings */}
            <circle cx="10"  cy="72"  r="10" fill="none" stroke="white" strokeWidth="0.6" opacity="0.3" />
            <circle cx="85"  cy="95"  r="12" fill="none" stroke="white" strokeWidth="0.6" opacity="0.28" />
            <circle cx="235" cy="88"  r="10" fill="none" stroke="white" strokeWidth="0.6" opacity="0.28" />
            <circle cx="248" cy="155" r="10" fill="none" stroke="white" strokeWidth="0.6" opacity="0.28" />
          </svg>

          {/* Flying disc assembly */}
          <div className="relative z-10 flex items-center justify-center" style={{ padding: 24 }}>

            {/* Ground shadow */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: 4, left: "50%", transform: "translateX(-50%)",
                width: 130, height: 22,
                background: "rgba(37, 87, 167, 0.28)",
                borderRadius: "50%", filter: "blur(10px)",
              }}
            />

            {/* Wide halo bloom */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 210, height: 210,
                background: "radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(88,150,215,0.3) 40%, transparent 72%)",
                filter: "blur(10px)",
              }}
            />

            {/* Secondary rim glow */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 176, height: 176,
                background: "radial-gradient(circle, rgba(255,255,255,0.5) 30%, rgba(88,150,215,0.18) 65%, transparent 80%)",
                filter: "blur(5px)",
              }}
            />

            {/* White elevated platform disc */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 158, height: 158,
                background: "linear-gradient(155deg, rgba(255,255,255,0.97) 0%, rgba(239,246,255,0.92) 100%)",
                boxShadow: [
                  "0 20px 50px rgba(37, 87, 167, 0.30)",
                  "0 6px 16px rgba(37, 87, 167, 0.18)",
                  "inset 0 -3px 10px rgba(88, 150, 215, 0.35)",
                  "inset 0 3px 8px rgba(255, 255, 255, 0.9)",
                ].join(", "),
              }}
            />

            {/* Outer rim accent ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 162, height: 162,
                border: "1.5px solid rgba(88, 150, 215, 0.35)",
                borderRadius: "50%",
              }}
            />

            {/* Progress arc */}
            <div className="relative">
              <CircularProgress
                percentage={profileCompleteness}
                size={152}
                strokeWidth={12}
                gradientId="cp-upload-panel"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Features Carousel ─────────────────────────────── */
const FEATURE_CARDS = [
  {
    icon: <ScanSearch size={17} />,
    title: "ATS Scan",
    headline: "Improve Your ATS Score",
    description: "Upload your resume to check your ATS compatibility score.",
    ctaText: "Start Uploading",
    ctaHref: "/atslogin",
    gradient: "#2557a7",
    forceAvailable: true,
    unlockCondition: "",
    lockedCtaText: "",
    lockedCtaHref: "",
  },
  {
    icon: <FileText size={17} />,
    title: "Resume Builder",
    headline: "Build a Standout Resume",
    description: "Create a professional resume with AI-powered templates.",
    ctaText: "Start Building",
    ctaHref: "/builder/start",
    gradient: "linear-gradient(135deg,#6366f1,#0ea5e9)",
    forceLocked: true,
    unlockCondition: "Complete your ATS scan to unlock Resume Builder.",
    lockedCtaText: "Scan Resume",
    lockedCtaHref: "/atslogin",
  },
  {
    icon: <Search size={17} />,
    title: "Jobs",
    headline: "Find Your Dream Job",
    description: "Explore 150+ curated job listings matched to your profile.",
    ctaText: "Explore Jobs",
    ctaHref: "/jobs",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    unlockCondition: "Complete your profile to 40% to unlock Jobs.",
    lockedCtaText: "Complete Profile",
    lockedCtaHref: "/profile",
  },
  {
    icon: <Briefcase size={17} />,
    title: "Job Match",
    headline: "Match Jobs With AI",
    description: "Instantly compare your resume against any job description.",
    ctaText: "Match Now",
    ctaHref: "/jobmatch",
    gradient: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
    unlockCondition: "Complete your profile to 60% to unlock Job Match.",
    lockedCtaText: "Complete Profile",
    lockedCtaHref: "/profile",
  },
  {
    icon: <Wand2 size={17} />,
    title: "Enhance Resume",
    headline: "AI Resume Boost",
    description: "Let AI rewrite and strengthen your resume content.",
    ctaText: "Enhance Now",
    ctaHref: "/enhancer",
    gradient: "linear-gradient(135deg,#ec4899,#8b5cf6)",
    unlockCondition: "Build a resume first to unlock AI Enhancement.",
    lockedCtaText: "Build Resume",
    lockedCtaHref: "/builder/start",
  },
  {
    icon: <MessageSquare size={17} />,
    title: "Communication",
    headline: "Ace Your Interview",
    description: "Practice with AI mock interviews and get real-time feedback.",
    ctaText: "Start Prep",
    ctaHref: "/communication",
    gradient: "linear-gradient(135deg,#3b82f6,#0ea5e9)",
    unlockCondition: "Complete all steps to unlock Interview Prep.",
    lockedCtaText: "View Steps",
    lockedCtaHref: "/profile",
  },
];

const FeaturesCarousel: React.FC<{ profileCompleteness: number }> = ({ profileCompleteness }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  /* Determine which features should be unlocked based on profile completeness */
  const getFeatureStatus = (index: number): "available" | "locked" => {
    if (index === 0) return "available"; // First feature always available
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
    scrollRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3.5 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>
      )}

      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3.5 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      )}

      {/* Scrollable track — hide native scrollbar */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {FEATURE_CARDS.map((card, index) => {
          const status = card.forceAvailable
            ? "available"
            : card.forceLocked
            ? "locked"
            : getFeatureStatus(index);
          return (
            <div key={card.title} className="w-66 shrink-0">
              <FeaturePreviewCard {...card} status={status} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Feature Preview Card ──────────────────────────── */
const FeaturePreviewCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  headline: string;
  status: "available" | "locked";
  description: string;
  ctaText: string;
  ctaHref?: string;
  unlockCondition?: string;
  lockedCtaText?: string;
  lockedCtaHref?: string;
}> = ({ icon, title, headline, status, description, ctaText, ctaHref, unlockCondition, lockedCtaText, lockedCtaHref }) => {
  const isLocked = status === "locked";

  /* ── Locked card ── */
  if (isLocked) {
    return (
      <div className="relative bg-white rounded-2xl p-4 flex flex-col h-full border border-gray-200 shadow-sm">
        {/* Icon badge + title */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-100/80 border border-gray-200">
            <Lock size={16} className="text-gray-400" />
          </div>
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>

        {/* Locked label + condition */}
        <div className="flex items-center gap-1.5 mb-1">
          <Lock size={11} className="text-gray-400 shrink-0" />
          <span className="text-xs font-bold text-gray-600">Locked:</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed flex-1 mb-3">
          {unlockCondition}
        </p>

        {/* Dashed divider */}
        <div className="border-t border-dashed border-gray-200 mb-3" />

        {/* CTA */}
        <Link
          href={lockedCtaHref || "#"}
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-150 transition-colors"
        >
          {lockedCtaText}
          <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  /* ── Available card ── */
  return (
    <div className="relative bg-white rounded-2xl p-4 flex flex-col overflow-hidden transition-all h-full border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-0.5">
      {/* Top-right decorative diamonds */}
      <div
        className="absolute top-3 right-3 w-3.5 h-3.5 rounded-sm rotate-45 pointer-events-none"
        style={{ background: "#5896d7", opacity: 0.55 }}
      />
      <div
        className="absolute top-5 right-5 w-2 h-2 rounded-sm rotate-45 pointer-events-none"
        style={{ background: "#5896d7", opacity: 0.35 }}
      />

      {/* Icon badge + label */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#2557a7]">
          <span className="text-white">{icon}</span>
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-black">{title}</span>
      </div>

      {/* Headline */}
      <h3 className="text-sm font-bold leading-snug mb-1.5 text-gray-900">{headline}</h3>

      {/* Description */}
      <p className="text-xs leading-relaxed flex-1 mb-4 text-gray-500">{description}</p>

      {/* CTA */}
      <Link
        href={ctaHref || "#"}
        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold text-white hover:bg-[#184284] transition-colors bg-[#2557a7]"
      >
        {ctaText}
        <ChevronRight size={13} />
      </Link>
    </div>
  );
};

/* ── Recent Activity Section ───────────────────────── */
const getCreditBadgeStyle = (credits: number, isFree: boolean) => {
  if (isFree)         return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Free" };
  if (credits >= 10)  return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: `${credits} Credits Used` };
  return                     { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd", label: `${credits} Credits Used` };
};

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "ats_scan": return <ScanSearch size={13} />;
    case "resume_enhanced": return <Wand2 size={13} />;
    case "profile_updated": return <FileText size={13} />;
    default: return <FileText size={13} />;
  }
};

const getActivityGradient = (type: string) => {
  switch (type.toLowerCase()) {
    case "ats_scan": return "linear-gradient(135deg,#0ea5e9,#14b8a6)";
    case "resume_enhanced": return "linear-gradient(135deg,#6366f1,#8b5cf6)";
    case "profile_updated": return "linear-gradient(135deg,#94a3b8,#64748b)";
    default: return "linear-gradient(135deg,#5896d7,#2557a7)";
  }
};

const getActivityDotColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "ats_scan": return "#3b82f6";
    case "resume_enhanced": return "#6366f1";
    case "profile_updated": return "#94a3b8";
    default: return "#5896d7";
  }
};

interface RecentActivitySectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activities: any[];
}

const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ activities }) => {
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
        <Link
          href="/dashboard/recent-activity"
          className="text-xs font-semibold text-[#5896d7] hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight size={13} />
        </Link>
      </div>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div className="text-center mt-12 py-8 px-5">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">No activity yet</p>
          <p className="text-gray-400 text-xs mt-1">Your actions will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {activities.map((item) => {
            const isFree = item.credits_used === 0;
            const badge = getCreditBadgeStyle(item.credits_used, isFree);
            const gradient = getActivityGradient(item.type || 'default');
            const dotColor = getActivityDotColor(item.type || 'default');
            const icon = getActivityIcon(item.type || 'default');

            return (
              <div
                key={item.id}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
              >
                {/* Presence dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: dotColor }}
                />

                {/* Icon badge */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: gradient }}
                >
                  <span className="text-white">{icon}</span>
                </div>

                {/* Activity label */}
                <span className="flex-1 text-sm font-semibold text-gray-800 truncate min-w-0">
                  {item.feature_label}
                </span>

                {/* Credit chip */}
                <span
                  className="shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                  style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                >
                  {badge.label}
                </span>

                {/* Timestamp */}
                <span className="shrink-0 text-[11px] text-gray-400 w-16 text-right">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Feature-wise Usage Chart ─────────────────────────── */
interface FeatureUsageData {
  feature: string;
  usage: number;
}

const FeatureWiseUsageChart: React.FC<{
  creditsUsed: number;
  creditsTotal: number;
  featureData?: FeatureUsageData[];
}> = ({
  creditsUsed, creditsTotal, featureData,
}) => {
  const defaultFeatureData = [
    { feature: "Resume", usage: 85 },
    { feature: "Jobs", usage: 90 },
    { feature: "Interview", usage: 60 },
    { feature: "Assessment", usage: 95 },
  ];

  const data = featureData || defaultFeatureData;
  const vW = 300, vH = 160;
  const ml = 30, mt = 12, mb = 28, mr = 8;
  const dW = vW - ml - mr;
  const dH = vH - mt - mb;
  const maxV = 100;

  const sec   = dW / 4;
  const bW    = 25;

  const yS   = (v: number) => mt + dH * (1 - v / maxV);
  const xSec = (i: number) => ml + i * sec;
  const xMid = (i: number) => xSec(i) + sec / 2;

  const gridLines = [0, 20, 40, 60, 80, 100];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Feature-wise Usage</h3>
        {/* Legend pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#5896d7" }} />
          <span className="text-gray-500">Total Used:</span>
          <span className="font-black text-[#5896d7]">{creditsUsed}</span>
          <span className="text-gray-400">/{creditsTotal}</span>
        </div>
      </div>

      {/* SVG bar chart */}
      <svg
        width="100%"
        viewBox={`0 0 ${vW} ${vH}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      >
        <defs>
          <linearGradient id="fw-bar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f4e98" />
            <stop offset="100%" stopColor="#5896d7" />
          </linearGradient>
          {/* Subtle glow for bar */}
          <filter id="bar-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines + Y labels */}
        {gridLines.map(v => (
          <g key={v}>
            <line
              x1={ml} y1={yS(v)} x2={vW - mr} y2={yS(v)}
              stroke="#e2e8f0" strokeWidth={0.8}
              strokeDasharray={v === 0 ? "none" : "2,3"}
            />
            <text x={ml - 5} y={yS(v) + 3.5} textAnchor="end" fontSize={8} fill="#9ca3af">
              {v}
            </text>
          </g>
        ))}

        {/* Bars + X labels */}
        {data.map((d, i) => {
          const h = (d.usage / maxV) * dH;
          return (
            <g key={d.feature}>
              {/* Feature bar */}
              <rect
                x={xMid(i) - bW / 2} y={yS(d.usage)}
                width={bW} height={h}
                rx={3} ry={3}
                fill="url(#fw-bar)"
                filter="url(#bar-glow)"
              />
              {/* X axis label */}
              <text
                x={xMid(i)} y={vH - mb + 16}
                textAnchor="middle" fontSize={8} fill="#9ca3af"
              >
                {d.feature}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend row */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: "linear-gradient(to right,#1f4e98,#5896d7)", display: "inline-block" }} />
          <span className="text-[10px] text-gray-500">Credits Used by Feature</span>
        </div>
      </div>
    </div>
  );
};

/* ── Dashboard Content Component ───────────────────── */
const DashboardContent: React.FC<{
  data: DashboardSummary;
}> = ({ data }) => {
  const { user, plan, profile, usage_counts, recent_activity } = data;

  // Transform usage_counts to feature data for the chart
  const featureData: FeatureUsageData[] = [
    { feature: "Resume", usage: usage_counts.resumes_created + usage_counts.resumes_parsed },
    { feature: "Jobs", usage: usage_counts.job_matches + usage_counts.job_applications },
    { feature: "Interview", usage: usage_counts.assessments_taken },
    { feature: "ATS", usage: usage_counts.ats_scans },
  ].map(item => ({
    ...item,
    usage: Math.min(item.usage * 10 || 20, 100), // Scale to 0-100 range
  }));

  const creditsUsed = Math.max(0, plan.credits_total - plan.credits_remaining);

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
      {/* Welcome */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
          Welcome, {user.name}! 👋
        </h1>
        <p className="text-gray-400 text-sm">Let&apos;s set up your career dashboard.</p>
      </div>

      {/* Row 1 – 3 equal cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <PlanCreditCard
          planId={plan.plan_id}
          creditsRemaining={plan.credits_remaining}
          creditsTotal={plan.credits_total}
        />
        <ProfileCompletenessCard profileCompleteness={profile.completeness} />
        <JobMarketInsightsCard />
      </div>

      {/* Row 2 – Upload action */}
      <div className="mb-4">
        <UploadActionCard profileCompleteness={profile.completeness} />
      </div>

      {/* Row 3 – Feature cards carousel */}
      <p className="text-xs text-gray-400 mb-2">
        Explore other features <span className="font-semibold text-gray-600">after uploading</span> your resume.
      </p>
      <FeaturesCarousel profileCompleteness={profile.completeness} />

      {/* Row 4 – Recent activity + Feature-wise usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <RecentActivitySection activities={recent_activity} />
        <FeatureWiseUsageChart
          creditsUsed={creditsUsed}
          creditsTotal={plan.credits_total}
          featureData={featureData}
        />
      </div>

      <div className="h-6" />
    </div>
  );
};

/* ── Main Wrapper Component ────────────────────────── */
const FirstTimeDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardSummary();
        setData(dashboardData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-5 md:p-6 max-w-[1400px] mx-auto flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#5896d7] animate-spin" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 md:p-6 max-w-[1400px] mx-auto flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-red-600 font-semibold">Failed to load dashboard</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <DashboardContent data={data} />;
};

export default FirstTimeDashboard;
