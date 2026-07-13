"use client";

interface SparklineProps {
  points: number[];
  stroke: string;
  className?: string;
}

export default function Sparkline({ points, stroke, className = "" }: SparklineProps) {
  const width = 60;
  const height = 16;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path d={path} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}
