"use client";

interface NancyBirdIconMinimalProps {
  size?: number;
}

export default function NancyBirdIconMinimal({
  size = 24,
}: NancyBirdIconMinimalProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple geometric bird: circle body with minimal accent */}

      {/* Main body circle */}
      <circle cx="12" cy="12" r="8" fill="#2563EB" opacity="0.9" />

      {/* Left wing - subtle geometric shape */}
      <path
        d="M 6 11 L 4 12 L 6 13"
        stroke="#2563EB"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />

      {/* Right wing - subtle geometric shape */}
      <path
        d="M 18 11 L 20 12 L 18 13"
        stroke="#2563EB"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />

      {/* Small eye dot */}
      <circle cx="13" cy="11" r="1" fill="white" />
    </svg>
  );
}
