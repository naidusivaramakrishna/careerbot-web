'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import {
  AdminInstitutionError,
  type CollegeDetail,
  appointOfficerByCode,
  getCollege,
  revokeOfficer,
} from '@/api/adminInstitutionsApi';
import { useAdminAccess } from '../../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../../_components/LockedPageOverlay';

/**
 * One college, and who holds placement-officer authority in it.
 *
 * WHAT IS NOT HERE, and why:
 *
 *   No students, and no student counts. An admin holds no READ_STUDENTS
 *   permission and the scope layer refuses a platform actor student rows
 *   without an explicit support grant. The API returns none. A count is
 *   derived from the same rows, so it is the same refusal.
 *
 *   No officer names or emails. The membership model deliberately carries no
 *   information from the global user account, so there is nothing to render
 *   but the ids the college itself typed.
 *
 *   No feature toggles yet. The route to change them does not exist; showing a
 *   control that cannot save is worse than showing none.
 */
export default function CollegeDetailPage() {
  const params = useParams<{ collegeId: string }>();
  const collegeId = decodeURIComponent(String(params?.collegeId ?? ''));
  const { hasAccess, requiredRoles, loading: accessLoading } =
    useAdminAccess('colleges');

  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [pairingCode, setPairingCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [appointError, setAppointError] = useState<string | null>(null);
  const [isAppointing, setIsAppointing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCollege(await getCollege(collegeId));
    } catch (err) {
      setError(err instanceof AdminInstitutionError
        ? err.message
        : 'Could not load this college.');
    } finally {
      setIsLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    if (hasAccess && collegeId) void load();
  }, [hasAccess, collegeId, load]);

  const appoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAppointing(true);
    setAppointError(null);
    try {
      await appointOfficerByCode(collegeId, {
        code: pairingCode.trim(),
        display_name: displayName.trim() || null,
      });
      setPairingCode('');
      setDisplayName('');
      await load();
    } catch (err) {
      setAppointError(
        err instanceof AdminInstitutionError && err.isConflict
          ? 'That account is already a placement officer here.'
          : err instanceof AdminInstitutionError
            ? err.message
            : 'Could not appoint that person.',
      );
    } finally {
      setIsAppointing(false);
    }
  };

  const revoke = async (membershipId: string) => {
    setRevoking(membershipId);
    setError(null);
    try {
      await revokeOfficer(collegeId, membershipId);
      setConfirming(null);
      await load();
    } catch (err) {
      setError(err instanceof AdminInstitutionError
        ? err.message
        : 'Could not revoke that officer.');
    } finally {
      setRevoking(null);
    }
  };

  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  return (
    <div className="p-6">
      <Link
        href="/admin/dashboard/colleges"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All colleges
      </Link>

      {isLoading && !college ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error && !college ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : college ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {college.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-500">{college.id}</p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Subscription
              </p>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {college.subscription_status}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Placement officers
              </p>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {college.cpos.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Switched-off features
              </p>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {college.disabled_features.length === 0
                  ? 'none'
                  : college.disabled_features.length}
              </p>
            </div>
          </div>

          {error ? (
            <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <section className="mb-6 rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Placement officers
              </h2>
              <p className="mt-0.5 text-sm text-gray-600">
                An officer reads the whole college. Revoking takes that away
                immediately.
              </p>
            </div>

            {college.cpos.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ShieldCheck className="mx-auto mb-2 h-7 w-7 text-gray-300" aria-hidden />
                <p className="text-sm font-medium text-gray-900">
                  No officer yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Until somebody is appointed, nobody at this college can use
                  it.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {college.cpos.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {o.display_name?.trim() || o.account_id}
                      </p>
                      {o.display_name?.trim() ? (
                        <p className="truncate font-mono text-xs text-gray-500">
                          {o.account_id}
                        </p>
                      ) : null}
                    </div>

                    {confirming === o.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Revoke this officer?
                        </span>
                        <button
                          onClick={() => void revoke(o.id)}
                          disabled={revoking === o.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                        >
                          {revoking === o.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : null}
                          Yes, revoke
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      // Confirmed, not immediate. Revoking removes somebody's
                      // access to an entire college, and the row above it is
                      // one mis-click away.
                      <button
                        onClick={() => setConfirming(o.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <UserMinus className="h-4 w-4" aria-hidden />
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-1 text-base font-semibold text-gray-900">
              Appoint a placement officer
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Ask them to sign in to CareerBOT, open their profile, and read you
              their pairing code. Any email works &mdash; a personal one is fine.
            </p>

            {/* The code proves which account is theirs. It grants nothing on
                its own: this form is the appointment, and the officer list
                above shows who you just gave the college to. It replaced a
                field asking for an internal account id that nobody could
                obtain without database access. */}
            <ol className="mb-5 space-y-1.5 text-sm text-gray-600">
              <li><b className="text-gray-900">1.</b> They sign in and generate a code &mdash; it lasts 15 minutes.</li>
              <li><b className="text-gray-900">2.</b> They read it to you.</li>
              <li><b className="text-gray-900">3.</b> You enter it below.</li>
            </ol>

            <form onSubmit={appoint} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Pairing code
                </span>
                <input
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  placeholder="QWAP3-SXHZ2"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase tracking-wider"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Case and dashes do not matter &mdash; type it as you hear it.
                </span>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Name for your records
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="P. Menon"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Optional. Stored on the membership, not read from their
                  account.
                </span>
              </label>

              {appointError ? (
                <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {appointError}
                </p>
              ) : null}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isAppointing || !pairingCode.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isAppointing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <UserPlus className="h-4 w-4" aria-hidden />
                  )}
                  Appoint
                </button>
              </div>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
