"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./AnalysisGuidance.module.css";

const STEPS = [
  { target: "score", title: "Understand your match", text: "This compares your resume with the job description. The overall score may update after you apply a change. Section scores still reflect the last full analysis; analyze again to refresh the complete report." },
  { target: "resume", title: "Review your resume", text: "Read your resume alongside the findings. Use Edit Resume to make changes, or Compare Side by Side to check the job description. Add skills and experience only when they are accurate." },
  { target: "sections", title: "Find the gaps", text: "Breakdown shows the checks by category. Expand a section to see the evidence. Matched means the check passed; Needs attention means there are gaps. Not evaluated means no usable score was returned." },
  { target: "all", title: "Choose your next improvement", text: "Open Recommendations to review suggested changes. Start with high-impact items that fit your experience. Review each change before applying it. Keywords shows which terms are present or missing." },
  { target: "download", title: "Review and download", text: "The applied count tracks accepted suggestions. Review the updated resume before downloading. The potential score is an estimate, not a guaranteed result. Run a new analysis to get an updated score." },
] as const;

interface Props {
  scopeRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

type Box = { top: number; left: number; width: number; height: number };

export default function AnalysisTour({ scopeRef, onClose }: Props) {
  const [step, setStep] = React.useState(0);
  const [box, setBox] = React.useState<Box | null>(null);
  const [position, setPosition] = React.useState({ top: 16, left: 16 });
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const current = STEPS[step];

  React.useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scope = scopeRef.current;
    const ancestors: HTMLElement[] = [];
    for (let el: HTMLElement | null = scope; el; el = el.parentElement) ancestors.push(el);
    const elements = [...ancestors, ...Array.from(scope?.querySelectorAll<HTMLElement>("*") ?? [])];
    const scrollPositions = elements.filter(el => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)
      .map(el => ({ el, top: el.scrollTop, left: el.scrollLeft }));
    const windowScroll = { x: window.scrollX, y: window.scrollY };
    dialog?.showModal();
    return () => {
      dialog?.close();
      scrollPositions.forEach(({ el, top, left }) => { el.scrollTop = top; el.scrollLeft = left; });
      window.scrollTo({ left: windowScroll.x, top: windowScroll.y, behavior: "instant" });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [scopeRef]);

  React.useEffect(() => {
    const target = scopeRef.current?.querySelector<HTMLElement>(`[data-jobmatch-tour="${current.target}"]`);
    target?.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    cardRef.current?.focus({ preventScroll: true });
    let frame = 0;
    const measure = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const card = cardRef.current;
      if (!card) return;
      const rect = target?.getBoundingClientRect();
      const visible = rect && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < height;
      const highlighted = visible ? {
        left: Math.max(8, rect.left - 4), top: Math.max(8, rect.top - 4),
        width: Math.max(0, Math.min(width - 8, rect.right + 4) - Math.max(8, rect.left - 4)),
        height: Math.max(0, Math.min(height - 8, rect.bottom + 4) - Math.max(8, rect.top - 4)),
      } : null;
      setBox(highlighted);
      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;
      let left = (width - cardWidth) / 2;
      let top = (height - cardHeight) / 2;
      if (highlighted) {
        const right = highlighted.left + highlighted.width;
        const bottom = highlighted.top + highlighted.height;
        if (right + 16 + cardWidth <= width - 16) { left = right + 16; top = highlighted.top; }
        else if (highlighted.left - 16 - cardWidth >= 16) { left = highlighted.left - 16 - cardWidth; top = highlighted.top; }
        else if (bottom + 16 + cardHeight <= height - 16) { left = highlighted.left; top = bottom + 16; }
        else if (highlighted.top - 16 - cardHeight >= 16) { left = highlighted.left; top = highlighted.top - 16 - cardHeight; }
        else { top = height - cardHeight - 16; }
      }
      setPosition({ left: Math.max(16, Math.min(left, width - cardWidth - 16)), top: Math.max(16, Math.min(top, height - cardHeight - 16)) });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    schedule();
    const observer = new ResizeObserver(schedule);
    if (target) observer.observe(target);
    if (cardRef.current) observer.observe(cardRef.current);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [current.target, scopeRef]);

  return createPortal(
    <dialog ref={dialogRef} className={styles.tour} aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <div className={styles.spotlight} style={box ?? { inset: 0, border: 0, background: "#14233e88" }} aria-hidden="true" />
      <div ref={cardRef} tabIndex={-1} className={styles.tourCard} style={position}>
        <div className={styles.tourTop}><span>JOB MATCH GUIDE</span><button type="button" aria-label="Close guide" onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
        <p className={styles.step} aria-live="polite">Step {step + 1} of {STEPS.length}</p>
        <h2 id={titleId}>{current.title}</h2>
        <p id={descriptionId}>{current.text}</p>
        <div className={styles.tourActions}>
          <button type="button" className={styles.skip} onClick={onClose}>Skip tour</button>
          <button type="button" onClick={() => setStep(value => value - 1)} disabled={step === 0}>Back</button>
          <button type="button" className={styles.next} onClick={() => step === STEPS.length - 1 ? onClose() : setStep(value => value + 1)}>{step === STEPS.length - 1 ? "Finish" : "Next"}</button>
        </div>
      </div>
    </dialog>, document.body,
  );
}
