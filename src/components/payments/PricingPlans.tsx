'use client';

import React, { useEffect, useState } from 'react';
import { getPlans, Plan } from '@/api/paymentApi';
import { PricingCard } from './PricingCard';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PricingPlansProps {
  onSelectPlan: (plan: Plan) => void;
  currentPlanId?: string;
}

export function PricingPlans({ onSelectPlan, currentPlanId }: PricingPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlans();
      setPlans(data);
    } catch (err) {
      setError('Failed to load pricing plans. Please try again.');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanId(plan.id);
  };

  const handleUpgrade = (plan: Plan) => {
    onSelectPlan(plan);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold mb-2">Error Loading Plans</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchPlans}
          className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose the perfect plan to accelerate your career growth
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setBillingCycle('monthly');
            }}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => {
              setBillingCycle('yearly');
            }}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 relative ${
              billingCycle === 'yearly'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="absolute -top-3 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlanId === plan.id}
            isSelected={selectedPlanId === plan.id}
            onSelectPlan={handleSelectPlan}
            onUpgrade={handleUpgrade}
            billingCycle={billingCycle}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h3>
            <p className="text-gray-600 text-sm">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What happens to unused credits?</h3>
            <p className="text-gray-600 text-sm">
              Unused credits reset monthly. We recommend using your credits consistently throughout the month.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
            <p className="text-gray-600 text-sm">
              Yes! Start with our Free plan to test all features with limited credits. No credit card required.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600 text-sm">
              We accept all major payment methods through Razorpay: UPI, Credit/Debit Cards, Netbanking, and Wallets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
