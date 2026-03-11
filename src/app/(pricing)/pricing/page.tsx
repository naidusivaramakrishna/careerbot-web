"use client";

/**
 * Pricing Page
 *
 * Displays 5 subscription tiers with feature comparison
 * Handles plan selection and upgrade flow
 */

import React, { useState } from 'react';
import { PlanCard } from './_components/PlanCard';
import { Check, Loader } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { SubscriptionPlan } from '@/types/subscription.types';

const PricingPage: React.FC = () => {
  const { plans, loading: plansLoading, error: plansError } = useSubscriptionPlans();
  const [currentPlanId] = useState<string>('FREE'); // TODO: Get from auth context
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanSelect = async (planId: string) => {
    if (planId === currentPlanId) return;

    setLoading(planId);
    logger.info('Plan selected:', planId);

    try {
      // Simulate upgrade process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      {
        toast.success(`Upgrading to ${planId} plan...`);
        logger.info('Plan upgrade initiated:', planId);
        // TODO: Call subscriptionApi.upgradePlan() when backend is ready
      }
    } catch (error) {
      logger.error('Plan upgrade error:', error);
      toast.error('Failed to upgrade. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Show loading state
  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (plansError || plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{plansError || 'Failed to load subscription plans'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Boost your career with AI-powered tools. Start free, upgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan as SubscriptionPlan}
              currentPlanId={currentPlanId}
              onSelect={handlePlanSelect}
              loading={loading === plan.plan_id}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.plan_id}
                      className="text-center py-4 px-4 font-semibold text-gray-900"
                    >
                      {plan.plan_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  feature="Monthly Credits"
                  values={plans.map((p) =>
                    p.credits === 9999 ? 'Custom' : p.credits.toString()
                  )}
                />
                <ComparisonRow
                  feature="Resumes"
                  values={plans.map((p) =>
                    typeof p.features.resumes_limit === 'number'
                      ? p.features.resumes_limit.toString()
                      : 'Unlimited'
                  )}
                />
                <ComparisonRow
                  feature="PDF/DOCX Exports"
                  values={plans.map((p) =>
                    typeof p.features.exports_limit === 'number'
                      ? p.features.exports_limit.toString()
                      : 'Unlimited'
                  )}
                />
                <ComparisonRow
                  feature="ATS Scans"
                  values={plans.map((p) =>
                    typeof p.features.ats_scans_limit === 'number'
                      ? p.features.ats_scans_limit.toString()
                      : 'Unlimited'
                  )}
                />
                <ComparisonRow
                  feature="Job Matches"
                  values={plans.map((p) =>
                    typeof p.features.job_matches_limit === 'number'
                      ? p.features.job_matches_limit.toString()
                      : 'Unlimited'
                  )}
                />
                <ComparisonRow
                  feature="Interview Assessments"
                  values={plans.map((p) =>
                    typeof p.features.assessments_limit === 'number'
                      ? p.features.assessments_limit.toString()
                      : 'Unlimited'
                  )}
                />
                <ComparisonRow
                  feature="AI Features"
                  values={plans.map((p) => p.features.ai_features)}
                />
                <ComparisonRow
                  feature="Support"
                  values={plans.map((p) => p.features.support)}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <FAQItem
              question="Can I change plans anytime?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing cycle for downgrades."
            />
            <FAQItem
              question="What happens to unused credits?"
              answer="Unused credits expire at the end of each billing cycle and don't roll over. Make sure to use them before your renewal date!"
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund within 30 days of purchase."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay - India's most trusted payment gateway."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Absolutely! We use bank-level encryption to protect your data. Your resume and personal information are never shared with third parties."
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to boost your career?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of job seekers who landed their dream jobs with CareerBot
          </p>
          <button
            onClick={() => handlePlanSelect('PRO')}
            className="px-8 py-3 bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
};

// Comparison Row Component
const ComparisonRow: React.FC<{ feature: string; values: string[] }> = ({
  feature,
  values,
}) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 px-4 text-gray-700">{feature}</td>
      {values.map((value, index) => (
        <td key={index} className="py-4 px-4 text-center">
          {value === 'true' ? (
            <Check className="w-5 h-5 text-green-500 mx-auto" />
          ) : (
            <span className="text-gray-600">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
};

// FAQ Item Component
const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
};

export default PricingPage;
