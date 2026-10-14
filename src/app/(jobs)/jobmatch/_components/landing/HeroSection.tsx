"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  onAnalyzeClick?: () => void;
}

export default function HeroSection({ onAnalyzeClick }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="jobmatch-hero-title">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <h1 id="jobmatch-hero-title" className={styles.heading}>
            Check your resume<br />
            against <span>any job<br />description</span>
          </h1>
          <p className={styles.description}>
            Upload your resume and add a job description to see your match score,
            skill gaps, and actionable suggestions to improve your application.
          </p>
          <button type="button" className={styles.action} onClick={onAnalyzeClick}>
            Check My Resume <ArrowRight aria-hidden="true" />
          </button>
          <ul className={styles.trust} aria-label="Resume analysis benefits">
            <li><Image src="/images/jobmatch-reference/free-to-start-icon.svg" width={14} height={14} alt="" unoptimized />Free to start</li>
            <li><Image src="/images/jobmatch-reference/takes-about-a-minute-icon.svg" width={14} height={14} alt="" unoptimized />Takes about a minute</li>
            <li>
              <Image src="/images/jobmatch-reference/your-files-stay-private-icon.svg" width={12} height={14} alt="" unoptimized />
              Your files stay private
            </li>
          </ul>
        </div>
        <Image
          className={styles.artwork}
          src="/images/jobmatch-hero-direct.svg"
          alt="A resume and Product Designer job description behind a laptop displaying CareerBOT match analysis."
          width={839}
          height={397}
          sizes="(max-width: 999px) 90vw, (max-width: 1797px) 58.32vw, 1048px"
          priority
          unoptimized
        />
      </div>
    </section>
  );
}
