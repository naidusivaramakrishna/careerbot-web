import type { ATSScore, EnhancedSuggestion } from "@/types/api.types";
import type { ResumeData } from "../_context/ResumeContext";

export type AtsIssueSeverity = "high" | "medium" | "low";

export interface AtsSectionIssue {
  id: string;
  section: string;
  label: string;
  message: string;
  impact: number;
  severity: AtsIssueSeverity;
  fixType: "manual" | "auto";
}

export interface NormalizedAtsSection {
  percentage: number;
  deductions: Array<{
    id?: string;
    penalty?: number;
    after_example?: string;
    message?: string;
  }>;
  weight: number;
}

const SECTION_LABELS: Record<string, string> = {
  Contact: "Contact Information",
  PersonalInfo: "Personal Info",
  PersonalInfoShort: "Personal Info",
  Summary: "Professional Summary",
  ProfessionalSummary: "Professional Summary",
  Formatting: "Professional Summary",
  content: "Professional Summary",
  WorkExperience: "Work Experience",
  Experience: "Work Experience",
  ContentQuality: "Work Experience",
  Leadership: "Work Experience",
  Projects: "Projects",
  Skills: "Skills",
  Keywords: "Skills",
  Education: "Education",
  Certifications: "Certifications",
  Achievements: "Achievements",
  Languages: "Languages",
  Internships: "Internships",
  Awards: "Awards",
  Publications: "Publications",
  Volunteering: "Volunteering",
  References: "References",
  Hobbies: "Hobbies",
  Interests: "Interests",
  AdditionalInformation: "Additional Information",
  IntelligencePenalty: "Additional Information",
};

export const ATS_TRACKED_SECTIONS = [
  "Personal Info",
  "Contact Information",
  "Professional Summary",
  "Work Experience",
  "Skills",
  "Projects",
  "Education",
  "Certifications",
  "Achievements",
  "Internships",
  "Awards",
  "Publications",
  "Volunteering",
  "Languages",
  "References",
  "Additional Information",
];

