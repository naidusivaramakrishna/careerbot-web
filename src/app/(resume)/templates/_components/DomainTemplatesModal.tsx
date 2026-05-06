"use client";

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { type TemplateResponse, getAllResumes, createResumeWithAuth } from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import { Button } from '@/components/common';
import logger from '@/lib/logger';
import { getSectionOrder } from '../_utils/sectionOrder';

interface DomainTemplatesModalProps {
  domainName: string;
  domainFamily: string;
  templates: TemplateResponse[];
  onClose: () => void;
}

const CAREER_LEVELS = ['Fresher', 'Early Career', 'Mid-Level', 'Senior-Level', 'Manager'];

const FALLBACK_IMAGE = '/assets/templates/template-1.jpg';

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

// Map domain names to domain_family codes (handles both lowercase and title case)
const DOMAIN_NAME_MAP: Record<string, string> = {
  'healthcare': 'healthcare',
  'Healthcare': 'healthcare',
  'education': 'education',
  'Education': 'education',
  'software_engineering': 'software_engineering',
  'Software Engineering': 'software_engineering',
  'core_engineering': 'core_engineering',
  'Core Engineering': 'core_engineering',
  'finance': 'finance',
  'Finance': 'finance',
  'cybersecurity': 'cybersecurity',
  'Cybersecurity': 'cybersecurity',
  'electronics_and_vlsi': 'electronics_and_vlsi',
  'Electronics & VLSI': 'electronics_and_vlsi',
  'government_standard': 'government_standard',
  'Government Standard': 'government_standard',
  'legal': 'legal',
  'Legal': 'legal',
  'logistics_warehouse_operations': 'logistics_warehouse_operations',
  'Logistics & Warehouse Operations': 'logistics_warehouse_operations',
  'marine_merchant_navy': 'marine_merchant_navy',
  'Marine & Merchant Navy': 'marine_merchant_navy',
  'modern_minimal_template': 'modern_minimal_template',
  'Modern Minimal': 'modern_minimal_template',
  'research_scholar': 'research_scholar',
  'Research Scholar': 'research_scholar',
  'sales_business_development': 'sales_business_development',
  'Sales & Business Development': 'sales_business_development',
};

