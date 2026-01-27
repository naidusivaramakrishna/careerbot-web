"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, FileText, Briefcase, GraduationCap } from "lucide-react";

function App() {
  const steps = [
    {
      title: "Upload your resume",
      description:
        "Upload your resume to the resume score checker (or build a new one from scratch), and go to the dashboard to view your score.",
      image: "/images/resumeupload.png",
      alt: "Upload Resume",
    },
    {
      title: "Review checker report",
      description:
        'Look at your resume review report and select "Improve Resume" to view the areas the resume checker recommends fixing.',
      image: "/images/resumeanalysis.png",
      alt: "Review checker report",
    },
    {
      title: "Optimize using our builder",
      description:
        "Use our resume builder to implement the suggested changes and enhance your resume score, making it more effective and impactful.",
      image: "/images/resumeanalysys.png",
      alt: "Optimize using builder",
    },
    {
      title: "Ready to send",
      description:
        "Finalize your content and share it with HR for approval. They'll ensure it aligns with company policies and standards.",
      image: "/images/All-issues-resolved.jpg",
      alt: "Ready to send",
    },
  ];

  const scoringFactors = [
    {
      icon: Search,
      title: "Keyword Matching",
      description:
        "Context-aware AI keyword analysis that detects relevance, and domain terminology.",
      details: [
        "Context-aware keyword detection",
        "Semantic & exact match evaluation",
        "Measures keyword strength & placement",
        "Detects ATS-critical terminology",
        "Identifies missing role-specific keywords",
      ],
    },
    {
      icon: FileText,
      title: "Format & Structure",
      description:
        "Ensures your resume is structured in a clean ATS-friendly format that boosts readability.",
      details: [
        "Checks ATS-friendly formatting compliance",
        "Validates heading hierarchy & content order",
        "Detects formatting blockers (icons, tables, shapes)",
        "Checks export quality & metadata",
        "Scores readability, layout clarity & flow",
      ],
    },
    {
      icon: Briefcase,
      title: "Experience Relevance",
      description:
        "Measures how well your past experience aligns with the job role and required impact.",
      details: [
        "Job title & seniority alignment",
        "Years of hands-on relevant experience",
        "Achievement vs responsibility scoring",
        "Industry/company relevance rating",
        "Role-to-experience match depth",
      ],
    },
    {
      icon: GraduationCap,
      title: "Skills & Qualifications",
      description:
        "Evaluates technical & soft skills, qualifications, and certifications essential for the role.",
      details: [
        "Evaluates technical & soft skills",
        "Matches required & preferred skills",
        "Infers skill proficiency level",
        "Validates certifications & education",
        "Detects transferable skills",
      ],
    },
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <motion.section
        className="py-12 pb-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          How Our ATS Score Works
        </motion.h1>
        <motion.p
          className="text-lg text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          We analyze your resume using AI-powered ATS evaluation to ensure your
          application clears automated screenings used by top companies.
        </motion.p>
      </motion.section>

      <section className="py-8 bg-white">
        <motion.div
          className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              className="flex flex-col items-center pt-16"
              variants={cardVariant}
            >
              <div className="relative w-full">
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="w-40 h-40 object-contain rounded-2xl"
                  />
                </div>
                <motion.div
                  className="bg-white w-full rounded-3xl p-8 shadow-md text-center border border-gray-200 mt-14"
                  whileHover={{
                    y: -5,
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="py-12 bg-gray-50">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            4 Key Factors We Analyze
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our ATS intelligence engine evaluates your resume across four core
            dimensions to measure relevance, readability, and job-fit accuracy.
          </p>
        </motion.div>
        <motion.div
          className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {scoringFactors.map((factor, index) => {
            const IconComponent = factor.icon;
            return (
              <motion.div
                key={index}
                className="rounded-2xl overflow-hidden shadow-md border border-gray-200 flex flex-col bg-white"
                variants={cardVariant}
                whileHover={{
                  y: -5,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
                  transition: { duration: 0.3 },
                }}
              >
                <div className="bg-white p-8">
                  <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <IconComponent className="w-7 h-7 text-blue-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {factor.title}
                  </h3>
                  <p className="text-gray-700 mt-3 leading-relaxed">
                    {factor.description}
                  </p>
                </div>

                <div className="bg-blue-50 px-8 py-6 flex-grow">
                  <ul className="space-y-2.5">
                    {factor.details.map((detail, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-0.5 flex-shrink-0">•</span>
                        <span className="text-sm text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}

export default App;
