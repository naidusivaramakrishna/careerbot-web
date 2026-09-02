import React from "react";

export interface HowItWorksStep {
  icon: React.ElementType;
  title: string;
  desc: string;
}

export interface HowItWorksProps {
  heading?: string;
  subheading?: string;
  steps: HowItWorksStep[];
}

function StepCard({ icon: Icon, title, desc, index }: HowItWorksStep & { index: number }) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: "#1e3a5f" }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black shadow"
          style={{ backgroundColor: "#2557a7" }}
        >
          {index + 1}
        </div>
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorks({ heading = "How It Works", subheading, steps }: HowItWorksProps) {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">{heading}</h2>
          {subheading && <p className="mt-3 text-gray-500 text-base">{subheading}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <StepCard key={i} {...step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
