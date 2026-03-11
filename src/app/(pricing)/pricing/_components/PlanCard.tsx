/**
 * Plan Card Component — Premium compact white design
 */

import React from 'react';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { SubscriptionPlan, getFeatureLimit } from '@/types/subscription.types';

export interface PlanCardProps {
  plan: SubscriptionPlan;
  currentPlanId?: string;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

// Dynamic color mapping based on plan status
const getPlanColors = (planId: string, isPopular: boolean) => {
  if (isPopular) {
    return {
      accent: 'linear-gradient(to right, #6366f1, #0ea5e9, #10b981)',
      iconGradient: 'linear-gradient(135deg, #6366f1, #2200FF)',
    };
  }

  switch (planId) {
    case 'MAX':
      return {
        accent: 'linear-gradient(to right, #f59e0b, #ef4444)',
        iconGradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      };
    default:
      return {
        accent: 'linear-gradient(to right, #94a3b8, #cbd5e1)',
        iconGradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
      };
  }
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanId,
  onSelect,
  loading = false,
}) => {
  const isCurrent = plan.plan_id === currentPlanId;
  const isPro     = !!plan.recommended;
  const isMax     = plan.plan_id === 'MAX';
  const colors    = getPlanColors(plan.plan_id, isPro);

  const features = [
    { label: 'Resumes',          value: getFeatureLimit(plan, 'resumes_limit') },
    { label: 'PDF/DOCX Exports', value: getFeatureLimit(plan, 'exports_limit') },
    { label: 'ATS Scans',        value: getFeatureLimit(plan, 'ats_scans_limit') },
    { label: 'Job Matches',      value: getFeatureLimit(plan, 'job_matches_limit') },
    { label: 'Assessments',      value: getFeatureLimit(plan, 'assessments_limit') },
    {
      label: 'AI Features',
      value:
        plan.features.ai_features === 'full+api'
          ? 'Full + API'
          : plan.features.ai_features.charAt(0).toUpperCase() +
            plan.features.ai_features.slice(1),
    },
    {
      label: 'Support',
      value:
        plan.features.support.charAt(0).toUpperCase() + plan.features.support.slice(1),
    },
  ];

  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
      style={
        isPro
          ? {
              border: '2px solid transparent',
              backgroundImage:
                'linear-gradient(white, white), linear-gradient(135deg, #6366f1, #0ea5e9, #10b981)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: '0 8px 32px rgba(99,102,241,0.18), 0 2px 8px rgba(0,0,0,0.06)',
            }
          : {
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }
      }
    >
      {/* Top accent stripe */}
      <div className="h-0.75" style={{ background: colors.accent }} />

      {/* Recommended badge */}
      {isPro && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 z-10">
          <div
            className="px-4 py-1.25 rounded-b-xl text-[10px] font-bold tracking-widest text-white uppercase"
            style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}
          >
            ⭐ Most Popular
          </div>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div className="absolute top-3.5 right-3.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            ✓ Current
          </span>
        </div>
      )}

      <div className={`px-5 pb-5 ${isPro ? 'pt-9' : 'pt-5'}`}>
        {/* Icon + plan name row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: colors.iconGradient }}
          >
            {isPro ? (
              <Crown size={16} className="text-white" />
            ) : isMax ? (
              <Sparkles size={16} className="text-white" />
            ) : (
              <Zap size={16} className="text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{plan.plan_name}</p>
          </div>
        </div>

        {/* Price block */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-black"
              style={
                isPro
                  ? {
                      background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }
                  : isMax
                  ? {
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }
                  : { color: '#111827' }
              }
            >
              {plan.price_inr === 0 ? 'Free' : `₹${plan.price_inr}`}
            </span>
            {plan.price_inr > 0 && (
              <span className="text-gray-400 text-xs">/month</span>
            )}
          </div>
          {/* Credits pill */}
          <div
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
            style={
              isPro
                ? {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.08))',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }
                : isMax
                ? {
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }
                : {
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }
            }
          >
            <span className="text-sm">💎</span>
            <span
              className="text-[11px] font-semibold"
              style={{
                color: isPro ? '#6366f1' : isMax ? '#f59e0b' : '#64748b',
              }}
            >
              {plan.credits} Credits / month
            </span>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-2 mb-5">
          {features.map((f) => (
            <div key={f.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check
                  size={11}
                  className="shrink-0"
                  style={{ color: isPro ? '#6366f1' : '#10b981' }}
                />
                <span className="text-[11px] text-gray-500">{f.label}</span>
              </div>
              <span className="text-[11px] font-semibold text-gray-800">{f.value}</span>
            </div>
          ))}
          {plan.features.additional?.map((feat, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check
                size={11}
                className="shrink-0"
                style={{ color: isPro ? '#6366f1' : '#10b981' }}
              />
              <span className="text-[11px] text-gray-500">{feat}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => onSelect(plan.plan_id)}
          disabled={isCurrent || loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={
            isCurrent
              ? { background: '#f1f5f9', color: '#94a3b8' }
              : isPro
              ? {
                  background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }
              : isMax
              ? {
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                }
              : {
                  background: '#f8fafc',
                  color: '#1e293b',
                  border: '1.5px solid #e2e8f0',
                }
          }
        >
          {loading
            ? 'Processing…'
            : isCurrent
            ? '✓ Current Plan'
            : isPro
            ? 'Upgrade to Pro'
            : isMax
            ? 'Upgrade to Max'
            : 'Get Started Free'}
        </button>

        {/* Guarantee note */}
        {plan.price_inr > 0 && !isMax && (
          <p className="text-[10px] text-gray-400 text-center mt-2">
            30-day money-back guarantee
          </p>
        )}
      </div>
    </div>
  );
};
