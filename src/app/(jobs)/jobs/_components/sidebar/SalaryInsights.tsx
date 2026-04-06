"use client";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface Job {
  salary?: string;
  experience?: string;
  experience_level?: string;
  title?: string;
}

interface SalaryInsightsProps {
  jobs?: Job[];
}

const LEVEL_ORDER = ["Fresher", "Entry", "Mid", "Senior", "Lead"];
const LEVEL_COLORS = [
  "bg-gray-200",
  "bg-[#2557a7]/30",
  "bg-[#2557a7]",
  "bg-[#2557a7]/70",
  "bg-[#2557a7]/50",
];

function parseSalaryValue(salary: string): number | null {
  if (!salary) return null;
  // Extract numbers from strings like "12-18 LPA", "₹12L", "12 LPA"
  const nums = salary.match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  const values = nums.map(Number);
  // Average if range
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // Convert to lakhs if already in lakhs (< 1000), else assume raw
  return avg < 1000 ? avg : avg / 100000;
}

function mapToLevel(experience: string): string {
  const e = experience.toLowerCase();
  if (e.includes("intern") || e.includes("fresher") || e.includes("fresh")) return "Fresher";
  if (e.includes("entry") || e.includes("junior")) return "Entry";
  if (e.includes("mid")) return "Mid";
  if (e.includes("senior") || e.includes("sr.")) return "Senior";
  if (e.includes("lead") || e.includes("staff") || e.includes("director") || e.includes("exec")) return "Lead";
  // Try years
  const nums = e.match(/\d+/g);
  if (nums) {
    const max = Math.max(...nums.map(Number));
    if (max <= 1) return "Fresher";
    if (max <= 3) return "Entry";
    if (max <= 6) return "Mid";
    if (max <= 10) return "Senior";
    return "Lead";
  }
  return "Mid";
}

export default function SalaryInsights({ jobs = [] }: SalaryInsightsProps) {
  const { bars, median, subtitle } = useMemo(() => {
    const levelSalaries: Record<string, number[]> = {
      Fresher: [], Entry: [], Mid: [], Senior: [], Lead: [],
    };

    jobs.forEach((job) => {
      if (!job.salary) return;
      const salary = parseSalaryValue(job.salary);
      if (!salary) return;
      const exp = job.experience_level || job.experience || "";
      const level = mapToLevel(exp);
      levelSalaries[level].push(salary);
    });

    // Compute average per level
    const avgSalaries = LEVEL_ORDER.map((level) => {
      const vals = levelSalaries[level];
      return vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
    });

    // Fill nulls with interpolation
    const filled = [...avgSalaries];
    const defaults = [4, 8, 14, 22, 32];
    filled.forEach((v, i) => {
      if (v === null) filled[i] = defaults[i];
    });

    const maxVal = Math.max(...(filled as number[]));
    const MAX_HEIGHT = 100;

    const bars = LEVEL_ORDER.map((label, i) => {
      const val = filled[i] as number;
      return {
        label,
        value: `₹${val % 1 === 0 ? val : val.toFixed(1)}L`,
        height: Math.max(20, Math.round((val / maxVal) * MAX_HEIGHT)),
        color: LEVEL_COLORS[i],
        hasData: avgSalaries[i] !== null,
      };
    });

    // Median from all parsed salaries
    const allSalaries = Object.values(levelSalaries).flat().sort((a, b) => a - b);
    const median = allSalaries.length > 0
      ? allSalaries[Math.floor(allSalaries.length / 2)]
      : null;

    // Most common job title for subtitle
    const titles = jobs.map((j) => j.title).filter(Boolean);
    const titleCount: Record<string, number> = {};
    titles.forEach((t) => { titleCount[t!] = (titleCount[t!] || 0) + 1; });
    const topTitle = Object.entries(titleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Jobs";

    return {
      bars,
      median: median ? `₹${median % 1 === 0 ? median : median.toFixed(1)} LPA` : "₹12.0 LPA",
      subtitle: topTitle.length > 30 ? topTitle.slice(0, 28) + "…" : topTitle,
    };
  }, [jobs]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <TrendingUp size={13} className="text-emerald-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Salary Insights</h3>
      </div>
      <p className="text-xs text-gray-400 mb-5 ml-9 truncate">{subtitle}</p>

      <div className="flex items-end justify-between gap-1 h-[110px] px-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[9px] text-gray-400 font-medium">{bar.value}</span>
            <div
              className={`w-full rounded-t-md transition-all ${bar.color} ${!bar.hasData ? "opacity-40" : ""}`}
              style={{ height: bar.height }}
            />
            <span className="text-[9px] text-gray-500 whitespace-nowrap">{bar.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Market median</span>
        <span className="text-sm font-bold text-gray-900">{median}</span>
      </div>
    </div>
  );
}
