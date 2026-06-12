'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock, Search } from 'lucide-react';
import LandingFooter from '@/app/(landing)/_components/LandingFooter';

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

  const filteredArticles = useMemo(
    () => articles.filter((article) => activeCategory === 'All' || article.category === activeCategory),
    [activeCategory],
  );

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-80" aria-label="CareerBot home">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={46}
              height={46}
              className="shrink-0"
              style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
              priority
            />
            <span className="text-lg font-black tracking-tight text-[#2557a7]">CareerBOT</span>
          </Link>

          <Link
            href="/builder/start"
            className="inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] active:scale-95"
          >
            Start Free
            <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#f4f8ff_58%,#eaf2ff_100%)]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 lg:px-8">
          <div className="mb-7 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#2557a7]">Home</Link>
            <ChevronRight size={15} className="text-slate-300" />
            <span className="text-slate-700">Blog</span>
          </div>

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

      <LandingFooter />
    </main>
  );
}
