import Link from 'next/link';
import { Bot, Linkedin, Twitter } from 'lucide-react';

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'ATS Scanner', href: '/atslogin' },
      { label: 'Resume Builder', href: '/builder' },
      { label: 'Job Search', href: '/jobs' },
      { label: 'Cover Letter', href: '/cover-letter' },
      { label: 'Mock Interview', href: '/mock-interview' },
      { label: 'Pricing', href: '/payments' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Contact', href: 'mailto:support@careerbot.com' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '/terms-of-service' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex w-fit items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2557a7]">
                <Bot size={14} color="white" strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">CareerBot</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Resume-ready. Job-ready. Interview-ready. Built for India&apos;s job market.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-4 text-sm font-semibold text-white">{column.heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">Copyright 2026 CareerBot. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" aria-label="LinkedIn" className="text-slate-500 transition-colors hover:text-white">
              <Linkedin size={16} />
            </Link>
            <Link href="#" aria-label="Twitter" className="text-slate-500 transition-colors hover:text-white">
              <Twitter size={16} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
