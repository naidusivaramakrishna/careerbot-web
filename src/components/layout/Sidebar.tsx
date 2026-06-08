"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getAllResumesUnified, getAllResumes } from "@/api/resumeApi";
import { getEnhancementHistory } from "@/api/enhancerApi";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { useDashboard } from "@/contexts/DashboardContext";

/* ══════════════════════════════════════════════════════════════
   PREMIUM CUSTOM ICON SET
   Grid: 20×20 · Strokes: round caps & joins · currentColor
   Designed for 14–18 px render — optical weight balanced
══════════════════════════════════════════════════════════════ */
type IP = { size?: number; className?: string; sw?: number };

/** Dashboard — 3-column bar chart + bezier trend line + data-point nodes */
const IcoDashboard = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* Baseline — grounds all bars */}
    <path d="M1.5 18.5H18.5"
      stroke="currentColor" strokeWidth={sw * 0.6} opacity="0.25" />

    {/* Bar 1 — lower metric */}
    <rect x="2" y="11" width="3.5" height="7.5" rx="1"
      fill="currentColor" fillOpacity="0.15"
      stroke="currentColor" strokeWidth={sw * 0.75} />

    {/* Bar 2 — peak metric, tallest = draws the eye */}
    <rect x="8.25" y="5" width="3.5" height="13.5" rx="1"
      fill="currentColor" fillOpacity="0.22"
      stroke="currentColor" strokeWidth={sw * 0.75} />

    {/* Bar 3 — mid metric */}
    <rect x="14.5" y="8.5" width="3.5" height="10" rx="1"
      fill="currentColor" fillOpacity="0.17"
      stroke="currentColor" strokeWidth={sw * 0.75} />

    {/* Trend line — smooth cubic bezier through all three bar tops */}
    <path d="M3.75 11 C6 7 8 5 10 5 C12 5 13.5 8.5 16.25 8.5"
      stroke="currentColor" strokeWidth={sw} />

    {/* Data point nodes — anchored at each bar peak */}
    <circle cx="3.75"  cy="11"  r="1.3" fill="currentColor" />
    <circle cx="10"    cy="5"   r="1.3" fill="currentColor" />
    <circle cx="16.25" cy="8.5" r="1.3" fill="currentColor" />
  </svg>
);

/** Profile — line-art avatar: stroke head circle + stroke shoulder arc */
const IcoProfile = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* Head — stroke circle only */}
    <circle cx="10" cy="7.2" r="3.2"
      stroke="currentColor" strokeWidth={sw} />

    {/* Shoulders — open arc */}
    <path d="M3.5 18.5 C4 13.5 7 11.8 10 11.8 C13 11.8 16 13.5 16.5 18.5"
      stroke="currentColor" strokeWidth={sw} />
  </svg>
);

/**
 * Resume — line-art document (dog-ear fold) + avatar ring (stroke head + stroke shoulders)
 *          + 5 content lines + large 4-pt sparkle + small sparkle.
 *
 * Matches original image style exactly:
 *   • All avatar elements are stroke-only (no fill) — pure line-art
 *   • Head: open circle outline  /  Shoulders: open arc stroke
 *   • Sparkle uses Q-bezier concave curves for smooth pointed tips
 *   • Sparkle fully outside document (left tip at x=14 > doc right edge x=13.5)
 *   • Small sparkle upper-right of large sparkle
 */
