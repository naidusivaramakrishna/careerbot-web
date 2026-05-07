"use client";

import {
  Check,
  Brain,
  TrendingUp,
  Lightbulb,
  Shield,
  Zap,
  Users,
  Award,
} from "lucide-react";
import React, { useCallback, useMemo } from "react";

type Category = {
  title: string;
  icon: React.ReactElement;
  description?: string;
  items: string[];
};

type ChecklistCardProps = {
  category: Category;
  className?: string;
  delay?: number;
};

const analysisCategory: Category = {
  title: "Instant ATS Scoring",
  icon: <Brain className="w-6 h-6" />,
  description:
    "Leverages real ATS logic to scan, score, and optimize your resume instantly.",
  items: [
    "Analyzes your resume using real ATS algorithms",
    "Delivers keyword and formatting scores within seconds",
    "Identifies missing keywords and role-specific skills",
    "Ensures high compatibility with top ATS systems",
  ],
};

const detailedBreakdownCategory: Category = {
  title: "Deep Section Analysis",
  icon: <Users className="w-6 h-6" />,
  description: "Get comprehensive analysis of every section with expert insights.",
  items: [
    "Analyzes structure, layout, and key sections",
    "Provides section-wise scoring and insights",
    "Flags formatting or content issues instantly",
  ],
};

const skillMatcherCategory: Category = {
  title: "Skill Gap Detector",
  icon: <Lightbulb className="w-6 h-6" />,
  description: "Uncovers hidden skill gaps from real job descriptions.",
  items: [
    "Recommends hard & soft skills for your target role",
    "Highlights missing job description keywords",
    "Improves ATS match rate and recruiter readability",
  ],
};

const careerInsightsCategory: Category = {
  title: "AI Career Insights",
  icon: <TrendingUp className="w-6 h-6" />,
  description: "AI pinpoints what impresses recruiters — and what needs tuning.",
  items: [
    "Pinpoints your resume strengths and weaknesses",
    "Recommends personalized skill improvements",
    "Provides actionable feedback for every section",
    "Continuously adapts to hiring trend data",
  ],
};

const realTimeCategory: Category = {
  title: "Live Score Tracking",
  icon: <Zap className="w-6 h-6" />,
  description: "Get instant feedback as you make changes to your resume.",
  items: [
    "Live ATS score updates",
    "Instant keyword matching",
    "Format compatibility checks",
  ],
};

const globalCompatibilityCategory: Category = {
  title: "50+ ATS Systems",
  icon: <Shield className="w-6 h-6" />,
  description: "Optimized for 50+ global ATS systems worldwide.",
  items: [
    "Optimized for 50+ global ATS systems",
    "GDPR & CCPA compliant",
    "Secured with enterprise-grade encryption",
  ],
};

const iconColor = "from-[#0275dd] to-[#0261b8]";

