'use client';

import React from 'react';
import { Check, Zap, Star, Building2, Rocket } from 'lucide-react';
import { Plan } from '@/api/paymentApi';

interface PricingCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  onSelectPlan?: (plan: Plan) => void;
  onUpgrade?: (plan: Plan) => void;
  billingCycle: 'monthly' | 'yearly';
}

const PLAN_META: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  headerText: string;
  cta: string;
  highlight: boolean;
}> = {
  FREE: {
    icon: <Zap className="w-5 h-5 text-gray-500" />,
    gradient: '',
    headerText: 'Perfect to get started',
    cta: 'Start for Free',
    highlight: false,
  },
  BASIC: {
    icon: <Star className="w-5 h-5 text-blue-500" />,
    gradient: '',
    headerText: 'For active job seekers',
    cta: 'Get Started',
    highlight: false,
  },
  PRO: {
    icon: <Rocket className="w-5 h-5 text-white" />,
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
    headerText: 'Most popular choice',
    cta: 'Start Pro',
    highlight: true,
  },
  ENTERPRISE: {
    icon: <Building2 className="w-5 h-5 text-gray-700" />,
    gradient: '',
    headerText: 'For teams & organizations',
    cta: 'Contact Sales',
    highlight: false,
  },
};

function getPlanMeta(planName: string) {
  const key = planName.toUpperCase();
  return PLAN_META[key] || PLAN_META['BASIC'];
}

export function PricingCard({
  plan,
  isCurrentPlan = false,
  isSelected = false,
  onSelectPlan,
  onUpgrade,
  billingCycle,
}: PricingCardProps) {
  const price = billingCycle === 'yearly' ? plan.price_inr_yearly : plan.price_inr_monthly;
  const isFreePlan = price === 0;
  const meta = getPlanMeta(plan.name);
  const isPro = meta.highlight;
  const isActiveNonPro = isSelected && !isPro;

  const yearlyMonthlyCost = plan.price_inr_yearly > 0 ? Math.round(plan.price_inr_yearly / 12) : 0;
  const savingsPercent = plan.price_inr_monthly > 0
    ? Math.round(((plan.price_inr_monthly * 12 - plan.price_inr_yearly) / (plan.price_inr_monthly * 12)) * 100)
    : 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectPlan?.(plan);
    setTimeout(() => onUpgrade?.(plan), 150);
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl transition-all duration-300 cursor-pointer group ${
        isPro
          ? 'shadow-2xl scale-[1.03] z-10'
          : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5'
      } ${
        isCurrentPlan
          ? 'ring-2 ring-green-500'
          : isSelected && !isPro
          ? 'ring-2 ring-blue-500'
          : ''
      }`}
      style={
        isPro
          ? { background: meta.gradient }
          : isSelected
          ? { background: '#eff6ff', border: '2px solid #3b82f6' }
          : { background: '#ffffff', border: '1px solid #e5e7eb' }
      }
      onClick={() => onSelectPlan?.(plan)}
    >
      {/* Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
            ✓ Your Current Plan
          </span>
        </div>
      )}
      {!isCurrentPlan && isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <span className="bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
            ★ Most Popular
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        {/* Plan header */}
        <div className="mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isPro ? 'bg-white/20' : 'bg-gray-100'
          }`}>
            {meta.icon}
          </div>
          <h3 className={`text-xl font-bold mb-1 ${isPro ? 'text-white' : isActiveNonPro ? 'text-blue-800' : 'text-gray-900'}`}>
            {plan.name}
          </h3>
          <p className={`text-sm ${isPro ? 'text-blue-200' : isActiveNonPro ? 'text-blue-600' : 'text-gray-500'}`}>
            {meta.headerText}
          </p>
        </div>

        {/* Price */}
        <div className="mb-5">
          {isFreePlan ? (
            <div className={`text-4xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
              Free
            </div>
          ) : billingCycle === 'yearly' ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                  ₹{yearlyMonthlyCost.toLocaleString()}
                </span>
                <span className={`text-sm font-medium ${isPro ? 'text-blue-200' : 'text-gray-500'}`}>/mo</span>
              </div>
              <p className={`text-xs mt-1 ${isPro ? 'text-blue-200' : 'text-gray-400'}`}>
                Billed ₹{plan.price_inr_yearly.toLocaleString()}/year
              </p>
              <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Save {savingsPercent}%
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                  ₹{price.toLocaleString()}
                </span>
                <span className={`text-sm font-medium ${isPro ? 'text-blue-200' : 'text-gray-500'}`}>/month</span>
              </div>
              {savingsPercent > 0 && (
                <p className={`text-xs mt-1 ${isPro ? 'text-blue-200' : 'text-gray-400'}`}>
                  Switch to yearly → save {savingsPercent}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Credits pill */}
        <div className={`mb-5 px-3 py-2 rounded-lg text-sm font-semibold ${
          isPro ? 'bg-white/15 text-white' : isActiveNonPro ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-700'
        }`}>
          {(!plan.credits_per_month || plan.credits_per_month >= 999999) ? 'Unlimited' : plan.credits_per_month.toLocaleString()} credits / month
        </div>

        {/* CTA */}
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-3 rounded-xl font-bold text-sm bg-green-500 text-white cursor-not-allowed mb-5"
          >
            ✓ Current Plan
          </button>
        ) : (
          <button
            onClick={handleClick}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-5 ${
              isPro
                ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/20'
                : isFreePlan
                ? 'bg-gray-900 hover:bg-gray-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {meta.cta}
          </button>
        )}

        {/* Features */}
        <div className={`border-t pt-5 flex-1 ${isPro ? 'border-white/20' : 'border-gray-100'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${
            isPro ? 'text-blue-200' : 'text-gray-400'
          }`}>
            What's included
          </p>
          <ul className="space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  isPro ? 'text-blue-200' : 'text-emerald-500'
                }`} />
                <span className={`text-sm ${isPro ? 'text-blue-100' : 'text-gray-600'}`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