const IcoResume = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* ── Document body — rounded corners + dog-ear top-right fold ── */}
    <path
      d="M2 1H9.5L13.5 5V18.5Q13.5 19.5 12.5 19.5H2Q1.5 19.5 1.5 18.5V2Q1.5 1 2 1Z"
      stroke="currentColor" strokeWidth={sw} />
    {/* Fold flap */}
    <path d="M9.5 1L13.5 5H9.5Z"
      fill="currentColor" fillOpacity="0.18"
      stroke="currentColor" strokeWidth={sw * 0.8} />

    {/* ── Avatar ring — slightly smaller for breathing room ── */}
    <circle cx="7.5" cy="6.5" r="2.8"
      stroke="currentColor" strokeWidth={sw * 0.9} />
    {/* Head — open circle outline */}
    <circle cx="7.5" cy="5.6" r="1.1"
      stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Shoulders — open arc */}
    <path d="M5.5 9.3C5.5 7.8 6.3 7.3 7.5 7.3C8.7 7.3 9.5 7.8 9.5 9.3"
      stroke="currentColor" strokeWidth={sw * 0.85} />

    {/* ── 3 content lines — spaced 2.5 px apart for clear separation ── */}
    <path d="M3 11H11.5"  stroke="currentColor" strokeWidth={sw * 0.82} />
    <path d="M3 13.5H11.5" stroke="currentColor" strokeWidth={sw * 0.82} />
    <path d="M3 16H9"     stroke="currentColor" strokeWidth={sw * 0.82} opacity="0.55" />

    {/* ── Large 4-pointed sparkle — fully right of document (left tip x=14) ── */}
    {/* Center(17,15.5) R=3 | Q ctrl points pull tightly toward center → sharp tips */}
    <path d="M17 12.5Q17.5 15 20 15.5Q17.5 16 17 18.5Q16.5 16 14 15.5Q16.5 15 17 12.5Z"
      fill="currentColor" fillOpacity="0.9" />

    {/* ── Small sparkle — upper-right of large sparkle ── */}
    {/* Center(18.5,11.5) R=1.3 */}
    <path d="M18.5 10.2Q18.8 11.1 19.8 11.5Q18.8 11.9 18.5 12.8Q18.2 11.9 17.2 11.5Q18.2 11.1 18.5 10.2Z"
      fill="currentColor" fillOpacity="0.65" />
  </svg>
);

/**
 * ATS Scan — resume page being actively read by a laser scan beam.
 * Document (resume) + folded corner → clearly "your file".
 * Solid lines above beam → already parsed by ATS.
 * Glowing horizontal beam → the ATS engine scanning line-by-line.
 * Scanner-head dot protruding past the right edge → mechanical precision.
 * Faded lines below beam → content not yet processed.
 */
const IcoAtsScan = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* ── Document body with folded top-right corner ── */}
    <path
      d="M3 2H11L16.5 7V18C16.5 18.55 16.05 19 15.5 19H3C2.45 19 2 18.55 2 18V3C2 2.45 2.45 2 3 2Z"
      stroke="currentColor" strokeWidth={sw}
    />
    {/* Folded corner flap — filled triangle, signals "document/file" */}
    <path
      d="M11 2L16.5 7H11Z"
      fill="currentColor" fillOpacity="0.14"
      stroke="currentColor" strokeWidth={sw * 0.85}
      strokeLinejoin="round"
    />

    {/* ── Parsed content above beam (solid = already read by ATS) ── */}
    {/* Short top line — name / heading */}
    <path d="M4.5 7.5H8.5" stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Long line — first resume section */}
    <path d="M4.5 9.5H13.5" stroke="currentColor" strokeWidth={sw * 0.85} />

    {/* ── ATS SCAN BEAM — the hero element ── */}
    {/* Soft glow halo: wide, ultra-faint — gives depth at any bg color */}
    <path d="M2 11.5H16" stroke="currentColor" strokeWidth={sw * 4} opacity="0.07" />
    {/* Mid glow layer */}
    <path d="M2 11.5H16" stroke="currentColor" strokeWidth={sw * 2} opacity="0.12" />
    {/* Core beam line — sharp, dominant */}
    <path d="M2 11.5H16.5" stroke="currentColor" strokeWidth={sw * 0.95} />
    {/* Scanner head — solid dot protruding past the document edge */}
    {/* Signals the mechanical read-head in motion, precision scanning */}
    <circle cx="17.8" cy="11.5" r="1.3" fill="currentColor" />

    {/* ── Unprocessed content below beam (faded = pending ATS parse) ── */}
    <path d="M4.5 13.5H14" stroke="currentColor" strokeWidth={sw * 0.85} opacity="0.28" />
    <path d="M4.5 15.5H11" stroke="currentColor" strokeWidth={sw * 0.85} opacity="0.2"  />
    <path d="M4.5 17.5H8"  stroke="currentColor" strokeWidth={sw * 0.85} opacity="0.14" />
  </svg>
);

