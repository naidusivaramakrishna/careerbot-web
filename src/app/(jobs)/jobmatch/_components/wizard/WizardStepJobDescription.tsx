"use client";

import React, { useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { AlertCircle, Check, FileText, Globe2, Info, Link2, Loader2, UploadCloud } from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa";
import { SiGlassdoor, SiIndeed, SiMonster } from "react-icons/si";
import styles from "./WizardUpload.module.css";

const SKILL_VOCAB = [
  "React","TypeScript","Vite","GraphQL","Apollo","Tailwind",
  "CSS","Figma","WebGL","Yjs","Rust","WASM","REST","Web Vitals",
];

interface WizardStepJobDescriptionProps {
  readonly jdText: string;
  readonly jdFile: File | null;
  readonly isExtractingJd: boolean;
  readonly error: string | null;
  readonly onTextChange: (value: string) => void;
  readonly onFileSelected: (file: File) => void;
  readonly onClear: () => void;
}

export default function WizardStepJobDescription({
  jdText, jdFile, isExtractingJd, error, onTextChange, onFileSelected,
}: WizardStepJobDescriptionProps) {
  const jdUploadRef = useRef<HTMLInputElement>(null);
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);
  const jdOverlayRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"paste" | "upload" | "url">(() => (jdFile ? "upload" : /^https?:\/\//i.test(jdText.trim()) ? "url" : "paste"));
  const [jobUrl, setJobUrl] = useState(() => /^https?:\/\//i.test(jdText.trim()) ? jdText.trim() : "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlAdded, setUrlAdded] = useState(false);
  const isJdPdf = jdFile?.name.split(".").pop()?.toUpperCase() === "PDF";

  const jdSkills = useMemo(() => {
    if (!jdText) return [];
    return SKILL_VOCAB.filter(s =>
      new RegExp(String.raw`\b${s.replaceAll("+", String.raw`\+`)}\b`, "i").test(jdText)
    );
  }, [jdText]);

  const jdHtml = useMemo(() => {
    if (!jdText) return "";
    // Escape raw text first so no user/external HTML can inject tags
    let h = jdText.replace(/[<>&]/g, ch => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch] || ch));
    // Add highlight <mark> tags for matched skills
    jdSkills.forEach(s => {
      h = h.replace(
        new RegExp(String.raw`\b(${s.replaceAll("+", String.raw`\+`)})\b`, "gi"),
        '<mark style="background:rgba(37,87,167,0.12);color:#2557a7;border-radius:3px;padding:0">$1</mark>'
      );
    });
    // Sanitize final HTML — only allow <mark> and safe inline styles
    return DOMPurify.sanitize(h, { ALLOWED_TAGS: ["mark"], ALLOWED_ATTR: ["style"] });
  }, [jdText, jdSkills]);

  return (
    <div>
      <input ref={jdUploadRef} type="file" accept=".txt,.pdf,.doc,.docx" className={styles.hiddenInput} aria-label="Choose job description file"
        onChange={event => { const file = event.target.files?.[0]; if (file) { setActiveTab("upload"); onFileSelected(file); } event.target.value = ""; }} />
      <h2 id="job-description-title" className={styles.title}>Add Job Description</h2>
      <p className={styles.description}>Provide the job description to analyze your resume against. You can paste text, upload a file, or enter a job posting URL.</p>

      <div className={styles.jdTabs} role="tablist" aria-label="Job description input method">
        <button type="button" role="tab" id="jd-tab-paste" aria-selected={activeTab === "paste"} aria-controls="jd-panel-paste"
          className={styles.jdTab} data-active={activeTab === "paste"} onClick={() => setActiveTab("paste")}>
          <FileText aria-hidden="true" /> Paste Job Description
        </button>
        <button type="button" role="tab" id="jd-tab-upload" aria-selected={activeTab === "upload"} aria-controls="jd-panel-upload"
          className={styles.jdTab} data-active={activeTab === "upload"} onClick={() => setActiveTab("upload")}>
          <UploadCloud aria-hidden="true" /> Upload JD File
        </button>
        <button type="button" role="tab" id="jd-tab-url" aria-selected={activeTab === "url"} aria-controls="jd-panel-url"
          className={styles.jdTab} data-active={activeTab === "url"} onClick={() => setActiveTab("url")}>
          <Link2 aria-hidden="true" /> Job URL
        </button>
      </div>

      {activeTab === "url" ? (
        <div id="jd-panel-url" role="tabpanel" aria-labelledby="jd-tab-url" className={`${styles.jdPanel} ${styles.urlPanel}`}>
          <div className={styles.urlIntro}>
            <span className={styles.urlIcon}><Link2 aria-hidden="true" /></span>
            <div><strong>Enter Job Posting URL</strong><p>Paste the link to the job posting, and we’ll fetch the job description.</p></div>
          </div>
          <form className={styles.urlForm} onSubmit={event => {
            event.preventDefault();
            try {
              const parsed = new URL(jobUrl.trim());
              if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Use a public http or https job link.");
              onTextChange(parsed.toString());
              setUrlError(null);
              setUrlAdded(true);
            } catch {
              setUrlError("Enter a valid public job posting URL.");
              setUrlAdded(false);
            }
          }}>
            <label className={styles.srOnly} htmlFor="job-posting-url">Job posting URL</label>
            <span className={styles.urlInputIcon}><Link2 aria-hidden="true" /></span>
            <input id="job-posting-url" type="url" value={jobUrl} onChange={event => { setJobUrl(event.target.value); setUrlError(null); setUrlAdded(false); }} placeholder="e.g., https://www.linkedin.com/jobs/view/..." />
            <button type="submit" className={styles.fetchUrl} disabled={!jobUrl.trim()}><Globe2 aria-hidden="true" /> Fetch Job Description <span aria-hidden="true">→</span></button>
          </form>
          {urlError && <p className={styles.urlError} role="alert">{urlError}</p>}
          {urlAdded && <p className={styles.urlSuccess} role="status">Job link added. Continue to review it before analysis.</p>}
          <div className={styles.platforms}><strong>Supported Platforms</strong><div>
            <span><i className={`${styles.platformMark} ${styles.linkedinMark}`}><FaLinkedinIn aria-hidden="true" /></i>LinkedIn</span>
            <span><i className={`${styles.platformMark} ${styles.indeedMark}`}><SiIndeed aria-hidden="true" /></i>Indeed</span>
            <span><i className={`${styles.platformMark} ${styles.naukriMark}`} aria-hidden="true">N</i>Naukri</span>
            <span><i className={`${styles.platformMark} ${styles.glassdoorMark}`}><SiGlassdoor aria-hidden="true" /></i>Glassdoor</span>
            <span><i className={`${styles.platformMark} ${styles.monsterMark}`}><SiMonster aria-hidden="true" /></i>Monster</span>
            <span><i className={`${styles.platformMark} ${styles.anyBoardMark}`}><Globe2 aria-hidden="true" /></i>Any Job Board</span>
          </div><small>Works with most job posting links. Make sure the link is publicly accessible.</small></div>
        </div>
      ) : activeTab === "paste" ? (
        <div id="jd-panel-paste" role="tabpanel" aria-labelledby="jd-tab-paste" className={styles.jdPanel}>
          <div className={styles.jdEditor}>
            {jdText && <div ref={jdOverlayRef} className={styles.jdOverlay} aria-hidden="true" dangerouslySetInnerHTML={{ __html: jdHtml }} />}
            <textarea id="job-description-input" ref={jdTextareaRef} value={jdText}
              className={`${styles.jdTextarea} ${jdText ? styles.highlighted : ""}`}
              onChange={event => onTextChange(event.target.value)}
              onScroll={event => { if (jdOverlayRef.current) jdOverlayRef.current.scrollTop = event.currentTarget.scrollTop; }}
              placeholder="Paste the job description here..."
              maxLength={10000}
              aria-label="Job description"
              aria-describedby={error ? "job-description-error" : undefined}
              aria-invalid={Boolean(error)} spellCheck={false}
            />
            <span className={styles.jdCount} aria-hidden="true">{jdText.length}/10000</span>
          </div>
          {jdText.trim().length < 200 && !/^https?:\/\//i.test(jdText.trim()) && !jdFile && <p className={styles.minimumError} role="status"><AlertCircle aria-hidden="true" /> Minimum 200 characters required.</p>}
        </div>
      ) : (
        <div id="jd-panel-upload" role="tabpanel" aria-labelledby="jd-tab-upload" className={styles.jdPanel}>
          <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} data-selected={Boolean(jdFile)}
            onDragEnter={event => { event.preventDefault(); dragDepth.current += 1; setDragging(true); }}
            onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
            onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
            onDrop={event => { event.preventDefault(); dragDepth.current = 0; setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) onFileSelected(file); }}>
            <span className={styles.uploadIconFrame}><UploadCloud className={styles.uploadIcon} aria-hidden="true" strokeWidth={1.7} /></span>
            <strong>Drag &amp; drop your JD file here</strong>
            <span className={styles.or}>or</span>
            <button type="button" className={styles.browse} onClick={() => jdUploadRef.current?.click()} aria-describedby="job-description-formats">Browse Files</button>
          </div>
          <p id="job-description-formats" className={styles.formats}>Supported formats: PDF, DOC, DOCX <span aria-hidden="true">|</span> Max file size: 10 MB</p>
          <div className={styles.selectionSlot}>
            {jdFile ? (
              <div className={`${styles.fileRow} ${styles.selectedResume}`} role="status" aria-live="polite" aria-busy={isExtractingJd}>
                <span className={styles.fileIcon}>
                  <span className={styles.fileTypeIcon}>
                    {isExtractingJd ? <Loader2 className={styles.spinner} aria-hidden="true" /> : <FileText className={isJdPdf ? styles.pdfIcon : undefined} aria-hidden="true" />}
                    {!isExtractingJd && isJdPdf && <span className={styles.pdfTag}>PDF</span>}
                  </span>
                  {!isExtractingJd && <span className={styles.checkBadge}><Check aria-hidden="true" /></span>}
                </span>
                <div className={styles.fileDetails}>
                  <strong title={jdFile.name}>{jdFile.name}</strong>
                  <span>{isExtractingJd ? "Extracting text..." : `${(jdFile.size / (1024 * 1024)).toFixed(2)} MB`}</span>
                </div>
                <button type="button" className={styles.fileRemove} onClick={() => jdUploadRef.current?.click()} aria-label="Replace job description file" title="Replace file"><UploadCloud aria-hidden="true" /> Replace</button>
              </div>
            ) : <div className={styles.emptySelection} role="status"><FileText aria-hidden="true" /><span>No file selected</span></div>}
          </div>
        </div>
      )}

      <div className={styles.tipsBox}>
        <span className={styles.tipsIcon}><Info aria-hidden="true" /></span>
        <div><strong>Tips for best results:</strong><ul>
          {activeTab === "url" ? <><li>Use a direct job posting link, not the company homepage.</li><li>Ensure the link is publicly accessible.</li><li>If the link doesn’t work, paste the text or upload a file instead.</li></> : <><li>Include the complete job description (responsibilities, requirements, skills, etc.)</li><li>The more details you provide, the more accurate the analysis will be</li><li>{activeTab === "upload" ? "You can also paste the description or enter a job posting URL." : "You can also upload a JD file or enter a job posting URL."}</li></>}
        </ul></div>
      </div>

      {error && <div id="job-description-error" className={styles.error} role="alert"><AlertCircle aria-hidden="true" /><p>{error}</p></div>}
    </div>
  );
}
