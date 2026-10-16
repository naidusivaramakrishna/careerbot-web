"use client";

import React from "react";
import { createPortal } from "react-dom";
import styles from "./AnalysisGuidance.module.css";

export default function AnalysisHelp({ label, trigger, children }: { label: string; trigger: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  React.useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const panel = panelRef.current;
    if (!button || !panel) return;
    const rect = button.getBoundingClientRect();
    const top = rect.bottom + 8 + panel.offsetHeight <= window.innerHeight - 12 ? rect.bottom + 8 : rect.top - panel.offsetHeight - 8;
    setPosition({ top: Math.max(12, top), left: Math.max(12, Math.min(rect.left, window.innerWidth - panel.offsetWidth - 12)) });
    const outside = (event: PointerEvent) => {
      if (!button.contains(event.target as Node) && !panel.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); button.focus({ preventScroll: true }); }
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [open]);
  return <span className={styles.help}>
    <button ref={buttonRef} type="button" className={styles.helpText} aria-label={label} aria-expanded={open}
      aria-controls={open ? id : undefined} aria-describedby={open ? id : undefined}
      onClick={() => setOpen(value => !value)} onBlur={() => setOpen(false)}>{trigger}</button>
    {open && createPortal(<div ref={panelRef} id={id} role="tooltip" className={styles.helpPanel} style={position}>{children}</div>, document.body)}
  </span>;
}
