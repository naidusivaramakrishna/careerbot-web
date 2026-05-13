'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Plan } from '@/api/paymentApi';

interface PricingCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  onSelectPlan?: (plan: Plan) => void;
  onUpgrade?: (plan: Plan) => void;
  billingCycle: 'monthly' | 'yearly';
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

  return (
    <div
      onClick={() => onSelectPlan?.(plan)}
      className={`relative flex flex-col h-full rounded-lg border-2 transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'border-blue-600 shadow-2xl ring-2 ring-blue-400 bg-blue-50'
          : isCurrentPlan
          ? 'border-green-500 shadow-lg bg-green-50'
          : plan.recommended
          ? 'border-blue-400 shadow-lg hover:shadow-xl hover:border-blue-500'
          : 'border-gray-200 shadow hover:shadow-lg hover:border-blue-300'
      }`}
    >
      {/* Badge Priority: Current Plan > Selected > Most Popular */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold">
            ✓ Current Plan
          </span>
        </div>
      )}

      {isSelected && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse">
            ✓ Selected
          </span>
        </div>
      )}

      {plan.recommended && !isCurrentPlan && !isSelected && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Plan Header */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

        {/* Pricing */}
        <div className="mb-6">
          {isFreePlan ? (
            <div className="text-3xl font-bold text-gray-900">Free</div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">₹{price.toLocaleString()}</span>
              <span className="text-gray-600">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
            </div>
          )}
          {billingCycle === 'yearly' && !isFreePlan && (
            <p className="text-sm text-green-600 mt-2">
              Save {Math.round(((plan.price_inr_monthly * 12 - plan.price_inr_yearly) / (plan.price_inr_monthly * 12)) * 100)}% vs monthly
            </p>
          )}
        </div>

        {/* Credits */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-blue-600">{plan.credits_per_month}</span> credits/month
          </p>
        </div>

        {/* CTA Button */}
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-3 px-4 rounded-lg font-bold text-white bg-green-500 cursor-not-allowed mb-6"
          >
            ✓ Current Plan
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 1. First highlight the card
              onSelectPlan?.(plan);
              // 2. Then go to checkout after a short delay
              setTimeout(() => {
                onUpgrade?.(plan);
              }, 150);
            }}
            className={`w-full py-3 px-4 rounded-lg font-bold transition-all mb-6 ${
              isSelected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
            }`}
          >
            {isFreePlan ? 'Start Free' : 'Select Plan'}
          </button>
        )}

        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm font-semibold text-gray-900 mb-4">What's Included</p>
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature Limits */}
        {Object.keys(plan.feature_limits).length > 0 && (
          <div className="border-t border-gray-200 mt-6 pt-6">
            <p className="text-sm font-semibold text-gray-900 mb-4">Feature Limits</p>
            <ul className="space-y-2 text-sm">
              {Object.entries(plan.feature_limits).map(([feature, limit]) => (
                <li key={feature} className="flex justify-between text-gray-700">
                  <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">
                    {limit === null ? 'Unlimited' : limit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
