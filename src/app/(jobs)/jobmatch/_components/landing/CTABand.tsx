"use client";

import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface CTABandProps {
  onAnalyzeClick?: () => void;
}

export default function CTABand({ onAnalyzeClick }: CTABandProps) {
  return (
    <section className="bg-[#2557A7] py-20 md:py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">

        {/* Badge */}
        <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#FFC85E] px-4 py-1.5 rounded-full mb-6">
          Free Analysis
        </span>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
          Ready to land your dream job?
        </h2>

        {/* Subtext */}
        <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed mb-10">
          See exactly how well your resume fits any job — in seconds. No credit card. No setup.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={onAnalyzeClick}
            className="inline-flex items-center gap-2 bg-white text-[#2557A7] hover:bg-[#FFC85E] hover:text-black font-bold px-9 py-4 rounded-xl transition-colors text-sm"
          >
            Analyze My Resume Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-white/50 text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            No credit card required
          </span>
          <span className="hidden sm:block w-px h-4 bg-white/20" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Results in ~15 seconds
          </span>
          <span className="hidden sm:block w-px h-4 bg-white/20" />
          <span>50,000+ analyses done</span>
        </div>

      </div>
    </section>
  );
}
