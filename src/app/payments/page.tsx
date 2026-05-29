'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plan } from '@/api/paymentApi';
import { PricingPlans } from '@/components/payments/PricingPlans';

export default function PricingPage() {
  const router = useRouter();

  const handleSelectPlan = (plan: Plan) => {
    console.log('[Pricing] Plan selected:', plan.id, plan.name);

    // Free plan - users can just start using it
    if (plan.price_inr_monthly === 0) {
      console.log('[Pricing] Free plan - redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    // Paid plan - go to checkout
    console.log('[Pricing] Paid plan - redirecting to checkout');
    router.push(`/payments/checkout?plan=${plan.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16 pb-24">
        <PricingPlans onSelectPlan={handleSelectPlan} />
      </div>
    </div>
  );
}
