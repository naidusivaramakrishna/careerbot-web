'use client';

import { useState, useEffect } from 'react';
import SignUpModal from '@/components/SignUpModal';
import { useTenant } from '@/contexts/TenantContext';
import { sanitizeAuthRedirect } from '@/lib/authRedirect';
import LandingNavbar from './(landing)/_components/LandingNavbar';
import HeroSection from './(landing)/_components/HeroSection';
import TrustBadgeRow from './(landing)/_components/TrustBadgeRow';
import SocialProofBar from './(landing)/_components/SocialProofBar';
import FeaturesSection from './(landing)/_components/FeaturesSection';
import TemplateGallery from './(landing)/_components/TemplateGallery';
import HowItWorks from './(landing)/_components/HowItWorks';
import UserSegments from './(landing)/_components/UserSegments';
import Testimonials from './(landing)/_components/Testimonials';
import PricingTeaser from './(landing)/_components/PricingTeaser';
import FAQSection from './(landing)/_components/FAQSection';
import FinalCTASection from './(landing)/_components/FinalCTASection';
import LandingFooter from './(landing)/_components/LandingFooter';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [initialFormType, setInitialFormType] = useState<'signup' | 'signin'>('signup');
  const [authRedirectTo, setAuthRedirectTo] = useState<string | undefined>();
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
        setAuthRedirectTo(sanitizeAuthRedirect(params.get('next')));
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
        redirectTo={authRedirectTo}
      />
    </>
  );
}
