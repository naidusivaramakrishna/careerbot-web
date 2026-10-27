"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getAllResumesUnified, getAllResumes } from "@/api/resumeApi";
import { getEnhancementHistory } from "@/api/enhancerApi";
import { useDashboard } from "@/contexts/DashboardContext";
import { useHasCollegeMembership, useStudentCollege } from "@/hooks/useCollegeMembership";
import { useCollegeDisabledFeatures } from "@/hooks/useCollegeFeatureAccess";
import { withoutDisabledFeatures } from "@/lib/collegeFeatures";
import {
  EnterpriseChevronRightIcon as IcoChevronRight,
  EnterpriseDashboardIcon as IcoDashboard,
  EnterpriseProfileIcon as IcoProfile,
  type EnterpriseNavIcon,
} from "@/components/icons/EnterpriseNavIcons";
import {
  SidebarTrackerIcon as IcoTracker,
  SidebarAtsScanIcon as IcoAtsScan,
  SidebarCodingIcon as IcoCodingTest,
  SidebarCommunicationIcon as IcoCommunication,
  SidebarCoverLetterIcon as IcoCoverLetter,
  SidebarMockInterviewIcon as IcoInterview,
  SidebarJobMatchIcon as IcoJobMatch,
  SidebarJobsIcon as IcoJobs,
  SidebarMockTestIcon as IcoMockTest,
  SidebarNotesIcon as IcoNotes,
  SidebarResumeIcon as IcoResume,
  SidebarTemplatesIcon as IcoTemplates,
} from "@/components/icons/SidebarIcons";
/* NAV CONFIG */
type NavIcon = EnterpriseNavIcon | ((props: IP) => React.ReactElement);

type SubNavItem = { id: string; label: string; path: string };

/* ══════════════════════════════════════════════════════════════
   CUSTOM ICON (My College — not in the icon sets)
══════════════════════════════════════════════════════════════ */
type IP = { size?: number; className?: string; sw?: number };

/** My College — a building with a flag, distinct from the job-search icons */
const IcoCollege = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17.5h15" stroke="currentColor" strokeWidth={sw} />
    <path d="M4 17.5V8.5L10 5.5l6 3v9" stroke="currentColor" strokeWidth={sw} />
    <path d="M10 5.5V2.5l3 1-3 1" stroke="currentColor" strokeWidth={sw * 0.9} />
    <path d="M8 17.5v-4h4v4" stroke="currentColor" strokeWidth={sw * 0.9} />
  </svg>
);

/** College tasks — a checklist with one item ticked */
const IcoTasks = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 5.5l1.5 1.5L7 4.5" stroke="currentColor" strokeWidth={sw} />
    <path d="M9.5 5.5h7.5M9.5 10h7.5M9.5 14.5h7.5" stroke="currentColor" strokeWidth={sw} />
    <path d="M3.5 10h2M3.5 14.5h2" stroke="currentColor" strokeWidth={sw * 0.9} />
  </svg>
);

/** My people — two heads, the student's faculty and placement officer */
const IcoPeople = ({ size = 18, className = "", sw = 1.6 }: IP) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="7.5" cy="7" r="2.75" stroke="currentColor" strokeWidth={sw} />
    <path d="M2.5 16.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" stroke="currentColor" strokeWidth={sw} />
    <circle cx="13.75" cy="7.75" r="2.25" stroke="currentColor" strokeWidth={sw * 0.9} />
    <path d="M14 12.5c1.7.2 3 1.4 3.5 3.25" stroke="currentColor" strokeWidth={sw * 0.9} />
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
      { id: "templates", label: "Templates", icon: IcoTemplates, path: "/templates" },
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
      { id: "cover_letter", label: "Cover Letter",   icon: IcoCoverLetter, path: "/cover-letter/history" },
      { id: "interview_notes", label: "Interview Notes", icon: IcoNotes, path: "/prep/notes" },
    ],
  },
  {
    label: "PREPARE",
    items: [
      { id: "mock_interview", label: "Mock Interview",  icon: IcoInterview, path: "/mock-interview/live" },
      { id: "comm_assess",   label: "Communication",   icon: IcoCommunication, path: "/communication/start" },
      { id: "mock_test",     label: "Mock Test",       icon: IcoMockTest,  path: "/mock-test" },
      { id: "coding_test",   label: "Coding Practice", icon: IcoCodingTest, path: "/coding-test" },
    ],
  },
];

const VISIBLE_NAV_GROUPS = NAV_GROUPS;

// The college area is NOT in NAV_GROUPS. That list is computed once at module
// scope from build-time flags, and college membership is a per-USER fact
// resolved at runtime -- putting it there would show every jobseeker a link
// that refuses them the moment they follow it.
// Typed as one of NAV_GROUPS' own elements rather than `as const`: the render
// loop reads `item.subItems`, and a narrower literal type drops that property
// from the union and fails the build.
const COLLEGE_NAV_GROUP: (typeof NAV_GROUPS)[number] = {
  label: "COLLEGE",
  items: [
    { id: "institution", label: "My College", icon: IcoCollege, path: "/institution" },
  ],
};

