import Image from "next/image";
import styles from "./ComparisonTable.module.css";

const rows = [
  { feature: "ATS Score Check", others: true },
  { feature: "Skill Gap Analysis", others: false },
  { feature: "One-Click Skill Add", others: false },
  { feature: "Resume Section Editor", others: false },
  { feature: "JD Keyword Matching", others: false },
  { feature: "Real-time Score Update", others: false },
  { feature: "Browser Extension", others: false },
] as const;

function AvailabilityIcon({ available }: { available: boolean }) {
  return <Image src={available ? "/images/jobmatch-reference/careerbot-table-icon.svg" : "/images/jobmatch-reference/other-platforms-table-icon.svg"} width={24} height={24} alt={available ? "Available" : "Not available"} className={styles.statusIcon} unoptimized />;
}

export default function ComparisonTable() {
  return (
    <section className={styles.section} aria-labelledby="jobmatch-comparison-title">
      <div className={styles.content}>
        <h2 id="jobmatch-comparison-title" className={styles.heading}>A smarter way to <span>match your resume</span></h2>
        <p className={styles.subtitle}>Go beyond a basic resume checker with tools that help you understand, improve,<br className={styles.copyBreak} />{" "}and tailor your resume.</p>
        <div className={styles.tableFrame}>
          <table className={styles.table} aria-label="CareerBOT and other platforms feature comparison">
            <colgroup><col className={styles.featureColumn} /><col className={styles.careerbotColumn} /><col className={styles.othersColumn} /></colgroup>
            <thead>
              <tr><th scope="col">FEATURE</th><th scope="col" className={styles.careerbotHeader}>CAREERBOT</th><th scope="col">OTHER PLATFORMS</th></tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td className={styles.careerbotCell}><AvailabilityIcon available /></td>
                  <td><AvailabilityIcon available={row.others} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
