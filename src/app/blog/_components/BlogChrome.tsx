'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import LandingNavbar from '@/app/(landing)/_components/LandingNavbar';
import LandingFooter from '@/app/(landing)/_components/LandingFooter';
import SignUpModal from '@/components/SignUpModal';
import { useTenant } from '@/contexts/TenantContext';
import { sanitizeAuthRedirect } from '@/lib/authRedirect';

type BlogChromeContextValue = { openSignup: () => void; openSignin: () => void };

const BlogChromeContext = createContext<BlogChromeContextValue | null>(null);

/** Access the shared signup/signin modal openers from anywhere under <BlogChrome>. */
export function useBlogChrome(): BlogChromeContextValue {
  const ctx = useContext(BlogChromeContext);
  if (!ctx) throw new Error('useBlogChrome must be used within <BlogChrome>');
  return ctx;
}

export default function BlogChrome({
  children,
  footerCta,
}: {
  children: ReactNode;
  footerCta: { title: string; description: string; href: string; label: string };
}) {
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
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('tenant_id');

    if (tenantId) setActiveTenant(tenantId);

    if (params.get('showLogin') === 'true') {
      setAuthRedirectTo(sanitizeAuthRedirect(params.get('next')));
      setTimeout(() => openSignin(), 0);
      if (params.get('verified') === 'true') {
        sessionStorage.setItem('emailVerified', 'true');
      }
      window.history.replaceState({}, '', window.location.pathname);
    }

    const handleOpenLogin = () => openSignin();
    window.addEventListener('openLoginModal', handleOpenLogin);
    return () => window.removeEventListener('openLoginModal', handleOpenLogin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BlogChromeContext.Provider value={{ openSignup, openSignin }}>
      <main className="min-h-screen bg-white">
        <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />
        {children}
        <LandingFooter cta={footerCta} />
      </main>

      <SignUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialFormType={initialFormType}
        redirectTo={authRedirectTo}
      />
    </BlogChromeContext.Provider>
  );
}
