import type { ResumeResponse } from "@/api/resumeApi";

export interface NormalizedResumeData {
  contact: {
    name: boolean;
    email: boolean;
    phone: boolean;
    location: boolean;
    links: number;
  };
  summary: {
    exists: boolean;
    length: number;
    hasTargetRole: boolean;
  };
  education: {
    count: number;
    hasGPA: boolean;
    hasCompleteDates: boolean;
  };
  skills: {
    total: number;
    categorized: boolean;
    categories: number;
  };
  experience: {
    workCount: number;
    internshipCount: number;
    projectCount: number;
    hasQuantifiedResults: number;
  };
  certifications: {
    count: number;
    hasIssuer: boolean;
  };
  achievements: {
    count: number;
  };
  isFresher: boolean;
}

export const normalizeResumeData = (resume: ResumeResponse): NormalizedResumeData => {
  const personalInfo = resume.personalInfo || {};
  const summary = resume.professionalSummary;
  const summaryObj = typeof summary === "string"
    ? { summary, targetRole: "" }
    : summary || { summary: "", targetRole: "" };

  const workExperience = resume.workExperience || [];
  const internships = resume.internships || [];
  const projects = resume.projects || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  const categorizedSkills = resume.categorizedSkills;
  const certifications = resume.certifications || [];
  const achievements = resume.achievements || [];

  const isFresher = workExperience.length === 0 && education.length > 0;

  const countQuantifiedResults = (items: Array<{ description?: string }>) => {
    if (!items) return 0;
    return items.filter(item => {
      const desc = item.description || "";
      return /\d+%?|\d+[xX+]|\b(increased|improved|reduced|achieved)\b/i.test(desc);
    }).length;
  };

  return {
    contact: {
      name: Boolean(personalInfo.fullname?.trim()),
      email: Boolean(personalInfo.email?.trim()),
      phone: Boolean(personalInfo.phone?.trim()),
      location: Boolean(personalInfo.location?.trim()),
      links: [personalInfo.linkedinUrl, personalInfo.githubUrl, personalInfo.portfolioUrl].filter(Boolean).length,
    },
    summary: {
      exists: Boolean(summaryObj.summary?.trim()),
      length: (summaryObj.summary || "").trim().length,
      hasTargetRole: Boolean(summaryObj.targetRole?.trim()),
    },
    education: {
      count: education.length,
      hasGPA: education.some(e => Boolean(e.scoreValue?.trim())),
      hasCompleteDates: education.filter(e => e.startDate && e.endDate).length > 0,
    },
    skills: {
      total: skills.length,
      categorized: Boolean(categorizedSkills && Object.keys(categorizedSkills).length > 0),
      categories: categorizedSkills ? Object.keys(categorizedSkills).length : 0,
    },
    experience: {
      workCount: workExperience.length,
      internshipCount: internships.length,
      projectCount: projects.length,
      hasQuantifiedResults: countQuantifiedResults([...workExperience, ...projects]),
    },
    certifications: {
      count: certifications.length,
      hasIssuer: certifications.some(c => Boolean(c.issuer?.trim())),
    },
    achievements: {
      count: achievements.length,
    },
    isFresher,
  };
};
