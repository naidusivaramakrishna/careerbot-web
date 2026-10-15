"use client";

import { useState } from "react";
import Image from "next/image";
import { COMPANY_CONFIG } from "@/config/company";
import styles from "./FAQSection.module.css";

const faqs = [
  {
    question: "What is CareerBOT Job Match?",
    answer: "CareerBOT Job Match analyzes your resume against a job description (JD) and provides a match score, skill gap analysis, and personalized suggestions to help you improve your resume for the role.",
  },
  {
    question: "How does the match score work?",
    answer: "The match score compares your resume’s skills and experience with the job requirements. The analysis highlights matching skills, gaps, and suggestions for improving your resume.",
  },
  {
    question: "Is it free?",
    answer: "CareerBOT offers a free plan. Your access to analyses depends on your plan and available credits.",
  },
  {
    question: "What happens to my files?",
    answer: "Your uploaded resume and job description are used for the match analysis. You can review the files before starting the analysis.",
  },
  {
    question: "Do I need to create a new resume?",
    answer: "No. Upload an existing PDF or DOCX resume, or choose a saved resume, then use the editor to make targeted improvements.",
  },
] as const;

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={styles.section} aria-labelledby="jobmatch-faq-title">
      <div className={styles.content}>
        <h2 id="jobmatch-faq-title" className={styles.heading}>Frequently asked <span>questions</span></h2>
        <p className={styles.subtitle}>Everything you need to know about CareerBOT Job Match.</p>
        <div className={styles.layout}>
          <div className={styles.help}>
            <p className={styles.overline}><span aria-hidden="true" />STILL HAVE QUESTIONS?</p>
            <h3 className={styles.helpHeading}>We’re here to <span>make it<br />simple.</span></h3>
            <p className={styles.helpDescription}>Find quick answers to common questions about<br className={styles.copyBreak} />{" "}CareerBOT Job Match and how it can help you create a<br className={styles.copyBreak} />{" "}stronger, more targeted resume.</p>
            <a href={`mailto:${COMPANY_CONFIG.supportEmail}`} className={styles.helpCard}>
              <Image src="/images/jobmatch-reference/still-need-help-icon.svg" width={18} height={25} alt="" unoptimized />
              <div>
                <h4>Still need help?</h4>
                <p>Contact our support team anytime. We’re happy to assist you.</p>
              </div>
            </a>
          </div>
          <div className={styles.accordion}>
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.question} className={`${styles.item} ${isOpen ? styles.open : ""}`}>
                  <button type="button" id={`jobmatch-faq-question-${index}`} className={styles.question} onClick={() => setOpenIndex(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`jobmatch-faq-answer-${index}`}>
                    <span>{faq.question}</span>
                    <span className={`${styles.indicator} ${isOpen ? styles.minus : ""}`} aria-hidden="true" />
                  </button>
                  <div id={`jobmatch-faq-answer-${index}`} className={styles.answer} role="region" aria-labelledby={`jobmatch-faq-question-${index}`} hidden={!isOpen}>
                    <p>{faq.answer}</p>
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
