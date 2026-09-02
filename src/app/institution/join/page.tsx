'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';

import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { claimWithInviteCode, InstitutionApiError } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { ErrorNotice } from '../_components/ErrorNotice';
import { TextField } from '../_components/FormField';
import { Body, Caption, PageTitle } from '../_components/Typography';

/**
 * Where a student turns a code from their college into an account link.
 *
 * NOT BEHIND THE COLLEGE GATE, deliberately. Whoever lands here has no
 * membership yet -- getting one is the entire purpose of the page. Putting it
 * behind the gate would show "you are not part of a college" to exactly the
 * people holding a valid invitation.
 *
 * The refusal is the same for every cause -- wrong, expired, already used,
 * or someone else's. That is the server's design and this page must not
 * embellish it: guessing which one it was is the attack.
 */
export default function JoinCollegePage() {
  const router = useRouter();
  const { refreshMemberships } = useInstitution();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await claimWithInviteCode(code.trim());
      setDone(result.institution_name);
      // The membership list is what the switcher reads, so it has to be
      // refetched before we send them in -- otherwise they arrive at a gate
      // that still believes they belong to nothing.
      await refreshMemberships();
      window.setTimeout(() => router.push('/institution'), 1200);
    } catch (err) {
      setError(err instanceof InstitutionApiError ? err : null);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Frame>
        <div className="text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff]">
            <GraduationCap className="h-5 w-5 text-[#2557a7]" aria-hidden />
          </span>
          <PageTitle className="mt-3">You are in</PageTitle>
          <Body className="mt-1">
            Your account is now linked to {done}. Taking you there…
          </Body>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff]">
          <GraduationCap className="h-5 w-5 text-[#2557a7]" aria-hidden />
        </span>
        <PageTitle className="mt-3">Join your college</PageTitle>
        <Body className="mt-1">
          Your placement office gave you a code. Enter it to link this account
          to your college record.
        </Body>
      </div>

      <form onSubmit={submit} className="mt-5">
        <TextField
          label="Invite code"
          required
          value={code}
          disabled={busy}
          hint="Looks like ABCDE-12345. Upper or lower case is fine."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
        />

        {error ? <ErrorNotice error={error} className="mt-4" /> : null}

        <Button type="submit" className="mt-4 w-full" disabled={busy || !code.trim()}>
          {busy ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Checking…</>
          ) : (
            'Join college'
          )}
        </Button>
      </form>

      <Caption className="mt-4 text-center">
        No code? Ask your placement office — they can issue one.
      </Caption>
    </Frame>
  );
}

/** Deliberately the same shell the gate's own screens use.
 *
 *  This page is reached from those screens -- a student clicks "I have an
 *  invite code" on "No college account here" -- so arriving somewhere with no
 *  header and a differently sized card reads as leaving the product. It also
 *  needs min-h-screen rather than a fraction of it: 70vh left a band of raw
 *  page background below the tinted area, which looks like a rendering fault
 *  rather than a design.
 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div
        className="flex min-h-screen items-start justify-center px-4 pb-10 pt-20"
        style={{ backgroundColor: '#eef2fb' }}
      >
        <div className="w-full max-w-[520px] rounded-xl border border-[#e2e8f0] bg-white p-6">
          {children}
        </div>
      </div>
    </>
  );
}
