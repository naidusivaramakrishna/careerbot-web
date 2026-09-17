'use client';

import React, { useState } from 'react';
import { Copy, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PairingError, issuePairingCode } from '@/api/pairingApi';
import { SectionTitle } from './Typography';

/**
 * Where somebody proves which account is theirs.
 *
 * Appointing a placement officer needs an internal account id and there is no
 * lookup by email anywhere. Rather than an operator hunting for that id, the
 * person generates a code here and reads it out on the call that is already
 * happening.
 *
 * THE CODE GRANTS NOTHING. It says "this is my account" and nothing more --
 * the admin still decides. That is why it is safe to read aloud, and why it
 * travels from the person to the admin rather than the other way: a credential
 * going the other way is one a forward or a screenshot turns into somebody
 * else's access to a whole college.
 *
 * SHOWN ONCE. Not stored anywhere it can be recovered from, which is fine
 * because generating another takes one click.
 */
export function PairingCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    setError(null);
    setCopied(false);
    try {
      const issued = await issuePairingCode();
      setCode(issued.code);
      setMinutes(issued.expires_in_minutes);
    } catch (err) {
      setError(err instanceof PairingError
        ? err.message
        : 'Could not generate a code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is refused in plenty of ordinary situations -- an
      // insecure origin, a browser setting, a permission prompt declined. The
      // code is on screen either way, and it is meant to be read aloud.
      setCopied(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <SectionTitle className="mb-1">Joining a college?</SectionTitle>
      <p className="mb-4 text-[13px] leading-relaxed text-[#475569]">
        If someone is setting you up as a placement officer, generate a code and
        read it to them. It proves this account is yours &mdash; it does not give
        anyone access to anything.
      </p>

      {code ? (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-[#f1f5f9] px-4 py-3">
            <span className="font-mono text-2xl font-semibold tracking-[0.15em] text-[#0f172a]">
              {code}
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-[12px] text-[#64748b]">
            Valid for {minutes} minutes, and usable once. It is not shown again
            &mdash; generate another if you need one.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void generate()}
            disabled={isLoading}
            className="mt-3"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Generate a new one
          </Button>
        </>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={() => void generate()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <KeyRound className="mr-1.5 h-4 w-4" aria-hidden />
          )}
          Generate a pairing code
        </Button>
      )}

      {error ? (
        <p className="mt-3 rounded-lg bg-[#fee2e2] px-3 py-2 text-[13px] text-[#991b1b]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
