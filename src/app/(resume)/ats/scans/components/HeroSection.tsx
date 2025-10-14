"use client";

import React from "react";
import Image from "next/image";

const HeroATS = () => {
  return (
    <section className="relative bg-gray-100 overflow-hidden pt-52 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 items-center gap-12">
        {/* Left Content */}
        <div className="text-left">
          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-snug text-neutral-900">
            Beat ATS Systems with <br />
            <span className="text-orange-500">
              AI-Powered Resume Optimization
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg lg:text-xl text-neutral-600 mb-8 max-w-lg">
            Get AI-powered ATS analysis and recruiter readability insights in{" "}
            <span className="font-bold text-neutral-900">10 seconds</span>. Optimize your resume with{" "}
            <span className="font-bold text-neutral-900">95% accuracy</span> for
            any job application.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="bg-orange-500 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-orange-600 transition text-sm md:text-base">
              Check ATS Score
            </button>
            <button className="border border-orange-500 text-orange-500 px-5 py-2.5 rounded-lg hover:bg-neutral-100 transition text-sm md:text-base">
              View Sample Report
            </button>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="relative flex justify-center">
          <Image
            src="/images/resume-preview.png"
            alt="Resume Preview"
            width={800} // smaller than before
            height={800}
            className="rounded-xl border border-neutral-200 w-full max-w-[650px] h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroATS;
