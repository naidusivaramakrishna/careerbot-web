import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { getAllArticles, getArticleBySlug, formatReadTime, formatUpdated } from '@/lib/blog';
import { illustrations, TeamAvatar } from '../_components/ArticleIllustrations';
import BlogChrome from '../_components/BlogChrome';

const PRIMARY = '#2557A7';
const TAG_BG = '#EAF1FC';
const DARK_TEXT = '#0B1220';
const MUTED_TEXT = '#64748B';
const BORDER = '#E6ECF5';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article not found — CareerBOT Blog' };
  return {
    title: `${article.title} — CareerBOT Blog`,
    description: article.excerpt,
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const Art = illustrations[article.illustration];

  return (
    <BlogChrome
      footerCta={{
        title: 'Turn career advice into a stronger resume.',
        description: 'Start with the free builder and apply the guidance from these articles.',
        href: '/builder/start',
        label: 'Build My Resume Free',
      }}
    >
      <article className="mx-auto max-w-[820px] px-4 py-12 sm:px-6 lg:py-16">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: PRIMARY }}>
            <ArrowLeft size={14} strokeWidth={2.6} />
            Back to Blog
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: TAG_BG, color: PRIMARY }}>
              {article.tag}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: MUTED_TEXT }}>
              <Clock className="h-3.5 w-3.5" />
              {formatReadTime(article.readTimeMinutes)}
            </span>
          </div>

          <h1 className="mt-3 text-[28px] font-bold leading-[1.2] sm:text-[36px]" style={{ color: DARK_TEXT }}>
            {article.title}
          </h1>

          <div className="mt-5 flex items-center gap-2.5">
            <TeamAvatar size={36} />
            <div>
              <p className="text-[13px] font-bold" style={{ color: DARK_TEXT }}>
                {article.author}
              </p>
              <p className="text-[12px]" style={{ color: MUTED_TEXT }}>
                {formatUpdated(article.updatedAt)}
              </p>
            </div>
          </div>

          <div className="relative mt-7 aspect-[20/9] overflow-hidden rounded-[18px]">
            <Art />
          </div>

          <div className="mt-8 space-y-5">
            {article.body.map((paragraph, i) => (
              <p key={i} className="text-[16px] leading-[1.75]" style={{ color: '#334155' }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div
            className="mt-12 flex flex-col items-start gap-4 rounded-[20px] border bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: BORDER, boxShadow: '0 2px 4px rgba(16,24,40,.03), 0 10px 20px rgba(16,24,40,.05)' }}
          >
            <div>
              <p className="text-[15px] font-bold" style={{ color: DARK_TEXT }}>
                Ready to apply what you just read?
              </p>
              <p className="mt-1 text-[13px]" style={{ color: MUTED_TEXT }}>
                Build a resume with CareerBOT and put this guidance to work.
              </p>
            </div>
            <Link
              href="/builder/start"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-[14px] font-bold text-white"
              style={{ backgroundColor: PRIMARY }}
            >
              Build My Resume Free
              <ArrowRight size={16} strokeWidth={2.6} />
            </Link>
          </div>
        </article>
    </BlogChrome>
  );
}
