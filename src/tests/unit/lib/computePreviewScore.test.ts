import { describe, expect, it } from "vitest";
import { computePreviewScore } from "@/app/(resume)/builder/creation/_lib/computePreviewScore";
import type { ResumeResponse } from "@/api/resumeApi";

describe("computePreviewScore", () => {
  it("returns 0 for a missing resume", () => {
    const result = computePreviewScore(undefined as unknown as ResumeResponse);
    expect(result.score).toBe(0);
    expect(result.band).toBe("weak");
  });

  it("scores an empty resume at only the fixed formatting baseline", () => {
    const result = computePreviewScore({} as ResumeResponse);
    expect(result.breakdown.formatting).toBe(5);
    expect(result.score).toBe(5);
    expect(result.band).toBe("weak");
  });

  it("returns low score for minimal resume", () => {
    const resume: ResumeResponse = {
      id: "test-1",
      personalInfo: { fullname: "John Doe" },
    };
    const result = computePreviewScore(resume);
    expect(result.score).toBeLessThan(30);
    expect(result.band).toBe("weak");
  });

  it("is deterministic - same input produces same output", () => {
    const resume: ResumeResponse = {
      id: "test-2",
      personalInfo: {
        fullname: "Jane Smith",
        email: "jane@example.com",
        phone: "123-456-7890",
      },
      education: [
        {
          school: "University",
          degree: "Bachelor",
          startDate: "2018",
          endDate: "2022",
        },
      ],
      skills: ["JavaScript", "React", "Node.js"],
    };

    const result1 = computePreviewScore(resume);
    const result2 = computePreviewScore(resume);

    expect(result1.score).toBe(result2.score);
    expect(result1.band).toBe(result2.band);
  });

  it("scores fresher resume higher when projects are added", () => {
    const fresherResume: ResumeResponse = {
      id: "fresher-1",
      personalInfo: { fullname: "Fresh Dev", email: "fresh@dev.com" },
      education: [
        {
          school: "University",
          degree: "Bachelor",
          startDate: "2021",
          endDate: "2024",
        },
      ],
      projects: [
        {
          title: "E-Commerce App",
          description: "Built a full-stack e-commerce platform",
          technologies: ["React", "Node.js"],
          startDate: "2023",
          endDate: "2023",
          projectUrl: "https://github.com/test",
        },
      ],
      skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    };

    const withoutProjects = computePreviewScore({ ...fresherResume, projects: [] });
    const result = computePreviewScore(fresherResume);
    expect(result.score).toBeGreaterThan(withoutProjects.score);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("scores are bounded between 0 and 100", () => {
    const completeResume: ResumeResponse = {
      id: "complete-1",
      personalInfo: {
        fullname: "Senior Dev",
        email: "senior@dev.com",
        phone: "123-456-7890",
        location: "San Francisco",
        linkedinUrl: "https://linkedin.com/in/senior",
        githubUrl: "https://github.com/senior",
      },
      professionalSummary: {
        summary: "Experienced full-stack developer with 10+ years of expertise",
        targetRole: "Senior Software Engineer",
      },
      education: [
        {
          school: "MIT",
          degree: "Bachelor in CS",
          startDate: "2012",
          endDate: "2016",
          scoreValue: "3.8",
          scoreType: "GPA",
        },
      ],
      workExperience: [
        {
          company: "Google",
          role: "Senior Engineer",
          location: "Mountain View",
          startDate: "2018",
          endDate: "2024",
          currentlyWorking: false,
          description: "Led team that increased performance by 40%",
        },
      ],
      skills: ["JavaScript", "Python", "Go", "React", "Vue", "Django", "Kubernetes"],
      certifications: [
        {
          name: "AWS Solutions Architect",
          issuer: "Amazon",
          issueDate: "2022",
        },
      ],
    };

    const result = computePreviewScore(completeResume);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("generates suggestions for missing contact info", () => {
    const resume: ResumeResponse = {
      id: "test-3",
      personalInfo: { fullname: "Test User" },
      skills: ["JavaScript"],
    };

    const result = computePreviewScore(resume);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.some(s => s.id.includes("contact"))).toBe(true);
  });

  it("scores the persisted builder payload the same as editor-shaped data", () => {
    const editorResume: ResumeResponse = {
      id: "parity-1",
      personalInfo: {
        fullname: "Avery Builder",
        email: "avery@example.com",
        phone: "+911234567890",
        location: "Hyderabad",
        linkedinUrl: "https://linkedin.com/in/avery",
      },
      professionalSummary: {
        summary: "Full-stack developer delivering measurable customer and platform improvements.",
        targetRole: "Full Stack Developer",
      },
      workExperience: [{
        company: "CareerBOT",
        role: "Full Stack Developer",
        location: "Hyderabad",
        startDate: "2022",
        endDate: "2026",
        currentlyWorking: false,
        description: "Improved conversion by 40% for job seekers.",
      }],
      skills: ["TypeScript", "React", "Node.js", "FastAPI", "PostgreSQL", "Redis", "Docker", "AWS", "Leadership"],
      categorizedSkills: {
        programming_languages: ["TypeScript", "Node.js"],
        frameworks: ["React", "FastAPI"],
        soft_skills: ["Communication"],
        project_management: [],
        marketing_sales: [],
      },
      certifications: [{ name: "AWS", issuer: "Amazon", issueDate: "2025" }],
      languages: [{ name: "English", proficiency: "Fluent" }],
      updatedAt: "2026-01-01",
      createdAt: "2026-01-01",
    };
    // Deliberately the persisted server shape, not ResumeResponse: snake_case
    // keys and a categorized `skills` OBJECT where ResumeResponse has a string
    // array. Typed as unknown so the cast below is legal rather than a
    // not-sufficiently-overlapping conversion.
    const persistedBuilderPayload: unknown = {
      id: "parity-1",
      personalInfo: editorResume.personalInfo,
      professional_summary: {
        summary: "Full-stack developer delivering measurable customer and platform improvements.",
        target_role: "Full Stack Developer",
      },
      work_experience: editorResume.workExperience,
      skills: {
        programmingLanguages: [{ name: "TypeScript" }, { name: "Node.js" }],
        frameworks: [{ name: "React" }, { name: "FastAPI" }],
        softSkills: [{ name: "Communication" }, { name: "Leadership" }],
        projectManagement: [{ name: "Docker" }, { name: "AWS" }, { name: "PostgreSQL" }],
        // Category-deletion state must never count as a tenth resume skill.
        deletedCategories: ["marketingSales"],
      },
      certifications: [{ name: "AWS", issued_by: "Amazon", year: "2025" }],
      languages: [{ language: "English", proficiency: "Fluent" }],
      updatedAt: "2026-01-01",
      createdAt: "2026-01-01",
    };

    expect(computePreviewScore(persistedBuilderPayload as ResumeResponse).score)
      .toBe(computePreviewScore(editorResume).score);
  });
  it("increases score when skills are added", () => {
    const baseResume: ResumeResponse = {
      id: "skills-1",
      personalInfo: { fullname: "Dev", email: "dev@example.com" },
      skills: ["JavaScript"],
    };

    const enhancedResume: ResumeResponse = {
      ...baseResume,
      skills: ["JavaScript", "React", "Node.js", "Python", "Docker", "AWS", "PostgreSQL", "Redis", "TypeScript", "GraphQL"],
    };

    const baseScore = computePreviewScore(baseResume).score;
    const enhancedScore = computePreviewScore(enhancedResume).score;

    expect(enhancedScore).toBeGreaterThan(baseScore);
  });
});
