import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllResumes, createResumeWithAuth, getTemplatesByCategory, TemplateResponse } from '@/api/resumeApi'
import { getProfile } from '@/api/userApi'
import { getSectionOrderByDomainAndCareer } from '@/app/(resume)/templates/_utils/domainSectionOrder'
import { logger } from '@/lib/logger'

// Map family codes to display names
const FAMILY_TO_DISPLAY_NAME: Record<string, string> = {
  'software_engineering': 'Software Engineering',
  'healthcare': 'Healthcare',
  'finance': 'Finance',
  'education': 'Education',
  'cybersecurity': 'Cybersecurity',
  'core_engineering': 'Core Engineering',
  'electronics_and_vlsi': 'Electronics & VLSI',
  'government_standard': 'Government Standard',
  'legal': 'Legal',
  'logistics_warehouse_operations': 'Logistics & Warehouse',
  'marine_merchant_navy': 'Marine & Merchant Navy',
  'modern_minimal_template': 'Modern Minimal',
  'research_scholar': 'Research Scholar',
  'sales_business_development': 'Sales & Business Dev',
}

export function useTemplateRedirect() {
  const router = useRouter()

  useEffect(() => {
    const applyPendingTemplate = async () => {
      try {
        const pendingTemplateFamily = localStorage.getItem('pendingTemplateFamily')

        if (!pendingTemplateFamily) {
          return // No pending template
        }

        logger.info('Found pending template:', pendingTemplateFamily)

        // Get user profile and resumes
        const [userProfile, resumes] = await Promise.all([
          getProfile().catch(() => null),
          getAllResumes().catch(() => null),
        ])

        let userEmail = ''
        if (userProfile?.email) {
          userEmail = userProfile.email
          logger.info('User email for scoped storage:', userEmail)
          localStorage.setItem('userEmail', userEmail)
        }

        // Create user-scoped localStorage keys
        const selectedTemplateKey = userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId'
        const careerLevelKey = userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates'
        const sectionOrderKey = userEmail ? `sectionOrder_${userEmail}` : 'sectionOrder'
        const domainFamilyKey = userEmail ? `domainFamily_${userEmail}` : 'domainFamily'

        // Fetch all templates from API (no category filter)
        logger.info('Fetching all templates from API')
        const allTemplates = await getTemplatesByCategory()

        // Filter templates by domain family
        const careerTemplates = allTemplates?.filter((t: TemplateResponse) => {
          const templateDomainFamily = (t as unknown as Record<string, unknown>).domain_family as string | undefined
          return templateDomainFamily === pendingTemplateFamily
        }) || []

        logger.info('Filtered templates for domain:', pendingTemplateFamily, 'Count:', careerTemplates.length)

        if (careerTemplates && Array.isArray(careerTemplates) && careerTemplates.length > 0) {
          logger.info('Found career level templates:', careerTemplates.length)

          // Sort by career level
          const sortedTemplates = careerTemplates.sort((a, b) => {
            const careerLevels = ['fresher', 'early career', 'mid-level', 'senior-level', 'manager']
            const aName = (a.name || '').toLowerCase()
            const bName = (b.name || '').toLowerCase()

            const aLevelIndex = careerLevels.findIndex(level => aName.includes(level))
            const bLevelIndex = careerLevels.findIndex(level => bName.includes(level))

            if (aLevelIndex === -1) return 1
            if (bLevelIndex === -1) return -1
            return aLevelIndex - bLevelIndex
          })

          // Transform and store all career level templates
          const careerLevelData = sortedTemplates.map((t: TemplateResponse) => ({
            id: t.id?.toString() || t._id || '',
            name: t.name,
            preview_url: t.preview_url || '/assets/templates/template-1.jpg',
            description: t.description || 'Professional resume template',
            ats_friendly: t.ats_friendly || true,
            subtitle: t.name?.split('-')?.[1]?.trim() || 'Template',
            domain_family: pendingTemplateFamily,
            domain_display_name: FAMILY_TO_DISPLAY_NAME[pendingTemplateFamily] || pendingTemplateFamily,
          }))

          logger.info('Storing career level templates:', careerLevelData.length)
          localStorage.setItem(careerLevelKey, JSON.stringify(careerLevelData))
          localStorage.setItem(domainFamilyKey, pendingTemplateFamily)

          // Set first template as selected
          if (careerLevelData.length > 0) {
            localStorage.setItem(selectedTemplateKey, careerLevelData[0].id)
            logger.info('Set initial template to:', careerLevelData[0].name)
          }

          // Store section order based on domain family and first career level
          const templateName = sortedTemplates[0]?.name?.toLowerCase() || ''
          let careerLevel: string | undefined
          if (templateName.includes('early') && templateName.includes('career')) {
            careerLevel = 'early career'
          } else if (templateName.includes('senior')) {
            careerLevel = 'senior-level'
          } else if (templateName.includes('mid')) {
            careerLevel = 'mid-level'
          } else if (templateName.includes('fresher')) {
            careerLevel = 'fresher'
          } else if (templateName.includes('manager')) {
            careerLevel = 'manager'
          }

          const sectionOrder = getSectionOrderByDomainAndCareer(pendingTemplateFamily, careerLevel)
          localStorage.setItem(sectionOrderKey, JSON.stringify(sectionOrder))
          logger.info('Stored sectionOrder for domain:', pendingTemplateFamily, 'career level:', careerLevel)
        } else {
          logger.warn('No career level templates found from API')
        }

        // Get or create resume
        let resumeId: string | undefined
        if (resumes && resumes.length > 0) {
          resumeId = resumes[0].id || (resumes[0] as unknown as Record<string, unknown>)._id as string
        } else {
          const newResume = await createResumeWithAuth()
          resumeId = newResume.id || (newResume as unknown as Record<string, unknown>)._id as string
        }

        // Clear pending template
        localStorage.removeItem('pendingTemplateFamily')

        // Redirect to builder
        if (resumeId) {
          router.push(`/builder/creation/${resumeId}`)
        }
      } catch (error) {
        logger.error('Error applying pending template:', error)
        // Clear pending template on error
        localStorage.removeItem('pendingTemplateFamily')
      }
    }

    applyPendingTemplate()
  }, [router])
}
