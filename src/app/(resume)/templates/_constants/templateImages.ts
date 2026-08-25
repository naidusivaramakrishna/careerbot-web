/**
 * Shared domain family thumbnail images — used on the domain grid cards.
 * These are local /public/assets images used as domain-level thumbnails,
 * not individual template previews (those come from template.preview_url).
 *
 * Single source of truth: previously duplicated in page.tsx and DomainTemplatesModal.tsx.
 */
export const DOMAIN_FAMILY_IMAGES: Record<string, string> = {
  core_engineering:                '/assets/templates/core-engineering.png',
  software_engineering:            '/assets/templates/software_engineering.png',
  healthcare:                      '/assets/templates/healthcare.png',
  finance:                         '/assets/templates/finance.png',
  education:                       '/assets/templates/education.png',
  cybersecurity:                   '/assets/templates/cybersecurity.png',
  electronics_and_vlsi:            '/assets/templates/electronics_vlsi.png',
  government_standard:             '/assets/templates/government_standard.png',
  legal:                           '/assets/templates/legal.png',
  logistics_warehouse_operations:  '/assets/templates/logistics.png',
  marine_merchant_navy:            '/assets/templates/marine_merchant.png',
  research_scholar:                '/assets/templates/research_scholar.png',
  sales_business_development:      '/assets/templates/sales_business.png',
  customer_support_service:        '/assets/templates/customer_support_service.png',
  product_engineering_leadership:  '/assets/templates/product_engineering_leadership.png',
  marketing_creative:              '/assets/templates/marketing_creative.png',
  operations_management:           '/assets/templates/operations_management.png',
  human_resources:                 '/assets/templates/human_resources.png',
};

export const FALLBACK_TEMPLATE_IMAGE = '/assets/templates/template-1.png';
