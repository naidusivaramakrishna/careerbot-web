"use client";

import React, { useMemo, useRef } from "react";
import DOMPurify from "dompurify";
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react";

const SKILL_VOCAB = [
  "React","TypeScript","Vite","GraphQL","Apollo","Tailwind",
  "CSS","Figma","WebGL","Yjs","Rust","WASM","REST","Web Vitals",
];

interface WizardStepJobDescriptionProps {
  jdText: string;
  jdFile: File | null;
  isExtractingJd: boolean;
  error: string | null;
  onTextChange: (value: string) => void;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export default function WizardStepJobDescription({
  jdText, jdFile, isExtractingJd, error, onTextChange, onFileSelected, onClear,
}: WizardStepJobDescriptionProps) {
  const jdUploadRef = useRef<HTMLInputElement>(null);
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);
  const jdOverlayRef = useRef<HTMLDivElement>(null);

  const jdSkills = useMemo(() => {
    if (!jdText) return [];
    return SKILL_VOCAB.filter(s =>
      new RegExp(`\\b${s.replace(/\+/g, "\\+")}\\b`, "i").test(jdText)
    );
  }, [jdText]);

  const jdHtml = useMemo(() => {
    if (!jdText) return "";
    // Escape raw text first so no user/external HTML can inject tags
    let h = jdText.replace(/[<>&]/g, ch => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch] || ch));
    // Add highlight <mark> tags for matched skills
    jdSkills.forEach(s => {
      h = h.replace(
        new RegExp(`\\b(${s.replace(/\+/g, "\\+")})\\b`, "gi"),
        '<mark style="background:rgba(37,87,167,0.12);color:#2557a7;border-radius:3px;padding:0 2px">$1</mark>'
      );
    });
    // Sanitize final HTML — only allow <mark> and safe inline styles
    return DOMPurify.sanitize(h, { ALLOWED_TAGS: ["mark"], ALLOWED_ATTR: ["style"] });
  }, [jdText, jdSkills]);

  return (
    <div>
      <input
        ref={jdUploadRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFileSelected(e.target.files[0])}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>Job Description</h3>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Paste text, a job URL, or upload a file</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => jdUploadRef.current?.click()} className="jm-action-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 5, height: 30,
            fontSize: 11, fontWeight: 600, color: "#4A5568",
            background: "#F5F8FC", border: "1px solid #DDE5F0",
            padding: "0 11px", borderRadius: 8, cursor: "pointer",
            transition: "all 0.15s",
          }}>
            <Upload style={{ width: 11, height: 11 }} />File
          </button>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
        {jdText && (
          <div
            ref={jdOverlayRef}
            style={{
              position: "absolute", inset: 0,
              padding: "12px 14px", fontFamily: "inherit",
              fontSize: 13.5, lineHeight: 1.7, color: "#0f172a",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              pointerEvents: "none", overflowY: "auto", borderRadius: 12,
              scrollbarWidth: "none",
            }}
            dangerouslySetInnerHTML={{ __html: jdHtml }}
          />
        )}
        {jdFile && !jdText && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 6, pointerEvents: "none", borderRadius: 12,
          }}>
            {isExtractingJd ? (
              <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#2557a7" }} />
            ) : (
              <FileText style={{ width: 26, height: 26, color: "#2557a7" }} />
            )}
            <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>{jdFile.name}</p>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
              {isExtractingJd ? "Extracting text…" : "Couldn't preview text — it will be extracted during analysis"}
            </p>
          </div>
        )}
        <textarea
          ref={jdTextareaRef}
          value={jdText}
          onChange={e => onTextChange(e.target.value)}
          onScroll={e => {
            if (jdOverlayRef.current) {
              jdOverlayRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
            }
          }}
          placeholder={`Paste the full job description here...

Example:
We are looking for a Software Engineer with 3+ years of experience in React, Node.js, and AWS. The ideal candidate should have strong problem-solving skills, experience with REST APIs, and familiarity with agile methodologies...`}
          spellCheck={false}
          style={{
            minHeight: 300, padding: "12px 14px",
            resize: "none", borderRadius: 12,
            border: "1.5px solid #DDE5F0", outline: "none",
            background: "#fff",
            fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.7,
            color: (jdText || jdFile) ? "transparent" : "#B0BAC8",
            caretColor: "#2557a7", width: "100%", boxSizing: "border-box",
            transition: "border-color 0.15s, box-shadow 0.15s",
            overflowY: "auto",
          }}
          onFocus={e => {
            e.target.style.borderColor = "#2557a7";
            e.target.style.boxShadow = "0 0 0 3px rgba(37,87,167,0.09)";
          }}
          onBlur={e => {
            e.target.style.borderColor = "#DDE5F0";
            e.target.style.boxShadow = "none";
          }}
        />
        {(jdText || jdFile) && (
          <button
            onClick={onClear}
            style={{
              position: "absolute", top: 9, right: 9,
              width: 20, height: 20, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#E8EEF8", color: "#64748B",
              cursor: "pointer", border: "none",
            }}
          >
            <X style={{ width: 10, height: 10 }} />
          </button>
        )}
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", marginTop: 10, borderRadius: 10,
          background: "#FEF2F2", border: "1px solid #FECACA",
        }}>
          <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  );
}
