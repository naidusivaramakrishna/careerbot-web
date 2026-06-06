"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, LayoutTemplate, Sparkles } from 'lucide-react';
import { getTemplatesByCategory, getTemplateCategories, type TemplateResponse } from '@/api/resumeApi';
import logger from '@/lib/logger';
import CategorySidebar from './_components/CategorySidebar';
import DomainTemplatesModal from './_components/DomainTemplatesModal';
import DomainCard from './_components/DomainCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { STYLE_CATALOGUES } from '@/app/(resume)/builder/creation/_utils/templateStyles';
import CatalogueThumbnail, { CATALOGUE_PALETTES, CODE_THUMBNAIL_CATALOGUES } from '@/app/browse-templates/_components/CatalogueThumbnail';

const DOMAIN_NAMES: Record<string, string> = {
  core_engineering: 'Core Engineering',
  software_engineering: 'Software Engineering',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  cybersecurity: 'Cybersecurity',
  electronics_and_vlsi: 'Electronics & VLSI',
  government_standard: 'Government Standard',
  legal: 'Legal',
  logistics_warehouse_operations: 'Logistics & Warehouse Operations',
  marine_merchant_navy: 'Marine & Merchant Navy',
  modern_minimal_template: 'Modern Minimal',
  research_scholar: 'Research Scholar',
  sales_business_development: 'Sales & Business Development',
  general_professional: 'General Professional'
};

const DOMAIN_FAMILY_IMAGES: Record<string, string> = {
  core_engineering: '/assets/templates/core-engineering.png',
  software_engineering: '/assets/templates/software_engineering.png',
  healthcare: '/assets/templates/healthcare.png',
  finance: '/assets/templates/finance.png',
  education: '/assets/templates/education.png',
  cybersecurity: '/assets/templates/cybersecurity.png',
  electronics_and_vlsi: '/assets/templates/electronics_vlsi.png',
  government_standard: '/assets/templates/government_standard.png',
  legal: '/assets/templates/legal.png',
  logistics_warehouse_operations: '/assets/templates/logistics.png',
  marine_merchant_navy: '/assets/templates/marine_merchant.png',
  modern_minimal_template: '/assets/templates/modern_minimal.png',
  research_scholar: '/assets/templates/research_scholar.png',
  sales_business_development: '/assets/templates/sales_business.png',
  general_professional: '/assets/templates/software_engineering.png',
};

const DEFAULT_TEMPLATE_IMAGE = '/assets/templates/template-1.png';

const TRUST_BADGES = ['100% ATS Friendly', '14+ Industries', '100+ Templates'];

