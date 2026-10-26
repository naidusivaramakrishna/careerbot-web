"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Briefcase, Check, Clock, GraduationCap, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { useSavedResumeSnapshot } from "../../_hooks/useSavedResumeSnapshot";
import { getScoreBand } from "../../_lib/previewScoreRules";
import { getSmartMatchedJobs } from "@/api/jobsApi";
import logger from "@/lib/logger";
import type { MatchedJobItem, SmartMatchResponse } from "@/api/jobsApi";
import { isSectionKnownEmpty, sectionHasSavedData } from "../../_utils/sectionPayloadKeys";

const BLUE = "#1d4fa8";

const card = "rounded-xl border border-[#e3e9f2] bg-white p-4";

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

// Job records name the same field differently across sources (same fallbacks as the Jobs page).
const pick = (job: Record<string, unknown> | undefined, ...keys: string[]): string => {
  for (const key of keys) {
    const value = text(job?.[key]);
    if (value) return value;
  }
  return "";
};
const jobTitle = (job: Record<string, unknown> | undefined) => pick(job, "title", "job_title");

// The first score for a new or just-updated profile can come back empty while the server is still
// working, so an empty first answer is retried quietly (same schedule as the Jobs page).
const WARMUP_RETRY_DELAYS_MS = [4000, 8000, 15000, 25000, 40000];

// Readiness chip colours follow the score band
const READINESS_CHIP: Record<string, string> = {
  "Needs work": "bg-[#fde8e8] text-[#c0392b]",
  Fair: "bg-[#fff3d6] text-[#a8680c]",
  Good: "bg-[#e3f4e8] text-[#237a43]",
  Strong: "bg-[#e3f4e8] text-[#237a43]",
};

