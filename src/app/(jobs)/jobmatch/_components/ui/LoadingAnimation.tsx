"use client";

import React from "react";
import { Check, Info } from "lucide-react";
import styles from "./LoadingAnimation.module.css";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

const STAGES: Record<LoadingStage, { percent: number; active: number }> = {
  parsing: { percent: 20, active: 0 },
  extracting: { percent: 40, active: 0 },
  matching: { percent: 65, active: 2 },
  scoring: { percent: 82, active: 3 },
  generating: { percent: 94, active: 3 },
};

const TASKS = [
  { title: "Analyzing your resume", detail: "Extracting key skills, experience and qualifications" },
  { title: "Analyzing job description", detail: "Identifying key requirements and skills" },
  { title: "Matching skills & requirements", detail: "Comparing your profile with the job requirements" },
  { title: "Generating recommendations", detail: "Preparing your detailed match results" },
] as const;

export default function LoadingAnimation({ stage }: { readonly stage: LoadingStage }) {
  const { percent, active } = STAGES[stage];
  const radius = 51;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className={styles.content} aria-labelledby="analyzing-match-title" aria-live="polite">
      <header className={styles.header}>
        <h1 id="analyzing-match-title">Analyzing Your Match</h1>
        <p>We’re analyzing your resume against the job description. This may take a few moments.</p>
      </header>
      <div className={styles.activity} aria-label="Analysis progress">
        <div className={styles.gauge} role="img" aria-label={`${percent}% complete`}>
          <svg viewBox="0 0 124 124" aria-hidden="true">
            <circle cx="62" cy="62" r={radius} fill="none" stroke="#dce8f8" strokeWidth="10" />
            <circle cx="62" cy="62" r={radius} fill="none" stroke="#08a653" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} />
          </svg>
          <div><strong>{percent}%</strong><span>Analyzing...</span></div>
        </div>
        <ol className={styles.tasks}>
          {TASKS.map((task, index) => {
            const complete = index < active;
            const current = index === active;
            return <li key={task.title}>
              <span className={styles.statusIcon} data-complete={complete} data-current={current} aria-hidden="true">
                {complete ? <Check /> : current ? <span>•••</span> : null}
              </span>
              <div><strong>{task.title}</strong><p>{task.detail}</p></div>
            </li>;
          })}
        </ol>
      </div>
      <aside className={styles.notice}>
        <span><Info aria-hidden="true" /></span>
        <div><strong>Analysis is in progress</strong><p>Please keep this window open. Your match results will appear here as soon as the analysis is complete.</p></div>
      </aside>
    </section>
  );
}
