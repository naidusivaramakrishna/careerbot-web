'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutTemplate,
  Mail,
  Menu,
  Mic,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  X,
} from 'lucide-react';

interface LandingNavbarProps {
  onOpenSignup: () => void;
  onOpenSignin?: () => void;
}

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}

interface DropdownGroup {
  id: string;
  label: string;
  sectionHeader: string;
  items: DropdownItem[];
  highlight: {
    title: string;
    description: string;
    href: string;
    cta: string;
  };
}

const dropdownGroups: DropdownGroup[] = [
  {
    id: 'resume',
    label: 'Resume Tools',
    sectionHeader: 'Build and optimize',
    highlight: {
      title: 'Resume-ready in minutes',
      description: 'Create, enhance, scan, and export an ATS-friendly resume from one workflow.',
      href: '/builder',
      cta: 'Start building',
    },
    items: [
      {
        icon: <FileText size={18} />,
        label: 'Resume Builder',
        description: 'Build ATS-ready resumes',
        href: '/builder',
      },
      {
        icon: <LayoutTemplate size={18} />,
        label: 'Templates',
        description: 'Browse role-based designs',
        href: '/#template-gallery',
      },
      {
        icon: <Wand2 size={18} />,
        label: 'AI Enhancer',
        description: 'Improve inside builder',
        href: '/builder',
      },
      {
        icon: <ScanSearch size={18} />,
        label: 'ATS Scanner',
        description: 'Find missing keywords',
        href: '/atslogin',
      },
      {
        icon: <Mail size={18} />,
        label: 'Cover Letter',
        description: 'Generate tailored letters',
        href: '/cover-letter',
      },
    ],
  },
  {
    id: 'jobs',
    label: 'Jobs',
    sectionHeader: 'Search and match',
    highlight: {
      title: 'Apply with better fit',
      description: 'Use resume-aware job matching before spending time on an application.',
      href: '/jobs',
      cta: 'Explore jobs',
    },
    items: [
      {
        icon: <Briefcase size={18} />,
        label: 'Job Search',
        description: 'Browse and apply to jobs',
        href: '/jobs',
      },
      {
        icon: <Target size={18} />,
        label: 'Job Match',
        description: 'Match resume to listings',
        href: '/jobmatch',
      },
    ],
  },
  {
    id: 'interview',
    label: 'Interview Prep',
    sectionHeader: 'Practice and improve',
    highlight: {
      title: 'Interview-ready faster',
      description: 'Practice interviews, aptitude tests, and communication before the real round.',
      href: '/mock-interview',
      cta: 'Start practice',
    },
    items: [
      {
        icon: <Mic size={18} />,
        label: 'Mock Interview',
        description: 'AI-powered simulation',
        href: '/mock-interview',
      },
      {
        icon: <ClipboardList size={18} />,
        label: 'Mock Test',
        description: 'Company-style practice',
        href: '/mock-test',
      },
    ],
  },
];

const directLinks = [
  { label: 'Templates', href: '/#template-gallery', sectionId: 'template-gallery', ariaLabel: 'View resume templates section' },
  { label: 'Pricing', href: '/#pricing', sectionId: 'pricing', ariaLabel: 'View pricing section' },
];

function DropdownItemCard({ item, onClick }: { item: DropdownItem; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2557a7] transition-colors group-hover:bg-[#2557a7] group-hover:text-white">
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight text-gray-900">{item.label}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-gray-500">{item.description}</p>
      </div>
    </Link>
  );
}

