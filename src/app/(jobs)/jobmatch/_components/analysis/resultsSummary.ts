type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" ? value as RecordValue : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const resultScore = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const score = Number.parseFloat(String(value));
  return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null;
};
export const resultColor = (score: number | null) => score == null ? "#64748B" : score >= 70 ? "#07845E" : score >= 50 ? "#CA8A04" : "#DC2626";

export function resultsSummary(results: unknown) {
  const data = record(record(results).data);
  const match = record(data.match_result);
  const tech = record(match.Technical_Skills_Check ?? match.Technical_Skills);
  const soft = record(match.Soft_Skills_Check ?? match.Soft_Skills);
  const careerProg = record(match.Career_Progression_Check);
  const names = (values: unknown[]) => Array.from(new Set(values.map(value => typeof value === "string" ? value : String(record(value).skill ?? "")).filter(Boolean)));
  const matched = names([ ...list(tech.matched_critical_skills), ...list(tech.matched_important_skills), ...list(tech.matched_nice_to_have), ...list(soft.matched_skills)]);
  const missing = names([ ...list(tech.missing_critical_skills), ...list(tech.missing_important_skills), ...list(tech.missing_nice_to_have), ...list(soft.missing_skills)]);
  const areas = Array.from(new Set(list(record(match.Match_Penalties).penalties).map(value => String(record(value).category ?? "")).filter(value => value && !["technical_skills", "soft_skills"].includes(value))));
  const score = resultScore(data.ats_score);
  const sectionScore = (section: RecordValue) => section.execution_failed ? null : resultScore(section.match_score);
  // Mirrors every section ScoreBreakdown.tsx renders on the detailed analysis
  // page, so the Overview's quick table and the detailed page never disagree
  // on which categories exist. Career Progression is the one section that's
  // conditionally absent from a match (see careerProg.applicable below) —
  // same gate ScoreBreakdown.tsx uses to hide its card entirely.
  const breakdown = [
    {label: "Overall Match", score},
    {label: "Technical Skills", score: sectionScore(tech)},
    {label: "Soft Skills", score: sectionScore(soft)},
    {label: "Capabilities", score: sectionScore(record(match.Capabilities_Check))},
    {label: "STAR Pattern", score: sectionScore(record(match.STAR_Pattern_Check))},
    {label: "Action Verbs", score: sectionScore(record(match.Requirements_Check))},
    {label: "Summary", score: sectionScore(record(match.Summary_Check))},
    {label: "Job Title Match", score: sectionScore(record(match.Job_Title_Check))},
    {label: "Experience", score: sectionScore(record(match.Experience_Check))},
    {label: "Education", score: sectionScore(record(match.Education_Check))},
    {label: "Certifications", score: sectionScore(record(match.Certifications_Check))},
    {label: "ATS Formatting", score: sectionScore(record(match.Formatting_Check))},
    ...(careerProg.applicable !== false && careerProg.match_score !== undefined
      ? [{label: "Career Progression", score: sectionScore(careerProg)}] : []),
    {label: "Leadership", score: sectionScore(record(match.Leadership_Check))},
  ];
  return {
    score, matched, missing, areas, breakdown,
    band: score == null ? "Score unavailable" : score >= 85 ? "Excellent Match" : score >= 70 ? "Good Match" : score >= 50 ? "Fair Match" : "Needs Improvement",
  };
}
