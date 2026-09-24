"use client";

import React from "react";
import { Check } from "lucide-react";
import styles from "./AnimatedSkillChip.module.css";

export default function AnimatedSkillChip({ skill, added, status, style, title }: {
  skill: string;
  added: boolean;
  status: string;
  style: React.CSSProperties;
  title?: string;
}) {
  const previouslyAdded = React.useRef(added);
  const chipRef = React.useRef<HTMLSpanElement>(null);
  const [celebrating, setCelebrating] = React.useState(false);

  React.useEffect(() => {
    const newlyAdded = added && !previouslyAdded.current;
    previouslyAdded.current = added;
    if (!added) setCelebrating(false);
    if (!newlyAdded) return;
    const chip = chipRef.current;
    const viewer = chip?.closest<HTMLElement>("[data-resume-scroll-container]");
    let animationTimer: number | undefined;
    let scrollTimer: number | undefined;
    let started = false;
    const celebrate = () => {
      if (started) return;
      started = true;
      window.clearTimeout(scrollTimer);
      setCelebrating(true);
      animationTimer = window.setTimeout(() => setCelebrating(false), 2000);
    };
    if (chip && viewer) {
      const bounds = viewer.getBoundingClientRect();
      const target = chip.getBoundingClientRect();
      const outsideView = target.top < bounds.top + 48 || target.bottom > bounds.bottom - 48;
      if (outsideView) {
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        viewer.addEventListener("scrollend", celebrate, { once: true });
        // Fallback for browsers without scrollend. Scroll only the resume panel.
        scrollTimer = window.setTimeout(celebrate, reducedMotion ? 0 : 900);
        viewer.scrollTo({
          top: viewer.scrollTop + target.top - bounds.top - bounds.height / 2 + target.height / 2,
          behavior: reducedMotion ? "instant" : "smooth",
        });
      } else celebrate();
    } else celebrate();
    return () => {
      viewer?.removeEventListener("scrollend", celebrate);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(animationTimer);
    };
  }, [added]);

  return <span ref={chipRef} className={`${styles.chip} ${celebrating ? styles.added : ""}`} data-resume-keyword={status} title={title} style={style}>
    {skill}
    {celebrating && <span className={styles.confirmation} role="status"><Check size={13} aria-hidden="true"/> Added<span className={styles.srOnly}> {skill} to resume</span></span>}
  </span>;
}