const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  // Engineering domains
  aerospace_engineering: 'Aerospace Engineer',
  automotive_engineering: 'Automotive Engineer',
  chemical_engineering: 'Chemical Engineer',
  civil_engineering: 'Civil Engineer',
  construction_engineering: 'Construction Engineer',
  devops_engineering: 'DevOps Engineer',
  embedded_systems: 'Embedded Systems Engineer',
  marine_engineering: 'Marine Engineer',
  mechanical_engineering: 'Mechanical Engineer',
  naval_architecture: 'Naval Architect',
  semiconductor: 'Semiconductor Engineer',
  vlsi_design: 'VLSI Design Engineer',
  robotics: 'Robotics Engineer',
  plc_scada: 'PLC/SCADA Engineer',

  // Education domains
  professor: 'Professor',
  associate_professor: 'Associate Professor',
  assistant_professor: 'Assistant Professor',
  senior_lecturer: 'Senior Lecturer',
  lecturer: 'Lecturer',
  senior_teacher: 'Senior Teacher',
  principal_teacher: 'Principal Teacher',
  teacher: 'Teacher',
  visiting_faculty: 'Visiting Faculty',
  academic_dean: 'Academic Dean',
  academic_researcher: 'Academic Researcher',
  education_director: 'Education Director',
  education_coordinator: 'Education Coordinator',
  department_head: 'Department Head',

  // Healthcare domains
  doctor_physician: 'Doctor/Physician',
  surgeon: 'Surgeon',
  clinical_nurse: 'Clinical Nurse',
  pharmacist: 'Pharmacist',
  physiotherapist: 'Physiotherapist',
  radiologist: 'Radiologist',
  medical_lab_scientist: 'Medical Lab Scientist',
  healthcare_administrator: 'Healthcare Administrator',
  clinical_trials: 'Clinical Trials Specialist',
  life_sciences: 'Life Sciences Professional',

  // IT & Technology domains
  software_engineering: 'Software Engineer',
  data_science: 'Data Scientist',
  cloud_computing: 'Cloud Computing Specialist',
  cybersecurity: 'Cybersecurity Specialist',
  application_security: 'Application Security Engineer',
  security_engineers: 'Security Engineer',
  incident_response: 'Incident Response Specialist',
  penetration_testers: 'Penetration Tester',
  soc_analysts: 'SOC Analyst',
  digital_forensics: 'Digital Forensics Specialist',
  information_technology: 'IT Professional',
  computer_science_engineering: 'Computer Science Engineer',
  computer_applications: 'Computer Applications Specialist',
  iot: 'IOT Engineer',
  ux_ui_design: 'UX/UI Designer',
  web_development: 'Web Development',
  full_stack_development: "Full Stack Developer",
  mobile_development: "Mobile Developer",
  cloud_engineering: 'Cloud Engineer',
  devops: 'DevOps Engineer',
  machine_learning: 'Machine Learning',

  // Finance domains
  accounting: 'Accountant',
  financial_planning: 'Financial Planner',
  financial_analysis: 'Financial Analyst',
  investment_banking: 'Investment Banker',
  corporate_finance: 'Corporate Finance Professional',
  banking: 'Banking Professional',
  audit: 'Audit Professional',
  risk_management: 'Risk Manager',
  mba_general_management: 'MBA General Management',

  // Legal domains
  ip_attorneys: 'IP Attorney',
  law_firms: 'Lawyer/Law Firm Professional',
  legal_operations: 'Legal Operations Specialist',
  paralegals: 'Paralegal',

  // HR & Business domains
  hr: 'HR Professional',
  account_management: 'Account Manager',
  sales: 'Sales Professional',
  marketing: 'Marketing Professional',
  business_development: 'Business Development Executive',
  product_management: 'Product Manager',
  growth: 'Growth Specialist',
  startups: 'Startup Professional',

  // Operations & Logistics domains
  operations: 'Operations Manager',
  procurement: 'Procurement Specialist',
  scm: 'Supply Chain Manager',
  demand_planning: 'Demand Planner',
  inventory_management: 'Inventory Manager',
  distribution: 'Distribution Manager',
  freight: 'Freight Specialist',
  shipping: 'Shipping Specialist',
  warehousing: 'Warehouse Manager',
  port_operations: 'Port Operations Specialist',

  // Government & Defense domains
  civil_services: 'Civil Services Officer',
  defense: 'Defense Professional',
  drdo: 'DRDO Scientist',
  isro: 'ISRO Scientist',
  psu: 'PSU Professional',
  ias: 'IAS Officer',
  railways: 'Railways Professional',
  ciso: 'CISO',
  compliance_officers: 'Compliance Officer',
  grc: 'GRC Specialist',

  // Merchant Navy & Shipping
  merchant_navy: 'Merchant Navy Officer',
  offshore: 'Offshore Professional',

  // Other domains
  biotech: 'Biotech Professional',
  pharma: 'Pharmaceutical Professional',
  hospitality_management: 'Hospitality Manager',
  insurance: 'Insurance Professional',
  regulatory_affairs: 'Regulatory Affairs Specialist',
  'R&D': 'R&D Professional',
  management_consulting: 'Management Consultant',
  design: 'Designer',
  automation: 'Automation Specialist',
};

interface DomainModal {
  domainFamily: string;
  domainKey: string;
  domainName: string;
}

