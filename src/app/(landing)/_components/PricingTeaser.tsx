'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const highlights = [
  'Free plan available',
  'Review plan details before checkout',
  'Secure payment for paid plans',
];

export default function PricingTeaser() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_55%,#ffffff_100%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 lg:px-8">
        <motion.div
          className="grid items-center gap-6 rounded-lg border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/60 md:grid-cols-[1fr_auto] md:p-6"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#2557a7]">
              <CreditCard size={14} />
              Pricing
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-4xl">
              Start free. Compare plans when you are ready to scale your job search.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              The landing page keeps pricing simple. The full pricing page includes billing options,
              plan limits, comparison details, payment security, and billing FAQs.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-[#2557a7]">
                  <CheckCircle2 size={15} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#2557a7] p-5 text-white md:w-[310px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
              <ShieldCheck size={20} />
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-blue-100">Full pricing</p>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              See Free, Pro, and Max plan details before checkout.
            </p>
            <Link
              href="/payments"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-extrabold text-[#2557a7] transition hover:bg-blue-50"
            >
              View full pricing
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
