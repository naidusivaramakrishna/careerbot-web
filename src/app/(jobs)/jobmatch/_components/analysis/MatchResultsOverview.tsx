"use client";

import React from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, File, FileText, Info, Lightbulb, XCircle } from "lucide-react";
import { getScoreBand, resultsSummary, resultColor, scoreBandTone } from "./resultsSummary";
import { openMatchReportPreview } from "./matchReportPrint";
import styles from "./MatchResultsOverview.module.css";

// The full breakdown (all ~12 categories) lives on the detailed analysis
// page — showing all of them here made this quick-glance table too long.
// These are the ones most directly tied to job fit; writing-quality
// categories (Capabilities, STAR Pattern, Action Verbs, Summary) and
// conditionally-present ones (Career Progression, Leadership,
// Certifications) are left for the detailed view.
export const OVERVIEW_BREAKDOWN_LABELS = ["Technical Skills", "Soft Skills", "Job Title Match", "Experience", "Education", "ATS Formatting"];

interface Props {
  matchResults: unknown;
  resumeName: string;
  jobDescriptionName: string;
  resumeSizeMB?: number;
  jdSizeMB?: number;
  analyzedAt?: string;
  onBack: () => void;
  /** Opens the detailed analysis, on the resume or the job description tab. */
  onDetails: (previewTab?: "resume" | "jd") => void;
}

