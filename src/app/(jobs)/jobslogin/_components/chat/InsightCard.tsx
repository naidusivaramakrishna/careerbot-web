"use client";

import { JobType } from "./NancyChat";

interface InsightCardProps {
  job: JobType;
}

export default function JobInsightCard({ job }: InsightCardProps) {
  // Analyze job difficulty based on experience level
  const getDifficulty = () => {
    const expLevel = (job.experience_level || "").toLowerCase();
    if (expLevel.includes("entry") || expLevel.includes("junior")) return "Easy";
    if (expLevel.includes("mid") || expLevel.includes("senior")) return "Medium";
    if (expLevel.includes("lead") || expLevel.includes("principal")) return "Hard";
    return "Medium";
  };

  // Determine salary level (simple heuristic)
  const getSalaryLevel = () => {
    const salary = job.salary?.max || 0;
    if (salary === 0) return "Unknown";
    if (salary < 50000) return "Below Market";
    if (salary < 100000) return "Market Rate";
    return "Above Market";
  };

  // Growth potential based on company size and role level
  const getGrowthPotential = () => {
    const title = (job.title || "").toLowerCase();
    const isJunior = title.includes("junior") || title.includes("entry");
    const isLead = title.includes("lead") || title.includes("senior");

    if (isLead) return "Medium";
    if (isJunior) return "High";
    return "Medium";
  };

  // Find missing critical skill (simple heuristic)
  const getMissingSkill = () => {
    const skills = (job.skills_required || []) as string[];
    if (skills.length === 0) return null;
    // Return the first skill as "potentially missing" for demo
    return skills[0];
  };

  const difficulty = getDifficulty();
  const salaryLevel = getSalaryLevel();
  const growth = getGrowthPotential();
  const missingSkill = getMissingSkill();

  return (
    <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200/50 animate-in fade-in duration-300">
      <p className="text-xs font-bold text-gray-800 mb-3">🧠 Job Intelligence</p>

      <div className="space-y-2.5">
        {/* Difficulty */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-700">Skill Difficulty:</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
            difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {difficulty}
          </span>
        </div>

        {/* Salary */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-700">Salary Level:</span>
          <span className="text-xs font-semibold text-blue-600">
            {salaryLevel}
          </span>
        </div>

        {/* Growth */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-700">Growth Potential:</span>
          <span className={`text-xs font-semibold ${
            growth === 'High' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {growth}
          </span>
        </div>

        {/* Missing Skill */}
        {missingSkill && (
          <div className="flex items-center justify-between pt-2 border-t border-blue-200/30">
            <span className="text-xs text-gray-700">⚠ Key Skill:</span>
            <span className="text-xs font-semibold text-orange-600">{missingSkill}</span>
          </div>
        )}
      </div>
    </div>
  );
}
