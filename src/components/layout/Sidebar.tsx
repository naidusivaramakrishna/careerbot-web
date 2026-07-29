"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAllResumesUnified, getAllResumes } from "@/api/resumeApi";
import { getEnhancementHistory } from "@/api/enhancerApi";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  EnterpriseApplicationTrackerIcon as IcoTracker,
  EnterpriseAtsScanIcon as IcoAtsScan,
  EnterpriseBillingHistoryIcon as IcoHistory,
  EnterpriseChevronRightIcon as IcoChevronRight,
  EnterpriseCoverLetterIcon as IcoCoverLetter,
  EnterpriseDashboardIcon as IcoDashboard,
  EnterpriseInterviewPrepIcon as IcoInterview,
  EnterpriseJobMatchIcon as IcoJobMatch,
  EnterpriseJobsIcon as IcoJobs,
  EnterpriseNotesIcon as IcoNotes,
  EnterpriseProfileIcon as IcoProfile,
  EnterpriseResumeIcon as IcoResume,
  EnterpriseSubscriptionIcon as IcoGem,
  type EnterpriseNavIcon,
} from "@/components/icons/EnterpriseNavIcons";
/* NAV CONFIG */
type NavIcon = EnterpriseNavIcon | ((props: IP) => React.ReactElement);

type SubNavItem = { id: string; label: string; path: string };

/* ══════════════════════════════════════════════════════════════
   CUSTOM ICON (Coding Practice — not in EnterpriseNavIcons set)
══════════════════════════════════════════════════════════════ */
type IP = { size?: number; className?: string; sw?: number };

/** Coding Practice — terminal bracket + prompt cursor */
const IcoCodingTest = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Screen body */}
    <rect x="1.5" y="3" width="17" height="12.5" rx="1.5"
      stroke="currentColor" strokeWidth={sw} />
    {/* Chevron left — </ bracket */}
    <path d="M6 8.5L4 10L6 11.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    {/* Chevron right — /> bracket */}
    <path d="M9 8.5L11 10L9 11.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    {/* Cursor blink underscore */}
    <path d="M12.5 11.5H14.5" stroke="currentColor" strokeWidth={sw * 0.9} />
    {/* Stand stem */}
    <path d="M10 15.5V17.5" stroke="currentColor" strokeWidth={sw} />
    {/* Base */}
    <path d="M7 17.5H13" stroke="currentColor" strokeWidth={sw} />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   NAV CONFIG
