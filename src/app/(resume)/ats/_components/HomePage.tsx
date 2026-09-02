"use client";
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import SignUpModal from "@/components/SignUpModal";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";
import LandingFooter from "@/app/(landing)/_components/LandingFooter";
import CTABand from "./landing/CTABand";
import FAQPage from "./landing/FAQPage";
import FeaturesSection from "./landing/FeaturesSection";
import HeroSection from "./landing/HeroSection";
import TestimonialsSection from "./landing/TestimonialsSection";
import ATSScannerChecks from "./landing/ATSScannerChecks";
import BeforeAfterSection from "./landing/BeforeAfterSection";

export default function HomePage() {
  const [showTop, setShowTop] = useState(false);
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
  const openAtsSignin = () => {
    setAuthFormType("signin");
    setShowAuthModal(true);
  };

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
      <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />

      <HeroSection onScanClick={openAtsSignin} />
      <FeaturesSection />
      <ATSScannerChecks />
      <BeforeAfterSection />
      <TestimonialsSection />
      <CTABand />
      <FAQPage />
      <LandingFooter
        cta={{
          title: "Ready to improve your resume before the next application?",
          description: "Check your ATS score for free. No credit card required.",
          href: "/ats",
          label: "Check Your Resume",
          onClick: openAtsSignin,
        }}
      />
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

      <SignUpModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialFormType={authFormType}
        redirectTo="/atslogin"
      />
    </>
  );
}
