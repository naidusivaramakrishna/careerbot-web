'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, Search, UserRoundPlus } from 'lucide-react';
import {
  AdminInstitutionError,
  type CollegeSummary,
  type OfficerCandidate,
  appointOfficer,
  listColleges,
  lookupOfficer,
} from '@/api/adminInstitutionsApi';
import { useAdminAccess } from '../../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../../_components/LockedPageOverlay';

/**
 * Appointing a placement officer, by the address you were given.
 *
 * WHY THIS SCREEN EXISTS. Appointing needs an account_id — a server-generated
 * uuid with no lookup anywhere a person could reach — so the original form
 * asked operators for an identifier they could not obtain and was unusable.
 * The pairing code was built to work around that. This resolves it directly:
 * type the address, see the account, appoint.
 *
 * WHAT IS DELIBERATELY NOT HERE. There is no search-as-you-type and no
 * results list. The lookup is an exact match, so this screen cannot be used
 * to browse the consumer user base — which is the reason it needs only the
 * appoint permission rather than the one that reads the user directory.
 *
 * VERIFIED STATE IS SHOWN BEFORE THE BUTTON. An unverified account cannot
 * hold a role and the server refuses it, so finding that out after clicking
 * would be a confusing failure the page already knows how to prevent.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingPage() {
  // SAME KEY AS THE OTHER COLLEGE PAGES. A page added under /colleges without
  // this gate is reachable by any signed-in admin until the first request
  // comes back 403 -- the server refuses, but the operator sees a broken
  // screen instead of an honest "not for you".
  const { hasAccess, requiredRoles, loading: accessLoading } =
    useAdminAccess('colleges');

  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [collegeId, setCollegeId] = useState('');
  const [email, setEmail] = useState('');
  const [candidate, setCandidate] = useState<OfficerCandidate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [looking, setLooking] = useState(false);
  const [appointing, setAppointing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const page = await listColleges({ limit: 200 });
        setColleges(page.items ?? []);
      } catch {
        // A failed college list is not fatal here — the id can still be typed.
        setColleges([]);
      }
    })();
  }, []);

  const emailValid = useMemo(() => EMAIL_SHAPE.test(email.trim()), [email]);

  const find = useCallback(async () => {
    setLooking(true); setError(null); setDone(null);
    setCandidate(null); setNotFound(false);
    try {
      const res = await lookupOfficer(email.trim());
      if (res.found && res.account) setCandidate(res.account);
      else setNotFound(true);
    } catch (err) {
      setError(err instanceof AdminInstitutionError ? err.message : 'Could not look that address up.');
    } finally {
      setLooking(false);
    }
  }, [email]);

  const appoint = useCallback(async () => {
    if (!candidate || !collegeId) return;
    setAppointing(true); setError(null);
    try {
      await appointOfficer(collegeId, {
        account_id: candidate.account_id,
        display_name: candidate.full_name,
      });
      const college = colleges.find((c) => c.id === collegeId);
      setDone(`${candidate.full_name ?? candidate.email} is now the placement officer for ${college?.name ?? collegeId}.`);
      setCandidate(null); setEmail('');
    } catch (err) {
      setError(err instanceof AdminInstitutionError ? err.message : 'Could not appoint that account.');
    } finally {
      setAppointing(false);
    }
  }, [candidate, collegeId, colleges]);

  // has_officer, not the label: a staffed college may simply have no name recorded.
  const withoutOfficer = colleges.filter((c) => !c.has_officer);

  if (accessLoading) return null;
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  return (
    <div className="p-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
        <UserRoundPlus className="h-5 w-5 text-gray-500" />
        Onboarding
      </h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Appoint a placement officer. Ask them to sign up first with any email — a personal one is fine.
      </p>

      {withoutOfficer.length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <b>{withoutOfficer.length}</b> {withoutOfficer.length === 1 ? 'college has' : 'colleges have'} no officer yet:{' '}
          {withoutOfficer.slice(0, 5).map((c) => c.name).join(', ')}
          {withoutOfficer.length > 5 ? ` and ${withoutOfficer.length - 5} more` : ''}.
        </div>
      )}

      {done && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {done}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
      )}

      <div className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <label htmlFor="college" className="mb-1 block text-sm font-medium text-gray-700">College</label>
          <select
            id="college"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Choose a college…</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id}){c.has_officer ? ` — officer: ${c.officer ?? 'appointed'}` : ' — no officer'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Their email address
          </label>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setCandidate(null); setNotFound(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && emailValid) void find(); }}
              placeholder="cpo@college.edu"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void find()}
              disabled={!emailValid || looking}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            The whole address, exactly. This finds one account, it does not search.
          </p>
        </div>

        {notFound && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            No account with that address. They need to sign up on CareerBOT first — then come back here.
          </div>
        )}

        {candidate && (
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-medium text-gray-900">{candidate.full_name ?? candidate.email}</div>
            <div className="mt-0.5 text-sm text-gray-600">{candidate.email}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded px-2 py-0.5 ring-1 ${candidate.can_hold_role
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                : 'bg-amber-50 text-amber-800 ring-amber-600/20'}`}>
                {candidate.can_hold_role ? 'verified' : candidate.status.replace(/_/g, ' ')}
              </span>
              {candidate.created_at && (
                <span className="text-gray-500">joined {candidate.created_at.slice(0, 10)}</span>
              )}
            </div>

            {!candidate.can_hold_role && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This account has not verified its email, so it cannot hold a role yet. Appointing it would be refused.
              </div>
            )}

            <button
              onClick={() => void appoint()}
              disabled={!collegeId || !candidate.can_hold_role || appointing}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#004FFF] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {appointing && <Loader2 className="h-4 w-4 animate-spin" />}
              Appoint as placement officer
            </button>
            {!collegeId && <p className="mt-1.5 text-xs text-gray-500">Choose a college first.</p>}
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Importing a student roster is done inside a college —{' '}
        <Link href="/admin/dashboard/colleges" className="text-[#004FFF] hover:underline">open the college</Link>{' '}
        and its officer imports the spreadsheet.
      </p>
    </div>
  );
}
