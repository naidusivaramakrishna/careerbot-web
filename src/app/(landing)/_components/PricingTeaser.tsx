'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Plan {
  name: string;
  priceLabel: string;
  priceNote: string | null;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const plans: Plan[] = [
  {
    name: 'Free',
    priceLabel: 'Rs 0',
    priceNote: '/ month',
    description: 'Perfect to get started',
    features: [
      '50 credits / month',
      'ATS resume scanning',
      'Basic templates',
      'Resume builder access',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    priceLabel: 'See plans',
    priceNote: null,
    description: 'For serious job seekers',
    features: [
      'Unlimited ATS scans',
      'AI Resume Enhancer',
      'All 18+ templates',
      'Priority AI queue',
      'Advanced analytics',
    ],
    cta: 'See Pro Plans',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    priceLabel: 'Custom',
    priceNote: null,
    description: 'For teams and organisations',
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Us',
    highlighted: false,
  },
];

export default function PricingTeaser() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_44%,#eef6ff_100%)] py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">Pricing</span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Simple Plans, Starting at Rs 0
          </h2>
          <p className="mt-3 text-[#6B7280]">
            Start free. Upgrade only when you need more scans, AI rewrites, or exports.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative flex flex-col gap-5 rounded-2xl p-6 transition-all duration-200 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#2557a7] via-[#1e4a94] to-[#0f766e] text-white shadow-2xl shadow-blue-200 md:scale-[1.04]'
                  : 'border border-white bg-white text-[#111827] shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/60'
              }`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-xs font-bold text-[#2557a7] shadow-sm">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className={`text-lg font-bold ${plan.highlighted ? 'text-white' : 'text-[#111827]'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-0.5 text-sm ${plan.highlighted ? 'text-blue-200' : 'text-[#6B7280]'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5">
                {plan.priceNote ? (
                  <>
                    <span className={`text-3xl font-bold ${plan.highlighted ? 'text-white' : 'text-[#111827]'}`}>
                      {plan.priceLabel}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-[#9CA3AF]'}`}>
                      {plan.priceNote}
                    </span>
                  </>
                ) : plan.name === 'Pro' ? (
                  <Link href="/payments" className="text-sm font-semibold text-blue-100 transition-colors hover:text-white">
                    {plan.priceLabel}
                  </Link>
                ) : (
                  <span className="text-2xl font-bold text-[#111827]">{plan.priceLabel}</span>
                )}
              </div>

              <ul className="flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check
                      size={14}
                      className={`shrink-0 ${plan.highlighted ? 'text-teal-300' : 'text-[#10b981]'}`}
                    />
                    <span className={plan.highlighted ? 'text-blue-100' : 'text-[#374151]'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Free' ? '/builder/start' : '/payments'}
                className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-white text-[#2557a7] hover:bg-blue-50'
                    : 'border border-slate-200 text-[#374151] hover:border-[#2557a7] hover:bg-blue-50 hover:text-[#2557a7]'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link href="/payments" className="text-sm font-medium text-[#2557a7] hover:underline">
            See full plans and pricing
          </Link>
        </p>
      </div>
    </section>
  );
}
