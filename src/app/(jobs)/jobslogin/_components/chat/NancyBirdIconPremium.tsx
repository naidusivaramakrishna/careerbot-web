"use client";

interface NancyBirdIconPremiumProps {
  size?: number;
  animated?: boolean;
}

export default function NancyBirdIconPremium({
  size = 36,
  animated = true,
}: NancyBirdIconPremiumProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? "animate-nancy-glow" : ""}
    >
      <defs>
        {/* Gradient: Brand Blue → AI Cyan */}
        <linearGradient id="nancyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="nancyGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Animated Halo Ring */}
      {animated && (
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="url(#nancyGradient)"
          strokeWidth="0.5"
          opacity="0.3"
          className="animate-nancy-pulse-ring"
        />
      )}

      {/* Main Bird Body */}
      <g filter={animated ? "url(#nancyGlow)" : "none"}>
        {/* Core circle */}
        <circle cx="20" cy="20" r="9" fill="url(#nancyGradient)" />

        {/* Left wing */}
        <path
          d="M 12 20 Q 6 18 5 22 Q 6 25 12 23"
          fill="url(#nancyGradient)"
          opacity="0.85"
        />

        {/* Right wing */}
        <path
          d="M 28 20 Q 34 18 35 22 Q 34 25 28 23"
          fill="url(#nancyGradient)"
          opacity="0.9"
        />

        {/* Tail */}
        <path
          d="M 10 22 Q 6 24 4 21"
          stroke="url(#nancyGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Eye */}
        <circle cx="22" cy="18" r="1.5" fill="white" opacity="0.9" />

        {/* Highlight */}
        <circle cx="23" cy="19" r="0.5" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}
