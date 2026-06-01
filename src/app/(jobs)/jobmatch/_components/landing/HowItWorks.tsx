"use client";

import { motion } from "framer-motion";
import { Upload, FileText, Target } from "lucide-react";

const steps = [
  {
    number: "01",
    Icon: Upload,
    title: "Upload Resume",
    description:
      "Upload your PDF or DOCX resume. Our AI reads every section instantly — no reformatting needed.",
  },
  {
    number: "02",
    Icon: FileText,
    title: "Paste Job Description",
    description:
      "Copy any job posting from LinkedIn, Indeed, Naukri, or any company site and paste it in.",
  },
  {
    number: "03",
    Icon: Target,
    title: "Get Your Match Score",
    description:
      "Your AI-powered match score appears in seconds with a full breakdown of matched and missing skills.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 md:py-24 border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#EEF4FF] px-4 py-1.5 rounded-full mb-5">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight">
            Three Steps to Your Match Score
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
            No setup required. Results in under 15 seconds.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-0.5 bg-slate-100" />

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {steps.map(({ number, Icon, title, description }) => (
              <motion.div
                key={number}
                className="flex flex-col items-center text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                {/* Yellow circle */}
                <div className="relative z-10 w-20 h-20 bg-[#FFC85E] rounded-full flex flex-col items-center justify-center mb-6 shrink-0">
                  <Icon className="w-7 h-7 text-black mb-0.5" />
                  <span className="text-[10px] font-black text-black leading-none">{number}</span>
                </div>

                <h3 className="text-[17px] font-bold text-black mb-3">{title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed max-w-52">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Time badge */}
        <motion.div
          className="flex justify-center mt-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <span className="text-sm font-semibold text-[#2557A7] bg-[#EEF4FF] px-6 py-2.5 rounded-full">
            ⚡ Average analysis time: under 15 seconds
          </span>
        </motion.div>

      </div>
    </section>
  );
}
