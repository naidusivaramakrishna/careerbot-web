"use client";
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import CTABand from "./landing/CTABand";
import FAQPage from "./landing/FAQPage";
import FeaturesSection from "./landing/FeaturesSection";
import Footer from "./landing/Footer";
import HeroSection from "./landing/HeroSection";
import ResumeUploadModal from "./upload/ResumeUploadModal";
import ResumeUpload from "./upload/ResumeUpload";
import TestimonialsSection from "./landing/TestimonialsSection";
import HowATSScoreWorksPage from "./landing/HowATSScoreWorksPage";
import BeforeAfterSection from "./landing/BeforeAfterSection";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      setShowTop(scrolled > 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <HeroSection onScanClick={openModal} />
      <HowATSScoreWorksPage />
      <BeforeAfterSection onScanClick={openModal} />
      <FeaturesSection />
      <TestimonialsSection />
      <CTABand onScanClick={openModal} />
      <FAQPage />
      <Footer />
      <ResumeUploadModal isOpen={isModalOpen} onClose={closeModal}>
        <ResumeUpload />
      </ResumeUploadModal>

      {/* ── Scroll to top ── */}
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            width: 44,
            height: 52,
            borderRadius: 14,
            background: "#ffffff",
            color: "#2557a7",
            border: "2px solid #2557a7",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            boxShadow: "0 4px 16px rgba(37,87,167,0.18)",
            zIndex: 9999,
            transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.background = "#eef3fb";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,87,167,0.30)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,87,167,0.18)";
          }}
        >
          <ChevronUp style={{ width: 18, height: 18 }} strokeWidth={2.5} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1 }}>TOP</span>
        </button>
      )}
    </>
  );
}
