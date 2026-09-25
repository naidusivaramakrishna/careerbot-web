"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import styles from "./WizardUpload.module.css";

const STEP_TITLES = ["", "resume-upload-title", "job-description-title", "review-confirm-title", "analyzing-match-title"];
const WIZARD_STEP_COUNT = 4;

interface WizardModalShellProps {
  readonly open: boolean;
  readonly wizardStep: 0 | 1 | 2 | 3 | 4;
  readonly onClose: () => void;
  readonly onBack: () => void;
  readonly onContinueClick: () => void;
  readonly continueDisabled: boolean;
  readonly onAnalyzeClick: () => void;
  readonly children: React.ReactNode;
}

export default function WizardModalShell({
  open, wizardStep, onClose, onBack, onContinueClick, continueDisabled, onAnalyzeClick, children,
}: WizardModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, [open]);
  useEffect(() => { if (open) dialogRef.current?.focus(); }, [open, wizardStep]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="wizard-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`${styles.overlay} ${wizardStep === 1 ? styles.resumeOverlay : ""}`}
          onClick={wizardStep === 4 ? undefined : onClose}>
          <motion.div key="wizard-card" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={STEP_TITLES[wizardStep]} tabIndex={-1}
            onKeyDown={event => {
              if (event.key === "Escape") { event.stopPropagation(); if (wizardStep !== 4) onClose(); }
              if (event.key !== "Tab") return;
              const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type="hidden"]), textarea, select, a[href], [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
              const first = controls[0];
              const last = controls[controls.length - 1];
              if (!first) { event.preventDefault(); return; }
              if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`${styles.dialog} ${wizardStep === 1 ? styles.resumeDialog : ""} ${wizardStep === 4 ? styles.analysisDialog : ""}`}
            onClick={event => event.stopPropagation()}>
            <div className={styles.header}>
              <div>
                <p className={styles.progressLabel}>Step {wizardStep} of {WIZARD_STEP_COUNT}</p>
                <div className={styles.progress} aria-hidden="true">{[1, 2, 3, 4].map(step => <span key={step} data-active={step <= wizardStep} />)}</div>
              </div>
              {wizardStep !== 4 && <button type="button" className={styles.close} onClick={onClose} aria-label={wizardStep === 1 ? "Close upload dialog" : wizardStep === 2 ? "Close job description dialog" : "Close review dialog"} title="Close"><X aria-hidden="true" /></button>}
            </div>
            <div className={styles.body} style={wizardStep === 4
              ? { flex: "initial", minHeight: 0, maxHeight: "calc(100dvh - 10rem)", overflowY: "auto" }
              : { flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</div>
            {wizardStep !== 4 && <div className={styles.footer}>
              <button type="button" className={styles.cancel} onClick={wizardStep === 1 ? onClose : onBack}>{wizardStep === 1 ? "Cancel" : <><ArrowLeft aria-hidden="true" /> Back</>}</button>
              <button type="button" className={styles.continue} disabled={continueDisabled} onClick={wizardStep === 3 ? onAnalyzeClick : onContinueClick}>
                {wizardStep === 3 ? <>Analyze Match <ArrowRight aria-hidden="true" /></> : "Continue"}
              </button>
            </div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
