// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import {
//   LayoutDashboard,
//   User,
//   FileText,
//   ScanSearch,
//   Wand2,
//   Briefcase,
//   Search,
//   BarChart2,
//   MessageSquare,
//   Crown,
//   TrendingUp,
//   ChevronRight,
// } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import { getAllResumes } from "@/api/resumeApi";
// import { getMockQuotaBalance } from "@/__mocks__/quotaMock";

// const EXPANDED_PATHS = ["/dashboard", "/profile"];

// const NAV_GROUPS = [
//   {
//     label: "MAIN",
//     items: [
//       { id: "dashboard", label: "Dashboard",         icon: LayoutDashboard, path: "/dashboard" },
//       { id: "profile",   label: "Profile",           icon: User,            path: "/profile", showBadge: true },
//     ],
//   },
//   {
//     label: "RESUME",
//     items: [
//       { id: "resume",   label: "Resume Builder",  icon: FileText,   path: "/builder", smartNav: true },
//       { id: "ats",      label: "ATS Scan",         icon: ScanSearch, path: "/atslogin" },
//       { id: "enhancer", label: "Enhance Resume",   icon: Wand2,      path: "/enhancer" },
//     ],
//   },
//   {
//     label: "CAREER",
//     items: [
//       { id: "jd_match", label: "Job Match",          icon: BarChart2,    path: "/jobmatch" },
//       { id: "jobs",     label: "Jobs",               icon: Search,       path: "/jobs" },
//       { id: "tracker",  label: "Track Applications", icon: Briefcase,    path: "/tracker" },
//     ],
//   },
//   {
//     label: "PREPARE",
//     items: [
//       { id: "communication", label: "Interview Prep", icon: MessageSquare, path: "/prep" },
//     ],
//   },
// ];

// export default function Sidebar() {
//   const router   = useRouter();
//   const pathname = usePathname();

//   const [isExpanded, setIsExpanded] = useState(
//     EXPANDED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
//   );

//   useEffect(() => {
//     setIsExpanded(
//       EXPANDED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
//     );
//   }, [pathname]);

//   useEffect(() => {
//     document.documentElement.style.setProperty(
//       "--sidebar-width",
//       isExpanded ? "240px" : "64px"
//     );
//   }, [isExpanded]);

//   const handleToggle = () => setIsExpanded((v) => !v);

//   // Listen for toggle events dispatched by the Header logo click
//   useEffect(() => {
//     window.addEventListener("toggle-sidebar", handleToggle);
//     return () => window.removeEventListener("toggle-sidebar", handleToggle);
//   }, []);

//   const [credits,        setCredits]       = useState<{ remaining: number; total: number } | null>(null);
//   const [loadingCredits, setLoadingCredits] = useState(true);
//   const profileCompleteness = 75;

//   const getActiveId = () => {
//     for (const group of NAV_GROUPS) {
//       for (const item of group.items) {
//         if (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))) {
//           return item.id;
//         }
//       }
//     }
//     if (pathname.startsWith("/settings")) return "settings";
//     return "";
//   };
//   const activeId = getActiveId();

//   useEffect(() => {
//     const mock = getMockQuotaBalance();
//     setCredits({ remaining: mock.credits_remaining, total: mock.credits_total });
//     setLoadingCredits(false);

//     const onCreditUpdate = (e: CustomEvent) => {
//       setCredits({ remaining: e.detail.remaining, total: e.detail.total });
//     };
//     window.addEventListener("credits-updated", onCreditUpdate as EventListener);
//     return () => window.removeEventListener("credits-updated", onCreditUpdate as EventListener);
//   }, []);

//   const handleNavigation = async (item: { id: string; path: string; smartNav?: boolean }) => {
//     if (item.smartNav) {
//       try {
//         const resumes = await getAllResumes();
//         router.push(resumes?.length > 0 ? "/builder/start/list" : "/builder/start");
//       } catch {
//         router.push("/builder/start");
//       }
//     } else {
//       router.push(item.path);
//     }
//   };

//   const creditPct = credits ? (credits.remaining / credits.total) * 100 : 0;

//   /* ════════════════════════════════════════════════════
//      COLLAPSED — 64px, icons only
//   ════════════════════════════════════════════════════ */
//   if (!isExpanded) {
//     return (
//       <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-16 bg-white border-r border-gray-200 flex flex-col z-30 overflow-hidden">

