// "use client";
// import React, { createContext, useContext, useState, useCallback } from "react";

// interface ScoreContextType {
//   overallScore: number;
//   setOverallScore: (score: number) => void;
//   refreshScore: () => void;
// }

// const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

// export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [overallScore, setOverallScore] = useState<number>(0);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   const refreshScore = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//   }, []);

//   return (
//     <ScoreContext.Provider value={{ overallScore, setOverallScore, refreshScore }}>
//       {children}
//     </ScoreContext.Provider>
//   );
// };

// export const useScore = () => {
//   const context = useContext(ScoreContext);
//   if (!context) {
//     throw new Error("useScore must be used within ScoreProvider");
//   }
//   return context;
// }; before loading score gone


// "use client";
// import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// interface ScoreContextType {
//   overallScore: number;
//   setOverallScore: (score: number) => void;
//   refreshScore: () => void;
// }

// const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

// export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // ✅ Initialize from localStorage immediately
//   const [overallScore, setOverallScoreState] = useState<number>(() => {
//     if (typeof window !== 'undefined') {
//       const stored = localStorage.getItem("resume_overall_score");
//       if (stored) {
//         const parsed = parseInt(stored, 10);
//         return isNaN(parsed) ? 0 : parsed;
//       }
//     }
//     return 0;
//   });
  
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   // ✅ Update localStorage whenever score changes
//   const setOverallScore = useCallback((score: number) => {
//     setOverallScoreState(score);
//     if (typeof window !== 'undefined') {
//       localStorage.setItem("resume_overall_score", score.toString());
//       console.log("💾 Score saved to localStorage:", score);
//     }
//   }, []);

//   // ✅ Sync with localStorage on mount (fallback)
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const stored = localStorage.getItem("resume_overall_score");
//       if (stored) {
//         const parsed = parseInt(stored, 10);
//         if (!isNaN(parsed) && parsed !== overallScore) {
//           setOverallScoreState(parsed);
//           console.log("📥 Score loaded from localStorage:", parsed);
//         }
//       }
//     }
//   }, []);

//   const refreshScore = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//   }, []);

//   return (
//     <ScoreContext.Provider value={{ overallScore, setOverallScore, refreshScore }}>
//       {children}
//     </ScoreContext.Provider>
//   );
// };

// export const useScore = () => {
//   const context = useContext(ScoreContext);
//   if (!context) {
//     throw new Error("useScore must be used within ScoreProvider");
//   }
//   return context;
// }; 
// before autofetch score when data change



// "use client";
// import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// interface ScoreContextType {
//   overallScore: number;
//   setOverallScore: (score: number) => void;
//   refreshScore: () => void;
//   triggerScoreRefresh: () => void; // ✅ NEW: Trigger refresh from outside
// }

// const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

// export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // ✅ Initialize from localStorage immediately
//   const [overallScore, setOverallScoreState] = useState<number>(() => {
//     if (typeof window !== 'undefined') {
//       const stored = localStorage.getItem("resume_overall_score");
//       if (stored) {
//         const parsed = parseInt(stored, 10);
//         return isNaN(parsed) ? 0 : parsed;
//       }
//     }
//     return 0;
//   });
  
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   // ✅ Update localStorage whenever score changes
//   const setOverallScore = useCallback((score: number) => {
//     setOverallScoreState(score);
//     if (typeof window !== 'undefined') {
//       localStorage.setItem("resume_overall_score", score.toString());
//       console.log("💾 Score saved to localStorage:", score);
//     }
//   }, []);

//   // ✅ Sync with localStorage on mount (fallback)
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const stored = localStorage.getItem("resume_overall_score");
//       if (stored) {
//         const parsed = parseInt(stored, 10);
//         if (!isNaN(parsed) && parsed !== overallScore) {
//           setOverallScoreState(parsed);
//           console.log("📥 Score loaded from localStorage:", parsed);
//         }
//       }
//     }
//   }, []);

//   const refreshScore = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//   }, []);

//   // ✅ NEW: Method to trigger score refresh from outside
//   const triggerScoreRefresh = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//     console.log("🔄 Score refresh triggered");
//   }, []);

//   return (
//     <ScoreContext.Provider value={{ overallScore, setOverallScore, refreshScore, triggerScoreRefresh }}>
//       {children}
//     </ScoreContext.Provider>
//   );
// };

// export const useScore = () => {
//   const context = useContext(ScoreContext);
//   if (!context) {
//     throw new Error("useScore must be used within ScoreProvider");
//   }
//   return context;
// }; 
// before score reset for new resume



// "use client";
// import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// interface ScoreContextType {
//   overallScore: number;
//   setOverallScore: (score: number) => void;
//   refreshScore: () => void;
//   triggerScoreRefresh: () => void;
//   resetScore: () => void;
// }

