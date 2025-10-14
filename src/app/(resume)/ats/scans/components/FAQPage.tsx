"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How accurate is the ATS scoring system?",
    answer:
      "Our ATS scoring system is powered by AI and benchmarked against real recruitment data. It provides a reliable estimate of how applicant tracking systems rank your resume.",
  },
  {
    question: "What file formats are supported for resume scanning?",
    answer:
      "We currently support PDF, DOCX, and TXT file formats for resume scanning.",
  },
  {
    question: "Is my resume data secure and private?",
    answer:
      "Yes. Your resume is encrypted, securely processed, and never shared with third parties.",
  },
  {
    question: "How does the AI resume enhancement work?",
    answer:
      "The AI analyzes formatting, keywords, readability, and job description alignment, then suggests improvements to boost your resume’s score.",
  },
  {
    question: "Can I analyze my resume against multiple job descriptions?",
    answer:
      "Yes, you can upload multiple job descriptions and compare your resume’s match score across them.",
  },
  {
    question: "What makes this different from other resume tools?",
    answer:
      "CareerBot ATS Scanner provides real-time feedback, keyword suggestions, and AI-driven enhancements, unlike traditional scanners.",
  },
  {
    question: "Do you offer support for international markets?",
    answer:
      "Yes, our ATS scanner works for global job applications, supporting multiple formats and industry standards.",
  },
  {
    question: "What kind of customer support is available?",
    answer:
      "We provide enterprise-grade support with a 24-hour response time and priority handling for premium users.",
  },
];

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-6">
      {/* Heading */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 mt-3">
          Everything you need to know about CareerBot ATS Scanner
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="w-full max-w-3xl space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white border rounded-lg shadow-sm overflow-hidden"
          >
            <button
              className="w-full flex justify-between items-center p-4 text-left text-gray-800 font-medium hover:bg-gray-50"
              onClick={() => toggleFAQ(index)}
            >
              {faq.question}
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="p-4 text-gray-600 border-t bg-gray-50">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support CTA */}
      <div className="mt-12 w-full max-w-2xl text-center bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Still have questions?
        </h3>
        <p className="text-gray-600 mb-6">
          Our enterprise support team is here to help you succeed.
        </p>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition">
          Contact Support Team
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Response within 24 hours • Enterprise-grade support
        </p>
      </div>
    </main>
  );
};

export default FAQPage;
