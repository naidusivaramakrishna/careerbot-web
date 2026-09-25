"use client";

import React, { useRef, useState } from "react";
import { AlertCircle, Check, CloudUpload, FileText, RefreshCw } from "lucide-react";
import styles from "./WizardUpload.module.css";

interface WizardStepResumeProps {
  readonly uploadedFile: File | null;
  readonly sessionResumeName: string | null;
  readonly error: string | null;
  readonly onFileSelected: (file: File) => void;
  readonly onClear: () => void;
}

export default function WizardStepResume({ uploadedFile, sessionResumeName, error, onFileSelected }: WizardStepResumeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const fileName = uploadedFile?.name || sessionResumeName;
  const isPdf = fileName?.split(".").pop()?.toUpperCase() === "PDF";
  return (
    <div className={styles.uploadContent}>
      <h2 id="resume-upload-title" className={styles.title}>Upload Your Resume</h2>
      <p className={styles.description}>Upload your existing resume to get started. We’ll analyze it against the job description in the next step.</p>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className={styles.hiddenInput} aria-label="Choose resume file"
        onChange={event => { const file = event.target.files?.[0]; if (file) onFileSelected(file); event.target.value = ""; }} />
      <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} data-selected={Boolean(fileName)}
        onDragEnter={event => { event.preventDefault(); dragDepth.current += 1; setDragging(true); }}
        onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
        onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
        onDrop={event => { event.preventDefault(); dragDepth.current = 0; setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) onFileSelected(file); }}>
        <span className={styles.uploadIconFrame}><CloudUpload className={styles.uploadIcon} aria-hidden="true" strokeWidth={1.7} /></span>
        <strong>Drag and drop your resume here</strong>
        <span className={styles.or}>or</span>
        <button type="button" className={styles.browse} onClick={() => inputRef.current?.click()} aria-describedby="resume-upload-formats">Browse Files</button>
      </div>
      <p id="resume-upload-formats" className={styles.formats}>Supported formats: PDF, DOC, DOCX <span aria-hidden="true">|</span> Max file size: 10 MB</p>
      <div className={styles.selectionSlot}>
      {fileName ? <div className={`${styles.fileRow} ${styles.selectedResume}`} role="status">
        <span className={styles.fileIcon}>
          <span className={styles.fileTypeIcon}>
            <FileText className={isPdf ? styles.pdfIcon : undefined} aria-hidden="true" />
            {isPdf && <span className={styles.pdfTag}>PDF</span>}
          </span>
          <span className={styles.checkBadge}><Check aria-hidden="true" /></span>
        </span>
        <div className={styles.fileDetails}><strong title={fileName}>{fileName}</strong><span>{uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Saved resume"}</span></div>
        <button type="button" onClick={() => inputRef.current?.click()} className={styles.replace} aria-label={`Replace ${fileName}`} title="Replace resume"><RefreshCw aria-hidden="true" /> Replace</button>
      </div> : <div className={styles.emptySelection} role="status"><FileText aria-hidden="true" /><span>No resume selected</span></div>}
      </div>
      {error && <div className={styles.error} role="alert"><AlertCircle aria-hidden="true" /><p>{error}</p></div>}
    </div>
  );
}
