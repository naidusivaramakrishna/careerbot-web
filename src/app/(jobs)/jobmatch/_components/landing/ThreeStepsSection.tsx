import Image from "next/image";
import styles from "./ThreeStepsSection.module.css";

const steps = [
  {
    number: "01", title: "Add your resume",
    description: <>Upload a PDF or DOCX, or pick one<br />you saved in the CareerBOT.</>,
    image: "/images/jobmatch-reference/add-your-resume.png", width: 684, height: 644, imageClass: styles.resumeImage,
  },
  {
    number: "02", title: "Add the job",
    description: <>Paste the description, drop in the link,<br />or upload the file.</>,
    image: "/images/jobmatch-reference/add-the-jd.png", width: 676, height: 535, imageClass: styles.jobImage,
  },
  {
    number: "03", title: "Get your report",
    description: <>See your match score, missing skills,<br />and suggested changes.</>,
    image: "/images/jobmatch-reference/get-your-report.png", width: 717, height: 536, imageClass: styles.reportImage,
  },
] as const;

export default function ThreeStepsSection() {
  return (
    <section className={styles.section} aria-labelledby="jobmatch-three-steps-title">
      <div className={styles.content}>
        <h2 id="jobmatch-three-steps-title" className={styles.heading}>Three steps, <span>about a minute</span></h2>
        <p className={styles.subtitle}>You bring the resume and the job. We do the comparison.</p>
        <ol className={styles.cards}>
          {steps.map(step => (
            <li key={step.number} className={styles.card}>
              <span className={styles.number}>{step.number}</span>
              <div className={styles.artwork}>
                <Image src={step.image} width={step.width} height={step.height} alt="" className={step.imageClass} sizes="(max-width: 999px) 220px, (max-width: 1797px) 13vw, 224px" />
              </div>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.description}>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
