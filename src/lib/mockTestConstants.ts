// Valid subcategories accepted by the backend /mock-test/generate endpoint.
// abstract, algebra, analytical, dsa, geometry, java, logical, oops,
// percentages, profit_loss, python, ratios, simple_interest, sql,
// statistics, time_and_work, trigonometry, verbal, web
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  arithmetic: ['percentages', 'profit_loss', 'ratios', 'simple_interest', 'time_and_work', 'algebra'],
  aptitude:   ['verbal', 'abstract', 'analytical', 'statistics', 'geometry', 'trigonometry'],
  reasoning:  ['logical'],
  technical:  ['python', 'java', 'dsa', 'sql', 'oops', 'web'],
};

export interface CompanyInfo {
  name: string;
  logoPath: string;
  initials: string;
  color: string;
}

// Valid backend slugs: accenture, capgemini, cognizant, infosys, tcs, wipro
const COMPANY_INFO: Record<string, CompanyInfo> = {
  tcs:       { name: 'TCS NQT',            logoPath: '/assets/company_logos/Tata_Consultancy_Services.svg', initials: 'TCS', color: '#003366' },
  infosys:   { name: 'Infosys',            logoPath: '/assets/company_logos/infosys.svg',                   initials: 'INF', color: '#007cc2' },
  cognizant: { name: 'Cognizant GenC',     logoPath: '/assets/company_logos/cognizant.svg',                 initials: 'COG', color: '#1a4398' },
  wipro:     { name: 'Wipro NLTH',         logoPath: '/assets/company_logos/wipro-1.svg',                   initials: 'WIP', color: '#341c5c' },
  accenture: { name: 'Accenture',          logoPath: '/assets/company_logos/Accenture-Logo.wine.svg',       initials: 'ACC', color: '#a100ff' },
  capgemini: { name: 'Capgemini Exceller', logoPath: '/assets/company_logos/capgemini.png',                 initials: 'CAP', color: '#0070ad' },
};

// Maps URL slugs/variants → canonical backend slug
const SLUG_TO_BACKEND: Record<string, string> = {
  tcs: 'tcs', tcs_nqt: 'tcs', '1': 'tcs',
  infosys: 'infosys', '3': 'infosys',
  cognizant: 'cognizant', cognizant_genc: 'cognizant', '4': 'cognizant',
  wipro: 'wipro', wipro_nlth: 'wipro', '6': 'wipro',
  accenture: 'accenture',
  capgemini: 'capgemini', capgemini_exceller: 'capgemini',
  '2': 'tcs',
  '5': 'wipro',
  // Custom tests use tcs as the company context (broadest question bank)
  'custom-test': 'tcs',
  'custom': 'tcs',
};

const FALLBACK_INFO: CompanyInfo = {
  name: 'Mock Test',
  logoPath: '',
  initials: 'MT',
  color: '#2557a7',
};

export function resolveCompanyInfo(id: string): CompanyInfo {
  const backendId = SLUG_TO_BACKEND[id] ?? id;
  return COMPANY_INFO[backendId] ?? FALLBACK_INFO;
}

/** Returns the canonical backend slug accepted by /mock-test/generate */
export function resolveCompanyId(urlId: string): string {
  if (SLUG_TO_BACKEND[urlId]) return SLUG_TO_BACKEND[urlId];
  const base = urlId.split('_')[0];
  return SLUG_TO_BACKEND[base] ?? base;
}