/**
 * Job Match — puzzle briefcase held by two hands, 3 rays above.
 *
 * Layout at 20×20 (key spacing decisions for sidebar clarity):
 *   Briefcase narrowed to x=3.5–16.5 so left/right columns are free for hands.
 *   Handle: U-shape (two 1-unit vertical legs + r=1 semicircle arch peaking at y=3).
 *   Puzzle: true-semicircle tabs (r=1, half-chord=r). Right tab CW peaks x=11,y=9.5.
 *           Left tab CCW peaks x=9,y=11.5. Horizontal at y=10.5 (tab junction).
 *   Hands: each = 1 long outer-edge curve (wrist→pinky→up) + thumb arc + 2 finger lines.
 *          Positioned at x=0–8 / x=12–20, y=12–19.5 — clear of briefcase body.
 */
const IcoJobMatch = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* ══ HANDS — drawn first so briefcase white fill masks parts behind it ══ */}

    {/* LEFT outer — bows hard LEFT (pinky/back-of-hand arc) then sweeps up to briefcase left wall */}
    <path d="M1 24 C-0.5 20.5 0 15.5 3.5 13.2"
      stroke="currentColor" strokeWidth={sw} />
    {/* LEFT inner — sweeps straight up to briefcase bottom (index/palm side) */}
    <path d="M6 24 C6 21 8 18.5 9.5 16.5"
      stroke="currentColor" strokeWidth={sw} />
    {/* LEFT thumb — short distinct arc from upper palm */}
    <path d="M4.5 19.5 C3.5 18 3.2 17 3.8 16.2"
      stroke="currentColor" strokeWidth={sw} />

    {/* RIGHT — exact mirror (x → 24−x) */}
    <path d="M23 24 C24.5 20.5 24 15.5 20.5 13.2"
      stroke="currentColor" strokeWidth={sw} />
    <path d="M18 24 C18 21 16 18.5 14.5 16.5"
      stroke="currentColor" strokeWidth={sw} />
    <path d="M19.5 19.5 C20.5 18 20.8 17 20.2 16.2"
      stroke="currentColor" strokeWidth={sw} />

    {/* ── Briefcase body — fill="white" masks hand parts behind it ── */}
    <rect x="3.5" y="5.5" width="17" height="11" rx="1.4"
      fill="white" stroke="currentColor" strokeWidth={sw} />

    {/* ── Handle (drawn after body so it sits on top) ── */}
    <path d="M10 5.5 V5 A2 2 0 0 1 14 5 V5.5"
      stroke="currentColor" strokeWidth={sw} />

    {/* ── Rays ── */}
    <line x1="12" y1="1"   x2="12" y2="2.8"  stroke="currentColor" strokeWidth={sw} />
    <line x1="9"  y1="2.2" x2="7.8" y2="0.8" stroke="currentColor" strokeWidth={sw} />
    <line x1="15" y1="2.2" x2="16.2" y2="0.8" stroke="currentColor" strokeWidth={sw} />

    {/* ── Flap: envelope curve — sides at y=8, center dips to y=9.5 ── */}
    <path d="M3.5 8 C8 10 16 10 20.5 8"
      stroke="currentColor" strokeWidth={sw * 0.85} />

    {/* ── Puzzle vertical — starts at briefcase TOP (y=5.5), runs through flap,
        then 2 circular tabs below the flap center (y≈9.5)
        Tab 1 RIGHT: y=10.5→13.5, peaks x=15
        Tab 2 LEFT:  y=13.5→16.5, peaks x=9                              ── */}
    <path d="M12 5.5 V10.5 C15 10.5 15 13.5 12 13.5 C9 13.5 9 16.5 12 16.5"
      stroke="currentColor" strokeWidth={sw * 0.85} />
  </svg>
);

/**
 * Jobs — premium briefcase with job-listing content lines.
 *
 * Why briefcase, not building:
 *   Building = "company/employer". Briefcase = "job/opportunity you carry".
 *   This feature is about browsing listings you can apply to — briefcase
 *   maps directly to that intent.
 *
 * Premium details:
 *   Handle  : geometric arch with quadratic-bezier rounded corners (not a flat rect).
 *   Body    : proportioned rect, rx=1.5 for modern softness.
 *   Clasp   : horizontal divider + centered latch rectangle — signals "secured opportunity".
 *   Content : two lines below clasp → job title + description snippet → "it's a listing".
 */
