"use client";

import React, { useState, useEffect } from "react";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

interface LoadingAnimationProps {
  stage: LoadingStage;
}

const stageMessages: Record<LoadingStage, string> = {
  parsing: "Parsing your resume...",
  extracting: "Extracting skills...",
  matching: "Matching requirements...",
  scoring: "Calculating score...",
  generating: "Generating report..."
};

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ stage }) => {
  const [progress, setProgress] = useState(24);
  const [phase, setPhase] = useState<"setup" | "merge">("setup");

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (phase === "setup") {
      const interval = setInterval(() => {
        setProgress((p) => {
          const newProgress = Math.min(p + Math.random() * 15, 100);
          if (newProgress >= 100) {
            setPhase("merge");
            return 100;
          }
          return newProgress;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
        backdropFilter: 'blur(0px)',
        WebkitBackdropFilter: 'blur(0px)',
      }}
    >
      <style>{`
        @keyframes pulse-cube {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes float-cube {
          0%, 100% { transform: translate(0, 0) rotateY(0deg); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translate(var(--tx), var(--ty)) rotateY(180deg); }
          90% { opacity: 1; }
          100% { transform: translate(0, 0) rotateY(360deg); opacity: 0; }
        }
        @keyframes merge-cube {
          0% { transform: scale(0.3) rotateX(0deg) rotateY(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1) rotateX(360deg) rotateY(360deg); opacity: 1; }
        }
        @keyframes shimmer-reflection {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .pulse-cube { animation: pulse-cube 2s ease-in-out infinite; }
        .float-cube { animation: float-cube 3s ease-in-out infinite; }
        .merge-cube { animation: merge-cube 1.5s ease-out forwards; }
        .shimmer-reflection { animation: shimmer-reflection 2s ease-in-out infinite; }
      `}</style>

      <div className="text-center relative" style={{ marginRight: '150px' }}>
        {/* Setup Phase */}
        {phase === "setup" && (
          <div className="space-y-8">
            {/* Small Pulsing Cube */}
            <div className="flex justify-center" style={{ perspective: '1000px' }}>
              <div
                className="pulse-cube"
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #2557a7 0%, #1a3a7a 100%)',
                  borderRadius: '8px',
                  transformStyle: 'preserve-3d',
                  boxShadow: '0 8px 30px rgba(37, 87, 167, 0.2)',
                }}
              />
            </div>

            {/* Progress Section */}
            <div className="space-y-5">
              <p className="text-6xl font-bold text-gray-900 tracking-wider">
                {Math.round(progress)}%
              </p>
              <p className="text-lg text-gray-700 font-medium tracking-wide">
                {stageMessages[stage]}
              </p>

              {/* Progress Bar */}
              <div className="w-72 h-2.5 bg-gray-300 rounded-full overflow-hidden shadow-sm">
                <div
                  className="h-full bg-gradient-to-r from-[#2557a7] to-[#1a3a7a] transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Merge Phase */}
        {phase === "merge" && (
          <div className="space-y-16" style={{ perspective: '1200px' }}>
            {/* Floating Cubes Container */}
            <div
              style={{
                width: '300px',
                height: '300px',
                position: 'relative',
              }}
            >
              {/* Center Merging Cube */}
              <div
                className="merge-cube"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #2557a7 0%, #1a3a7a 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(37, 87, 167, 0.3)',
                }}
              />

              {/* Orbiting Cubes */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="float-cube"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #2557a7 0%, #1a3a7a 100%)',
                    borderRadius: '8px',
                    boxShadow: '0 6px 20px rgba(37, 87, 167, 0.25)',
                    '--tx': `${Math.cos((i * Math.PI * 2) / 3) * 120}px`,
                    '--ty': `${Math.sin((i * Math.PI * 2) / 3) * 120}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Reflection */}
            <div className="flex justify-center">
              <div
                className="shimmer-reflection"
                style={{
                  width: '150px',
                  height: '50px',
                  background: 'radial-gradient(ellipse at center, rgba(37, 87, 167, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(20px)',
                }}
              />
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-2xl text-gray-900 font-bold tracking-tight mb-2">
                  Processing Your Application
                </p>
                <p className="text-base text-gray-700 tracking-wide">
                  {stageMessages[stage]}
                </p>
              </div>

              {/* Process Steps with Progress */}
              <div className="space-y-3 max-w-xs">
                {['parsing', 'extracting', 'matching', 'scoring', 'generating'].map((step, index) => {
                  const stepLabels: Record<string, string> = {
                    parsing: 'Parsing Resume',
                    extracting: 'Extracting Skills',
                    matching: 'Matching Requirements',
                    scoring: 'Calculating Score',
                    generating: 'Finalizing Report',
                  };

                  const isActive = stage === step;
                  const isComplete = ['parsing', 'extracting', 'matching', 'scoring'].indexOf(stage) > index;

                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isComplete ? '#10b981' : isActive ? '#2557a7' : '#d1d5db',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <p
                        style={{
                          fontSize: '14px',
                          color: isActive ? '#2557a7' : isComplete ? '#10b981' : '#6b7280',
                          fontWeight: isActive ? '600' : '400',
                        }}
                      >
                        {stepLabels[step]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation;
