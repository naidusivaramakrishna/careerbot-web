"use client";

import React from "react";
import { AlertCircle, CheckCircle2, FileText, Pencil, RefreshCw } from "lucide-react";
import styles from "./WizardUpload.module.css";

interface WizardStepConfirmProps {
  readonly uploadedFile: File | null;
  readonly sessionResumeName: string | null;
  readonly jdFile: File | null;
  readonly jdText: string;
  readonly error: string | null;
  readonly onReplaceResume: () => void;
  readonly onEditJobDescription: () => void;
}

export default function WizardStepConfirm({
  uploadedFile, sessionResumeName, jdFile, jdText, error,
  onReplaceResume, onEditJobDescription,
}: WizardStepConfirmProps) {
  const resumeName = uploadedFile?.name || sessionResumeName;
  const extension = uploadedFile?.name.split(".").pop()?.toUpperCase();
  const isUrl = /^https?:\/\/.+/i.test(jdText.trim());
  const hasJobDescription = Boolean(jdFile || jdText.trim());

  return (
    <div>
      <h2 id="review-confirm-title" className={styles.title}>Review &amp; Confirm</h2>
      <p className={styles.description}>Please review your resume and job description before we analyze the match.</p>

      <section className={styles.reviewSection} aria-labelledby="review-resume-heading">
        <div className={styles.reviewHeading}>
          <span className={styles.reviewIcon}><FileText aria-hidden="true" /></span>
          <div><h3 id="review-resume-heading">Resume</h3><p>Here is the resume you uploaded.</p></div>
        </div>
        <div className={styles.reviewFile}>
          <span className={styles.fileTypeIcon}>
            <FileText className={extension === "PDF" ? styles.pdfIcon : styles.reviewFileIcon} aria-hidden="true" />
            {extension === "PDF" && <span className={styles.pdfTag}>PDF</span>}
          </span>
          <div className={styles.reviewFileDetails}>
            <strong title={resumeName || undefined}>{resumeName || "No resume selected"}</strong>
            <div className={styles.reviewMetadata}>
              {uploadedFile && <><span>{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</span><span>{extension}</span></>}
              {resumeName && <span className={styles.readyLabel}><CheckCircle2 aria-hidden="true" />{uploadedFile ? "Uploaded Successfully" : "Saved resume"}</span>}
            </div>
          </div>
          <div className={styles.reviewActions}>
            <button type="button" onClick={onReplaceResume}><RefreshCw aria-hidden="true" /> Replace</button>
          </div>
        </div>
      </section>

      <section className={styles.reviewSection} aria-labelledby="review-jd-heading">
        <div className={styles.reviewHeading}>
          <span className={styles.reviewIcon}><FileText aria-hidden="true" /></span>
          <div><h3 id="review-jd-heading">Job Description</h3><p>Here is the job description you added.</p></div>
          <button type="button" className={styles.reviewEdit} onClick={onEditJobDescription} aria-label="Edit job description"><Pencil aria-hidden="true" /> Edit</button>
        </div>
        <div className={styles.reviewPreview} role="region" aria-label="Job description preview" tabIndex={0}>
          {jdText || (jdFile ? "Text preview is not available for this file. It will be processed during analysis." : "No job description added.")}
        </div>
        {hasJobDescription && <div className={styles.reviewReady} role="status">
          <CheckCircle2 aria-hidden="true" />
          <div><strong>{isUrl && !jdFile ? "Job URL Added" : "Job Description Ready"}</strong><p>{jdFile && !jdText ? "Your file will be processed during analysis." : "Your job description has been added and is ready for analysis."}</p></div>
        </div>}
      </section>
      {error && <div className={styles.error} role="alert"><AlertCircle aria-hidden="true" /><p>{error}</p></div>}
    </div>
  );
}
