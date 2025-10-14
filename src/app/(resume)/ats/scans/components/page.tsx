// src/app/scan/page.tsx

import FAQPage from "./FAQPage";
import FeaturesSection from "./FeaturesSection";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import ResumeUpload from "./ResumeUpload";
import TestimonialsSection from "./TestimonialsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ResumeUpload />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQPage />
      <Footer />
    </>
  );
}
