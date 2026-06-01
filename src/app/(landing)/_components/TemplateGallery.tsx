'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Search, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

type TemplateCategory =
  | 'all'
  | 'freshers'
  | 'it'
  | 'finance'
  | 'healthcare'
  | 'sales'
  | 'government'
  | 'executive';

interface Template {
  name: string;
  file: string;
  categories: TemplateCategory[];
  categoryLabel: string;
  bestFor: string;
  description: string;
  atsScore: string;
}

const templates: Template[] = [
  {
    name: 'Modern Minimal',
    file: '/assets/templates/modern_minimal.png',
    categories: ['all', 'freshers'],
    categoryLabel: 'Freshers',
    bestFor: 'Freshers and early-career roles',
    description: 'A clean one-column layout for concise profiles, projects, and education.',
    atsScore: 'High ATS fit',
  },
  {
    name: 'Software Engineering',
    file: '/assets/templates/software_engineering.png',
    categories: ['all', 'it'],
    categoryLabel: 'IT',
    bestFor: 'Developers and product engineers',
    description: 'Highlights technical skills, project impact, and measurable delivery outcomes.',
    atsScore: 'High ATS fit',
  },
  {
    name: 'Finance',
    file: '/assets/templates/finance.png',
    categories: ['all', 'finance', 'executive'],
    categoryLabel: 'Finance',
    bestFor: 'Finance, accounting, and analyst roles',
    description: 'Structured for certifications, reporting work, and business impact metrics.',
    atsScore: 'High ATS fit',
  },
  {
    name: 'Healthcare',
    file: '/assets/templates/healthcare.png',
    categories: ['all', 'healthcare'],
    categoryLabel: 'Healthcare',
    bestFor: 'Nursing, clinical, and hospital roles',
    description: 'Keeps licenses, experience, and patient-care responsibilities easy to scan.',
    atsScore: 'High ATS fit',
  },
  {
    name: 'Education',
    file: '/assets/templates/education.png',
    categories: ['all', 'freshers'],
    categoryLabel: 'Education',
    bestFor: 'Teachers, tutors, and campus hires',
    description: 'Balances education, internships, certifications, and classroom experience.',
    atsScore: 'ATS-friendly',
  },
  {
    name: 'Cybersecurity',
    file: '/assets/templates/cybersecurity.png',
    categories: ['all', 'it'],
    categoryLabel: 'IT',
    bestFor: 'Security analysts and SOC roles',
    description: 'Designed for tools, incidents, compliance keywords, and security projects.',
    atsScore: 'High ATS fit',
  },
  {
    name: 'Sales & Business',
    file: '/assets/templates/sales_business.png',
    categories: ['all', 'sales', 'executive'],
    categoryLabel: 'Sales',
    bestFor: 'Sales, business development, and account roles',
    description: 'Makes revenue, targets, territory ownership, and client wins stand out.',
    atsScore: 'ATS-friendly',
  },
  {
    name: 'Research Scholar',
    file: '/assets/templates/research_scholar.png',
    categories: ['all', 'freshers'],
    categoryLabel: 'Academic',
    bestFor: 'Research, academic, and fellowship profiles',
    description: 'Gives space to publications, projects, labs, and academic achievements.',
    atsScore: 'ATS-friendly',
  },
  {
    name: 'Core Engineering',
    file: '/assets/templates/core-engineering.png',
    categories: ['all', 'it'],
    categoryLabel: 'Engineering',
    bestFor: 'Mechanical, civil, and electrical engineers',
    description: 'Organizes technical skills, site work, tools, and project responsibilities.',
    atsScore: 'High ATS fit',
  },
  {
    name: 'Legal',
    file: '/assets/templates/legal.png',
    categories: ['all', 'executive'],
    categoryLabel: 'Legal',
    bestFor: 'Legal associates and compliance roles',
    description: 'A formal layout for matters handled, documentation, and domain expertise.',
    atsScore: 'ATS-friendly',
  },
  {
    name: 'Logistics',
    file: '/assets/templates/logistics.png',
    categories: ['all', 'sales'],
    categoryLabel: 'Operations',
    bestFor: 'Operations, logistics, and supply chain roles',
    description: 'Built for process ownership, vendor coordination, and efficiency metrics.',
    atsScore: 'ATS-friendly',
  },
  {
    name: 'Government Standard',
    file: '/assets/templates/government_standard.png',
    categories: ['all', 'government', 'executive'],
    categoryLabel: 'Government',
    bestFor: 'Government, PSU, and formal applications',
    description: 'A conservative format for eligibility, experience, and official submissions.',
    atsScore: 'ATS-friendly',
  },
];

