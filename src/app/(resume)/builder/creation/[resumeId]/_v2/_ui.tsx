"use client";
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────────
   IconButton
   ────────────────────────────────────────────────────────────────────────────── */
type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "neutral" | "brand" | "danger";
  size?: "sm" | "md";
  active?: boolean;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { label, tone = "neutral", size = "md", active, className, children, ...rest },
    ref
  ) => (
    <Tooltip content={label}>
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors bv2-ring-focus",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          tone === "neutral" &&
            (active
              ? "bg-brand-50 text-brand-600"
              : "text-ink-600 hover:bg-surface-sunken hover:text-ink-800"),
          tone === "brand" &&
            (active
              ? "bg-brand-600 text-white"
              : "text-brand-600 hover:bg-brand-50"),
          tone === "danger" && "text-danger hover:bg-red-50",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  )
);
IconButton.displayName = "IconButton";

/* ──────────────────────────────────────────────────────────────────────────────
   Tooltip (zero-dep, lightweight)
   ────────────────────────────────────────────────────────────────────────────── */
type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
};

export function Tooltip({
  content,
  children,
  side = "bottom",
  delay = 350,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  const child = React.Children.only(children) as React.ReactElement<any>;
  const trigger = React.cloneElement(child, {
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      child.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      child.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      child.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      child.props.onBlur?.(e);
    },
    "aria-describedby": open ? id : child.props["aria-describedby"],
  });

  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && content ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-white shadow-md bv2-animate-fade",
            "bg-ink-900",
            pos
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Kbd shortcut hint
   ────────────────────────────────────────────────────────────────────────────── */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-line bg-surface px-1.5 font-mono text-[10px] font-medium text-ink-600">
      {children}
    </kbd>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Popover (anchored, click-outside, escape-to-close)
   ────────────────────────────────────────────────────────────────────────────── */
type PopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  align?: "start" | "end";
  side?: "top" | "bottom";
  offset?: number;
  children: React.ReactNode;
  className?: string;
};

export function Popover({
  open,
  onClose,
  anchorRef,
  align = "end",
  side = "bottom",
  offset = 8,
  children,
  className,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !ref.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    const top = side === "bottom" ? a.bottom + offset : a.top - p.height - offset;
    const left =
      align === "end" ? a.right - p.width : align === "start" ? a.left : a.left;
    setPos({ top, left });
  }, [open, anchorRef, align, side, offset]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
      className={cn(
        "fixed z-50 min-w-[220px] rounded-xl border border-line bg-surface bv2-animate-fade",
        "shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18),0_4px_10px_-6px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   ScoreChip — color-coded ATS score badge
   ────────────────────────────────────────────────────────────────────────────── */
export function ScoreChip({
  score,
  delta,
  onClick,
  className,
}: {
  score: number | null;
  delta?: number;
  onClick?: () => void;
  className?: string;
}) {
  const value = typeof score === "number" ? Math.round(score) : null;
  const tone =
    value == null
      ? "muted"
      : value >= 80
        ? "good"
        : value >= 60
          ? "warn"
          : "bad";

  const palette = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-700 ring-amber-200",
    bad: "bg-red-50 text-red-700 ring-red-200",
    muted: "bg-surface-sunken text-ink-500 ring-line",
  }[tone];

  const dotPalette = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-red-500",
    muted: "bg-ink-400",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`ATS score ${value ?? "not calculated"}, open score panel`}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 transition-all bv2-ring-focus",
        "hover:scale-[1.02] active:scale-[0.98]",
        palette,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotPalette)} />
      <span>ATS {value ?? "—"}</span>
      {typeof delta === "number" && delta !== 0 ? (
        <span
          className={cn(
            "text-[10px] font-bold",
            delta > 0 ? "text-emerald-600" : "text-red-600"
          )}
        >
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
        </span>
      ) : null}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   SaveStatus — single source of truth for autosave feedback
   ────────────────────────────────────────────────────────────────────────────── */
export type SaveState =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string }
  | { kind: "conflict" };

export function SaveStatus({
  state,
  onRetry,
  onResolveConflict,
  className,
}: {
  state: SaveState;
  onRetry?: () => void;
  onResolveConflict?: () => void;
  className?: string;
}) {
  const [, force] = useState(0);
  // refresh "Saved Xs ago" copy
  useEffect(() => {
    if (state.kind !== "saved") return;
    const t = setInterval(() => force((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, [state.kind]);

  let dot = "bg-ink-400";
  let label: React.ReactNode = "Idle";

  if (state.kind === "saving") {
    dot = "bg-brand-500 bv2-animate-pulse";
    label = "Saving…";
  } else if (state.kind === "saved") {
    dot = "bg-emerald-500";
    label = `Saved ${formatAgo(state.at)}`;
  } else if (state.kind === "dirty") {
    dot = "bg-amber-500";
    label = "Unsaved changes";
  } else if (state.kind === "error") {
    dot = "bg-red-500";
    label = (
      <span className="inline-flex items-center gap-1.5">
        Save failed
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-2 hover:text-ink-800"
        >
          Retry
        </button>
      </span>
    );
  } else if (state.kind === "conflict") {
    dot = "bg-red-500";
    label = (
      <span className="inline-flex items-center gap-1.5">
        Conflict
        <button
          type="button"
          onClick={onResolveConflict}
          className="underline underline-offset-2 hover:text-ink-800"
        >
          Review
        </button>
      </span>
    );
  }

  return (
    <output
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 text-[12px] font-medium text-ink-600",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </output>
  );
}

function formatAgo(at: Date) {
  const sec = Math.max(1, Math.round((Date.now() - at.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  return `${hr}h ago`;
}

/* ──────────────────────────────────────────────────────────────────────────────
   InlineTitleEdit — click-to-edit resume title
   ────────────────────────────────────────────────────────────────────────────── */
export function InlineTitleEdit({
  value,
  onChange,
  placeholder = "Untitled resume",
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onChange(next);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "min-w-0 rounded-md border border-brand-300 bg-white px-2 py-0.5 text-[15px] font-semibold text-ink-900 outline-none ring-2 ring-brand-100",
          className
        )}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "group inline-flex max-w-[28ch] items-center gap-1.5 truncate rounded-md px-2 py-0.5 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-surface-sunken bv2-ring-focus",
        className
      )}
      title="Rename"
    >
      <span className="truncate">{value || placeholder}</span>
      <PencilIcon className="h-3.5 w-3.5 shrink-0 text-ink-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Tab — pill-style segmented control used inside ContextRail
   ────────────────────────────────────────────────────────────────────────────── */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; icon?: React.ReactNode; badge?: number }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-lg bg-surface-sunken p-1",
        className
      )}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-all bv2-ring-focus",
              active
                ? "bg-white text-brand-600 shadow-sm"
                : "text-ink-600 hover:text-ink-800"
            )}
          >
            {it.icon}
            <span>{it.label}</span>
            {typeof it.badge === "number" && it.badge > 0 ? (
              <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Tiny inline icons (avoid pulling more deps; lucide-react is also fine)
   ────────────────────────────────────────────────────────────────────────────── */
type IconProps = React.SVGProps<SVGSVGElement>;
const Svg = (p: IconProps & { d: string; viewBox?: string }) => (
  <svg
    viewBox={p.viewBox ?? "0 0 24 24"}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d={p.d} />
  </svg>
);

export const PencilIcon = (p: IconProps) => (
  <Svg
    {...p}
    d="M12 20h9 M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"
  />
);
