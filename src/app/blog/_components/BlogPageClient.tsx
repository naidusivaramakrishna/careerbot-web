'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Lightbulb,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Trophy,
} from 'lucide-react';
import type { Article } from '@/lib/blogFormat';
import { formatReadTime, formatUpdated } from '@/lib/blogFormat';
import { illustrations, TeamAvatar } from './ArticleIllustrations';
import { useBlogChrome } from './BlogChrome';

const PRIMARY = '#2557A7';
const PRIMARY_DARK = '#1d477f';
const TAG_BG = '#EAF1FC';
const DARK_TEXT = '#0B1220';
const MUTED_TEXT = '#64748B';
const BORDER = '#E6ECF5';
const SUCCESS = '#10B981';

const SHADOW_CARD = '0 2px 4px rgba(16,24,40,.04), 0 12px 24px rgba(16,24,40,.06), 0 24px 60px rgba(16,24,40,.08)';
const SHADOW_CARD_HOVER = '0 8px 16px rgba(16,24,40,.06), 0 24px 48px rgba(16,24,40,.10), 0 40px 100px rgba(16,24,40,.12)';
const SHADOW_FEATURE = '0 2px 4px rgba(16,24,40,.03), 0 10px 20px rgba(16,24,40,.05)';

const categories = [
  { id: 'all', label: 'All Articles' },
  { id: 'resume', label: 'Resume' },
  { id: 'ats', label: 'ATS' },
  { id: 'cover-letter', label: 'Cover Letter' },
  { id: 'interview', label: 'Interview' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'career-growth', label: 'Career Growth' },
  { id: 'ai', label: 'AI' },
];

const trendingTopics = categories.filter((c) => c.id !== 'all');

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

