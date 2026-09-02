"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "What file formats are supported?",
    answer:
      "We support PDF, DOCX, and DOC for resumes. Job descriptions can be pasted as plain text, uploaded as a file (.txt, .pdf, .docx), or imported via a URL from any job board such as LinkedIn, Indeed, or Naukri.",
  },
  {
    question: "How is the match score calculated?",
    answer:
      "Our AI compares your resume's skills, experience keywords, education, and role-specific language against the job description using a multi-factor model trained on real hiring data. Each requirement is weighted by how critical it is to the role — so missing a core skill has more impact than a nice-to-have.",
  },
  {
    question: "Is my resume data secure?",
    answer:
      "Yes. Your resume is encrypted in transit (TLS 1.3) and processed in isolated compute. We never share your data with third parties, and we do not store your resume after the analysis is complete. We are fully GDPR and CCPA compliant.",
  },
  {
    question: "Can I compare my resume to multiple job descriptions?",
    answer:
      "Yes — you can run a new analysis for any job description without re-uploading your resume each time. Each analysis is independent, results appear instantly, and your best match is always at the top.",
  },
  {
    question: "How do I add missing skills to my resume?",
    answer:
      "In the analysis results view, each missing skill shows an Add to Resume button. Clicking it adds the skill directly to your resume's skills section and updates your match score in real time so you can see the improvement immediately.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-12 lg:gap-20">

          {/* Left: sticky header + contact */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className="inline-block px-4 py-1.5 bg-[#EEF4FF] text-[#2557A7] rounded-full text-[11px] font-bold mb-5 uppercase tracking-widest">
              FAQ
            </span>

            <h2 className="text-3xl md:text-4xl font-black text-black leading-tight mb-4">
              Frequently Asked{" "}
              <span className="text-[#2557A7]">Questions</span>
            </h2>

            <p className="text-base text-slate-500 leading-relaxed mb-8">
              Everything you need to know about CareerBot&apos;s AI Job Matching tool.
            </p>

            {/* Contact card */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#EEF4FF] flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4 text-[#2557A7]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black mb-0.5">Still have questions?</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Our team typically responds within 24 hours.</p>
                </div>
              </div>
              <a
                href="mailto:support@careerbot.ai"
                className="block w-full text-center px-5 py-2.5 bg-[#2557A7] hover:bg-[#1e4a96] text-white text-xs font-bold rounded-xl transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>

          {/* Right: accordion */}
          <div>
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border-b border-slate-100 ${idx === 0 ? "border-t" : ""}`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`text-[15px] font-semibold leading-snug transition-colors duration-200 ${
                        isOpen ? "text-[#2557A7]" : "text-black group-hover:text-[#2557A7]"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? "bg-[#2557A7] border-[#2557A7] rotate-180"
                          : "border-slate-200 group-hover:border-[#2557A7]"
                      }`}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-colors duration-200 ${
                          isOpen ? "text-white" : "text-slate-400 group-hover:text-[#2557A7]"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-60 opacity-100 pb-5" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-[14px] text-slate-500 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
