"use client";

import React from "react";
import { ArrowRight, ClipboardCheck, ChartNoAxesColumnIncreasing, Clock3, FileText, FileUp, Layers, Upload, Zap } from "lucide-react";
import styles from "./JobMatchStartCard.module.css";

const STEPS = [
  { title: "Upload Resume", description: "Upload your resume to get started.", icon: FileUp },
  { title: "Add Job Description", description: "Add the job description you're targeting.", icon: FileText },
  { title: "Review & Confirm", description: "Review your resume and job details before analysis.", icon: ClipboardCheck },
  { title: "Analyze Match", description: "AI analyzes your resume against the job requirements.", icon: ChartNoAxesColumnIncreasing },
] as const;

function MatchIllustration() {
  const id = React.useId();
  return (
    <svg className={styles.illustration} viewBox="0 0 600 342" role="img" aria-label="Your resume and job description are compared by AI to produce a match analysis." xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id + "-halo"} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#eaf5ff" /><stop offset="1" stopColor="#dcecff" />
        </linearGradient>
        <linearGradient id={id + "-ai"} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#2aafff" /><stop offset="1" stopColor="#005bea" />
        </linearGradient>
        <linearGradient id={id + "-ring"} x1="0" y1="0" x2="1" y2=".5">
          <stop stopColor="#2ec6ff" /><stop offset="1" stopColor="#0755ff" />
        </linearGradient>
        <filter id={id + "-shadow"} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#6aa9ff" floodOpacity=".12" />
        </filter>
      </defs>
      <ellipse cx="183" cy="174" rx="178" ry="143" fill={"url(#" + id + "-halo)"} opacity=".78" />
      <ellipse cx="407" cy="166" rx="180" ry="156" fill={"url(#" + id + "-halo)"} opacity=".47" />
      <g transform="rotate(-9 134 150)" filter={"url(#" + id + "-shadow)"}>
        <rect x="54" y="65" width="160" height="168" rx="12" fill="#fff" stroke="#dceaff" strokeWidth="1.5" />
        <text x="74" y="94" fill="#101637" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700">Your Resume</text>
        <rect x="74" y="109" width="35" height="35" rx="4" fill="#e1edff" />
        <circle cx="91.5" cy="121" r="7" fill="#8ab0e8" />
        <path d="M79 143v-3c0-12 25-12 25 0v3" fill="#8ab0e8" />
        <g fill="#d3e1f5">
          <rect x="120" y="111" width="72" height="8" rx="4" />
          <rect x="120" y="127" width="72" height="8" rx="4" />
          <rect x="74" y="156" width="118" height="8" rx="4" />
          <rect x="74" y="172" width="118" height="8" rx="4" />
          <rect x="74" y="188" width="118" height="8" rx="4" />
          <rect x="74" y="204" width="80" height="8" rx="4" />
        </g>
      </g>
      <g transform="rotate(7 476 153)" filter={"url(#" + id + "-shadow)"}>
        <rect x="398" y="78" width="157" height="151" rx="12" fill="#fff" stroke="#dceaff" strokeWidth="1.5" />
        <text x="419" y="108" fill="#101637" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700">Job Description</text>
        <g fill="#d3e1f5">
          <rect x="419" y="123" width="113" height="8" rx="4" />
          <rect x="419" y="141" width="113" height="8" rx="4" />
          <rect x="419" y="159" width="113" height="8" rx="4" />
          <rect x="419" y="177" width="113" height="8" rx="4" />
          <rect x="419" y="195" width="79" height="8" rx="4" />
        </g>
      </g>
      <g stroke="#0966ff" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M224 151h28m-10-6 10 6-10 6" />
        <path d="M355 151h28m-10-6 10 6-10 6" />
        <path d="M305 200v32m-6-10 6 10 6-10" />
      </g>
      <rect x="263" y="112" width="83" height="80" rx="14" fill={"url(#" + id + "-ai)"} stroke="#78c5ff" strokeOpacity=".6" filter={"url(#" + id + "-shadow)"} />
      <text x="286" y="165" fill="white" fontFamily="Arial, sans-serif" fontSize="33">AI</text>
      <path d="m324 126 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="white" />
      <path d="m282 170 1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3Z" fill="#85c7ff" opacity=".8" />
      <g filter={"url(#" + id + "-shadow)"}>
        <rect x="169" y="244" width="274" height="70" rx="28" fill="#fff" fillOpacity=".96" stroke="#d5e7ff" strokeWidth="1.5" />
        <circle cx="215" cy="279" r="20" fill="none" stroke={"url(#" + id + "-ring)"} strokeWidth="6" />
        <text x="253" y="271" fill="#101637" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700">Match Analysis</text>
        <rect x="253" y="282" width="162" height="10" rx="5" fill="#d3e1f5" />
        <rect x="253" y="282" width="68" height="10" rx="5" fill={"url(#" + id + "-ai)"} />
      </g>
    </svg>
  );
}

interface JobMatchStartCardProps {
  readonly mounted: boolean;
  readonly onStart: () => void;
}

export default function JobMatchStartCard({ onStart }: JobMatchStartCardProps) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <span className={styles.badge}>AI-POWERED</span>
          <h1>Job <span>Match</span></h1>
          <p>Get a detailed analysis of how well your resume matches<br className={styles.copyBreak} />{" "}a job description and discover ways to improve.</p>
        </div>
        <MatchIllustration />
      </header>
      <section className={styles.workflow} aria-labelledby="match-workflow-title">
        <h2 id="match-workflow-title">How It Works</h2>
        <p className={styles.subtitle}>A simple 4-step process to find your job match.</p>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.icon}><step.icon aria-hidden="true" /></span>
              <div className={styles.stepText}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < STEPS.length - 1 && <span className={styles.stepArrow} aria-hidden="true">⟶</span>}
            </li>
          ))}
        </ol>
      </section>
      <section className={styles.startBar} aria-label="Start matching your resume">
          <span className={styles.uploadIcon}><Upload aria-hidden="true" /></span>
          <div className={styles.startBarText}>
            <h3>Upload your resume to start matching</h3>
            <p>Analysis starts after your resume and job description are added.</p>
            <ul className={styles.meta}>
              <li><Zap aria-hidden="true" /> Four steps</li>
              <li><Clock3 aria-hidden="true" /> About a minute</li>
              <li><Layers aria-hidden="true" /> Uses 1 credit</li>
            </ul>
          </div>
          <button type="button" onClick={onStart}>Upload Resume <ArrowRight aria-hidden="true" /></button>
      </section>
    </div>
  );
}
