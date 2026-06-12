'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Plan } from '@/api/paymentApi';
import { PricingPlans } from '@/components/payments/PricingPlans';
import LandingFooter from '@/app/(landing)/_components/LandingFooter';

export default function PricingPage() {
  const router = useRouter();

  const handleSelectPlan = (plan: Plan) => {
    if (plan.price_inr_monthly === 0) {
      router.push('/dashboard');
      return;
    }
    router.push(`/payments/checkout?plan=${plan.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-80"
            aria-label="CareerBOT home"
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

          <Link
            href="/builder/start"
            className="inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] active:scale-95"
          >
            Get Started Free
          </Link>
        </nav>
      </header>

      {/* Breadcrumbs */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-3 lg:px-8">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 transition-colors hover:text-[#2557a7]"
          >
            Home
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-xs font-semibold text-[#2557a7]">Pricing</span>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-14 pb-24 lg:px-8">
          <PricingPlans onSelectPlan={handleSelectPlan} />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
