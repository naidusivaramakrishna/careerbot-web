"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

interface LoadingAnimationProps {
  stage: LoadingStage;
}

const steps: { key: LoadingStage; label: string; sub: string }[] = [
  { key: "parsing",    label: "Parsing Resume",         sub: "Reading your document structure" },
  { key: "extracting", label: "Extracting Skills",       sub: "Identifying key competencies" },
  { key: "matching",   label: "Matching Requirements",   sub: "Comparing with job description" },
  { key: "scoring",    label: "Calculating Score",       sub: "Running compatibility analysis" },
  { key: "generating", label: "Generating Report",       sub: "Building your match insights" },
];

const stageIndex = (stage: LoadingStage) => steps.findIndex((s) => s.key === stage);

/* SVG circle spinner radius */
const R = 44;
const CIRC = 2 * Math.PI * R;

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ stage }) => {
  const [progress, setProgress] = useState(0);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  useEffect(() => { setPortalTarget(document.body); }, []);

  /* Lock body scroll */
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);

  /* Animate progress continuously across all stages.
     Each of the 5 stages owns a 20% band (0-20, 20-40, ..., 80-100). */
  useEffect(() => {
    const idx = stageIndex(stage);
    const bandStart = idx * 20;
    const bandEnd   = bandStart + 20;

    setProgress((prev) => {
      // Never go backwards — jump to band start if we're somehow behind
      return Math.max(prev, bandStart);
    });

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 2 + 0.5;
        if (next >= bandEnd) { clearInterval(interval); return bandEnd; }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [stage]);

  const pct = Math.round(Math.min(progress, 100));
  const dashOffset = CIRC - (CIRC * pct) / 100;
  const activeIdx = stageIndex(stage);

  if (!portalTarget) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <style>{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes spin-rev  { to { transform: rotate(-360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .spin-slow { animation: spin-slow 3s linear infinite; }
        .spin-rev  { animation: spin-rev  2s linear infinite; }
        .fade-up   { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div className="flex flex-col items-center gap-10 px-6 w-full max-w-sm">

        {/* ── Circular progress spinner ── */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {/* Outer decorative ring */}
          <svg className="absolute inset-0 spin-slow" width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="76" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 6" />
          </svg>

          {/* Inner decorative ring */}
          <svg className="absolute spin-rev" width="130" height="130" viewBox="0 0 130 130" style={{ top: 15, left: 15 }}>
            <circle cx="65" cy="65" r="61" fill="none" stroke="#dbeafe" strokeWidth="1.5" strokeDasharray="4 8" />
          </svg>

          {/* Progress track */}
          <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke="url(#progressGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.12s linear" }}
            />
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2557a7" />
                <stop offset="100%" stopColor="#4f8ef7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 leading-none">{pct}%</span>
            <span className="text-xs text-gray-400 mt-1 font-medium">analyzing</span>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="text-center -mt-4">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Analyzing Your Match</h2>
          <p className="text-sm text-gray-400 mt-1">AI is comparing your resume with the job description</p>
        </div>

        {/* ── Steps ── */}
        <div className="w-full space-y-2">
          {steps.map((step, i) => {
            const isDone   = i < activeIdx;
            const isActive = i === activeIdx;
            const isPending = !isDone && !isActive;
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? "bg-blue-50 border-blue-200 shadow-sm fade-up"
                    : isDone
                    ? "bg-green-50/60 border-green-100"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                {/* Step number / icon */}
                <div className="shrink-0">
                  {isDone ? (
                    <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-9 h-9 rounded-full bg-[#2557a7] flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${
                    isDone ? "text-green-700 line-through decoration-green-400" : isActive ? "text-[#2557a7]" : "text-gray-400"
                  }`}>
                    {step.label}
                  </p>
                  {isActive  && <p className="text-xs text-blue-400 mt-0.5 font-medium">{step.sub}</p>}
                  {isDone    && <p className="text-xs text-green-500 mt-0.5 font-medium">Completed</p>}
                  {isPending && <p className="text-xs text-gray-300 mt-0.5">Waiting...</p>}
                </div>

                {/* Right pill */}
                {isDone   && (
                  <span className="shrink-0 text-xs text-green-600 bg-green-100 px-2.5 py-1 rounded-full font-semibold">✓ Done</span>
                )}
                {isActive && (
                  <span className="shrink-0 text-xs text-[#2557a7] bg-blue-100 px-2.5 py-1 rounded-full font-semibold animate-pulse">Running</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Bottom note ── */}
        <div className="flex items-center gap-1.5 -mt-4">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-gray-400">This usually takes 15–30 seconds</p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, portalTarget);
};

export default LoadingAnimation;
