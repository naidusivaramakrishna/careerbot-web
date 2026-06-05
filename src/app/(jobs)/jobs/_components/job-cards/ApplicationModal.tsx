"use client";

import { useState, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { X, Check, Lock, Briefcase, MapPin, Users, Loader2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ApplicationModalProps {
  isOpen: boolean;
  jobTitle: string;
  jobCompany?: string;
  location?: string;
  jobType?: string;
  recruiterName?: string;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => Promise<void>;
  isLoading: boolean;
}

export interface ApplicationData {
  cover_letter: string;
  experience_years: string;
  notice_period: string;
  phone_number: string;
}

interface FormErrors {
  experience_years?: string;
  notice_period?: string;
}

// ── Module-level constants (stable across renders) ───────────────────────────

const EMPTY_FORM: ApplicationData = {
  cover_letter: "",
  experience_years: "",
  notice_period: "",
  phone_number: "",
};

const MODAL_SHADOW: React.CSSProperties = {
  boxShadow: "0 24px 60px -10px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)",
};

// Stable icon elements — passed to memo'd MetaRow without new object refs each render
const ICON_MAP = <MapPin className="w-3.5 h-3.5 text-gray-500" />;
const ICON_JOB = <Briefcase className="w-3.5 h-3.5 text-gray-500" />;
const ICON_REC = <Users className="w-3.5 h-3.5 text-gray-500" />;

// Stable click handler that never recreates — prevents React diffing noise
function stopPropagation(e: React.MouseEvent): void {
  e.stopPropagation();
}

// ── CSS — injected once into <head>, never via JSX <style> ───────────────────
// Inline <style> tags re-render on every state change (each keystroke), which
// causes the browser to re-parse CSS animations and produces visual flicker.

const MODAL_CSS = `
  @keyframes _appBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes _appModalIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  ._appBackdrop {
    animation: _appBackdropIn 0.2s ease both;
  }
  ._appModal {
    animation: _appModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    will-change: transform, opacity;
  }
  ._appScroll::-webkit-scrollbar { width: 4px; }
  ._appScroll::-webkit-scrollbar-track { background: transparent; }
  ._appScroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  ._appScroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  ._appSubmit:not(:disabled):hover {
    box-shadow: 0 6px 20px rgba(37, 87, 167, 0.42) !important;
    transform: translateY(-1px) !important;
  }
  ._appSubmit:not(:disabled):active {
    box-shadow: 0 2px 8px rgba(37, 87, 167, 0.28) !important;
    transform: translateY(0) !important;
  }
`;

// Singleton guard — inject exactly once per page load, not per component instance
let _cssReady = false;
function ensureModalCSS(): void {
  if (_cssReady || typeof document === "undefined") return;
  const id = "__appModalCSS__";
  if (!document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = MODAL_CSS;
    document.head.appendChild(el);
  }
  _cssReady = true;
}

// ── Input class helper ───────────────────────────────────────────────────────

function fieldCls(hasError = false): string {
  return [
    "w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 bg-gray-50/60",
    "outline-none transition-all duration-150 placeholder:text-gray-400",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    hasError
      ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.1)]"
      : "border-gray-200 focus:border-[#2557a7] focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,87,167,0.1)]",
  ].join(" ");
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApplicationModal({
  isOpen,
  jobTitle,
  jobCompany = "Company",
  location = "Location not specified",
  jobType = "Full Time",
  recruiterName = "Recruiter",
  onClose,
  onSubmit,
  isLoading,
}: ApplicationModalProps) {
  const [formData, setFormData] = useState<ApplicationData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Ref-tracked timer so we can clean up if the component unmounts early
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── CSS injection (once per page load) ───────────────────────────────────
  useEffect(() => {
    ensureModalCSS();
  }, []);

  // ── Body scroll lock + scrollbar-width compensation ───────────────────────
  // Without this, the browser scrollbar disappears when the modal opens,
  // causing a ~15px horizontal layout shift that looks like a full-page flash.
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarW = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth
    );
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [isOpen]);

  // ── ESC key ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading && !showSuccess) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, showSuccess, onClose]);

  // ── Timer cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: FormErrors = {};
    if (!formData.experience_years.trim())
      next.experience_years = "Years of experience is required";
    if (!formData.notice_period)
      next.notice_period = "Please select a notice period";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clearError(field: keyof FormErrors) {
    // Bail early if error isn't set — avoids unnecessary re-render
    setErrors((prev) =>
      prev[field] !== undefined ? { ...prev, [field]: undefined } : prev
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
    setShowSuccess(true);
    timerRef.current = setTimeout(() => {
      setShowSuccess(false);
      setFormData(EMPTY_FORM);
      setErrors({});
      timerRef.current = null;
      onClose();
    }, 1800);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !isLoading && !showSuccess) onClose();
  }

  // ── Early exit when closed ────────────────────────────────────────────────
  if (!isOpen) return null;

  // Guard against SSR — createPortal requires document
  if (typeof document === "undefined") return null;

  const initial = (jobCompany || "J").charAt(0).toUpperCase() || "J";

  // ── Render ─────────────────────────────────────────────────────────────────
  // createPortal renders the modal directly into document.body, escaping any
  // parent container that has overflow:hidden, transform, or will-change set.
  // Without this, a card with hover:-translate-y-0.5 + overflow-hidden traps
  // the fixed-positioned backdrop inside the card's layout bounds.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Job application"
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 _appBackdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] relative _appModal overflow-hidden"
        style={MODAL_SHADOW}
        onClick={stopPropagation}
      >
        {/* Close — disabled + invisible during success; pointer-events removed so
            it doesn't accidentally intercept the success overlay area */}
        <button
          onClick={onClose}
          disabled={isLoading || showSuccess}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white border border-gray-200
                     flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50
                     hover:border-gray-300 transition-all duration-150 shadow-sm"
          style={{
            opacity: showSuccess ? 0 : 1,
            pointerEvents: showSuccess ? "none" : undefined,
            transition: "opacity 0.15s ease",
          }}
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* ────────────────────────────────────────────────────────────────────
            FORM PANEL — fades out / scales down when showSuccess becomes true.
            CSS transition (not animation) runs on the existing DOM element so
            there is no mount/unmount flash.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-[1fr_1.45fr] max-h-[90vh]"
          aria-hidden={showSuccess}
          style={{
            opacity: showSuccess ? 0 : 1,
            transform: showSuccess ? "scale(0.97)" : "scale(1)",
            transition: "opacity 0.22s ease, transform 0.22s ease",
            pointerEvents: showSuccess ? "none" : undefined,
            willChange: "opacity, transform",
          }}
        >
          {/* Left panel — company info */}
          <div
            className="p-8 flex flex-col border-r border-gray-100 overflow-y-auto _appScroll"
            style={{ background: "linear-gradient(155deg, #f8faff 0%, #f1f5fb 100%)" }}
          >
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.12em] mb-5">
              Applying To
            </p>

            <div className="flex items-center gap-3.5 mb-5">
              <div
                className="w-12 h-12 rounded-2xl bg-[#2557a7] flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ boxShadow: "0 4px 14px rgba(37, 87, 167, 0.3)" }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                  {jobCompany}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Hiring for this role</p>
              </div>
            </div>

            <h4 className="text-lg font-bold text-gray-900 leading-snug mb-5">{jobTitle}</h4>
            <div className="h-px bg-gray-200/70 mb-5" />

            <div className="space-y-3">
              <MetaRow icon={ICON_MAP} label="Location"         value={location}      />
              <MetaRow icon={ICON_JOB} label="Job Type"         value={jobType}       />
              <MetaRow icon={ICON_REC} label="About Recruiter"  value={recruiterName} />
            </div>

            <div className="mt-auto pt-7">
              <div className="flex items-start gap-2.5 p-3.5 bg-white rounded-xl border border-gray-200/80">
                <Lock className="w-3.5 h-3.5 text-[#2557a7] shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Your data is{" "}
                  <span className="font-semibold text-gray-700">end-to-end encrypted</span> and
                  shared only with this employer.
                </p>
              </div>
            </div>
          </div>

          {/* Right panel — form */}
          <div className="p-8 flex flex-col overflow-y-auto _appScroll">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Your Application</h3>
              <p className="text-sm text-gray-500 mt-1">
                Fill out the details below to apply for this position.
              </p>
            </div>

            {/* noValidate suppresses ALL native browser validation popups/tooltips */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 flex-1">
              <Field label="Phone Number">
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone_number: e.target.value }))
                  }
                  placeholder="+91-9876543210"
                  className={fieldCls()}
                  disabled={isLoading}
                  autoComplete="tel"
                />
              </Field>

              <Field label="Years of Experience" required error={errors.experience_years}>
                <input
                  type="text"
                  value={formData.experience_years}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, experience_years: e.target.value }));
                    clearError("experience_years");
                  }}
                  placeholder="e.g., 3 years"
                  className={fieldCls(!!errors.experience_years)}
                  disabled={isLoading}
                />
              </Field>

              <Field label="Notice Period" required error={errors.notice_period}>
                <div className="relative">
                  <select
                    value={formData.notice_period}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, notice_period: e.target.value }));
                      clearError("notice_period");
                    }}
                    className={fieldCls(!!errors.notice_period) + " appearance-none pr-9"}
                    disabled={isLoading}
                  >
                    <option value="">Select notice period</option>
                    <option value="Immediate">Immediate</option>
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Field>

              <Field label="Cover Letter" sublabel="Optional" className="flex-1 flex flex-col">
                <textarea
                  value={formData.cover_letter}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, cover_letter: e.target.value }))
                  }
                  placeholder="Why are you interested in this role?"
                  rows={4}
                  className={fieldCls() + " resize-none flex-1 min-h-[90px]"}
                  disabled={isLoading}
                />
              </Field>

              {/* Submit — inline style change (not class toggle) prevents layout recalc */}
              <button
                type="submit"
                disabled={isLoading}
                className="_appSubmit w-full py-3 px-6 rounded-xl font-semibold text-sm text-white
                           flex items-center justify-center gap-2 mt-auto disabled:cursor-not-allowed"
                style={{
                  background: isLoading
                    ? "#93c5fd"
                    : "linear-gradient(135deg, #2557a7 0%, #1f4e98 100%)",
                  boxShadow: isLoading ? "none" : "0 4px 14px rgba(37, 87, 167, 0.35)",
                  transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Apply Now"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────
            SUCCESS OVERLAY — absolute, covers the modal. Fades in after form
            fades out (0.12s delay). Runs on an existing DOM element, no mount
            flash, no animation replay on the outer modal or backdrop.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          role="status"
          aria-live="assertive"
          className="absolute inset-0 bg-white rounded-3xl flex flex-col items-center justify-center gap-4 p-10 text-center"
          style={{
            opacity: showSuccess ? 1 : 0,
            transform: showSuccess ? "translateY(0)" : "translateY(10px)",
            // Stagger: wait for form to fade out first, then slide in
            transition: showSuccess
              ? "opacity 0.28s ease 0.12s, transform 0.28s cubic-bezier(0.16,1,0.3,1) 0.12s"
              : "opacity 0.15s ease, transform 0.15s ease",
            pointerEvents: showSuccess ? "auto" : "none",
            willChange: "opacity, transform",
          }}
        >
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center ring-[6px] ring-green-50/60">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-600" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your details have been shared with the recruiter.
              <br />
              You&apos;ll hear back soon.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
            <Lock className="w-3 h-3" />
            Securely shared only with the recruiter.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Memoized sub-components ───────────────────────────────────────────────────
// memo prevents the left-panel metadata from re-rendering on every form keystroke.
// Icons are passed as stable module-level constants so memo's shallow comparison works.

const MetaRow = memo(function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.1em]">{label}</p>
        <p className="text-sm text-gray-700 font-medium leading-tight mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
});

// Field reserves a fixed min-height below the input for error text.
// This prevents the error message from pushing content down (layout shift)
// when validation fires after the user clicks "Apply Now".
const Field = memo(function Field({
  label,
  sublabel,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  sublabel?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        {label}
        {required && (
          <span className="text-red-400 text-xs" aria-hidden="true">
            *
          </span>
        )}
        {sublabel && (
          <span className="text-xs font-normal text-gray-400">({sublabel})</span>
        )}
      </label>
      {children}
      {/* Fixed min-height: error text appears inside reserved space, no layout jump */}
      <div className="min-h-[1.1rem]">
        {error && (
          <p role="alert" className="flex items-center gap-1 text-xs text-red-500">
            <span
              className="inline-flex w-3.5 h-3.5 rounded-full border border-red-400 items-center justify-center text-[9px] font-bold leading-none shrink-0"
              aria-hidden="true"
            >
              !
            </span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
