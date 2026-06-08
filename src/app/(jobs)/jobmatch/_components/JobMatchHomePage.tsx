"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "./landing/HeroSection";
import FeaturesSection from "./landing/FeaturesSection";
import ResumeEditorSection from "./landing/ResumeEditorSection";
import TestimonialsSection from "./landing/TestimonialsSection";
import ComparisonTable from "./landing/ComparisonTable";
import CTABand from "./landing/CTABand";
import FAQSection from "./landing/FAQSection";
import Footer from "@/app/(resume)/ats/_components/landing/Footer";

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-[#2557a7] text-white shadow-lg hover:bg-[#1e4a94] hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
      <span className="text-[10px] font-semibold">Top</span>
    </button>
  );
}

export default function JobMatchHomePage() {
  const router = useRouter();
  const handleAnalyzeClick = () => router.push("/jobmatch/app");

  return (
    <>
      <HeroSection onAnalyzeClick={handleAnalyzeClick} />
      <FeaturesSection />
      <ResumeEditorSection />
      <TestimonialsSection />
      <ComparisonTable />
      <CTABand onAnalyzeClick={handleAnalyzeClick} />
      <FAQSection />
      <Footer />
      <BackToTop />
    </>
  );
}
