"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — CSS custom properties, scoped with --cb- prefix.
   Dark mode overrides via @media (prefers-color-scheme: dark).
───────────────────────────────────────────────────────────────────────────── */
const TOKENS_CSS = `
  :root {
    --cb-bg:   #ffffff;
    --cb-bg2:  #f7f8fa;
    --cb-bg3:  #f1f3f6;
    --cb-bd:   rgba(0, 0, 0, 0.08);
    --cb-bd2:  rgba(0, 0, 0, 0.14);
    --cb-tx:   #0f172a;
    --cb-tx2:  #4b5563;
    --cb-tx3:  #94a3b8;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --cb-bg:   #16191f;
      --cb-bg2:  #1e2128;
      --cb-bg3:  #12151a;
      --cb-bd:   rgba(255, 255, 255, 0.08);
      --cb-bd2:  rgba(255, 255, 255, 0.14);
      --cb-tx:   #f1f5f9;
      --cb-tx2:  #94a3b8;
      --cb-tx3:  #4b5563;
    }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   SVG ICONS — Tabler outline style, 24×24 viewport, 1.5px stroke
───────────────────────────────────────────────────────────────────────────── */
type IconProps = { size?: number };

const svg = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IcDashboard    = ({ size = 18 }: IconProps) => svg(size, <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>);
const IcUser         = ({ size = 18 }: IconProps) => svg(size, <><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></>);
const IcFileText     = ({ size = 18 }: IconProps) => svg(size, <><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 9h1"/><path d="M9 13h6"/><path d="M9 17h6"/></>);
const IcTarget       = ({ size = 18 }: IconProps) => svg(size, <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="9"/></>);
const IcSearch       = ({ size = 18 }: IconProps) => svg(size, <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>);
const IcChartBar     = ({ size = 18 }: IconProps) => svg(size, <><path d="M3 20h18"/><path d="M8 20V10"/><path d="M12 20V4"/><path d="M16 20V14"/><path d="M20 20V8"/></>);
const IcSettings     = ({ size = 18 }: IconProps) => svg(size, <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>);
const IcBell         = ({ size = 18 }: IconProps) => svg(size, <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>);
const IcMapPin       = ({ size = 14 }: IconProps) => svg(size, <><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.4-7.2 11.4-8 12.3C11.2 21.4 4 15.4 4 10a8 8 0 0 1 8-8z"/></>);
const IcBriefcase    = ({ size = 14 }: IconProps) => svg(size, <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>);
const IcUsers        = ({ size = 14 }: IconProps) => svg(size, <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></>);
const IcClock        = ({ size = 14 }: IconProps) => svg(size, <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>);
const IcChevronDown  = ({ size = 12 }: IconProps) => svg(size, <path d="M6 9l6 6 6-6"/>);
const IcHeart        = ({ size = 15 }: IconProps) => svg(size, <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>);
const IcSparkles     = ({ size = 13 }: IconProps) => svg(size, <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>);
const IcCheck        = ({ size = 11 }: IconProps) => svg(size, <path d="M5 12l5 5L20 7" strokeWidth="2"/>);
const IcXmark        = ({ size = 11 }: IconProps) => svg(size, <><path d="M18 6L6 18" strokeWidth="2"/><path d="M6 6l12 12" strokeWidth="2"/></>);
const IcRobot        = ({ size = 15 }: IconProps) => svg(size, <><rect x="7" y="9" width="10" height="10" rx="2"/><path d="M8.5 13.5h.01M15.5 13.5h.01M10 16.5h4"/><path d="M12 9V6"/><circle cx="12" cy="5" r="1"/></>);
const IcArrowRight   = ({ size = 13 }: IconProps) => svg(size, <><path d="M5 12h14"/><path d="M15 16l4-4-4-4"/></>);

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
type SkillVariant = "neutral" | "present" | "missing";
interface Skill { name: string; variant: SkillVariant }
interface Job {
  id: number;
  company: string; initials: string; logoColor: string;
  timestamp: string; isEarlyApplicant: boolean;
  title: string; subtitle: string;
  location: string; type: string; team: string; posted: string;
  skills: Skill[];
  matchScore: number; matchStatus: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────────────────────────── */
const JOBS: Job[] = [
  {
    id: 1, company: "Stripe", initials: "S", logoColor: "#635bff",
    timestamp: "2 hours ago", isEarlyApplicant: true,
    title: "Senior Frontend Engineer", subtitle: "Stripe · via LinkedIn",
    location: "San Francisco, CA", type: "Full-time", team: "Growth Team", posted: "3 days ago",
    skills: [
      { name: "React", variant: "present" }, { name: "TypeScript", variant: "present" },
      { name: "GraphQL", variant: "neutral" }, { name: "Go", variant: "missing" },
    ],
    matchScore: 87, matchStatus: "Strong Match",
  },
  {
    id: 2, company: "Vercel", initials: "V", logoColor: "#171717",
    timestamp: "5 hours ago", isEarlyApplicant: false,
    title: "Staff Software Engineer", subtitle: "Vercel · via Indeed",
    location: "Remote", type: "Full-time", team: "Platform", posted: "1 day ago",
    skills: [
      { name: "Next.js", variant: "present" }, { name: "Rust", variant: "missing" },
      { name: "Node.js", variant: "present" }, { name: "PostgreSQL", variant: "neutral" },
    ],
    matchScore: 72, matchStatus: "Good Match",
  },
  {
    id: 3, company: "Linear", initials: "L", logoColor: "#5e6ad2",
    timestamp: "1 day ago", isEarlyApplicant: false,
    title: "Product Engineer", subtitle: "Linear · via AngelList",
    location: "New York, NY", type: "Full-time", team: "Core Product", posted: "5 days ago",
    skills: [
      { name: "React", variant: "present" }, { name: "Electron", variant: "missing" },
      { name: "TypeScript", variant: "present" },
    ],
    matchScore: 41, matchStatus: "Low Match",
  },
  {
    id: 4, company: "Figma", initials: "F", logoColor: "#f24e1e",
    timestamp: "3 days ago", isEarlyApplicant: false,
    title: "Senior UI Engineer", subtitle: "Figma · via Glassdoor",
    location: "Seattle, WA", type: "Full-time", team: "Design Systems", posted: "1 week ago",
    skills: [
      { name: "CSS", variant: "present" }, { name: "WebGL", variant: "missing" },
      { name: "React", variant: "present" }, { name: "Performance", variant: "neutral" },
    ],
    matchScore: 65, matchStatus: "Good Match",
  },
];

const TOP_PICKS = [
  { title: "Product Designer at Notion", sub: "Remote · 92% match" },
  { title: "FullStack Eng. at Loom", sub: "San Francisco · 88% match" },
  { title: "Frontend Lead at Framer", sub: "Amsterdam · 81% match" },
  { title: "Staff Eng. at Planetscale", sub: "Remote · 79% match" },
];

const TRENDING_SKILLS = [
  "Next.js 14", "tRPC", "Bun.js", "Turbo", "Zustand",
  "Drizzle ORM", "Edge Runtime", "Vite 5", "Astro", "Biome",
];

const SALARY_BARS = [
  { label: "P10", h: 22, active: false },
  { label: "P25", h: 34, active: false },
  { label: "Med", h: 52, active: true  },
  { label: "P75", h: 40, active: false },
  { label: "P90", h: 28, active: false },
];

const NAV_ITEMS = [
  { id: "dashboard",  Icon: IcDashboard,  label: "Dashboard"  },
  { id: "profile",    Icon: IcUser,        label: "Profile"    },
  { id: "resume",     Icon: IcFileText,    label: "Resume"     },
  { id: "goals",      Icon: IcTarget,      label: "Goals"      },
  { id: "search",     Icon: IcSearch,      label: "Search"     },
  { id: "analytics",  Icon: IcChartBar,    label: "Analytics"  },
  { id: "settings",   Icon: IcSettings,    label: "Settings"   },
];

const TABS = [
  { id: "all",     label: "All Jobs",     count: 4128, green: false },
  { id: "new",     label: "New",          count: 32,   green: false },
  { id: "saved",   label: "Saved",        count: 7,    green: false },
  { id: "matched", label: "Smart Match",  count: 19,   green: true  },
];

const FILTER_CHIPS = [
  { label: "Job Type",      active: false },
  { label: "Location",      active: false },
  { label: "Salary",        active: false },
  { label: "Experience",    active: true  },
  { label: "Company Size",  active: false },
  { label: "Date Posted",   active: false },
];

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function MatchRing({ score }: { score: number }) {
  const r = 14, circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#2563eb" : score >= 50 ? "#d97706" : "#dc2626";
  const track = score >= 75 ? "#dbeafe" : score >= 50 ? "#fef3c7" : "#fee2e2";
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
      <circle cx={18} cy={18} r={r} fill="none" stroke={track} strokeWidth={4} />
      <circle cx={18} cy={18} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round" transform="rotate(-90 18 18)" />
      <text x={18} y={22} textAnchor="middle"
        style={{ fontSize: 8, fontWeight: 500, fill: color, fontFamily: "inherit" }}>
        {score}%
      </text>
    </svg>
  );
}

function SkillTag({ skill }: { skill: Skill }) {
  const s =
    skill.variant === "present" ? { bg: "#EAF3DE", tx: "#27500A", bd: "#97C459" } :
    skill.variant === "missing" ? { bg: "#FCEBEB", tx: "#791F1F", bd: "#F09595" } :
                                  { bg: "var(--cb-bg2)", tx: "var(--cb-tx2)", bd: "var(--cb-bd)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "3px 8px", borderRadius: 999,
      fontSize: 11, fontWeight: 500,
      backgroundColor: s.bg, color: s.tx,
      border: `0.5px solid ${s.bd}`,
    }}>
      {skill.variant === "present" && <IcCheck size={11} />}
      {skill.variant === "missing" && <IcXmark size={11} />}
      {skill.name}
    </span>
  );
}

function CompanyLogo({ initials, color }: { initials: string; color: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      backgroundColor: color, border: "0.5px solid rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, fontWeight: 500, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

const ghostBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "4px 10px", borderRadius: 6,
  backgroundColor: "transparent", border: "0.5px solid var(--cb-bd)",
  color: "var(--cb-tx2)", fontSize: 12, fontWeight: 400,
  cursor: "pointer", fontFamily: "inherit",
};

const divider: CSSProperties = { height: 0, borderTop: "0.5px solid var(--cb-bd)" };

/* ─────────────────────────────────────────────────────────────────────────────
   SIDEBAR — 52px collapsed icon nav
───────────────────────────────────────────────────────────────────────────── */
function Sidebar() {
  const [active, setActive] = useState("search");
  return (
    <div style={{
      width: 52, flexShrink: 0,
      backgroundColor: "var(--cb-bg)", borderRight: "0.5px solid var(--cb-bd)",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: 12, paddingBottom: 12, gap: 4,
    }}>
      {/* Logo */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: "#1e3a5f", marginBottom: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IcSearch size={15} />
      </div>

      {NAV_ITEMS.map(({ id, Icon, label }) => {
        const on = active === id;
        return (
          <button key={id} title={label} onClick={() => setActive(id)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: on ? "#eff6ff" : "transparent",
              color: on ? "#2563eb" : "var(--cb-tx3)",
              cursor: "pointer", transition: "background .1s, color .1s",
            }}>
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOP BAR — 52px, title + live badge + search + bell + avatar
───────────────────────────────────────────────────────────────────────────── */
function TopBar() {
  const [q, setQ] = useState("");
  return (
    <div style={{
      height: 52, flexShrink: 0,
      backgroundColor: "var(--cb-bg)", borderBottom: "0.5px solid var(--cb-bd)",
      display: "flex", alignItems: "center",
      paddingLeft: 16, paddingRight: 16, gap: 12,
    }}>
      {/* Left */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--cb-tx)" }}>Job Search</span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "2px 8px", borderRadius: 999,
          backgroundColor: "#f0fdf4", color: "#166534",
          fontSize: 11, fontWeight: 500,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#16a34a" }} />
          Live
        </span>
        <span style={{ fontSize: 12, color: "var(--cb-tx3)" }}>4,128 opportunities</span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 8, color: "var(--cb-tx3)", display: "flex", pointerEvents: "none" }}>
            <IcSearch size={13} />
          </span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs…"
            style={{
              width: 200, height: 30, paddingLeft: 28, paddingRight: 10,
              backgroundColor: "var(--cb-bg2)", border: "0.5px solid var(--cb-bd)",
              borderRadius: 8, fontSize: 12, color: "var(--cb-tx)",
              outline: "none", fontFamily: "inherit",
            }} />
        </div>

        {/* Bell */}
        <div style={{ position: "relative" }}>
          <button style={{
            width: 30, height: 30, borderRadius: 8, border: "none",
            backgroundColor: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--cb-tx3)",
          }}>
            <IcBell size={16} />
          </button>
          <span style={{
            position: "absolute", top: 5, right: 5,
            width: 6, height: 6, borderRadius: "50%",
            backgroundColor: "#ef4444", border: "1.5px solid var(--cb-bg)",
          }} />
        </div>

        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          backgroundColor: "#1e3a5f",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 11, fontWeight: 500, cursor: "pointer",
        }}>
          JD
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FILTER BAR — chip row with icon + label + chevron
───────────────────────────────────────────────────────────────────────────── */
function FilterBar() {
  const [chips, setChips] = useState(FILTER_CHIPS);
  const toggle = (i: number) =>
    setChips(p => p.map((c, j) => j === i ? { ...c, active: !c.active } : c));

  return (
    <div style={{
      flexShrink: 0,
      backgroundColor: "var(--cb-bg)", borderBottom: "0.5px solid var(--cb-bd)",
      padding: "10px 16px", display: "flex", alignItems: "center",
      gap: 6, overflowX: "auto",
    }}>
      {chips.map((c, i) => (
        <button key={c.label} onClick={() => toggle(i)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 6,
            fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: "inherit",
            backgroundColor: c.active ? "#eff6ff" : "var(--cb-bg2)",
            color:           c.active ? "#1e40af" : "var(--cb-tx2)",
            border:          c.active ? "0.5px solid #bfdbfe" : "0.5px solid var(--cb-bd)",
          }}>
          {c.label}
          <IcChevronDown size={12} />
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB BAR — All Jobs / New / Saved / Smart Match
───────────────────────────────────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  return (
    <div style={{
      flexShrink: 0,
      backgroundColor: "var(--cb-bg)", borderBottom: "0.5px solid var(--cb-bd)",
      display: "flex", alignItems: "flex-end",
      paddingLeft: 16, paddingRight: 16,
    }}>
      {TABS.map(tab => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 12px", fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              backgroundColor: "transparent", border: "none",
              borderBottom: on ? "2px solid #2563eb" : "2px solid transparent",
              color: on ? "#2563eb" : "var(--cb-tx3)",
            }}>
            {tab.label}
            <span style={{
              padding: "1px 6px", borderRadius: 999,
              fontSize: 11, fontWeight: 500,
              backgroundColor: tab.green ? "#f0fdf4" : "#eff6ff",
              color:           tab.green ? "#166534" : "#1e40af",
            }}>
              {tab.count.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   JOB CARD
───────────────────────────────────────────────────────────────────────────── */
function JobCard({ job }: { job: Job }) {
  const [hov, setHov] = useState(false);
  const matchColor =
    job.matchScore >= 75 ? "#2563eb" : job.matchScore >= 50 ? "#d97706" : "#dc2626";
  const statusColor =
    job.matchScore >= 75 ? "#1d4ed8" : job.matchScore >= 50 ? "#b45309" : "#b91c1c";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: "var(--cb-bg)",
        border: hov ? "0.5px solid var(--cb-bd2)" : "0.5px solid var(--cb-bd)",
        borderRadius: 12, padding: 16,
        display: "flex", flexDirection: "row", gap: 14,
        transition: "border-color .1s",
      }}>
      <CompanyLogo initials={job.initials} color={job.logoColor} />

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Timestamp + early badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--cb-tx3)" }}>{job.timestamp}</span>
          {job.isEarlyApplicant && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "1px 7px", borderRadius: 999,
              backgroundColor: "#f0fdf4", color: "#166534",
              fontSize: 10, fontWeight: 500,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#16a34a" }} />
              Early applicant
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--cb-tx)", lineHeight: 1.3 }}>
          {job.title}
        </div>

        {/* Company */}
        <div style={{ fontSize: 12, color: "var(--cb-tx3)" }}>{job.subtitle}</div>

        {/* Attributes */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {[
            { Icon: IcMapPin,     text: job.location },
            { Icon: IcBriefcase,  text: job.type     },
            { Icon: IcUsers,      text: job.team      },
            { Icon: IcClock,      text: job.posted    },
          ].map(({ Icon, text }) => (
            <span key={text} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 12, color: "var(--cb-tx3)",
            }}>
              <Icon size={13} />{text}
            </span>
          ))}
        </div>

        {/* Skills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {job.skills.map(s => <SkillTag key={s.name} skill={s} />)}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 10, marginTop: 2,
          borderTop: "0.5px solid var(--cb-bd)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button style={ghostBtn}>Match analysis</button>
            <button style={ghostBtn}><IcSparkles size={12} /> Ask Nancy</button>
            <button style={{ ...ghostBtn, padding: "4px 8px" }}><IcHeart size={15} /></button>
          </div>
          <button style={{
            padding: "5px 14px", borderRadius: 6,
            backgroundColor: "#1e3a5f", color: "white",
            fontSize: 12, fontWeight: 500, border: "none",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Apply now
          </button>
        </div>
      </div>

      {/* Match pill */}
      <div style={{
        alignSelf: "flex-start", flexShrink: 0,
        backgroundColor: "var(--cb-bg2)", border: "0.5px solid var(--cb-bd)",
        borderRadius: 8, padding: "6px 12px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <MatchRing score={job.matchScore} />
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: matchColor }}>
            {job.matchScore}%
          </span>
          <span style={{
            fontSize: 10, fontWeight: 500, color: statusColor,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {job.matchStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RIGHT PANEL — 220px fixed: top picks / trending skills / salary / nancy
───────────────────────────────────────────────────────────────────────────── */
function RightPanel() {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      backgroundColor: "var(--cb-bg)", borderLeft: "0.5px solid var(--cb-bd)",
      padding: 16, display: "flex", flexDirection: "column", gap: 16,
      overflowY: "auto",
    }}>
      {/* ── Top Picks ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 500, color: "var(--cb-tx3)",
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            Top Picks
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "1px 6px", borderRadius: 999,
            backgroundColor: "#f0fdf4", color: "#166534",
            fontSize: 10, fontWeight: 500,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#16a34a" }} />
            Live
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TOP_PICKS.map((pick, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                backgroundColor: i === 0 ? "#fef9c3" : "var(--cb-bg2)",
                border: i === 0 ? "0.5px solid #fde047" : "0.5px solid var(--cb-bd)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 500,
                color: i === 0 ? "#713f12" : "var(--cb-tx3)",
              }}>
                {i + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: "var(--cb-tx)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {pick.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--cb-tx3)", marginTop: 1 }}>
                  {pick.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button style={{
          marginTop: 10, fontSize: 12, color: "#2563eb",
          background: "none", border: "none", cursor: "pointer",
          padding: 0, fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          View all <IcArrowRight size={13} />
        </button>
      </div>

      <div style={divider} />

      {/* ── Trending Skills ── */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 500, color: "var(--cb-tx3)",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10,
        }}>
          Trending Skills
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TRENDING_SKILLS.map(sk => (
            <span key={sk} style={{
              padding: "3px 8px", borderRadius: 999,
              fontSize: 11, fontWeight: 500,
              backgroundColor: "var(--cb-bg2)", color: "var(--cb-tx2)",
              border: "0.5px solid var(--cb-bd)",
            }}>
              {sk}
            </span>
          ))}
        </div>
      </div>

      <div style={divider} />

      {/* ── Salary Insights ── */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 500, color: "var(--cb-tx3)",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10,
        }}>
          Salary Insights
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 52, marginBottom: 4 }}>
          {SALARY_BARS.map(bar => (
            <div key={bar.label} style={{
              flex: 1, height: bar.h,
              borderRadius: "3px 3px 0 0",
              backgroundColor: bar.active ? "#dbeafe" : "var(--cb-bg2)",
              border: bar.active ? "0.5px solid #93c5fd" : "0.5px solid var(--cb-bd)",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {SALARY_BARS.map(bar => (
            <div key={bar.label} style={{
              flex: 1, fontSize: 9, color: "var(--cb-tx3)", textAlign: "center",
            }}>
              {bar.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--cb-tx)" }}>₹28–42 LPA</span>
          <span style={{ fontSize: 11, color: "var(--cb-tx3)", marginLeft: 4 }}>median</span>
        </div>
      </div>

      <div style={divider} />

      {/* ── Nancy AI Card ── */}
      <div style={{ backgroundColor: "#1e3a5f", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            backgroundColor: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#93c5fd",
          }}>
            <IcRobot size={15} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>Nancy AI</span>
              <span style={{
                padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 500,
                backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)",
              }}>
                Beta
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#4ade80" }} />
              <span style={{ fontSize: 10, color: "#4ade80" }}>Online</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#93c5fd", lineHeight: 1.5, marginBottom: 10 }}>
          I can help you prep for interviews, analyse job fit, and answer career questions.
        </p>

        <button style={{
          width: "100%", padding: "6px 0", borderRadius: 6,
          backgroundColor: "rgba(255,255,255,0.12)",
          border: "0.5px solid rgba(255,255,255,0.2)",
          color: "#fff", fontSize: 12, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <IcSparkles size={13} /> Chat with Nancy
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT EXPORT
───────────────────────────────────────────────────────────────────────────── */
export default function CareerBotPremiumUI() {
  const [activeTab, setActiveTab] = useState("matched");

  return (
    <>
      <style>{TOKENS_CSS}</style>
      <div style={{
        display: "flex",
        height: "calc(100vh - 56px)",
        overflow: "hidden",
        backgroundColor: "var(--cb-bg3)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        fontSize: 13,
        color: "var(--cb-tx)",
      }}>
        {/* ── Left icon sidebar ── */}
        <Sidebar />

        {/* ── Main column ── */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopBar />
          <FilterBar />
          <TabBar active={activeTab} onChange={setActiveTab} />

          {/* Scrollable job list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {JOBS.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </main>

        {/* ── Right panel ── */}
        <RightPanel />
      </div>
    </>
  );
}
