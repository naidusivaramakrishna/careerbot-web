"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ChevronUp } from "lucide-react";
import CTABand from "./landing/CTABand";
import FAQPage from "./landing/FAQPage";
import FeaturesSection from "./landing/FeaturesSection";
import Footer from "./landing/Footer";
import HeroSection from "./landing/HeroSection";
import ResumeUploadModal from "./upload/ResumeUploadModal";
import ResumeUpload from "./upload/ResumeUpload";
import TestimonialsSection from "./landing/TestimonialsSection";
import ATSScannerChecks from "./landing/ATSScannerChecks";
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
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-80" aria-label="CareerBot home">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={46}
              height={46}
              className="shrink-0"
              style={{ filter: "hue-rotate(8deg) saturate(130%) brightness(68%)" }}
              priority
            />
            <span className="text-lg font-black tracking-tight text-[#2557a7]">CareerBOT</span>
          </Link>

          <Link
            href="/ats/scan"
            className="inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] active:scale-95"
          >
            Check Resume
            <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <div className="bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-xs font-medium text-slate-500">
          <Link href="/" className="transition-colors hover:text-[#2557a7]">
            Home
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-700">ATS Scanner</span>
        </div>
      </div>

      <HeroSection onScanClick={openModal} />
      <FeaturesSection />
      <ATSScannerChecks />
      <BeforeAfterSection onScanClick={openModal} />
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
            bottom: 24,
            right: 12,
            width: 34,
            height: 40,
            borderRadius: 10,
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
          <ChevronUp style={{ width: 13, height: 13 }} strokeWidth={2.5} />
          <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1 }}>TOP</span>
        </button>
      )}
    </>
  );
}
