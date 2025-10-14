"use client";

import Image from "next/image";
import { Star } from "lucide-react";

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Karthik",
      role: "Marketing Manager, Mumbai",
      avatar: "/images/karthik.jpg", // ✅ updated path
      rating: 5,
      text: `"I loved the before/after comparison. My resume looks professional now and got me calls from MNCs."`,
      stat: "Increased response rate by 75%",
    },
    {
      name: "Vinoth",
      role: "Talent Acquisition Lead, Gurugram",
      avatar: "/images/vinoth.jpg", // ✅ updated path
      rating: 4.5,
      text: `"Our HR team reduced screening time by 40% with CareerBot’s enterprise dashboard."`,
      stat: "40% faster recruitment process",
    },
    {
      name: "Preeti",
      role: "Data Analyst, Chennai",
      avatar: "/images/preeti.jpg", // ✅ updated path
      rating: 5,
      text: `"As an international applicant from India, CareerBot helped me tailor my CV for global jobs."`,
      stat: "3 international offers received",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          What Our Users Says
        </h2>
        <p className="mt-3 text-gray-500 text-lg">
          Real stories from professionals across India who landed interviews with CareerBot
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
        {testimonials.map((t, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 relative">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{t.name}</h4>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-3">
              {Array.from({ length: Math.floor(t.rating) }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
              ))}
              {t.rating % 1 !== 0 && (
                <Star className="w-5 h-5 text-orange-400 fill-orange-200" />
              )}
            </div>

            {/* Testimonial Text */}
            <p className="text-gray-700 text-sm mb-4">{t.text}</p>

            {/* Highlight Stat */}
            <div className="mt-auto">
              <div className="px-4 py-2 rounded-lg border bg-gray-50 text-center font-medium text-sm text-indigo-600 border-indigo-100">
                {t.stat}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">
          Join thousands of professionals across India optimizing their careers with CareerBot.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition">
          Start Free Scan
        </button>
      </div>
    </section>
  );
}

export default TestimonialsSection;
