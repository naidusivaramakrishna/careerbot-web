"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "50,000+", label: "Resumes Analyzed" },
  { value: "92%", label: "Match Accuracy" },
  { value: "3×", label: "More Interviews" },
];

export default function StatsSection() {
  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              className="flex flex-col items-center text-center py-12 px-6"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              <span className="text-4xl md:text-5xl font-black text-[#2557A7] mb-2">{value}</span>
              <span className="text-sm font-semibold text-black">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
