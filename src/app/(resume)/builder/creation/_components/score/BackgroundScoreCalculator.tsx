"use client";
import { useEffect, useRef } from "react";
import { getResumeScore } from "@/api/resumeApi";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";

/**
 * ✅ Background component that calculates score automatically
 * This component is always mounted and watches for resume data changes
 */
export default function BackgroundScoreCalculator() {
  const { setOverallScore, resetScore } = useScore();
  const { resumeData } = useResume();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>("");
  const previousResumeIdRef = useRef<string | null>(null);
  const isCalculatingRef = useRef(false);

  // ✅ Main fetch function
  const fetchScore = async () => {
    // Prevent multiple simultaneous calls
    if (isCalculatingRef.current) {
      // // console.log("⏸️ Score calculation already in progress, skipping...");
      return;
    }

    const resumeId = localStorage.getItem("current_resume_id");
    
    if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
      // // console.warn("⚠️ No resume ID found for background score calculation");
      return;
    }

    // ✅ Check if resume ID changed (new resume created)
    if (previousResumeIdRef.current !== null && previousResumeIdRef.current !== resumeId) {
      // // console.log("🆕 New resume detected in background, resetting score to 0");
      resetScore();
      previousDataRef.current = ""; // Reset data comparison
    }

    previousResumeIdRef.current = resumeId;

    try {
      isCalculatingRef.current = true;
      // // console.log("📊 [Background] Fetching ATS score for resume:", resumeId);
      
      const data = await getResumeScore(resumeId);
      setOverallScore(data.overall_score);
      
      // // console.log("✅ [Background] Score updated successfully:", data.overall_score);
      
    } catch (err) {
      // // console.error("❌ [Background] Error fetching score:", err);
      // Don't show error toast for background calculations
    } finally {
      isCalculatingRef.current = false;
    }
  };

  // ✅ Initial score fetch on mount
  useEffect(() => {
    // // console.log("🎬 [Background] Score calculator mounted");
    
    // Delay initial fetch by 2 seconds to allow page to load
    const initialTimer = setTimeout(() => {
      fetchScore();
    }, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ✅ Watch for resume data changes and trigger debounced score refresh
  useEffect(() => {
    const currentDataString = JSON.stringify({
      personalInfo: resumeData.personalInfo,
      professionalSummary: resumeData.professionalSummary,
      education: resumeData.education,
      workExperience: resumeData.workExperience,
      projects: resumeData.projects,
      skills: resumeData.skills,
      certifications: resumeData.certifications,
      achievements: resumeData.achievements,
      volunteering: resumeData.volunteering,
      internships: resumeData.internships,
      awards: resumeData.awards,
      hobbies: resumeData.hobbies,
      interests: resumeData.interests,
      languages: resumeData.languages,
      publications: resumeData.publications,
      references: resumeData.references,
    });

    // Skip on initial render
    if (previousDataRef.current === "") {
      previousDataRef.current = currentDataString;
      return;
    }

    // Check if data actually changed
    if (currentDataString !== previousDataRef.current) {
      // // console.log("🔄 [Background] Resume data changed - scheduling score refresh...");
      
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer (wait 5 seconds after last change)
      debounceTimerRef.current = setTimeout(() => {
        // // console.log("⏱️ [Background] Debounce complete - fetching new score...");
        fetchScore();
      }, 5000); // 5 second delay to avoid too many API calls

      previousDataRef.current = currentDataString;
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resumeData]);

  // ✅ This component renders nothing (invisible background service)
  return null;
}
