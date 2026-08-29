'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, Plus, RefreshCw } from 'lucide-react';
import {
  AdminInstitutionError,
  type CollegeSummary,
  type SubscriptionStatus,
  createCollege,
  listColleges,
  slugProblem,
} from '@/api/adminInstitutionsApi';
import { useAdminAccess } from '../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../_components/LockedPageOverlay';

/**
 * Every college on the platform, and the form that creates one.
 *
 * Until this existed a college could only be created by inserting a document
 * into MongoDB by hand, so no customer could be signed up without an engineer.
 *
 * NO STUDENT DATA ANYWHERE ON THIS PAGE, and not merely by omission: an admin
 * holds no READ_STUDENTS permission and the scope layer refuses a platform
 * actor student rows without an explicit support grant. The API returns none,
 * so there is none to render -- including counts, which are derived from the
 * same rows.
 */
const PAGE_SIZE = 25;

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  grace: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  paused: 'bg-orange-50 text-orange-800 ring-orange-600/20',
  expired: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

function StatusPill({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status] ?? STATUS_STYLE.expired}`}
    >
      {status}
    </span>
  );
}

export default function CollegesPage() {
  const { hasAccess, requiredRoles, loading: accessLoading } =
    useAdminAccess('colleges');

  const [colleges, setColleges] = useState<CollegeSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: '', name: '', subscription_status: 'active' as SubscriptionStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async (nextSkip: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await listColleges({ skip: nextSkip, limit: PAGE_SIZE });
      setColleges(page.items);
      setTotal(page.total);
      setSkip(page.skip);
    } catch (err) {
      // A 403 here means "not signed in as an admin, or lacking the
      // permission". The console cannot tell those apart and must not guess:
      // telling somebody they are not an operator when their session simply
      // expired sends them to ask for access they already have.
      setError(err instanceof AdminInstitutionError
        ? err.message
        : 'Could not load colleges.');
      setColleges([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) void load(0);
  }, [hasAccess, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = slugProblem(form.id);
    setFieldError(problem);
    if (problem) return;

    setIsSaving(true);
    setFormError(null);
    try {
      await createCollege({
        id: form.id.trim(),
        name: form.name.trim(),
        subscription_status: form.subscription_status,
      });
      setForm({ id: '', name: '', subscription_status: 'active' });
      setShowForm(false);
      await load(0);
    } catch (err) {
      // A taken id is not a permission problem, and saying so plainly is the
      // difference between "pick another" and "ask for access".
      setFormError(
        err instanceof AdminInstitutionError && err.isConflict
          ? `The id "${form.id.trim()}" is already taken. Pick another.`
          : err instanceof AdminInstitutionError
            ? err.message
            : 'Could not create the college.',
      );
    } finally {
      setIsSaving(false);
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Colleges</h1>
          <p className="mt-1 text-sm text-gray-600">
            Every college on the platform. Creating one here replaces editing
            the database by hand.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load(skip)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New college
          </button>
        </div>
      </div>

      {showForm ? (
        <form
          onSubmit={submit}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5"
        >
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Create a college
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Short id
              </span>
              <input
                value={form.id}
                onChange={(e) => {
                  setForm({ ...form, id: e.target.value });
                  setFieldError(null);
                }}
                placeholder="vit"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                aria-invalid={Boolean(fieldError)}
              />
              <span className="mt-1 block text-xs text-gray-500">
                Permanent. It identifies this college everywhere, so it cannot
                be changed later.
              </span>
              {fieldError ? (
                <span className="mt-1 block text-xs text-rose-600">
                  {fieldError}
                </span>
              ) : null}
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VIT Chennai"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-xs text-gray-500">
                What staff and students will see.
              </span>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Subscription
              </span>
              <select
                value={form.subscription_status}
                onChange={(e) => setForm({
                  ...form,
                  subscription_status: e.target.value as SubscriptionStatus,
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="active">active</option>
                <option value="grace">grace</option>
                <option value="paused">paused</option>
                <option value="expired">expired</option>
              </select>
              {/* Chosen, not defaulted. "active" switches on every ordinary
                  college write the moment the row exists, and that should be
                  a decision somebody made on this screen. */}
              <span className="mt-1 block text-xs text-gray-500">
                Active lets the college start using the product straight away.
              </span>
            </label>
          </div>

          {formError ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isSaving || !form.id.trim() || !form.name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">College</th>
              <th className="px-4 py-3 font-medium">Id</th>
              <th className="px-4 py-3 font-medium">Subscription</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading && colleges === null ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
                </td>
              </tr>
            ) : colleges && colleges.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <Building2 className="mx-auto mb-2 h-7 w-7 text-gray-300" aria-hidden />
                  <p className="text-sm font-medium text-gray-900">
                    No colleges yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Create the first one, then appoint its placement officer.
                  </p>
                </td>
              </tr>
            ) : (
              (colleges ?? []).map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.id}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={c.subscription_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/dashboard/colleges/${encodeURIComponent(c.id)}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => void load(Math.max(0, skip - PAGE_SIZE))}
              disabled={skip === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => void load(skip + PAGE_SIZE)}
              disabled={skip + PAGE_SIZE >= total}
              className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
