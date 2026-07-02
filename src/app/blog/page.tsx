'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, Search } from 'lucide-react';
import LandingNavbar from '@/app/(landing)/_components/LandingNavbar';
import LandingFooter from '@/app/(landing)/_components/LandingFooter';
import SignUpModal from '@/components/SignUpModal';
import { useTenant } from '@/contexts/TenantContext';
import { sanitizeAuthRedirect } from '@/lib/authRedirect';

const categories = ['All', 'Resume', 'ATS', 'Cover Letter', 'Interview', 'Job Search'];

const articles = [
  {
    title: 'How to build a recruiter-friendly resume with AI',
    category: 'Resume',
    readTime: '6 min read',
    excerpt: 'A practical guide to writing clearer sections, stronger bullets, and cleaner exports before your next application.',
  },
  {
    title: 'What an ATS scanner should check before you apply',
    category: 'ATS',
    readTime: '5 min read',
    excerpt: 'Learn the resume structure, keyword, and formatting checks that help reduce avoidable screening issues.',
  },
  {
    title: 'How to tailor a cover letter from your resume and job description',
    category: 'Cover Letter',
    readTime: '4 min read',
    excerpt: 'Use your resume, target role, and company context to draft a focused letter without starting from a blank page.',
  },
  {
    title: 'Prepare for interviews with a simple practice workflow',
    category: 'Interview',
    readTime: '7 min read',
    excerpt: 'Structure your answer practice, mock interviews, and test preparation so every application has a follow-through plan.',
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [initialFormType, setInitialFormType] = useState<'signup' | 'signin'>('signup');
  const [authRedirectTo, setAuthRedirectTo] = useState<string | undefined>();
  const { setActiveTenant } = useTenant();

  const filteredArticles = useMemo(
    () => articles.filter((article) => activeCategory === 'All' || article.category === activeCategory),
    [activeCategory],
  );

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
      window.history.replaceState({}, '', '/blog');
    }

    const handleOpenLogin = () => openSignin();
    window.addEventListener('openLoginModal', handleOpenLogin);
    return () => window.removeEventListener('openLoginModal', handleOpenLogin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
      <LandingNavbar onOpenSignup={openSignup} onOpenSignin={openSignin} />
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_58%,#eaf2ff_100%)]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#2557a7] shadow-sm">
                CareerBot Blog
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
                Practical career articles for better applications.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                Publish resume, ATS, cover letter, interview, and job-search guidance here without creating extra category pages.
              </p>
            </div>

            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/60">
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-[#2557a7]">
                <Search size={18} />
                <span className="text-sm font-bold">Article filters stay on this page</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      activeCategory === category
                        ? 'border-[#2557a7] bg-[#2557a7] text-white'
                        : 'border-blue-100 bg-white text-[#2557a7] hover:bg-blue-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {filteredArticles.map((article) => (
            <article key={article.title} className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100/40">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#2557a7]">
                <span className="rounded-full bg-blue-50 px-3 py-1">{article.category}</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Clock size={13} />
                  {article.readTime}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-extrabold leading-snug text-slate-950">{article.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
              <button className="mt-5 text-sm font-bold text-[#2557a7]">Read article</button>
            </article>
          ))}
        </div>
      </section>

      <LandingFooter
        cta={{
          title: 'Turn career advice into a stronger resume.',
          description: 'Start with the free builder and apply the guidance from these articles.',
          href: '/builder/start',
          label: 'Build My Resume Free',
        }}
      />
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
