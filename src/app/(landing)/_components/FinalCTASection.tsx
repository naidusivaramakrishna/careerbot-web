'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function FinalCTASection() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2557a7 0%, #173b73 48%, #0f766e 100%)' }}
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden="true"
      />

      {/* White blob decorations for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 380, height: 380, top: -140, right: -100,
          background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 300, height: 300, bottom: -100, left: -80,
          background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <div className="rounded-3xl border border-white/20 bg-white/10 px-6 py-12 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
            <Sparkles size={22} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to improve your resume before the next application?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-blue-100">
            Start with the free plan. No credit card required.
          </p>

          <Link
            href="/builder/start"
            className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-white px-12 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            style={{ color: '#2557a7' }}
          >
            <Sparkles size={18} />
            Build My Resume Free
          </Link>
        </div>
      </div>
    </section>
  );
}
