"use client";

import Image from "next/image";
import { ArrowRight, ClipboardCheck, ChartNoAxesColumnIncreasing, Clock3, FileText, FileUp, Layers, Upload, Zap } from "lucide-react";
import styles from "./JobMatchStartCard.module.css";

const STEPS = [
  { title: "Upload Resume", description: "Upload your resume to get started.", icon: FileUp },
  { title: "Add Job Description", description: "Add the job description you're targeting.", icon: FileText },
  { title: "Review & Confirm", description: "Review your resume and job details before analysis.", icon: ClipboardCheck },
  { title: "Analyze Match", description: "AI analyzes your resume against the job requirements.", icon: ChartNoAxesColumnIncreasing },
] as const;

function MatchIllustration() {
  return (
    <Image
      className={styles.illustration}
      src="/images/Job match hero image.svg"
      alt="Your resume and job description are compared by AI to produce a match analysis."
      width={847}
      height={431}
      unoptimized
    />
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
              {index < STEPS.length - 1 && <span className={styles.stepArrow} aria-hidden="true"></span>}
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
