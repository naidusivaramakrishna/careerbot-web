"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  MapPin,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Clock,
  Shield,
  RefreshCw,
} from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { getSmartMatchedJobs } from "@/api/jobsApi";
import type { SmartMatchResponse } from "@/api/jobsApi";

const MATCH_CRITERIA = [
  { icon: BrainCircuit,  label: "Skills & Technologies", desc: "Matches your technical stack" },
  { icon: Briefcase,     label: "Role & Experience",     desc: "Aligns with your seniority"   },
  { icon: GraduationCap, label: "Education & Domain",    desc: "Industry & qualification fit" },
  { icon: MapPin,        label: "Location Preferences",  desc: "Remote, hybrid or on-site"    },
];

interface MatchStats {
  totalRoles: number | null;   // data.total
  topScore: number | null;     // best match.score across jobs
  isFresh: boolean | null;     // !data.cache_hit
}

function StatSkeleton() {
  return (
    <div className="rounded-xl bg-gray-100 py-3 px-2 text-center animate-pulse">
      <div className="h-5 w-10 bg-gray-200 rounded mx-auto mb-1" />
      <div className="h-2.5 w-12 bg-gray-200 rounded mx-auto" />
    </div>
  );
}

const JobMatchTab: React.FC = () => {
  const { lastUpdated, completionStatus } = useResume();
  const router = useRouter();

  const [stats, setStats] = useState<MatchStats>({ totalRoles: null, topScore: null, isFresh: null });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setStatsLoading(true);
      try {
        const data: SmartMatchResponse = await getSmartMatchedJobs({ limit: 50 });
        if (cancelled) return;
        const scores = (data.jobs || []).map((j) => j.match.score).filter((s) => typeof s === "number");
        setStats({
          totalRoles: data.total ?? data.jobs.length,
          topScore:   scores.length > 0 ? Math.round(Math.max(...scores)) : null,
          isFresh:    !data.cache_hit,
        });
      } catch {
        // Any error — silently fall back to static defaults (nulls show "—")
        if (!cancelled) setStats({ totalRoles: null, topScore: null, isFresh: null });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  // Resume readiness
  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;
  const totalSections     = Object.keys(completionStatus).length;
  const completedSections = Object.values(completionStatus).filter(Boolean).length;
  const completionPct     = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  const readinessColor =
    completionPct >= 70 ? "bg-emerald-500" :
    completionPct >= 40 ? "bg-amber-500"   : "bg-red-400";
  const readinessLabel =
    completionPct >= 70 ? "Strong" :
    completionPct >= 40 ? "Good"   : "Needs work";
  const readinessTextColor =
    completionPct >= 70 ? "text-emerald-600" :
    completionPct >= 40 ? "text-amber-600"   : "text-red-500";
  const readinessBg =
    completionPct >= 70 ? "bg-emerald-50" :
    completionPct >= 40 ? "bg-amber-50"   : "bg-red-50";

  // Dynamic stat chips
  const rolesDisplay  = stats.totalRoles !== null ? `${stats.totalRoles}+` : "—";
  const scoreDisplay  = stats.topScore  !== null ? `${stats.topScore}%`   : "—";
  const freshDisplay  = stats.isFresh   !== null ? (stats.isFresh ? "Live" : "Cached") : "—";
  const freshColor    = stats.isFresh === false   ? "text-amber-600"       : "text-violet-600";
  const freshBg       = stats.isFresh === false   ? "bg-amber-50"         : "bg-violet-50";
  const scoreColor    = stats.topScore !== null && stats.topScore >= 70 ? "text-emerald-600"
                      : stats.topScore !== null ? "text-amber-600" : "text-emerald-600";

  const DYNAMIC_STATS = [
    { value: rolesDisplay, label: "Matched Roles", color: "text-[#2557a7]",  bg: "bg-blue-50"   },
    { value: scoreDisplay, label: "Top Match",     color: scoreColor,         bg: "bg-emerald-50" },
    { value: freshDisplay, label: "Data Status",   color: freshColor,         bg: freshBg         },
  ];

  return (
    <div className="flex flex-col gap-0 bg-white">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a3a6b] via-[#2557a7] to-[#3b7dd8] px-5 pt-6 pb-8">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4">
            <Sparkles size={11} className="text-yellow-300" />
            <span className="text-[11px] font-semibold text-white tracking-wide">AI-POWERED MATCHING</span>
          </div>
          <h2 className="text-[22px] font-bold text-white leading-snug mb-2">
            Discover Jobs Built<br />For Your Profile
          </h2>
          <p className="text-blue-100 text-[13px] leading-relaxed max-w-[260px]">
            Our AI analyses your resume across 4 dimensions and surfaces the best-fit roles instantly.
          </p>
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5">

        {/* ── Resume readiness card ── */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Resume Readiness</p>
              {formattedDate && (
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={10} /> Updated {formattedDate}
                </p>
              )}
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${readinessTextColor} ${readinessBg}`}>
              {readinessLabel}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${readinessColor}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400">{completedSections} of {totalSections} sections filled</span>
            <span className="text-[12px] font-bold text-gray-700">{completionPct}%</span>
          </div>
        </div>

        {/* ── Match criteria ── */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            What We Match On
          </p>
          <div className="flex flex-col gap-2.5">
            {MATCH_CRITERIA.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-[#2557a7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 leading-tight">{label}</p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Dynamic stats row ── */}
        <div className="grid grid-cols-3 gap-2">
          {statsLoading
            ? Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
            : DYNAMIC_STATS.map(({ value, label, color, bg }) => (
                <div key={label} className={`rounded-xl ${bg} py-3 px-2 text-center`}>
                  <p className={`text-[18px] font-extrabold ${color} leading-none mb-0.5`}>{value}</p>
                  <p className="text-[10px] text-gray-500 font-medium leading-tight">{label}</p>
                </div>
              ))
          }
        </div>

        {/* ── CTA button ── */}
        <button
          onClick={() => router.push("/jobs?tab=matched")}
          className="group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-white text-[14px] bg-[#2557a7] hover:bg-[#1e4d9b] transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          {statsLoading
            ? <><RefreshCw size={15} className="animate-spin" /> Loading match data…</>
            : <><TrendingUp size={16} />Find My Matching Jobs<ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" /></>
          }
        </button>

        {/* ── Trust line ── */}
        <div className="flex items-center justify-center gap-1.5 -mt-1">
          <Shield size={11} className="text-gray-300" />
          <p className="text-[11px] text-gray-400 text-center">
            Opens Job Portal · No data shared with third parties
          </p>
        </div>

      </div>
    </div>
  );
};

export default JobMatchTab;
