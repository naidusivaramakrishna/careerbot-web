'use client';

import { useState, useEffect } from 'react';
import SignUpModal from '@/components/SignUpModal';
import { useTenant } from '@/contexts/TenantContext';
import LandingNavbar from './_components/LandingNavbar';
import HeroSection from './_components/HeroSection';
import TrustBadgeRow from './_components/TrustBadgeRow';
import SocialProofBar from './_components/SocialProofBar';
import FeaturesSection from './_components/FeaturesSection';
import TemplateGallery from './_components/TemplateGallery';
import HowItWorks from './_components/HowItWorks';
import UserSegments from './_components/UserSegments';
import Testimonials from './_components/Testimonials';
import PricingTeaser from './_components/PricingTeaser';
import FAQSection from './_components/FAQSection';
import FinalCTASection from './_components/FinalCTASection';
import LandingFooter from './_components/LandingFooter';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [initialFormType, setInitialFormType] = useState<'signup' | 'signin'>('signup');
  const { setActiveTenant } = useTenant();

  const openSignup = () => {
    setInitialFormType('signup');
    setShowModal(true);
  };

  const openSignin = () => {
    setInitialFormType('signin');
    setShowModal(true);
  };

  useEffect(() => {
    // Handle URL parameters on initial mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);

      const tenantId = params.get('tenant_id');
      if (tenantId) {
        setActiveTenant(tenantId);
      }

      if (params.get('showLogin') === 'true') {
        // Delay slightly to ensure state updates properly
        setTimeout(() => {
          openSignin();
        }, 0);
        if (params.get('verified') === 'true') {
          sessionStorage.setItem('emailVerified', 'true');
        }
        // Clean URL after opening modal
        window.history.replaceState({}, '', '/');
      }
    }

    const handleOpenLogin = () => openSignin();
    window.addEventListener('openLoginModal', handleOpenLogin);
    return () => window.removeEventListener('openLoginModal', handleOpenLogin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Enable smooth scrolling for anchor links */}
      <style>{`html { scroll-behavior: smooth; }`}</style>

      <main>
        <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />
        <HeroSection />
        <TrustBadgeRow />
        <SocialProofBar />
        <FeaturesSection />
        <TemplateGallery onOpenSignup={openSignup} />
        <HowItWorks />
        <UserSegments />
        <Testimonials />
        <PricingTeaser />
        <FAQSection />
        <FinalCTASection />
        <LandingFooter />
      </main>

      <SignUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialFormType={initialFormType}
      />
    </>
  );
}
