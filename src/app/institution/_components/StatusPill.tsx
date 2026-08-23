'use client';

import React from 'react';
import {
  AlertTriangle,
  Check,
  CircleDashed,
  CircleSlash,
  Clock3,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { progressStatusLabel, studentStatusLabel } from '@/lib/institutionMessages';
import type { StudentStatus } from '@/types/institution';

/**
 * Status chips.
 *
 * RULE: the state is carried by an ICON and the chip's WEIGHT as well as its
 * colour. A user with deuteranopia reading a roster must still be able to tell
 * "enrolled" from "withdrawn" — colour alone would delete the entire signal,
 * and this product is mostly columns of statuses.
 *
 * The four tones map to the repo's existing semantic colours (Toast / Badge /
 * Alert use the same green / amber / red / slate families).
 */
type Tone = 'positive' | 'active' | 'attention' | 'neutral' | 'muted';

const TONE_CLASSES: Record<Tone, string> = {
  positive: 'border-green-200 bg-green-50 text-green-800',
  active: 'border-[#c7d9f5] bg-[#eef4ff] text-[#1e4a94]',
  attention: 'border-amber-200 bg-amber-50 text-amber-900',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  muted: 'border-slate-200 bg-white text-slate-500',
};

export function Pill({
  label,
  tone,
  icon: Icon,
  className,
}: {
  label: string;
  tone: Tone;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

const STUDENT_STATUS_STYLE: Record<
  StudentStatus,
  { tone: Tone; icon: React.ElementType }
> = {
  enrolled: { tone: 'active', icon: Check },
  graduated: { tone: 'positive', icon: GraduationCap },
  withdrawn: { tone: 'muted', icon: CircleSlash },
  suspended: { tone: 'attention', icon: AlertTriangle },
};

export function StudentStatusPill({ status }: { status: string }) {
  const style = STUDENT_STATUS_STYLE[status as StudentStatus] ?? {
    tone: 'neutral' as Tone,
    icon: HelpCircle,
  };
  return <Pill label={studentStatusLabel(status)} tone={style.tone} icon={style.icon} />;
}

/**
 * Progress status. `status` is free text on the contract, so an unrecognised
 * value degrades to a neutral chip with a humanised label rather than leaking
 * a raw slug into the UI.
 */
export function ProgressStatusPill({ status }: { status: string }) {
  const normalised = status.toLowerCase();
  const style =
    normalised === 'completed'
      ? { tone: 'positive' as Tone, icon: Check }
      : normalised === 'in_progress'
        ? { tone: 'active' as Tone, icon: Clock3 }
        : normalised === 'not_started'
          ? { tone: 'muted' as Tone, icon: CircleDashed }
          : { tone: 'neutral' as Tone, icon: HelpCircle };

  return <Pill label={progressStatusLabel(status)} tone={style.tone} icon={style.icon} />;
}

/**
 * A score, right-aligned and tabular so a column of them lines up, with a
 * proportional bar underneath. The bar encodes magnitude as LENGTH (not hue),
 * which is the readable channel for a quick scan and survives colour-blindness.
 * Renders an em dash when the activity carried no score — never "null", never
 * a bare 0 that would read as a real result.
 */
export function ScoreCell({
  score,
  maxScore,
}: {
  score: number | null | undefined;
  maxScore: number | null | undefined;
}) {
  if (score === null || score === undefined) {
    return (
      <span className="text-[13px] tabular-nums text-[#94a3b8]" aria-label="No score recorded">
        —
      </span>
    );
  }

  const max = maxScore && maxScore > 0 ? maxScore : null;
  const pct = max ? Math.max(0, Math.min(100, (score / max) * 100)) : null;

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="text-[13px] font-medium tabular-nums text-[#0f172a]">
        {score}
        {max ? <span className="font-normal text-[#94a3b8]">{` / ${max}`}</span> : null}
      </span>
      {pct !== null ? (
        <span
          className="block h-1 w-16 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${Math.round(pct)} percent`}
        >
          <span
            className="block h-full rounded-full bg-[#2557a7]"
            style={{ width: `${pct}%` }}
          />
        </span>
      ) : null}
    </span>
  );
}
