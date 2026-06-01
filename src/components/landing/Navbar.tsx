'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Menu,
  X,
  ChevronDown,
  FileText,
  ScanSearch,
  Mail,
  Briefcase,
  Target,
  Zap,
  Mic,
  ClipboardList,
  Languages,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  comingSoon?: boolean;
}

interface DropdownGroup {
  id: string;
  label: string;
  sectionHeader: string;
  items: DropdownItem[];
  promoText?: string;
  footerNote?: string;
  gridLayout?: boolean;
}

/* ─────────────────────────────────────────────
   Nav data
───────────────────────────────────────────── */
const RESUME_ITEMS: DropdownItem[] = [
  {
    icon: <FileText size={18} />,
    label: 'Resume Builder',
    description: 'Build from scratch',
    href: '/builder',
  },
  {
    icon: <ScanSearch size={18} />,
    label: 'ATS Scanner',
    description: 'Check ATS score',
    href: '/atslogin',
  },
  {
    icon: <Mail size={18} />,
    label: 'Cover Letter',
    description: 'AI-powered letters',
    href: '/cover-letter',
  },
];

const JOBS_ITEMS: DropdownItem[] = [
  {
    icon: <Briefcase size={18} />,
    label: 'Job Search',
    description: 'Browse and apply to jobs',
    href: '/jobs',
  },
  {
    icon: <Target size={18} />,
    label: 'Job Match',
    description: 'Match your resume to job listings',
    href: '/job-match',
  },
  {
    icon: <Zap size={18} />,
    label: 'Job Aggregator',
    description: 'All jobs from top boards in one',
    href: '#coming-soon',
    comingSoon: true,
  },
];

const INTERVIEW_ITEMS: DropdownItem[] = [
  {
    icon: <Mic size={18} />,
    label: 'Mock Interview',
    description: 'AI-powered interview simulation',
    href: '/mock-interview',
  },
  {
    icon: <ClipboardList size={18} />,
    label: 'Mock Test',
    description: 'Practice with real exam questions',
    href: '/mock-test',
  },
];

const ASSESSMENT_ITEMS: DropdownItem[] = [
  {
    icon: <Languages size={18} />,
    label: 'English Assessment',
    description: 'Test and improve your English',
    href: '#coming-soon',
    comingSoon: true,
  },
];

const DROPDOWN_GROUPS: DropdownGroup[] = [
  {
    id: 'resume',
    label: 'Resume',
    sectionHeader: 'RESUME TOOLS',
    items: RESUME_ITEMS,
    promoText: '✨ New: AI Resume Enhancement →',
    gridLayout: true,
  },
  {
    id: 'jobs',
    label: 'Jobs',
    sectionHeader: 'JOB SEARCH',
    items: JOBS_ITEMS,
  },
  {
    id: 'interview',
    label: 'Interview',
    sectionHeader: 'INTERVIEW PREP',
    items: INTERVIEW_ITEMS,
  },
  {
    id: 'assessments',
    label: 'Assessments',
    sectionHeader: 'SKILL ASSESSMENTS',
    items: ASSESSMENT_ITEMS,
    footerNote: 'More assessments coming soon',
  },
];

const DIRECT_LINKS = [
  { label: 'Blog', href: '#coming-soon', comingSoon: true },
  { label: 'Pricing', href: '#coming-soon', comingSoon: true },
];

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function ComingSoonBadge() {
  return (
    <span className="bg-amber-50 text-amber-700 text-[10px] rounded-full px-2 py-0.5 ml-auto shrink-0 font-medium">
      Coming Soon
    </span>
  );
}

