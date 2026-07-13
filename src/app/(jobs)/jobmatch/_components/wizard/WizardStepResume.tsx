"use client";

import React, { useRef } from "react";
import { Upload, AlertCircle } from "lucide-react";

interface WizardStepResumeProps {
  uploadedFile: File | null;
  sessionResumeName: string | null;
  error: string | null;
  onFileSelected: (file: File) => void;
}

export default function WizardStepResume({ uploadedFile, sessionResumeName, error, onFileSelected }: WizardStepResumeProps) {
  const resumeInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFileSelected(e.target.files[0])}
      />

      {/* Outer card: header + body */}
      <div style={{
        border: "1px solid #E8EDF5",
        borderRadius: "24px 24px 0 0",
        overflow: "hidden",
        background: "#fff",
      }}>
        {/* Card header */}
        <div style={{
          padding: "12px 16px",
          background: "#fff",
          borderBottom: "1px solid #E8EDF5",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #2557a7, #1a3a8f)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            boxShadow: "0 2px 6px rgba(37,87,167,0.25)",
          }}>
            <Upload style={{ width: 13, height: 13, color: "#fff" }} />
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Step 1 : Upload Resume
          </p>
        </div>

        {/* Card body */}
        <div style={{ padding: "16px" }}>
          {/* Dropzone — always visible */}
          <div
            role="button" tabIndex={0}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              cursor: "pointer",
              border: "none",
              background: "#fff",
              padding: "28px 24px",
            }}
            onDragOver={e => e.preventDefault()}
            onDragLeave={() => {}}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFileSelected(f); }}
            onClick={() => resumeInputRef.current?.click()}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && resumeInputRef.current?.click()}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "#EEF4FF", border: "1.5px solid #C7D9F5",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Upload style={{ width: 24, height: 24, color: "#2557a7" }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                Upload your resume here
              </p>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 4px" }}>
                (pdf upto 10MB)
              </p>
              <p style={{ fontSize: 12.5, color: "#94A3B8", margin: 0 }}>
                Upload your Resume in a PDF or DOCX Format
              </p>
            </div>

            <button
              onClick={e => { e.stopPropagation(); resumeInputRef.current?.click(); }}
              style={{
                height: 40, padding: "0 32px", borderRadius: 99,
                background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                color: "#fff", fontSize: 13.5, fontWeight: 700,
                border: "none", cursor: "pointer",
                boxShadow: "0 3px 12px rgba(37,87,167,0.28)",
                marginTop: 4,
              }}
            >
              Choose File
            </button>

            {/* Filename shown below button after selection */}
            {(uploadedFile || sessionResumeName) && (
              <p style={{ fontSize: 13, color: "#2557a7", fontWeight: 600, margin: 0 }}>
                {uploadedFile ? uploadedFile.name : sessionResumeName}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", marginTop: 12, borderRadius: 10,
          background: "#FEF2F2", border: "1px solid #FECACA",
        }}>
          <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  );
}
