import Image from "next/image";
import styles from "./MatchInsightsSection.module.css";

const insights = [
  {
    title: "Resume Match",
    description: "See how closely your resume aligns with the job description with a clear match score.",
    icon: "/images/jobmatch-reference/resume-match-icon.svg", iconWidth: 20, iconHeight: 20,
    position: styles.resume,
  },
  {
    title: "Skill Insights",
    description: "Identify the skills you have and the skills that are missing for this role.",
    icon: "/images/jobmatch-reference/tailor-my-resume-icon.svg", iconWidth: 23, iconHeight: 23,
    position: styles.skills,
  },
  {
    title: "Key Analysis",
    description: <>Get a detailed breakdown of your strengths,<br />{" "}gaps and requirements from the job.</>,
    icon: "/images/jobmatch-reference/key-analysis-icon.svg", iconWidth: 18, iconHeight: 22,
    position: styles.analysis,
  },
] as const;

export default function MatchInsightsSection() {
  return (
    <section className={styles.section} aria-labelledby="jobmatch-insights-title">
      <div className={styles.content}>
        <h2 id="jobmatch-insights-title" className={styles.heading}>Know exactly <span>where you stand</span></h2>
        <p className={styles.subtitle}>
          Once your resume and job description are analyzed, CareerBOT gives you a clear and<br className={styles.copyBreak} />
          {" "}detailed view of your match, highlighting what works and where you can improve .
        </p>
        <div className={styles.stage}>
          <Image src="/images/jobmatch-reference/know-exactly-where-you-stand.png" width={3116} height={2078} alt="CareerBOT compares a resume and job description with a match score, skill highlights, and key insights on a laptop screen." className={styles.laptop} sizes="(max-width: 999px) 90vw, (max-width: 1797px) 54vw, 968px" unoptimized />
          <div className={styles.arrows} aria-hidden="true">
            <Image src="/images/jobmatch-reference/know-exactly-where-you-stand-icon.svg" width={93} height={44} alt="" className={styles.resumeArrow} unoptimized />
            <Image src="/images/jobmatch-reference/know-exactly-where-you-stand-icon.svg" width={93} height={44} alt="" className={styles.skillsArrow} unoptimized />
            <Image src="/images/jobmatch-reference/know-exactly-where-you-stand-icon.svg" width={93} height={44} alt="" className={styles.analysisArrow} unoptimized />
          </div>
          {insights.map(({ title, description, icon, iconWidth, iconHeight, position }) => (
            <div key={title} className={`${styles.callout} ${position}`}>
              <span className={styles.icon}><Image src={icon} width={iconWidth} height={iconHeight} alt="" unoptimized /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
