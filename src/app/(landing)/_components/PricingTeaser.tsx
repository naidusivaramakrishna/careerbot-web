'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const highlights = ['Free plan available', 'Review plan details before checkout', 'Secure payment for paid plans'];

export default function PricingTeaser() {
  return (
    <section id="pricing" className="bg-white py-8">
      <div className="mx-auto max-w-[1080px] px-4">
        <motion.div
          className="grid items-center gap-8 rounded-lg bg-[#f7fbff] px-7 py-8 md:grid-cols-[190px_1fr_280px]"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-70px' }}
          transition={{ duration: 0.42 }}
        >
          <div className="relative hidden min-h-[150px] md:block">
            <Image
              src="/images/landing/pricing-art.png"
              alt="Blue wallet and coins pricing illustration"
              width={440}
              height={290}
              loading="eager"
              className="absolute inset-y-0 left-0 my-auto h-auto w-[210px] object-contain"
            />
          </div>

          <div>
            <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-[10px] font-black uppercase text-[#2557a7]">
              Pricing
            </span>
            <h2 className="mt-3 text-[28px] font-black leading-tight text-[#08143f] md:text-[34px]">
              Start free. Compare plans when you are ready to scale your job search.
            </h2>
            <div className="mt-4 space-y-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-bold text-[#2557a7]">
                  <CheckCircle2 size={16} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#0d55d8] p-5 text-white shadow-[0_18px_38px_rgba(13,85,216,0.24)]">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} />
              <p className="text-xs font-black uppercase tracking-wide">Full pricing</p>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-blue-100">
              See Free, Pro, and Max plan details before checkout.
            </p>
            <Link
              href="/payments"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-[#0d55d8]"
            >
              View full pricing <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
