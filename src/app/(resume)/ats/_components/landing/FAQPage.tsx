"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How do you check if a resume is ATS-friendly?",
    answer:
      "Upload your resume to CareerBot's ATS checker. Our AI scans your resume for keyword matches, formatting issues, section structure, and readability — then gives you an instant ATS score with specific fixes to improve it.",
  },
  {
    question: "Which ATS checker is best?",
    answer:
      "CareerBot is one of the most accurate ATS checkers available. It uses real ATS logic combined with AI to analyze your resume across keyword relevance, format compliance, section clarity, and job-fit accuracy.",
  },
  {
    question: "Is there a free ATS score checker?",
    answer:
      "Yes. CareerBot offers a free ATS score check — no credit card or signup required. Upload your resume and get a detailed score breakdown in under 10 seconds.",
  },
  {
    question: "What is a good ATS score out of 100?",
    answer:
      "A score of 75 or above is considered strong. Scores above 85 significantly improve your chances of passing automated screening. Scores below 60 usually mean the resume has keyword gaps or formatting issues that need attention.",
  },
  {
    question: "How do you increase your ATS score?",
    answer:
      "Add role-specific keywords from the job description, use clean formatting (no tables, columns, or images), write clear section headings (Experience, Education, Skills), and quantify your achievements wherever possible.",
  },
  {
    question: "Can AI help my resume pass through ATS?",
    answer:
      "Yes. CareerBot's AI identifies missing keywords, suggests stronger action verbs, fixes formatting blockers, and rewrites weak bullet points — all tailored to help your resume clear ATS filters and impress recruiters.",
  },
  {
    question: "What are common ATS resume mistakes?",
    answer:
      "The most common mistakes are: using tables or multi-column layouts, missing role-specific keywords, vague bullet points with no numbers, non-standard section headings, and submitting in the wrong file format.",
  },
  {
    question: "Are ATS checkers worth it?",
    answer:
      "Yes. ATS checkers show how well your resume matches job requirements and help identify missing keywords, formatting issues, and content gaps. They provide a quick score and actionable feedback to improve your chances of passing automated screening.",
  },
];

function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="py-16 md:py-24 px-6 lg:px-8" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #f0fdf4 100%)" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-3 leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Last Updated: <span className="font-semibold text-slate-500">May 28, 2026</span>
          </p>
        </div>

        {/* FAQ Cards */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 px-8 py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[16px] font-semibold text-[#1a1a2e] leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[#2557a7] transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    strokeWidth={2.5}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-8 pb-6">
                    <p className="text-[14px] text-slate-500 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default FAQPage;