// "2.4 MB  |  Uploaded on Sep 7, 2026" — either half is omitted when that
// data isn't available (e.g. a resume restored from a session/profile has
// no File object to read a size from).
function formatFileMeta(sizeMB: number | undefined, analyzedAt: string | undefined, extension?: string): string | null {
  const parts: string[] = [];
  if (sizeMB != null) parts.push(`${sizeMB.toFixed(1)} MB`);
  if (extension) parts.push(extension);
  if (analyzedAt) {
    const date = new Date(analyzedAt);
    if (!Number.isNaN(date.getTime())) {
      parts.push(`Uploaded on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
    }
  }
  return parts.length ? parts.join("  |  ") : null;
}

export default function MatchResultsOverview({matchResults, resumeName, jobDescriptionName, resumeSizeMB, jdSizeMB, analyzedAt, onBack, onDetails}: Props) {
  const summary = resultsSummary(matchResults);
  const scoreColor = resultColor;
  const scoreTone = scoreBandTone;
  const color = scoreColor(summary.score);
  const [wholeScore, fractionalScore] = String(summary.score ?? "--").split(".");
  const band = getScoreBand(summary.score);
  const previewReport = () => {
    try {
      openMatchReportPreview(matchResults, resumeName, jobDescriptionName);
    } catch {
      toast.error("Couldn't open the report preview. Allow pop-ups for this site and try again.");
    }
  };
  return <main className={styles.page}>
    <div className={styles.container}>
      <button className={styles.back} onClick={onBack}><ArrowLeft size={16}/> Back to Job Match</button>
      <header className={styles.header}>
        <div><h1>Your Match <span>Results</span></h1><p>Here&apos;s how your resume matches the job description.</p></div>
        <div className={styles.actions}><button onClick={previewReport}><FileText size={17}/> View Report</button><button className={styles.primary} onClick={() => onDetails()}>View Detailed Analysis <ArrowRight size={17}/></button></div>
      </header>
      <div className={styles.grid}>
        <section className={styles.score} aria-label="Overall match result">
          <div className={styles.ring} style={{background: `conic-gradient(${color} ${(summary.score ?? 0) * 3.6}deg, #F2F4F7 0deg)`}}><div><strong><span className={styles.srOnly}>{summary.score == null ? "Score unavailable" : `${summary.score}%`}</span><span aria-hidden="true"><span>{wholeScore}</span>{fractionalScore && <span className={styles.scoreFraction}>.{fractionalScore}</span>}{summary.score != null && <span className={styles.percent}>%</span>}</span></strong><small>Match Score</small></div></div>
          <div><h2 className={`${styles.band} ${band.classes.text} ${band.classes.bg}`} style={{color: band.text, background: band.bg}}>{summary.band}</h2><p>{getScoreBand(summary.score).description}</p></div>
        </section>
        <section className={`${styles.panel} ${styles.summaryPanel}`}><div className={styles.panelHeading}><h2>Quick Summary <Info size={14}/></h2><small>Click on each card to view details</small></div><div className={styles.stats}>
          {[{label: "Matched Keywords", text: "Skills aligned with the job requirements", count: summary.matched.length, Icon: CheckCircle2, tone: "positive"}, {label: "Missing Keywords", text: "Skills to work on for a better match", count: summary.missing.length, Icon: XCircle, tone: "negative"}, {label: "Sections to Improve", text: "Other areas to strengthen your profile", count: summary.areas.length, Icon: FileText, tone: "warning"}].map(({label,text,count,Icon,tone}) => <button key={label} onClick={() => onDetails()} className={styles.stat}><span className={`${styles.statIcon} ${styles[tone]}`} data-filled={Icon !== FileText}><Icon size={25}/></span><strong>{count}</strong><ChevronRight className={styles.chevron} size={14}/><span className={styles.statLabel}>{label}</span><small>{text}</small></button>)}
        </div></section>
        {[
          {label: "Your Resume", name: resumeName, sizeMB: resumeSizeMB, isJd: false},
          {label: "Job Description", name: jobDescriptionName, sizeMB: jdSizeMB, isJd: true},
        ].map(file => {
          const ext = file.name?.split(".").pop()?.toUpperCase();
          const docType = ext === "PDF" ? "pdf" : ext === "DOC" || ext === "DOCX" ? "doc" : undefined;
          const meta = formatFileMeta(file.sizeMB, analyzedAt, docType ? ext : undefined);
          // Both cards open the report page (detailed analysis), each on its own
          // tab: the Job Description card lands on the job description, the Resume
          // card on the resume.
          const handleView = () => onDetails(file.isJd ? "jd" : "resume");
          const viewLabel = `View ${file.label} in detailed analysis`;
          return <section key={file.label} className={styles.file}>
            <div className={styles.fileHeading}><span className={styles.fileHeadIcon}><FileText size={24} strokeWidth={1.7}/></span><h2>{file.label}</h2></div>
            <div className={styles.fileRow}>
              <span className={styles.fileIcon} data-ext={docType}>
                <File size={36} strokeWidth={1.6}/>
                {docType && <span className={styles.fileTag}>{ext}</span>}
              </span>
              <div className={styles.fileDetails}>
                <p className={styles.fileNameText} title={file.name}>{file.name}</p>
                {meta && <p className={styles.fileMeta}>{meta}</p>}
              </div>
              <button onClick={handleView} aria-label={viewLabel}><svg className={styles.viewIcon} width="22" height="18" viewBox="0 0 24 20" aria-hidden="true"><path fill="currentColor" d="M1 10S5 2 12 2s11 8 11 8-4 8-11 8S1 10 1 10Z"/><circle cx="12" cy="10" r="4.5" fill="white"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/></svg> View</button>
            </div>
          </section>;
        })}
        <section className={`${styles.panel} ${styles.breakdownPanel}`}><div className={styles.panelHeading}><h2>Match Score Breakdown <Info size={15}/></h2><small>Each section is weighted based on its importance in the job match.</small></div><table className={styles.breakdown}><thead><tr><th scope="col">Category</th><th scope="col"><span className={styles.srOnly}>Score bar</span></th><th scope="col">Your Score</th></tr></thead><tbody>{summary.breakdown.filter(row => OVERVIEW_BREAKDOWN_LABELS.includes(row.label)).map(row => <tr key={row.label}><td>{row.label}</td><td><div className={styles.track} role="progressbar" aria-label={`${row.label} match score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.score ?? undefined} aria-valuetext={row.score == null ? "Unavailable" : `${row.score}% - ${getScoreBand(row.score).label}`}><div data-tone={scoreTone(row.score)} className={getScoreBand(row.score).classes.bar} style={{width: `${row.score ?? 0}%`, background: getScoreBand(row.score).text}}/></div></td><td><strong style={{color: scoreColor(row.score)}}>{row.score == null ? "N/A" : `${row.score}%`}</strong></td></tr>)}</tbody></table></section>
      </div>
      <footer className={styles.next}><span className={styles.bulb}><Lightbulb size={25}/></span><div><strong>Next Step</strong><p>Explore the detailed analysis to get in-depth suggestions and actionable tips to improve your resume.</p></div></footer>
    </div>
  </main>;
}




