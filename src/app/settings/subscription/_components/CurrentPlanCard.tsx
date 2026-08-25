"use client";

/**
 * CurrentPlanCard
 *
 * Shows the user's active plan, credit balance, expiry date,
 * and upgrade CTA.
 */

import React from "react";
import { ArrowRight, Calendar, CheckCircle, Crown, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { CurrentSubscription } from "@/api/subscriptionApi";
import { SUBSCRIPTION_PLANS, isUpgrade, PlanId } from "@/types/subscription.types";

interface CurrentPlanCardProps {
  subscription: CurrentSubscription;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ subscription }) => {
  const router = useRouter();

  const remainingPct = subscription.credits_total > 0
    ? Math.min(100, Math.max(0, Math.round((subscription.credits_remaining / subscription.credits_total) * 100)))
    : 0;
  const creditsUsed = Math.max(0, subscription.credits_total - subscription.credits_remaining);
  const planId = subscription.plan_id?.toUpperCase();
  const isPro = planId === "PRO";
  const isMax = planId === "MAX";
  const currentPlan = (planId as PlanId) ?? "FREE";
  const nextPlans = SUBSCRIPTION_PLANS.filter((p) => isUpgrade(currentPlan, p.plan_id));

  const expiryDate = subscription.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const included = [
    `${subscription.credits_total} credits per cycle`,
    isPro || isMax ? "Unlimited resumes and exports" : "Resume creation and parsing included",
    isPro || isMax ? "Expanded ATS scans and matching" : "Starter ATS and match workflows",
    isMax ? "Dedicated support and API access" : isPro ? "Priority support" : "Standard support",
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <div className="border-b border-gray-200 bg-[#fbfcfd] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Current plan</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-[-0.035em] text-gray-950">{subscription.plan_name}</h2>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#d9e5f8]">
            {isPro || isMax ? <Crown size={18} /> : <Zap size={18} />}
          </span>
        </div>

        {expiryDate && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600">
            <Calendar className="h-3.5 w-3.5 text-[#2557a7]" />
            Renews {expiryDate}
          </div>
        )}
      </div>

      <div className="px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black text-gray-950">Credit balance</p>
            <p className="mt-1 text-sm text-gray-500">{creditsUsed} used, {subscription.credits_remaining} remaining</p>
          </div>
          <p className="text-2xl font-black tracking-[-0.035em] text-gray-950">{remainingPct}%</p>
        </div>

        <div className="mt-4 h-2 rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#2557a7] transition-all duration-500" style={{ width: `${remainingPct}%` }} />
        </div>

        <div className="mt-5 space-y-3">
          {included.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-gray-600">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2557a7]" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {nextPlans.length > 0 && (
          <button
            onClick={() => router.push("/payments")}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91]"
          >
            Upgrade to {nextPlans[0].plan_name}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
};
