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

type CachedScore = { score: number; calculatedAt: number | null };

const parseCachedScore = (value: string | null): CachedScore | null => {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed && typeof parsed === "object" &&
      typeof (parsed as { score?: unknown }).score === "number" &&
      Number.isFinite((parsed as { score: number }).score)
    ) {
      const calculatedAt = (parsed as { calculatedAt?: unknown }).calculatedAt;
      return {
        score: (parsed as { score: number }).score,
        calculatedAt: typeof calculatedAt === "number" && Number.isFinite(calculatedAt)
          ? calculatedAt
          : null,
      };
    }
  } catch {
    // Legacy score-only cache values are accepted below but never trusted as ready.
  }
  const legacyScore = Number(value);
  return Number.isFinite(legacyScore) ? { score: legacyScore, calculatedAt: null } : null;
};

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

  const restoreCachedScore = useCallback((resumeId: string): boolean => {
    const cached = parseCachedScore(localStorage.getItem(getScoreKey(resumeId)));
    if (!cached) return false;
    setOverallScoreState(cached.score);
    setCanonicalScoreState(cached.score);
    // A browser cache has no authoritative resume revision, so it is restored
    // as "stale", never "ready". PreviewPanel and ScoreTab both still show it
    // (ScoreTab with its "may be outdated" pill) until a recalculation.
    setCanonicalStatusState("stale");
    setScoreStaleState(true);
    setLastCalculatedAtState(
      cached.calculatedAt ? new Date(cached.calculatedAt).toLocaleString() : null,
    );
    return true;
  }, [getScoreKey]);

  // Initialize on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resumeId = getCurrentResumeId();
    setCurrentResumeId(resumeId);

    if (resumeId) {
      restoreCachedScore(resumeId);
    }
  }, [getCurrentResumeId, restoreCachedScore]);

  const setCanonicalScore = useCallback((score: number, calculatedAt?: string) => {
    setCanonicalScoreState(score);
    setCanonicalStatusState("ready");
    setScoreStaleState(false);
    setLastCalculatedAtState(calculatedAt || new Date().toLocaleString());

    if (typeof window !== 'undefined') {
      const resumeId = localStorage.getItem("current_resume_id");
      if (resumeId) {
        const scoreKey = getScoreKey(resumeId);
        localStorage.setItem(scoreKey, JSON.stringify({ score, calculatedAt: Date.now() }));
      }
    }
  }, [getScoreKey]);

  const setCanonicalStatus = useCallback((status: CanonicalScoreStatus) => {
    setCanonicalStatusState(status);
  }, []);

  const markScoreStale = useCallback(() => {
    setScoreStaleState(true);
    setCanonicalStatusState("stale");
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
          if (!restoreCachedScore(newResumeId)) {
            resetCanonicalScore();
          }
        } else {
          resetCanonicalScore();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [resetCanonicalScore, restoreCachedScore]);

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

