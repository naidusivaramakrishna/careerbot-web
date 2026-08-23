'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, GraduationCap, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { cn } from '@/lib/utils';
import { useInstitution } from '@/contexts/InstitutionContext';
import { ROLE_LABELS, ROLE_SCOPE_HINT } from '@/lib/institutionMessages';
import { EmptyState } from './EmptyState';
import { ErrorNotice } from './ErrorNotice';
import { InstitutionShell } from './InstitutionShell';
import { FOCUS_RING } from './tokens';

/**
 * The entry gate for the whole college area. Four states, each designed:
 *
 *   1. loading memberships        — skeleton in the shape of the picker
 *   2. no memberships             — this area is simply not for this person
 *   3. memberships, none active   — pick a college (the token exchange)
 *   4. active session             — the shell
 *
 * State 2 is the important one: an ordinary jobseeker getting `[]` back is a
 * NORMAL answer, not an error, and must never see an error, a login prompt or
 * an empty dashboard that looks broken.
 */
function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div
        className="flex min-h-screen items-start justify-center px-4 pb-10 pt-20"
        style={{ backgroundColor: '#eef2fb' }}
      >
        <div className="w-full max-w-[520px]">{children}</div>
      </div>
    </>
  );
}

function PickerSkeleton() {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5" aria-hidden>
      <SkeletonLoader className="h-4 w-40" />
      <SkeletonLoader className="mt-2 h-3 w-64" />
      <div className="mt-5 space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-[#e2e8f0] p-3">
            <SkeletonLoader className="h-4 w-32" />
            <SkeletonLoader className="mt-2 h-3 w-44" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CollegePicker() {
  const { memberships, selectMembership, isSwitching, switchError } = useInstitution();
  const [pendingId, setPendingId] = useState<string | null>(null);
  // StrictMode invokes effects twice in development; without this the auto-enter
  // below would mint two institution sessions on every mount.
  const autoEnteredRef = useRef(false);

  // One membership and no choice to make: go straight in. A picker with a
  // single option is a speed bump, not a decision.
  useEffect(() => {
    if (autoEnteredRef.current) return;
    if (memberships.length === 1 && !isSwitching && !switchError) {
      autoEnteredRef.current = true;
      const only = memberships[0].membership_id;
      setPendingId(only);
      void selectMembership(only).catch(() => {
        autoEnteredRef.current = false;
        setPendingId(null);
      });
    }
  }, [memberships, selectMembership, isSwitching, switchError]);

  if (memberships.length === 1 && !switchError) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-8">
        <Loader2
          className="h-4 w-4 animate-spin text-[#2557a7] motion-reduce:animate-none"
          aria-hidden
        />
        <span role="status" className="text-[13px] text-[#475569]">
          Opening your college…
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <h1 className="text-[16px] font-semibold leading-6 text-[#0f172a]">Choose a college</h1>
      <p className="mt-1 text-[13px] leading-5 text-[#64748b]">
        You belong to more than one. Everything you do next applies to the college you pick here.
      </p>

      {switchError ? <ErrorNotice error={switchError} className="mt-4" /> : null}

      <ul className="mt-4 space-y-2">
        {memberships.map((m) => {
          const busy = isSwitching && pendingId === m.membership_id;
          return (
            <li key={m.membership_id}>
              <button
                type="button"
                disabled={isSwitching}
                onClick={async () => {
                  setPendingId(m.membership_id);
                  try {
                    await selectMembership(m.membership_id);
                  } catch {
                    setPendingId(null);
                  }
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border border-[#e2e8f0] px-3 py-3 text-left',
                  'transition-colors duration-150 motion-reduce:transition-none',
                  'hover:border-[#c7d9f5] hover:bg-[#f8fafc]',
                  'disabled:cursor-not-allowed disabled:opacity-70',
                  FOCUS_RING,
                )}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]"
                  aria-hidden
                >
                  <Building2 className="h-4 w-4 text-[#2557a7]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold leading-5 text-[#0f172a]">
                    {m.institution_id.replace(/[-_]+/g, ' ').toUpperCase()}
                  </span>
                  <span className="block text-[12px] leading-4 text-[#64748b]">
                    {ROLE_LABELS[m.role]} · {ROLE_SCOPE_HINT[m.role]}
                  </span>
                </span>
                {busy ? (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-[#2557a7] motion-reduce:animate-none"
                    aria-hidden
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function InstitutionGate({ children }: { children: React.ReactNode }) {
  const { memberships, isLoadingMemberships, membershipsError, session } = useInstitution();

  if (isLoadingMemberships) {
    return (
      <GateFrame>
        <PickerSkeleton />
        <span role="status" aria-live="polite" className="sr-only">
          Checking your colleges
        </span>
      </GateFrame>
    );
  }

  if (membershipsError) {
    return (
      <GateFrame>
        <ErrorNotice error={membershipsError} />
      </GateFrame>
    );
  }

  if (memberships.length === 0) {
    return (
      <GateFrame>
        <EmptyState
          icon={GraduationCap}
          title="No college account here"
          body="This area is for students and staff of a partner college. Your CareerBOT account is not linked to one. If your college uses CareerBOT, your placement office can add you."
          action={
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                Go to my dashboard
              </Button>
            </Link>
          }
        />
      </GateFrame>
    );
  }

  if (!session) {
    return (
      <GateFrame>
        <CollegePicker />
      </GateFrame>
    );
  }

  return <InstitutionShell>{children}</InstitutionShell>;
}
