"use client";

import React, { useEffect, useRef, useState } from "react";
import { cleanTargetRole } from "@/utils/targetRole";

/** The default explanation: the resume names no role (a fresher with no headline). */
const NO_ROLE_IN_RESUME = "Your resume has no headline or job title, so we can't tell which role to score it for.";

/**
 * Asks for the role when the resume names none (a fresher with no headline): the scan cannot be scored without it.
 * `reason` replaces the first sentence when the prompt opens for another cause (e.g. the API refused the role sent).
 */
export default function TargetRolePrompt({ value, onChange, onSubmit, onCancel, reason = NO_ROLE_IN_RESUME }: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  reason?: string;
}) {
  const ready = cleanTargetRole(value) !== null;   // what the API accepts: not blank, a placeholder or one letter
  const showHint = value.trim().length > 0 && !ready;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Whatever had focus before the dialog opened (read during the first render, before autofocus moves it).
  const [opener] = useState<HTMLElement | null>(() => (typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null)));
  useEffect(() => () => { opener?.focus?.(); }, [opener]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { onCancel(); return; }
    if (event.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href]");
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      role="dialog" aria-modal="true" aria-labelledby="target-role-title"
      onKeyDown={onKeyDown}>
      <form
        onSubmit={(event) => { event.preventDefault(); if (ready) onSubmit(); }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="target-role-title" className="text-lg font-bold text-slate-900">Which role are you aiming for?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {reason} Your ATS score and suggestions are measured against this role.
        </p>
        <label htmlFor="target-role-input" className="mt-4 block text-sm font-semibold text-slate-800">Target role</label>
        <input
          id="target-role-input"
          autoFocus
          value={value}
          maxLength={120}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. Software Developer"
          aria-describedby={showHint ? "target-role-hint" : undefined}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#2557a7] focus:ring-2 focus:ring-blue-100"
        />
        {showHint && (
          <p id="target-role-hint" className="mt-1 text-xs text-amber-700">Enter a job title, for example Software Developer.</p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={!ready} className="rounded-lg bg-[#2557a7] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e4a91] disabled:cursor-not-allowed disabled:opacity-50">
            Scan my resume
          </button>
        </div>
      </form>
    </div>
  );
}