function DesktopDropdown({
  group,
  active,
  onEnter,
  onLeave,
  onClose,
}: {
  group: DropdownGroup;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        aria-haspopup="true"
        aria-expanded={active}
        className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors ${
          active ? 'bg-blue-50 text-[#2557a7]' : 'cursor-pointer text-gray-700 hover:bg-blue-50 hover:text-[#2557a7]'
        }`}
      >
        {group.label}
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-150 ${active ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute left-1/2 top-full z-50 mt-3 w-[560px] -translate-x-1/2 origin-top rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 transition-all duration-150 ${
          active ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="grid grid-cols-[1fr_220px] gap-3">
          <div className="p-2">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.sectionHeader}
            </p>
            <div className="grid grid-cols-1 gap-1">
              {group.items.map((item) => (
                <DropdownItemCard key={item.href + item.label} item={item} onClick={onClose} />
              ))}
            </div>
          </div>

          <Link
            href={group.highlight.href}
            onClick={onClose}
            className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-[#2557a7] to-[#183f7d] p-4 text-white"
          >
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Sparkles size={19} />
              </div>
              <h3 className="text-[15px] font-bold leading-snug">{group.highlight.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-blue-100">{group.highlight.description}</p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
              {group.highlight.cta}
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileAccordion({
  group,
  isOpen,
  onToggle,
  onLinkClick,
}: {
  group: DropdownGroup;
  isOpen: boolean;
  onToggle: () => void;
  onLinkClick: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
        aria-expanded={isOpen}
      >
        {group.label}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-1 px-2 pb-3">
          {group.items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onLinkClick}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2557a7]">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-gray-900">{item.label}</p>
                <p className="text-[13px] text-gray-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingNavbar({ onOpenSignup, onOpenSignin }: LandingNavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>('resume');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = directLinks.map((link) => link.sectionId);

    const updateActiveSection = () => {
      if (window.location.pathname !== '/') {
        setActiveSection(null);
        return;
      }

      const active = sectionIds
        .map((id) => {
          const section = document.getElementById(id);
          if (!section) return null;
          const rect = section.getBoundingClientRect();
          return {
            id,
            top: rect.top,
            bottom: rect.bottom,
          };
        })
        .filter(Boolean)
        .find((section) => section && section.top <= 120 && section.bottom > 120);

      setActiveSection(active?.id ?? null);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('hashchange', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      window.removeEventListener('hashchange', updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileExpanded('resume');
  };

  const handleMouseEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 140);
  };

  const handleSignin = () => {
    closeMobile();
    if (onOpenSignin) {
      onOpenSignin();
    } else {
      onOpenSignup();
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/95 backdrop-blur transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <nav className="mx-auto flex h-full max-w-screen-xl items-center justify-between gap-4 px-4 lg:px-8">
          <Link href="/" className="-ml-1 flex shrink-0 items-center transition-opacity hover:opacity-80" aria-label="CareerBOT home">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={54}
              height={54}
              className="-mr-1 shrink-0"
              style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
              priority
            />
            <span className="text-xl font-bold tracking-tight text-[#2557a7]">CareerBOT</span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {dropdownGroups.map((group) => (
              <DesktopDropdown
                key={group.id}
                group={group}
                active={activeDropdown === group.id}
                onEnter={() => handleMouseEnter(group.id)}
                onLeave={handleMouseLeave}
                onClose={() => setActiveDropdown(null)}
              />
            ))}

            {directLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                aria-label={link.ariaLabel}
                aria-current={activeSection === link.sectionId ? 'page' : undefined}
                onClick={() => setActiveDropdown(null)}
                className={`cursor-pointer rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors ${
                  activeSection === link.sectionId
                    ? 'bg-blue-50 text-[#2557a7]'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-[#2557a7]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              <button
                onClick={handleSignin}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-[15px] font-semibold text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#2557a7]"
              >
                Sign In
              </button>
              <Link
                href="/builder/start"
                onClick={() => setActiveDropdown(null)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] hover:shadow-[0_8px_22px_rgba(37,87,167,0.28)] active:scale-95"
              >
                <ShieldCheck size={15} />
                Get Started Free
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-blue-50 hover:text-[#2557a7] lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={closeMobile} aria-hidden="true" />
          <div className="absolute right-0 top-0 flex h-full w-[min(88vw,340px)] flex-col bg-white shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
              <Link href="/" onClick={closeMobile} className="flex items-center transition-opacity hover:opacity-80">
                <Image
                  src="/assets/icons/Logo.png"
                  alt="CareerBot"
                  width={44}
                  height={44}
                  className="-mr-1"
                  style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
                />
                <span className="text-lg font-bold tracking-tight text-[#2557a7]">CareerBOT</span>
              </Link>
              <button
                onClick={closeMobile}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-50"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {dropdownGroups.map((group) => (
                <MobileAccordion
                  key={group.id}
                  group={group}
                  isOpen={mobileExpanded === group.id}
                  onToggle={() => setMobileExpanded((prev) => (prev === group.id ? null : group.id))}
                  onLinkClick={closeMobile}
                />
              ))}
              {directLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  aria-label={link.ariaLabel}
                  aria-current={activeSection === link.sectionId ? 'page' : undefined}
                  onClick={closeMobile}
                  className={`flex cursor-pointer items-center gap-2 border-b border-gray-200 px-4 py-3 text-[15px] font-semibold transition-colors hover:bg-blue-50 hover:text-[#2557a7] ${
                    activeSection === link.sectionId ? 'bg-blue-50 text-[#2557a7]' : 'text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="shrink-0 space-y-2 border-t border-gray-200 px-4 py-4">
              <button
                onClick={handleSignin}
                className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 py-2.5 text-[15px] font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#2557a7]"
              >
                Sign In
              </button>
              <Link
                href="/builder/start"
                onClick={closeMobile}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2557a7] py-2.5 text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] hover:shadow-[0_8px_22px_rgba(37,87,167,0.28)] active:scale-95"
              >
                <ShieldCheck size={15} />
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