/**
 * A STUDENT's nav (spec: student section, "Proposed"): their college first and
 * named after it, then the tools their college watches -- results reach the
 * placement officer automatically and the student should be told so -- then
 * everything else as "YOUR OWN", in today's order. Nothing is removed; this is
 * a regrouping of the same items. Staff and jobseekers never get it.
 */
export function studentNavGroups(collegeName: string): (typeof NAV_GROUPS)[number][] {
  const prepare = VISIBLE_NAV_GROUPS.find((g) => g.label === "PREPARE");
  const own = VISIBLE_NAV_GROUPS
    .filter((g) => g.label !== "PREPARE")
    .flatMap((g) => g.items);
  return [
    {
      label: collegeName,
      items: [
        { id: "college_progress", label: "My progress", icon: IcoCollege, path: "/institution" },
        { id: "college_tasks",    label: "Tasks",       icon: IcoTasks,   path: "/institution/me/tasks" },
        { id: "college_people",   label: "My people",   icon: IcoPeople,  path: "/institution/me/people" },
      ],
    },
    ...(prepare ? [{ label: "YOUR COLLEGE SEES THESE", items: prepare.items }] : []),
    ...(own.length ? [{ label: "YOUR OWN", items: own }] : []),
  ];
}

/**
 * The active item. An EXACT path match wins over a prefix match:
 * "/institution" (My progress) is a prefix of "/institution/me/tasks", and the
 * first-prefix-wins rule alone would light up the wrong item.
 */
export function activeNavId(
  navGroups: (typeof NAV_GROUPS)[number][],
  pathname: string,
): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.path && pathname === item.path) return item.id;
    }
  }
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.id === "cover_letter" && pathname.startsWith("/cover-letter/")) {
        return item.id;
      }
      if (item.path && (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path)))) {
        return item.id;
      }
    }
  }
  if (pathname === "/prep" || pathname.startsWith("/prep/"))                  return "interview_notes";
  if (pathname.startsWith("/mock-interview"))                                 return "mock_interview";
  if (pathname.startsWith("/communication"))                                  return "comm_assess";
  if (pathname.startsWith("/mock-test"))                                      return "mock_test";
  if (pathname.startsWith("/settings"))                                       return "settings";
  if (pathname.startsWith("/account/subscriptions"))  return "subscription";
  if (pathname.startsWith("/settings/billing"))       return "billing_history";
  return "";
}