const IcoJobs = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* Handle — quadratic-bezier arch, precise rounded corners */}
    {/* Q control points round the top-left and top-right corners of the handle */}
    <path d="M7 7.5V6Q7 4.5 8.5 4.5H11.5Q13 4.5 13 6V7.5"
      stroke="currentColor" strokeWidth={sw} />

    {/* Body */}
    <rect x="2.5" y="7.5" width="15" height="10.5" rx="1.5"
      stroke="currentColor" strokeWidth={sw} />

    {/* Horizontal clasp divider — separates latch zone from content */}
    <path d="M2.5 11H17.5"
      stroke="currentColor" strokeWidth={sw * 0.7} opacity="0.4" />

    {/* Clasp latch — centered, straddles the divider, filled for depth */}
    <rect x="8.5" y="9.8" width="3" height="2.4" rx="0.8"
      stroke="currentColor" strokeWidth={sw * 0.85}
      fill="currentColor" fillOpacity="0.2" />

    {/* Job listing content lines — title + description, below clasp */}
    <path d="M5 13.5H15"  stroke="currentColor" strokeWidth={sw * 0.85} />
    <path d="M5 15.5H11" stroke="currentColor" strokeWidth={sw * 0.85} />
  </svg>
);

/** Track Applications — location pin stabbed into application document */
const IcoTracker = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>

    {/* Application document — sits below pin, pin tail overlaps top edge */}
    <rect x="2" y="11" width="16" height="8" rx="1.5"
      stroke="currentColor" strokeWidth={sw} />
    {/* Document content lines — job title + detail rows */}
    <path d="M5 14H10.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    <path d="M5 16H15" stroke="currentColor" strokeWidth={sw * 0.85} />
    <path d="M5 17.5H11.5" stroke="currentColor" strokeWidth={sw * 0.85} />

    {/* Location pin teardrop — "pinned to this application, I know exactly where it is" */}
    <path d="M10 12C10 12 5.5 8.5 5.5 5.5A4.5 4.5 0 0 1 14.5 5.5C14.5 8.5 10 12 10 12Z"
      stroke="currentColor" strokeWidth={sw}
      fill="currentColor" fillOpacity="0.12" />

    {/* Pin inner dot — the precise location marker */}
    <circle cx="10" cy="5.5" r="1.6"
      fill="currentColor" fillOpacity="0.85"
      stroke="currentColor" strokeWidth={sw * 0.5} />
  </svg>
);

/** Interview Prep — microphone with stand arc + base */
const IcoInterview = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Mic capsule */}
    <rect x="7.5" y="2" width="5" height="8.5" rx="2.5"
      stroke="currentColor" strokeWidth={sw} />
    {/* Inner sound indicator line */}
    <path d="M10 4.5V8" stroke="currentColor" strokeWidth={sw * 0.75} opacity="0.4" />
    {/* Stand arc */}
    <path d="M4.5 10.5C4.5 14.5 7 16.5 10 16.5C13 16.5 15.5 14.5 15.5 10.5"
      stroke="currentColor" strokeWidth={sw} />
    {/* Stem */}
    <path d="M10 16.5V18.5" stroke="currentColor" strokeWidth={sw} />
    {/* Base */}
    <path d="M7 18.5H13" stroke="currentColor" strokeWidth={sw} />
  </svg>
);

/** Subscription — hexagonal gem with crown line + inner facets */
const IcoGem = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Gem silhouette — classic cut diamond */}
    <path d="M7 2H13L18 8L10 18.5L2 8Z" stroke="currentColor" strokeWidth={sw} />
    {/* Crown divider — horizontal girdle line */}
    <path d="M2 8H18" stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Upper facets */}
    <path d="M7 2L2 8"  stroke="currentColor" strokeWidth={sw * 0.6} opacity="0.4" />
    <path d="M13 2L18 8" stroke="currentColor" strokeWidth={sw * 0.6} opacity="0.4" />
    {/* Lower pavilion facets from culet to girdle */}
    <path d="M10 18.5L2 8"  stroke="currentColor" strokeWidth={sw * 0.6} opacity="0.35" />
    <path d="M10 18.5L18 8" stroke="currentColor" strokeWidth={sw * 0.6} opacity="0.35" />
    {/* Center table line */}
    <path d="M7 2L10 8L13 2" stroke="currentColor" strokeWidth={sw * 0.6} opacity="0.3" />
  </svg>
);

