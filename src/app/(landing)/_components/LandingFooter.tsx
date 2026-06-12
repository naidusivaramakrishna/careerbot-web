import Link from 'next/link';
import {
  Bot,
  Briefcase,
  FileText,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FooterColumn {
  heading: string;
  links: {
    label: string;
    href: string;
  }[];
}

interface ProofItem {
  icon: LucideIcon;
  label: string;
}

const columns: FooterColumn[] = [
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
      { label: 'How It Works', href: '/#how-it-works' },
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

const proofItems: ProofItem[] = [
  { icon: FileText, label: '70+ resume templates' },
  { icon: ShieldCheck, label: 'ATS-friendly workflows' },
  { icon: Briefcase, label: 'Global job search tools' },
];

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden text-blue-100" style={{ backgroundColor: '#163f7d' }}>
      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex w-fit items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-lg shadow-blue-950/20">
                <Bot size={17} color="#2557a7" strokeWidth={2.2} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">CareerBot</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-blue-100">
              Resume-ready, job-ready, and interview-ready career workflows for job seekers worldwide.
            </p>
            <div className="flex flex-col gap-2">
              {proofItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-blue-50">
                    <Icon size={14} className="text-white" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-4 text-sm font-semibold text-white">{column.heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-blue-100 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-6 sm:flex-row">
          <p className="text-xs text-blue-100/80">Copyright 2026 CareerBot. All rights reserved.</p>
          <a
            href="mailto:support@careerbot.com"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-100 transition-colors hover:text-white"
          >
            <Mail size={14} />
            support@careerbot.com
          </a>
        </div>
      </div>
    </footer>
  );
}
