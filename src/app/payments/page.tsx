'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getCurrentSubscription, Plan } from '@/api/paymentApi';
import { useAuth } from '@/hooks/useAuth';
import { PricingPlans } from '@/components/payments/PricingPlans';

export default function PricingPage() {
  const router = useRouter();
  // /payments is a public landing page — useAuth() skips the login-redirect
  // path on a 401 so anonymous visitors keep seeing this page.
  const { isAuthenticated: isSignedIn, isLoading } = useAuth();
  const knownSignedIn = !isLoading && isSignedIn;

  // Which plan the visitor is already on, so the card for it renders as
  // "Current Plan" instead of inviting them to buy what they already pay for.
  // PricingPlans and PricingCard have supported this since they were written;
  // nothing ever passed the id.
  const [currentPlanId, setCurrentPlanId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!knownSignedIn) {
      setCurrentPlanId(undefined);
      return;
    }
    let cancelled = false;
    getCurrentSubscription()
      .then((sub) => { if (!cancelled) setCurrentPlanId(sub?.plan_id ?? undefined); })
      // No badge is the safe default: showing the wrong plan as current is
      // worse than showing none.
      .catch(() => { if (!cancelled) setCurrentPlanId(undefined); });
    return () => { cancelled = true; };
  }, [knownSignedIn]);

  // A plan the visitor picked before the auth probe finished. Dropping the
  // click was the first fix and it was wrong in a quieter way: the button does
  // nothing, the visitor clicks again, and the choice is still lost. It is
  // held here and followed through the moment auth resolves.
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);

  const goToPlan = useCallback(
    (destination: string) => {
      // /payments is public but /dashboard and /payments/checkout are NOT
      // (src/middleware.ts lists only the exact path '/payments'). Pushing an
      // anonymous visitor at either one hands them to the middleware, which
      // bounces them to login and eats the plan they just chose -- so send
      // them to login ourselves, carrying it.
      router.push(
        isSignedIn ? destination : `/?showLogin=true&next=${encodeURIComponent(destination)}`,
      );
    },
    [isSignedIn, router],
  );

  useEffect(() => {
    if (isLoading || !pendingDestination) return;
    setPendingDestination(null);
    goToPlan(pendingDestination);
  }, [isLoading, pendingDestination, goToPlan]);

  const handleSelectPlan = (plan: Plan) => {
    const destination =
      plan.price_inr_monthly === 0
        ? '/dashboard'
        : `/payments/checkout?plan=${encodeURIComponent(plan.id)}`;

    // Auth still unknown -- routing now would be a guess, so remember the
    // choice and act on it below rather than discarding the click.
    if (isLoading) {
      setPendingDestination(destination);
      return;
    }
    goToPlan(destination);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href={knownSignedIn ? '/dashboard' : '/'}
            className="flex items-center transition-opacity hover:opacity-80"
            aria-label={knownSignedIn ? 'Return to dashboard' : 'CareerBOT home'}
          >
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={48}
              height={48}
              className="-mr-1 shrink-0"
              style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
              priority
            />
            <span className="text-xl font-bold tracking-tight text-[#2557a7]">CareerBOT</span>
          </Link>

          {/* {!knownSignedIn && (
            <Link
              href="/builder/start"
              className="inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] active:scale-95"
            >
              Get Started Free
            </Link>
          )} */}
        </nav>
      </header>

      {/* Breadcrumbs */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-3 lg:px-8">
          {!isLoading && (
            <>
              <Link
                href={knownSignedIn ? '/dashboard' : '/'}
                className="text-xs font-medium text-slate-500 transition-colors hover:text-[#2557a7]"
              >
                {knownSignedIn ? 'Dashboard' : 'Home'}
              </Link>
              <ChevronRight size={13} className="text-slate-300" />
              <span className="text-xs font-semibold text-[#2557a7]">Pricing</span>
            </>
          )}
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1">
        <div id="plans" className="mx-auto max-w-6xl px-4 py-10 pb-16 lg:px-8">
          <PricingPlans onSelectPlan={handleSelectPlan} currentPlanId={currentPlanId} />
        </div>
      </main>

      {/* Legal strip — the only Terms/Privacy links on the payment flow */}
      <footer className="border-t border-slate-100 bg-slate-50 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 text-xs text-slate-500 lg:px-8">
          <Link href="/terms-of-service" className="hover:text-[#2557a7]">Terms of Service</Link>
          <span className="text-slate-300">·</span>
          <Link href="/privacy-policy" className="hover:text-[#2557a7]">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