/** Billing History — clock with counter-clockwise history arrow */
const IcoHistory = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Clock face */}
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={sw} />
    {/* Clock hands — 10:10 position (reads clearly at 14px) */}
    <path d="M11 11V7.5"    stroke="currentColor" strokeWidth={sw} />
    <path d="M11 11L14 12.5" stroke="currentColor" strokeWidth={sw} />
    {/* History arc — counter-clockwise arrow top-left of clock */}
    <path d="M5.5 4.5C3.5 6 2.5 8 2.5 10.5"
      stroke="currentColor" strokeWidth={sw} />
    <path d="M4.5 3L5.5 4.5L3 5.5" stroke="currentColor" strokeWidth={sw * 0.85} />
  </svg>
);

/** Cover Letter — document with greeting line + body paragraphs + handwritten signature */
const IcoCoverLetter = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Document body */}
    <rect x="3" y="2" width="13" height="16.5" rx="1.5"
      stroke="currentColor" strokeWidth={sw} />
    {/* Greeting line — "Dear…" short opener */}
    <path d="M5.5 5.5H10" stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Body paragraph lines */}
    <path d="M5.5 8H14"   stroke="currentColor" strokeWidth={sw * 0.82} />
    <path d="M5.5 10H14"  stroke="currentColor" strokeWidth={sw * 0.82} />
    <path d="M5.5 12H12"  stroke="currentColor" strokeWidth={sw * 0.82} opacity="0.55" />
    {/* Signature — cursive wavy line, the key differentiator from generic docs */}
    <path d="M5.5 15.5C6.5 14.5 7.5 15.8 8.8 15C9.8 14.4 10.8 15.5 11.5 15"
      stroke="currentColor" strokeWidth={sw * 0.95} />
  </svg>
);

/* ── Accent icons (plan card + CTA) ─────────────────────── */

const IcoCrown = ({ size = 13, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="14.5" width="14" height="3" rx="1"
      stroke="currentColor" strokeWidth={sw} fill="currentColor" fillOpacity="0.15" />
    <path d="M3 14.5L5.5 6.5L10 12L14.5 6.5L17 14.5"
      stroke="currentColor" strokeWidth={sw} />
    <circle cx="3"  cy="6.5" r="1.5" fill="currentColor" />
    <circle cx="10" cy="4.5" r="1.5" fill="currentColor" />
    <circle cx="17" cy="6.5" r="1.5" fill="currentColor" />
  </svg>
);

const IcoRocket = ({ size = 15, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Body */}
    <path d="M10 2C10 2 16 5 16 11.5L10 17L4 11.5C4 5 10 2 10 2Z"
      stroke="currentColor" strokeWidth={sw} />
    {/* Window porthole */}
    <circle cx="10" cy="9" r="2" stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Left fin */}
    <path d="M4 11.5L2 15L5 14" stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Right fin */}
    <path d="M16 11.5L18 15L15 14" stroke="currentColor" strokeWidth={sw * 0.85} />
    {/* Exhaust plume */}
    <path d="M8.5 17L10 19.5L11.5 17" stroke="currentColor" strokeWidth={sw * 0.85} />
  </svg>
);

const IcoSparkles = ({ size = 11, className = "", sw = 1.5 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Main star */}
    <path d="M10 2L11.8 7.5L17.5 9L11.8 10.5L10 16L8.2 10.5L2.5 9L8.2 7.5Z"
      stroke="currentColor" strokeWidth={sw}
      fill="currentColor" fillOpacity="0.12" />
    {/* Small top-right star */}
    <path d="M16 1.5L16.6 3.4L18.5 4L16.6 4.6L16 6.5L15.4 4.6L13.5 4L15.4 3.4Z"
      fill="currentColor" opacity="0.55" />
    {/* Small bottom-left star */}
    <path d="M4 14L4.5 15.8L6.5 16.5L4.5 17.2L4 19L3.5 17.2L1.5 16.5L3.5 15.8Z"
      fill="currentColor" opacity="0.55" />
  </svg>
);

