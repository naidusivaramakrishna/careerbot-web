import React from "react";

export interface FeatureItem {
  icon: React.ElementType;
  title: string;
  desc: string;
}

export interface FeatureGridProps {
  heading: string;
  subheading?: string;
  features: FeatureItem[];
}

function FeatureCard({ icon: Icon, title, desc }: FeatureItem) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-blue-200 transition-all">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "#eff6ff" }}
      >
        <Icon className="w-5 h-5" style={{ color: "#2557a7" }} />
      </div>
      <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function FeatureGrid({ heading, subheading, features }: FeatureGridProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">{heading}</h2>
          {subheading && <p className="mt-3 text-gray-500 text-base">{subheading}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
