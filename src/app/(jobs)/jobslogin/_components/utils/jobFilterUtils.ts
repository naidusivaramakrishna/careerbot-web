export interface JobFilterCandidate {
  mode?: string;
  type?: string;
  experience?: string;
  salary?: string;
  location?: string;
  education?: string;
  source?: string;
  created_at?: string | null;
  posted_date?: string | null;
  matchScore?: number;
  skill_score?: number;
  experience_score?: number;
  education_score?: number;
}

export interface JobFilterOptions {
  includeSource?: boolean;
  // Set false where created_at/posted_date isn't a reliable posting date —
  // e.g. the Applied tab's local placeholders reuse created_at to hold the
  // *application* date until background enrichment replaces it (and stay
  // that way forever for any job whose full record can no longer be
  // fetched), so "Date Posted" must not run against them there.
  includeDate?: boolean;
  // Match Quality chips (overall / skill / experience / education score) mean
  // something ONLY on the Smart Match tab. Saved and Applied jobs are fetched
  // by id with no match payload, so matchScore falls to its 0 default and the
  // other three are undefined -- every chip would exclude every row and empty
  // those tabs behind a generic "no jobs" state. Off unless asked for.
  includeMatchScores?: boolean;
}

function normalizeText(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseExperienceYears(expString: string | undefined): number | null {
  if (!expString) return null;

  const nums = String(expString).match(/\d+/g);
  if (!nums || nums.length === 0) return null;

  const first = parseInt(nums[0], 10);
  return Number.isNaN(first) ? null : first;
}

function parseSalaryValue(salaryString: string | undefined): number {
  if (!salaryString) return 0;

  const cleaned = normalizeText(salaryString).replace(/[₹,]/g, "");
  const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*[lk]?\s*-\s*(\d+\.?\d*)\s*[lk]?/i);

  if (rangeMatch) {
    const maxVal = parseFloat(rangeMatch[2]);
    const unit = cleaned.match(/[lk]/i)?.[0].toLowerCase();
    if (unit === "l") return maxVal * 100000;
    if (unit === "k") return maxVal * 1000;
    return maxVal;
  }

  const lakhMatch = cleaned.match(/(\d+\.?\d*)\s*l/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;

  const kMatch = cleaned.match(/(\d+\.?\d*)\s*k/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  const numMatch = cleaned.match(/(\d+)/);
  if (numMatch) return parseFloat(numMatch[1]);

  return 0;
}

function matchesWorkModel(jobMode: string | undefined, selectedWorkModels: string[]): boolean {
  if (selectedWorkModels.length === 0) return true;

  const normalizedMode = normalizeText(jobMode || "");

  return selectedWorkModels.some((filter) => {
    const normalizedFilter = normalizeText(filter);

    if (normalizedFilter === "onsite") {
      return (
        normalizedMode.includes("on-site") ||
        normalizedMode.includes("onsite") ||
        normalizedMode.includes("office") ||
        normalizedMode === "onsite"
      );
    }

    if (normalizedFilter === "hybrid") {
      return normalizedMode.includes("hybrid");
    }

    if (normalizedFilter === "remote" || normalizedFilter === "remote anywhere in the india") {
      return normalizedMode.includes("remote");
    }

    return false;
  });
}

function matchesType(jobType: string | undefined, selectedTypeFilters: string[]): boolean {
  if (selectedTypeFilters.length === 0) return true;

  const normalizedType = normalizeText(jobType || "");

  return selectedTypeFilters.some((filter) => normalizedType === normalizeText(filter));
}

export function matchesExperience(jobExperience: string | undefined, yearsValue: string | null): boolean {
  if (!yearsValue) return true;

  const expStr = jobExperience || "";
  // parseExperienceYears reads the leading number in the job's posted range
  // ("2-15 years" → 2) — that's the job's stated MINIMUM requirement, not an
  // exact figure to match against.
  const minYears = parseExperienceYears(expStr);

  if (yearsValue === "Fresher") {
    return minYears === null || minYears === 0;
  }

  const selectedYear = yearsValue === "11+ yrs" ? 11 : parseInt(yearsValue, 10);
  if (Number.isNaN(selectedYear)) return true;
  // Unknown is NOT disqualifying. normalizeJob prefers experience_level
  // ("Senior") over the numeric `experience` ("3-5 years") that the server
  // actually filtered on, so parseExperienceYears returns null for rows
  // /jobs/scored already confirmed against experience_years. Excluding them
  // here made a 5-year candidate see FEWER jobs than a fresher, and shrank the
  // list below the total the pager was still advertising.
  if (minYears === null) return true;

  // A candidate qualifies once they meet the posting's stated minimum — the
  // posting's own upper bound isn't a ceiling on who's allowed to apply.
  // Mirrors the backend's own experience_years matching (FeedFilters.
  // _experience_clause: "candidate's years satisfy the requirement's leading
  // number"). Previously this required an EXACT match to that leading
  // number (except a >= 11 special-case), so a "2-15 years" posting matched
  // a 2-year pick but silently vanished from an 11-year pick — even though
  // 11 falls well inside 2-15 and clearly qualifies.
  return minYears <= selectedYear;
}

export function matchesSalary(jobSalary: string | undefined, salaryLabel: string): boolean {
  if (salaryLabel === "Any salary") return true;

  const salaryNum = parseSalaryValue(jobSalary);
  if (salaryNum === 0) return false;

  const normalizedLabel = normalizeText(salaryLabel);
  const lpaMatch = normalizedLabel.match(/(\d+)\s*lpa\+/i);
  const minVal = lpaMatch
    ? parseInt(lpaMatch[1], 10) * 100000
    : parseInt(normalizedLabel.replace(/[₹lpa+]/g, ""), 10) * 100000;

  return salaryNum >= minVal;
}

export function matchesLocation(jobLocation: string | undefined, locationFilters: string[]): boolean {
  if (locationFilters.length === 0) return true;

  // A "location:" chip can come from either the sidebar's Cities tab or its
  // States tab (both write the same prefix) — comparing only the city
  // segment meant every state selection matched nothing, since a state name
  // essentially never equals a city name.
  const parts = (jobLocation || "").split(",");
  const jobCity = normalizeText(parts[0]);
  const jobState = normalizeText(parts[1] || "");
  return locationFilters.some((filter) => {
    const normalizedFilter = normalizeText(filter);
    return jobCity === normalizedFilter || (!!jobState && jobState === normalizedFilter);
  });
}

export function matchesEducation(jobEducation: string | undefined, educationFilters: string[]): boolean {
  if (educationFilters.length === 0) return true;

  const jobEdu = normalizeText(jobEducation || "");
  return educationFilters.some((filter) => jobEdu.includes(normalizeText(filter)));
}

function matchesSource(jobSource: string | undefined, sourceFilterValue: string | undefined): boolean {
  if (!sourceFilterValue) return true;
  return normalizeText(jobSource || "").includes(normalizeText(sourceFilterValue));
}

// Score chips carry a plain "<N>+" label (e.g. "matchscore:70+") — a job
// missing that score component entirely (undefined) fails the check rather
// than passing by default, since "unscored" isn't "meets the threshold".
function matchesMinScore(jobScore: number | undefined, chipLabel: string | undefined): boolean {
  if (!chipLabel) return true;
  const threshold = parseFloat(chipLabel.replace(/\+$/, ""));
  if (Number.isNaN(threshold)) return true;
  return typeof jobScore === "number" && jobScore >= threshold;
}

const DATE_PRESET_DAYS: Record<string, number> = {
  "Last 24 hours": 1,
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 3 months": 90,
};

// Previously applied server-side only (as a `date_from` request param on the
// now-removed "All Jobs" fetch) — computed client-side here so the "Date
// Posted" chip still does something on the tabs that remain (Smart
// Match/Saved/Applied), which only ever get client-side filtering.
function matchesDatePosted(
  createdAt: string | null | undefined,
  postedDate: string | null | undefined,
  datePresetLabel: string | undefined
): boolean {
  if (!datePresetLabel) return true;
  const days = DATE_PRESET_DAYS[datePresetLabel];
  if (!days) return true;

  const raw = createdAt || postedDate;
  if (!raw) return false;

  const postedTime = new Date(raw).getTime();
  if (Number.isNaN(postedTime)) return false;

  return postedTime >= Date.now() - days * 86_400_000;
}

export function matchesJobFilters(
  job: JobFilterCandidate,
  selectedFilters: string[],
  options: JobFilterOptions = {}
): boolean {
  const workModelOptions = ["onsite", "hybrid", "remote", "remote anywhere in the india"].map(normalizeText);
  const typeOptions = ["full-time", "contract", "part-time", "internship"].map(normalizeText);

  const selectedWorkModels = selectedFilters.filter((filter) =>
    workModelOptions.includes(normalizeText(filter))
  );

  const selectedTypeFilters = selectedFilters.filter((filter) =>
    typeOptions.includes(normalizeText(filter))
  );

  const yearsFilter = selectedFilters.find((filter) => filter.startsWith("years:"));
  const yearsValue = yearsFilter ? yearsFilter.replace("years:", "") : null;

  const salaryFilter = selectedFilters.find((filter) => filter.startsWith("salary:"));
  const salaryLabel = salaryFilter ? salaryFilter.replace("salary:", "") : "Any salary";

  const locationFilters = selectedFilters
    .filter((filter) => filter.startsWith("location:"))
    .map((filter) => filter.replace("location:", ""));

  const educationFilters = selectedFilters
    .filter((filter) => filter.startsWith("education:"))
    .map((filter) => filter.replace("education:", ""));

  const sourceFilterValue = options.includeSource
    ? selectedFilters.find((filter) => filter.startsWith("source:"))?.replace("source:", "").toLowerCase()
    : undefined;

  const datePresetLabel = options.includeDate === false
    ? undefined
    : selectedFilters.find((filter) => filter.startsWith("date:"))?.replace("date:", "");

  const scoreChip = (prefix: string) =>
    options.includeMatchScores === true
      ? selectedFilters.find((filter) => filter.startsWith(prefix))?.replace(prefix, "")
      : undefined;

  const matchScoreLabel = scoreChip("matchscore:");
  const skillScoreLabel = scoreChip("skillscore:");
  const expScoreLabel = scoreChip("expscore:");
  const eduScoreLabel = scoreChip("eduscore:");

  return (
    matchesWorkModel(job.mode, selectedWorkModels) &&
    matchesType(job.type, selectedTypeFilters) &&
    matchesExperience(job.experience, yearsValue) &&
    matchesSalary(job.salary, salaryLabel) &&
    matchesLocation(job.location, locationFilters) &&
    matchesEducation(job.education, educationFilters) &&
    matchesSource(job.source, sourceFilterValue) &&
    matchesDatePosted(job.created_at, job.posted_date, datePresetLabel) &&
    matchesMinScore(job.matchScore, matchScoreLabel) &&
    matchesMinScore(job.skill_score, skillScoreLabel) &&
    matchesMinScore(job.experience_score, expScoreLabel) &&
    matchesMinScore(job.education_score, eduScoreLabel)
  );
}