const IcoChevronRight = ({ size = 13, className = "", sw = 2.2 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth={sw} />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   NAV CONFIG
══════════════════════════════════════════════════════════════ */
type NavIcon = (props: IP) => React.ReactElement;

const NAV_GROUPS: {
  label: string;
  items: {
    id: string;
    label: string;
    icon: NavIcon;
    path: string;
    smartNav?: boolean;
    showBadge?: boolean;
    flag?: string;
  }[];
}[] = [
  {
    label: "MAIN",
    items: [
      { id: "dashboard", label: "Dashboard",    icon: IcoDashboard, path: "/dashboard" },
      { id: "profile",   label: "Profile",      icon: IcoProfile,   path: "/profile", showBadge: true },
    ],
  },
  {
    label: "BUILD",
    items: [
      { id: "resume", label: "Resume",   icon: IcoResume,  path: "/builder", smartNav: true },
      { id: "ats",    label: "ATS Scan", icon: IcoAtsScan, path: "/atslogin" },
    ],
  },
  {
    label: "CAREER",
    items: [
      { id: "jd_match", label: "Job Match",          icon: IcoJobMatch, path: "/jobmatch/app" },
      { id: "jobs",     label: "Jobs",               icon: IcoJobs,     path: "/jobs" },
      { id: "tracker",  label: "Track Applications", icon: IcoTracker,  path: "/tracker" },
    ],
  },
  // GENERATE — AI-driven artifact generators (top-level peer to RESUME
  // and CAREER per the cover-letter wireframes route-group decision,
  // 2026-05-25). Items are conditionally pruned below by NEXT_PUBLIC_*
  // flags so disabled features don't even appear in nav.
  {
    label: "GENERATE",
    items: [
      { id: "cover_letter", label: "Cover Letter",   icon: IcoCoverLetter, path: "/cover-letter/history", flag: "NEXT_PUBLIC_COVER_LETTER_ENABLED" },
    ],
  },
  {
    label: "PREPARE",
    items: [
      { id: "communication", label: "Interview Prep", icon: IcoInterview, path: "/prep" },
    ],
  },
  {
    label: "BILLING",
    items: [
      { id: "subscription",    label: "Subscription",    icon: IcoGem,     path: "/account/subscriptions" },
      { id: "billing_history", label: "Billing History", icon: IcoHistory, path: "/settings/billing" },
    ],
  },
];

// Feature-flag pruning for nav items.
//
// IMPORTANT (Codex WEB-1.1 P2): Next only statically inlines
// `process.env.NEXT_PUBLIC_*` when the reference is a LITERAL property
// access (e.g. `process.env.NEXT_PUBLIC_COVER_LETTER_ENABLED`). A
// dynamic lookup like `process.env[someVarName]` is NOT inlined into
// the client bundle and evaluates to `undefined` at runtime in the
// browser — which would silently hide every flagged item even when
// the env var IS set, AND cause an SSR/CSR hydration mismatch
// (server reads env fine, client doesn't).
//
// Fix: maintain a STATIC map keyed by flag name. Each value is read
// via a literal property access so Next can inline it. To add a new
// flag, add a row here AND set `flag: "..."` on the nav item.
const STATIC_FLAGS: Record<string, boolean> = {
  NEXT_PUBLIC_COVER_LETTER_ENABLED:
    process.env.NEXT_PUBLIC_COVER_LETTER_ENABLED === "true",
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  smartNav?: boolean;
  showBadge?: boolean;
  flag?: string;
};
const isItemEnabled = (item: NavItem): boolean =>
  !item.flag || STATIC_FLAGS[item.flag] === true;

// Computed at module scope: NEXT_PUBLIC_* is baked at build time,
// so the result is stable for the whole client session.
const VISIBLE_NAV_GROUPS = NAV_GROUPS
  .map((group) => ({ ...group, items: group.items.filter(isItemEnabled) }))
  .filter((group) => group.items.length > 0);

const EXPANDED_PATHS = ["/dashboard", "/profile"];

/* ══════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(
    EXPANDED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );

  useEffect(() => {
    setIsExpanded(
      EXPANDED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
    );
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isExpanded ? "240px" : "64px"
    );
  }, [isExpanded]);

  const handleToggle = () => setIsExpanded((v) => !v);

  useEffect(() => {
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  const { data: balance, loading: loadingCredits } = useCreditsBalance();
  const { data: dashboardData } = useDashboard();
  const profileCompleteness = dashboardData?.profile.completeness ?? 0;

  const getActiveId = () => {
    for (const group of VISIBLE_NAV_GROUPS) {
      for (const item of group.items) {
        if (item.id === "cover_letter" && pathname.startsWith("/cover-letter/")) {
          return item.id;
        }
        if (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))) {
          return item.id;
        }
      }
    }
    if (pathname.startsWith("/settings"))               return "settings";
    if (pathname.startsWith("/account/subscriptions"))  return "subscription";
    if (pathname.startsWith("/settings/billing"))       return "billing_history";
    return "";
  };
  const activeId = getActiveId();

  const handleNavigation = async (item: { id: string; path: string; smartNav?: boolean }) => {
    if (item.smartNav) {
      try {
        const { builder_resumes, enhanced_resumes } = await getAllResumesUnified();
        const hasAny = builder_resumes.length > 0 || enhanced_resumes.length > 0;
        router.push(hasAny ? "/builder/start/list" : "/builder/start");
      } catch {
        try {
          const [builderResumes, enhancedResumes] = await Promise.allSettled([
            getAllResumes(),
            getEnhancementHistory(),
          ]);
          const hasBuilder  = builderResumes.status  === "fulfilled" && builderResumes.value.length  > 0;
          const hasEnhanced = enhancedResumes.status === "fulfilled" && enhancedResumes.value.length > 0;
          router.push(hasBuilder || hasEnhanced ? "/builder/start/list" : "/builder/start");
        } catch {
          router.push("/builder/start");
        }
      }
    } else {
      router.push(item.path);
    }
  };

  const creditPct = balance ? (balance.credits_remaining / balance.credits_total) * 100 : 0;

  /* ── COLLAPSED — 64 px ───────────────────────────────────── */
  if (!isExpanded) {
    return (
      <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-16 bg-white flex flex-col z-30 overflow-hidden"
        style={{ borderRight: "1px solid #f0f0f0", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" }}>
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-2 px-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="mx-1 my-1.5 border-t border-gray-100" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeId === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item)}
                      title={item.label}
                      aria-label={item.label}
                      className="w-full flex items-center justify-center py-0.5 group"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isActive ? "" : "group-hover:bg-gray-100"
                        }`}
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(145deg, #3063cc, #2557a7)",
                                boxShadow: "0 4px 14px rgba(37,87,167,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                              }
                            : {}
                        }
                      >
                        <Icon
                          size={20}
                          sw={isActive ? 1.75 : 1.6}
                          className={`transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-gray-600 group-hover:text-[#2557a7]"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade CTA — compact */}
        <div className="shrink-0 px-2 pb-3 pt-1">
          <Link
            href="/payments"
            title="Upgrade Plan"
            aria-label="Upgrade Plan"
            className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(145deg, #3063cc, #2557a7)",
              boxShadow: "0 4px 14px rgba(37,87,167,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <IcoRocket size={15} className="text-white" sw={1.65} />
          </Link>
        </div>
      </div>
    );
  }

  /* ── EXPANDED — 240 px ───────────────────────────────────── */
  const NavItem = ({
    item,
    showBadge,
  }: {
    item: (typeof NAV_GROUPS)[0]["items"][0];
    showBadge?: boolean;
  }) => {
    const isActive = activeId === item.id;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavigation(item)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${
          isActive ? "" : "hover:bg-gray-50"
        }`}
        style={
          isActive
            ? {
                background: "linear-gradient(145deg, #3063cc, #2557a7)",
                boxShadow: "0 4px 16px rgba(37,87,167,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
              }
            : {}
        }
      >
        {/* Animated left accent bar on hover */}
        {!isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full bg-[#2557a7] transition-all duration-200 h-0 group-hover:h-5 opacity-0 group-hover:opacity-100" />
        )}

        {/* Icon */}
        <Icon
          size={20}
          sw={isActive ? 1.85 : 1.65}
          className={`shrink-0 transition-colors ${
            isActive ? "text-white" : "text-gray-600 group-hover:text-[#2557a7]"
          }`}
        />

        {/* Label */}
        <span
          className={`flex-1 text-left truncate text-[13px] font-medium transition-colors ${
            isActive ? "text-white font-semibold" : "text-gray-600 group-hover:text-[#2557a7]"
          }`}
        >
          {item.label}
        </span>

        {/* Profile completeness badge */}
        {showBadge && !isActive && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
              profileCompleteness >= 100
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {profileCompleteness}%
          </span>
        )}

        {/* Active chevron */}
        {isActive && (
          <IcoChevronRight size={12} className="text-white/65 shrink-0" sw={2.5} />
        )}
      </button>
    );
  };

  return (
    <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-60 bg-white flex flex-col z-30 overflow-hidden"
      style={{ borderRight: "1px solid #f0f0f0", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" }}>

      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 pt-4 pb-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label with trailing line */}
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase shrink-0">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  showBadge={item.showBadge}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Plan card ───────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: balance
              ? "linear-gradient(135deg, #1a3f7a 0%, #2557a7 55%, #3a6fc2 100%)"
              : "linear-gradient(135deg, #f8faff 0%, #eef3fc 100%)",
            border: balance ? "none" : "1px solid #dce8f8",
          }}
        >
          {/* Decorative glow circle */}
          <div
            className="absolute -top-5 -right-5 w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: balance
                ? "rgba(255,255,255,0.06)"
                : "rgba(37,87,167,0.05)",
            }}
          />

          <div className="relative px-3.5 py-3 space-y-2.5">
            {/* Plan label + credit ring */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IcoCrown
                  size={13}
                  sw={1.6}
                  className={balance ? "text-yellow-300" : "text-[#c27a00]"}
                />
                <span
                  className={`text-[11px] font-bold tracking-wide ${
                    balance ? "text-white" : "text-[#2557a7]"
                  }`}
                >
                  {balance ? "PREMIUM" : "FREE Plan"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {balance && (
                  <div className="relative shrink-0">
                    <svg width="22" height="22" className="-rotate-90" style={{ overflow: "visible" }}>
                      <defs>
                        <linearGradient id="sb-cred" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor={creditPct < 20 ? "#fca5a5" : "#93c5fd"} />
                          <stop offset="100%" stopColor={creditPct < 20 ? "#f97316" : "#ffffff"} />
                        </linearGradient>
                      </defs>
                      <circle cx="11" cy="11" r="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                      <circle
                        cx="11" cy="11" r="8"
                        fill="none"
                        stroke="url(#sb-cred)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 8}
                        strokeDashoffset={2 * Math.PI * 8 * (1 - creditPct / 100)}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                      />
                    </svg>
                  </div>
                )}
                {loadingCredits ? (
                  <div className="w-10 h-3 rounded-full animate-pulse bg-white/20" />
                ) : balance ? (
                  <span className="text-[11px] leading-none">
                    <span className={`font-bold ${creditPct < 20 ? "text-red-200" : "text-white"}`}>
                      {balance.credits_remaining}
                    </span>
                    <span className="text-white/45 font-normal">/{balance.credits_total}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/payments"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-[11px] font-bold transition-all duration-200 hover:opacity-90 active:scale-95"
              style={
                balance
                  ? {
                      background: "rgba(255,255,255,0.14)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }
                  : {
                      background: "linear-gradient(145deg, #3063cc, #2557a7)",
                      color: "#ffffff",
                      boxShadow: "0 4px 12px rgba(37,87,167,0.32)",
                    }
              }
            >
              <IcoSparkles size={11} className="text-white" sw={1.5} />
              {balance ? "Manage Plan" : "Upgrade Now"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