//         {/* Icon-only nav */}
//         <nav className="flex-1 overflow-y-auto scrollbar-hide py-1 px-1.5">
//           {NAV_GROUPS.map((group, groupIndex) => (
//             <div key={group.label}>
//               {groupIndex > 0 && (
//                 <div className="mx-2 my-2 border-t border-gray-400" />
//               )}
//               <div className="space-y-0.5">
//                 {group.items.map((item) => {
//                   const isActive = activeId === item.id;
//                   const Icon = item.icon;
//                   return (
//                     <button
//                       key={item.id}
//                       onClick={() => handleNavigation(item)}
//                       title={item.label}
//                       aria-label={item.label}
//                       className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
//                         isActive
//                           ? "bg-[#2557a7] text-white shadow-sm"
//                           : "text-gray-600 hover:bg-gray-50"
//                       }`}
//                     >
//                       <Icon size={18} className="shrink-0" />
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}
//         </nav>

//         {/* Compact upgrade button */}
//         <div className="shrink-0 px-1.5 pb-3 pt-1">
//           <Link
//             href="/payments"
//             title="Upgrade Plan"
//             aria-label="Upgrade Plan"
//             className="flex items-center justify-center p-2.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
//             style={{
//               background: "#2557a7",
//               boxShadow: "0 2px 8px rgba(37,87,167,0.3)",
//             }}
//           >
//             <TrendingUp size={15} style={{ color: "#0f172a" }} />
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   /* ════════════════════════════════════════════════════
//      EXPANDED — 240px, full labels
//   ════════════════════════════════════════════════════ */
//   const NavItem = ({
//     item,
//     showBadge,
//   }: {
//     item: (typeof NAV_GROUPS)[0]["items"][0];
//     showBadge?: boolean;
//   }) => {
//     const isActive = activeId === item.id;
//     const Icon     = item.icon;

//     return (
//       <button
//         onClick={() => handleNavigation(item)}
//         className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
//           isActive
//             ? "bg-[#2557a7] text-white"
//             : "text-black hover:bg-gray-50"
//         }`}
//       >
//         <Icon
//           size={18}
//           className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-black"}`}
//         />
//         <span className="flex-1 text-left truncate">{item.label}</span>

//         {showBadge && (
//           <span
//             className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
//               profileCompleteness >= 100
//                 ? "bg-emerald-100 text-emerald-700"
//                 : "bg-amber-100 text-amber-700"
//             }`}
//           >
//             {profileCompleteness}%
//           </span>
//         )}

//         {isActive && <ChevronRight size={14} className="text-white shrink-0" />}
//       </button>
//     );
//   };

//   return (
//     <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-60 bg-white flex flex-col z-30 overflow-hidden">

//       {/* Navigation groups */}
//       <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-2 space-y-2">
//         {NAV_GROUPS.map((group) => (
//           <div key={group.label}>
//             <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-3 mb-1">
//               {group.label}
//             </p>
//             <div className="space-y-0.5">
//               {group.items.map((item) => (
//                 <NavItem
//                   key={item.id}
//                   item={item}
//                   showBadge={"showBadge" in item && item.showBadge}
//                 />
//               ))}
//             </div>
//           </div>
//         ))}
//       </nav>

//       {/* Bottom premium plan card */}
//       <div className="shrink-0 px-3 pb-2 pt-1">
//         <div className="relative rounded-xl overflow-hidden bg-gray-200">
//           <div className="relative px-3.5 py-2 space-y-2">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-1.5">
//                 <Crown size={12} className="text-amber-500 shrink-0" />
//                 <span className="text-gray-700 text-[11px] font-bold tracking-wide">FREE Plan</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 {credits && (
//                   <div className="relative shrink-0">
//                     <svg width="22" height="22" className="-rotate-90" style={{ overflow: "visible" }}>
//                       <defs>
//                         <linearGradient id="sb-cred" x1="0%" y1="0%" x2="100%" y2="100%">
//                           <stop offset="0%"   stopColor={creditPct < 20 ? "#ef4444" : "#5896d7"} />
//                           <stop offset="100%" stopColor={creditPct < 20 ? "#f97316" : "#2557a7"} />
//                         </linearGradient>
//                       </defs>
//                       <circle cx="11" cy="11" r="8" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2.5" />
//                       <circle cx="11" cy="11" r="8" fill="none" stroke="url(#sb-cred)" strokeWidth="2.5"
//                         strokeLinecap="round"
//                         strokeDasharray={2 * Math.PI * 8}
//                         strokeDashoffset={2 * Math.PI * 8 * (1 - creditPct / 100)}
//                         style={{ transition: "stroke-dashoffset 0.6s ease" }}
//                       />
//                     </svg>
//                   </div>
//                 )}
//                 {loadingCredits ? (
//                   <div className="w-10 h-3 rounded animate-pulse bg-gray-300" />
//                 ) : credits ? (
//                   <span className="text-[11px] leading-none">
//                     <span className={`font-black ${creditPct < 20 ? "text-red-500" : "text-[#2557a7]"}`}>
//                       {credits.remaining}
//                     </span>
//                     <span className="text-gray-400 font-normal">/{credits.total}</span>
//                   </span>
//                 ) : null}
//               </div>
//             </div>

