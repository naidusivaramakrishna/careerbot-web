'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Gauge, Loader2, PauseCircle, Pencil, PlayCircle, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import {
  AdminInstitutionError,
  type CollegeDetail,
  type SubscriptionStatus,
  appointOfficerByCode,
  getCollege,
  markCollegePaid,
  renameCollege,
  renewCollege,
  setCollegePaidUntil,
  setCollegeStatus,
  revokeOfficer,
  setCollegePaused,
} from '@/api/adminInstitutionsApi';
import { useAdminAccess } from '../../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../../_components/LockedPageOverlay';
import { FeatureToggles } from '../_components/FeatureToggles';
import { TierBadge } from '../_components/TierBadge';

/** A trial end date is only meaningful as a date. */
const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined,
        { day: 'numeric', month: 'short', year: 'numeric' });
};

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

  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [paidNotice, setPaidNotice] = useState<string | null>(null);
  // Months the payment covers. '' = no end date, which is what marking paid
  // always did before a paid period existed.
  const [paidMonths, setPaidMonths] = useState('');

  const [renewMonths, setRenewMonths] = useState('12');
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewNotice, setRenewNotice] = useState<string | null>(null);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [paidUntilDraft, setPaidUntilDraft] = useState('');
  const [isSettingDate, setIsSettingDate] = useState(false);
  const [statusDraft, setStatusDraft] = useState<SubscriptionStatus | ''>('');
  const [isSettingStatus, setIsSettingStatus] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

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

  const [pausing, setPausing] = useState(false);
  const [pauseNotice, setPauseNotice] = useState<string | null>(null);

  // A TYPO IN THE NAME CAN BE CORRECTED. Only the display name: the id is the
  // tenant key and the server refuses a body that carries it.
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameNotice, setNameNotice] = useState<string | null>(null);

  const startEditingName = () => {
    if (!college) return;
    setNameDraft(college.name);
    setNameError(null);
    setNameNotice(null);
    setEditingName(true);
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college || savingName) return;
    const next = nameDraft.trim();
    if (!next) {
      setNameError('Enter a college name.');
      return;
    }
    if (next.length > 200) {
      setNameError('The name can be at most 200 characters.');
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const res = await renameCollege(college.id, next);
      // changed:false is a success: the name was already exactly this.
      setNameNotice(res.changed ? 'College name updated.' : 'That is already the name — nothing changed.');
      setEditingName(false);
      await load();
    } catch (err) {
      setNameError(
        err instanceof AdminInstitutionError && err.isConflict
          ? 'Someone else changed this name. Reload and try again.'
          : err instanceof AdminInstitutionError
            ? err.message
            : 'Could not update the name.',
      );
    } finally {
      setSavingName(false);
    }
  };

  // PAUSING IS NOT A BILLING ACT, and the button is here rather than beside
  // "mark paid" to say so: a platform admin may hold a college over a
  // vacation or stop a bad rollout without ever being able to declare that
  // an invoice was settled. The two permissions are separate on the server.
  const togglePaused = useCallback(async () => {
    if (!college) return;
    const next = college.subscription_status !== 'paused';
    setPausing(true);
    setPauseNotice(null);
    try {
      const res = await setCollegePaused(college.id, next);
      // The server reports changed:false when the college was already in
      // that state. Saying so is better than a success message for
      // something that did not happen.
      setPauseNotice(
        res.changed
          ? next ? 'College paused. Students are told on arrival.' : 'College resumed.'
          : 'Already in that state — nothing changed.',
      );
      await load();
    } catch (err) {
      setPauseNotice(
        err instanceof AdminInstitutionError ? err.message : 'Could not change that.');
    } finally {
      setPausing(false);
    }
  }, [college, load]);

  useEffect(() => {
    if (hasAccess && collegeId) void load();
  }, [hasAccess, collegeId, load]);

  const markPaid = async () => {
    if (isMarkingPaid) return;
    setIsMarkingPaid(true);
    setPaidNotice(null);
    setError(null);
    try {
      const result = await markCollegePaid(
        collegeId, paidMonths ? Number(paidMonths) : undefined);
      // changed:false IS a success. A double click, or a retry after a
      // timeout, lands here -- and calling it a failure would have the
      // operator press the button again.
      setPaidNotice(result.changed
        ? 'Marked as paid. Their trial has ended.'
        : 'This college was already marked as paid.');
      await load();
    } catch (err) {
      setError(err instanceof AdminInstitutionError
        ? err.message
        : 'Could not mark this college as paid.');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // RENEWING IS NOT IDEMPOTENT, on purpose: each press is a payment that
  // arrived and adds a period. The button is disabled while the request is in
  // flight so a double click cannot add two.
  const renew = async () => {
    if (isRenewing) return;
    setIsRenewing(true);
    setRenewNotice(null);
    setRenewError(null);
    try {
      const res = await renewCollege(collegeId, Number(renewMonths));
      setRenewNotice(`Renewed. Paid until ${formatDate(res.paid_until)}.`);
      await load();
    } catch (err) {
      setRenewError(
        err instanceof AdminInstitutionError && err.isConflict
          ? 'Someone else changed this period. Reload and try again.'
          : err instanceof AdminInstitutionError
            ? err.message
            : 'Could not renew this college.',
      );
    } finally {
      setIsRenewing(false);
    }
  };

  // YYYY-MM-DD for <input type=date>, in the operator's own calendar (the
  // server bounds the date against ITS clock; this only limits the picker).
  const toDateInput = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 10);

  // CORRECTING IS DIFFERENT FROM RENEWING: it SETS the end date instead of
  // adding to it, so a period entered wrong (3 years for 3 months) can be
  // fixed whatever the college had paid for before -- and it can shorten.
  const correctPaidUntil = async () => {
    if (isSettingDate || !paidUntilDraft) return;
    setIsSettingDate(true);
    setRenewNotice(null);
    setRenewError(null);
    try {
      const res = await setCollegePaidUntil(collegeId, paidUntilDraft);
      setRenewNotice(res.changed
        ? `Paid until ${formatDate(res.paid_until)}.`
        : 'That is already the end date — nothing changed.');
      setPaidUntilDraft('');
      await load();
    } catch (err) {
      setRenewError(
        err instanceof AdminInstitutionError && err.isConflict
          ? 'Someone else changed this period. Reload and try again.'
          : err instanceof AdminInstitutionError
            ? err.message
            : 'Could not set the date.',
      );
    } finally {
      setIsSettingDate(false);
    }
  };

  // THE BILLING ROUTE: the pause button above only moves paused <-> active.
  // Grace and expired -- and getting an expired college back out -- are
  // billing outcomes, so this needs the billing permission and a 403 is
  // reported as exactly that.
  const applyStatus = async () => {
    if (!college || isSettingStatus || !statusDraft) return;
    setIsSettingStatus(true);
    setStatusNotice(null);
    setStatusError(null);
    try {
      const res = await setCollegeStatus(college.id, statusDraft);
      const effective = res.effective_subscription_status;
      setStatusNotice(
        !res.changed
          ? 'Already in that status — nothing changed.'
          : effective && effective !== res.subscription_status
            ? `Status set to ${res.subscription_status}, but the college is ${effective} because its paid period has ended. Renew it or set a new end date.`
            : `Status set to ${res.subscription_status}.`,
      );
      setStatusDraft('');
      await load();
    } catch (err) {
      setStatusError(
        err instanceof AdminInstitutionError && err.isForbidden
          ? 'You are not allowed to change a college\'s billing status.'
          : err instanceof AdminInstitutionError && err.isConflict
            ? 'Someone else changed this status. Reload and try again.'
            : err instanceof AdminInstitutionError
              ? err.message
              : 'Could not change the status.',
      );
    } finally {
      setIsSettingStatus(false);
    }
  };

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
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              {editingName ? (
                <form onSubmit={saveName} className="flex flex-wrap items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    maxLength={200}
                    autoFocus
                    aria-label="College name"
                    className="w-72 rounded-lg border border-gray-300 px-3 py-1.5
                               text-lg font-semibold text-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600
                               px-3 py-1.5 text-sm font-medium text-white
                               hover:bg-blue-700 disabled:opacity-40"
                  >
                    {savingName && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    disabled={savingName}
                    className="rounded-lg border border-gray-300 px-3 py-1.5
                               text-sm font-medium text-gray-700 hover:bg-gray-50
                               disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                  {college.name}
                  <button
                    type="button"
                    onClick={startEditingName}
                    aria-label="Edit college name"
                    title="Edit college name"
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100
                               hover:text-gray-700"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                </h1>
              )}
              {nameError && (
                <p role="alert" className="mt-1 text-sm text-rose-700">{nameError}</p>
              )}
              {nameNotice && !editingName && (
                <p role="status" className="mt-1 text-sm text-emerald-700">{nameNotice}</p>
              )}
              <p className="mt-1 font-mono text-xs text-gray-500">{college.id}</p>
              <div className="mt-3">
                <TierBadge
                  tier={college.tier}
                  daysRemaining={college.trial_days_remaining}
                />
              </div>
            </div>

            {/* OFFERED ONLY WHERE IT DOES SOMETHING. On a paid college the
                call would succeed with changed:false, which is a confusing
                thing to hand somebody who pressed it deliberately. It is also
                hidden for a college whose tier the server did not send at
                all, rather than guessed at. */}
            {college.tier && college.tier !== 'paid' && (
              <div className="flex items-center gap-2">
                <select
                  value={paidMonths}
                  onChange={(e) => setPaidMonths(e.target.value)}
                  aria-label="Paid period"
                  className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="">No end date</option>
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">1 year</option>
                  <option value="24">2 years</option>
                </select>
                <button
                  type="button"
                  onClick={markPaid}
                  disabled={isMarkingPaid}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600
                             px-4 py-2 text-sm font-medium text-white
                             hover:bg-emerald-700 disabled:opacity-40"
                >
                  {isMarkingPaid
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <BadgeCheck className="h-4 w-4" />}
                  Mark as paid
                </button>
              </div>
            )}

            {/* WHERE THE USAGE QUESTION GETS ANSWERED. Deliberately a link out
                rather than a panel inlined here: this page is about the
                college's account -- tier, officers, subscription -- and the
                usage view is a report with its own time window that would
                otherwise reload every time somebody opened this screen. */}
            <Link
              href={`/admin/dashboard/colleges/${encodeURIComponent(collegeId)}/ai-usage`}
              className="inline-flex items-center gap-2 rounded-lg border
                         border-gray-300 px-4 py-2 text-sm font-medium
                         text-gray-700 hover:bg-gray-50"
            >
              <Gauge className="h-4 w-4" />
              AI usage
            </Link>
          </div>

          {paidNotice && (
            <p role="status" className="mb-4 text-sm text-emerald-700">
              {paidNotice}
            </p>
          )}

          <div className={`mb-6 grid gap-3 sm:grid-cols-2 ${college.tier === 'paid' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Subscription
              </p>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {college.effective_subscription_status ?? college.subscription_status}
              </p>
              {/* The stored status is still 'active' once a paid period has
                  passed; the effective one is what students experience. Said
                  here so an operator is not left wondering why 'active' is
                  read-only. */}
              {college.effective_subscription_status &&
                college.effective_subscription_status !== college.subscription_status && (
                <p className="mt-1 text-xs text-amber-700">
                  {college.effective_subscription_status === 'grace'
                    ? 'Paid period ended. Still fully usable during grace; renew to clear it.'
                    : 'Paid period ended. Students are read-only until it is renewed.'}
                </p>
              )}
              {/* PAUSE AND RESUME ONLY, never grace or expired: those are
                  what a billing process concludes, not buttons. The server
                  refuses anything else through this permission, and the UI
                  should not offer what the server will refuse. */}
              {(college.subscription_status === 'active' ||
                college.subscription_status === 'paused') && (
                <button
                  onClick={() => void togglePaused()}
                  disabled={pausing}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {pausing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : college.subscription_status === 'paused' ? (
                    <PlayCircle className="h-3.5 w-3.5" />
                  ) : (
                    <PauseCircle className="h-3.5 w-3.5" />
                  )}
                  {college.subscription_status === 'paused' ? 'Resume college' : 'Pause college'}
                </button>
              )}
              {pauseNotice && (
                <p role="status" className="mt-2 text-xs text-emerald-700">{pauseNotice}</p>
              )}
              {/* BILLING STATUS: any of the four, including grace and expired
                  and back out of expired. Separate from pause on purpose. */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="mb-1.5 text-xs text-gray-500">Set billing status:</p>
                <div className="flex items-center gap-2">
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as SubscriptionStatus | '')}
                    aria-label="Billing status"
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  >
                    <option value="">Choose…</option>
                    <option value="active">active</option>
                    <option value="grace">grace</option>
                    <option value="paused">paused</option>
                    <option value="expired">expired</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void applyStatus()}
                    disabled={isSettingStatus || !statusDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isSettingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Apply
                  </button>
                </div>
                {statusNotice && (
                  <p role="status" className="mt-2 text-xs text-emerald-700">{statusNotice}</p>
                )}
                {statusError && (
                  <p role="alert" className="mt-2 text-xs text-rose-700">{statusError}</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {college.tier === 'trial' ? 'Trial ends' : 'Trial ended'}
              </p>
              {/* Shown even after they upgrade. Once the countdown is over
                  this date answers "how long did they evaluate before
                  buying", which is the useful version of it. */}
              <p className="mt-1 text-lg font-medium tabular-nums text-gray-900">
                {formatDate(college.trial_ends_at)}
              </p>
            </div>
            {college.tier === 'paid' && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Paid until
                </p>
                <p className="mt-1 text-lg font-medium tabular-nums text-gray-900">
                  {college.paid_until ? formatDate(college.paid_until) : 'No end date'}
                </p>
                {college.paid_until ? (
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={renewMonths}
                    onChange={(e) => setRenewMonths(e.target.value)}
                    aria-label="Renew for"
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  >
                    <option value="1">1 month</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">1 year</option>
                    <option value="24">2 years</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void renew()}
                    disabled={isRenewing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isRenewing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Renew
                  </button>
                </div>
                ) : (
                  /* Renew adds months to an existing end date. With none, there is nothing to add
                     to, and the server would start a period from today, turning a college that
                     never expires into one that does. Setting a date below is the explicit way. */
                  <p className="mt-3 text-xs text-gray-500">
                    No end date, so there is nothing to renew. To start a paid period, set an end date below.
                  </p>
                )}
                {/* Renew ADDS; this SETS. Offered because a wrong entry could
                    not otherwise be fixed (and "N months from today" would
                    throw away time already paid for). */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-1.5 text-xs text-gray-500">
                    {college.paid_until ? 'Wrong date? Set the exact end date:' : 'Set the end date:'}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={paidUntilDraft}
                      min={toDateInput(today)}
                      max={toDateInput(maxDate)}
                      onChange={(e) => setPaidUntilDraft(e.target.value)}
                      aria-label="Paid until date"
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => void correctPaidUntil()}
                      disabled={isSettingDate || !paidUntilDraft}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isSettingDate && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Set
                    </button>
                  </div>
                </div>
                {renewNotice && (
                  <p role="status" className="mt-2 text-xs text-emerald-700">{renewNotice}</p>
                )}
                {renewError && (
                  <p role="alert" className="mt-2 text-xs text-rose-700">{renewError}</p>
                )}
              </div>
            )}
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

          <div className="mb-6">
            <FeatureToggles
              collegeId={college.id}
              disabled={college.disabled_features}
              onSaved={(next) =>
                setCollege((c) => (c ? { ...c, disabled_features: next } : c))}
            />
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
