"use client";
import { useEffect, useState, useMemo } from "react";
import debounce from "lodash.debounce";
import { ResumeData } from "../_context/ResumeContext";

interface ATSDetails {
  keywords_score: number;
  formatting_score: number;
  grammar_score: number;
  skills_match: number;
  improvement_suggestions: string[];
}

export function useATSScore(resumeData: ResumeData) {
  const [score, setScore] = useState<number>(0); // start at 0
  const [details, setDetails] = useState<ATSDetails | null>(null);

  // Debounced fetch function
  const fetchScore = async (data: ResumeData) => {
    try {
      const res = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: data }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch ATS score`);
      }

      const json: { score: number; details: ATSDetails } = await res.json();
      setScore(json.score);
      setDetails(json.details);
    } catch (err) {
      console.error("ATS Score error:", err);
    }
  };

  const debouncedFetchScore = useMemo(
    () => debounce(fetchScore, 800),
    []
  );

  useEffect(() => {
    if (resumeData) {
      debouncedFetchScore(resumeData);
    }
    return () => {
      debouncedFetchScore.cancel();
    };
  }, [resumeData, debouncedFetchScore]);

  return { score, details };
}
