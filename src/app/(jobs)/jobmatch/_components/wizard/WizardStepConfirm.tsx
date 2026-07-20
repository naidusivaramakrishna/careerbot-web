"use client";

import React from "react";
import { Upload, Link2, Sparkles, ChevronRight, AlertCircle } from "lucide-react";

interface WizardStepConfirmProps {
  uploadedFile: File | null;
  sessionResumeName: string | null;
  jdFile: File | null;
  jdText: string;
  error: string | null;
  onAnalyze: () => void;
}

export default function WizardStepConfirm({
  uploadedFile, sessionResumeName, jdFile, jdText, error, onAnalyze,
}: WizardStepConfirmProps) {
  const isUrl = /^https?:\/\/.+/i.test(jdText.trim());
  const jdLabel = jdFile
    ? jdFile.name
    : isUrl
      ? jdText.trim()
      : jdText.slice(0, 60) + (jdText.length > 60 ? "…" : "");
  const jdSubLabel = jdFile
    ? "File added successfully"
    : isUrl
      ? "URL added successfully"
      : "Text added successfully";

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "#f0fdf4", border: "1.5px solid #86efac",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 10px",
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10l4 4 8-8"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Ready to Analyze</h3>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.55 }}>
          We&apos;ve received your resume and job description.<br />
          Click the button below to get your AI match score.
        </p>
      </div>

      {/* Review card */}
      <div style={{
        background: "#fff",
        border: "1px solid #E8EDF5",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 14,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}>
        {/* Row: Resume */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Upload style={{ width: 18, height: 18, color: "#2557a7" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10.5, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>Resume</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {uploadedFile ? uploadedFile.name : sessionResumeName || "Resume ready"}
            </p>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Uploaded successfully</p>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            padding: "6px 14px", borderRadius: 99, flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10l4 4 8-8"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Ready</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F1F5F9" }} />

        {/* Row: Job Description */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Link2 style={{ width: 18, height: 18, color: "#2557a7" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10.5, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>Job Description</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {jdLabel}
            </p>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{jdSubLabel}</p>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            padding: "6px 14px", borderRadius: 99, flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10l4 4 8-8"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Ready</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", marginBottom: 16, borderRadius: 10,
          background: "#FEF2F2", border: "1px solid #FECACA",
        }}>
          <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      )}

      <button
        onClick={onAnalyze}
        style={{
          width: "100%", height: 48, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
          cursor: "pointer",
          background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
          color: "#fff", border: "none",
          boxShadow: "0 6px 24px rgba(37,87,167,0.34)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.boxShadow = "0 10px 36px rgba(37,87,167,0.44)";
          b.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.boxShadow = "0 6px 24px rgba(37,87,167,0.34)";
          b.style.transform = "translateY(0)";
        }}
      >
        <Sparkles style={{ width: 18, height: 18 }} />
        Analyze Match Score
        <ChevronRight style={{ width: 17, height: 17 }} />
      </button>

      <p style={{
        textAlign: "center", fontSize: 11.5, color: "#94A3B8",
        marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        End-to-end encrypted · Never stored · 100% private
      </p>
    </div>
  );
}
