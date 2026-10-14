"use client";

import React, { useEffect, useRef, useState } from "react";

interface PriorFixesDialogProps {
  /** Fixes already applied to this resume in an earlier session. */
  count: number;
  /** Starting fresh is running. */
  busy?: boolean;
  /** Keep the saved fixes and carry on (also what Escape and a click outside do). */
  onContinue: () => void;
  /** Discard the saved fixes and scan the original file again. */
  onStartFresh: () => void;
}

/**
 * Shown when a file that was already improved is re-uploaded and parsed again. One saved record
 * exists per uploaded resume, so the same working copy (fixes included) comes
 * back; this asks which one the user wants. The safe choice is the default:
 * Escape, a click outside and the primary button all keep the fixes. Starting
 * fresh needs a second, explicit confirmation because it discards them.
 */
export default function PriorFixesDialog({ count, busy = false, onContinue, onStartFresh }: PriorFixesDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const fixes = `${count} fix${count === 1 ? "" : "es"}`;

  // Safe choice first: on the confirmation step focus Cancel, so a keypress that
  // lands right after the first click cannot discard the fixes.
  useEffect(() => {
    (confirming ? cancelRef : primaryRef).current?.focus();
  }, [confirming]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onContinue]);

  if (count < 1) return null;

  return (
    <div
      data-testid="prior-fixes-dialog"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,0.55)" }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onContinue(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prior-fixes-title"
        style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 50px rgba(15,23,42,0.3)", color: "#0f172a" }}
      >
        <h2 id="prior-fixes-title" style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          {confirming ? "Start with fresh data?" : "You already improved this resume"}
        </h2>
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, color: "#475569" }}>
          {confirming ? (
            <>This <b>discards the {fixes} you applied</b> and scans the original file again. It uses scan credits.</>
          ) : (
            <>
              <b>{fixes} applied</b> earlier. Your uploaded file is unchanged until you export. Continue with those
              changes, or start again from the original file?
            </>
          )}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          {confirming ? (
            <>
              <button type="button" ref={cancelRef} disabled={busy} onClick={() => setConfirming(false)} style={buttonStyle(false)}>
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={onStartFresh} style={buttonStyle(true, "#dc2626")}>
                {busy ? "Scanning…" : "Yes, start fresh"}
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => setConfirming(true)} style={buttonStyle(false)}>
                Start with fresh data
              </button>
              <button type="button" ref={primaryRef} disabled={busy} onClick={onContinue} style={buttonStyle(true)}>
                Continue with my changes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buttonStyle(primary: boolean, color = "#1677e8"): React.CSSProperties {
  return {
    padding: "9px 16px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
    border: primary ? "none" : "1px solid #cbd5e1",
    background: primary ? color : "#fff",
    color: primary ? "#fff" : "#334155",
  };
}
