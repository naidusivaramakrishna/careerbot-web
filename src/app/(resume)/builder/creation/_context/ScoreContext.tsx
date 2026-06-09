"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { CanonicalScoreStatus } from "../_components/score/FullAtsScoreCard";

interface ScoreContextType {
  canonicalScore: number | null;
  canonicalStatus: CanonicalScoreStatus;
  scoreStale: boolean;
  lastCalculatedAt: string | null;
  setCanonicalScore: (score: number, calculatedAt?: string) => void;
  markScoreStale: () => void;
  resetCanonicalScore: () => void;
  setCanonicalStatus: (status: CanonicalScoreStatus) => void;
  overallScore: number; // Legacy - kept for backward compatibility
  setOverallScore: (score: number) => void;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canonicalScore, setCanonicalScoreState] = useState<number | null>(null);
  const [canonicalStatus, setCanonicalStatusState] = useState<CanonicalScoreStatus>("not_calculated");
  const [scoreStale, setScoreStaleState] = useState<boolean>(false);
  const [lastCalculatedAt, setLastCalculatedAtState] = useState<string | null>(null);
  const [overallScore, setOverallScoreState] = useState<number>(0);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  const getCurrentResumeId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("current_resume_id") || null;
    }
    return null;
  }, []);

  const getScoreKey = useCallback((resumeId: string | null) => {
    return resumeId ? `resume_score_${resumeId}` : "resume_overall_score";
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resumeId = getCurrentResumeId();
    setCurrentResumeId(resumeId);

    if (resumeId) {
      const scoreKey = getScoreKey(resumeId);
      const stored = localStorage.getItem(scoreKey);

      if (stored) {
        const parsed = parseFloat(stored);
        const score = isNaN(parsed) ? 0 : parsed;
        setOverallScoreState(score);
        setCanonicalScoreState(score);
        setCanonicalStatusState("ready");
      }
    }
  }, [getCurrentResumeId, getScoreKey]);

  const setCanonicalScore = useCallback((score: number, calculatedAt?: string) => {
    setCanonicalScoreState(score);
    setCanonicalStatusState("ready");
    setScoreStaleState(false);
    setLastCalculatedAtState(calculatedAt || new Date().toLocaleString());

    if (typeof window !== 'undefined') {
      const resumeId = localStorage.getItem("current_resume_id");
      if (resumeId) {
        const scoreKey = getScoreKey(resumeId);
        localStorage.setItem(scoreKey, score.toString());
      }
    }
  }, [getScoreKey]);

  const setCanonicalStatus = useCallback((status: CanonicalScoreStatus) => {
    setCanonicalStatusState(status);
  }, []);

  const markScoreStale = useCallback(() => {
    setScoreStaleState(true);
  }, []);

  const resetCanonicalScore = useCallback(() => {
    setCanonicalScoreState(null);
    setCanonicalStatusState("not_calculated");
    setScoreStaleState(false);
    setLastCalculatedAtState(null);

    if (typeof window !== 'undefined') {
      const resumeId = localStorage.getItem("current_resume_id");
      if (resumeId) {
        const scoreKey = getScoreKey(resumeId);
        localStorage.removeItem(scoreKey);
      }
    }
  }, [getScoreKey]);

  // Legacy setOverallScore for backward compatibility
  const setOverallScore = useCallback((score: number) => {
    setOverallScoreState(score);
  }, []);

  // Handle resume ID changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_resume_id') {
        const newResumeId = e.newValue;
        setCurrentResumeId(newResumeId);

        if (newResumeId) {
          const scoreKey = getScoreKey(newResumeId);
          const stored = localStorage.getItem(scoreKey);

          if (stored) {
            const parsed = parseFloat(stored);
            const newScore = isNaN(parsed) ? 0 : parsed;
            setOverallScoreState(newScore);
            setCanonicalScoreState(newScore);
            setCanonicalStatusState("ready");
          } else {
            resetCanonicalScore();
          }
        } else {
          resetCanonicalScore();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getScoreKey, resetCanonicalScore]);

  return (
    <ScoreContext.Provider
      value={{
        canonicalScore,
        canonicalStatus,
        scoreStale,
        lastCalculatedAt,
        setCanonicalScore,
        markScoreStale,
        resetCanonicalScore,
        setCanonicalStatus,
        overallScore,
        setOverallScore,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
};

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error("useScore must be used within ScoreProvider");
  }
  return context;
};

