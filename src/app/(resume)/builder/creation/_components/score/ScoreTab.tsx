"use client";
import React, { useEffect, useState, useRef } from "react";
import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
import ProgressBar from "./ProgressBar";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import logger from "@/lib/logger";

export default function ATSScorePanel() {
  const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setOverallScore, overallScore, resetScore } = useScore();
  
  // ✅ Track previous resume ID
  const previousResumeIdRef = useRef<string | null>(null);
  // ✅ Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // ✅ Set mounted flag
    isMountedRef.current = true;

    const fetchScore = async () => {
      const resumeId = localStorage.getItem("current_resume_id");

      if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
        logger.warn("No resume ID found");
        setError("No resume found. Please create a resume first.");
        setIsLoading(false);
        return;
      }

      // ✅ Check if this is a new resume (ID changed)
      if (previousResumeIdRef.current !== null && previousResumeIdRef.current !== resumeId) {
        logger.info("New resume detected, resetting score to 0");
        resetScore();
        setScoreData(null);
      }

      previousResumeIdRef.current = resumeId;

      try {
        setIsLoading(true);
        setError(null);
        logger.info("Fetching ATS score for resume:", resumeId);

        const data = await getResumeScore(resumeId);

        // ✅ Only update state if component is still mounted
        if (isMountedRef.current) {
          setScoreData(data);
          setOverallScore(data.overall_score);
          logger.info("Score loaded successfully:", data.overall_score);
        }

      } catch (err) {
        logger.error("Error fetching score:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
        
        // ✅ Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(errorMessage);
          
          if (overallScore === 0) {
            toast.error(errorMessage);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchScore();

    // ✅ Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []); // ✅ Empty dependency array - run once on mount

  if (isLoading && overallScore > 0) {
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
        <div className="flex flex-col items-center justify-center">
          <MultiColorCircularScore value={overallScore} />
          <p className="mt-2 text-sm text-gray-600">Overall Score (Cached)</p>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-xs text-gray-500">Refreshing...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
          <p className="mt-2 text-xs text-gray-500">This may take up to 45 seconds</p>
        </div>
      </div>
    );
  }

  if (error && !scoreData && overallScore === 0) {
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-sm text-gray-600 text-center">
            {error || "Unable to load score"}
          </p>
        </div>
      </div>
    );
  }

  const suggestions = scoreData?.details?.improvement_suggestions ?? [];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

      <div className="flex flex-col items-center justify-center">
        <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
        <p className="mt-2 text-sm text-gray-600">Overall Score</p>
      </div>

      <div className="mt-6 space-y-3 w-full">
        <ProgressBar 
          value={scoreData?.details?.keywords_score ?? 0} 
          label="Keywords" 
        />      
        <ProgressBar 
          value={scoreData?.details?.grammar_score ?? 0} 
          label="Grammar" 
        />
        <ProgressBar 
          value={scoreData?.details?.skills_match ?? 0} 
          label="Skills Match" 
        />
      </div>

      <div className="mt-6 w-full">
        <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

        {suggestions.length > 0 ? (
          <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
        )}
      </div>
    </div>
  );
}