const ChecklistCard: React.FC<ChecklistCardProps> = React.memo(
  ({ category, className = "", delay = 0 }) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const timer = setTimeout(() => setIsVisible(true), delay);
              observer.unobserve(entry.target);
              return () => clearTimeout(timer);
            }
          });
        },
        { threshold: 0.1, rootMargin: "50px" }
      );

      const currentCard = cardRef.current;
      if (currentCard) observer.observe(currentCard);

      return () => {
        if (currentCard) observer.unobserve(currentCard);
        observer.disconnect();
      };
    }, [delay]);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsHovered((prev) => !prev);
      }
    }, []);

    return (
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-label={`${category.title} feature card`}
        className={`relative bg-white rounded-3xl p-8 border-2 border-[#0275dd]/20 cursor-pointer group overflow-hidden transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-[#0275dd] focus:ring-offset-2 h-full ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${
          isHovered ? "shadow-2xl -translate-y-3 scale-[1.02]" : "shadow-lg hover:shadow-xl"
        } ${className}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="flex items-start gap-5 mb-4 relative z-10">
          <div className="relative">
            <div
              className={`relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${iconColor} flex items-center justify-center transition-all duration-500 shadow-xl ${
                isHovered ? "scale-110 rotate-6" : "scale-100 rotate-0"
              }`}
              aria-hidden="true"
            >
              {React.cloneElement(category.icon as React.ReactElement<{ className?: string }>, {
                className: `w-7 h-7 text-white transition-all duration-500 ${
                  isHovered ? "scale-110" : "scale-100"
                }`,
              })}
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-black leading-tight text-[#2d2d2d] transition-colors duration-300 mb-2">
              {category.title}
            </h3>
            <div
              className={`h-1 rounded-full bg-gradient-to-r ${iconColor} transition-all duration-500 ${
                isHovered ? "w-20" : "w-12"
              }`}
            />
          </div>
        </div>

        {category.description && (
          <p className="text-sm text-[#2d2d2d]/70 mb-6 relative z-10 leading-relaxed">
            {category.description}
          </p>
        )}

        <ul className="space-y-3 relative z-10" role="list">
          {category.items.map((item, i) => (
            <li
              key={`${category.title}-item-${i}`}
              className={`flex items-start gap-3 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              } ${isHovered ? "translate-x-2" : ""}`}
              style={{ transitionDelay: `${delay + 80 + i * 60}ms` }}
            >
              <div className="relative mt-0.5">
                <div
                  className={`relative flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${iconColor} flex items-center justify-center transition-all duration-300 ${
                    isHovered ? "scale-125 rotate-12" : "scale-100"
                  }`}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} aria-hidden="true" />
                </div>
              </div>

              <span className="text-sm leading-relaxed text-[#2d2d2d]/80 font-medium transition-all duration-300">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

ChecklistCard.displayName = "ChecklistCard";

function ChecklistSection() {
  const [headerVisible, setHeaderVisible] = React.useState(false);
  const headerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHeaderVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "30px" }
    );

    const currentHeader = headerRef.current;
    if (currentHeader) observer.observe(currentHeader);

    return () => {
      if (currentHeader) observer.unobserve(currentHeader);
      observer.disconnect();
    };
  }, []);

  const memoizedCards = useMemo(
    () => ({
      analysis: <ChecklistCard category={analysisCategory} delay={100} />,
      detailedBreakdown: (
        <ChecklistCard category={detailedBreakdownCategory} delay={200} />
      ),
      skillMatcher: <ChecklistCard category={skillMatcherCategory} delay={250} />,
      careerInsights: <ChecklistCard category={careerInsightsCategory} delay={300} />,
      realTime: <ChecklistCard category={realTimeCategory} delay={350} />,
      globalCompatibility: (
        <ChecklistCard category={globalCompatibilityCategory} delay={400} />
      ),
    }),
    []
  );

  return (
    <section
      className="relative bg-white text-[#2d2d2d] py-24 overflow-hidden"
      aria-labelledby="checklist-section-heading"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#e8f4fa]/50 via-[#f0f8fc]/30 to-transparent pointer-events-none"
        style={{ height: "50%" }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10">
        <div
          ref={headerRef}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <h2
              id="checklist-section-heading"
              className="text-4xl md:text-5xl font-black mb-6 leading-tight text-[#2d2d2d]"
            >
              Why Professionals Trust Our ATS Analyzer
            </h2>

            <p className="text-base text-[#2d2d2d]/70 mb-8 leading-relaxed">
              Advanced AI-driven resume evaluation that mirrors real recruiter behavior and
              ATS logic.
            </p>

            <div className="flex flex-wrap gap-6 mb-8">
              {[
                { icon: Users, value: "50K+", label: "USERS" },
                { icon: Award, value: "99%", label: "ACCURACY" },
                { icon: Zap, value: "10s", label: "FAST RESULTS" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <stat.icon className="w-6 h-6 text-[#0275dd]" />
                  <div>
                    <div className="text-3xl font-black text-[#2d2d2d]">
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#2d2d2d]/70 font-semibold tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0275dd]/5 border-l-4 border-[#0275dd] rounded-lg p-5">
              <p className="text-base font-semibold text-[#2d2d2d]">
                &quot;Get clarity where your resume truly stands — powered by recruiter-trained
                AI.&quot;
              </p>
            </div>
          </div>

          <div>{memoizedCards.analysis}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {memoizedCards.detailedBreakdown}
          {memoizedCards.skillMatcher}
          {memoizedCards.careerInsights}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memoizedCards.realTime}
          {memoizedCards.globalCompatibility}

          <div className="bg-white rounded-3xl p-8 border-2 border-[#0275dd]/20 shadow-lg hover:shadow-2xl transition-all duration-500 text-center flex flex-col justify-center">
            <h3 className="text-2xl font-black mb-4 text-[#2d2d2d] leading-tight">
              Ready to see your resume through recruiter&apos;s eyes?
            </h3>
            <p className="text-lg font-bold text-[#2d2d2d] mb-6">
              Run a deep ATS analysis now.
            </p>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#0275dd] to-[#0261b8] text-white font-bold text-base rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-300 mb-4">
              Try ATS Analyzer Now
              <span className="text-xl">→</span>
            </button>
            <p className="text-sm text-[#2d2d2d]/70">
              Free instant scan — no signup required
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(2, 117, 221, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(2, 117, 221, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        @media (prefers-reduced-motion: reduce) {
          .group,
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}

export default ChecklistSection;
