import { computePreviewScore } from "./computePreviewScore";
import type { ResumeResponse } from "@/api/resumeApi";

describe("computePreviewScore", () => {
  it("returns 0 for empty resume", () => {
    const result = computePreviewScore({} as ResumeResponse);
    expect(result.score).toBe(0);
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

  it("is deterministic", () => {
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

  it("scores fresher resume with projects higher", () => {
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

    const result = computePreviewScore(fresherResume);
    expect(result.score).toBeGreaterThan(30);
  });

  it("scores are bounded 0-100", () => {
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

  it("generates relevant suggestions", () => {
    const resume: ResumeResponse = {
      id: "test-3",
      personalInfo: { fullname: "Test User" },
      skills: ["JavaScript"],
    };

    const result = computePreviewScore(resume);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]).toHaveProperty("id");
    expect(result.suggestions[0]).toHaveProperty("severity");
    expect(result.suggestions[0]).toHaveProperty("message");
  });
});