export default function DomainTemplatesModal({
  domainName,
  domainFamily,
  templates,
  onClose,
}: DomainTemplatesModalProps) {
  const router = useRouter();
  const [familyImage, setFamilyImage] = useState(
    DOMAIN_FAMILY_IMAGES[domainFamily] || FALLBACK_IMAGE
  );

  // Sort templates by career level
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();

      const aLevelIndex = CAREER_LEVELS.findIndex((level) =>
        aName.includes(level.toLowerCase())
      );
      const bLevelIndex = CAREER_LEVELS.findIndex((level) =>
        bName.includes(level.toLowerCase())
      );

      if (aLevelIndex === -1) return 1;
      if (bLevelIndex === -1) return -1;
      return aLevelIndex - bLevelIndex;
    });
  }, [templates]);

  // Default to first template
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const selectedTemplate = sortedTemplates[selectedTemplateIndex];

  const getCareerLevel = (templateName: string) => {
    return (
      CAREER_LEVELS.find((level) =>
        templateName.toLowerCase().includes(level.toLowerCase())
      ) || 'Custom'
    );
  };

  const handleSelectTemplate = (index: number) => {
    setSelectedTemplateIndex(index);
  };

  const handleApplyTemplate = async () => {
    setIsLoading(true);
    try {
      // Parallelize getProfile and getAllResumes for better performance
      const [userProfile, resumes] = await Promise.all([
        getProfile().catch(() => null),
        getAllResumes().catch(() => null),
      ]);

      let userEmail = '';
      if (userProfile?.email) {
        userEmail = userProfile.email;
        logger.info('User email for scoped storage:', userEmail);
        // Store userEmail in localStorage for later retrieval
        localStorage.setItem('userEmail', userEmail);
      }

      // Create user-scoped localStorage keys
      const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId';
      const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates';
      const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder';

      // Store the selected template ID in localStorage for the builder to use
      const templateId = selectedTemplate.id || selectedTemplate._id;
      if (templateId) {
        localStorage.setItem(selectedTemplateKey, String(templateId));
        logger.info('Stored selectedTemplateId:', templateId, 'with key:', selectedTemplateKey);

        // Also store all career level templates for the builder to display
        const correctDomainFamily = DOMAIN_NAME_MAP[domainName] || DOMAIN_NAME_MAP[domainName.toLowerCase()] || domainName.toLowerCase() || 'core_engineering';
        const careerLevelData = sortedTemplates.map(t => ({
          id: t.id?.toString() || t._id || '',
          name: t.name,
          preview_url: t.preview_url || '/assets/templates/template-1.jpg',
          description: t.description || 'Professional resume template',
          ats_friendly: t.ats_friendly || true,
          subtitle: t.name?.split('-')?.[1]?.trim() || 'Template',
          domain_family: ((t as unknown) as Record<string, unknown>).domain_family as string || correctDomainFamily,
        }));
        logger.info('Career level data to store:', careerLevelData);
        localStorage.setItem(careerLevelKey, JSON.stringify(careerLevelData));
        logger.info('Stored careerLevelTemplates successfully with key:', careerLevelKey);

        // ✅ ALSO: Compute and store sectionOrder based on career level from template name
        const templateName = selectedTemplate.name || '';
        let careerLevel: string | undefined;
        const nameStr = templateName.toLowerCase();
        if (nameStr.includes('early') && nameStr.includes('career')) {
          careerLevel = 'early career';
        } else if (nameStr.includes('senior')) {
          careerLevel = 'senior-level';
        } else if (nameStr.includes('mid')) {
          careerLevel = 'mid-level';
        } else if (nameStr.includes('fresher')) {
          careerLevel = 'fresher';
        }
        const sectionOrder = getSectionOrder(careerLevel);
        localStorage.setItem(sectionOrderKey, JSON.stringify(sectionOrder));
        logger.info('Stored sectionOrder:', sectionOrder, 'with key:', sectionOrderKey, 'for career level:', careerLevel);
      }

      // Get user's resumes or create a new one
      let resumeId: string | undefined;
      if (resumes && resumes.length > 0) {
        // Use the first (most recent) resume
        resumeId = resumes[0].id || (resumes[0] as unknown as Record<string, unknown>)._id as string;
      } else {
        // If no resume found, create a new one
        const newResume = await createResumeWithAuth();
        resumeId = newResume.id || (newResume as unknown as Record<string, unknown>)._id as string;
      }

      // Redirect immediately to the resume creation page
      if (resumeId) {
        router.push(`/builder/creation/${resumeId}`);
      }

      onClose();
    } catch (error) {
      logger.error('Error applying template:', error);
      setIsLoading(false);
    }
  };

  if (!selectedTemplate) return null;

  return (
    <>
      {/* Full-screen loading overlay during navigation */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-teal-400 rounded-full animate-spin" />
            <p className="text-white text-lg font-semibold">Loading Resume Builder...</p>
            <p className="text-white/70 text-sm">Setting up your template</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl ring-1 ring-slate-200 shadow-2xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm hover:bg-slate-100 rounded-lg ring-1 ring-slate-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex gap-6 p-8">
          {/* Left: Main Template Preview */}
          <div className="flex-1">
            <div className="bg-linear-to-br from-slate-50 via-sky-50/40 to-teal-50/30 ring-1 ring-slate-200 rounded-xl overflow-hidden flex items-center justify-center p-4 h-full">
              <Image
                src={familyImage}
                alt={selectedTemplate.name}
                width={400}
                height={500}
                className="w-full h-auto object-contain drop-shadow-md"
                onError={() => setFamilyImage(FALLBACK_IMAGE)}
              />
            </div>
          </div>

          {/* Right: Career Level Templates Grid */}
          <div className="w-96 flex flex-col">
            {/* Header */}
            <div className="mb-6 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-1 h-6 rounded-full bg-linear-to-b from-teal-500 to-sky-500" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {domainName}
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Select your career level
              </p>
            </div>

            {/* Career Level Cards Grid (2x2) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {sortedTemplates.map((template, index) => {
                const careerLevel = getCareerLevel(template.name);
                const isSelected = selectedTemplateIndex === index;

                return (
                  <div key={template.id || template._id} className="flex flex-col">
                    <button
                      onClick={() => handleSelectTemplate(index)}
                      className={`relative rounded-lg overflow-hidden ring-1 transition-all cursor-pointer group bg-linear-to-br from-slate-50 to-slate-100/60 p-2 ${
                        isSelected
                          ? 'ring-2 ring-teal-500 shadow-md'
                          : 'ring-slate-200 hover:ring-teal-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Card Preview Image - Full template preview */}
                      <Image
                        src={familyImage}
                        alt={careerLevel}
                        width={160}
                        height={200}
                        className="w-full h-auto object-contain group-hover:scale-105 transition-transform"
                        onError={() => setFamilyImage(FALLBACK_IMAGE)}
                      />

                      {/* Tick Mark - Only when Selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-linear-to-br from-teal-500 to-sky-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg ring-2 ring-white">
                          <span className="text-sm font-bold">✓</span>
                        </div>
                      )}
                    </button>

                    {/* Career Level Below Card */}
                    <p className={`text-sm font-semibold mt-2 text-center transition-colors ${
                      isSelected ? 'text-teal-700' : 'text-slate-700'
                    }`}>
                      {careerLevel}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Template Details */}
            {selectedTemplate && (
              <div className="space-y-4">
                {/* Title and ATS Badge */}
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-3">
                    {selectedTemplate.name}
                  </h3>
                  <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full ring-1 ring-emerald-200">
                    ✓ 100% ATS Friendly
                  </div>
                </div>

                {/* Description */}
                {selectedTemplate.description && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Description</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedTemplate.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Features</h4>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-slate-700 flex items-center gap-2">
                      <span className="text-teal-600">✓</span> Professional layout
                    </li>
                    <li className="text-xs text-slate-700 flex items-center gap-2">
                      <span className="text-teal-600">✓</span> Easy to customize
                    </li>
                    <li className="text-xs text-slate-700 flex items-center gap-2">
                      <span className="text-teal-600">✓</span> ATS optimized
                    </li>
                    <li className="text-xs text-slate-700 flex items-center gap-2">
                      <span className="text-teal-600">✓</span> Print friendly
                    </li>
                  </ul>
                </div>

                {/* Apply and Cancel Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleApplyTemplate}
                    disabled={isLoading}
                    className={`w-full text-white font-semibold py-3 rounded-lg cursor-pointer transition-all shadow-sm ${
                      isLoading
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-linear-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 hover:shadow-md'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2 cursor-pointer">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Applying Template...
                      </span>
                    ) : (
                      'Apply This Template'
                    )}
                  </Button>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className={`w-full font-semibold py-2 rounded-lg cursor-pointer transition-colors ring-1 ${
                      isLoading
                        ? 'bg-slate-50 text-slate-400 ring-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-slate-700 ring-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
