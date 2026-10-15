"use client";

import Image from "next/image";
import styles from "./ResumeEditorSection.module.css";

const capabilities = [
  {
    icon: "/images/jobmatch-reference/ai-platform-improvement-icon.svg", iconWidth: 20, iconHeight: 20, iconClass: styles.improvementIcon,
    title: "AI-Powered Improvements",
    description: "Get personalized suggestions to enhance your resume based on the job requirements.",
  },
  {
    icon: "/images/jobmatch-reference/relevant-skill-additions-icon.svg", iconWidth: 23, iconHeight: 23, iconClass: styles.skillIcon,
    title: "Relevant Skill Additions",
    description: "Easily add missing skills and highlight your strengths to better match the job.",
  },
  {
    icon: "/images/jobmatch-reference/easy-editing-icon.svg", iconWidth: 17, iconHeight: 21, iconClass: styles.editingIcon,
    title: "Easy Editing",
    description: "Make quick and effective changes with a clean and simple editor.",
  },
] as const;

interface ResumeEditorSectionProps {
  onAnalyzeClick?: () => void;
}

export default function ResumeEditorSection({ onAnalyzeClick }: ResumeEditorSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="jobmatch-editor-title">
      <div className={styles.content}>
        <div className={styles.intro}>
          <h2 id="jobmatch-editor-title" className={styles.heading}>Turn insights into a <span>stronger resume</span></h2>
          <p className={styles.subtitle}>
            Use CareerBOT’s built-in resume editor to make targeted improvements based on<br className={styles.copyBreak} />
            {" "}your job match insights - all without leaving the platform.
          </p>
        </div>
        <div className={styles.layout}>
          <Image src="/images/jobmatch-reference/turn-insights-into-a-stronger-resume.webp" width={2192} height={1160} alt="CareerBOT resume editor showing job-specific recommendations beside an editable resume." className={styles.laptop} sizes="(max-width: 999px) 90vw, (max-width: 1797px) 61vw, 1096px" unoptimized />
          <div className={styles.details}>
            {capabilities.map(({ icon, iconWidth, iconHeight, iconClass, title, description }) => (
              <div key={title} className={styles.card}>
                <span className={styles.icon}><Image src={icon} width={iconWidth} height={iconHeight} alt="" className={iconClass} unoptimized /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
            <div className={styles.actionCard}>
              <div className={styles.actionCopy}>
                <Image src="/images/jobmatch-reference/tailor-my-resume-icon.svg" width={23} height={23} alt="" unoptimized />
                <p>Turn insights into action<br />and create a resume that gets you noticed.</p>
              </div>
              <button type="button" onClick={onAnalyzeClick}>Tailor My Resume</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
