import { getBand, bandStyles, bandColors, type MatchBand } from "@/lib/job-match/bands";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" ? value as RecordValue : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const resultScore = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const score = Number.parseFloat(String(value));
  return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null;
};
// Adapter for backend results: absent/failed scores remain neutral.
export type ScoreBandTone = 'green' | 'info' | 'warning' | 'rose' | 'neutral';
const tones: Record<MatchBand, ScoreBandTone> = {
  strong: 'green', good: 'info', fair: 'warning', 'needs-work': 'rose',
};
const descriptions: Record<MatchBand, string> = {
  strong: 'Your resume is a strong match for this position.',
  good: 'Your resume aligns well with this role. Review the remaining gaps to strengthen your application.',
  fair: 'Your resume partially matches this role. Review the gaps and add relevant experience you can support.',
  'needs-work': 'Review the gaps below to see where your resume can better reflect the job requirements.',
};
export function getScoreBand(value: number | null) {
  const score = resultScore(value);
  if (score == null) return {
    tone: 'neutral' as const, label: 'Score unavailable', text: '#475467', bg: '#F2F4F7',
    description: 'The overall score was not returned for this analysis.',
    classes: { text: 'text-[#475467]', bg: 'bg-[#F2F4F7]', bar: 'bg-[#475467]' },
  };
  const band = getBand(score);
  return {
    tone: tones[band], label: bandStyles[band].label, ...bandColors[band],
    description: descriptions[band], classes: bandStyles[band],
  };
}
export const scoreBandTone = (score: number | null): ScoreBandTone => getScoreBand(score).tone;
export const resultColor = (score: number | null) => getScoreBand(score).text;
export const resultBg = (score: number | null) => getScoreBand(score).bg;

export function resultsSummary(results: unknown) {
  const data = record(record(results).data);
  const match = record(data.match_result);
  const tech = record(match.Technical_Skills_Check ?? match.Technical_Skills);
  const soft = record(match.Soft_Skills_Check ?? match.Soft_Skills);
  const careerProg = record(match.Career_Progression_Check);
  const leadership = record(match.Leadership_Check);
  const names = (values: unknown[]) => Array.from(new Set(values.map(value => typeof value === "string" ? value : String(record(value).skill ?? "")).filter(Boolean)));
  const matched = names([ ...list(tech.matched_critical_skills), ...list(tech.matched_important_skills), ...list(tech.matched_nice_to_have), ...list(soft.matched_skills)]);
  const missing = names([ ...list(tech.missing_critical_skills), ...list(tech.missing_important_skills), ...list(tech.missing_nice_to_have), ...list(soft.missing_skills)]);
  const areas = Array.from(new Set(list(record(match.Match_Penalties).penalties).map(value => String(record(value).category ?? "")).filter(value => value && !["technical_skills", "soft_skills"].includes(value))));
  const score = resultScore(data.ats_score);
  const sectionScore = (section: RecordValue) => section.execution_failed ? null : resultScore(section.match_score);
  // Mirrors every section ScoreBreakdown.tsx renders on the detailed analysis
  // page, so the Overview's quick table and the detailed page never disagree
  // on which categories exist. Career Progression and Leadership are
  // conditionally absent from a match — same `!= null` gates ScoreBreakdown.tsx
  // uses to hide their cards entirely (a missing block or a null score).
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
    ...(careerProg.applicable !== false && careerProg.match_score != null
      ? [{label: "Career Progression", score: sectionScore(careerProg)}] : []),
    ...(leadership.match_score != null
      ? [{label: "Leadership", score: sectionScore(leadership)}] : []),
  ];
  return {
    score, matched, missing, areas, breakdown,
    band: getScoreBand(score).label,
  };
}
