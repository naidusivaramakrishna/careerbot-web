"use client";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Netflix",
  "Walmart",
  "Infosys",
];

export default function LogoStrip() {
  return (
    <div className="bg-[#0d1a3a] py-8 px-6 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-white/40 text-xs uppercase tracking-widest font-semibold mb-6">
          Candidates using CareerBot have been hired at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {companies.map((name) => (
            <span
              key={name}
              className="text-white/25 font-black text-sm md:text-base tracking-widest uppercase hover:text-white/50 transition-colors duration-300 cursor-default select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
