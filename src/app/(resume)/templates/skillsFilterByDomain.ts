import { ResumeData } from "../builder/creation/_context/ResumeContext";

// Domains that should include general skill categories
const DOMAINS_WITH_GENERAL_CATEGORIES = new Set([
  'software_engineering',
  'cybersecurity',
  'research_scholar',
]);

// General skill categories that exist in all domains
const GENERAL_CATEGORIES = new Set([
  'programming_languages',
  'frameworks',
  'soft_skills',
  'project_management',
  'marketing_sales',
]);

// Domain-specific skill categories for each domain
const DOMAIN_SKILLS_MAPPING: Record<string, Set<string>> = {
  'healthcare': new Set(['clinical_skills', 'healthcare_compliance', 'healthcare_systems', 'healthcare_it_systems']),
  'legal': new Set(['legal_practice', 'legal_research', 'legal_compliance']),
  'government_standard': new Set(['government_operations', 'government_compliance']),
  'cybersecurity': new Set(['penetration_testing', 'security_defense', 'security_compliance', 'cloud_security']),
  'software_engineering': new Set(['frameworks_libraries', 'databases_data_storage', 'cloud_devops']),
  'core_engineering': new Set(['design_analysis', 'manufacturing_operations', 'project_management_skills']),
  'finance': new Set(['financial_analysis', 'accounting_auditing', 'risk_compliance']),
  'education': new Set(['pedagogical_expertise', 'research_publication', 'academic_leadership']),
  'electronics_and_vlsi': new Set(['digital_vlsi_design', 'embedded_systems', 'analog_design']),
  'logistics_warehouse_operations': new Set(['warehouse_operations', 'supply_chain_logistics', 'systems_tools']),
  'marine_merchant_navy': new Set(['maritime_operations', 'maritime_regulations', 'maritime_crew_management']),
  'research_scholar': new Set(['research_methodologies', 'research_infrastructure', 'research_leadership', 'programming_ml']),
  'sales_business_development': new Set(['sales_competencies', 'business_development', 'tools_platforms']),
  'customer_support_service': new Set(['customer_success', 'account_management', 'tools_systems']),
  'product_engineering_leadership': new Set(['product_strategy', 'engineering_leadership', 'cross_functional']),
  'marketing_creative': new Set(['marketing_strategy', 'creative_design', 'marketing_tools']),
  'operations_management': new Set(['operations_strategy', 'project_delivery', 'business_analysis']),
  'human_resources': new Set(['talent_management', 'employee_relations', 'hr_operations']),
};

export function filterSkillsByDomain(
  categorizedSkills: ResumeData['categorizedSkills'] | undefined,
  domainFamily?: string
): ResumeData['categorizedSkills'] | undefined {
  if (!categorizedSkills || !domainFamily) {
    return categorizedSkills;
  }

  const includeGeneralCategories = DOMAINS_WITH_GENERAL_CATEGORIES.has(domainFamily);
  const domainSkills = DOMAIN_SKILLS_MAPPING[domainFamily];

  console.log('[TEMPLATE FILTER] Domain:', domainFamily, 'All categorizedSkills:', categorizedSkills);
  console.log('[TEMPLATE FILTER] Domain:', domainFamily, 'Skills in categorizedSkills:', Object.keys(categorizedSkills));
  console.log('[TEMPLATE FILTER] Domain-specific skills for domain:', domainSkills ? Array.from(domainSkills) : 'NONE');

  // Create filtered object with only appropriate categories
  const filtered: Record<string, unknown> = {
    custom_categories: categorizedSkills.custom_categories,
    hidden_predefined_categories: categorizedSkills.hidden_predefined_categories,
    skill_id_map: categorizedSkills.skill_id_map,
  };

  // Add general categories only if domain supports them
  if (includeGeneralCategories) {
    filtered.programming_languages = categorizedSkills.programming_languages || [];
    filtered.frameworks = categorizedSkills.frameworks || [];
    filtered.soft_skills = categorizedSkills.soft_skills || [];
    filtered.project_management = categorizedSkills.project_management || [];
    filtered.marketing_sales = categorizedSkills.marketing_sales || [];
    console.log('[TEMPLATE FILTER] Added general categories for domain:', domainFamily);
  }

  // Add only domain-specific categories that belong to this domain
  if (domainSkills) {
    const addedSkills: string[] = [];
    Object.entries(categorizedSkills).forEach(([key, value]) => {
      if (domainSkills.has(key)) {
        filtered[key] = value;
        addedSkills.push(key);
      }
    });
    console.log('[TEMPLATE FILTER] Added domain-specific skills:', addedSkills);
  }

  console.log('[TEMPLATE FILTER] Final filtered keys:', Object.keys(filtered));
  return filtered as ResumeData['categorizedSkills'];
}