const FILTER_OPTIONS: Array<{ id: TemplateCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'freshers', label: 'Freshers' },
  { id: 'it', label: 'IT' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'sales', label: 'Sales' },
  { id: 'government', label: 'Government' },
  { id: 'executive', label: 'Executive' },
];

interface TemplateGalleryProps {
  onOpenSignup?: () => void;
}

function getAuthToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

export default function TemplateGallery({ onOpenSignup }: TemplateGalleryProps) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<TemplateCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const activeFilterLabel =
    FILTER_OPTIONS.find((option) => option.id === activeFilter)?.label ?? 'All';

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesFilter = activeFilter === 'all' || template.categories.includes(activeFilter);
      const searchableText = [
        template.name,
        template.bestFor,
        template.description,
        template.atsScore,
        ...template.categories,
      ]
        .join(' ')
        .toLowerCase();

      return matchesFilter && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [activeFilter, searchTerm]);

  const handleUseTemplate = () => {
    const token = getAuthToken();

    if (!token && onOpenSignup) {
      onOpenSignup();
      return;
    }

    if (token) {
      router.push('/templates');
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const firstCard = carousel.querySelector<HTMLElement>('[data-template-card]');
    const scrollDistance = firstCard ? firstCard.offsetWidth + 20 : 320;

    carousel.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth',
    });
  };

  const renderTemplateCard = (template: Template, priority = false) => (
    <button
      onClick={() => setSelectedTemplate(template)}
      className="group block h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-white bg-white text-left shadow-md shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-[#2557a7] hover:shadow-2xl hover:shadow-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
      type="button"
      data-template-card
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-slate-100 to-white">
        <Image
          src={template.file}
          alt={`${template.name} resume template preview`}
          fill
          className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 86vw, (max-width: 1024px) 42vw, 25vw"
          priority={priority}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2557a7] shadow-md shadow-slate-900/10">
          {template.categoryLabel}
        </span>
        <div className="absolute inset-x-3 bottom-3 flex gap-2">
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#2557a7] shadow-lg shadow-slate-900/10">
            <Eye size={14} />
            Preview
          </span>
          <span className="hidden flex-1 items-center justify-center rounded-lg bg-[#2557a7] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/20 sm:inline-flex">
            Use Template
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-white px-4 py-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-gray-900">{template.name}</h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {template.categoryLabel}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 min-h-[34px] text-xs leading-relaxed text-gray-500">
            {template.bestFor}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
            {template.atsScore}
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            PDF
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
            DOCX
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <section
      id="template-gallery"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f7ff_100%)] py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="mx-auto mb-10 max-w-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
            Resume Templates
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
            Choose an ATS-friendly resume template
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500">
            Browse role-ready templates for Indian job seekers, preview the layout, then start
            editing when you find the right fit. Free plan available.
          </p>
        </motion.div>

        <motion.div
          className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
        >
          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(280px,420px)_1fr] xl:items-center">
            <label className="relative block w-full">
              <span className="sr-only">Search resume templates by role or template name</span>
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by role or template name"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2557a7] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto scroll-smooth pb-1 xl:justify-end xl:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition-all ${
                    activeFilter === option.id
                      ? 'bg-[#2557a7] text-white shadow-md shadow-blue-200'
                      : 'border border-slate-200 bg-white text-gray-700 hover:border-blue-100 hover:bg-blue-50 hover:text-[#2557a7]'
                  }`}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {templates.length} featured previews shown
              {activeFilter !== 'all' ? ` for ${activeFilterLabel} roles` : ''}
            </span>
            <span className="font-semibold text-slate-700">
              Showing {filteredTemplates.length} {activeFilterLabel} preview
              {filteredTemplates.length === 1 ? '' : 's'}
            </span>
          </div>
        </motion.div>

        {filteredTemplates.length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white/75 p-4 shadow-sm shadow-slate-200/70">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#2557a7]">
                  Resume templates
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
                  Browse templates one by one
                </h3>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-[#2557a7] hover:bg-blue-50 hover:text-[#2557a7] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  aria-label="Previous templates"
                  type="button"
                >
                  <ChevronLeft size={19} />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2557a7] text-white shadow-md shadow-blue-200 transition-all hover:bg-[#1e4a94] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  aria-label="Next templates"
                  type="button"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="-mx-4 flex snap-x gap-5 overflow-x-auto scroll-smooth px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {filteredTemplates.map((template, index) => (
                <motion.article
                  key={template.name}
                  className="min-w-[82%] snap-start sm:min-w-[45%] lg:min-w-[calc(25%_-_15px)]"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.03 }}
                >
                  {renderTemplateCard(template, index === 0)}
                </motion.article>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            className="rounded-2xl border border-dashed border-blue-200 bg-white/80 px-6 py-12 text-center shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2557a7]">
                  <Search size={21} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No templates found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Try a broader role, remove the search term, or switch back to all featured previews.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
              className="mt-5 rounded-xl bg-[#2557a7] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-[#1e4a94]"
              type="button"
            >
              Reset filters
            </button>
          </motion.div>
        )}

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
        >
          <button
            onClick={handleUseTemplate}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2557a7 0%, #0f766e 100%)' }}
            type="button"
          >
            Browse Full Template Library
            <ArrowRight size={15} />
          </button>
        </motion.div>
      </div>

      {selectedTemplate && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-preview-title"
          onClick={() => setSelectedTemplate(null)}
        >
          <motion.div
            className="relative grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20 md:grid-cols-[0.92fr_1fr]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTemplate(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close template preview"
              type="button"
            >
              <X size={18} />
            </button>

            <div className="max-h-[90vh] overflow-hidden bg-slate-100 p-5">
              <div className="relative mx-auto aspect-[3/4] h-full max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <Image
                  src={selectedTemplate.file}
                  alt={`${selectedTemplate.name} resume template large preview`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 90vw, 420px"
                  priority
                />
              </div>
            </div>

            <div className="flex max-h-[90vh] flex-col overflow-y-auto p-6 md:p-8">
              <div className="mb-5 flex flex-wrap gap-2">
                {selectedTemplate.categories
                  .filter((category) => category !== 'all')
                  .map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-[#2557a7]"
                    >
                      {category}
                    </span>
                  ))}
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {selectedTemplate.atsScore}
                </span>
              </div>

              <h3 id="template-preview-title" className="text-2xl font-bold text-slate-950 md:text-3xl">
                {selectedTemplate.name}
              </h3>
              <p className="mt-3 text-base font-semibold text-[#2557a7]">
                Best for: {selectedTemplate.bestFor}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {selectedTemplate.description} Preview the structure first, then start editing with
                your own resume details when you are ready.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {['ATS-friendly layout', 'PDF format', 'DOCX format'].map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <Sparkles size={16} className="text-[#2557a7]" />
                    <p className="mt-2 text-xs font-bold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-bold text-slate-900">Free plan available</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Create an account to use this template in CareerBot and continue customizing your
                  resume.
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleUseTemplate}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-[#1e4a94]"
                  type="button"
                >
                  Use this template
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-[#2557a7] hover:bg-blue-50 hover:text-[#2557a7]"
                  type="button"
                >
                  Keep browsing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
