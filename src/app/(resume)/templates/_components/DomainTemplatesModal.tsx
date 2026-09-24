"use client";

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type TemplateResponse, getAllResumes, createResumeWithAuth } from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import logger from '@/lib/logger';
import { getSectionOrderByDomainAndCareer } from '../_utils/domainSectionOrder';
import { detectCareerLevel as detectCareerLevelUtil } from '@/utils/careerLevelDetection';
import { Button } from '@/components/ui/Button';
import { DOMAIN_FAMILY_IMAGES, FALLBACK_TEMPLATE_IMAGE } from '../_constants/templateImages';
import { resolveTemplateImageUrl } from '@/lib/imageUtils';
import { TemplatePreviewRenderer } from '@/components/templates';

interface DomainTemplatesModalProps {
  domainName: string;
  domainFamily: string;
  templates: TemplateResponse[];
  onClose: () => void;
  sourceResumeId?: string;
  source?: string;
}

const CAREER_LEVELS = ['Fresher', 'Early Career', 'Mid-Level', 'Senior-Level', 'Lead', 'Architect', 'Manager', 'Director', 'Vice President'];

// Canonical career-level detection — use shared utility for consistency
const detectCareerLevel = (name: string): string | undefined => {
  const n = (name || '').toLowerCase();
  // Use shared utility for most common levels
  const detected = detectCareerLevelUtil(n);
  if (detected) {
    // Capitalize for display
    return detected.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  // Fallback for compound labels
  if (n.includes('early') && n.includes('career')) return 'Early Career';
  if (n.includes('mid')) return 'Mid-Level';
  return undefined;
};

export default function DomainTemplatesModal({
  domainName,
  domainFamily,
  templates,
  onClose,
  sourceResumeId,
  source,
}: DomainTemplatesModalProps) {
  const router = useRouter();
  const domainFallback = DOMAIN_FAMILY_IMAGES[domainFamily] || FALLBACK_TEMPLATE_IMAGE;

  // Sort templates by career level
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aLevel = detectCareerLevel(a.name || '');
      const bLevel = detectCareerLevel(b.name || '');
      const aLevelIndex = aLevel ? CAREER_LEVELS.indexOf(aLevel) : -1;
      const bLevelIndex = bLevel ? CAREER_LEVELS.indexOf(bLevel) : -1;

      if (aLevelIndex === -1 && bLevelIndex === -1) return 0; // both unknown → stable order
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
    return detectCareerLevel(templateName) || 'Custom';
  };

  const handleSelectTemplate = (index: number) => {
    setSelectedTemplateIndex(index);
  };

  const handleApplyTemplate = async () => {
    setIsLoading(true);
    try {
      // Skip getAllResumes when sourceResumeId is already known (came from builder)
      const [userProfile, resumes] = await Promise.all([
        getProfile().catch(() => null),
        sourceResumeId ? Promise.resolve(null) : getAllResumes().catch(() => null),
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

      // Use domainFamily prop directly (already correctly set from page.tsx)
      const correctDomainFamily = domainFamily;

      // Store the selected template ID in localStorage for the builder to use
      const templateId = selectedTemplate.id || selectedTemplate._id;
      if (templateId) {
        localStorage.setItem(selectedTemplateKey, String(templateId));
        logger.info('Stored selectedTemplateId:', templateId, 'with key:', selectedTemplateKey);

        // Also store all career level templates for the builder to display

        const careerLevelData = sortedTemplates.map(t => ({
          id: t.id?.toString() || t._id || '',
          name: t.name,
          preview_url: t.preview_url || FALLBACK_TEMPLATE_IMAGE,
          description: t.description || 'Professional resume template',
          ats_friendly: t.ats_friendly ?? true,
          subtitle: t.name?.split('-')?.[1]?.trim() || 'Template',
          domain_family: ((t as unknown) as Record<string, unknown>).domain_family as string || correctDomainFamily,
          domain_display_name: domainName,
        }));
        logger.info('Career level data to store:', careerLevelData);
        localStorage.setItem(careerLevelKey, JSON.stringify(careerLevelData));
        logger.info('Stored careerLevelTemplates successfully with key:', careerLevelKey);

        // ✅ ALSO: Compute and store sectionOrder based on career level AND domain family
        const templateName = selectedTemplate.name || '';
        let careerLevel: string | undefined;
        const nameStr = templateName.toLowerCase();
        if (nameStr.includes('early') && nameStr.includes('career')) {
          careerLevel = 'early career';
        } else if (nameStr.includes('fresher')) {
          careerLevel = 'fresher';
        } else if (nameStr.includes('architect')) {
          careerLevel = 'architect';
        } else if (nameStr.includes('manager')) {
          careerLevel = 'manager';
        } else if (nameStr.includes('lead')) {
          careerLevel = 'lead';
        } else if (nameStr.includes('senior')) {
          careerLevel = 'senior-level';
        } else if (nameStr.includes('mid')) {
          careerLevel = 'mid-level';
        }
        const newDomainOrder = getSectionOrderByDomainAndCareer(correctDomainFamily, careerLevel);
        // Preserve extra sections the user had added before opening this modal
        const addableExtras = new Set(['Achievements', 'Publications', 'Patents', 'Volunteering', 'Awards', 'Hobbies', 'Interests', 'Languages', 'References']);
        const existingOrderStr = localStorage.getItem(sectionOrderKey);
        const existingOrder: string[] = existingOrderStr ? (() => { try { return JSON.parse(existingOrderStr) } catch { return [] } })() : [];
        const newOrderSet = new Set(newDomainOrder);
        const preservedExtras = existingOrder.filter(name => addableExtras.has(name) && !newOrderSet.has(name));
        const sectionOrder = [...newDomainOrder, ...preservedExtras];
        localStorage.setItem(sectionOrderKey, JSON.stringify(sectionOrder));
        logger.info('Stored sectionOrder with domain:', correctDomainFamily, 'career level:', careerLevel, 'Order:', sectionOrder);
      }

      // Get resume ID — prefer the one passed from the builder (preserves source context)
      let resumeId: string | undefined = sourceResumeId;
      if (!resumeId) {
        if (resumes && resumes.length > 0) {
          resumeId = resumes[0].id || (resumes[0] as unknown as Record<string, unknown>)._id as string;
        } else {
          const newResume = await createResumeWithAuth();
          resumeId = newResume.id || (newResume as unknown as Record<string, unknown>)._id as string;
        }
      }

      if (!resumeId) {
        throw new Error('Failed to get or create resume ID');
      }

      // Catalogue is already saved in localStorage by the /templates page selection

      // Store templateDomain in localStorage for domain-aware features (e.g., domain-specific skills)
      try {
        localStorage.setItem(`templateDomain_${resumeId}`, correctDomainFamily);
      } catch (storageError) {
        logger.warn('Failed to store templateDomain to localStorage:', storageError);
        // Don't throw - continue with navigation even if storage fails
      }

      // Redirect back to the builder, preserving source query param if present
      router.push(`/builder/creation/${resumeId}${source ? `?source=${source}` : ''}`);
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
        <div data-testid="loading-overlay" className="fixed inset-0 bg-slate-950/30 flex items-center justify-center z-60 backdrop-blur-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-black text-lg font-semibold">Loading Resume Builder...</p>
            <p className="text-black/70 text-sm">Setting up your template</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="relative bg-white rounded-2xl ring-1 ring-slate-200 shadow-2xl overflow-hidden max-w-6xl w-full h-[90vh] flex flex-col">
          {/* Close Button */}
          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm hover:bg-slate-100 rounded-lg ring-1 ring-slate-200 transition-colors z-10"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex gap-6 p-8 flex-1 min-h-0">
            {/* Left: Main Template Preview */}
            <div className="flex-1 h-full">
              <div className="w-full h-full overflow-hidden bg-white">
                <TemplatePreviewRenderer
                  previewHtml={((selectedTemplate as unknown) as Record<string, unknown>)?.preview_html as string | undefined}
                  previewCss={((selectedTemplate as unknown) as Record<string, unknown>)?.preview_css as string | undefined}
                  fallbackImage={resolveTemplateImageUrl(selectedTemplate.preview_url) || domainFallback}
                  title={selectedTemplate.name}
                  height="100%"
                  width="100%"
                />
              </div>
            </div>

            {/* Right: Career Level Templates Grid */}
            <div className="w-96 flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="mb-6 relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-1 h-6 rounded-full bg-[#2257a7]" />
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
                        data-testid={`career-level-btn-${index}`}
                        onClick={() => handleSelectTemplate(index)}
                        className={`relative rounded-lg overflow-hidden ring-1 transition-all cursor-pointer group bg-linear-to-br from-slate-50 to-slate-100/60 p-2 ${isSelected
                            ? 'ring-2 ring-[#2257a7] shadow-md'
                            : 'ring-slate-200 hover:ring-[#5896d7] hover:shadow-sm'
                          }`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div style={{ pointerEvents: 'none' }}>
                          <TemplatePreviewRenderer
                          previewHtml={((template as unknown) as Record<string, unknown>)?.preview_html as string | undefined}
                          previewCss={((template as unknown) as Record<string, unknown>)?.preview_css as string | undefined}
                          fallbackImage={domainFallback}
                          title={careerLevel}
                          height="200px"
                          width="100%"
                          scale={0.35}
                          hideScroll={true}
                          fillContainer={true}
                        />
                        </div>
                        <span className="absolute top-2 left-2 bg-[#2557a7] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm pointer-events-none">
                          100% ATS Friendly
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-linear-to-br from-teal-500 to-sky-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg ring-2 ring-white">
                            <span className="text-sm font-bold">✓</span>
                          </div>
                        )}
                      </button>
                      <p className={`text-sm font-semibold mt-2 text-center transition-colors ${isSelected ? 'text-[#2257a7]' : 'text-slate-700'
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
                      {(() => {
                        const templateName = selectedTemplate.name || '';
                        const nameStr = templateName.toLowerCase();

                        let careerLevel = '';
                        if (nameStr.includes('early') && nameStr.includes('career')) {
                          careerLevel = 'Early Career';
                        } else if (nameStr.includes('fresher')) {
                          careerLevel = 'Fresher';
                        } else if (nameStr.includes('architect')) {
                          careerLevel = 'Architect';
                        } else if (nameStr.includes('manager')) {
                          careerLevel = 'Manager';
                        } else if (nameStr.includes('lead')) {
                          careerLevel = 'Lead';
                        } else if (nameStr.includes('senior')) {
                          careerLevel = 'Senior-Level';
                        } else if (nameStr.includes('mid')) {
                          careerLevel = 'Mid-Level';
                        }

                        if (careerLevel) {
                          return `${domainName} ${careerLevel} Template`;
                        }

                        return selectedTemplate.name;
                      })()}
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
                        <span className="text-[#2257a7]">✓</span> Professional layout
                      </li>
                      <li className="text-xs text-slate-700 flex items-center gap-2">
                        <span className="text-[#2257a7]">✓</span> Easy to customize
                      </li>
                      <li className="text-xs text-slate-700 flex items-center gap-2">
                        <span className="text-[#2257a7]">✓</span> ATS optimized
                      </li>
                      <li className="text-xs text-slate-700 flex items-center gap-2">
                        <span className="text-[#2257a7]">✓</span> Print friendly
                      </li>
                    </ul>
                  </div>

                  {/* Apply and Cancel Buttons */}
                  <div className="space-y-2">
                    <Button
                      data-testid="apply-template-btn"
                      onClick={handleApplyTemplate}
                      disabled={isLoading}
                      className={`w-full text-white font-semibold py-3 rounded-lg cursor-pointer transition-all shadow-sm ${isLoading
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-[#2257a7] hover:bg-[#184284] '
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
                      data-testid="cancel-btn"
                      onClick={onClose}
                      disabled={isLoading}
                      className={`w-full font-semibold py-2 rounded-lg cursor-pointer transition-colors ring-1 ${isLoading
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
