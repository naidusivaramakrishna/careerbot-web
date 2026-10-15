import Image from "next/image";
import Link from "next/link";
import { FileText, Globe, ShieldCheck } from "lucide-react";
import { COMPANY_CONFIG } from "@/config/company";
import styles from "./JobMatchFooter.module.css";

const columns = [
  { title: "Resume Tools", links: [["Resume Builder", "/builder"], ["Resume Templates", "/browse-templates"], ["ATS Scanner", "/ats"], ["Cover Letter", "/cover-letter"]] },
  { title: "Career Tools", links: [["Job Search", "/jobs"], ["Job Match", "/jobmatch"], ["Mock Interview", "/mock-interview"], ["Mock Test", "/mock-test"]] },
  { title: "Company", links: [["Blog", "/blog"], ["Pricing", "/payments"], ["Contact", `mailto:${COMPANY_CONFIG.supportEmail}`]] },
  { title: "Legal", links: [["Terms of Service", "/terms-of-service"], ["Privacy Policy", "/privacy-policy"]] },
];

export default function JobMatchFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <Image src="/assets/icons/Logo.png" alt="" width={44} height={44} />
              <span>CareerBOT</span>
            </Link>
            <p>Resume-ready, job-ready, and interview-ready career<br className={styles.desktopBreak} /> workflows for job seekers worldwide.</p>
            <ul className={styles.proof}>
              <li><FileText aria-hidden="true" />70+ resume templates</li>
              <li><ShieldCheck aria-hidden="true" />ATS-friendly workflows</li>
              <li><Globe aria-hidden="true" />Global job search tools</li>
            </ul>
          </div>
          {columns.map(({ title, links }) => (
            <nav key={title} aria-label={title} className={styles.column}>
              <h3>{title}</h3>
              <ul>{links.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className={styles.bottom}>
          <p>Copyright 2026 CareerBot. All rights reserved.</p>
          <a href={`mailto:${COMPANY_CONFIG.supportEmail}`}>{COMPANY_CONFIG.supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}
