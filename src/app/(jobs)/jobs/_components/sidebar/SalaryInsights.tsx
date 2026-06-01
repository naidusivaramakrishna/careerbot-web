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
  "bg-[#2557a7]/35",
  "bg-[#2557a7]",
  "bg-[#2557a7]/65",
  "bg-[#2557a7]/45",
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

    const hasAnyData = avgSalaries.some((v) => v !== null);
    const maxVal = hasAnyData ? Math.max(...avgSalaries.map((v) => v ?? 0)) : 1;
    const MAX_HEIGHT = 100;

    const bars = LEVEL_ORDER.map((label, i) => {
      const val = avgSalaries[i];
      const hasData = val !== null;
      return {
        label,
        value: hasData ? `₹${val! % 1 === 0 ? val : val!.toFixed(1)}L` : null,
        height: hasData ? Math.max(20, Math.round((val! / maxVal) * MAX_HEIGHT)) : 12,
        color: LEVEL_COLORS[i],
        hasData,
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
      median: median ? `₹${median % 1 === 0 ? median : median.toFixed(1)} LPA` : null,
      subtitle: topTitle.length > 30 ? topTitle.slice(0, 28) + "…" : topTitle,
    };
  }, [jobs]);

  return (
    <div>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
          <TrendingUp size={11} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[12.5px] font-semibold text-gray-900 leading-tight">Salary Insights</h3>
          <p className="text-[10px] text-gray-400 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-end justify-between gap-1 h-22.5">
          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[8.5px] font-semibold tabular-nums" style={{ color: bar.hasData ? undefined : "transparent" }}>
                {bar.value ?? "—"}
              </span>
              <div
                className={`w-full rounded-t-sm transition-all ${bar.color} ${!bar.hasData ? "opacity-25" : ""}`}
                style={{ height: bar.height, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)" }}
              />
              <span className="text-[8.5px] text-gray-500 whitespace-nowrap font-medium">{bar.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">Market median</span>
          <span className="text-[12.5px] font-bold text-gray-900 tabular-nums">
            {median ?? <span className="text-gray-300 font-normal text-[11px]">No data yet</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
