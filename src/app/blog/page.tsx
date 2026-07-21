import type { Metadata } from 'next';
import { getAllArticles, getFeaturedGuide } from '@/lib/blog';
import BlogChrome from './_components/BlogChrome';
import BlogPageClient from './_components/BlogPageClient';

export const metadata: Metadata = {
  title: 'CareerBOT Blog — Insights to help you land your next job faster',
  description: 'Expert articles on resumes, ATS, cover letters, interviews, career growth and AI tools to boost your career.',
};

export default async function BlogPage() {
  const [articles, featuredGuide] = await Promise.all([getAllArticles(), getFeaturedGuide()]);

  if (!featuredGuide) {
    throw new Error('No blog articles found in src/content/blog.');
  }

  return (
    <BlogChrome
      footerCta={{
        title: 'Turn career advice into a stronger resume.',
        description: 'Start with the free builder and apply the guidance from these articles.',
        href: '/builder/start',
        label: 'Build My Resume Free',
      }}
    >
      <BlogPageClient articles={articles} featuredGuide={featuredGuide} />
    </BlogChrome>
  );
}
