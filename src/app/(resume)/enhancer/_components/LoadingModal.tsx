'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  { label: 'Uploading resume', sub: 'Securely transferring your file' },
  { label: 'Parsing content', sub: 'Extracting text and structure' },
  { label: 'AI analysis', sub: 'Scanning for ATS issues and gaps' },
  { label: 'Generating report', sub: 'Building improvement suggestions' },
];

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LoadingModal() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 28000; // ~28s to reach 100

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const next = Math.min(Math.floor((elapsed / DURATION) * 100), 99);
      setProgress(next);
      if (next < 99) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const activeStep = progress < 25 ? 0 : progress < 50 ? 1 : progress < 80 ? 2 : 3;
  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-8">
          {/* Circular progress spinner */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-28 h-28 mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Track */}
                <circle
                  cx="50" cy="50" r={RADIUS}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Progress arc */}
                <circle
                  cx="50" cy="50" r={RADIUS}
                  fill="none"
                  stroke="url(#blueGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
                <defs>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2557a7" />
                    <stop offset="100%" stopColor="#4f8ef7" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Percentage label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#2557a7]">{progress}%</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Enhancing Your Resume</h2>
            <p className="text-sm text-gray-500 text-center">Our AI is analyzing and optimizing your document</p>
          </div>

          {/* Steps */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            {steps.map((step, i) => {
              const isDone = i < activeStep;
              const isActive = i === activeStep;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    isActive ? 'bg-white shadow-sm border border-blue-50' : ''
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg className="w-5 h-5 animate-spin text-[#2557a7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isActive && <p className="text-xs text-blue-500 mt-0.5">{step.sub}</p>}
                    {isDone && <p className="text-xs text-green-500 mt-0.5">Completed</p>}
                  </div>

                  {isDone && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Done</span>
                  )}
                  {isActive && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium animate-pulse">In progress</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-400">This usually takes 15–30 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
