// Valid subcategories accepted by the backend /mock-test/generate endpoint.
// See careerbot-api's schemas.py (CATEGORY_SUBCATEGORIES) for the full set —
// this is a curated subset, not a mirror, so don't duplicate the list here.
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  // Last 5 are new — drawn from CATEGORY_SUBCATEGORIES['arithmetic'] in
  // careerbot-api's schemas.py, picked to not conceptually overlap the
  // original 6 (e.g. skipped 'percentage'/'profit_and_loss'/'ratio_and_proportion'
  // since 'percentages'/'profit_loss'/'ratios' above already cover that ground).
  arithmetic: [
    'percentages', 'profit_loss', 'ratios', 'simple_interest', 'time_and_work', 'algebra',
    'number_system', 'simplification', 'average', 'time_speed_and_distance', 'mixture_and_alligation',
  ],
  // Last 5 are new, from schemas.py's aptitude set — skipped 'algebra' (already
  // under arithmetic above; adding it here too would just duplicate the chip
  // across two category sections) and 'geometry'/'statistics' (already covered).
  aptitude: [
    'verbal', 'abstract', 'analytical', 'statistics', 'geometry', 'trigonometry',
    'mensuration', 'permutation_and_combination', 'probability', 'data_interpretation', 'progressions',
  ],
  // Text-friendly subset of the backend's reasoning set — skips ones needing
  // diagrams/images, which a text MCQ generator handles poorly.
  reasoning: [
    'series', 'analogy', 'classification', 'coding_decoding', 'blood_relations',
    'direction_sense', 'ranking', 'puzzles', 'statement_and_assumption', 'cause_and_effect',
  ],
  // Last 5 are new, from schemas.py's technical set (python/java/dsa/sql/oops/web
  // already matched exactly, so no overlap to avoid here).
  technical: [
    'python', 'java', 'dsa', 'sql', 'oops', 'web',
    'javascript', 'database', 'system_design', 'html', 'css',
  ],
};

// Questions/time per section. This is the AUTHORITATIVE source for the size of
// a generated test, not a mirror of a backend value:
// `/mock-test/generate` honours the `question_count` in the request
// (careerbot-api service.py `_ensure_question_count`, topping up from the pool
// and then from the AI to reach exactly that number). The seeded
// `company_test_templates` are read only by the template list/detail
// endpoints, never on the generate path — and they are per-company and
// non-uniform (23Q/48min and 15Q/30min per section in
// app/db/seeds/seed_mock_test_templates.py), so they are NOT 20/25 and this
// table is not "matching" them.
//
// Changing a number here changes what candidates sit and what the AI is asked
// to generate. 20Q/section is double the previous hardcoded 10Q, so treat an
// edit as a product change, not a refactor.
export const SECTION_CONFIG: Record<string, { questions: number; minutes: number }> = {
  arithmetic: { questions: 20, minutes: 25 },
  aptitude:   { questions: 20, minutes: 25 },
  reasoning:  { questions: 20, minutes: 25 },
  technical:  { questions: 20, minutes: 25 },
};

// Used for a category that isn't in SECTION_CONFIG (e.g. a custom test built
// from a category added later) so a section is never left without a size.
const FALLBACK_SECTION = { questions: 20, minutes: 25 };

export function sectionConfigFor(category: string): { questions: number; minutes: number } {
  return SECTION_CONFIG[category.toLowerCase()] ?? FALLBACK_SECTION;
}

// The four sections every company test runs, in order.
export const STANDARD_SECTIONS = ['arithmetic', 'aptitude', 'reasoning', 'technical'] as const;

// Totals for a full company test — derived, never typed by hand.
export const STANDARD_TEST_TOTALS = {
  questions: STANDARD_SECTIONS.reduce((n, s) => n + SECTION_CONFIG[s].questions, 0),
  minutes:   STANDARD_SECTIONS.reduce((n, s) => n + SECTION_CONFIG[s].minutes, 0),
  sections:  STANDARD_SECTIONS.length,
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
  // 'custom' here is purely a UI/routing id — no company_context reaches the
  // backend for any test now, so every company draws from the same pool.
  'custom-test': 'custom',
  'custom': 'custom',
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

/**
 * Inverse of resolveCompanyId, for building a `/mock-test/{slug}` link from a
 * stored/backend company id — needed because '/mock-test/custom' is the STATIC
 * builder route, not the test runner. Routing an existing attempt there (e.g.
 * with ?reviewParentSession=...) silently lands on the builder instead, since
 * that page ignores the query string; the runner only matches 'custom-test'.
 */
export function toTestRouteSlug(companyId: string): string {
  return companyId === 'custom' ? 'custom-test' : companyId;
}

/**
 * Where browse's "Resume" button should navigate for a given active
 * session's company_id. A custom session's difficulty/categories/
 * parentSessionId aren't in ActiveSession, so the runner can't resume it
 * directly — the builder is the only page that can reconstruct that config.
 * A falsy company_id (currently true of every session — careerbot-api's
 * session document never stores company_id for ANY session, company or
 * custom) falls back to the builder too, rather than building a broken
 * `/mock-test/undefined` or `/mock-test/null` link.
 */
export function resolveResumeRoute(companyId: string | null | undefined): string {
  if (!companyId || companyId === 'custom') return '/mock-test/custom';
  return `/mock-test/${toTestRouteSlug(companyId)}`;
}

/**
 * Parses the Custom Builder's `subcategories` URL param for one section: one
 * '|'-separated segment per category (same order as the builder's picked
 * `categories`), '+'-separated within a segment. Filtered against that
 * section's own valid subcategory list, so a stale/hand-edited URL can't
 * send the backend a slug it doesn't recognise. Empty input, a missing
 * segment for this index, or an all-invalid segment all return [] — the
 * runner's own fallback is picking randomly from the full valid list.
 */
export function parseSubcategoriesParam(
  raw: string | null | undefined,
  sectionIndex: number,
  validSubcategories: readonly string[],
): string[] {
  if (!raw) return [];
  const segments = raw.split('|').map(seg => seg.split('+').filter(Boolean));
  const picked = segments[sectionIndex] ?? [];
  return picked.filter(s => validSubcategories.includes(s));
}
