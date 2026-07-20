import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BlogChrome from '../_components/BlogChrome';

const PRIMARY = '#2557A7';
const DARK_TEXT = '#0B1220';
const MUTED_TEXT = '#64748B';

export default function ArticleNotFound() {
  return (
    <BlogChrome
      footerCta={{
        title: 'Turn career advice into a stronger resume.',
        description: 'Start with the free builder and apply the guidance from these articles.',
        href: '/builder/start',
        label: 'Build My Resume Free',
      }}
    >
      <div className="mx-auto flex max-w-[600px] flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="text-[64px] font-bold leading-none" style={{ color: PRIMARY, opacity: 0.25 }}>
          404
        </span>
        <h1 className="mt-4 text-[24px] font-bold" style={{ color: DARK_TEXT }}>
          We couldn&apos;t find that article
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6]" style={{ color: MUTED_TEXT }}>
          It may have been moved or the link is incorrect. Head back to the blog to keep browsing.
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-bold text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          <ArrowLeft size={16} strokeWidth={2.6} />
          Back to Blog
        </Link>
      </div>
    </BlogChrome>
  );
}
