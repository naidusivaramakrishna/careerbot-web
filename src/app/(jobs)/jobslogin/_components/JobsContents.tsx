"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { getSmartMatchedJobs, getJobById, getJobTitleSuggestions } from "@/api/jobsApi";
import type { MatchedJobItem, SmartMatchParams, SmartMatchResponse } from "@/api/jobsApi";
import type { FilterParams } from "./filters/filterConstants";
import { WORK_MODELS, JOB_TYPES, DATE_PRESETS } from "./filters/filterConstants";
import { toast } from "sonner";
import { getSavedJobs, getSavedJobsCount, getApplicationHistory, recordJobApplication, removeApplication } from "@/utils/jobTracking";
import { getJobId } from "@/utils/jobIdHelper";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { Zap, RotateCcw, FileX, MessageCircle, Briefcase, X } from "lucide-react";

import JobsTabs, { TabType, FilterSort } from "./JobsTabs";
import JobList from "./sidebar/JobList";
import JobDetailsInline from "./JobDetailsInline";
import Pagination from "./Pagination";
import JobsRightSidebar from "./sidebar/JobsRightSidebar";
import NancyChat from "./chat/NancyChat";
import JobSkeleton from "./JobSkeleton";
import JobsFilterSidebar from "./JobsFilterSidebar";
import { matchesJobFilters } from "./utils/jobFilterUtils";

// Common job title suggestions for autocomplete
const JOB_SUGGESTIONS = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer",
  "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer",
  "Product Manager", "Project Manager", "Scrum Master",
  "UI/UX Designer", "Graphic Designer",
  "Python Developer", "Java Developer", "React Developer", "Node.js Developer",
  "Android Developer", "iOS Developer", "Mobile Developer",
  "QA Engineer", "Test Engineer", "Automation Engineer",
  "Business Analyst", "Systems Analyst",
  "Sales Manager", "Marketing Manager", "HR Manager",
  "Cybersecurity Engineer", "Network Engineer", "Database Administrator",
  "Technical Lead", "Engineering Manager",
];

// ── "Did you apply?" pending-confirmation record ──
interface PendingApplyJob {
  id: string;
  title: string;
  company: string;
  url: string;
}

const PENDING_APPLY_KEY = "pendingApplyJob";

// ── Normalized shape used throughout the component ──
export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
  type: string;
  mode: string;
  salary: string;
  time: string;
  url: string;
  application_url: string;
  recruiter_id: string;
  matchScore: number;
  matchText: string;
  roleTrending: boolean;
  highHiring: boolean;
  description: string;
  created_at: string | null;
  posted_date: string | null;
  company_website: string;
  skills: string;
  experience: string;
  experience_level: string;
  education: string;
  source: string;
  is_applied: boolean;
  remote: boolean;
  requirements: string[];
  responsibilities: string;
  matched_skills?: string[];
  missing_skills?: string[];
  match_band?: string;
  applicant_count?: number;
  skill_score?: number;
  experience_score?: number;
  education_score?: number;
}

