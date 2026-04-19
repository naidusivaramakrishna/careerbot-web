// Shared filter constants and utility functions for the Jobs feature

export interface FilterParams {
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
  years_min?: number;
  years_max?: number;
  job_type?: string;
  work_model?: string;
}

export const WORK_MODELS = ["Onsite", "Hybrid", "Remote anywhere in the India"];

export const JOB_TYPES = ["Full-time", "Contract", "Part-time", "Internship"];

export const EXPERIENCE_LEVELS = [
  "Intern/New Grad",
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Lead/Staff",
  "Director/Executive",
];

export const DEFAULT_SALARY_PRESETS = [
  { label: "Any salary", value: 0 },
  { label: "\u20B92L+", value: 200000 },
  { label: "\u20B95L+", value: 500000 },
  { label: "\u20B98L+", value: 800000 },
  { label: "\u20B912L+", value: 1200000 },
  { label: "\u20B920L+", value: 2000000 },
];

export const DEFAULT_YEARS_PRESETS = [
  { label: "0-1 years", min: 0, max: 1 },
  { label: "1-3 years", min: 1, max: 3 },
  { label: "3-5 years", min: 3, max: 5 },
  { label: "5-8 years", min: 5, max: 8 },
  { label: "8+ years", min: 8, max: 11 },
];

// Extract salary presets from jobs data
export function extractSalaryPresets(
  jobsData: { salary?: string }[] = []
): { label: string; value: number }[] {
  const values = new Set<number>();
  jobsData.forEach((job) => {
    if (!job.salary) return;
    const nums = String(job.salary).match(/\d+(\.\d+)?/g);
    if (!nums) return;
    nums.forEach((n) => {
      let val = parseFloat(n);
      if (val < 1000) val = val * 100000;
      val = Math.round(val / 200000) * 200000;
      if (val > 0) values.add(val);
    });
  });
  if (values.size === 0) return DEFAULT_SALARY_PRESETS;
  const sorted = Array.from(values).sort((a, b) => a - b);
  return [
    { label: "Any salary", value: 0 },
    ...sorted.map((v) => ({
      label: `\u20B9${(v / 100000).toFixed(0)}L+`,
      value: v,
    })),
  ];
}

// Extract years of experience presets from jobs data
export function extractYearsPresets(
  jobsData: { experience?: string }[] = []
): { label: string; min: number; max: number }[] {
  const ranges = new Set<string>();
  jobsData.forEach((job) => {
    if (!job.experience) return;
    const nums = String(job.experience).match(/\d+/g);
    if (!nums) return;
    if (nums.length >= 2) {
      ranges.add(`${nums[0]}-${nums[1]}`);
    } else if (nums.length === 1) {
      ranges.add(`${nums[0]}-${nums[0]}`);
    }
  });
  if (ranges.size === 0) return DEFAULT_YEARS_PRESETS;
  return Array.from(ranges)
    .map((r) => {
      const [mn, mx] = r.split("-").map(Number);
      return { label: `${mn}-${mx} years`, min: mn, max: mx };
    })
    .sort((a, b) => a.min - b.min)
    .filter((v, i, arr) => i === 0 || v.min !== arr[i - 1].min);
}
