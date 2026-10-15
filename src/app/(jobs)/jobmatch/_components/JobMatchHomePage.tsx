"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SignUpModal from "@/components/SignUpModal";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";
import JobMatchFooter from "./landing/JobMatchFooter";
import HeroSection from "./landing/HeroSection";
import ThreeStepsSection from "./landing/ThreeStepsSection";
import MatchInsightsSection from "./landing/MatchInsightsSection";
import ResumeEditorSection from "./landing/ResumeEditorSection";
import TestimonialsSection from "./landing/TestimonialsSection";
import ComparisonTable from "./landing/ComparisonTable";
import FAQSection from "./landing/FAQSection";
import FinalCTASection from "./landing/FinalCTASection";
import styles from "./JobMatchHomePage.module.css";

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
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      title="Back to top"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-[#2557A7] text-white shadow-lg hover:bg-[#1F4E98] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-label"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
      <span className="text-body-sm">Top</span>
    </button>
  );
}

export default function JobMatchHomePage() {
  const router = useRouter();
  const handleAnalyzeClick = () => router.push("/jobmatch/app");

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFormType, setAuthFormType] = useState<"signup" | "signin">("signup");

  const openSignup = () => {
    setAuthFormType("signup");
    setShowAuthModal(true);
  };
  const openSignin = () => {
    setAuthFormType("signin");
    setShowAuthModal(true);
  };

  return (
    <div className={styles.page}>
      <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />
      <HeroSection onAnalyzeClick={handleAnalyzeClick} />
      <ThreeStepsSection />
      <MatchInsightsSection />
      <ResumeEditorSection onAnalyzeClick={handleAnalyzeClick} />
      <TestimonialsSection />
      <ComparisonTable />
      <FAQSection />
      <FinalCTASection onAnalyzeClick={handleAnalyzeClick} />
      <JobMatchFooter />
      <BackToTop />

      <SignUpModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialFormType={authFormType}
      />
    </div>
  );
}
