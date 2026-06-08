import type { NormalizedResumeData } from "./normalizeResumeData";
import type { PreviewScoreBreakdown, PreviewScoreSuggestion } from "./previewScoreTypes";

const WEIGHTS = {
  contact: 10,
  summary: 10,
  education: 15,
  skills: 20,
  evidence: 20,
  metrics: 10,
  certifications: 10,
  formatting: 5,
} as const;

export const calculateScoreBreakdown = (normalized: NormalizedResumeData): PreviewScoreBreakdown => {
  const breakdown: PreviewScoreBreakdown = {
    contact: calculateContactScore(normalized.contact),
    summary: calculateSummaryScore(normalized.summary),
    education: calculateEducationScore(normalized.education, normalized.isFresher),
    skills: calculateSkillsScore(normalized.skills),
    evidence: calculateEvidenceScore(normalized, normalized.isFresher),
    metrics: calculateMetricsScore(normalized),
    certifications: calculateCertificationsScore(normalized.certifications),
    formatting: 5, // Base formatting score
  };

  return breakdown;
};

const calculateContactScore = (contact: { name: boolean; email: boolean; phone: boolean; location: boolean; links: number }): number => {
  let score = 0;
  if (contact.name) score += 2;
  if (contact.email) score += 2;
  if (contact.phone) score += 2;
  if (contact.location) score += 2;
  if (contact.links > 0) score += 2;
  return Math.min(score, 10);
};

const calculateSummaryScore = (summary: { exists: boolean; length: number; hasTargetRole: boolean }): number => {
  if (!summary.exists) return 0;
  let score = 5;
  if (summary.length > 50 && summary.length < 300) score += 3;
  if (summary.hasTargetRole) score += 2;
  return Math.min(score, 10);
};

const calculateEducationScore = (education: { count: number; hasGPA: boolean; hasCompleteDates: boolean }, isFresher: boolean): number => {
  let score = 0;

  if (education.count > 0) {
    score += 8;
    if (education.hasCompleteDates) score += 3;
    if (education.hasGPA) score += 4;
  }

  return Math.min(score, 15);
};

const calculateSkillsScore = (skills: { total: number; categorized: boolean; categories: number }): number => {
  let score = 0;

  if (skills.total >= 10) score += 8;
  else if (skills.total >= 5) score += 5;
  else if (skills.total > 0) score += 2;

  if (skills.categorized && skills.categories >= 3) score += 8;
  else if (skills.categorized && skills.categories > 0) score += 4;

  return Math.min(score, 20);
};

const calculateEvidenceScore = (normalized: NormalizedResumeData, isFresher: boolean): number => {
  let score = 0;

  if (normalized.experience.workCount > 0) {
    score += 10;
    if (normalized.experience.workCount >= 2) score += 5;
  }

  if (normalized.experience.internshipCount > 0) {
    score += 5;
  }

  if (normalized.experience.projectCount > 0) {
    score += normalized.isFresher ? 8 : 5;
  }

  return Math.min(score, 20);
};

const calculateMetricsScore = (normalized: NormalizedResumeData): number => {
  let score = 0;

  if (normalized.experience.hasQuantifiedResults >= 1) score += 5;
  if (normalized.experience.hasQuantifiedResults >= 3) score += 5;

  return Math.min(score, 10);
};

const calculateCertificationsScore = (certifications: { count: number; hasIssuer: boolean }): number => {
  let score = 0;

  if (certifications.count > 0) {
    score += 5;
    if (certifications.hasIssuer) score += 5;
  }

  return Math.min(score, 10);
};

export const generateSuggestions = (normalized: NormalizedResumeData, breakdown: PreviewScoreBreakdown): PreviewScoreSuggestion[] => {
  const suggestions: PreviewScoreSuggestion[] = [];

  // Contact suggestions
  if (!normalized.contact.name) {
    suggestions.push({
      id: "contact-name",
      severity: "warning",
      message: "Add your full name",
      section: "Contact",
    });
  }

  if (!normalized.contact.email) {
    suggestions.push({
      id: "contact-email",
      severity: "warning",
      message: "Add your email address",
      section: "Contact",
    });
  }

  if (normalized.contact.links === 0) {
    suggestions.push({
      id: "contact-links",
      severity: "info",
      message: "Add LinkedIn or GitHub profile links",
      section: "Contact",
    });
  }

  // Summary suggestions
  if (!normalized.summary.exists) {
    suggestions.push({
      id: "summary-missing",
      severity: "warning",
      message: "Add a professional summary",
      section: "Summary",
    });
  }

  // Skills suggestions
  if (normalized.skills.total < 5) {
    suggestions.push({
      id: "skills-count",
      severity: "warning",
      message: "Add more skills (aim for 10+)",
      section: "Skills",
    });
  }

  if (normalized.skills.total > 0 && !normalized.skills.categorized) {
    suggestions.push({
      id: "skills-organize",
      severity: "info",
      message: "Organize skills into categories",
      section: "Skills",
    });
  }

  // Experience suggestions
  if (normalized.experience.workCount === 0 && !normalized.isFresher) {
    suggestions.push({
      id: "experience-missing",
      severity: "warning",
      message: "Add work experience",
      section: "Experience",
    });
  }

  if (normalized.isFresher && normalized.experience.projectCount === 0) {
    suggestions.push({
      id: "fresher-projects",
      severity: "warning",
      message: "Add projects to showcase your skills",
      section: "Projects",
    });
  }

  // Metrics suggestions
  if (normalized.experience.hasQuantifiedResults < 2 && normalized.experience.workCount > 0) {
    suggestions.push({
      id: "metrics-add",
      severity: "info",
      message: "Add quantified results (numbers, percentages) to achievements",
      section: "Experience",
    });
  }

  // Certifications suggestions
  if (normalized.certifications.count === 0) {
    suggestions.push({
      id: "certifications-add",
      severity: "info",
      message: "Add certifications if you have any",
      section: "Certifications",
    });
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
};

export const calculateFinalScore = (breakdown: PreviewScoreBreakdown): number => {
  const total =
    breakdown.contact +
    breakdown.summary +
    breakdown.education +
    breakdown.skills +
    breakdown.evidence +
    breakdown.metrics +
    breakdown.certifications +
    breakdown.formatting;

  return Math.round(total);
};

export const getScoreBand = (score: number): "weak" | "fair" | "good" | "strong" => {
  if (score < 40) return "weak";
  if (score < 60) return "fair";
  if (score < 80) return "good";
  return "strong";
};