// const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

// export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // ✅ Get current resume ID from localStorage
//   const getCurrentResumeId = () => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem("current_resume_id") || null;
//     }
//     return null;
//   };

//   // ✅ Get score key based on resume ID
//   const getScoreKey = (resumeId: string | null) => {
//     return resumeId ? `resume_score_${resumeId}` : "resume_overall_score";
//   };

//   // ✅ Track resume creation timestamp
//   const getResumeCreationTime = (resumeId: string | null): number | null => {
//     if (!resumeId || typeof window === 'undefined') return null;
//     const key = `resume_created_${resumeId}`;
//     const stored = localStorage.getItem(key);
//     return stored ? parseInt(stored, 10) : null;
//   };

//   const setResumeCreationTime = (resumeId: string) => {
//     if (typeof window === 'undefined') return;
//     const key = `resume_created_${resumeId}`;
//     const timestamp = Date.now();
//     localStorage.setItem(key, timestamp.toString());
//     console.log(`⏰ Resume creation time saved: ${resumeId} at ${new Date(timestamp).toISOString()}`);
//   };

//   // ✅ Check if resume is new (created within last 30 seconds)
//   const isNewResume = (resumeId: string | null): boolean => {
//     if (!resumeId) return false;
    
//     const creationTime = getResumeCreationTime(resumeId);
//     if (!creationTime) {
//       // If no creation time, treat as new and set it
//       setResumeCreationTime(resumeId);
//       return true;
//     }
    
//     const ageInSeconds = (Date.now() - creationTime) / 1000;
//     const isNew = ageInSeconds < 30; // New if created within 30 seconds
    
//     console.log(`🕐 Resume age: ${ageInSeconds.toFixed(0)}s, isNew: ${isNew}`);
//     return isNew;
//   };

//   // ✅ Check if resume has been scored (exists in localStorage)
//   const hasBeenScored = (resumeId: string | null): boolean => {
//     if (!resumeId || typeof window === 'undefined') return false;
//     const scoreKey = getScoreKey(resumeId);
//     return localStorage.getItem(scoreKey) !== null;
//   };

//   // ✅ Initialize score - Start at 0
//   const [overallScore, setOverallScoreState] = useState<number>(0);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);
//   const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
//   const [isInitialized, setIsInitialized] = useState(false);

//   // ✅ Initialize score after component mounts
//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     const resumeId = getCurrentResumeId();
//     setCurrentResumeId(resumeId);

//     if (resumeId) {
//       // ✅ If it's a brand new resume, always start at 0
//       if (isNewResume(resumeId)) {
//         console.log(`🆕 Brand new resume ${resumeId} - starting with score 0`);
//         setOverallScoreState(0);
//       }
//       // ✅ If resume has been scored before, load cached score
//       else if (hasBeenScored(resumeId)) {
//         const scoreKey = getScoreKey(resumeId);
//         const stored = localStorage.getItem(scoreKey);
        
//         if (stored) {
//           const parsed = parseInt(stored, 10);
//           const score = isNaN(parsed) ? 0 : parsed;
//           console.log(`📊 Loaded cached score for existing resume ${resumeId}:`, score);
//           setOverallScoreState(score);
//         }
//       } else {
//         console.log(`📊 No cached score for resume ${resumeId} - starting at 0`);
//         setOverallScoreState(0);
//       }
//     } else {
//       console.log("ℹ️ No resume ID - starting with score 0");
//       setOverallScoreState(0);
//     }

//     setIsInitialized(true);
//   }, []);

//   // ✅ Update localStorage with resume-specific key
//   const setOverallScore = useCallback((score: number) => {
//     setOverallScoreState(score);
    
//     if (typeof window !== 'undefined') {
//       const resumeId = getCurrentResumeId();
//       if (resumeId) {
//         const scoreKey = getScoreKey(resumeId);
//         localStorage.setItem(scoreKey, score.toString());
//         console.log(`💾 Score saved for resume ${resumeId}:`, score);
//       }
//     }
//   }, []);

//   // ✅ Watch for resume ID changes and update score
//   useEffect(() => {
//     if (!isInitialized) return;

//     const checkResumeIdChange = () => {
//       const newResumeId = getCurrentResumeId();
      
//       // ✅ If resume ID changed, load score for new resume
//       if (newResumeId !== currentResumeId) {
//         console.log(`🔄 Resume ID changed from ${currentResumeId} to ${newResumeId}`);
//         setCurrentResumeId(newResumeId);
        
