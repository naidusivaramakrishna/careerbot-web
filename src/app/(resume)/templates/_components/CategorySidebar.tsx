import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  LayoutGrid,
  HardHat,
  Code2,
  Stethoscope,
  TrendingUp,
  GraduationCap,
  ShieldCheck,
  CircuitBoard,
  Landmark,
  Scale,
  Truck,
  Anchor,
  Layers,
  FlaskConical,
  Handshake,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

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
  'logistics_warehouse_operations': 'Logistics & Warehouse',
  'marine_merchant_navy': 'Marine & Navy',
  'modern_minimal_template': 'Modern Minimal',
  'research_scholar': 'Research Scholar',
  'sales_business_development': 'Sales & Business',
  'general_professional': 'General Professional',
};

const DOMAIN_FAMILY_ICONS: Record<string, LucideIcon> = {
  'All': LayoutGrid,
  'core_engineering': HardHat,
  'software_engineering': Code2,
  'healthcare': Stethoscope,
  'finance': TrendingUp,
  'education': GraduationCap,
  'cybersecurity': ShieldCheck,
  'electronics_and_vlsi': CircuitBoard,
  'government_standard': Landmark,
  'legal': Scale,
  'logistics_warehouse_operations': Truck,
  'marine_merchant_navy': Anchor,
  'modern_minimal_template': Layers,
  'research_scholar': FlaskConical,
  'sales_business_development': Handshake,
  'general_professional': Briefcase,
};

export default function CategorySidebar({
  categories: _categories,
  selectedCategory,
  onSelectCategory,
  loading,
}: CategorySidebarProps) {
  const domainFamilies = useMemo(() => {
    const families = Object.keys(DOMAIN_FAMILY_NAMES)
      .filter(key => key !== 'All')
      .sort();
    return ['All', ...families];
  }, []);

  if (loading) {
    return (
      <div className="w-64 shrink-0 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-1 h-3.5 rounded-full bg-[#2257a7]" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Industries
            </p>
          </div>
          <div className="space-y-1">
            {domainFamilies.map((family) => {
              const isActive = selectedCategory === family;
              const Icon = DOMAIN_FAMILY_ICONS[family] ?? Briefcase;
              return (
                <button
                  key={family}
                  onClick={() => onSelectCategory(family === 'All' ? 'All' : family)}
                  className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive
                    ? 'bg-[#e8eff9] text-[#2257a7] ring-1 ring-[#c9dcf2] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#2257a7]" />
                  )}
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{DOMAIN_FAMILY_NAMES[family] || family}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
