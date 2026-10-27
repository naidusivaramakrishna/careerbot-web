/**
 * Which college, if any, a request host names: vit.<base> -> 'vit'.
 *
 * FOR ROUTING ONLY. This decides where a visitor lands, never what they may
 * read -- access comes from the signed-in account's membership, checked by the
 * backend on every request. Getting this wrong sends someone to an unbranded
 * page, nothing more.
 *
 * MIRRORS THE BACKEND. careerbot-api app/core/institution/college_code.py holds
 * the same rule and reserved list, and app/api/middleware/institution_subdomain.py
 * parses the host the same way. Keep the three in step: a code the backend
 * resolves but this does not would land its students on the consumer home page.
 */

const COLLEGE_CODE_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const RESERVED_COLLEGE_CODES = new Set([
  'www', 'api', 'app', 'admin', 'staging', 'localhost',
  'careerbot', 'mail', 'cdn', 'static', 'assets', 'acme', 'nightly',
  'webmail', 'cpanel', 'whm', 'webdisk', 'ftp', 'autodiscover',
  'autoconfig', 'cpcalendars', 'cpcontacts',
]);

/** The base domain colleges live under. Read per call, not at import. */
export function institutionBaseDomain(): string | null {
  // ".intelicoreai.com" (cookie-domain style) means the same as "intelicoreai.com".
  const value = (process.env.INSTITUTION_BASE_DOMAIN || '').trim().toLowerCase().replace(/^\.+/, '');
  return value || null;
}

export function collegeFromHost(host: string | null | undefined, baseDomain: string | null): string | null {
  if (!host || !baseDomain) return null;

  const h = host.trim().toLowerCase();
  // Several values, a path or an IPv6 literal: take nothing, as the backend does.
  if (h.includes(',') || h.includes(' ') || h.includes('/') || h.startsWith('[')) return null;

  // A fully-qualified host may end in a dot (vit.example.com.). Strip every
  // trailing dot, as the backend's rstrip(".") does.
  const hostname = h.split(':')[0].replace(/\.+$/, '');
  const suffix = `.${baseDomain}`;
  if (!hostname.endsWith(suffix)) return null;

  const label = hostname.slice(0, -suffix.length);
  // One label only: a.b.<base> is not a college.
  if (label.includes('.')) return null;
  if (RESERVED_COLLEGE_CODES.has(label) || !COLLEGE_CODE_RE.test(label)) return null;
  return label;
}
