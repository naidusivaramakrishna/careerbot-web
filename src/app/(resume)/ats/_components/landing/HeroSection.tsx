"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Zap, Briefcase, Users, UserCheck } from "lucide-react";

interface HeroATSProps {
  onScanClick?: () => void;
}

const HeroATS: React.FC<HeroATSProps> = ({ onScanClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<"scan" | "sample" | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { icon: Briefcase, value: "100k+", label: "Job vacancy" },
    { icon: Users, value: "50k+", label: "Peoples got hired" },
    { icon: UserCheck, value: "50k+", label: "Job Holders" },
  ];

  return (
    <section className="relative overflow-hidden pt-52 md:pt-40 lg:pt-48 pb-16 md:pb-20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#2d5f7f] to-[#3d5f8f]" />

      <div className="relative max-w-[1800px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT CONTENT */}
          <div
            className={`flex flex-col justify-center space-y-8 pr-4 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-full w-fit text-sm font-bold shadow-lg">
              <Zap className="w-4 h-4" />
              AI-Powered Resume Optimizer
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.2] text-left uppercase">
              <span className="text-white block mb-2">OPTIMIZE YOUR</span>
              <span className="text-white block mb-2">RESUME TO BEAT</span>
              <span className="text-white block">ATS SCANNERS</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-200 max-w-xl leading-relaxed pt-2">
              Our AI analyzes your resume, finds missing keywords, fixes formatting issues,
              and boosts your ATS match rate to 95%+. Avoid instant rejections and get more
              interview opportunities with a fully optimized resume.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                onClick={onScanClick}
                onMouseEnter={() => setHoveredButton("scan")}
                onMouseLeave={() => setHoveredButton(null)}
                className="group relative bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <Zap
                  className={`w-5 h-5 ${
                    hoveredButton === "scan" ? "rotate-12 scale-110" : ""
                  }`}
                />
                Scan Resume Now
              </button>

              <button
                onMouseEnter={() => setHoveredButton("sample")}
                onMouseLeave={() => setHoveredButton(null)}
                className="group relative border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 flex items-center gap-2"
              >
                <Play
                  className={`w-5 h-5 ${
                    hoveredButton === "sample" ? "scale-110" : ""
                  }`}
                />
                See Sample Scan
              </button>
            </div>
          </div>

          {/* RIGHT VIDEO */}
          <div
            className={`flex justify-center lg:justify-end pl-0 -ml-5 transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="relative w-full max-w-[900px] lg:max-w-[1100px] group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white h-[600px]">
                <video
                  src="/images/resume-preview.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  className="w-full h-full object-cover rounded-2xl"
                ></video>
              </div>

              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const positions = ["-top-8 -left-8", "-top-4 -right-8", "-bottom-8 -right-8"];

                return (
                  <div key={index} className={`absolute ${positions[index]}`}>
                    <div className="backdrop-blur-md bg-white/90 rounded-2xl p-4 shadow-2xl border border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {stat.value}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroATS;
