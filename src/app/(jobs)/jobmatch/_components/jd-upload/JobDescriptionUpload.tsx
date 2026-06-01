"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { Upload, Link2, AlertCircle, X } from "lucide-react";
import { UploadMode, JDFormState } from "./types";

interface Props {
  onBack: () => void;
  onContinue: (state: JDFormState) => void;
  error?: string | null;
}

export default function JobDescriptionUpload({ onBack, onContinue, error }: Props) {
  const [mode, setMode] = useState<UploadMode>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFile = (f: File) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) return;
    if (f.size > 10 * 1024 * 1024) return;
    setFile(f);
    setMode("file");
    setText("");
    setUrl("");
  };

  const handleURLClick = () => {
    const entered = window.prompt("Paste a job posting URL:");
    if (entered?.trim() && /^https?:\/\/.+/i.test(entered.trim())) {
      setUrl(entered.trim());
      setMode("link");
      setText("");
      setFile(null);
    }
  };

  const clearAll = () => {
    setText("");
    setUrl("");
    setFile(null);
    setMode(null);
  };

  const isReady =
    (mode === "file" && !!file) ||
    (mode === "link" && url.trim().length > 5) ||
    (mode === "paste" && text.trim().length > 0) ||
    text.trim().length > 0;

  const handleContinue = () => {
    if (!isReady) return;
    const resolvedMode: UploadMode = file ? "file" : url ? "link" : "paste";
    onContinue({ mode: resolvedMode, text, url, file });
  };

  const hasContent = !!file || url.trim().length > 5 || text.trim().length > 0;

  return (
    <>
      <style>{`
        .jd-action-btn:hover {
          background: #EEF4FF !important;
          border-color: rgba(37,87,167,0.25) !important;
          color: #2557a7 !important;
        }
.jd-textarea:focus {
          border-color: #2557a7 !important;
          box-shadow: 0 0 0 3px rgba(37,87,167,0.09) !important;
        }
      `}</style>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />

      <div style={{
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8px 16px rgba(0,0,0,0.10), 0 32px 80px rgba(15,23,42,0.28)",
        width: "100%",
        maxWidth: 620,
        overflow: "hidden",
      }}>

        {/* ── Body ── */}
        <div style={{ padding: "28px 28px 20px" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>
                Job Description
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                Paste text, upload a file, or enter a URL
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={() => fileRef.current?.click()}
                className="jd-action-btn"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, height: 30,
                  fontSize: 11, fontWeight: 600, color: "#4A5568",
                  background: "#F5F8FC", border: "1px solid #DDE5F0",
                  padding: "0 11px", borderRadius: 8, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Upload style={{ width: 11, height: 11 }} />
                File
              </button>

              <button
                onClick={handleURLClick}
                className="jd-action-btn"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, height: 30,
                  fontSize: 11, fontWeight: 600, color: "#4A5568",
                  background: "#F5F8FC", border: "1px solid #DDE5F0",
                  padding: "0 11px", borderRadius: 8, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Link2 style={{ width: 11, height: 11 }} />
                URL
              </button>

            </div>
          </div>

          {/* File badge (shown when a file is selected) */}
          {file && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", marginBottom: 10,
              background: "#EEF4FF", border: "1px solid rgba(37,87,167,0.2)",
              borderRadius: 10,
            }}>
              <Upload style={{ width: 13, height: 13, color: "#2557a7", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "#2557a7", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </span>
              <span style={{ fontSize: 11, color: "#64748B", flexShrink: 0 }}>
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => { setFile(null); setMode(null); }}
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#C7D9F5", border: "none", cursor: "pointer", flexShrink: 0,
                }}
              >
                <X style={{ width: 10, height: 10, color: "#2557a7" }} />
              </button>
            </div>
          )}

          {/* URL badge (shown when URL is entered) */}
          {mode === "link" && url && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", marginBottom: 10,
              background: "#EEF4FF", border: "1px solid rgba(37,87,167,0.2)",
              borderRadius: 10,
            }}>
              <Link2 style={{ width: 13, height: 13, color: "#2557a7", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "#2557a7", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url}
              </span>
              <button
                onClick={() => { setUrl(""); setMode(null); }}
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#C7D9F5", border: "none", cursor: "pointer", flexShrink: 0,
                }}
              >
                <X style={{ width: 10, height: 10, color: "#2557a7" }} />
              </button>
            </div>
          )}

          {/* Main textarea */}
          <div style={{ position: "relative" }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMode("paste");
                setFile(null);
                setUrl("");
              }}
              placeholder="Paste the job description here — or use File / URL above..."
              spellCheck={false}
              rows={10}
              className="jd-textarea"
              style={{
                width: "100%", padding: "12px 14px",
                resize: "none", borderRadius: 12,
                border: "1.5px solid #DDE5F0", outline: "none",
                background: "#fff",
                fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.7,
                color: "#0f172a", caretColor: "#2557a7",
                boxSizing: "border-box",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
            {hasContent && (
              <button
                onClick={clearAll}
                style={{
                  position: "absolute", top: 9, right: 9,
                  width: 20, height: 20, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#E8EEF8", border: "none", cursor: "pointer",
                }}
              >
                <X style={{ width: 10, height: 10, color: "#64748B" }} />
              </button>
            )}
          </div>

          {/* Error */}
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

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#F6F8FA",
        }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 40, padding: "0 20px", borderRadius: 10,
              fontSize: 13.5, fontWeight: 600, color: "#64748B",
              background: "#fff", border: "1.5px solid #E2E8F0",
              cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            ← Go Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!isReady}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 40, padding: "0 24px", borderRadius: 10,
              fontSize: 13.5, fontWeight: 700,
              cursor: isReady ? "pointer" : "not-allowed",
              background: isReady
                ? "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)"
                : "#F1F5F9",
              color: isReady ? "#fff" : "#94A3B8",
              border: "none",
              boxShadow: isReady ? "0 4px 16px rgba(37,87,167,0.28)" : "none",
              transition: "all 0.2s",
            }}
          >
            Continue →
          </button>
        </div>

      </div>
    </>
  );
}
