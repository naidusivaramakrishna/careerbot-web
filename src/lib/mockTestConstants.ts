const COMPANY_MAP: Record<string, { name: string; logoPath: string }> = {
  google: { name: 'Google', logoPath: '/images/companies/google.png' },
  amazon: { name: 'Amazon', logoPath: '/images/companies/amazon.png' },
  microsoft: { name: 'Microsoft', logoPath: '/images/companies/microsoft.png' },
  meta: { name: 'Meta', logoPath: '/images/companies/meta.png' },
  infosys: { name: 'Infosys', logoPath: '/images/companies/infosys.png' },
  tcs: { name: 'TCS', logoPath: '/images/companies/tcs.png' },
  wipro: { name: 'Wipro', logoPath: '/images/companies/wipro.png' },
};

export function resolveCompanyId(raw: string | null | undefined): string {
  if (!raw) return 'custom';
  return raw.toLowerCase().trim();
}

export function resolveCompanyInfo(id: string): { name: string; logoPath: string } {
  return COMPANY_MAP[id] ?? { name: id.charAt(0).toUpperCase() + id.slice(1), logoPath: '' };
}