const SIDEBAR_EXPANDED_STORAGE_KEY = "careerbot:sidebar-expanded";

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
        onClick={() => popPos ? setPopPos(null) : open()}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isActive ? "" : "group-hover/icon:bg-gray-100"
          }`}
          style={isActive ? { background: "#eaf1fb", boxShadow: "inset 0 0 0 1px #9db9e6" } : {}}
        >
          <Icon size={18} sw={isActive ? 1.75 : 1.6} className={`transition-colors ${isActive ? "text-[#1d4fa8]" : "text-gray-600 group-hover/icon:text-[#2557a7]"}`} />
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

  // Sidebar visibility is a user preference. It must not depend on the route:
  // navigating from one feature to another should preserve the choice until the
  // user uses this control again.
  const [isExpanded, setIsExpanded] = useState(true);
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);

  useEffect(() => {
    try {
      setIsExpanded(window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY) !== "false");
    } catch {
      // Storage can be unavailable; keep the default expanded navigation.
    } finally {
      setSidebarPreferenceLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceLoaded) return;
    try {
      window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, String(isExpanded));
    } catch {
      // Storage failure must not prevent users from toggling the sidebar.
    }
  }, [isExpanded, sidebarPreferenceLoaded]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isExpanded ? "200px" : "64px"
    );
  }, [isExpanded]);

  const handleToggle = () => setIsExpanded((v) => !v);

  useEffect(() => {
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  const { data: dashboardData } = useDashboard();
  const profileCompleteness = dashboardData?.profile.completeness ?? 0;

  // A STUDENT gets their college first (studentNavGroups). Staff keep the
  // appended "My College" link -- a member of staff is still a jobseeker with
  // their own tools, and the college is one more place they can go. A
  // jobseeker sees exactly the static groups.
  const hasCollege = useHasCollegeMembership();
  const studentCollege = useStudentCollege();
  const studentCollegeName = studentCollege?.name ?? null;
  // What the student's college has switched off (G6). Asked only for an
  // account with a membership; the server answers [] for staff. The server
  // refuses these engines anyway -- this only stops the menu offering a door
  // that will not open.
  const collegeDisabled = useCollegeDisabledFeatures(hasCollege);
  const navGroups = useMemo(() => {
    const groups = studentCollegeName
      ? studentNavGroups(studentCollegeName)
      : hasCollege ? [...VISIBLE_NAV_GROUPS, COLLEGE_NAV_GROUP] : VISIBLE_NAV_GROUPS;
    return withoutDisabledFeatures(groups, collegeDisabled);
  }, [hasCollege, studentCollegeName, collegeDisabled]);

  const activeId = activeNavId(navGroups, pathname);

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
      <>
      <button
      onClick={handleToggle}
      title="Expand sidebar"
      aria-label="Expand sidebar navigation"
      aria-expanded={isExpanded}
      aria-controls="dashboard-sidebar"
        style={{ position: "fixed", top: 58, left: 50, zIndex: 50, width: 28, height: 28, borderRadius: 8, background: "transparent", border: "none", boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <PanelLeftOpen size={18} strokeWidth={1.9} aria-hidden="true" className="text-[#2557a7]" />
      </button>
      <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-16 bg-white flex flex-col z-30 overflow-visible"
        id="dashboard-sidebar"
        style={{ borderRight: "1px solid #f0f0f0", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" }}>
        <nav className="flex-1 min-h-0 overflow-visible py-0.5 px-2" aria-label="Primary navigation collapsed" role="navigation">
          {navGroups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="mx-1 my-1 border-t border-gray-300" />}
              <div className="space-y-0">
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
                      aria-label={item.label}
                      title={item.label}
                      className="w-full flex items-center justify-center py-px group"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isActive ? "" : "group-hover:bg-gray-100"
                        }`}
                        style={isActive ? { background: "#eaf1fb", boxShadow: "inset 0 0 0 1px #9db9e6" } : {}}
                      >
                                      <Icon size={18} sw={isActive ? 1.75 : 1.6} className={`transition-colors ${isActive ? "text-[#1d4fa8]" : "text-gray-600 group-hover:text-[#2557a7]"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      </>
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
      setDropPos({ top: r.top - 20, left: r.right + 4 });
    }, []);

    const closeDrop = useCallback(() => {
      closeTimerRef.current = setTimeout(() => setDropPos(null), 150);
    }, []);

    const btn = (
      <button
        onClick={() => handleNavigation(item)}
        className={`w-full flex items-center gap-2 px-2.5 py-0.5 rounded-lg transition-all duration-200 group/btn relative ${
          isActive ? "" : "hover:bg-gray-50"
        }`}
        style={
          isActive
            ? { background: "#eaf1fb", boxShadow: "inset 0 0 0 1px #9db9e6" }
            : {}
        }
      >
        {!isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-full bg-[#2557a7] transition-all duration-200 h-0 group-hover/btn:h-5 opacity-0 group-hover/btn:opacity-100" />
        )}
        <Icon size={17} sw={isActive ? 1.75 : 1.55} className={`shrink-0 transition-colors ${isActive ? "text-[#1d4fa8]" : "text-gray-600 group-hover/btn:text-[#2557a7]"}`} />
        <span className={`flex-1 text-left truncate text-[12px] font-medium transition-colors ${isActive ? "text-[#1d4fa8] font-semibold" : "text-gray-600 group-hover/btn:text-[#2557a7]"}`}>
          {item.label}
        </span>
        {showBadge && !isActive && (
          <span className={`text-[9px] font-semibold px-1.5 py-px rounded-full shrink-0 leading-none ${profileCompleteness >= 100 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {profileCompleteness}%
          </span>
        )}
        {hasSub && !isActive && <IcoChevronRight size={10} className="text-gray-400 group-hover/btn:text-[#2557a7] shrink-0 transition-colors" sw={2} />}
        {isActive && !hasSub && <IcoChevronRight size={11} className="text-[#1d4fa8]/70 shrink-0" sw={2.5} />}
        {isActive && hasSub && <IcoChevronRight size={10} className="text-[#1d4fa8]/70 shrink-0" sw={2} />}
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
    <>
    <button
      onClick={handleToggle}
      title="Collapse sidebar"
      aria-label="Collapse sidebar navigation"
      aria-expanded={isExpanded}
      aria-controls="dashboard-sidebar"
      style={{ position: "fixed", top: 58, left: 186, zIndex: 50, width: 28, height: 28, borderRadius: 8, background: "transparent", border: "none", boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <PanelLeftClose size={18} strokeWidth={1.9} aria-hidden="true" className="text-[#2557a7]" />
    </button>
    <div className="fixed top-14 left-0 h-[calc(100vh-56px)] bg-white flex flex-col z-30 overflow-hidden"
      id="dashboard-sidebar"
      style={{ width: 200, borderRight: "1px solid #f0f0f0", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" }}>

      <nav className="min-h-0 overflow-y-auto scrollbar-hide px-2.5 pt-1 pb-1 space-y-0.5" aria-label="Primary navigation" role="navigation">
        {navGroups.map((group) => (
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
      <div className="flex-1" />
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center tracking-wide">CareerBot AI</p>
      </div>
    </div>
    </>
  );
}
