//         if (newResumeId) {
//           // ✅ If it's a brand new resume, always start at 0
//           if (isNewResume(newResumeId)) {
//             console.log(`🆕 Brand new resume ${newResumeId} detected - resetting score to 0`);
//             setOverallScoreState(0);
//           }
//           // ✅ Check if this resume has been scored before
//           else if (hasBeenScored(newResumeId)) {
//             const scoreKey = getScoreKey(newResumeId);
//             const stored = localStorage.getItem(scoreKey);
            
//             if (stored) {
//               const parsed = parseInt(stored, 10);
//               const newScore = isNaN(parsed) ? 0 : parsed;
//               console.log(`📊 Loaded cached score for existing resume ${newResumeId}:`, newScore);
//               setOverallScoreState(newScore);
//             } else {
//               console.log(`📊 No cached score for resume ${newResumeId}, starting at 0`);
//               setOverallScoreState(0);
//             }
//           } else {
//             console.log(`📊 Resume ${newResumeId} has no score - starting at 0`);
//             setOverallScoreState(0);
//           }
//         } else {
//           console.log("ℹ️ No resume ID - resetting score to 0");
//           setOverallScoreState(0);
//         }
//       }
//     };

//     checkResumeIdChange();
//     const interval = setInterval(checkResumeIdChange, 1000);

//     return () => clearInterval(interval);
//   }, [currentResumeId, isInitialized]);

//   const refreshScore = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//   }, []);

//   const triggerScoreRefresh = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//     console.log("🔄 Score refresh triggered");
//   }, []);

//   // ✅ Reset score (for new resume)
//   const resetScore = useCallback(() => {
//     setOverallScoreState(0);
    
//     const resumeId = getCurrentResumeId();
//     if (resumeId && typeof window !== 'undefined') {
//       const scoreKey = getScoreKey(resumeId);
//       localStorage.removeItem(scoreKey);
      
//       // ✅ Mark as new resume
//       setResumeCreationTime(resumeId);
      
//       console.log(`🗑️ Removed cached score for resume ${resumeId}`);
//     }
    
//     console.log("🔄 Score reset to 0");
//   }, []);

//   return (
//     <ScoreContext.Provider value={{ 
//       overallScore, 
//       setOverallScore, 
//       refreshScore, 
//       triggerScoreRefresh,
//       resetScore 
//     }}>
//       {children}
//     </ScoreContext.Provider>
//   );
// };

// export const useScore = () => {
//   const context = useContext(ScoreContext);
//   if (!context) {
//     throw new Error("useScore must be used within ScoreProvider");
//   }
//   return context;
// };


















// "use client";
// import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// interface ScoreContextType {
//   overallScore: number;
//   setOverallScore: (score: number) => void;
//   refreshScore: () => void;
//   resetScore: () => void;
// }

// const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

// export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // ✅ Get current resume ID from localStorage
//   const getCurrentResumeId = () => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem("current_resume_id") || null;
//     }
//     return null;
//   };

//   // ✅ Get score key based on resume ID
//   const getScoreKey = (resumeId: string | null) => {
//     return resumeId ? `resume_score_${resumeId}` : "resume_overall_score";
//   };

//   // ✅ Initialize score - Start at 0
//   const [overallScore, setOverallScoreState] = useState<number>(0);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);
//   const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

//   // ✅ Initialize score after component mounts
//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     const resumeId = getCurrentResumeId();
//     setCurrentResumeId(resumeId);

//     if (resumeId) {
//       const scoreKey = getScoreKey(resumeId);
//       const stored = localStorage.getItem(scoreKey);
      
//       if (stored) {
//         const parsed = parseInt(stored, 10);
//         const score = isNaN(parsed) ? 0 : parsed;
//         console.log(`📊 Loaded cached score for resume ${resumeId}:`, score);
//         setOverallScoreState(score);
//       } else {
//         console.log(`🆕 No cached score for resume ${resumeId} - starting at 0`);
//         setOverallScoreState(0);
//       }
//     } else {
//       console.log("ℹ️ No resume ID - starting with score 0");
//       setOverallScoreState(0);
//     }
//   }, []);

//   // ✅ Update localStorage with resume-specific key
//   const setOverallScore = useCallback((score: number) => {
//     setOverallScoreState(score);
    
//     if (typeof window !== 'undefined') {
//       const resumeId = getCurrentResumeId();
//       if (resumeId) {
//         const scoreKey = getScoreKey(resumeId);
//         localStorage.setItem(scoreKey, score.toString());
//         console.log(`💾 Score saved for resume ${resumeId}:`, score);
//       }
//     }
//   }, []);

//   // ✅ Watch for resume ID changes and update score
//   useEffect(() => {
//     const checkResumeIdChange = () => {
//       const newResumeId = getCurrentResumeId();
      
