'use client';

import React, { useEffect, useState } from 'react';
import { getPlans, Plan } from '@/api/paymentApi';
import { PricingCard } from './PricingCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  RefreshCw, ShieldCheck, ChevronDown, ChevronUp,
  Check, Minus, Users, Star, Award, Zap,
} from 'lucide-react';

interface PricingPlansProps {
  onSelectPlan: (plan: Plan) => void;
  currentPlanId?: string;
}

const COMPARISON_ROWS = [
  { label: 'AI Credits / month', keys: ['credits_per_month'] as const, format: (v: number) => v >= 999999 ? 'Unlimited' : v.toLocaleString() },
];

const FEATURE_TABLE = [
  { label: 'AI Resume Builder', free: true, basic: true, pro: true, enterprise: true },
  { label: 'ATS Score Scanner', free: '5 scans/mo', basic: '50 scans/mo', pro: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Job Match Engine', free: '5/mo', basic: '30/mo', pro: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Resume Exports (PDF/DOCX)', free: '1/mo', basic: '5/mo', pro: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Saved Resumes', free: '3', basic: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Interview Prep (AI)', free: false, basic: false, pro: true, enterprise: true },
  { label: 'Priority AI Queue', free: false, basic: false, pro: true, enterprise: true },
  { label: 'Advanced Analytics', free: false, basic: false, pro: true, enterprise: true },
  { label: 'API Access', free: false, basic: false, pro: false, enterprise: true },
  { label: 'Custom Integrations', free: false, basic: false, pro: false, enterprise: true },
  { label: 'Dedicated Account Manager', free: false, basic: false, pro: false, enterprise: true },
  { label: 'SLA Guarantee', free: false, basic: false, pro: false, enterprise: true },
  { label: 'Support', free: 'Community', basic: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
];

const FAQS = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrades are instant — your new credits and features activate immediately after payment. Downgrades take effect at the end of your current billing cycle, so you never lose what you already paid for.',
  },
  {
    q: 'What happens to my unused credits?',
    a: 'Credits reset at the start of each billing cycle. They do not roll over, so we recommend using them consistently throughout the month for best value.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Our Free plan lets you test every core feature with 50 credits — no credit card required. If you need a longer evaluation, contact our team for a 7-day Pro trial.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'We accept UPI, Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking, and popular wallets — all secured by Razorpay.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Absolutely. We never store your card details. All transactions are encrypted and processed by Razorpay, a PCI DSS Level 1 certified payment gateway.',
  },
  {
    q: 'What is the Enterprise plan for?',
    a: 'Enterprise is built for colleges, placement cells, recruitment agencies, and large HR teams. It includes API access, white-label options, custom integrations, and a dedicated account manager. Contact us to get a tailored quote.',
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-gray-300 mx-auto" />;
  return <span className="text-xs text-gray-600 font-medium">{value}</span>;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export function PricingPlans({ onSelectPlan, currentPlanId }: PricingPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlans();
      setPlans(data);
      // Default selection: Pro plan, or current plan if already subscribed
      const defaultPlan =
        data.find(p => p.name.toUpperCase() === 'PRO') ||
        data.find(p => p.id === currentPlanId);
      if (defaultPlan) setSelectedPlanId(defaultPlan.id);
    } catch (err) {
      setError('Failed to load pricing plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => setSelectedPlanId(plan.id);
  const handleUpgrade = (plan: Plan) => onSelectPlan(plan);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="font-semibold text-red-800 mb-2">Failed to load plans</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // Compute max yearly savings for the toggle label
  const proMonthly = plans.find(p => p.name.toUpperCase() === 'PRO')?.price_inr_monthly ?? 0;
  const proYearly = plans.find(p => p.name.toUpperCase() === 'PRO')?.price_inr_yearly ?? 0;
  const proYearlySavings = proMonthly > 0 ? proMonthly * 12 - proYearly : 0;

  return (
    <div className="space-y-16">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          <Zap className="w-3.5 h-3.5" />
          No hidden fees. Cancel anytime.
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Invest in your career.<br className="hidden sm:block" />
          <span className="text-blue-600">Land your dream job faster.</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          AI-powered tools trusted by thousands of job seekers across India.
          Pick a plan and start applying smarter today.
        </p>

        {/* Social proof */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-8">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            <span><strong className="text-gray-900">15,000+</strong> professionals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span><strong className="text-gray-900">4.8 / 5</strong> average rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-500" />
            <span><strong className="text-gray-900">3× faster</strong> job placement</span>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yearly
            {proYearlySavings > 0 && (
              <span className="absolute -top-2.5 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                Save ₹{(proYearlySavings / 1000).toFixed(1)}k
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Plan Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start pt-4">
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

      {/* ── Trust strip ────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-6 py-4 border-y border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          256-bit SSL encryption
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Secured by Razorpay (PCI DSS)
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Cancel anytime, no penalties
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          UPI · Cards · Net Banking · Wallets
        </div>
      </div>

      {/* ── Feature Comparison Table ────────────────────────────── */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare all features</h2>
          <p className="text-gray-500 text-sm">See exactly what each plan includes</p>
          <button
            className="mt-3 text-blue-600 text-sm font-semibold flex items-center gap-1 mx-auto hover:underline"
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? 'Hide comparison' : 'Show full comparison'}
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showTable && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-4 font-semibold text-gray-600 w-1/3">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-600">Free</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-600">Basic</th>
                  <th className="text-center px-4 py-4 font-semibold text-white bg-blue-600">Pro ★</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-600">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_TABLE.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-5 py-3 text-gray-700 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.free} /></td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.basic} /></td>
                    <td className="px-4 py-3 text-center bg-blue-50">
                      <FeatureCell value={row.pro} />
                    </td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Loved by job seekers across India
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              name: 'Priya Sharma',
              role: 'Software Engineer @ Zomato',
              body: 'The ATS scanner alone is worth the Pro plan. I rewrote my resume based on its suggestions and got 3 interviews in a week.',
              rating: 5,
            },
            {
              name: 'Arjun Mehta',
              role: 'Product Manager @ Razorpay',
              body: "CareerBot's AI tailored my resume for each job role automatically. I stopped getting rejected at the screening stage.",
              rating: 5,
            },
            {
              name: 'Sneha Rao',
              role: 'Data Analyst @ Flipkart',
              body: "Switched from the Free plan to Pro. The unlimited job matches and priority AI processing made all the difference.",
              rating: 5,
            },
          ].map((t) => (
            <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.body}"</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-gray-400 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm mb-3">Still have questions?</p>
          <a
            href="mailto:support@careerbot.ai"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