export default function BlogPageClient({
  articles,
  featuredGuide,
}: {
  articles: Article[];
  featuredGuide: Article;
}) {
  const { openSignup } = useBlogChrome();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<SubscribeStatus>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const gridArticles = useMemo(() => articles.filter((a) => !a.featuredGuide), [articles]);

  const filteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = gridArticles.filter((article) => {
      const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
      const matchesSearch = !term || article.title.toLowerCase().includes(term) || article.excerpt.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
    return filtered.sort((a, b) => {
      const diff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      return sortOrder === 'recent' ? diff : -diff;
    });
  }, [gridArticles, activeCategory, searchTerm, sortOrder]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus('loading');
    setSubscribeMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubscribeStatus('error');
        setSubscribeMessage(data.message || 'Something went wrong. Please try again.');
        return;
      }
      setSubscribeStatus('success');
      setSubscribeMessage(data.message || 'Subscribed!');
      setEmail('');
    } catch {
      setSubscribeStatus('error');
      setSubscribeMessage('Network error. Please try again.');
    }
  };

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F7FAFF 60%, #F1F5FF 100%)' }}
      >
        <div
          className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,87,167,0.10), transparent 70%)', filter: 'blur(120px)' }}
        />

        <div className="relative mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-8">
            {/* Left: hero copy */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: TAG_BG, color: PRIMARY }}
              >
                CareerBot Blog
              </span>
              <h1
                className="mt-4 text-[32px] font-bold leading-[1.15] tracking-[-0.01em] sm:text-[38px] lg:text-[44px]"
                style={{ color: DARK_TEXT }}
              >
                Insights to help you land your <span style={{ color: PRIMARY }}>next job faster.</span>
              </h1>
              <p className="mt-4 max-w-xl text-[16px] leading-[1.6]" style={{ color: MUTED_TEXT }}>
                Expert articles on resumes, ATS, cover letters, interviews, career growth and AI tools to boost your career.
              </p>

              <div className="mt-6 flex h-14 items-center gap-3 rounded-[14px] border bg-white px-4" style={{ borderColor: BORDER }}>
                <Search className="h-5 w-5 shrink-0" style={{ color: MUTED_TEXT }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search articles, topics, or keywords..."
                  className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400"
                  style={{ color: DARK_TEXT }}
                />
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide" style={{ color: MUTED_TEXT }}>
                  <Flame className="h-4 w-4" style={{ color: '#F97316' }} />
                  Trending topics
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {trendingTopics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setActiveCategory(topic.id)}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#EAF1FC]"
                      style={{ borderColor: BORDER, color: DARK_TEXT }}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right: featured guide card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
              className="rounded-[20px] border bg-white p-6 sm:p-7"
              style={{ borderColor: BORDER, boxShadow: SHADOW_FEATURE }}
            >
              <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: TAG_BG, color: PRIMARY }}
                  >
                    <Star className="h-3 w-3 fill-current" />
                    Featured Guide
                  </span>
                  <h2 className="mt-4 text-[22px] font-bold leading-[1.2] sm:text-[26px]" style={{ color: DARK_TEXT }}>
                    {featuredGuide.title}
                  </h2>
                  <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: MUTED_TEXT }}>
                    {featuredGuide.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[13px] font-medium" style={{ color: MUTED_TEXT }}>
                    <Clock className="h-3.5 w-3.5" />
                    {formatReadTime(featuredGuide.readTimeMinutes)}
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    {formatUpdated(featuredGuide.updatedAt)}
                  </div>
                  <Link
                    href={`/blog/${featuredGuide.slug}`}
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-bold text-white transition hover:-translate-y-0.5"
                    style={{ backgroundColor: PRIMARY, boxShadow: '0 14px 28px rgba(37,87,167,0.32)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_DARK)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
                  >
                    Read Full Guide
                    <ArrowRight size={16} strokeWidth={2.6} />
                  </Link>
                </div>

                <div className="relative mx-auto flex h-[190px] w-[160px] items-center justify-center sm:h-[210px] sm:w-full">
                  <div className="relative h-full w-[150px] rounded-2xl bg-white p-3" style={{ boxShadow: SHADOW_CARD }}>
                    <span className="absolute -left-2 -top-3 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: SUCCESS }}>
                      ATS
                    </span>
                    <div className="mt-4 space-y-2">
                      <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                      <div className="h-1.5 w-3/5 rounded bg-slate-200" />
                    </div>
                    <div className="mt-4 space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: SUCCESS }} strokeWidth={3} />
                          <div className="h-1.5 w-full rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                    <div
                      className="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-full bg-white"
                      style={{ boxShadow: SHADOW_CARD, background: `conic-gradient(${SUCCESS} 352.8deg, ${BORDER} 0deg)` }}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[13px] font-bold" style={{ color: DARK_TEXT }}>
                        98
                      </div>
                    </div>
                    <div className="absolute -left-3 top-1/3 flex h-8 w-8 items-center justify-center rounded-lg bg-white" style={{ boxShadow: SHADOW_CARD }}>
                      <Trophy className="h-4 w-4" style={{ color: PRIMARY }} />
                    </div>
                    <div className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white" style={{ boxShadow: SHADOW_CARD }}>
                      <RefreshCw className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-3" style={{ borderColor: BORDER, boxShadow: SHADOW_FEATURE }}>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200"
                  style={active ? { backgroundColor: PRIMARY, color: '#fff' } : { backgroundColor: 'transparent', color: DARK_TEXT, border: `1px solid ${BORDER}` }}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setSortOrder((s) => (s === 'recent' ? 'oldest' : 'recent'))}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
            style={{ borderColor: BORDER, color: DARK_TEXT }}
          >
            <SlidersHorizontal className="h-4 w-4" style={{ color: MUTED_TEXT }} />
            {sortOrder === 'recent' ? 'Most Recent' : 'Oldest First'}
          </button>
        </div>
      </section>

      {/* Article grid */}
      <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-6">
        <motion.div
          key={activeCategory + searchTerm + sortOrder}
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
        >
          {filteredArticles.map((article) => {
            const Art = illustrations[article.illustration];
            return (
              <motion.article
                key={article.slug}
                variants={cardVariants}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="group flex gap-4 overflow-hidden rounded-[16px] border bg-white p-3 transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ borderColor: BORDER, boxShadow: SHADOW_CARD }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = SHADOW_CARD_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = SHADOW_CARD)}
              >
                <Link href={`/blog/${article.slug}`} className="block w-[38%] shrink-0 sm:w-[34%]">
                  <div className="relative aspect-square overflow-hidden rounded-[12px]">
                    <div className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-105">
                      <Art />
                    </div>
                    {article.featured && (
                      <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: SUCCESS }}>
                        Featured
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: TAG_BG, color: PRIMARY }}>
                      {article.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: MUTED_TEXT }}>
                      <Clock className="h-3 w-3" />
                      {formatReadTime(article.readTimeMinutes)}
                    </span>
                  </div>

                  <Link href={`/blog/${article.slug}`}>
                    <h3 className="mt-1.5 text-[14px] font-bold leading-[1.3] transition-colors group-hover:text-[#2557A7] sm:text-[15px]" style={{ color: DARK_TEXT }}>
                      {article.title}
                    </h3>
                  </Link>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5]" style={{ color: MUTED_TEXT }}>
                    {article.excerpt}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <TeamAvatar size={22} />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold" style={{ color: DARK_TEXT }}>
                          {article.author}
                        </p>
                        <p className="truncate text-[10px]" style={{ color: MUTED_TEXT }}>
                          {formatUpdated(article.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold transition-transform group-hover:translate-x-0.5"
                      style={{ color: PRIMARY }}
                    >
                      Read
                      <ArrowRight size={12} strokeWidth={2.6} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {filteredArticles.length === 0 && (
          <div className="rounded-[20px] border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
            <p className="text-[15px] font-semibold" style={{ color: MUTED_TEXT }}>
              No articles match this filter yet. Try another topic.
            </p>
          </div>
        )}
      </section>

      {/* Newsletter + CTAs */}
      <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-6">
        <div className="overflow-hidden rounded-[20px] border bg-white" style={{ borderColor: BORDER, boxShadow: SHADOW_FEATURE }}>
          <div className="grid md:grid-cols-3">
            <div className="relative flex items-start gap-3.5 p-6" style={{ backgroundColor: '#F4F8FF' }}>
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: TAG_BG, color: PRIMARY }}>
                <FileText className="h-6 w-6" strokeWidth={2.2} />
                <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: PRIMARY, boxShadow: '0 4px 8px rgba(37,87,167,0.4)' }}>
                  <Bell className="h-3 w-3" fill="white" strokeWidth={0} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-bold" style={{ color: DARK_TEXT }}>
                  Get weekly career insights
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: MUTED_TEXT }}>
                  Join our subscriber list for practical tips and AI-powered career advice.
                </p>
                <form onSubmit={handleSubscribe} className="mt-3.5 flex h-11 items-center overflow-hidden rounded-xl border bg-white" style={{ borderColor: BORDER }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    disabled={subscribeStatus === 'loading'}
                    className="h-full w-full min-w-0 bg-transparent px-3 text-[13px] outline-none placeholder:text-slate-400 disabled:opacity-60"
                    style={{ color: DARK_TEXT }}
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'loading'}
                    className="h-full shrink-0 px-4 text-[13px] font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {subscribeStatus === 'loading' ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </form>
                {subscribeMessage && (
                  <p className="mt-2 text-[12px] font-medium" style={{ color: subscribeStatus === 'success' ? SUCCESS : '#DC2626' }}>
                    {subscribeMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3.5 border-t p-6 md:border-l md:border-t-0" style={{ borderColor: BORDER }}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: TAG_BG, color: PRIMARY }}>
                <FileText className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: DARK_TEXT }}>
                  Improve your profile now
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: MUTED_TEXT }}>
                  Apply what you learn. Build a stronger resume and get more interview calls.
                </p>
                <button
                  type="button"
                  onClick={openSignup}
                  className="mt-3.5 inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  Try Resume Builder
                  <ArrowRight size={14} strokeWidth={2.6} />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3.5 border-t p-6 md:border-l md:border-t-0" style={{ borderColor: BORDER }}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#FFF4E0' }}>
                <Lightbulb className="h-6 w-6" style={{ color: '#F59E0B' }} fill="#FBBF24" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold" style={{ color: DARK_TEXT }}>
                  Have a topic in mind?
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: MUTED_TEXT }}>
                  Tell us what you want to learn about. We&apos;ll cover it in our next articles.
                </p>
                <a
                  href="mailto:support@careerbot.com?subject=Blog%20topic%20suggestion"
                  className="mt-3.5 inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  Suggest a Topic
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
