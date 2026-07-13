import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, FileText, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FooterCta {
  title: string;
  description: string;
  href: string;
  label: string;
  onClick?: () => void;
}

const defaultCta: FooterCta = {
  title: 'Ready to improve your resume before the next application?',
  description: 'Start with the free plan. No credit card required.',
  href: '/builder/start',
  label: 'Build My Resume Free',
};

const columns = [
  {
    heading: 'Resume tools',
    links: [
      { label: 'Resume Builder', href: '/builder' },
      { label: 'Resume Templates', href: '/browse-templates' },
      { label: 'ATS Scanner', href: '/ats' },
      { label: 'Cover Letter', href: '/cover-letter' },
    ],
  },
  {
    heading: 'Career tools',
    links: [
      { label: 'Job Search', href: '/jobs' },
      { label: 'Job Match', href: '/jobmatch' },
      { label: 'Mock Interview', href: '/mock-interview' },
      { label: 'Mock Test', href: '/mock-test' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Pricing', href: '/payments' },
      { label: 'Contact', href: 'mailto:support@careerbot.com' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  },
];

const proofItems: { icon: LucideIcon; label: string }[] = [
  { icon: FileText, label: '70+ resume templates' },
  { icon: ShieldCheck, label: 'ATS-friendly workflows' },
  { icon: Briefcase, label: 'Global job search tools' },
];

export default function LandingFooter({ cta = defaultCta }: { cta?: FooterCta }) {
  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(120deg,#082d66_0%,#063b77_58%,#087b79_100%)] text-blue-100">
      <div className="mx-auto max-w-[1240px] px-4 pb-8 pt-10 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[360px_1fr] lg:items-start">
          <div className="rounded-lg bg-[#143e7c] px-7 py-7 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] ring-1 ring-white/15">
            <h2 className="text-xl font-black leading-tight">{cta.title}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-blue-100">{cta.description}</p>
            {cta.onClick ? (
              <button
                type="button"
                onClick={cta.onClick}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-[#2557a7] transition hover:bg-[#eef5ff]"
              >
                <Sparkles size={16} />
                {cta.label}
              </button>
            ) : (
              <Link
                href={cta.href}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-[#2557a7] transition hover:bg-[#eef5ff]"
              >
                <Sparkles size={16} />
                {cta.label}
              </Link>
            )}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.28fr_0.8fr_0.8fr_0.72fr_0.72fr]">
            <div>
            <Link href="/" className="flex w-fit items-center gap-2">
              <Image src="/assets/icons/Logo.png" alt="CareerBot" width={38} height={38} className="h-9 w-9" />
              <span className="text-lg font-black text-white">CareerBot</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-blue-100">
              Resume-ready, job-ready, and interview-ready career workflows for job seekers worldwide.
            </p>
            <div className="mt-5 space-y-2">
              {proofItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-bold text-blue-50">
                    <Icon size={14} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

            {columns.map((column) => (
              <div key={column.heading}>
                <h4 className="mb-4 text-sm font-black text-white">{column.heading}</h4>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm font-medium text-blue-100 transition hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-xs font-medium text-blue-100/80">Copyright 2026 CareerBot. All rights reserved.</p>
          <a href="mailto:support@careerbot.com" className="inline-flex items-center gap-2 text-xs font-bold text-blue-100 hover:text-white">
            <Mail size={14} />
            support@careerbot.com
          </a>
        </div>
      </div>
    </footer>
  );
}
