"use client";

import { useRouter } from "next/navigation";
import HeroSection from "./landing/HeroSection";
import StatsSection from "./landing/StatsSection";
import FeaturesSection from "./landing/FeaturesSection";
import HowItWorks from "./landing/HowItWorks";
import TestimonialsSection from "./landing/TestimonialsSection";
import CTABand from "./landing/CTABand";
import FAQSection from "./landing/FAQSection";
import Footer from "@/app/(resume)/ats/_components/landing/Footer";

export default function JobMatchHomePage() {
  const router = useRouter();
  const handleAnalyzeClick = () => router.push("/jobmatch/app");

  return (
    <>
      <HeroSection onAnalyzeClick={handleAnalyzeClick} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <TestimonialsSection />
      <CTABand onAnalyzeClick={handleAnalyzeClick} />
      <FAQSection />
      <Footer />
    </>
  );
}
