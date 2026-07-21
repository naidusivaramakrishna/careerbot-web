export interface JobFilterCandidate {
  mode?: string;
  type?: string;
  experience?: string;
  salary?: string;
  location?: string;
  education?: string;
  source?: string;
}

export interface JobFilterOptions {
  includeSource?: boolean;
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

function matchesExperience(jobExperience: string | undefined, yearsValue: string | null): boolean {
  if (!yearsValue) return true;

  const expStr = jobExperience || "";
  const years = parseExperienceYears(expStr);

  if (yearsValue === "Fresher") {
    return years === null || years === 0;
  }

  const selectedYear = yearsValue === "11+ yrs" ? 11 : parseInt(yearsValue, 10);
  if (Number.isNaN(selectedYear)) return true;
  if (years === null) return selectedYear === 0;

  if (selectedYear === 11) return years >= 11;
  return years === selectedYear;
}

function matchesSalary(jobSalary: string | undefined, salaryLabel: string): boolean {
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

function matchesLocation(jobLocation: string | undefined, locationFilters: string[]): boolean {
  if (locationFilters.length === 0) return true;

  const jobCity = normalizeText((jobLocation || "").split(",")[0]);
  return locationFilters.some((filter) => jobCity === normalizeText(filter));
}

function matchesEducation(jobEducation: string | undefined, educationFilters: string[]): boolean {
  if (educationFilters.length === 0) return true;

  const jobEdu = normalizeText(jobEducation || "");
  return educationFilters.some((filter) => jobEdu.includes(normalizeText(filter)));
}

function matchesSource(jobSource: string | undefined, sourceFilterValue: string | undefined): boolean {
  if (!sourceFilterValue) return true;
  return normalizeText(jobSource || "").includes(normalizeText(sourceFilterValue));
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

  return (
    matchesWorkModel(job.mode, selectedWorkModels) &&
    matchesType(job.type, selectedTypeFilters) &&
    matchesExperience(job.experience, yearsValue) &&
    matchesSalary(job.salary, salaryLabel) &&
    matchesLocation(job.location, locationFilters) &&
    matchesEducation(job.education, educationFilters) &&
    matchesSource(job.source, sourceFilterValue)
  );
}