export default function TemplatesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainModal, setSelectedDomainModal] = useState<DomainModal | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCatalogue, setSelectedCatalogue] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('selected_catalogue') || 'galaxy' : 'galaxy')
  );
  // Per-catalogue section-header background / accent colour (only meaningful for code-thumbnail catalogues).
  const [hoverBg, setHoverBg] = useState<Record<string, string | undefined>>({});
  const [selectedBg, setSelectedBg] = useState<Record<string, string | undefined>>(() => {
    if (typeof window === 'undefined') return {};
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(CATALOGUE_PALETTES)) {
      const saved = localStorage.getItem(`selected_color_${key}`);
      if (saved) result[key] = saved;
    }
    // Backward compat with previous single-key persistence (was Eclipse-only).
    const legacy = localStorage.getItem('selected_section_bg');
    if (legacy && !result.eclipse) result.eclipse = legacy;
    return result;
  });

  const persistColorForBuilder = (catalogueKey: string, color: string | undefined) => {
    // Eclipse's chosen colour drives `selected_section_bg` (the builder reads it for the
    // classic-formal section-header background). Other catalogues persist per-key only.
    if (catalogueKey === 'eclipse') {
      if (color) localStorage.setItem('selected_section_bg', color);
      else localStorage.removeItem('selected_section_bg');
    }
  };

  const handleCatalogueSelect = (key: string) => {
    setSelectedCatalogue(key);
    localStorage.setItem('selected_catalogue', key);
    persistColorForBuilder(key, selectedBg[key]);
  };

  const handleColorPick = (catalogueKey: string, color: string) => {
    setSelectedCatalogue(catalogueKey);
    setSelectedBg(prev => ({ ...prev, [catalogueKey]: color }));
    localStorage.setItem('selected_catalogue', catalogueKey);
    localStorage.setItem(`selected_color_${catalogueKey}`, color);
    persistColorForBuilder(catalogueKey, color);
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const cats = await getTemplateCategories();
        setCategories(cats);
        logger.debug('Templates: categories fetched', { count: cats.length });
      } catch (err) {
        logger.error('Templates: failed to fetch categories', err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        // Fetch all templates (no category filter to API)
        const tmps = await getTemplatesByCategory();
        setTemplates(tmps);
        logger.debug('Templates: fetched all templates', { count: tmps.length });
      } catch (err) {
        logger.error('Templates: failed to fetch templates', err);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Group templates by domain family and domain
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, Record<string, TemplateResponse[]>> = {};

    templates.forEach((template) => {
      const family = ((template as unknown) as Record<string, unknown>).domain_family as string || 'other';
      const applicableDomains = ((template as unknown) as Record<string, unknown>).applicable_domains as string[] || [];

      if (!groups[family]) {
        groups[family] = {};
      }

      // Add template to each applicable domain
      if (applicableDomains.length > 0) {
        applicableDomains.forEach((domain) => {
          if (!groups[family][domain]) {
            groups[family][domain] = [];
          }
          groups[family][domain].push(template);
        });
      } else {
        if (!groups[family]['general']) {
          groups[family]['general'] = [];
        }
        groups[family]['general'].push(template);
      }
    });

    return groups;
  }, [templates]);

  // Filter templates by category (domain family) and search query
  const filteredTemplates = templates.filter((template) => {
    // Filter by domain family if not "All"
    if (selectedCategory !== 'All') {
      const family = ((template as unknown) as Record<string, unknown>).domain_family as string || 'other';
      if (family !== selectedCategory) {
        return false;
      }
    }

    // Filter by search query
    const query = searchQuery.toLowerCase();
    if (!query) return true; // If no search query, show all (already filtered by category)

    const name = (template.name || '').toLowerCase();
    const subtitle = (template.subtitle || '').toLowerCase();
    const description = (template.description || '').toLowerCase();

    // Check if template matches by name, subtitle, or description
    const matchesBasicInfo =
      name.includes(query) ||
      subtitle.includes(query) ||
      description.includes(query);

    // Also search by domain names (e.g., "Civil Engineering", "Mechanical Engineering")
    const applicableDomains = ((template as unknown) as Record<string, unknown>).applicable_domains as string[] || [];
    const matchesDomain = applicableDomains.some(domain => {
      const displayName = (DOMAIN_DISPLAY_NAMES[domain] || domain).toLowerCase();
      return displayName.includes(query);
    });

    return matchesBasicInfo || matchesDomain;
  });

  // Group filtered templates by domain
  const filteredGroupedTemplates = useMemo(() => {
    const groups: Record<string, Record<string, TemplateResponse[]>> = {};
    const query = searchQuery.toLowerCase();

    // Check if search query matches a family name (e.g., "Core Engineering")
    const matchingFamilyKey = Object.entries(DOMAIN_NAMES).find(
      ([, familyName]) => familyName.toLowerCase().includes(query)
    )?.[0];

    filteredTemplates.forEach((template) => {
      const family = ((template as unknown) as Record<string, unknown>).domain_family as string || 'other';
      const applicableDomains = ((template as unknown) as Record<string, unknown>).applicable_domains as string[] || [];

      if (!groups[family]) {
        groups[family] = {};
      }

      if (applicableDomains.length > 0) {
        applicableDomains.forEach((domain) => {
          const displayName = (DOMAIN_DISPLAY_NAMES[domain] || domain).toLowerCase();

          // If no search query, show all domains
          if (!query) {
            if (!groups[family][domain]) {
              groups[family][domain] = [];
            }
            groups[family][domain].push(template);
          }
          // If search matches family name, show all domains in that family
          else if (matchingFamilyKey && family === matchingFamilyKey) {
            if (!groups[family][domain]) {
              groups[family][domain] = [];
            }
            groups[family][domain].push(template);
          }
          // If search matches domain name, only show that domain
          else if (displayName.includes(query)) {
            if (!groups[family][domain]) {
              groups[family][domain] = [];
            }
            groups[family][domain].push(template);
          }
        });
      } else {
        if (!groups[family]['general']) {
          groups[family]['general'] = [];
        }
        groups[family]['general'].push(template);
      }
    });

    return groups;
  }, [filteredTemplates, searchQuery]);

  const openDomainModal = (family: string, domain: string) => {
    setSelectedDomainModal({
      domainFamily: family,
      domainKey: domain,
      domainName: DOMAIN_DISPLAY_NAMES[domain] || domain,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-10 pb-16 px-6">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-teal-50/60" />
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-gradient-to-bl from-blue-100/70 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-teal-100/60 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-50/60 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-[#2257a7] mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            ATS-Optimized · Professional · 100+ Templates
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-[1.08]">
            <span className="text-gray-900">Find your </span>
            <span className="bg-linear-to-r from-[#2257a7] via-[#1a6abf] to-[#0d9488] bg-clip-text text-transparent">
              perfect resume style
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl leading-relaxed mb-7">
            Beautiful templates for every industry and career level. Pick a colour theme, select your domain, and build in minutes.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            {TRUST_BADGES.map(badge => (
              <div key={badge} className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Catalogue style picker ─────────────────────────────── */}
      <div className="px-6 py-14 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2257a7] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-3">
                <span className="w-1.5 h-1.5 bg-[#2257a7] rounded-full animate-pulse" />
                Step 1 of 2
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Choose a Style</h2>
              <p className="text-slate-500 mt-1.5 text-sm max-w-md leading-relaxed">
                Pick a colour theme — it will apply automatically when you open the builder.
              </p>
            </div>
            {selectedCatalogue && STYLE_CATALOGUES[selectedCatalogue] && (
              <div className="hidden md:flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-sm font-semibold text-[#2257a7] shadow-sm">
                <span>{STYLE_CATALOGUES[selectedCatalogue].label}</span>
                <span className="text-blue-300">selected</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {Object.entries(STYLE_CATALOGUES).map(([key, catalogue]) => {
              const isSelected = selectedCatalogue === key;
              const hasCodeThumbnail = CODE_THUMBNAIL_CATALOGUES.has(key);
              const paletteInfo = CATALOGUE_PALETTES[key];
              const colorForThumbnail = hoverBg[key] ?? selectedBg[key] ?? paletteInfo?.defaultColor;
              const primarySwatch = catalogue.swatches[0];

              return (
                <div key={key} className="group flex flex-col">
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                    style={{
                      boxShadow: isSelected
                        ? `0 0 0 2.5px ${primarySwatch}, 0 16px 48px ${primarySwatch}30`
                        : '0 1px 6px rgba(0,0,0,0.07)',
                      transform: isSelected ? 'translateY(-3px)' : undefined,
                    }}
                    onClick={() => handleCatalogueSelect(key)}
                  >
                    <div className="relative w-full bg-slate-50 p-3 group-hover:bg-slate-100/80 transition-colors duration-200">
                      <div
                        className="relative w-full bg-white rounded-xl shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]"
                        style={{ aspectRatio: '3/4' }}
                      >
                        <CatalogueThumbnail catalogueKey={key} fallbackImage={DEFAULT_TEMPLATE_IMAGE} customColor={colorForThumbnail} />
                      </div>

                      {isSelected && (
                        <div
                          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                          style={{ backgroundColor: primarySwatch }}
                        >
                          ✓
                        </div>
                      )}

                      <div className="absolute inset-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3 pointer-events-none">
                        <div
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                          style={{ backgroundColor: isSelected ? primarySwatch : '#1e293b' }}
                        >
                          {isSelected ? '✓ Selected' : 'Select Style'}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                      {hasCodeThumbnail && paletteInfo ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {paletteInfo.palette.slice(0, 5).map(color => {
                            const isSel = selectedBg[key] === color || (!selectedBg[key] && color === paletteInfo.defaultColor);
                            return (
                              <button
                                key={color}
                                aria-label={`Select colour ${color}`}
                                onMouseEnter={() => setHoverBg(prev => ({ ...prev, [key]: color }))}
                                onMouseLeave={() => setHoverBg(prev => ({ ...prev, [key]: undefined }))}
                                onClick={e => { e.stopPropagation(); handleColorPick(key, color); }}
                                className={`w-4 h-4 rounded-full cursor-pointer transition-all duration-150 ${
                                  isSel
                                    ? 'ring-2 ring-[#2257a7] ring-offset-1 scale-110'
                                    : 'ring-1 ring-slate-200 hover:scale-110 hover:ring-slate-400'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Monochrome</span>
                      )}
                      <div className="flex gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">PDF</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">DOCX</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 px-0.5">
                    <p className={`text-xl font-bold tracking-tight transition-colors duration-200 ${isSelected ? 'text-[#2257a7]' : 'text-slate-900 group-hover:text-slate-700'}`}>
                      {catalogue.label}
                    </p>
                    <p className="text-xs text-[#2e404a] mt-1 leading-relaxed line-clamp-2">{catalogue.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search + Content unified rail ─────────────────────── */}
      <div className="max-w-7xl mx-auto px-6">

      {/* Search */}
      <div className="py-8 bg-linear-to-b from-white to-[#f8fafc] border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2257a7] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 bg-[#2257a7] rounded-full animate-pulse" />
              Step 2 of 2
            </div>
            <span className="text-sm font-semibold text-slate-700">Select your industry &amp; career level</span>
          </div>

          <div className="relative group max-w-2xl">
            <div className="absolute inset-0 bg-linear-to-r from-blue-400/15 to-teal-400/15 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-lg -m-1" />
            <div className="relative flex items-center bg-white rounded-xl shadow-sm ring-1 ring-slate-200 group-focus-within:ring-[#2257a7]/50 group-focus-within:shadow-md transition-all duration-200">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#2257a7] transition-colors" />
              <input
                type="text"
                placeholder="Search by role, industry, or template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-3 bg-transparent border-0 focus:outline-none text-slate-900 placeholder-slate-400 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label="Clear search"
                >
                  <span className="text-xs font-bold leading-none">✕</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-slate-400 font-medium mt-1">Try:</span>
            {['Software Engineer', 'Healthcare', 'Finance', 'Legal', 'Education'].map(q => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-[#2257a7] hover:text-[#2257a7] transition-colors font-medium shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────── */}
      <div className="flex gap-6 py-8">
        <div className="shrink-0">
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            loading={categoriesLoading}
          />
        </div>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-8">
              {[...Array(2)].map((_, familyIdx) => (
                <div key={familyIdx}>
                  <Skeleton className="h-7 w-48 mb-4 rounded-lg" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <Skeleton className="w-full h-56 rounded-none" />
                        <div className="p-5 space-y-3">
                          <Skeleton className="h-4 w-3/4 rounded" />
                          <Skeleton className="h-3 w-1/2 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-50 to-indigo-100 ring-1 ring-blue-200/60 flex items-center justify-center mb-3">
                <LayoutTemplate className="w-8 h-8 text-[#2257a7]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-1">No templates found</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Try adjusting your search or filters. We have over 100 templates across all industries.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(filteredGroupedTemplates).filter(([family]) => family !== 'other').map(([family, domains], idx) => (
                <div key={family} className="scroll-mt-20">
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block w-1 h-6 rounded-full bg-[#2257a7]" />
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {DOMAIN_NAMES[family] || family}
                      </h2>
                      <span className="px-2.5 py-0.5 bg-[#c9dcf2] text-[#2257a7] text-xs font-semibold rounded-full ring-1 ring-[#a5c6eb]">
                        {Object.keys(domains).length} templates
                      </span>
                    </div>
                    {idx > 0 && <div className="h-px bg-linear-to-r from-slate-200 via-slate-100 to-transparent mt-4 -mb-4" />}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(domains).map(([domain, domainTemplates]) => (
                      <DomainCard
                        key={domain}
                        domainName={DOMAIN_DISPLAY_NAMES[domain] || domain}
                        templateCount={domainTemplates.length}
                        previewImage={DOMAIN_FAMILY_IMAGES[family] || domainTemplates[0]?.preview_url || DEFAULT_TEMPLATE_IMAGE}
                        onClick={() => openDomainModal(family, domain)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>{/* end unified rail */}

      {selectedDomainModal && (
        <DomainTemplatesModal
          domainName={selectedDomainModal.domainName}
          domainFamily={selectedDomainModal.domainFamily}
          templates={groupedTemplates[selectedDomainModal.domainFamily]?.[selectedDomainModal.domainKey] || []}
          onClose={() => setSelectedDomainModal(null)}
        />
      )}
    </div>
  );
}
