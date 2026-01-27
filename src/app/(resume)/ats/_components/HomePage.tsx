"use client";
import { useState } from "react";
import FAQPage from "./landing/FAQPage";
import FeaturesSection from "./landing/FeaturesSection";
import Footer from "./landing/Footer";
import HeroSection from "./landing/HeroSection";
import ResumeUploadModal from "./upload/ResumeUploadModal";
import ResumeUpload from "./upload/ResumeUpload";
import TestimonialsSection from "./landing/TestimonialsSection";
import HowATSScoreWorksPage from "./landing/HowATSScoreWorksPage";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <HeroSection onScanClick={openModal} />
      <HowATSScoreWorksPage />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQPage />
      <Footer />
      <ResumeUploadModal isOpen={isModalOpen} onClose={closeModal}>
        <ResumeUpload />
      </ResumeUploadModal>
    </>
  );
}
