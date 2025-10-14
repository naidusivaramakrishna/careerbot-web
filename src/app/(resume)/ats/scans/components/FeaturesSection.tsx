"use client";

import { Brain, Award, Globe } from "lucide-react";

function FeaturesSection() {
  const features = [
    {
      icon: <Brain className="w-8 h-8 text-gray-500" />,
      title: "Dual Analysis Engine",
      description:
        "The only platform that analyzes both ATS systems AND recruiter readability preferences",
      stat: "95% accuracy rate",
    },
    {
      icon: <Award className="w-8 h-8 text-gray-500" />,
      title: "Career Growth AI",
      description:
        "Beyond resume optimization – get strategic career guidance and skill gap analysis",
      stat: "3x career advancement",
    },
    {
      icon: <Globe className="w-8 h-8 text-gray-500" />,
      title: "Global Standards",
      description:
        "Enterprise-grade security with compliance for international markets",
      stat: "50+ countries supported",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Why Professionals Choose CareerBot
        </h2>
        <p className="mt-3 text-gray-500 text-lg">
          World-class features that surpass global competitors
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-md transition"
          >
            {/* Icon background */}
            <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 mb-4">
              {feature.icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-sm mb-4">{feature.description}</p>

            {/* Stat */}
            <span className="text-sm font-semibold text-gray-900">
              {feature.stat}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
