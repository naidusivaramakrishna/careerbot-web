"use client";

import { Star, Quote, TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

const testimonials = [
  {
    name: "Karthik",
    role: "Marketing Manager",
    company: "Mumbai",
    avatar: "/images/karthik.jpg",
    rating: 5,
    text: "I loved the before/after comparison. My resume looks professional now and got me calls from MNCs.",
    metric: "75%",
    metricLabel: "Response Rate",
    tags: ["Resume Redesign", "MNC Offers"],
  },
  {
    name: "Vinoth",
    role: "Talent Acquisition Lead",
    company: "Gurugram",
    avatar: "/images/vinoth.jpg",
    rating: 5,
    text: "Our HR team reduced screening time by 40% with CareerBot's enterprise dashboard.",
    metric: "40%",
    metricLabel: "Time Saved",
    tags: ["Enterprise", "HR Tool"],
  },
  {
    name: "Preeti",
    role: "Data Analyst",
    company: "Chennai",
    avatar: "/images/preeti.jpg",
    rating: 5,
    text: "As an international applicant from India, CareerBot helped me tailor my CV for global jobs.",
    metric: "3",
    metricLabel: "Job Offers",
    tags: ["International", "Global Jobs"],
  },
];

function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            <Award className="w-3 h-3" />
            Trusted by 10,000+ Professionals
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
            What Our Users Say
          </h2>

          <p className="text-base text-slate-500 leading-relaxed mb-8">
            Real stories from professionals across India who landed their dream interviews.
          </p>

          {/* Rating pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-slate-700">4.9/5 Average Rating</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-slate-700">98% Success Rate</span>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border border-slate-100 p-6 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {t.tags.map((tag, ti) => (
                  <span
                    key={ti}
                    className="px-3 py-1 text-[11px] font-bold text-[#2557a7] bg-[#EEF4FF] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className={`w-4 h-4 ${
                      si < t.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 fill-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-[13px] text-slate-600 leading-relaxed mb-5 grow">
                <Quote
                  className="w-5 h-5 text-[#2557a7] opacity-20 mb-1.5"
                  strokeWidth={1.5}
                />
                {t.text}
              </blockquote>

              {/* Metric box */}
              <div className="bg-[#EEF4FF] rounded-xl px-4 py-3.5 mb-5">
                <div className="text-2xl font-black text-[#2557a7] leading-none mb-0.5">
                  {t.metric}
                </div>
                <div className="text-[11px] font-bold text-[#2557a7]/60 uppercase tracking-wider">
                  {t.metricLabel}
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-100">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900 leading-none mb-1">
                    {t.name}
                  </h4>
                  <p className="text-[12px] text-slate-500">{t.role}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default TestimonialsSection;