function DropdownItemCard({
  item,
  onClick,
}: {
  item: DropdownItem;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-[#2557a7]">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 leading-tight">{item.label}</p>
          {item.comingSoon && <ComingSoonBadge />}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.description}</p>
      </div>
    </Link>
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
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        {group.label}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-2 pb-2 space-y-0.5">
          {group.items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0 text-[#2557a7]">
                {item.icon}
              </div>
              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
              {item.comingSoon && <ComingSoonBadge />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Escape key closes dropdown */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMouseEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileExpanded(null);
  };

  const toggleMobileAccordion = (id: string) => {
    setMobileExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-16 bg-white border-b border-gray-200 transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <nav
          role="navigation"
          className="flex items-center justify-between h-full px-4 lg:px-8 max-w-screen-xl mx-auto gap-4"
        >
          {/* ── LEFT: Logo + Name ── */}
          <Link
            href="/"
            className="flex items-center shrink-0 hover:opacity-80 transition-opacity -ml-1"
            aria-label="CareerBOT home"
          >
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={60}
              height={60}
              className="shrink-0 -mr-1"
              style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
              priority
            />
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#2557a7' }}
            >
              CareerBOT
            </span>
          </Link>

          {/* ── CENTER: Desktop nav ── */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">

            {/* Dropdown groups */}
            {DROPDOWN_GROUPS.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  aria-haspopup="true"
                  aria-expanded={activeDropdown === group.id}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeDropdown === group.id
                      ? 'text-[#2557a7] bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-150 ${
                      activeDropdown === group.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown panel */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg shadow-slate-200/50 p-4 z-50 transition-all duration-150 ease-out origin-top ${
                    group.gridLayout ? 'min-w-[420px]' : 'min-w-[280px]'
                  } ${
                    activeDropdown === group.id
                      ? 'opacity-100 scale-100 pointer-events-auto'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  {/* Section header */}
                  <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-1 mb-2">
                    {group.sectionHeader}
                  </p>

                  {/* Items */}
                  {group.gridLayout ? (
                    <div className="grid grid-cols-2 gap-1">
                      {group.items.map((item) => (
                        <DropdownItemCard
                          key={item.href + item.label}
                          item={item}
                          onClick={() => setActiveDropdown(null)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {group.items.map((item, idx) => (
                        <div key={item.href + item.label}>
                          <DropdownItemCard
                            item={item}
                            onClick={() => setActiveDropdown(null)}
                          />
                          {/* Separator between items in Jobs dropdown */}
                          {group.id === 'jobs' && idx < group.items.length - 1 && (
                            <div className="border-b border-gray-100 mx-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Promo link */}
                  {group.promoText && (
                    <Link
                      href="/builder"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center mt-3 pt-3 border-t border-gray-100 px-1 text-xs font-semibold text-[#2557a7] hover:text-[#1f4e98] transition-colors"
                    >
                      {group.promoText}
                    </Link>
                  )}

                  {/* Footer note */}
                  {group.footerNote && (
                    <p className="mt-3 pt-3 border-t border-gray-100 px-1 text-xs text-gray-400 italic">
                      {group.footerNote}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Direct links */}
            {DIRECT_LINKS.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                {link.label}
                {link.comingSoon && <ComingSoonBadge />}
              </Link>
            ))}
          </div>

          {/* ── RIGHT: Auth buttons + hamburger ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop auth */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: '#2557a7',
                  boxShadow: '0 2px 8px rgba(37,87,167,0.25)',
                }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 shrink-0">
              <Link
                href="/"
                onClick={closeMobile}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/assets/icons/Logo.png"
                  alt="CareerBot"
                  width={44}
                  height={44}
                  className="-mr-1"
                  style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
                />
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ color: '#2557a7' }}
                >
                  CareerBOT
                </span>
              </Link>
              <button
                onClick={closeMobile}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {/* Dropdown groups as accordions */}
              {DROPDOWN_GROUPS.map((group) => (
                <MobileAccordion
                  key={group.id}
                  group={group}
                  isOpen={mobileExpanded === group.id}
                  onToggle={() => toggleMobileAccordion(group.id)}
                  onLinkClick={closeMobile}
                />
              ))}

              {/* Direct links */}
              {DIRECT_LINKS.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={closeMobile}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  {link.label}
                  {link.comingSoon && <ComingSoonBadge />}
                </Link>
              ))}
            </div>

            {/* Drawer footer: auth buttons */}
            <div className="shrink-0 px-4 py-4 border-t border-gray-100 space-y-2">
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={closeMobile}
                className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: '#2557a7',
                  boxShadow: '0 2px 8px rgba(37,87,167,0.25)',
                }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
