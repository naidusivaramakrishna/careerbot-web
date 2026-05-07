"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface ScoreContextType {
  overallScore: number;
  setOverallScore: (score: number) => void;
  refreshScore: () => void;
  resetScore: () => void;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ Get current resume ID from localStorage
  const getCurrentResumeId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("current_resume_id") || null;
    }
    return null;
  }, []);

  // ✅ Get score key based on resume ID
  const getScoreKey = useCallback((resumeId: string | null) => {
    return resumeId ? `resume_score_${resumeId}` : "resume_overall_score";
  }, []);

  // ✅ Initialize score - Start at 0
  const [overallScore, setOverallScoreState] = useState<number>(0);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  // ✅ Initialize score after component mounts
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
        // // console.log(`📊 Loaded cached score for resume ${resumeId}:`, score);
        setOverallScoreState(score);
      } else {
        // // console.log(`🆕 No cached score for resume ${resumeId} - starting at 0`);
        setOverallScoreState(0);
      }
    } else {
      // // console.log("ℹ️ No resume ID - starting with score 0");
      setOverallScoreState(0);
    }
  }, [getCurrentResumeId, getScoreKey]);

  // ✅ Stable function with empty dependencies
  const setOverallScore = useCallback((score: number) => {
    setOverallScoreState(score);
    
    if (typeof window !== 'undefined') {
      const resumeId = localStorage.getItem("current_resume_id");
      if (resumeId) {
        const scoreKey = resumeId ? `resume_score_${resumeId}` : "resume_overall_score";
        localStorage.setItem(scoreKey, score.toString());
        // // console.log(`💾 Score saved for resume ${resumeId}:`, score);
      }
    }
  }, []);

  // ✅ Reset score (for new resume) - stable function
  const resetScore = useCallback(() => {
    setOverallScoreState(0);
    
    if (typeof window !== 'undefined') {
      const resumeId = localStorage.getItem("current_resume_id");
      if (resumeId) {
        const scoreKey = resumeId ? `resume_score_${resumeId}` : "resume_overall_score";
        localStorage.removeItem(scoreKey);
        // // console.log(`🗑️ Removed cached score for resume ${resumeId}`);
      }
    }
    
    // // console.log("🔄 Score reset to 0");
  }, []);

  // ✅ Use storage event listener instead of polling interval
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to current_resume_id changes
      if (e.key === 'current_resume_id') {
        const newResumeId = e.newValue;
        
        // // console.log(`🔄 Resume ID changed to ${newResumeId} (detected via storage event)`);
        setCurrentResumeId(newResumeId);
        
        if (newResumeId) {
          const scoreKey = getScoreKey(newResumeId);
          const stored = localStorage.getItem(scoreKey);
          
          if (stored) {
            const parsed = parseFloat(stored);
            const newScore = isNaN(parsed) ? 0 : parsed;
            // // console.log(`📊 Loaded cached score for resume ${newResumeId}:`, newScore);
            setOverallScoreState(newScore);
          } else {
            // // console.log(`🆕 New resume ${newResumeId} - resetting score to 0`);
            setOverallScoreState(0);
          }
        } else {
          // // console.log("ℹ️ No resume ID - resetting score to 0");
          setOverallScoreState(0);
        }
      }
    };

    // ✅ Listen to storage events (cross-tab changes)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [getScoreKey]);

  // ✅ Manual check on visibility change (when user comes back to tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const newResumeId = getCurrentResumeId();
        
        if (newResumeId !== currentResumeId) {
          // // console.log(`🔄 Resume ID changed from ${currentResumeId} to ${newResumeId} (visibility change)`);
          setCurrentResumeId(newResumeId);
          
          if (newResumeId) {
            const scoreKey = getScoreKey(newResumeId);
            const stored = localStorage.getItem(scoreKey);
            
            if (stored) {
              const parsed = parseFloat(stored);
              const newScore = isNaN(parsed) ? 0 : parsed;
              // // console.log(`📊 Loaded cached score for resume ${newResumeId}:`, newScore);
              setOverallScoreState(newScore);
            } else {
              // // console.log(`🆕 New resume ${newResumeId} - resetting score to 0`);
              setOverallScoreState(0);
            }
          } else {
            // // console.log("ℹ️ No resume ID - resetting score to 0");
            setOverallScoreState(0);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentResumeId, getCurrentResumeId, getScoreKey]);

  const refreshScore = useCallback(() => {
    // no-op: consumers re-fetch on their own trigger
  }, []);

  return (
    <ScoreContext.Provider value={{ 
      overallScore, 
      setOverallScore, 
      refreshScore,
      resetScore 
    }}>
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