//             <Link
//               href="/pricing"
//               className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all hover:opacity-90 active:scale-95"
//               style={{
//                 background: "#2557a7",
//                 color: "#ffffff",
//                 boxShadow: "0 3px 10px rgba(37,87,167,0.28)",
//               }}
//             >
//               <TrendingUp size={11} />
//               Upgrade Now
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  User,
  FileText,
  FileSignature,
  ScanSearch,
  Wand2,
  Briefcase,
  Search,
  BarChart2,
  MessageSquare,
  Crown,
  TrendingUp,
  ChevronRight,
  CreditCard,
  Receipt,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getAllResumesUnified, getAllResumes } from "@/api/resumeApi";
import { getEnhancementHistory } from "@/api/enhancerApi";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { useDashboard } from "@/contexts/DashboardContext";

const EXPANDED_PATHS = ["/dashboard", "/profile"];

const NAV_GROUPS = [
  {
    label: "MAIN",
    items: [
      { id: "dashboard", label: "Dashboard",         icon: LayoutDashboard, path: "/dashboard" },
      { id: "profile",   label: "Profile",           icon: User,            path: "/profile", showBadge: true },
    ],
  },
  {
    label: "RESUME",
    items: [
      { id: "resume",   label: "Resume Builder",  icon: FileText,   path: "/builder", smartNav: true },
      { id: "ats",      label: "ATS Scan",         icon: ScanSearch, path: "/atslogin" },
      // { id: "enhancer", label: "Enhance Resume",   icon: Wand2,      path: "/enhancer" },
    ],
  },
  {
    label: "CAREER",
    items: [
      { id: "jd_match", label: "Job Match",          icon: BarChart2,    path: "/jobmatch" },
      { id: "jobs",     label: "Jobs",               icon: Search,       path: "/jobs" },
      { id: "tracker",  label: "Track Applications", icon: Briefcase,    path: "/tracker" },
    ],
  },
  // GENERATE — AI-driven artifact generators (top-level peer to RESUME
  // and CAREER per the cover-letter wireframes route-group decision,
  // 2026-05-25). Items are conditionally pruned below by NEXT_PUBLIC_*
  // flags so disabled features don't even appear in nav.
  {
    label: "GENERATE",
    items: [
      { id: "cover_letter", label: "Cover Letter",   icon: FileSignature, path: "/cover-letter", flag: "NEXT_PUBLIC_COVER_LETTER_ENABLED" },
    ],
  },
  {
    label: "PREPARE",
    items: [
      { id: "communication", label: "Interview Prep", icon: MessageSquare, path: "/prep" },
    ],
  },
  {
   label: "BILLING",
   items: [
     { id: "subscription", label: "Subscription",     icon: CreditCard, path: "/account/subscriptions" },
     { id: "billing_history", label: "Billing History", icon: Receipt,    path: "/settings/billing" },
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

  // Listen for toggle events dispatched by the Header logo click
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
        if (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))) {
          return item.id;
        }
      }
    }
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/account/subscriptions")) return "subscription";
    if (pathname.startsWith("/settings/billing")) return "billing_history";
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
        // Unified endpoint failed — try individual endpoints as fallback
        try {
          const [builderResumes, enhancedResumes] = await Promise.allSettled([
            getAllResumes(),
            getEnhancementHistory(),
          ]);
          const hasBuilder = builderResumes.status === "fulfilled" && builderResumes.value.length > 0;
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

  /* ════════════════════════════════════════════════════
     COLLAPSED — 64px, icons only
  ════════════════════════════════════════════════════ */
  if (!isExpanded) {
    return (
      <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-16 bg-white border-r border-gray-200 flex flex-col z-30 overflow-hidden">

        {/* Icon-only nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-1 px-1.5">
          {VISIBLE_NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && (
                <div className="mx-2 my-2 border-t border-gray-400" />
              )}
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
                      className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
                        isActive
                          ? "bg-[#2557a7] text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Compact upgrade button */}
        <div className="shrink-0 px-1.5 pb-3 pt-1">
          <Link
            href="/payments"
            title="Upgrade Plan"
            aria-label="Upgrade Plan"
            className="flex items-center justify-center p-2.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{
             background: balance ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' : "#2557a7",
             boxShadow: "0 2px 8px rgba(37,87,167,0.3)",
           }}
          >
            <TrendingUp size={15} style={{ color: balance ? "#fbbf24" : "#0f172a" }} />
          </Link>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     EXPANDED — 240px, full labels
  ════════════════════════════════════════════════════ */
  const NavItem = ({
    item,
    showBadge,
  }: {
    item: (typeof NAV_GROUPS)[0]["items"][0];
    showBadge?: boolean;
  }) => {
    const isActive = activeId === item.id;
    const Icon     = item.icon;

    return (
      <button
        onClick={() => handleNavigation(item)}
        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive
            ? "bg-[#2557a7] text-white"
            : "text-black hover:bg-gray-50"
        }`}
      >
        <Icon
          size={18}
          className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-black"}`}
        />
        <span className="flex-1 text-left truncate">{item.label}</span>

        {showBadge && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              profileCompleteness >= 100
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {profileCompleteness}%
          </span>
        )}

        {isActive && <ChevronRight size={14} className="text-white shrink-0" />}
      </button>
    );
  };

  return (
    <div className="fixed top-14 left-0 h-[calc(100vh-56px)] w-60 bg-white flex flex-col z-30 overflow-hidden">

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-2 space-y-2">
        {VISIBLE_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  showBadge={"showBadge" in item && item.showBadge}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom premium plan card */}
      <div className="shrink-0 px-3 pb-2 pt-1">
        <div className="relative rounded-xl overflow-hidden" style={{
          background: balance ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' : '#f3f4f6'
        }}>
          <div className="relative px-3.5 py-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown size={12} className={`shrink-0 ${balance ? 'text-yellow-300' : 'text-gray-400'}`} />
                <span className={`text-[11px] font-bold tracking-wide ${
                  balance ? 'text-white' : 'text-gray-600'
                }`}>
                  {balance ? 'PREMIUM' : 'FREE Plan'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {balance && (
                  <div className="relative shrink-0">
                    <svg width="22" height="22" className="-rotate-90" style={{ overflow: "visible" }}>
                      <defs>
                        <linearGradient id="sb-cred" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor={creditPct < 20 ? "#ef4444" : "#5896d7"} />
                          <stop offset="100%" stopColor={creditPct < 20 ? "#f97316" : "#2557a7"} />
                        </linearGradient>
                      </defs>
                      <circle cx="11" cy="11" r="8" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2.5" />
                      <circle cx="11" cy="11" r="8" fill="none" stroke="url(#sb-cred)" strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 8}
                        strokeDashoffset={2 * Math.PI * 8 * (1 - creditPct / 100)}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                      />
                    </svg>
                  </div>
                )}
                {loadingCredits ? (
                  <div className="w-10 h-3 rounded animate-pulse bg-gray-300" />
                ) : balance ? (
                  <span className="text-[11px] leading-none text-white">
                    <span className={`font-black ${creditPct < 20 ? "text-red-200" : "text-white"}`}>
                      {balance.credits_remaining}
                    </span>
                    <span className="text-white/60 font-normal">/{balance.credits_total}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <Link
              href="/payments"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: balance ? 'rgba(255,255,255,0.2)' : "#2557a7",
                color: "#ffffff",
                boxShadow: balance ? 'none' : "0 3px 10px rgba(37,87,167,0.28)",
                border: balance ? '1px solid rgba(255,255,255,0.3)' : 'none'
              }}
            >
              <TrendingUp size={11} />
              {balance ? 'Manage Plan' : 'Upgrade Now'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
