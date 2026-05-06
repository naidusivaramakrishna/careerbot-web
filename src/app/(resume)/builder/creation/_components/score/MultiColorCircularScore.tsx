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

  const greenVal = Math.min(animatedValue, greenMax);
  const orangeVal =
    animatedValue > greenMax
      ? Math.min(animatedValue - greenMax, orangeMax - greenMax)
      : 0;
  const redVal = animatedValue > orangeMax ? animatedValue - orangeMax : 0;

  return (
    <div className="relative w-40 h-40">
      {/* Green layer */}
      <CircularProgressbarWithChildren
        value={greenVal}
        maxValue={100}
        styles={buildStyles({
          pathColor: "#16a34a", // green
          trailColor: "transparent",
        })}
      >
        {/* Orange layer */}
        <CircularProgressbarWithChildren
          value={greenVal + orangeVal}
          maxValue={100}
          styles={buildStyles({
            pathColor: "#f59e0b", // orange
            trailColor: "transparent",
          })}
        >
          {/* Red layer */}
          <CircularProgressbarWithChildren
            value={greenVal + orangeVal + redVal}
            maxValue={100}
            styles={buildStyles({
              pathColor: "#ef4444", // red
              trailColor: "#e5e7eb", // gray background
            })}
          >
            {/* Center text */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-gray-800">
                {animatedValue}
              </span>
              {/* Optional label */}
              {/* <span className="text-xs uppercase tracking-wide text-gray-500">
                Resume Score
              </span> */}
            </div>
          </CircularProgressbarWithChildren>
        </CircularProgressbarWithChildren>
      </CircularProgressbarWithChildren>
    </div>
  );
}
