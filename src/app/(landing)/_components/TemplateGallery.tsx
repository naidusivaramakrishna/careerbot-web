'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const templates = [
  { name: 'Modern Minimal',       file: '/assets/templates/modern_minimal.png',       categories: ['all'] },
  { name: 'Software Engineering', file: '/assets/templates/software_engineering.png',  categories: ['all', 'it'] },
  { name: 'Finance',              file: '/assets/templates/finance.png',               categories: ['all', 'finance'] },
  { name: 'Healthcare',           file: '/assets/templates/healthcare.png',            categories: ['all', 'healthcare'] },
  { name: 'Education',            file: '/assets/templates/education.png',             categories: ['all', 'freshers'] },
  { name: 'Cybersecurity',        file: '/assets/templates/cybersecurity.png',         categories: ['all', 'it'] },
  { name: 'Sales & Business',     file: '/assets/templates/sales_business.png',        categories: ['all'] },
  { name: 'Research Scholar',     file: '/assets/templates/research_scholar.png',      categories: ['all', 'freshers'] },
  { name: 'Core Engineering',     file: '/assets/templates/core-engineering.png',      categories: ['all', 'it'] },
  { name: 'Legal',                file: '/assets/templates/legal.png',                 categories: ['all'] },
  { name: 'Logistics',            file: '/assets/templates/logistics.png',             categories: ['all'] },
  { name: 'Government Standard',  file: '/assets/templates/government_standard.png',   categories: ['all', 'government', 'executive'] },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'freshers', label: 'Freshers' },
  { id: 'it', label: 'IT' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'government', label: 'Government' },
  { id: 'executive', label: 'Executive' },
];

interface TemplateGalleryProps {
  onOpenSignup?: () => void;
}

export default function TemplateGallery({ onOpenSignup }: TemplateGalleryProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTemplates = templates.filter(
    (tpl) => activeFilter === 'all' || tpl.categories.includes(activeFilter)
  );

  const handleTemplateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Check if user is authenticated by checking if auth token exists
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (!token && onOpenSignup) {
      // User not logged in - open signup modal
      onOpenSignup();
    } else if (token) {
      // User logged in - go to templates
      router.push('/templates');
    }
  };

  const handleBrowseClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (!token && onOpenSignup) {
      onOpenSignup();
    } else if (token) {
      router.push('/templates');
    }
  };

  return (
    <section id="template-gallery" className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f7ff_100%)] py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
            Resume Templates
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl md:text-4xl font-bold text-transparent tracking-tight">
            Choose an ATS-friendly resume template
          </h2>
          <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Start with templates designed for Indian job roles, then customize and export in minutes.
          </p>
        </motion.div>

        {/* Filter chips */}
        <motion.div
          className="mx-auto mb-10 flex w-fit max-w-full flex-wrap justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm shadow-slate-200/70"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === option.id
                  ? 'bg-[#2557a7] text-white shadow-md shadow-blue-200'
                  : 'border border-transparent bg-transparent text-gray-700 hover:border-blue-100 hover:bg-blue-50 hover:text-[#2557a7]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </motion.div>

        {/* Template grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((tpl, i) => (
            <motion.div
              key={tpl.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.04 }}
            >
              <Link
                href="/templates"
                onClick={handleTemplateClick}
                className="group block cursor-pointer overflow-hidden rounded-2xl border border-white bg-white shadow-md shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-[#2557a7] hover:shadow-2xl hover:shadow-blue-100"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-slate-100 to-white">
                  <Image
                    src={tpl.file}
                    alt={tpl.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[#2557a7]/25 via-[#2557a7]/0 to-transparent p-3 opacity-100 transition-colors duration-200 sm:items-center sm:bg-[#2557a7]/0 sm:opacity-0 sm:group-hover:bg-[#2557a7]/10 sm:group-hover:opacity-100">
                    <span className="rounded-lg bg-[#2557a7] px-3 py-1.5 text-xs font-semibold text-white shadow">
                      Use Template
                    </span>
                  </div>
                </div>

                {/* Label and badges */}
                <div className="space-y-1.5 border-t border-slate-100 bg-white px-3 py-3">
                  <p className="text-xs font-medium text-gray-700 truncate">{tpl.name}</p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">ATS-friendly</span>
                    <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">PDF</span>
                    <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">DOCX</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
        >
          <Link
            href="/templates"
            onClick={handleBrowseClick}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2557a7 0%, #0f766e 100%)' }}
          >
            Browse All Templates
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
