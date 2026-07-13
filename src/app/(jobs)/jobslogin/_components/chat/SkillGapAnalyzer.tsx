"use client";

interface SkillGapAnalyzerProps {
  skills: string[];
}

export default function SkillGapAnalyzer({ skills }: SkillGapAnalyzerProps) {
  // Map common skills to proficiency levels (simple heuristic)
  const getSkillProficiency = (skill: string): number => {
    const lower = skill.toLowerCase();

    // High proficiency (80-90%)
    if (lower.includes('javascript') || lower.includes('react') || lower.includes('html') || lower.includes('css')) return 85;

    // Medium proficiency (40-60%)
    if (lower.includes('testing') || lower.includes('docker') || lower.includes('api')) return 50;

    // Lower proficiency (20-40%)
    if (lower.includes('devops') || lower.includes('system') || lower.includes('design')) return 35;

    // Default medium
    return 55;
  };

  const skillsWithProficiency = (skills || [])
    .slice(0, 5) // Show top 5 skills
    .map(skill => ({
      name: skill,
      proficiency: getSkillProficiency(skill)
    }));

  if (skillsWithProficiency.length === 0) {
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">No skills listed for this role.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50 animate-in fade-in duration-300">
      <p className="text-xs font-bold text-gray-800 mb-3">📊 Skill Proficiency</p>

      <div className="space-y-2.5">
        {skillsWithProficiency.map((skill) => (
          <div key={skill.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 truncate">{skill.name}</span>
              <span className="text-xs text-gray-600">{skill.proficiency}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${skill.proficiency}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-3 pt-2 border-t border-indigo-200/30">
        💡 Focus on lower-proficiency areas to stand out.
      </p>
    </div>
  );
}
