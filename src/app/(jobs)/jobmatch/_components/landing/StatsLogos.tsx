"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "Google",    color: "#4285F4", letter: "G" },
  { name: "Amazon",    color: "#FF9900", letter: "a" },
  { name: "Microsoft", color: "#00A4EF", letter: "M" },
  { name: "Meta",      color: "#0866FF", letter: "f" },
  { name: "Adobe",     color: "#FF0000", letter: "A" },
];

export default function StatsLogos() {
  return (
    <section className="bg-white border-t border-slate-100 border-b border-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.p
          className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-7"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Trusted by professionals from top companies
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-12 md:gap-20"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          {logos.map(({ name, color, letter }, i) => (
            <motion.div
              key={name}
              className="flex items-center gap-2 select-none"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[15px] shadow-sm shrink-0"
                style={{ backgroundColor: color }}
              >
                {letter}
              </span>
              <span className="text-[15px] font-bold text-slate-600 tracking-tight">{name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
