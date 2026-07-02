import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Chrome, FileText, Sparkles } from 'lucide-react';

const benefits = [
  'Capture job descriptions from hiring pages',
  'Send the description into Resume, Cover Letter, and Job Match workflows',
  'Reduce copy-paste work before each application',
];

export default function BrowserExtensionPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)]">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex text-sm font-bold text-[#2557a7] hover:underline">
            Back to home
          </Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-xs font-black uppercase text-[#2557a7]">
            <Chrome size={16} />
            Chrome Extension
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#08143f] md:text-5xl">
            Browser Extension for Job Descriptions
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-[#435373]">
            Use CareerBot to capture job descriptions and reuse them across resume tailoring, cover letter generation, and job matching.
          </p>

          <div className="mt-7 space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm font-bold text-[#17234f]">
                <CheckCircle2 className="h-5 w-5 fill-[#0d5be1] text-white" strokeWidth={3} />
                {benefit}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobmatch"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b55d9] px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(13,91,225,0.24)] transition hover:bg-[#0848ba]"
            >
              Use Job Match
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/cover-letter"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d6e3f8] bg-white px-6 text-sm font-black text-[#2557a7] transition hover:bg-[#f7fbff]"
            >
              Create Cover Letter
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dce8fb] bg-white p-5 shadow-[0_22px_56px_rgba(37,87,167,0.12)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef5ff] text-[#2557a7]">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#08143f]">Extracted Successfully</h2>
              <p className="text-sm font-semibold text-[#52617e]">Job description copied into CareerBot</p>
            </div>
          </div>
          <Image
            src="/images/landing/browser-extension-panel-v2.png"
            alt="CareerBot browser extension extracting a job description"
            width={2048}
            height={864}
            className="h-auto w-full rounded-xl border border-[#dce8fb]"
            priority
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {['Resume', 'Cover Letter', 'Job Match'].map((item) => (
              <div key={item} className="rounded-lg bg-[#f7fbff] p-3 text-sm font-black text-[#08143f]">
                <FileText className="mb-2 h-5 w-5 text-[#0d5be1]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
