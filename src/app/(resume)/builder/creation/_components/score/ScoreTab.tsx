"use client";
import React, { useEffect, useState, useRef } from "react";
import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
import ProgressBar from "./ProgressBar";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";

// ── Enhanced ATS score tab (data from /resume/enhance/{id} response) ─────────

function EnhancedScoreTab({ atsScore }: { atsScore: Record<string, unknown> }) {
  const { setOverallScore } = useScore();

  const finalScore = Number(atsScore.final_score ?? atsScore.Percentage ?? 0);

  const sectionBreakdown = (atsScore.section_breakdown ?? {}) as Record<string, {
    raw_score: number;
    max_raw_score: number;
    percentage: number;
    weighted_contribution: number;
    deductions: { id: string; penalty: number; message: string }[];
  }>;

  const intelligencePenalties = (atsScore.IntelligencePenalties ?? []) as {
    id: string; penalty: number; message: string;
  }[];

  useEffect(() => {
    setOverallScore(finalScore);
  }, [finalScore, setOverallScore]);

  const sections = Object.entries(sectionBreakdown);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">ATS Score</h2>

      {/* Overall score */}
      <div className="flex flex-col items-center">
        <MultiColorCircularScore value={finalScore} />
        <p className="mt-2 text-sm text-gray-600">Overall Score</p>
        {(atsScore.Profile as string) && (
          <span className="mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {atsScore.Profile as string}
          </span>
        )}
      </div>

      {/* Section breakdown */}
      {sections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Section Breakdown</h3>
          {sections.map(([name, sec]) => (
            <div key={name}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span className="font-medium">{name}</span>
                <span>{sec.percentage.toFixed(0)}%</span>
              </div>
              <ProgressBar value={sec.percentage} label="" />
              {sec.deductions.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {sec.deductions.map((d) => (
                    <li key={d.id} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5">
                      {d.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Intelligence penalties */}
      {intelligencePenalties.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Additional Notes</h3>
          <ul className="space-y-1">
            {intelligencePenalties.map((p) => (
              <li key={p.id} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1">
                {p.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Builder ATS score tab (calls GET /resumes/{id}/score API) ────────────────

function BuilderScoreTab() {
  const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollProgress, setPollProgress] = useState<{ attempt: number; max: number } | null>(null);
  const { setOverallScore, overallScore, resetScore } = useScore();
  const previousResumeIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchScore = async () => {
      const resumeId = localStorage.getItem("current_resume_id");

      if (!resumeId || resumeId === "null" || resumeId === "undefined") {
        setError("No resume found. Please create a resume first.");
        setIsLoading(false);
        return;
      }

      if (previousResumeIdRef.current !== null && previousResumeIdRef.current !== resumeId) {
        resetScore();
        setScoreData(null);
      }
      previousResumeIdRef.current = resumeId;

      try {
        setIsLoading(true);
        setError(null);
        setPollProgress(null);
        const data = await getResumeScore(resumeId, (attempt, max) => {
          if (isMountedRef.current) setPollProgress({ attempt, max });
        });
        if (isMountedRef.current) {
          setScoreData(data);
          setOverallScore(data.overall_score);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
        if (isMountedRef.current) {
          setError(errorMessage);
          if (overallScore === 0) toast.error(errorMessage);
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    fetchScore();
    return () => { isMountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const pct = pollProgress ? Math.round((pollProgress.attempt / pollProgress.max) * 100) : 0;
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
          {pollProgress ? (
            <div className="mt-3 w-48">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Attempt {pollProgress.attempt}/{pollProgress.max}</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">This may take up to 20 seconds</p>
          )}
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
          <p className="text-sm text-gray-600 text-center">{error || "Unable to load score"}</p>
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
        <ProgressBar value={scoreData?.details?.keywords_score ?? 0} label="Keywords" />
        <ProgressBar value={scoreData?.details?.grammar_score ?? 0} label="Grammar" />
        <ProgressBar value={scoreData?.details?.skills_match ?? 0} label="Skills Match" />
      </div>
      <div className="mt-6 w-full">
        <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>
        {suggestions.length > 0 ? (
          <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
        )}
      </div>
    </div>
  );
}

// ── Main export: routes based on resume source ───────────────────────────────

export default function ATSScorePanel() {
  const { resumeSource, enhancedAtsScore } = useResume();

  if (resumeSource === "enhanced" && enhancedAtsScore) {
    return <EnhancedScoreTab atsScore={enhancedAtsScore as Record<string, unknown>} />;
  }

  return <BuilderScoreTab />;
}
