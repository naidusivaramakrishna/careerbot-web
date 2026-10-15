"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import styles from "./FinalCTASection.module.css";

interface FinalCTASectionProps {
  readonly onAnalyzeClick: () => void;
}

export default function FinalCTASection({ onAnalyzeClick }: FinalCTASectionProps) {
  return (
    <section className={styles.section} aria-labelledby="jobmatch-final-cta-title">
      <Image
        className={`${styles.artwork} ${styles.leftArtwork}`}
        src="/images/jobmatch-reference/cta-card1.png"
        alt="Resume match score of 78 percent"
        width={1024}
        height={1024}
        sizes="(max-width: 520px) 112px, (max-width: 800px) 132px, (max-width: 1100px) 160px, 320px"
      />

      <div className={styles.content}>
        <h2 id="jobmatch-final-cta-title" className={styles.heading}>
          See how well your <span>resume matches</span>
        </h2>
        <p className={styles.description}>
          Compare your resume with the job you want, understand what&apos;s missing, and
          <br className={styles.desktopBreak} /> make informed improvements before you apply.
        </p>
        <button type="button" className={styles.button} onClick={onAnalyzeClick}>
          Check My Resume
          <ArrowRight aria-hidden="true" />
        </button>
      </div>

      <Image
        className={`${styles.artwork} ${styles.rightArtwork}`}
        src="/images/jobmatch-reference/cta-card-2.png"
        alt="Matched skills, missing skills, and suggestions summary"
        width={1024}
        height={1024}
        sizes="(max-width: 520px) 112px, (max-width: 800px) 132px, (max-width: 1100px) 160px, 320px"
      />
    </section>
  );
}
