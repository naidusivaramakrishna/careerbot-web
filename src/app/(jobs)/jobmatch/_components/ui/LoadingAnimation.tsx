"use client";

import React from "react";
import { FileText, Search, Sparkles, Target, TrendingUp, CheckCircle2 } from "lucide-react";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

interface LoadingAnimationProps {
  stage: LoadingStage;
}

const stages = [
  {
    id: "parsing",
    label: "Parsing Resume",
    description: "Analyzing document structure and extracting content",
    icon: FileText,
    gradient: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-600",
    iconColor: "text-slate-600",
    progressColor: "from-slate-500 to-slate-600"
  },
  {
    id: "extracting",
    label: "Extracting Skills",
    description: "Identifying technical and soft skills from experience",
    icon: Search,
    gradient: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-500",
    iconColor: "text-blue-500",
    progressColor: "from-slate-500 via-blue-400 to-blue-500"
  },
  {
    id: "matching",
    label: "Matching Requirements",
    description: "Comparing skills with job description criteria",
    icon: Target,
    gradient: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-600",
    iconColor: "text-indigo-600",
    progressColor: "from-slate-500 via-blue-500 to-indigo-600"
  },
  {
    id: "scoring",
    label: "Calculating Score",
    description: "Computing compatibility and ATS optimization score",
    icon: TrendingUp,
    gradient: "from-violet-500 to-violet-600",
    bgColor: "bg-violet-600",
    iconColor: "text-violet-600",
    progressColor: "from-slate-500 via-indigo-500 to-violet-600"
  },
  {
    id: "generating",
    label: "Generating Report",
    description: "Preparing detailed analysis and recommendations",
    icon: Sparkles,
    gradient: "from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-500",
    iconColor: "text-emerald-500",
    progressColor: "from-slate-500 via-violet-500 to-emerald-500"
  },
];

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ stage }) => {
  const currentIndex = stages.findIndex((s) => s.id === stage);
  const currentStage = stages[currentIndex];
  const CurrentIcon = currentStage?.icon || FileText;
  const progress = ((currentIndex + 1) / stages.length) * 100;

  // Get color for circular progress based on stage
  const getStageColor = () => {
    switch (stage) {
      case 'parsing': return { start: '#64748b', end: '#475569' };
      case 'extracting': return { start: '#60a5fa', end: '#3b82f6' };
      case 'matching': return { start: '#6366f1', end: '#4f46e5' };
      case 'scoring': return { start: '#8b5cf6', end: '#7c3aed' };
      case 'generating': return { start: '#34d399', end: '#10b981' };
      default: return { start: '#64748b', end: '#475569' };
    }
  };

  const stageColor = getStageColor();

  return (
    <div className="w-full bg-gray-100 rounded-3xl px-12 py-10 min-h-[800px] flex items-center justify-center">
      <div className="w-full max-w-5xl">

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">

          {/* Header with Gradient Background */}
          <div className={`relative bg-gradient-to-r ${currentStage?.gradient} px-8 py-10 text-center overflow-hidden`}>
            {/* Animated Background Waves */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse"></div>
            </div>

            {/* Floating Icon */}
            <div className="relative z-10 mb-5">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/25 backdrop-blur-sm rounded-xl border border-white/20">
                <CurrentIcon className="w-8 h-8 text-white animate-pulse" strokeWidth={2} />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold text-white mb-2">
              {currentStage?.label}
            </h1>
            <p className="text-white/80 text-sm max-w-xl mx-auto">
              {currentStage?.description}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-5 gap-3 mb-6">
              {stages.map((s, idx) => {
                const Icon = s.icon;
                const isActive = idx === currentIndex;
                const isCompleted = idx < currentIndex;

                return (
                  <div key={s.id} className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center mb-2 transition-all duration-500
                      ${isCompleted
                        ? s.bgColor
                        : isActive
                          ? `${s.bgColor} animate-pulse`
                          : 'bg-gray-100 border border-gray-200'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2} />
                      ) : (
                        <Icon
                          className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`}
                          strokeWidth={1.5}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <p className={`
                      text-[11px] font-semibold mb-1 transition-colors leading-tight
                      ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {s.label}
                    </p>

                    {/* Status */}
                    {isCompleted && (
                      <span className={`text-[9px] font-semibold text-white ${s.bgColor} px-2 py-0.5 rounded-full opacity-80`}>
                        Done
                      </span>
                    )}
                    {isActive && (
                      <span className={`text-[9px] font-semibold text-white ${s.bgColor} px-2 py-0.5 rounded-full animate-pulse`}>
                        In Progress
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Circular Progress Card */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-semibold text-gray-700 mb-6">Overall Progress</p>

                {/* Circular Progress Ring */}
                <div className="relative w-56 h-56 mb-6">
                  {/* Background Circle */}
                  <svg className="transform -rotate-90 w-56 h-56">
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200"
                    />
                    {/* Progress Circle with Gradient */}
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 100}`}
                      strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
                      className="transition-all duration-700 ease-out"
                      style={{
                        filter: `drop-shadow(0 0 8px ${stageColor.start}80)`
                      }}
                    />
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={stageColor.start} stopOpacity="1" />
                        <stop offset="100%" stopColor={stageColor.end} stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${currentStage?.bgColor} animate-pulse`}>
                      <CurrentIcon className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                    <span className={`text-4xl font-bold ${currentStage?.iconColor}`}>
                      {Math.round(progress)}%
                    </span>
                    <span className="text-xs font-medium text-gray-500 mt-1">
                      Complete
                    </span>
                  </div>
                </div>

                {/* Progress Info */}
                <div className="flex items-center justify-center gap-6 w-full">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${currentStage?.bgColor} rounded-full animate-pulse`}></div>
                    <span className="text-xs font-medium text-gray-600">
                      Step {currentIndex + 1} of {stages.length}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    ~{Math.ceil((stages.length - currentIndex) * 2)} seconds remaining
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingAnimation;
