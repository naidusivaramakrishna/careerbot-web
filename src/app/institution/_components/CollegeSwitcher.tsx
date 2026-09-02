'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInstitution } from '@/contexts/InstitutionContext';
import { ROLE_LABELS, ROLE_SCOPE_HINT } from '@/lib/institutionMessages';
import type { InstitutionMembership } from '@/types/institution';
import { FOCUS_RING } from './tokens';

/**
 * The college switcher.
 *
 * This is the first control a multi-college user touches and the one with the
 * worst failure mode: entering a student into the wrong college. So:
 *
 *   - the ACTIVE college and the role in it are always on screen, never behind
 *     a hover or a menu;
 *   - the role is shown next to the college, because the same person can be a
 *     CPO in one and a faculty member in another, and that changes what the
 *     screen will let them do;
 *   - switching is an explicit, labelled action with its own in-flight state,
 *     so a slow token exchange can never leave the header showing one college
 *     while requests still carry the other;
 *   - with exactly one membership there is nothing to switch, so it renders as
 *     a plain, non-interactive identity chip instead of a dead dropdown.
 *
 * The college is named by `institution_name`, which GET /memberships returns.
 * The slug is the fallback and only the fallback: it is an internal id, and
 * shouting "DEMO-COLLEGE" at a placement officer in the one place a
 * wrong-college mistake happens is how a term's results get entered against
 * the wrong institution.
 */
function collegeLabel(membership: {
  institution_id: string;
  institution_name?: string | null;
}): string {
  const name = membership.institution_name?.trim();
  if (name) return name;
  return membership.institution_id.replace(/[-_]+/g, ' ').toUpperCase();
}

function MembershipRow({
  membership,
  isActive,
  onSelect,
  disabled,
}: {
  membership: InstitutionMembership;
  isActive: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={isActive}
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-2.5 px-3 py-2 text-left',
          'transition-colors duration-150 motion-reduce:transition-none',
          'hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60',
          FOCUS_RING,
        )}
      >
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          {isActive ? <Check className="h-4 w-4 text-[#2557a7]" aria-hidden /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium leading-5 text-[#0f172a]">
            {collegeLabel(membership)}
          </span>
          <span className="block text-[12px] leading-4 text-[#64748b]">
            {ROLE_LABELS[membership.role]} · {ROLE_SCOPE_HINT[membership.role]}
          </span>
        </span>
      </button>
    </li>
  );
}

export function CollegeSwitcher() {
  const { memberships, session, isSwitching, selectMembership } = useInstitution();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape — a menu that traps the user is worse
  // than no menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!session) return null;

  // POST /session returns the id but not the name, so the active college is
  // named from the membership list that is already loaded. Falling back to the
  // session alone keeps the header correct if that list is still in flight.
  const activeMembership = memberships.find(
    (m) => m.institution_id === session.institution_id,
  );
  const activeLabel = collegeLabel(activeMembership ?? session);
  const roleLabel = ROLE_LABELS[session.role];
  const canSwitch = memberships.length > 1;

  const identity = (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]"
        aria-hidden
      >
        <Building2 className="h-4 w-4 text-[#2557a7]" aria-hidden />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-[13px] font-semibold leading-4 text-[#0f172a]">
          {activeLabel}
        </span>
        <span className="block truncate text-[11px] leading-4 text-[#64748b]">{roleLabel}</span>
      </span>
    </span>
  );

  if (!canSwitch) {
    return (
      <div
        className="flex items-center rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5"
        aria-label={`You are in ${activeLabel} as ${roleLabel}`}
      >
        {identity}
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isSwitching}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5',
          'transition-colors duration-150 hover:border-[#c7d9f5] hover:bg-[#f8fafc] motion-reduce:transition-none',
          'disabled:cursor-wait',
          FOCUS_RING,
        )}
      >
        {identity}
        {isSwitching ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#64748b] motion-reduce:animate-none" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#94a3b8]" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Switch college"
          className="absolute left-0 top-full z-40 mt-1.5 w-[260px] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#94a3b8]">
            Your colleges
          </p>
          <ul>
            {memberships.map((m) => (
              <MembershipRow
                key={m.membership_id}
                membership={m}
                isActive={m.membership_id === session.membership_id}
                disabled={isSwitching}
                onSelect={async () => {
                  if (m.membership_id === session.membership_id) {
                    setOpen(false);
                    return;
                  }
                  try {
                    await selectMembership(m.membership_id);
                    setOpen(false);
                  } catch {
                    // The error is rendered by the shell from context state.
                    setOpen(false);
                  }
                }}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