function str(job: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = job[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function strArr(job: Record<string, unknown>, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = job[k];
    if (Array.isArray(v)) {
      return v.filter((r): r is string => typeof r === "string" && r.trim().length > 0);
    }
  }
  return [];
}

// Extracted from normalizeJob's nested ternary chain (typescript:S3358) —
// same branching, same output for every input, just expressed as if/else.
function normalizeJobTypeLabel(jobType: string): string {
  if (!jobType) return "";
  if (jobType.includes("intern")) return "Internship";
  if (jobType.includes("contract") || jobType.includes("freelance")) return "Contract";
  if (jobType.includes("part")) return "Part-time";
  return "Full-time";
}

export function normalizeJob(job: Record<string, unknown>, matchScore = 0, matchData?: MatchedJobItem["match"]): NormalizedJob {
  const title = str(job, "title", "job_title") || "Job Title";
  const company = str(job, "company", "company_name", "organization", "about_company", "employer");
  const location = str(job, "location", "job_location", "city", "place") || "Location not specified";

  const jobType = str(job, "job_type", "type", "employment_type", "work_type", "contract_type").toLowerCase();
  const typeNorm = normalizeJobTypeLabel(jobType);

  const skills = job["skills"];
  // Extracted from a nested ternary (typescript:S3358) — same result for
  // every input as the original `typeof skills === "string" ? skills :
  // Array.isArray(skills) ? skills.join(", ") : ""`.
  let skillsStr = "";
  if (typeof skills === "string") {
    skillsStr = skills;
  } else if (Array.isArray(skills)) {
    skillsStr = (skills as string[]).join(", ");
  }

  const recruiterId = str(job, "recruiter_id");

  return {
    id: getJobId(String(job["id"] ?? ""), title, company, location),
    title,
    company,
    location,
    logo: str(job, "organization_logo", "company_logo"),
    type: typeNorm,
    mode: str(job, "work_mode", "mode"),
    salary: str(job, "salary"),
    time: "Recently",
    url: recruiterId ? "" : str(job, "url", "apply_url"),
    application_url: recruiterId ? "" : str(job, "application_url"),
    recruiter_id: recruiterId,
    matchScore,
    matchText: matchData ? `${Math.round(matchScore)}% match` : "Match",
    roleTrending: false,
    highHiring: false,
    description: str(job, "description", "job_description"),
    created_at: (job["created_at"] as string | null) ?? null,
    posted_date: (job["posted_date"] as string | null) ?? (job["created_at"] as string | null) ?? null,
    company_website: str(job, "company_website"),
    skills: skillsStr,
    experience: str(job, "experience_level", "experience"),
    experience_level: str(job, "experience_level"),
    education: str(job, "education", "qualification", "education_required", "min_education"),
    source: str(job, "source"),
    is_applied: !!job["is_applied"],
    remote: !!job["remote"],
    // "requirements" matches every other place this concept appears in the
    // codebase (recruiter job-post/edit-job forms, JobDescription type) —
    // "requirements_list" appears nowhere else, so it's kept only as a
    // defensive fallback in case this endpoint's payload genuinely differs.
    requirements: strArr(job, "requirements", "requirements_list"),
    responsibilities: str(job, "responsibilities"),
    matched_skills: matchData?.matched_skills,
    missing_skills: matchData?.missing_skills,
    match_band: matchData?.band,
    applicant_count: typeof job["applicants"] === "number" ? (job["applicants"] as number) : undefined,
    skill_score: matchData?.breakdown?.skills,
    experience_score: matchData?.breakdown?.experience,
    education_score: matchData?.breakdown?.education,
  };
}

/**
 * True if every word in `query` appears somewhere in the job's title/company,
 * in any order — a literal whole-phrase substring match missed real matches
 * whenever word order or extra words differed, e.g. "python full stack
 * developer" not matching a job titled "Full Stack Developer (Python)".
 * An empty/whitespace-only query matches everything.
 */
export function jobMatchesSearchQuery(job: Pick<NormalizedJob, "title" | "company">, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = `${job.title} ${job.company}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

const MATCHED_PER_PAGE = 50;

// A brand-new/just-updated profile can have /jobs/scored answer in a couple
// of seconds with 0 jobs while the profile analysis it scores against is
// still finishing server-side — treating that as a final "no matches" result
// shows a false-negative empty state seconds after the user updates their
// profile. Delays for the silent retry loop below (see
// fetchSmartMatchedJobs) — sums to ~92s, matching the ~1-2 minutes a
// first-time score computation is observed to need before results settle.
const MATCHED_FIRST_LOAD_RETRY_DELAYS_MS = [4000, 8000, 15000, 25000, 40000];

// Match Quality chips ("matchscore:70+", "skillscore:50+", ...) follow the
// "<N>+" label convention as salary — parse the number back out. Extracted
// to module scope (was a nested function inside matchedServerFiltersMemo)
// purely to reduce that memo's Cognitive Complexity (typescript:S3776) —
// same inputs/outputs as before.
function parseScoreChipValue(selectedFilters: string[], prefix: string): number | undefined {
  const label = selectedFilters.find((f) => f.startsWith(prefix))?.replace(prefix, "");
  const n = label ? Number.parseFloat(label.replace(/\+$/, "")) : Number.NaN;
  return Number.isNaN(n) ? undefined : n;
}

// Extracted from a nested ternary chain (typescript:S3358) — the "years:"
// chip's label is one of EXP_OPTIONS' labels in JobsFilterSidebar —
// "Fresher", "1 yr" .. "10 yrs", or "11+ yrs". Same result for every input
// as the original `yearsLabel === "Fresher" ? 0 : yearsLabel === "11+ yrs"
// ? 11 : yearsLabel ? Number.parseInt(yearsLabel, 10) : undefined`.
function computeExperienceYearsFromLabel(yearsLabel: string | undefined): number | undefined {
  if (yearsLabel === "Fresher") return 0;
  if (yearsLabel === "11+ yrs") return 11;
  if (yearsLabel) return Number.parseInt(yearsLabel, 10);
  return undefined;
}

// Toggle helpers extracted from handleFilterToggle's setSelectedFilters
// updater purely to reduce its Cognitive Complexity (typescript:S3776) —
// each returns exactly what the corresponding branch previously computed
// inline for the same (prev, filter) inputs.

// salary:/years: chips: single-select, with a distinct "Any ..." sentinel
// value that always clears the chip instead of being stored as a filter.
function toggleExclusiveFilterWithSentinel(prev: string[], filter: string, prefix: string, anySentinel: string): string[] {
  const without = prev.filter((f) => !f.startsWith(prefix));
  if (filter === anySentinel || prev.includes(filter)) return without;
  return [...without, filter];
}

// date:/Match-Quality chips: radio-style — only one value per prefix.
function toggleRadioFilter(prev: string[], filter: string, prefix: string): string[] {
  const without = prev.filter((f) => !f.startsWith(prefix));
  return prev.includes(filter) ? without : [...without, filter];
}

// location:/education: chips (and the default case): plain multi-select toggle.
function toggleSimpleFilter(prev: string[], filter: string): string[] {
  return prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter];
}

// Extracted from fetchSmartMatchedJobs's try body purely to reduce that
// function's Cognitive Complexity (typescript:S3776) — identical requests,
// identical zero-results fallback behavior, and identical thrown errors
// (now TypeError, since these are response-shape type checks, per
// typescript:S7786) as before.
async function fetchScoredJobsWithFallback(
  page: number,
  matchedServerFilters: SmartMatchParams,
  forceRefresh: boolean
): Promise<{ data: SmartMatchResponse; fellBackToUnfiltered: boolean }> {
  let data = await getSmartMatchedJobs({
    limit: MATCHED_PER_PAGE,
    skip: (page - 1) * MATCHED_PER_PAGE,
    ...matchedServerFilters,
    ...(forceRefresh && { force_refresh: true }),
  });
  // A malformed/unexpected response shape (e.g. the backend contract for
  // this endpoint drifts) must not be silently treated the same as "0
  // scored jobs" — that would show a misleading empty state instead of
  // surfacing the failure.
  if (!Array.isArray(data.jobs)) {
    throw new TypeError("Unexpected Smart Match response shape");
  }
  // The filter values are UI labels lowercased onto the wire (see
  // matchedServerFilters). If /jobs/scored expects a different vocabulary
  // for any of them, it answers 0 rows and the tab would render empty —
  // strictly worse than the client-side narrowing this replaced. Retry once
  // without the filters and let matchesJobFilters narrow the result
  // instead, so an enum mismatch degrades to the old behaviour rather than
  // an empty tab.
  const usedServerFilters = Object.keys(matchedServerFilters).length > 0;
  let fellBackToUnfiltered = false;
  if (data.jobs.length === 0 && usedServerFilters) {
    data = await getSmartMatchedJobs({
      limit: MATCHED_PER_PAGE,
      skip: (page - 1) * MATCHED_PER_PAGE,
      ...(forceRefresh && { force_refresh: true }),
    });
    if (!Array.isArray(data.jobs)) {
      throw new TypeError("Unexpected Smart Match response shape");
    }
    fellBackToUnfiltered = true;
  }
  return { data, fellBackToUnfiltered };
}

// Shared "nothing here" illustration for every empty state below (Saved,
// Applied, Smart Match, and the generic search/filter-narrowed case) — a
// friendly face-on-a-tray drawing instead of a plain icon-on-a-tinted-square,
// with `accent` carrying the same per-tab color the old icons used.
function EmptyStateIllustration({ accent }: { readonly accent: string }) {
  return (
    <svg width="88" height="76" viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
      <path d="M8 34 L24 34 L34 50 L62 50 L72 34 L88 34 L88 74 L8 74 Z" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="white" />
      <path d="M32 10 C32 2 40 -2 48 4 C56 -2 64 2 64 10 L64 28 C64 34 58 38 48 38 C38 38 32 34 32 28 Z" fill={accent} />
      <line x1="40" y1="18" x2="45" y2="18" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="51" y1="18" x2="56" y2="18" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 27 Q48 23 54 27" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function JobsContents() {
  const searchParams = useSearchParams();
  const { userId } = useCurrentUserId();

  // ── Filtered results (derived per active tab — see the effect below) ──
  const [filteredJobs, setFilteredJobs] = useState<NormalizedJob[]>([]);

  // ── Search & filter — searchQuery filters client-side within whichever
  //    tab is active (Smart Match/Saved/Applied), see the filter effect ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("matched");
  const [filterSort, setFilterSort] = useState<FilterSort>("most-recent");

  // ── Tab counters ──
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [appliedJobsCount, setAppliedJobsCount] = useState(0);

  // ── Saved tab — fetched by id so it works regardless of which tab/page a job was saved from ──
  const [savedJobsList, setSavedJobsList] = useState<NormalizedJob[]>([]);
  const [savedJobsListLoading, setSavedJobsListLoading] = useState(false);
  // Bumped on every fetchSavedJobsList call so a superseded fetch (e.g. the
  // user unsaves/re-saves while enrichment is still in flight) can tell its
  // own result is stale and discard it instead of merging into the wrong rows.
  const savedJobsFetchTokenRef = useRef(0);

  // ── Applied tab — same fetch-by-id pattern as Saved, backed by the local application history ──
  const [appliedJobsList, setAppliedJobsList] = useState<NormalizedJob[]>([]);
  const [appliedJobsListLoading, setAppliedJobsListLoading] = useState(false);

  // ── "Did you apply?" confirmation — owned here (not the job card) so it
  //    survives the card unmounting/re-rendering while the user is away on
  //    the external job posting's tab. sessionStorage backs it too, in case
  //    this component itself remounts (route change, etc.) while away. ──
  const [pendingApplyJob, setPendingApplyJob] = useState<PendingApplyJob | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(PENDING_APPLY_KEY);
      return stored ? (JSON.parse(stored) as PendingApplyJob) : null;
    } catch {
      return null;
    }
  });
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  // ── Search autocomplete — the static JOB_SUGGESTIONS list renders
  //    instantly (zero-latency) so the dropdown never feels empty/laggy on
  //    the first keystroke, then a debounced /jobs/all lookup (the full job
  //    corpus, not just this user's ~50 loaded Smart Match jobs) fills in
  //    real, currently-posted titles on top. This only feeds the dropdown —
  //    the job results themselves still come exclusively from Smart Match. ──
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Discards a live-suggestion response superseded by a newer keystroke —
  // same out-of-order-response guard used elsewhere in this file.
  const suggestionFetchTokenRef = useRef(0);

  useEffect(() => {
    return () => {
      if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    };
  }, []);

  const handleSearchInput = (val: string) => {
    setInputValue(val);
    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    const trimmed = val.trim();
    if (trimmed.length === 0) {
      suggestionFetchTokenRef.current++;
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const staticMatches = JOB_SUGGESTIONS.filter((s) => s.toLowerCase().includes(trimmed.toLowerCase()));
    setSuggestions(staticMatches.slice(0, 8));
    setShowSuggestions(staticMatches.length > 0);

    const token = ++suggestionFetchTokenRef.current;
    suggestionDebounceRef.current = setTimeout(async () => {
      try {
        const liveTitles = await getJobTitleSuggestions(trimmed, 8);
        if (suggestionFetchTokenRef.current !== token) return;
        // Real, currently-posted titles first — they're guaranteed to
        // return results — then fill out with the generic list for extra
        // coverage the live corpus didn't have.
        const merged: string[] = [];
        const seen = new Set<string>();
        [...liveTitles, ...staticMatches].forEach((s) => {
          const key = s.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(s);
        });
        setSuggestions(merged.slice(0, 8));
        setShowSuggestions(merged.length > 0);
      } catch {
        // Network hiccup — keep the static suggestions already shown above.
      }
    }, 250);
  };

  const commitSearch = (val: string) => {
    // Cancel any debounced suggestion lookup still pending from the keystrokes
    // before this. Without it the timer fires ~250ms later, its token still
    // matches, and it re-opens the dropdown on top of the results the user has
    // just committed to -- which is the normal typing rhythm, not an edge case.
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
      suggestionDebounceRef.current = null;
    }
    suggestionFetchTokenRef.current++;
    setSearchQuery(val);
    setInputValue(val);
    setShowSuggestions(false);
    // The search box stays visible even while viewing a job's inline detail
    // panel (detailsJob) — without this, submitting a new search updated
    // searchQuery/filteredJobs behind the scenes but left the detail panel
    // on screen, so the results list never actually appeared for it.
    setDetailsJob(null);
  };

  // ── Seed search from ?q= (e.g. arriving from the homepage search bar) ──
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
      setInputValue(q);
    }

    const location = searchParams.get("location");
    const years = searchParams.get("years");
    if (location || years) {
      setSelectedFilters((prev) => {
        const withoutLocationAndYears = prev.filter(
          (f) => !f.startsWith("location:") && !f.startsWith("years:")
        );
        const additions: string[] = [];
        if (location) additions.push(`location:${location}`);
        if (years) additions.push(`years:${years}`);
        return [...withoutLocationAndYears, ...additions];
      });
    }
    // Only react when the `q`/`location`/`years` params themselves change, not on every render
  }, [searchParams]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Nancy chat ──
  const [openChat, setOpenChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);

  // ── Inline job details — replaces the filter bar + job list (not a modal,
  // not a route) when a job title is clicked; "Back" clears it. ──
  const [detailsJob, setDetailsJob] = useState<NormalizedJob | null>(null);

  // ── Smart match ──
  // The subset of active filters that map onto /jobs/scored's own query
  // params — only pushed server-side when unambiguous (the backend takes a
  // single string per field, not a list) and semantically identical to what
  // the filter means here. The Experience pill IS the candidate's own years
  // (matchesExperience narrows on "job's minimum requirement <= this many
  // years", same semantics as the backend's experience_years) so it maps
  // straight onto that param — without this, selecting it only ever
  // filtered whichever ~50-job page happened to be loaded, so paginating
  // reshuffled the very set the filter was supposed to be narrowing, and the
  // per-option counts in the dropdown swung wildly page to page even though
  // nothing about the filter itself had changed. Education has no
  // server-side equivalent on this endpoint. Everything here still gets
  // re-applied client-side afterward via matchesJobFilters, same as before,
  // so this can only narrow the search further (to the whole pool) — never
  // behave worse than today.
  const matchedServerFiltersMemo = useMemo(() => {
    const workModels = WORK_MODELS.filter((m) => selectedFilters.includes(m));
    const jobTypes = JOB_TYPES.filter((t) => selectedFilters.includes(t));
    const locations = selectedFilters
      .filter((f) => f.startsWith("location:"))
      .map((f) => f.replace("location:", ""));
    const dateLabel = selectedFilters.find((f) => f.startsWith("date:"))?.replace("date:", "");
    const datePreset = DATE_PRESETS.find((p) => p.label === dateLabel);
    // The "salary:" chip's label is always "<N> LPA+" (set by the salary
    // slider in JobsFilterSidebar, both the top pill and the "All Filters"
    // drawer) — parse the LPA figure straight out of it rather than
    // threading a second, separate value through onFilterChange.
    const salaryLabel = selectedFilters.find((f) => f.startsWith("salary:"))?.replace("salary:", "");
    const salaryLpa = salaryLabel ? Number.parseFloat(/^(\d+(?:\.\d+)?)\s*LPA\+/i.exec(salaryLabel)?.[1] ?? "") : Number.NaN;
    const minScore = parseScoreChipValue(selectedFilters, "matchscore:");
    const minSkillScore = parseScoreChipValue(selectedFilters, "skillscore:");
    const minExperienceScore = parseScoreChipValue(selectedFilters, "expscore:");
    const minEducationScore = parseScoreChipValue(selectedFilters, "eduscore:");
    const yearsLabel = selectedFilters.find((f) => f.startsWith("years:"))?.replace("years:", "");
    const experienceYears = computeExperienceYearsFromLabel(yearsLabel);

    const params: {
      mode?: string; job_type?: string; location?: string; posted_within_days?: number; query?: string;
      min_salary_lpa?: number; min_score?: number; min_skill_score?: number; min_experience_score?: number; min_education_score?: number;
      experience_years?: number;
    } = {};
    if (workModels.length === 1) params.mode = workModels[0].toLowerCase();
    if (jobTypes.length === 1) params.job_type = jobTypes[0].toLowerCase();
    if (locations.length === 1) params.location = locations[0];
    if (datePreset?.days) params.posted_within_days = datePreset.days;
    if (searchQuery.trim()) params.query = searchQuery.trim();
    if (experienceYears !== undefined && !Number.isNaN(experienceYears)) params.experience_years = experienceYears;
    // min_salary_lpa is best-effort on the backend (most jobs don't state a
    // parseable salary) — the existing zero-results fallback below already
    // retries without any server filters, so a low-signal facet degrades
    // gracefully instead of showing an empty tab.
    if (!Number.isNaN(salaryLpa) && salaryLpa > 0) params.min_salary_lpa = salaryLpa;
    if (minScore !== undefined) params.min_score = minScore;
    if (minSkillScore !== undefined) params.min_skill_score = minSkillScore;
    if (minExperienceScore !== undefined) params.min_experience_score = minExperienceScore;
    if (minEducationScore !== undefined) params.min_education_score = minEducationScore;
    // Serialized here rather than at the use site: this component re-renders
    // on every keystroke in the search box, and the key is only ever read as
    // an effect dependency, so re-stringifying per render is pure waste.
    return { params, key: JSON.stringify(params) };
  }, [selectedFilters, searchQuery]);
  const matchedServerFilters = matchedServerFiltersMemo.params;
  const matchedServerFiltersKey = matchedServerFiltersMemo.key;

  const [matchedJobs, setMatchedJobs] = useState<NormalizedJob[]>([]);
  const [matchedTotal, setMatchedTotal] = useState(0);
  const [matchedPage, setMatchedPage] = useState(1);
  // Starts true (not false) because "matched" is the default active tab and
  // always fetches on mount (see the tab-activation effect below) — without
  // this, the very first paint (before that effect has even run) renders
  // with matchedLoading still false and matchedJobs still empty, flashing
  // "No matched jobs found" for a frame — longer, and visibly, on a slow
  // hydration/dev build — before the fetch (and its retry loop) takes over.
  const [matchedLoading, setMatchedLoading] = useState(true);
  const [matchedFetched, setMatchedFetched] = useState(false);
  const [matchedNoResume, setMatchedNoResume] = useState(false);
  const [matchedError, setMatchedError] = useState(false);
  // True when the currently-loaded matchedJobs were already narrowed by the
  // search box server-side (via /jobs/scored's own `query` param) — see the
  // filtering effect below, which must NOT re-apply a client-side text match
  // in that case: the server's matching (title/company/location/description)
  // is broader than the client's (title/company substring, all words), so
  // re-filtering would silently drop server-confirmed matches (e.g. a job
  // titled "React Engineer" whose description mentions "frontend" — the
  // server matches it, but jobMatchesSearchQuery would not). Only false when
  // no query was sent, or the zero-results fallback below stripped it.
  const [matchedQueryAppliedServerSide, setMatchedQueryAppliedServerSide] = useState(false);
  // True when the search/filter combo returned 0 rows server-side and
  // fetchSmartMatchedJobs retried with NO filters at all — matchedJobs then
  // holds an unrelated generic top-N pool, not results for the user's actual
  // criteria. matchedTotal in that case is just this pool's raw page size
  // (e.g. exactly MATCHED_PER_PAGE), which would badly mislabel the
  // "Smart Match" tab count/pager — the count show below deliberately swaps
  // to the real, client-filtered count whenever this is true.
  const [matchedFellBackToUnfiltered, setMatchedFellBackToUnfiltered] = useState(false);
  const [matchBandFilter] = useState<"all" | "strong" | "good" | "partial" | "low">("all");
  // Discards superseded Smart Match responses — see fetchSmartMatchedJobs.
  const matchedFetchTokenRef = useRef(0);
  // Invalidate any in-flight run on unmount. The warm-up retry loop in
  // fetchSmartMatchedJobs sleeps up to ~92s between attempts and only stops
  // when this token changes, so without this it kept calling /jobs/scored
  // after the user had left the page.
  useEffect(() => {
    const tokenRef = matchedFetchTokenRef;
    return () => {
      tokenRef.current++;
    };
  }, []);

  // ── Sort helper ──
  const sortJobs = useCallback((list: NormalizedJob[], sort: FilterSort): NormalizedJob[] => {
    const copy = [...list];
    if (sort === "recommended" || sort === "top-matched") {
      return copy.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
    // most-recent
    return copy.sort((a, b) => {
      const da = new Date(a.created_at || a.posted_date || 0).getTime();
      const db = new Date(b.created_at || b.posted_date || 0).getTime();
      return db - da;
    });
  }, []);

  // ── Filter change handler — required by JobsFilterSidebar's salary-range
  //    control, but actual salary filtering runs through the "salary:" chip
  //    (selectedFilters) via matchesJobFilters, so there's nothing to store. ──
  const handleFilterChange = useCallback((_filters: FilterParams) => {}, []);

  // ── Fetch SmartMatch jobs (lazy — only when tab first activated; paginated) ──
  // bypassGuard and forceRefresh are deliberately separate: bypassGuard only
  // skips the "already fetched this exact page" no-op check below (needed
  // whenever the underlying query changed but page/matchedPage didn't, e.g.
  // a filter change while still on page 1) — it must NOT imply force_refresh,
  // which bypasses the backend's own scored-results cache and is reserved
  // for the explicit "Retry Smart Match" button. Filter/search changes hit a
  // different cache entry on the backend already (keyed by the query itself)
  // so they never need to pay for an uncached re-score.
  const fetchSmartMatchedJobs = useCallback(async (page = 1, options?: { bypassGuard?: boolean; forceRefresh?: boolean }) => {
    const { bypassGuard = false, forceRefresh = false } = options ?? {};
    if (matchedFetched && page === matchedPage && !bypassGuard) return;
    // Monotonic run token — same pattern as savedJobsFetchTokenRef above.
    // Filter changes now dispatch a fetch each time (see the effect below), so
    // two in quick succession can resolve out of order and let the slower,
    // older response overwrite the newer one. Nothing self-corrects afterward,
    // because the filters-key ref is already advanced.
    const token = ++matchedFetchTokenRef.current;
    setMatchedLoading(true);
    setMatchedNoResume(false);
    setMatchedError(false);

    // Only the plain, unfiltered first page qualifies for the warm-up retry
    // loop below — a 0-result response to a filtered/paginated request is
    // either a real answer already (fetchScoredJobsWithFallback retries once
    // server-side without filters) or bound by pagination, neither of which
    // improves by waiting.
    const eligibleForWarmupRetry = page === 1 && Object.keys(matchedServerFilters).length === 0;
    let attempt = 0;
    let useForceRefresh = forceRefresh;

    for (;;) {
      try {
        const { data, fellBackToUnfiltered } = await fetchScoredJobsWithFallback(page, matchedServerFilters, useForceRefresh);
        if (matchedFetchTokenRef.current !== token) return;
        const normalized = data.jobs.map((item) =>
          normalizeJob(item.job, item.match.score, item.match)
        );

        if (normalized.length === 0 && eligibleForWarmupRetry && attempt < MATCHED_FIRST_LOAD_RETRY_DELAYS_MS.length) {
          // Silently retry. matchedLoading and matchedFetched are left
          // untouched so the caller keeps showing the "matching in progress"
          // spinner throughout. The retries never send force_refresh: that
          // flag is reserved for the explicit "Retry Smart Match" button (see
          // above). careerbot-api's GET /jobs/scored does not read it today
          // anyway; its scored-results cache key includes the profile
          // version, so a plain retry sees a re-versioned profile.
          const delay = MATCHED_FIRST_LOAD_RETRY_DELAYS_MS[attempt];
          attempt++;
          useForceRefresh = false;
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (matchedFetchTokenRef.current !== token) return;
          continue;
        }

        setMatchedJobs(normalized);
        // After a fallback, data.total counts the WHOLE unfiltered pool while
        // the list rendered is this page narrowed client-side — driving the
        // pager off it would advertise pages that are empty once narrowed.
        // Size it to what's actually on this page instead.
        setMatchedTotal(fellBackToUnfiltered ? normalized.length : (data.total ?? normalized.length));
        setMatchedQueryAppliedServerSide(!!matchedServerFilters.query && !fellBackToUnfiltered);
        setMatchedFellBackToUnfiltered(fellBackToUnfiltered);
        setMatchedPage(page);
        setMatchedFetched(true);
        setMatchedNoResume(false);
      } catch (err: unknown) {
        if (matchedFetchTokenRef.current !== token) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          // No resume on file is a terminal state — cache it so we don't refetch.
          setMatchedNoResume(true);
          setMatchedFetched(true);
        } else {
          // Transient failure — leave matchedFetched false so the next tab
          // activation retries instead of caching the error. matchedError
          // tracks this separately so the empty state can show a Retry
          // button immediately instead of only after the user leaves and
          // re-enters this tab (matchedFetched alone doesn't change here).
          setMatchedError(true);
          toast.error("Could not load Smart Match jobs. Please try again later.");
        }
      }
      break;
    }
    // Only the newest run owns the spinner — a superseded one clearing it
    // would hide the fact that a fresher fetch is still in flight.
    if (matchedFetchTokenRef.current === token) setMatchedLoading(false);
  }, [matchedFetched, matchedPage, matchedServerFilters]);

  // ── Fetch full details for saved jobs by id — works regardless of which
  //    tab/page a job was originally saved from, unlike filtering the
  //    currently-loaded "All Jobs"/"Smart Match" arrays. Same placeholder-
  //    then-enrich pattern as fetchAppliedJobsList: many saved jobs (any
  //    aggregated/external listing without a real backend id — see
  //    getJobId's composite-* fallback in jobIdHelper.ts) will never resolve
  //    through getJobById, since that composite id was never stored
  //    backend-side. Falling back to null on a failed lookup would silently
  //    drop those jobs from the list even though they're genuinely saved. ──
  const fetchSavedJobsList = useCallback(async () => {
    const token = ++savedJobsFetchTokenRef.current;
    const saved = getSavedJobs(userId);
    // Re-derive the badge from the same read so it can never drift from the
    // list actually shown here, even if some other path missed a save/unsave.
    setSavedJobsCount(saved.length);
    if (saved.length === 0) {
      setSavedJobsList([]);
      return;
    }

    const placeholders = saved.map((job) =>
      normalizeJob({
        id: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        created_at: job.savedAt,
      })
    );
    setSavedJobsList(placeholders);

    setSavedJobsListLoading(true);
    try {
      const enriched = await Promise.all(
        saved.map(async (job) => {
          try {
            const res = await getJobById(job.jobId);
            return res.data ? normalizeJob(res.data as unknown as Record<string, unknown>) : null;
          } catch {
            return null;
          }
        })
      );
      // A concurrent unsave/re-save (handleSaveToggle) or another
      // fetchSavedJobsList call can change the saved list's contents/length
      // while these awaits are in flight. Bail if a newer fetch has since
      // superseded this one, and key the merge by id rather than index —
      // otherwise a mid-flight unsave shifts prev's rows out from under this
      // array and enriched[i] lands on the wrong job (e.g. B receiving A's
      // title/company after A was unsaved).
      if (savedJobsFetchTokenRef.current !== token) return;
      const byId = new Map(saved.map((job, i) => [job.jobId, enriched[i]]));
      setSavedJobsList((prev) => prev.map((job) => byId.get(job.id) ?? job));
    } finally {
      if (savedJobsFetchTokenRef.current === token) setSavedJobsListLoading(false);
    }
  }, [userId]);

  // ── Applied tab — fetched by id from the local application history, same
  //    reasoning as Saved: works regardless of which tab/page a job was
  //    applied to from. ──
  const fetchAppliedJobsList = useCallback(async () => {
    const history = getApplicationHistory(userId);
    setAppliedJobsCount(history.length);
    if (history.length === 0) {
      setAppliedJobsList([]);
      return;
    }

    // Show what's recorded locally right away — no network dependency on the
    // critical path, so a backend lookup failure can never make the tab look
    // empty. normalizeJob() only reads plain fields, so this can't throw.
    const placeholders = history.map((app) =>
      normalizeJob({
        id: app.jobId,
        title: app.title,
        company: app.company,
        url: app.url,
        created_at: app.appliedAt,
        is_applied: true,
      })
    );
    setAppliedJobsList(placeholders);

    // Best-effort enrichment with full job details in the background.
    setAppliedJobsListLoading(true);
    try {
      const enriched = await Promise.all(
        history.map(async (app) => {
          try {
            const res = await getJobById(app.jobId);
            return res.data ? normalizeJob(res.data as unknown as Record<string, unknown>) : null;
          } catch {
            return null;
          }
        })
      );
      setAppliedJobsList((prev) =>
        prev.map((job, i) => enriched[i] ?? job)
      );
    } catch {
      // Enrichment failed entirely — placeholders set above still stand.
    } finally {
      setAppliedJobsListLoading(false);
    }
  }, [userId]);

  // ── "Did you apply?" — mark intent when Apply Now is clicked on an
  //    external job, then ask for confirmation once the user comes back to
  //    this tab (Page Visibility API works across new-tab/new-window opens,
  //    unlike window focus/blur). Persisted to sessionStorage so it survives
  //    this component remounting while the user is away. ──
  const markPendingApply = useCallback((job: PendingApplyJob) => {
    setPendingApplyJob(job);
    try {
      sessionStorage.setItem(PENDING_APPLY_KEY, JSON.stringify(job));
    } catch { /* ignore quota/availability errors */ }
  }, []);

  const clearPendingApply = useCallback(() => {
    setPendingApplyJob(null);
    setShowApplyConfirm(false);
    try {
      sessionStorage.removeItem(PENDING_APPLY_KEY);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const showConfirmationOnReturn = () => {
      if (!document.hidden && pendingApplyJob) {
        setShowApplyConfirm(true);
      }
    };
    document.addEventListener("visibilitychange", showConfirmationOnReturn);
    // Chrome does not always mark the original document hidden when a
    // target=_blank application page opens (for example, when it opens in the
    // background). Window focus reliably covers the return path in that case.
    window.addEventListener("focus", showConfirmationOnReturn);
    return () => {
      document.removeEventListener("visibilitychange", showConfirmationOnReturn);
      window.removeEventListener("focus", showConfirmationOnReturn);
    };
  }, [pendingApplyJob]);

  // Covers the case where this component remounts (e.g. a route change)
  // while a pending apply already exists AND the tab is already visible —
  // no visibilitychange event fires in that case since there's no transition.
  useEffect(() => {
    if (pendingApplyJob && !document.hidden) {
      setShowApplyConfirm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmApplied = () => {
    if (!pendingApplyJob) return;
    recordJobApplication(pendingApplyJob.id, pendingApplyJob.title, pendingApplyJob.company, pendingApplyJob.url, userId);
    toast.success("Marked as applied!");
    clearPendingApply();
    fetchAppliedJobsList();
  };

  // ── Saved count is a local (no-network) read — refresh on mount so the
  //    tab badge is accurate without requiring a visit to the Saved tab. ──
  useEffect(() => {
    setSavedJobsCount(getSavedJobsCount(userId));
  }, [userId]);

  // ── Save/unsave from any job card (Smart Match, Saved, or Applied tab —
  //    JobCard is shared across all three) — updates the tab badge and, if
  //    a job is unsaved while the Saved tab's list is already loaded, drops
  //    it from that list immediately instead of waiting for the next time
  //    the Saved tab is (re)activated. ──
  const handleSaveToggle = useCallback((jobId: string, saved: boolean) => {
    if (saved) {
      // localStorage is updated synchronously by JobCard before this callback,
      // so read the new record straight from the source of truth. Append just
      // this one placeholder and enrich only this one id — calling the full
      // fetchSavedJobsList() here would re-run getJobById for every already-
      // saved job (potentially dozens) just to add one, including while the
      // Saved tab isn't even the active/rendered tab. The full fetch still
      // runs when the Saved tab is actually (re)activated, below.
      // Count is derived from the persisted list, and only after confirming
      // the record is actually there — toggleJobSaved swallows write failures
      // (quota, private mode), so an unconditional increment would leave the
      // badge counting a job that was never saved.
      const savedList = getSavedJobs(userId);
      const savedRecord = savedList.find((job) => job.jobId === jobId);
      if (!savedRecord) return;
      setSavedJobsCount(savedList.length);

      const placeholder = normalizeJob({
        id: savedRecord.jobId,
        title: savedRecord.title,
        company: savedRecord.company,
        location: savedRecord.location,
        type: savedRecord.type,
        created_at: savedRecord.savedAt,
      });
      setSavedJobsList((prev) => (prev.some((job) => job.id === jobId) ? prev : [...prev, placeholder]));

      (async () => {
        try {
          const res = await getJobById(jobId);
          if (res.data) {
            const full = normalizeJob(res.data as unknown as Record<string, unknown>);
            setSavedJobsList((prev) => prev.map((job) => (job.id === jobId ? full : job)));
          }
        } catch {
          // Keep the placeholder — same reasoning as fetchSavedJobsList: a
          // failed lookup shouldn't drop a job that's genuinely saved.
        }
      })();
    } else {
      // Symmetric with the save branch above: toggleJobSaved swallows write
      // failures and returns false either way, so an unconditional decrement
      // would drop the badge for a job still persisted in storage — which
      // then reappears on the next tab activation. Read the real list back.
      const stillSaved = getSavedJobs(userId);
      setSavedJobsCount(stillSaved.length);
      if (!stillSaved.some((job) => job.jobId === jobId)) {
        setSavedJobsList((prev) => prev.filter((job) => job.id !== jobId));
      }
    }
  }, [userId]);

  // ── "Already Applied" quick-mark from any job card's menu (JobCard already
  //    wrote the record via recordJobApplication before calling this) — same
  //    reasoning as handleSaveToggle: bump the badge and, if the Applied
  //    tab's list is already loaded, append a placeholder immediately instead
  //    of waiting for the next time the Applied tab is (re)activated. ──
  const handleAppliedToggle = useCallback((jobId: string) => {
    // recordJobApplication de-dupes (a repeat "Already Applied" click on a
    // job that's already recorded is a no-op there), so derive the count
    // from the actual history length rather than unconditionally incrementing
    // — an unconditional bump would overcount on a repeat click.
    const history = getApplicationHistory(userId);
    setAppliedJobsCount(history.length);
    const record = history.find((app) => app.jobId === jobId);
    if (!record) return;

    const placeholder = normalizeJob({
      id: record.jobId,
      title: record.title,
      company: record.company,
      url: record.url,
      created_at: record.appliedAt,
      is_applied: true,
    });
    setAppliedJobsList((prev) => (prev.some((job) => job.id === jobId) ? prev : [...prev, placeholder]));

    (async () => {
      try {
        const res = await getJobById(jobId);
        if (res.data) {
          const full = normalizeJob(res.data as unknown as Record<string, unknown>);
          setAppliedJobsList((prev) => prev.map((job) => (job.id === jobId ? full : job)));
        }
      } catch {
        // Keep the placeholder — same reasoning as fetchAppliedJobsList: a
        // failed lookup shouldn't drop a job that's genuinely applied.
      }
    })();
  }, [userId]);

  // ── Permanently remove an entry from the Applied tab — deletes the
  //    underlying application record (unlike the Smart Match "Not
  //    interested" dismiss, which only ever hides a card for the current
  //    session) so it can't reappear on the next fetch. ──
  const handleRemoveApplication = useCallback((jobId: string) => {
    removeApplication(jobId, userId);
    // Derived from storage, not decremented — removeApplication swallows its
    // write failures exactly like toggleJobSaved does, so a blind decrement
    // would drop the badge for a record still on disk (which then reappears
    // on the next Applied-tab activation). Same as the two sibling handlers.
    const remaining = getApplicationHistory(userId);
    setAppliedJobsCount(remaining.length);
    if (!remaining.some((app) => app.jobId === jobId)) {
      setAppliedJobsList((prev) => prev.filter((job) => job.id !== jobId));
    }
  }, [userId]);

  // ── Trigger SmartMatch fetch when tab becomes active — also covers the
  //    initial mount fetch (for the sidebar's "Top Picks") since "matched"
  //    is the default active tab. ──
  useEffect(() => {
    // Only auto-fetch on FIRST activation. Paginating updates matchedPage,
    // which recreates fetchSmartMatchedJobs (its useCallback dep), reruns this
    // effect, and would refetch page 1 — snapping the user back. The
    // matchedFetched guard prevents that while still loading on initial entry
    // and re-loading after a tab switch only when nothing is cached yet.
    if (activeTab === "matched" && !matchedFetched) {
      fetchSmartMatchedJobs();
    }
    if (activeTab === "saved") {
      fetchSavedJobsList();
    }
    if (activeTab === "applied") {
      fetchAppliedJobsList();
    }
  }, [activeTab, matchedFetched, fetchSmartMatchedJobs, fetchSavedJobsList, fetchAppliedJobsList]);

  // ── Re-fetch from the server when a server-mappable filter changes (Work
  //    Model, Job Type, Location, Date Posted, or the search box) — without
  //    this, filtering only ever narrowed whichever page was already loaded,
  //    missing matches sitting on unfetched pages. Skipped on mount (the
  //    effect above owns the first fetch). ──
  const matchedFilterMountRef = useRef(true);
  // The filter set the currently-loaded results were actually fetched with.
  // Compared (rather than just reacting to a filter change) so a filter
  // changed while another tab was active still reaches the server on the way
  // back: the tab-activation effect above only fetches when !matchedFetched,
  // so without this the request would be skipped entirely and filtering would
  // silently fall back to client-side-only narrowing of the loaded page.
  const lastFetchedFiltersKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (matchedFilterMountRef.current) {
      matchedFilterMountRef.current = false;
      lastFetchedFiltersKeyRef.current = matchedServerFiltersKey;
      return;
    }
    if (activeTab !== "matched" || !matchedFetched) return;
    if (lastFetchedFiltersKeyRef.current === matchedServerFiltersKey) return;
    lastFetchedFiltersKeyRef.current = matchedServerFiltersKey;
    fetchSmartMatchedJobs(1, { bypassGuard: true });
    // matchedServerFiltersKey (a stable serialization of matchedServerFilters)
    // is the real change signal — fetchSmartMatchedJobs is intentionally
    // omitted so it recreating for an unrelated reason (e.g. matchedPage
    // changing while paginating) doesn't also trigger a refetch here. The
    // key comparison above is what prevents a duplicate fetch when both this
    // and the tab-activation effect run in the same pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedServerFiltersKey, activeTab, matchedFetched]);

  // ── Top Picks — real recommendations, sorted by match score ──
  const topPickJobs = useMemo(
    () => [...matchedJobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 3),
    [matchedJobs]
  );

  const handleMatchedPageChange = async (page: number) => {
    const jobsScrollPanel = document.getElementById("jobs-main-scroll");

    // The jobs workspace has its own scroll container, so scrolling the
    // browser window does not move the results list. Reset it immediately
    // for loading feedback, then once more after the new page has rendered.
    jobsScrollPanel?.scrollTo({ top: 0, behavior: "smooth" });
    await fetchSmartMatchedJobs(page);
    requestAnimationFrame(() => {
      jobsScrollPanel?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  // ── Client-side filter / tab logic — searchQuery filters by title/company
  //    within whichever tab is active (there's no separate "all jobs" list
  //    to search server-side anymore). For Smart Match this only searches
  //    within the currently-loaded page of matches, not the full dataset. ──
  useEffect(() => {
    const matchesQuery = (job: NormalizedJob) => jobMatchesSearchQuery(job, searchQuery);

    // Matched tab: apply band filter + other filters
    if (activeTab === "matched") {
      let filtered = [...matchedJobs];

      // Apply match band filter
      if (matchBandFilter !== "all") {
        filtered = filtered.filter((j) => j.match_band === matchBandFilter);
      }

      if (selectedFilters.length > 0) {
        filtered = filtered.filter((job) =>
          matchesJobFilters(job, selectedFilters, { includeSource: true, includeMatchScores: true })
        );
      }
      // /jobs/scored already narrowed matchedJobs by this exact query
      // server-side (see matchedQueryAppliedServerSide) — its matching
      // spans title/company/location/description, broader than this
      // client-side title+company-only check, so re-applying it here would
      // drop jobs the server correctly matched. Only needed as a fallback
      // when no server-side query was applied (e.g. the zero-results retry
      // stripped it).
      if (!matchedQueryAppliedServerSide) {
        filtered = filtered.filter(matchesQuery);
      }

      setFilteredJobs(sortJobs(filtered, filterSort));
      return;
    }

    // Saved tab: fetched directly by id, independent of what's currently
    // loaded in Smart Match — see fetchSavedJobsList.
    if (activeTab === "saved") {
      let filtered = [...savedJobsList];
      if (selectedFilters.length > 0) {
        filtered = filtered.filter((job) =>
          matchesJobFilters(job, selectedFilters)
        );
      }
      filtered = filtered.filter(matchesQuery);
      setFilteredJobs(sortJobs(filtered, filterSort));
      return;
    }

    // Applied tab: fetched directly by id from local application history,
    // same reasoning as Saved — see fetchAppliedJobsList. created_at on
    // these placeholders holds the *application* date (for sort order)
    // until/unless background enrichment replaces it with the real posting
    // date — includeDate: false keeps "Date Posted" from silently filtering
    // by application date instead.
    let filtered = [...appliedJobsList];
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((job) =>
        matchesJobFilters(job, selectedFilters, { includeDate: false })
      );
    }
    filtered = filtered.filter(matchesQuery);
    setFilteredJobs(sortJobs(filtered, filterSort));
  }, [
    matchedJobs,
    matchedQueryAppliedServerSide,
    savedJobsList,
    appliedJobsList,
    matchBandFilter,
    searchQuery,
    selectedFilters,
    activeTab,
    filterSort,
    sortJobs,
  ]);

  // ── Filter toggle ──
  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) => {
      if (filter.startsWith("salary:")) {
        return toggleExclusiveFilterWithSentinel(prev, filter, "salary:", "salary:Any salary");
      }
      if (filter.startsWith("years:")) {
        return toggleExclusiveFilterWithSentinel(prev, filter, "years:", "years:Any requirements");
      }
      if (filter.startsWith("location:") || filter.startsWith("education:")) {
        return toggleSimpleFilter(prev, filter);
      }
      // date: is radio-style (only one at a time)
      if (filter.startsWith("date:")) {
        return toggleRadioFilter(prev, filter, "date:");
      }
      // Match Quality chips (matchscore:/skillscore:/expscore:/eduscore:) are
      // radio-style per component, same as date: above.
      const scorePrefix = ["matchscore:", "skillscore:", "expscore:", "eduscore:"].find((p) => filter.startsWith(p));
      if (scorePrefix) {
        return toggleRadioFilter(prev, filter, scorePrefix);
      }
      return toggleSimpleFilter(prev, filter);
    });
  };

  // ── Derived values ──
  const isMatchedTab = activeTab === "matched";
  const isSavedTab = activeTab === "saved";
  // Extracted from a nested ternary (typescript:S3358) — same value for
  // every combination of isMatchedTab/isSavedTab as before.
  let displayLoading: boolean;
  if (isMatchedTab) {
    displayLoading = matchedLoading;
  } else if (isSavedTab) {
    displayLoading = savedJobsListLoading;
  } else {
    displayLoading = appliedJobsListLoading;
  }
  // After a fallback, matchedTotal is just the raw unfiltered page's size
  // (see matchedFellBackToUnfiltered) — not how many of those actually match
  // the user's search/filters. filteredJobs.length is the honest number
  // there (e.g. 0, matching what's actually rendered below).
  const matchedCount = matchedFellBackToUnfiltered ? filteredJobs.length : matchedTotal;
  const matchedTotalPages = Math.max(1, Math.ceil(matchedCount / MATCHED_PER_PAGE));
  // The top-bar "N results" count next to the clear-X must read as the true
  // total, not "how many happen to be on this loaded page" — Smart Match is
  // fetched MATCHED_PER_PAGE (50) rows at a time, so filteredJobs.length there
  // is just this page's count after client-side narrowing. matchedCount
  // already carries the honest total for that tab (see above); Saved/Applied
  // load their full list up front, so filteredJobs.length IS the true total there.
  const resultsHeaderCount = isMatchedTab ? matchedCount : filteredJobs.length;
  // True when Smart Match has real results loaded but the active search/
  // filters narrowed them to zero — as opposed to Smart Match genuinely
  // having no matches. Search only covers the currently-loaded page of
  // matches, so this case needs its own, honest copy (see empty state below).
  const matchedSearchNarrowed =
    isMatchedTab && !matchedNoResume && matchedJobs.length > 0 && !!(searchQuery || selectedFilters.length > 0);

  // Extracted from a nested ternary (typescript:S3358) — same title text for
  // every combination of searchQuery/isMatchedTab/isSavedTab as before.
  let pageTitle: string;
  if (searchQuery) {
    pageTitle = `Results for "${searchQuery}"`;
  } else if (isMatchedTab) {
    pageTitle = "Smart Match Jobs";
  } else if (isSavedTab) {
    pageTitle = "Saved Jobs";
  } else {
    pageTitle = "Applied Jobs";
  }

  // Extracted from a nested ternary (typescript:S3358) — same list for every
  // combination of isMatchedTab/isSavedTab as before.
  let activeTabJobs: NormalizedJob[];
  if (isMatchedTab) {
    activeTabJobs = matchedJobs;
  } else if (isSavedTab) {
    activeTabJobs = savedJobsList;
  } else {
    activeTabJobs = appliedJobsList;
  }

  // ── Empty-state icon/title/description — depends on activeTab, plus (for
  //    the matched tab specifically) *why* Smart Match is empty. Extracted
  //    from several nested ternary chains (typescript:S3358) and a nested
  //    template literal (typescript:S4624) into plain if/else, computing the
  //    exact same value for every combination of inputs as before. Computed
  //    unconditionally here (cheap, no side effects) even though it's only
  //    rendered in the filteredJobs.length === 0 branch below. ──
  // Accent for the empty-state illustration's face — keeps a tab-specific
  // cue (same colors as the old per-tab icons) without needing a different
  // icon per tab.
  let emptyStateAccent: string;
  if (activeTab === "saved") {
    emptyStateAccent = "#fbbf24";
  } else if (activeTab === "applied") {
    emptyStateAccent = "#34d399";
  } else if (activeTab === "matched") {
    emptyStateAccent = "#4F46E5";
  } else {
    emptyStateAccent = "#94a3b8";
  }

  let matchedEmptyTitle: string;
  let matchedEmptyDescription: string;
  if (matchedNoResume) {
    matchedEmptyTitle = "Resume required for Smart Match";
    matchedEmptyDescription = "Smart Match analyses your resume to score every job for you. Go to Profile → Resume tab to upload your resume.";
  } else if (matchedError) {
    matchedEmptyTitle = "Couldn't load Smart Match";
    matchedEmptyDescription = "Something went wrong loading your matches. Please try again.";
  } else if (matchedSearchNarrowed) {
    matchedEmptyTitle = "No matches in your loaded results";
    // Nested template literal (typescript:S4624) pulled out into its own
    // variable, referenced from the outer template literal below.
    const searchQuerySuffix = searchQuery ? ` — none matched "${searchQuery}"` : "";
    matchedEmptyDescription = `Search and filters only apply to your currently loaded top ${matchedJobs.length} recommendations${searchQuerySuffix}. Clear them to see all your matches.`;
  } else {
    matchedEmptyTitle = "No matched jobs found";
    matchedEmptyDescription = "Smart Match ran but no strong matches found yet. Try clicking Retry or update your profile with more skills.";
  }

  let emptyStateTitle: string;
  let emptyStateDescription: string;
  if (activeTab === "saved") {
    emptyStateTitle = "No saved jobs yet";
    emptyStateDescription = "Save jobs you like and find them all here.";
  } else if (activeTab === "applied") {
    emptyStateTitle = "No applications yet";
    emptyStateDescription = "Jobs you apply to will show up here so you can track your pipeline.";
  } else if (activeTab === "matched") {
    emptyStateTitle = matchedEmptyTitle;
    emptyStateDescription = matchedEmptyDescription;
  } else {
    emptyStateTitle = "No results found";
    emptyStateDescription = "Try adjusting your search or filters to find more jobs.";
  }

  return (
    <div className="jobs-workspace flex h-full w-full max-w-full min-w-0 items-stretch gap-4 overflow-hidden bg-white">
      {/* CENTER PANEL — scrolls internally so the right sidebar never moves */}
      <main id="jobs-main-scroll" className="h-full min-w-0 flex-1 overflow-y-auto border border-slate-200/80 bg-white shadow-[0_14px_44px_rgba(15,23,42,0.06)]">
        {/* RESULTS VIEW */}

        
        <div>
            {/* TOP BAR */}
            <div className="jobs-page-topbar flex flex-col gap-4 border-b border-slate-200/80 bg-white px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Search and/or filters active — clicking the X resets both
                        back to the full unfiltered list. searchQuery drives the
                        server-side Smart Match query and the client-side
                        Saved/Applied filtering; selectedFilters drives the pill
                        row above. No page refresh needed for either. */}
                    {(searchQuery || selectedFilters.length > 0) && (
                      <button
                        type="button"
                        onClick={() => { commitSearch(""); setSelectedFilters([]); }}
                        aria-label="Clear search and filters"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X size={18} />
                      </button>
                    )}
                    <h1 className="min-w-0 truncate text-[26px] font-extrabold leading-tight text-slate-950">
                      {searchQuery || selectedFilters.length > 0
                        ? `${resultsHeaderCount} results${searchQuery ? ` for "${searchQuery}"` : ""}`
                        : pageTitle}
                    </h1>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#4F46E5]/15 bg-[#eef3ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#4F46E5] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse shrink-0" />{" "}
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Search input with autocomplete + button */}
              <div ref={searchRef} className="relative flex w-full items-center gap-2 lg:w-auto lg:shrink-0">
                <div className="relative min-w-0 flex-1 lg:flex-none">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => inputValue.trim() && setShowSuggestions(suggestions.length > 0)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitSearch(inputValue); }}
                    placeholder="Search by title or company"
                    className="jobs-search-input w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-[13px] text-slate-700 shadow-sm placeholder:text-slate-400 transition-all focus:border-[#4F46E5]/45 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/10 lg:w-[min(440px,36vw)]"
                  />
                  {/* Autocomplete dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {suggestions.map((s) => {
                        const idx = s.toLowerCase().indexOf(inputValue.toLowerCase());
                        return (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={() => commitSearch(s)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-[#f0f4ff]"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <span>
                              {idx >= 0 ? (
                                <>
                                  {s.slice(0, idx)}
                                  <span className="font-bold text-[#4F46E5]">{s.slice(idx, idx + inputValue.length)}</span>
                                  {s.slice(idx + inputValue.length)}
                                </>
                              ) : s}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => commitSearch(inputValue)}
                  className="jobs-search-button flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#4F46E5] px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(79,70,229,0.22)] transition-all hover:bg-[#4338CA] hover:shadow-[0_16px_36px_rgba(79,70,229,0.30)] active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>

              <div className="px-5 sm:px-6">
              {detailsJob ? (
                <JobDetailsInline
                  job={detailsJob}
                  onBack={() => setDetailsJob(null)}
                  onSaveToggle={(saved) => handleSaveToggle(detailsJob.id, saved)}
                  onApplyClick={() =>
                    markPendingApply({
                      id: detailsJob.id,
                      title: detailsJob.title,
                      company: detailsJob.company,
                      url: detailsJob.url || detailsJob.application_url || "",
                    })
                  }
                />
              ) : (
                <>
              {/* STICKY FILTER + TABS BAR */}
              <div className="jobs-controls sticky top-0 z-30 -mx-5 border-b border-slate-200/80 bg-white px-5 pb-0 sm:-mx-6 sm:px-6">
                <JobsFilterSidebar
                  selectedFilters={selectedFilters}
                  onFilterToggle={handleFilterToggle}
                  onFilterChange={handleFilterChange}
                  jobs={activeTabJobs}
                />

                <JobsTabs
                  activeTab={activeTab}
                  onTabChange={(tab) => { setActiveTab(tab); }}
                  savedCount={savedJobsCount}
                  appliedCount={appliedJobsCount}
                  matchedCount={matchedCount}
                  filterSort={filterSort}
                  onFilterSortChange={setFilterSort}
                />
              </div>

              {/* JOB LIST */}
              <div className="mt-4 pb-10">
                {displayLoading ? (
                  isMatchedTab && !matchedFetched ? (
                    // First-ever Smart Match computation for this profile has
                    // no cache to fall back on (see cache_hit on
                    // SmartMatchResponse) and can take up to ~2 minutes — a
                    // bare skeleton with no messaging reads as broken/stuck
                    // well before that. Subsequent loads (pagination, filter
                    // changes, Retry) usually resolve fast, so they keep the
                    // lighter skeleton below instead.
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                      <div className="relative flex h-14 w-14 items-center justify-center">
                        <span className="absolute inset-0 rounded-full border-4 border-[#4F46E5]/15" />
                        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#4F46E5]" />
                        <Zap size={20} className="text-[#4F46E5]" />
                      </div>
                      <h3 className="mt-5 text-[16px] font-bold text-gray-800">
                        Finding your best matches…
                      </h3>
                      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-gray-500">
                        We&apos;re comparing your profile against every open role to personalize your results. This can take a minute or two — no need to refresh.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <JobSkeleton key={i} />
                      ))}
                    </div>
                  )
                ) : filteredJobs.length === 0 ? (
                  <div className="flex items-center justify-center py-10 px-8">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white px-8 py-10 text-center shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
                      <EmptyStateIllustration accent={emptyStateAccent} />
                      <h3 className="mt-5 text-[16px] font-bold text-gray-800">
                        {emptyStateTitle}
                      </h3>
                      <p className="text-gray-500 text-[13px] mt-2 leading-relaxed">
                        {emptyStateDescription}
                      </p>
                      {isMatchedTab && matchedNoResume && (
                        <a
                          href="/profile"
                          className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-[#0f172a] text-white text-sm font-semibold rounded-full hover:bg-[#1e293b] transition-colors"
                        >
                          Upload Resume in Profile →
                        </a>
                      )}
                      {isMatchedTab && !matchedNoResume && (matchedFetched || matchedError) && !matchedSearchNarrowed && (
                        <button
                          type="button"
                          onClick={() => fetchSmartMatchedJobs(matchedPage, { bypassGuard: true, forceRefresh: true })}
                          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white text-sm font-semibold rounded-full hover:bg-[#1e293b] transition-colors"
                        >
                          <RotateCcw size={13} />
                          Retry Smart Match
                        </button>
                      )}
                      {(searchQuery || selectedFilters.length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setInputValue("");
                            setSelectedFilters([]);
                          }}
                          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white text-sm font-semibold rounded-full hover:bg-[#1e293b] transition-colors"
                        >
                          <FileX size={13} />
                          Clear Filters &amp; Try Again
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <JobList
                    jobs={filteredJobs}
                    onBotClick={(job) => {
                      setSelectedJob(job as unknown as NormalizedJob);
                      setOpenChat(true);
                    }}
                    onApplyClick={(job) =>
                      markPendingApply({
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        url: job.url || job.application_url || "",
                      })
                    }
                    onSaveToggle={handleSaveToggle}
                    onRemoveApplication={activeTab === "applied" ? handleRemoveApplication : undefined}
                    onAppliedToggle={handleAppliedToggle}
                    allowDismiss={isMatchedTab}
                    onViewDetails={(job) => setDetailsJob(job as unknown as NormalizedJob)}
                  />
                )}

                {/* Pagination — Smart Match only; Saved/Applied are fully-loaded personal lists */}
                {filteredJobs.length > 0 && isMatchedTab && matchedTotalPages > 1 && (
                  <Pagination
                    currentPage={matchedPage}
                    totalPages={matchedTotalPages}
                    totalItems={matchedCount}
                    itemsPerPage={MATCHED_PER_PAGE}
                    onPageChange={handleMatchedPageChange}
                  />
                )}
              </div>
                </>
              )}
            </div>
          </div>
      </main>

      {/* RIGHT SIDEBAR — fixed in place; the page itself never scrolls, only
          the job list (above) does, so this column just stays put. */}
      <aside className="jobs-intelligence-panel hidden h-full w-[360px] shrink-0 overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_14px_44px_rgba(15,23,42,0.07)] xl:flex xl:flex-col 2xl:w-[400px]">
        <JobsRightSidebar
          topPicks={topPickJobs}
          topPicksLoading={matchedLoading && !matchedFetched}
          topPicksEmptyMessage={
            matchedNoResume
              ? "Upload your resume in Profile to get personalised picks."
              : "No strong matches yet — check back soon."
          }
          onChatOpen={() => { setSelectedJob(null); setOpenChat(true); }}
          onViewAllRecommendations={() => {
            setActiveTab("matched");
            setFilterSort("recommended");
            document.getElementById("jobs-main-scroll")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </aside>

      {!openChat && (
        <button
          type="button"
          onClick={() => { setSelectedJob(null); setOpenChat(true); }}
          className="fixed bottom-5 right-5 z-30 flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-white bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.22)] transition-all hover:-translate-y-0.5 active:translate-y-0 xl:hidden"
          aria-label="Open Nancy assistant"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
            alt="Nancy AI"
            className="h-full w-full rounded-xl object-cover"
          />
          <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#4F46E5] text-white shadow-md">
            <MessageCircle size={14} />
          </span>
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        </button>
      )}

      {/* NANCY CHAT — floating popup slides over the sidebar from the right */}
      {openChat && (
        <>
          {/* Click-outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setOpenChat(false); setSelectedJob(null); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenChat(false);
                setSelectedJob(null);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close chat"
          />
          {/* Chat panel — same position/width as sidebar, slides in from right */}
          <div
            className="fixed inset-x-3 bottom-3 z-50 flex flex-col overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_26px_80px_rgba(15,23,42,0.24),0_8px_24px_rgba(15,23,42,0.12)] sm:inset-x-auto sm:bottom-5 sm:right-5"
            style={{
              width: "min(420px, calc(100vw - 24px))",
              height: "min(640px, calc(100vh - 92px))",
              animation: "slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <NancyChat
              job={selectedJob as unknown as Parameters<typeof NancyChat>[0]["job"]}
              onClose={() => {
                setOpenChat(false);
                setSelectedJob(null);
              }}
            />
          </div>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
          `}</style>
        </>
      )}

      {/* "DID YOU APPLY?" — shown when the user returns to this tab after
          clicking Apply Now on an external job posting. */}
      {showApplyConfirm && pendingApplyJob && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={clearPendingApply}
          // Keyboard dismissal is Escape, which bubbles here from any button
          // in the dialog. Enter/Space are deliberately NOT handled on the
          // backdrop or the panel: cancelling them (preventDefault) on an
          // ancestor blocks the browser from activating the focused
          // "Yes, I applied!" / "No, I didn't apply" / Close button.
          onKeyDown={(e) => {
            if (e.key === "Escape") clearPendingApply();
          }}
          role="presentation"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Did you apply?"
            className="relative w-full max-w-md rounded-bl-3xl rounded-br-3xl rounded-tr-3xl bg-white p-8 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={clearPendingApply}
              className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Briefcase size={30} className="text-slate-700" />
            </div>

            <h3 className="text-[22px] font-extrabold text-slate-950">Did you apply?</h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-slate-500">
              Let us know so we can help you track your application and refine future recommendations for you!
            </p>

            <button
              type="button"
              onClick={handleConfirmApplied}
              className="mt-5 w-full rounded-2xl bg-[#4F46E5] py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-[#4338CA]"
            >
              Yes, I applied!
            </button>
            <button
              type="button"
              onClick={clearPendingApply}
              className="mt-2.5 w-full rounded-2xl border border-slate-200 py-3.5 text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              No, I didn&apos;t apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
