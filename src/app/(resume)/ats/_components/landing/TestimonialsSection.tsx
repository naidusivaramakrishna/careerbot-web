"use client";

import {
  Star,
  Quote,
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const testimonials = [
    {
      name: "Karthik",
      role: "Marketing Manager",
      company: "Mumbai",
      avatar: "/images/karthik.jpg",
      rating: 5,
      text: "I loved the before/after comparison. My resume looks professional now and got me calls from MNCs.",
      highlight: "Increased response rate by 75%",
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
      highlight: "40% faster recruitment process",
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
      highlight: "3 international offers received",
      metric: "3",
      metricLabel: "Job Offers",
      tags: ["International", "Global Jobs"],
    },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#e8f4fa]/50 via-[#f0f8fc]/30 to-transparent pointer-events-none"
        style={{ height: "50%" }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      </div>

      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center max-w-4xl mx-auto mb-16 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
            }`}
          >
            <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0275dd]/10 border-2 border-[#0275dd]/20 text-[#0275dd] rounded-full text-sm font-bold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Award className="w-5 h-5" />
              <span>Trusted by 10,000+ Professionals</span>
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              <span className="text-[#2d2d2d]">What Our Users</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0275dd] via-[#0261b8] to-[#0275dd] relative inline-block">
                Say About Us
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0275dd] to-transparent"></div>
              </span>
            </h2>

            <p className="text-[#2d2d2d]/70 text-xl md:text-2xl leading-relaxed font-light">
              Real stories from professionals across India who landed their dream interviews
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#0275dd]/20 shadow-sm">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-[#2d2d2d]">
                  4.9/5 Average Rating
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#0275dd]/20 shadow-sm">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-[#2d2d2d]">
                  98% Success Rate
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div className="relative bg-white rounded-3xl border-2 border-[#0275dd]/20 p-8 h-full flex flex-col hover:shadow-2xl hover:-translate-y-3 hover:border-[#0275dd]/40 transition-all duration-500 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0275dd]/5 via-transparent to-[#0261b8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#0275dd]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:rotate-12 group-hover:scale-125">
                    <Quote className="w-24 h-24 text-[#0275dd]" strokeWidth={1} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {testimonial.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs font-semibold text-[#0275dd] bg-[#0275dd]/10 rounded-full border border-[#0275dd]/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 mb-5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="relative">
                          <Star
                            className={`w-6 h-6 transition-all duration-300 ${
                              i < testimonial.rating
                                ? "text-amber-400 fill-amber-400 scale-100"
                                : "text-[#2d2d2d]/20 fill-[#2d2d2d]/20 scale-90"
                            } ${
                              activeCard === index ? "animate-bounce-slow" : ""
                            }`}
                            style={{ animationDelay: `${i * 100}ms` }}
                          />
                        </div>
                      ))}
                    </div>

                    <blockquote className="text-[#2d2d2d]/80 text-base leading-relaxed mb-6 flex-grow font-medium">
                      <span className="text-2xl text-[#0275dd] font-serif">&quot;</span>
                      {testimonial.text}
                      <span className="text-2xl text-[#0275dd] font-serif">&quot;</span>
                    </blockquote>

                    <div className="mb-6 relative overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0275dd] to-[#0261b8] opacity-90"></div>
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-30"></div>

                      <div className="relative p-6 group-hover:scale-105 transition-transform duration-300">
                        <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                          {testimonial.metric}
                        </div>
                        <div className="text-sm font-bold text-blue-100 uppercase tracking-wider">
                          {testimonial.metricLabel}
                        </div>
                        <div className="mt-2 h-1 w-16 bg-white/30 rounded-full">
                          <div
                            className="h-full bg-white rounded-full w-full group-hover:w-full transition-all duration-1000"
                            style={{ width: activeCard === index ? "100%" : "0%" }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t-2 border-[#0275dd]/10 group-hover:border-[#0275dd]/20 transition-colors duration-300">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0275dd] to-[#0261b8] opacity-0 group-hover:opacity-100 animate-spin-slow"></div>
                        <div className="absolute inset-1 rounded-full bg-white"></div>

                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="absolute inset-2 w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#2d2d2d] text-lg mb-1 group-hover:text-[#0275dd] transition-colors duration-300">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-[#2d2d2d]/70 font-medium mb-1">
                          {testimonial.role}
                        </p>
                        <p className="text-sm text-[#2d2d2d]/60 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeCard === index && (
                    <>
                      <Sparkles className="absolute top-4 right-4 w-6 h-6 text-[#0275dd] animate-pulse" />
                      <Sparkles
                        className="absolute bottom-4 left-4 w-5 h-5 text-[#0261b8] animate-pulse"
                        style={{ animationDelay: "0.5s" }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            className={`text-center max-w-4xl mx-auto transition-all duration-1000 delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="relative bg-gradient-to-br from-[#0275dd] via-[#0275dd] to-[#0261b8] rounded-3xl p-8 md:p-10 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] animate-slide-up"></div>
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0261b8] mb-4 group-hover:scale-110 transition-all duration-300">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                  Ready to Transform Your Career?
                </h3>

                <p className="text-blue-100 mb-6 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                  Join thousands of professionals optimizing their resumes with AI-powered
                  analysis
                </p>

                <button className="relative inline-flex items-center justify-center gap-3 bg-white text-[#0275dd] px-8 py-3 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group/btn mb-6">
                  <span>Start Free Scan Now</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </button>

                <div className="flex items-center justify-center gap-6 text-xs md:text-sm text-white/90 flex-wrap">
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    No credit card required
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    Results in 2 minutes
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    100% Free
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(2, 117, 221, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(2, 117, 221, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-60px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-slide-up {
          animation: slide-up 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
