import type { ReactNode } from "react";

interface CoverLetterLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export default function CoverLetterLayout({ sidebar, main }: CoverLetterLayoutProps) {
  return (
    <main className="min-h-full bg-[linear-gradient(135deg,#eef2fb_0%,#f8fbff_48%,#e9f7f2_100%)] px-3 pb-10 pt-4 text-slate-900 sm:px-4 lg:px-5">
      <div className="mx-auto grid w-full max-w-[1180px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] 2xl:max-w-[1320px] 2xl:grid-cols-[330px_minmax(0,1fr)]">
        {sidebar}
        <section className="min-w-0 overflow-hidden rounded-lg border border-white/80 bg-white/95 shadow-sm backdrop-blur">
          {main}
        </section>
      </div>
    </main>
  );
}
