"use client";

import { useState, useEffect } from "react";
import { extractResume } from "@/api/resumeParsingApi";
import { mapResumeToProfile } from "@/app/(user)/profile/_utils/resumeMapper";
import {
  updateProfile,
  addEducationAutoFill,
  addExperienceAutoFill,
  addSkillAutoFill,
  addCertificationAutoFill,
  addProjectAutoFill,
} from "@/api/userApi";

export type FillStep = "idle" | "parsing" | "saving" | "done" | "error";

export interface FillResult {
  personalInfo: boolean;
  education: number;
  experience: number;
  skills: number;
  certifications: number;
  projects: number;
}

const RESUME_ID_KEY = "dashboard_resume_id";

export function useResumeProfileFill() {
  const [step, setStep] = useState<FillStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FillResult | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Read from localStorage on client mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem(RESUME_ID_KEY);
    if (stored) setResumeId(stored);
  }, []);

  const fill = async (file: File) => {
    setError(null);
    setResult(null);

    try {
      // ── Step 1: Parse resume ──────────────────────────────
      setStep("parsing");
      const parsed = await extractResume(file);

      // Persist resume_id for the ATS scan step
      if (parsed.resume_id) {
        setResumeId(parsed.resume_id);
        localStorage.setItem(RESUME_ID_KEY, parsed.resume_id);
      }
      const profileData = mapResumeToProfile(parsed);

      // ── Step 2: Save to backend ───────────────────────────
      setStep("saving");

      const counts: FillResult = {
        personalInfo: false,
        education: 0,
        experience: 0,
        skills: 0,
        certifications: 0,
        projects: 0,
      };

      // Personal info — skip email (auth credential)
      const pi = profileData.personalInformation;
      if (pi) {
        try {
          await updateProfile({
            full_name: pi.fullName || undefined,
            headline: pi.headline || undefined,
            phone_number: pi.phone || undefined,
            location: pi.location || undefined,
            linkedin_url: pi.linkedin || undefined,
            github_url: pi.github || undefined,
            summary: pi.summary || undefined,
          });
          counts.personalInfo = true;
        } catch {
          // non-fatal: continue with other sections
        }
      }

      // Education — run sequentially to avoid race conditions
      if (profileData.education?.length) {
        for (const edu of profileData.education) {
          try {
            await addEducationAutoFill({
              degree: edu.degree,
              institution: edu.institution,
              stream: edu.stream,
              cgpa: edu.cgpa,
              start_date: edu.start_date,
              end_date: edu.end_date,
            });
            counts.education++;
          } catch {
            // continue
          }
        }
      }

      // Work experience
      if (profileData.workExperience?.length) {
        for (const exp of profileData.workExperience) {
          try {
            await addExperienceAutoFill({
              job_title: exp.job_title,
              company: exp.company,
              location: exp.location,
              start_date: exp.start_date,
              end_date: exp.end_date,
              description: exp.description,
            });
            counts.experience++;
          } catch {
            // continue
          }
        }
      }

      // Skills — batch individually (auto-fill accepts { name })
      if (profileData.skills?.length) {
        for (const skill of profileData.skills) {
          try {
            await addSkillAutoFill({ name: skill });
            counts.skills++;
          } catch {
            // continue
          }
        }
      }

      // Certifications
      if (profileData.certifications?.length) {
        for (const cert of profileData.certifications) {
          try {
            await addCertificationAutoFill({
              certification_name: cert.certification_name,
              issuer: cert.issuer,
              start_date: cert.start_date,
              end_date: cert.end_date,
            });
            counts.certifications++;
          } catch {
            // continue
          }
        }
      }

      // Projects
      if (profileData.projects?.length) {
        for (const proj of profileData.projects) {
          try {
            await addProjectAutoFill({
              project_name: proj.project_name,
              role: proj.role,
              technologies: proj.technologies,
              description: proj.description,
              project_link: proj.project_link,
            });
            counts.projects++;
          } catch {
            // continue
          }
        }
      }

      setResult(counts);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process resume");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setError(null);
    setResult(null);
  };

  return { step, error, result, resumeId, fill, reset };
}
