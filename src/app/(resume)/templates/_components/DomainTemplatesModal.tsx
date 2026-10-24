"use client";

import React, { useState, useMemo } from 'react';
import { X, Star, Medal, CircleCheck, Briefcase, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type TemplateResponse, getAllResumes, createResumeWithAuth, applyTemplateToResume, applyCatalogueToResume } from '@/api/resumeApi';
import { getProfile } from '@/api/userApi';
import logger from '@/lib/logger';
import { getSectionOrderByDomainAndCareer, getSectionOrderFromTemplate, addCareerLevelSections } from '../_utils/domainSectionOrder';
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
  selectedStyle?: string;
}

const CAREER_LEVELS = ['Fresher', 'Early Career', 'Mid-Level', 'Senior-Level', 'Lead', 'Architect', 'Manager', 'Director', 'Vice President'];

// Format backend level strings to display format
const formatBackendLevel = (backendLevel?: string): string | undefined => {
  if (!backendLevel) return undefined;
  const level = backendLevel.toLowerCase();
  if (level === 'fresher' || level === 'entry_level') return 'Fresher';
  if (level === 'early_career') return 'Early Career';
  if (level === 'mid_level' || level === 'mid-level') return 'Mid-Level';
  if (level === 'senior_level' || level === 'senior-level') return 'Senior-Level';
  if (level === 'lead') return 'Lead';
  if (level === 'architect') return 'Architect';
  if (level === 'manager') return 'Manager';
  if (level === 'director') return 'Director';
  if (level === 'vice_president' || level === 'vp') return 'Vice President';
  return undefined;
};