export function normalizeAtsSectionName(section: string): string {
  if (!section) return "Additional Information";
  return SECTION_LABELS[section] || section.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function getAtsScoreValue(score?: ATSScore | null): number {
  const scoreRecord = score as (Record<string, unknown> | null | undefined);
  const atsDisplay = scoreRecord?.ats_display as Record<string, unknown> | undefined;
  const nestedAtsScore = scoreRecord?.ats_score as ATSScore | undefined;
  const nestedAtsBreakdown = scoreRecord?.ats_breakdown as ATSScore | undefined;
  const nestedScore = scoreRecord?.score;
  const raw =
    score?.final_score ??
    score?.FinalScore ??
    score?.Percentage ??
    atsDisplay?.score ??
    nestedAtsScore?.final_score ??
    nestedAtsScore?.FinalScore ??
    nestedAtsScore?.Percentage ??
    nestedAtsScore?.score_calculation?.final_score ??
    nestedAtsBreakdown?.final_score ??
    nestedAtsBreakdown?.FinalScore ??
    nestedAtsBreakdown?.Percentage ??
    nestedAtsBreakdown?.score_calculation?.final_score ??
    score?.score_calculation?.final_score ??
    score?.new_ats_score ??
    score?.ats_scores?.new ??
    score?.total_score ??
    nestedScore ??
    0;
  return Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
}

function getNumeric(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getAtsSectionBreakdown(score?: ATSScore | null): Record<string, NormalizedAtsSection> {
  const scoreRecord = score as (Record<string, unknown> | null | undefined);
  const directBreakdown =
    (score?.section_breakdown as Record<string, unknown> | undefined) ??
    (score?.SectionBreakdown as Record<string, unknown> | undefined) ??
    (scoreRecord?.ats_score as ATSScore | undefined)?.section_breakdown ??
    (scoreRecord?.ats_score as ATSScore | undefined)?.SectionBreakdown ??
    (scoreRecord?.ats_breakdown as ATSScore | undefined)?.section_breakdown ??
    (scoreRecord?.ats_breakdown as ATSScore | undefined)?.SectionBreakdown ??
    {};

  const normalized: Record<string, NormalizedAtsSection> = {};

  Object.entries(directBreakdown).forEach(([name, rawSection]) => {
    if (!rawSection || typeof rawSection !== "object" || Array.isArray(rawSection)) return;
    const section = rawSection as Record<string, unknown>;
    const maxScore = getNumeric(section.max_score ?? section.max ?? section.max_raw_score);
    const rawScore = getNumeric(section.raw_score ?? section.score ?? section.weighted_pts);
    const percentage = getNumeric(
      section.percentage ?? section.Percentage ?? section.score_pct,
      maxScore > 0 ? (rawScore / maxScore) * 100 : 0
    );
    normalized[name] = {
      percentage: Math.max(0, Math.min(100, Math.round(percentage))),
      deductions: Array.isArray(section.deductions) ? section.deductions as NormalizedAtsSection["deductions"] : [],
      weight: getNumeric(section.weight ?? section.max_pts ?? section.max_score ?? section.max ?? 1, 1),
    };
  });

  const atsDisplay = scoreRecord?.ats_display as {
    sections?: Array<{
      name?: string;
      score_pct?: number;
      weighted_pts?: number;
      max_pts?: number;
      is_not_applicable?: boolean;
      deductions?: NormalizedAtsSection["deductions"];
    }>;
  } | undefined;

  atsDisplay?.sections?.forEach((section) => {
    if (!section.name || section.is_not_applicable || normalized[section.name]) return;
    normalized[section.name] = {
      percentage: Math.max(0, Math.min(100, Math.round(getNumeric(section.score_pct)))),
      deductions: Array.isArray(section.deductions) ? section.deductions : [],
      weight: getNumeric(section.max_pts, 1),
    };
  });

  return normalized;
}

function severityFromImpact(impact: number): AtsIssueSeverity {
  if (impact >= 6) return "high";
  if (impact >= 3) return "medium";
  return "low";
}

function sectionHasContent(data: ResumeData, section: string): boolean {
  switch (section) {
    case "Personal Info":
      return Boolean(data.personalInfo.fullname?.trim());
    case "Contact Information":
      return Boolean(data.personalInfo.email?.trim() && data.personalInfo.phone?.trim());
    case "Professional Summary":
      return Boolean(data.professionalSummary.summary?.replace(/<[^>]*>/g, "").trim());
    case "Work Experience":
      return data.workExperience.length > 0 || data.internships.length > 0;
    case "Skills":
      return data.skills.length > 0 || Boolean(data.categorizedSkills && Object.values(data.categorizedSkills).some(v => Array.isArray(v) && v.length > 0));
    case "Projects":
      return data.projects.length > 0;
    case "Education":
      return data.education.length > 0;
    case "Certifications":
      return data.certifications.length > 0;
    case "Achievements":
      return data.achievements.length > 0;
    case "Internships":
      return data.internships.length > 0;
    case "Awards":
      return data.awards.length > 0;
    case "Publications":
      return data.publications.length > 0;
    case "Volunteering":
      return data.volunteering.length > 0;
    case "Languages":
      return data.languages.length > 0;
    case "References":
      return data.references.length > 0;
    case "Additional Information":
      return Boolean(data.hobbies.length > 0 || data.interests.length > 0 || (data.customSections && data.customSections.length > 0));
    default:
      return true;
  }
}

function normalizedText(value: string | undefined): string {
  return (value || "").toLowerCase();
}

function isIssueResolvedByResumeData(issue: Pick<AtsSectionIssue, "label" | "message" | "section">, data: ResumeData): boolean {
  const text = normalizedText(`${issue.section} ${issue.label} ${issue.message}`);

  if (text.includes("linkedin") && data.personalInfo.linkedinUrl?.trim()) {
    return true;
  }

  if (text.includes("github") && data.personalInfo.githubUrl?.trim()) {
    return true;
  }

  if ((text.includes("portfolio") || text.includes("website")) && data.personalInfo.portfolioUrl?.trim()) {
    return true;
  }

  if (text.includes("phone") && data.personalInfo.phone?.trim()) {
    return true;
  }

  if (text.includes("email") && data.personalInfo.email?.trim()) {
    return true;
  }

  if (text.includes("location") && data.personalInfo.location?.trim()) {
    return true;
  }

  if (issue.label === "Professional Summary" && sectionHasContent(data, "Professional Summary")) {
    return true;
  }

  return false;
}

export function buildAtsSectionIssues(
  score: ATSScore | null | undefined,
  suggestions: EnhancedSuggestion[],
  data: ResumeData
): AtsSectionIssue[] {
  const issues = new Map<string, AtsSectionIssue>();
  const breakdown = getAtsSectionBreakdown(score);

  Object.entries(breakdown).forEach(([section, value]) => {
    const label = normalizeAtsSectionName(section);
    (value.deductions || []).forEach((deduction, index) => {
      const impact = Math.max(1, Math.round(Number(deduction.penalty) || 1));
      const id = deduction.id || `${section}-${index}`;
      const issue = {
        id,
        section,
        label,
        message: deduction.message || deduction.after_example || `Complete ${label} to improve your ATS score.`,
        impact,
        severity: severityFromImpact(impact),
        fixType: "manual",
      } satisfies AtsSectionIssue;
      if (!isIssueResolvedByResumeData(issue, data)) {
        issues.set(id, issue);
      }
    });
  });

  suggestions.forEach((suggestion, index) => {
    const label = normalizeAtsSectionName(suggestion.section);
    const fallbackImpact = label === "Professional Summary" ? 8 : label === "Work Experience" ? 6 : label === "Projects" ? 4 : 2;
    if (!issues.has(suggestion.id)) {
      const issue = {
        id: suggestion.id || `${suggestion.section}-${index}`,
        section: suggestion.section,
        label,
        message: suggestion.message || `Complete ${label} to improve your ATS score.`,
        impact: fallbackImpact,
        severity: severityFromImpact(fallbackImpact),
        fixType: suggestion.fix_type,
      } satisfies AtsSectionIssue;
      if (!isIssueResolvedByResumeData(issue, data)) {
        issues.set(issue.id, issue);
      }
    }
  });

  ATS_TRACKED_SECTIONS.forEach((section) => {
    if (!sectionHasContent(data, section)) {
      const id = `missing-${section}`;
      if (!Array.from(issues.values()).some(issue => issue.label === section)) {
        const impact = section === "Professional Summary" ? 8 : section === "Work Experience" ? 6 : section === "Projects" ? 4 : 2;
        issues.set(id, {
          id,
          section,
          label: section,
          message: `Add ${section.toLowerCase()} details to improve parser coverage and ATS matching.`,
          impact,
          severity: severityFromImpact(impact),
          fixType: "manual",
        });
      }
    }
  });

  return Array.from(issues.values()).sort((a, b) => b.impact - a.impact);
}

export function getEstimatedAtsScore(currentScore: number, score?: ATSScore | null): number | null {
  const scoreRecord = score as (Record<string, unknown> | null | undefined);
  const scoreSources = [
    scoreRecord,
    scoreRecord?.ats_display,
    scoreRecord?.ats_score,
    scoreRecord?.ats_breakdown,
    scoreRecord?.score_calculation,
  ].filter((source): source is Record<string, unknown> => Boolean(source) && typeof source === "object");
  const estimateKeys = [
    "estimated_score_after_fixes", "estimated_after_fixes", "estimated_score",
    "projected_score", "potential_score", "score_after_fixes", "post_fix_score", "after_fix_score",
  ];
  const backendEstimate = scoreSources
    .flatMap(source => estimateKeys.map(key => source[key]))
    .map(Number)
    .find(value => Number.isFinite(value) && value >= currentScore && value <= 100);
  if (backendEstimate !== undefined) return Math.round(backendEstimate);
  return null;
}
