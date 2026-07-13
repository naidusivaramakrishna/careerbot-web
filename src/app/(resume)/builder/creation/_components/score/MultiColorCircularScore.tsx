"use client";
import React, { useEffect, useState } from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface Props {
  /** Score from 0–100 */
  value: number;
  /** Animation duration in ms (default 800) */
  duration?: number;
}

export default function MultiColorCircularScore({
  value,
  duration = 800,
}: Props) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate on value change
  useEffect(() => {
    let start: number | null = null;
    const from = animatedValue;
    const to = value;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Keep one decimal place during animation, settle to exact value at end
      const current = progress < 1
        ? Math.round((from + (to - from) * progress) * 10) / 10
        : to;
      setAnimatedValue(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  // Segment cutoffs
  const greenMax = 70;
  const orangeMax = 90;

  const pathColor =
    animatedValue > orangeMax ? "#ef4444" // red
      : animatedValue > greenMax ? "#f59e0b" // orange
      : "#16a34a"; // green

  return (
    <div className="relative w-full h-full">
      <CircularProgressbarWithChildren
        value={animatedValue}
        maxValue={100}
        styles={buildStyles({
          pathColor,
          trailColor: "#e5e7eb", // gray background — always visible for the unfilled remainder
        })}
      >
        {/* Center text */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-gray-800">
            {animatedValue}
          </span>
          {/* Optional label */}
          {/* <span className="text-xs uppercase tracking-wide text-gray-500">
            Resume Score
          </span> */}
        </div>
      </CircularProgressbarWithChildren>
    </div>
  );
}
