import React from "react";
import Link from "next/link";

export interface CTASectionProps {
  heading: string;
  subtext: string;
  buttonText: string;
  buttonHref: string;
  buttonIcon?: React.ElementType;
  note?: string;
}

export default function CTASection({
  heading,
  subtext,
  buttonText,
  buttonHref,
  buttonIcon: Icon,
  note,
}: CTASectionProps) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight">
          {heading}
        </h2>
        <p className="text-gray-500 text-base mb-10 leading-relaxed">{subtext}</p>
        <Link
          href={buttonHref}
          className="inline-flex items-center justify-center gap-2.5 h-14 px-12 rounded-xl text-white font-black text-base transition-opacity hover:opacity-90 shadow-xl"
          style={{ backgroundColor: "#2557a7" }}
        >
          {Icon && <Icon className="w-5 h-5" />}
          {buttonText}
        </Link>
        {note && <p className="mt-5 text-xs text-gray-400">{note}</p>}
      </div>
    </section>
  );
}