//       // ✅ If resume ID changed, load score for new resume
//       if (newResumeId !== currentResumeId) {
//         console.log(`🔄 Resume ID changed from ${currentResumeId} to ${newResumeId}`);
//         setCurrentResumeId(newResumeId);
        
//         if (newResumeId) {
//           const scoreKey = getScoreKey(newResumeId);
//           const stored = localStorage.getItem(scoreKey);
          
//           if (stored) {
//             const parsed = parseInt(stored, 10);
//             const newScore = isNaN(parsed) ? 0 : parsed;
//             console.log(`📊 Loaded cached score for resume ${newResumeId}:`, newScore);
//             setOverallScoreState(newScore);
//           } else {
//             console.log(`🆕 New resume ${newResumeId} - resetting score to 0`);
//             setOverallScoreState(0);
//           }
//         } else {
//           console.log("ℹ️ No resume ID - resetting score to 0");
//           setOverallScoreState(0);
//         }
//       }
//     };

//     // Check immediately
//     checkResumeIdChange();

//     // ✅ Set up interval to check for resume ID changes
//     const interval = setInterval(checkResumeIdChange, 1000);

//     return () => clearInterval(interval);
//   }, [currentResumeId]);

//   const refreshScore = useCallback(() => {
//     setRefreshTrigger(prev => prev + 1);
//   }, []);

//   // ✅ Reset score (for new resume)
//   const resetScore = useCallback(() => {
//     setOverallScoreState(0);
    
//     const resumeId = getCurrentResumeId();
//     if (resumeId && typeof window !== 'undefined') {
//       const scoreKey = getScoreKey(resumeId);
//       localStorage.removeItem(scoreKey);
//       console.log(`🗑️ Removed cached score for resume ${resumeId}`);
//     }
    
//     console.log("🔄 Score reset to 0");
//   }, []);

//   return (
//     <ScoreContext.Provider value={{ 
//       overallScore, 
//       setOverallScore, 
//       refreshScore,
//       resetScore 
//     }}>
//       {children}
//     </ScoreContext.Provider>
//   );
// };

// export const useScore = () => {
//   const context = useContext(ScoreContext);
//   if (!context) {
//     throw new Error("useScore must be used within ScoreProvider");
//   }
//   return context;
// }; before score takinng too time


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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
        const parsed = parseInt(stored, 10);
        const score = isNaN(parsed) ? 0 : parsed;
        console.log(`📊 Loaded cached score for resume ${resumeId}:`, score);
        setOverallScoreState(score);
      } else {
        console.log(`🆕 No cached score for resume ${resumeId} - starting at 0`);
        setOverallScoreState(0);
      }
    } else {
      console.log("ℹ️ No resume ID - starting with score 0");
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
        console.log(`💾 Score saved for resume ${resumeId}:`, score);
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
        console.log(`🗑️ Removed cached score for resume ${resumeId}`);
      }
    }
    
    console.log("🔄 Score reset to 0");
  }, []);

  // ✅ Use storage event listener instead of polling interval
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to current_resume_id changes
      if (e.key === 'current_resume_id') {
        const newResumeId = e.newValue;
        
        console.log(`🔄 Resume ID changed to ${newResumeId} (detected via storage event)`);
        setCurrentResumeId(newResumeId);
        
        if (newResumeId) {
          const scoreKey = getScoreKey(newResumeId);
          const stored = localStorage.getItem(scoreKey);
          
          if (stored) {
            const parsed = parseInt(stored, 10);
            const newScore = isNaN(parsed) ? 0 : parsed;
            console.log(`📊 Loaded cached score for resume ${newResumeId}:`, newScore);
            setOverallScoreState(newScore);
          } else {
            console.log(`🆕 New resume ${newResumeId} - resetting score to 0`);
            setOverallScoreState(0);
          }
        } else {
          console.log("ℹ️ No resume ID - resetting score to 0");
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
          console.log(`🔄 Resume ID changed from ${currentResumeId} to ${newResumeId} (visibility change)`);
          setCurrentResumeId(newResumeId);
          
          if (newResumeId) {
            const scoreKey = getScoreKey(newResumeId);
            const stored = localStorage.getItem(scoreKey);
            
            if (stored) {
              const parsed = parseInt(stored, 10);
              const newScore = isNaN(parsed) ? 0 : parsed;
              console.log(`📊 Loaded cached score for resume ${newResumeId}:`, newScore);
              setOverallScoreState(newScore);
            } else {
              console.log(`🆕 New resume ${newResumeId} - resetting score to 0`);
              setOverallScoreState(0);
            }
          } else {
            console.log("ℹ️ No resume ID - resetting score to 0");
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
    setRefreshTrigger(prev => prev + 1);
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

