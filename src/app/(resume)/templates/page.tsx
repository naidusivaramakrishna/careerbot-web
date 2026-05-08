"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, LayoutTemplate } from 'lucide-react';
import { getTemplatesByCategory, getTemplateCategories, type TemplateResponse } from '@/api/resumeApi';
import logger from '@/lib/logger';
import CategorySidebar from './_components/CategorySidebar';
import DomainTemplatesModal from './_components/DomainTemplatesModal';
import DomainCard from './_components/DomainCard';
import { Skeleton } from '@/components/ui/Skeleton';

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
  sales_business_development: 'Sales & Business Development'
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
};

const DEFAULT_TEMPLATE_IMAGE = '/assets/templates/template-1.png';

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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-sky-50/40 to-indigo-50/30">
      {/* Hero Section */}
      <div className="relative px-6 pt-10 pb-8 bg-white/60 backdrop-blur-sm border-b border-slate-200/70">
        <div className="absolute inset-0 bg-linear-to-br from-teal-50/30 via-transparent to-indigo-50/30 pointer-events-none" />
        <div className="max-w-6xl relative">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-linear-to-br from-teal-50 to-sky-100 ring-1 ring-sky-200/60 shadow-sm shrink-0">
              <LayoutTemplate className="w-6 h-6 text-teal-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-slate-900 via-slate-800 to-teal-700 bg-clip-text text-transparent mb-2">
                Resume Templates
              </h1>
              <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                Discover beautifully designed, ATS-optimized resume templates for every industry and career level. Your perfect resume is just a click away.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-6 max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-r from-teal-200/70 to-sky-200/70 rounded-xl opacity-0 group-focus-within:opacity-60 transition-opacity duration-300 blur-lg" />
              <div className="relative flex items-center bg-white rounded-xl shadow-sm ring-1 ring-slate-200 group-focus-within:ring-teal-400/60 transition-shadow">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by role, industry, or template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-0 rounded-xl focus:outline-none text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3 text-xs text-slate-500">
              <span>💡 Try:</span>
              <span className="font-medium text-teal-700">Software Engineer</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-teal-700">Healthcare</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-teal-700">Finance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex gap-6 px-6 py-8">
        {/* Sidebar */}
        <div className="">
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            loading={categoriesLoading}
          />
        </div>

        {/* Template Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-8">
              {[...Array(2)].map((_, familyIdx) => (
                <div key={familyIdx}>
                  <Skeleton className="h-7 w-48 mb-4 rounded-lg" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-teal-50 to-sky-100 ring-1 ring-sky-200/60 flex items-center justify-center mb-3">
                <LayoutTemplate className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-1">No templates found</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Try adjusting your search or filters. We have over 100 templates across all industries.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(filteredGroupedTemplates).map(([family, domains], idx) => (
                <div key={family} className="scroll-mt-20">
                  {/* Domain Family Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block w-1 h-6 rounded-full bg-linear-to-b from-teal-500 to-sky-500" />
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {DOMAIN_NAMES[family] || family}
                      </h2>
                      <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full ring-1 ring-teal-200/70">
                        {Object.values(domains).reduce((sum, tmps) => sum + tmps.length, 0)} templates
                      </span>
                    </div>
                    {idx > 0 && <div className="h-px bg-linear-to-r from-slate-200 via-slate-100 to-transparent mt-4 -mb-4" />}
                  </div>

                  {/* Domain Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Domain Templates Modal */}
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
