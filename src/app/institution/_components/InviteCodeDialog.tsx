'use client';

import React, { useState } from 'react';
import { Check, Copy, KeyRound, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { issueInvite, revokeInvites, InstitutionApiError } from '@/api/institutionApi';
import type { IssuedInvite, Student } from '@/types/institution';
import { ErrorNotice } from './ErrorNotice';
import { Body, Caption, SectionTitle } from './Typography';

/**
 * Issue a claim code for one student.
 *
 * THE CODE IS SHOWN ONCE. The server keeps only a keyed digest and cannot
 * read it back, so this screen says so in plain words. A dialog that merely
 * displays a code implies it can be found again later, and the officer closes
 * it without writing it down.
 */
export function InviteCodeDialog({
  student,
  writable,
  onClose,
  onIssued,
}: {
  student: Student;
  writable: boolean;
  onClose: () => void;
  onIssued?: () => void;
}) {
  const [issued, setIssued] = useState<IssuedInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [copied, setCopied] = useState(false);
  // OFF UNLESS THE COLLEGE HAS AN ADDRESS. Offering "email it" for a student
  // with nowhere to send is a tick box that produces an error -- and many
  // colleges issue no student email at all, which is exactly why admission
  // number is the required identifier.
  const canEmail = Boolean(student.college_email);
  const [sendEmail, setSendEmail] = useState(false);

  const alreadyClaimed = student.claim_status === 'claimed';

  const issue = async () => {
    setBusy(true);
    setError(null);
    try {
      setIssued(await issueInvite(student.id, 30, canEmail && sendEmail));
      onIssued?.();
    } catch (err) {
      setError(err instanceof InstitutionApiError ? err : null);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    setError(null);
    try {
      await revokeInvites(student.id);
      setIssued(null);
      onIssued?.();
    } catch (err) {
      setError(err instanceof InstitutionApiError ? err : null);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions. The code is on screen and
      // selectable, so this is not worth an error message.
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
            <KeyRound className="h-4 w-4 text-[#2557a7]" aria-hidden />
          </span>
          <div className="min-w-0">
            <span id="invite-title">
              <SectionTitle>Invite code for {student.full_name}</SectionTitle>
            </span>
            <Caption className="mt-1">{student.admission_number ?? 'No admission number'}</Caption>
          </div>
        </div>

        {alreadyClaimed ? (
          <Body className="mt-4">
            This student has already claimed their account, so a new code cannot
            be issued. To move their record to a different login, the college
            must unclaim it first.
          </Body>
        ) : !issued ? (
          <>
            <Body className="mt-4">
              Give this code to {student.full_name.split(' ')[0]}. They enter it
              after signing up, and their account is linked to this roster
              record. It works once.
            </Body>

            {/* OPT IN, and only where it can work. Emailing a credential puts
                it in somebody's inbox -- it should be a choice on this screen,
                not something that happens because a default was left alone. */}
            <label className="mt-4 flex items-start gap-2.5 text-[13px]">
              <input
                type="checkbox"
                checked={canEmail && sendEmail}
                disabled={!canEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className={canEmail ? 'text-[#334155]' : 'text-[#94a3b8]'}>
                {canEmail
                  ? <>Also email it to <span className="font-medium">{student.college_email}</span></>
                  : 'No email on record for this student, so it cannot be sent.'}
              </span>
            </label>

            {error ? <ErrorNotice error={error} className="mt-4" /> : null}
          </>
        ) : (
          <>
            <Body className="mt-4">
              Copy this now. It is shown only once and cannot be looked up
              again — if it is lost, issue a new one.
            </Body>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3">
              <code className="flex-1 select-all font-mono text-[18px] font-semibold tracking-[0.08em] text-[#0f172a] tabular-nums">
                {issued.code}
              </code>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#334155] hover:bg-[#f1f5f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2557a7]"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5" aria-hidden /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" aria-hidden /> Copy</>
                )}
              </button>
            </div>
            <Caption className="mt-2">
              Valid until {new Date(issued.expires_at).toLocaleDateString()}.
            </Caption>

            {/* THE CODE IS SHOWN EITHER WAY, and that is the point. A failed
                send costs a delivery, not the invitation -- if this hid the
                code on "emailed" and the mail bounced, the officer would
                reissue and revoke a code that had already arrived. */}
            {issued.emailed ? (
              <Caption className="mt-1 text-emerald-700">
                Emailed to {student.college_email}.
              </Caption>
            ) : issued.email_error ? (
              <Caption className="mt-1 text-amber-700">
                Not emailed: {issued.email_error}. The code above still works —
                read it out or send it yourself.
              </Caption>
            ) : null}
          </>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          {!alreadyClaimed && !issued ? (
            <Button size="sm" onClick={issue} disabled={busy || !writable}>
              {busy ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Issuing…</>
              ) : (
                'Issue code'
              )}
            </Button>
          ) : null}
          {issued ? (
            <Button variant="outline" size="sm" onClick={revoke} disabled={busy}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Cancel this code
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onClose}>
            {issued ? 'Done' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