// Canonical career-level detection — use shared utility or backend level for consistency
const detectCareerLevel = (name: string, backendLevel?: string): string | undefined => {
  // Prefer backend level if available
  if (backendLevel) {
    return formatBackendLevel(backendLevel);
  }

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
  selectedStyle = '',
}: DomainTemplatesModalProps) {
  const router = useRouter();
  const domainFallback = DOMAIN_FAMILY_IMAGES[domainFamily] || FALLBACK_TEMPLATE_IMAGE;

  // Sort templates by career level
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aLevel = detectCareerLevel(a.name || '', (a as unknown as Record<string, unknown>).level as string | undefined);
      const bLevel = detectCareerLevel(b.name || '', (b as unknown as Record<string, unknown>).level as string | undefined);
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

  const getCareerLevel = (template: TemplateResponse) => {
    const backendLevel = (template as unknown as Record<string, unknown>).level as string | undefined;
    return detectCareerLevel(template.name || '', backendLevel) || 'Custom';
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

        // ✅ ALSO: Compute and store sectionOrder based on backend template or career level + domain family
        // First, detect career level from template name
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

        // Try to use section order from the template's backend config
        const templateSections = (selectedTemplate as unknown as Record<string, unknown>).sections as Record<string, Record<string, unknown>> | undefined;
        let newDomainOrder = getSectionOrderFromTemplate(templateSections);

        // Fallback: use domain + career level logic if template doesn't have section config
        if (newDomainOrder.length === 0) {
          newDomainOrder = getSectionOrderByDomainAndCareer(correctDomainFamily, careerLevel);
        }

        // Add career-level specific sections (e.g., Internships for Freshers)
        newDomainOrder = addCareerLevelSections(newDomainOrder, careerLevel);

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

      // Save the chosen template on the resume (regular or enhanced), as the
      // builder's TemplatesTab does, so it survives another browser or cleared
      // storage. Best-effort: the builder still reads the localStorage choice.
      if (templateId) {
        try {
          await applyTemplateToResume(resumeId, String(templateId));
        } catch (applyError) {
          logger.warn('Failed to save the template on the resume:', applyError);
        }
      }

      // Save the selected style/catalogue if one was chosen
      if (selectedStyle) {
        try {
          await applyCatalogueToResume(resumeId, selectedStyle);
          logger.info('Catalogue applied successfully:', selectedStyle);
        } catch (catalogueError) {
          logger.warn('Failed to save the catalogue on the resume:', catalogueError);
        }
      }

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
                  errorFallbackImage={domainFallback}
                  title={selectedTemplate.name}
                  height="100%"
                  width="100%"
                />
              </div>
            </div>

            {/* Right: Career Level Templates Grid */}
            <div className="w-[420px] flex flex-col overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-3 mb-6 px-1">
                {sortedTemplates.map((template, index) => {
                  const careerLevel = getCareerLevel(template);
                  const isSelected = selectedTemplateIndex === index;

                  return (
                    <div key={template.id || template._id} className="flex flex-col">
                      <button
                        data-testid={`career-level-btn-${index}`}
                        onClick={() => handleSelectTemplate(index)}
                        className={`relative rounded-lg ring-1 transition-all cursor-pointer group bg-linear-to-br from-slate-50 to-slate-100/60 p-2 ${isSelected
                          ? 'ring-2 ring-[#2257a7] shadow-md'
                          : 'ring-slate-200 hover:ring-[#5896d7] hover:shadow-sm'
                          }`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div style={{ pointerEvents: 'none' }} className="overflow-hidden rounded-md">
                          <TemplatePreviewRenderer
                            previewHtml={((template as unknown) as Record<string, unknown>)?.preview_html as string | undefined}
                            previewCss={((template as unknown) as Record<string, unknown>)?.preview_css as string | undefined}
                            fallbackImage={resolveTemplateImageUrl(template.preview_url) || domainFallback}
                            errorFallbackImage={domainFallback}
                            title={careerLevel}
                            height="200px"
                            width="100%"
                            scale={0.35}
                            hideScroll={true}
                            fillContainer={true}
                          />
                        </div>
                        <div className="absolute top-0 left-0 pointer-events-none">
                          <div className="bg-linear-to-r from-blue-500 to-blue-700 text-white font-bold px-3 rounded-tl-xl rounded-br-xl shadow-lg flex items-center gap-1.5 text-[10px] backdrop-blur-sm border-r border-b border-white/30">
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            <span className='text-[10px]'>100% ATS</span>
                          </div>
                        </div>
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
                <div className="space-y-6">
                  {/* Title and Subtitle */}
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                      {(() => {
                        const careerLevel = getCareerLevel(selectedTemplate);
                        if (careerLevel && careerLevel !== 'Custom') {
                          return `${domainName} ${careerLevel} Template`;
                        }
                        return selectedTemplate.name;
                      })()}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {domainName} · Professional style
                    </p>
                  </div>

                  {/* Recommendation Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-white rounded-md p-2 shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Recommended for you</p>
                      <p className="text-xs text-amber-800">Perfect match for your career level and experience</p>
                    </div>
                  </div>

                  {/* Template Details Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Template Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-start gap-2.5">
                        <div className="bg-slate-100 rounded-md p-2 shrink-0">
                          <CircleCheck className="w-4 h-4 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-500 font-semibold mb-1">ATS</div>
                          <div className="text-sm font-bold text-slate-900">Optimized</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-start gap-2.5">
                        <div className="bg-slate-100 rounded-md p-2 shrink-0">
                          <Medal className="w-4 h-4 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-500 font-semibold mb-1">Career Level</div>
                          <div className="text-sm font-bold text-slate-900">
                            {getCareerLevel(selectedTemplate)}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-start gap-2.5">
                        <div className="bg-slate-100 rounded-md p-2 shrink-0">
                          <Briefcase className="w-4 h-4 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-500 font-semibold mb-1">Experience</div>
                          <div className="text-sm font-bold text-slate-900">
                            {((selectedTemplate as unknown as Record<string, unknown>).experience_years as string) || '0-2'} yrs
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex items-start gap-2.5">
                        <div className="bg-slate-100 rounded-md p-2 shrink-0">
                          <Building2 className="w-4 h-4 text-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-500 font-semibold mb-1">Industry</div>
                          <div className="text-sm font-bold text-slate-900 truncate">{domainName}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why Choose This Template */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Why Choose This Template</h4>
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <ul className="space-y-2.5">
                        {(() => {
                          const description = (selectedTemplate as unknown as Record<string, unknown>).description as string | undefined;
                          if (!description) return null;
                          const sentences = description
                            .split('. ')
                            .slice(0, 3)
                            .map((sentence) => sentence.trim().replace(/\.$/, ''));

                          return sentences.map((sentence, index) => (
                            <li key={index} className="text-xs text-slate-700 flex gap-2.5">
                              <span className="text-slate-400 shrink-0 mt-1">•</span>
                              <span>{sentence}.</span>
                            </li>
                          ));
                        })()}
                      </ul>
                    </div>
                  </div>

                  {/* Best Suited For */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Best Suited For</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs font-medium text-slate-700">
                        {(() => {
                          const level = getCareerLevel(selectedTemplate);
                          if (level === 'Fresher') return 'Fresher candidates';
                          if (level === 'Early Career') return 'Early career professionals';
                          return `${level} professionals`;
                        })()}
                      </span>
                      <span className="inline-block bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs font-medium text-slate-700">
                        {((selectedTemplate as unknown as Record<string, unknown>).experience_years as string) || '0-2'} years experience
                      </span>
                      <span className="inline-block bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 truncate">
                        {domainName} roles
                      </span>
                    </div>
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
