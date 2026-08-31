"use client";

/**
 * Settings > Subscription Page
 *
 * Shows current plan, credit usage, and billing history.
 */

import React from "react";
import { AlertCircle, ArrowLeft, CreditCard, Loader, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCurrentSubscription } from "@/hooks/useCurrentSubscription";
import { CurrentPlanCard } from "./_components/CurrentPlanCard";
import { UsageHistoryTable } from "./_components/UsageHistoryTable";
import { BillingHistory } from "./_components/BillingHistory";

const SubscriptionPage: React.FC = () => {
  const { subscription, loading, error } = useCurrentSubscription();

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="rounded-2xl border border-gray-200 bg-white px-8 py-7 text-center shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <Loader className="mx-auto h-8 w-8 animate-spin text-[#2557a7]" />
            <p className="mt-4 text-sm font-black text-gray-950">Loading subscription</p>
            <p className="mt-1 text-sm text-gray-500">Preparing plan, credits, and billing history.</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !subscription) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white px-8 py-7 text-center shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <AlertCircle size={20} />
            </span>
            <p className="mt-4 text-sm font-black text-gray-950">Unable to load subscription</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">{error || "Failed to load subscription details"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91]"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-5 text-gray-950 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.055)] sm:px-6">
          <Link
            href="/settings"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-black text-[#2557a7] transition hover:bg-[#eef4ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Billing workspace</p>
              <h1 className="mt-1.5 text-[26px] font-black leading-tight tracking-[-0.03em] text-gray-950 sm:text-[30px]">
                Plan and credits
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Review your current CareerBot plan, monitor credit usage, and access billing records without leaving settings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 sm:min-w-[330px]">
              <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-gray-200">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Plan</p>
                <p className="mt-1 truncate text-sm font-black text-gray-950">{subscription.plan_name}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-gray-200">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Credits left</p>
                <p className="mt-1 text-lg font-black text-gray-950">{subscription.credits_remaining}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <CurrentPlanCard subscription={subscription} />
            <div className="rounded-2xl border border-[#c8d7ef] bg-[#f8fbff] px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2557a7] ring-1 ring-[#d9e5f8]">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-black text-gray-950">Secure billing</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Payments and invoices are handled through authenticated account billing records.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <UsageHistoryTable />
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.04)] sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[#2557a7]">
                    <CreditCard size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-black text-gray-950">Need a different plan?</p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">Compare available plans and choose the credit capacity that fits your job search.</p>
                  </div>
                </div>
                <Link
                  href="/payments"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91]"
                >
                  Manage plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        <BillingHistory />
      </div>
    </main>
  );
};

export default SubscriptionPage;