══════════════════════════════════════════════════════════════ */

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
    subItems?: SubNavItem[];
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
      { id: "jobs",     label: "Jobs",               icon: IcoJobs,     path: "/jobslogin" },
      { id: "tracker",  label: "Track Applications", icon: IcoTracker,  path: "/tracker" },
    ],
  },
  // GENERATE - AI-driven artifact generators (top-level peer to RESUME
  // and CAREER per the cover-letter wireframes route-group decision,
  // 2026-05-25). Items are conditionally pruned below by NEXT_PUBLIC_*
  // flags so disabled features don't even appear in nav.
  {
    label: "GENERATE",
    items: [
      { id: "cover_letter", label: "Cover Letter",   icon: IcoCoverLetter, path: "/cover-letter/history", flag: "NEXT_PUBLIC_COVER_LETTER_ENABLED" },
      { id: "interview_notes",        label: "Interview Notes",          icon: IcoNotes,       path: "/notes/generate" },
    ],
  },
  {
    label: "PREPARE",
    items: [
      {
        id: "mock_interview", label: "Mock Interview", icon: IcoInterview, path: "",
        subItems: [
          { id: "comm_assess",    label: "Communication Assessment", path: "/communication/start" },
          { id: "mock_test",      label: "Mock Test",                path: "/mock-test" },
          { id: "mock_interview", label: "Mock Interview",           path: "/mock-interview/live" },
        ],
      },
      { id: "coding_test",   label: "Coding Practice", icon: IcoCodingTest, path: "/coding-test", flag: "NEXT_PUBLIC_CODING_TEST_ENABLED" },
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
// browser - which would silently hide every flagged item even when
// the env var IS set, AND cause an SSR/CSR hydration mismatch
// (server reads env fine, client doesn't).
//
// Fix: maintain a STATIC map keyed by flag name. Each value is read
// via a literal property access so Next can inline it. To add a new
// flag, add a row here AND set `flag: "..."` on the nav item.
const STATIC_FLAGS: Record<string, boolean> = {
  NEXT_PUBLIC_COVER_LETTER_ENABLED:
    process.env.NEXT_PUBLIC_COVER_LETTER_ENABLED === "true",
  NEXT_PUBLIC_CODING_TEST_ENABLED:
    process.env.NEXT_PUBLIC_CODING_TEST_ENABLED !== "false",
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

/* Collapsed sidebar sub-item flyout — uses JS hover + close delay so the
   cursor can cross the gap between icon and panel without it disappearing. */
function CollapsedSubItem({
  item,
  isActive,
  pathname,
  onNavigate,
}: {
  item: { id: string; label: string; icon: React.ElementType; subItems?: { id: string; label: string; path: string }[] };
  isActive: boolean;
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon as React.ElementType<{ size?: number; sw?: number; className?: string }>;
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null);

  const open = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPopPos({ top: r.top - 48, left: r.right + 4 });
  }, []);

  const close = useCallback(() => {
    closeTimer.current = setTimeout(() => setPopPos(null), 150);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full flex items-center justify-center py-px"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <button
        aria-label={item.label}
        className="group/icon"
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isActive ? "" : "group-hover/icon:bg-gray-100"
          }`}
          style={isActive ? { background: "#2557a7", boxShadow: "0 4px 14px rgba(37,87,167,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" } : {}}
        >
          <Icon size={18} sw={isActive ? 1.75 : 1.6} className={`transition-colors ${isActive ? "text-white" : "text-gray-600 group-hover/icon:text-[#2557a7]"}`} />
        </div>
      </button>

      {popPos && (
        <div
          style={{ position: "fixed", top: popPos.top, left: popPos.left, zIndex: 9999 }}
          onMouseEnter={open}
          onMouseLeave={close}
        >
          <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1.5 min-w-[180px]">
            <p className="px-3 pt-0.5 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              {item.label}
            </p>
            {item.subItems!.map((sub) => {
              const subActive = pathname === sub.path || pathname.startsWith(sub.path + "/");
              return (
                <button
                  key={sub.id}
                  onClick={() => { setPopPos(null); onNavigate(sub.path); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] font-medium transition-colors ${
                    subActive ? "text-[#2557a7] bg-[#2557a7]/5" : "text-gray-600 hover:bg-gray-50 hover:text-[#2557a7]"
                  }`}
                >
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: subActive ? "#2557a7" : "#d1d5db" }} />
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* SIDEBAR COMPONENT */
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
    if (pathname.startsWith("/notes"))                   return "notes";
    if (pathname.startsWith("/mock-interview") || pathname.startsWith("/mock-test") || pathname.startsWith("/communication")) return "communication";
    if (pathname.startsWith("/settings"))               return "settings";
    if (pathname.startsWith("/account/subscriptions"))  return "subscription";
    if (pathname.startsWith("/settings/billing"))       return "billing_history";
    return "";
  };
  const activeId = getActiveId();

  // Track the last resume-related page the user visited so the resume icon restores it exactly
  useEffect(() => {
    if (pathname.startsWith('/builder/creation/')) {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      sessionStorage.setItem('last_resume_path', pathname + search);
    } else if (pathname === '/builder/start/list' || pathname === '/builder/start') {
      sessionStorage.setItem('last_resume_path', pathname);
    }
  }, [pathname]);

  const handleNavigation = async (item: { id: string; path: string; smartNav?: boolean }) => {
    if (!item.path) return; // items with subItems have no direct path
    if (item.smartNav) {
      // Restore exactly where the user last was in the resume section
      const lastResumePath = sessionStorage.getItem('last_resume_path');
      if (lastResumePath) {
        router.push(lastResumePath);
        return;
      }
      // No recorded path (new user / post-logout) - decide between list and start
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


  /* COLLAPSED - 64 px */
  if (!isExpanded) {
    return (
      <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-16 bg-white flex flex-col z-30 overflow-visible"
        style={{ borderRight: "1px solid #f0f0f0", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" }}>
        <nav className="flex-1 min-h-0 overflow-visible py-1 px-2">
          {VISIBLE_NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="mx-1 my-1.5 border-t border-gray-300" />}
              <div className="space-y-px">
                {group.items.map((item) => {
                  const isActive = activeId === item.id;
                  const Icon = item.icon;
                  const hasSub = item.subItems && item.subItems.length > 0;

                  if (hasSub) {
                    return (
                      <CollapsedSubItem
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        pathname={pathname}
                        onNavigate={(path) => router.push(path)}
                      />
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item)}
                      title={item.label}
                      aria-label={item.label}
                      className="w-full flex items-center justify-center py-px group"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isActive ? "" : "group-hover:bg-gray-100"
                        }`}
                        style={isActive ? { background: "#2557a7", boxShadow: "0 4px 14px rgba(37,87,167,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" } : {}}
                      >
                        <Icon size={18} sw={isActive ? 1.75 : 1.6} className={`transition-colors ${isActive ? "text-white" : "text-gray-600 group-hover:text-[#2557a7]"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  /* EXPANDED - 240 px */
  const NavItem = ({
    item,
    showBadge,
  }: {
    item: (typeof NAV_GROUPS)[0]["items"][0];
    showBadge?: boolean;
  }) => {
    const isActive = activeId === item.id;
    const Icon = item.icon;
    const hasSub = item.subItems && item.subItems.length > 0;
    const wrapperRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);

    const openDrop = useCallback(() => {
      if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
      if (!wrapperRef.current) return;
      const r = wrapperRef.current.getBoundingClientRect();
      setDropPos({ top: r.top - 48, left: r.right + 4 });
    }, []);

    const closeDrop = useCallback(() => {
      closeTimerRef.current = setTimeout(() => setDropPos(null), 150);
    }, []);

    const btn = (
      <button
        onClick={() => handleNavigation(item)}
        className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all duration-200 group/btn relative ${
          isActive ? "" : "hover:bg-gray-50"
        }`}
        style={
          isActive
            ? { background: "#2557a7", boxShadow: "0 4px 16px rgba(37,87,167,0.28), inset 0 1px 0 rgba(255,255,255,0.12)" }
            : {}
        }
      >
        {!isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full bg-[#2557a7] transition-all duration-200 h-0 group-hover/btn:h-5 opacity-0 group-hover/btn:opacity-100" />
        )}
        <Icon size={17} sw={isActive ? 1.75 : 1.55} className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-gray-600 group-hover/btn:text-[#2557a7]"}`} />
        <span className={`flex-1 text-left truncate text-[12px] font-medium transition-colors ${isActive ? "text-white font-semibold" : "text-gray-600 group-hover/btn:text-[#2557a7]"}`}>
          {item.label}
        </span>
        {showBadge && !isActive && (
          <span className={`text-[9px] font-semibold px-1.5 py-px rounded-full shrink-0 leading-none ${profileCompleteness >= 100 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {profileCompleteness}%
          </span>
        )}
        {hasSub && !isActive && <IcoChevronRight size={10} className="text-gray-400 group-hover/btn:text-[#2557a7] shrink-0 transition-colors" sw={2} />}
        {isActive && !hasSub && <IcoChevronRight size={11} className="text-white/65 shrink-0" sw={2.5} />}
        {isActive && hasSub && <IcoChevronRight size={10} className="text-white/65 shrink-0" sw={2} />}
      </button>
    );

    if (!hasSub) return btn;

    return (
      <div ref={wrapperRef} onMouseEnter={openDrop} onMouseLeave={closeDrop}>
        {btn}
        {/* Dropdown rendered fixed so sidebar overflow-hidden/overflow-y-auto can't clip it */}
        {dropPos && (
          <div
            onMouseEnter={openDrop}
            onMouseLeave={closeDrop}
            style={{ position: "fixed", top: dropPos.top, left: dropPos.left, minWidth: 190, zIndex: 9999 }}
          >
            <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
              {item.subItems!.map((sub) => {
                const subActive = pathname === sub.path || pathname.startsWith(sub.path + "/");
                return (
                  <button
                    key={sub.id}
                    onClick={() => { closeDrop(); router.push(sub.path); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[11px] font-medium transition-colors ${
                      subActive ? "text-[#2557a7] bg-[#2557a7]/5" : "text-gray-600 hover:bg-gray-50 hover:text-[#2557a7]"
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: subActive ? "#2557a7" : "#d1d5db" }} />
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-60 bg-white flex flex-col z-30 overflow-hidden"
      style={{ borderRight: "1px solid #f0f0f0", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" }}>

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-2.5 pt-1.5 pb-1 space-y-1">
        {VISIBLE_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section label with trailing line */}
            <div className="flex items-center gap-1.5 px-1 mb-0.5">
              <span className="text-[8.5px] font-semibold text-gray-400 tracking-[0.08em] uppercase shrink-0">
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
    </div>


);
}