function MatchOnRow({ icon, title, hint, ok }: { icon: React.ReactNode; title: string; hint: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-1 py-1.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf1fb] text-[#1d4fa8]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-gray-900">{title}</span>
        <span className="block text-[12px] text-gray-500">{hint}</span>
      </span>
      {ok ? (
        <span role="img" aria-label={`${title} found in your resume`} className="flex h-5 w-5 items-center justify-center rounded-full border border-[#2e9d5c] text-[#2e9d5c]">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : (
        <span role="img" aria-label={`${title} missing from your resume`} className="h-5 w-5 rounded-full border border-dashed border-gray-300" />
      )}
    </li>
  );
}

function SummaryTile({ label, value, bar, tint }: { label: string; value: string; bar: string; tint: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl px-2 py-4 text-center ${tint}`}>
      <span className="mb-2 h-[3px] w-5 rounded-full" style={{ background: bar }} aria-hidden="true" />
      <span className="text-[13px] font-medium text-gray-900">{label}</span>
      <span className="mt-1 max-w-full truncate text-[12px] font-semibold text-gray-600">{value}</span>
    </div>
  );
}

interface JobMatchTabProps {
  /** The editor's live section list, so the filled count matches the Editor tab's Resume Progress. */
  sections?: { name: string }[];
}

const JobMatchTab: React.FC<JobMatchTabProps> = ({ sections }) => {
  const { resumeData, completionStatus, isLoadingResume, resumeSavedVersion, enhancedDataVersion, lastUpdated } = useResume();
  const savedResumeData = useSavedResumeSnapshot(resumeData, isLoadingResume, resumeSavedVersion, enhancedDataVersion);

  const [jobs, setJobs] = useState<MatchedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"ok" | "error" | "noResume">("ok");
  const [reloadKey, setReloadKey] = useState(0);
  // The server reports profile_version 0 when no matching profile has been built for this user yet.
  const [profileNotReady, setProfileNotReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setStatus("ok");
      let attempt = 0;
      for (;;) {
        try {
          const data: SmartMatchResponse = await getSmartMatchedJobs({ limit: 50 });
          if (cancelled) return;
          const list = Array.isArray(data.jobs) ? data.jobs : [];
          logger.info("[JobMatchTab] GET /jobs/scored", { returned: list.length, total: data.total, cacheHit: data.cache_hit, attempt });
          if (list.length === 0 && attempt < WARMUP_RETRY_DELAYS_MS.length) {
            await new Promise((resolve) => setTimeout(resolve, WARMUP_RETRY_DELAYS_MS[attempt]));
            attempt += 1;
            if (cancelled) return;
            continue;
          }
          setJobs(list);
          setProfileNotReady(list.length === 0 && data.profile_version === 0);
        } catch (err) {
          if (cancelled) return;
          const httpStatus = (err as { response?: { status?: number } })?.response?.status;
          setJobs([]);
          setStatus(httpStatus === 404 ? "noResume" : "error");
        }
        break;
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  // ── Resume readiness (all values come from the live resume) ──
  // Same rule as the Editor tab: a section counts as filled when it was saved or its saved data has content.
  const sectionNames = sections ? sections.map((s) => s.name) : Object.keys(completionStatus);
  const totalSections = sectionNames.length;
  const completedSections = sectionNames.filter(
    (name) => Boolean(completionStatus[name]) || sectionHasSavedData(savedResumeData as never, name),
  ).length;
  const essentialSections = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  // The chip and the bar both describe how complete the resume is, so they never disagree.
  const readinessLabel = { weak: "Needs work", fair: "Fair", good: "Good", strong: "Strong" }[getScoreBand(essentialSections)];

  // What the matching looks at, ticked from what the resume actually contains
  const data = resumeData as unknown as Record<string, unknown> & { personalInfo?: { location?: string } };
  const has = (name: string) => !isSectionKnownEmpty(data as never, name);
  const matchOn = {
    skills: has("Skills"),
    role: has("Work Experience") || has("Internships"),
    education: has("Education"),
    location: text(data.personalInfo?.location) !== "",
  };

  // The single best-scoring job
  const topMatch = useMemo(() => {
    let best: { title: string; score: number } | null = null;
    for (const item of jobs) {
      const title = jobTitle(item.job);
      const score = Math.round(item.match?.score ?? 0);
      if (title && (!best || score > best.score)) best = { title, score };
    }
    return best;
  }, [jobs]);

  const roleCount = useMemo(
    () => new Set(jobs.map((item) => jobTitle(item.job).toLowerCase()).filter(Boolean)).size,
    [jobs],
  );
  const dataStatus = loading
    ? "Checking…"
    : status === "noResume" ? "Save resume"
    : status === "error" ? "Unavailable"
    : profileNotReady ? "Profile needed"
    : "Ready";

  // When the resume was last saved ("Oct 18, 2026")
  const updatedLabel = lastUpdated instanceof Date && !Number.isNaN(lastUpdated.getTime())
    ? lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="flex min-w-0 flex-col gap-3">

      {/* ── Resume Readiness ── */}
      <section className={`${card} bg-gradient-to-br from-white to-[#f3f7fd]`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[18px] font-bold text-gray-900">Resume Readiness</h3>
          <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${READINESS_CHIP[readinessLabel]}`}>{readinessLabel}</span>
        </div>
        {updatedLabel && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-gray-600">
            <Clock size={13} className="text-gray-500" aria-hidden="true" />
            Updated {updatedLabel}
          </p>
        )}
        <div
          role="progressbar"
          aria-label="Resume Readiness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={essentialSections}
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e3e8f1]"
        >
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${essentialSections}%`, background: BLUE }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[13px] text-gray-600">
          <span>{completedSections} of {totalSections} sections filled</span>
          <span className="font-semibold text-gray-800">{essentialSections}%</span>
        </div>
      </section>

      {/* ── What we match on ── */}
      <section className={card}>
        <h3 className="text-[12px] font-bold uppercase tracking-wide text-gray-500">What we match on</h3>
        <ul className="mt-2 flex flex-col">
          <MatchOnRow icon={<Sparkles size={20} />} title="Skills & Technologies" hint="Matches your technical stack" ok={matchOn.skills} />
          <MatchOnRow icon={<Briefcase size={20} />} title="Role & Experience" hint="Aligns with your seniority" ok={matchOn.role} />
          <MatchOnRow icon={<GraduationCap size={20} />} title="Education & Domain" hint="Industry & qualification fit" ok={matchOn.education} />
          <MatchOnRow icon={<MapPin size={20} />} title="Location Preferences" hint="Remote, hybrid or on-site" ok={matchOn.location} />
        </ul>
      </section>

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="Matched Roles" value={loading ? "—" : roleCount > 0 ? String(roleCount) : "None yet"} bar={BLUE} tint="bg-[#e8f0fc]" />
        <SummaryTile label="Top Match" value={loading ? "—" : topMatch ? `${topMatch.score}%` : "None yet"} bar="#2e9d5c" tint="bg-[#e6f6ec]" />
        <SummaryTile label="Data Status" value={dataStatus} bar="#7c5cd6" tint="bg-[#eeeafb]" />
      </div>

      {/* ── Matching failed: let the user try again ── */}
      {status === "error" && !loading && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-gray-600">We couldn&apos;t load your job matches right now.</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-[#1d4fa8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1d4fa8] hover:bg-[#eef3fa]"
          >
            <RefreshCw size={11} /> Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default JobMatchTab;
