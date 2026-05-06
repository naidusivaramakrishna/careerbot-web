import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  loading: boolean;
}

const DOMAIN_FAMILY_NAMES: Record<string, string> = {
  'All': 'All Templates',
  'core_engineering': 'Core Engineering',
  'software_engineering': 'Software Engineering',
  'healthcare': 'Healthcare',
  'finance': 'Finance',
  'education': 'Education',
  'cybersecurity': 'Cybersecurity',
  'electronics_and_vlsi': 'Electronics & VLSI',
  'government_standard': 'Government Standard',
  'legal': 'Legal',
  'logistics_warehouse_operations': 'Logistics & Warehouse Operations',
  'marine_merchant_navy': 'Marine & Merchant Navy',
  'modern_minimal_template': 'Modern Minimal',
  'research_scholar': 'Research Scholar',
  'sales_business_development': 'Sales & Business Development'
};

export default function CategorySidebar({
  categories: _categories,
  selectedCategory,
  onSelectCategory,
  loading,
}: CategorySidebarProps) {
  // Get all available domain families from DOMAIN_FAMILY_NAMES
  const domainFamilies = useMemo(() => {
    // Get all domain families except 'All' and sort them
    const families = Object.keys(DOMAIN_FAMILY_NAMES)
      .filter(key => key !== 'All')
      .sort();

    // Return with 'All' at the beginning
    return ['All', ...families];
  }, []);

  if (loading) {
    return (
      <div className="w-48 shrink-0 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-48 shrink-0 sticky top-20">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-1 h-3.5 rounded-full bg-linear-to-b from-teal-500 to-sky-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Industries
            </p>
          </div>
          <div className="space-y-1">
            {domainFamilies.map((family) => {
              const isActive = selectedCategory === family;
              return (
                <button
                  key={family}
                  onClick={() => onSelectCategory(family === 'All' ? 'All' : family)}
                  className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-linear-to-r from-teal-50 to-sky-50 text-teal-800 ring-1 ring-teal-200/70 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-linear-to-b from-teal-500 to-sky-500" />
                  )}
                  {DOMAIN_FAMILY_NAMES[family] || family}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
