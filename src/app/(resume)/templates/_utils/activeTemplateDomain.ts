/**
 * Single source of truth for "which domain is this resume rendered in".
 *
 * The builder preview (PreviewPanel) picks Template2/3/4 and the skills filter
 * (filterSkillsByDomain) from the applied career-level template stored per
 * user in `careerLevelTemplates_<email>` + `selectedTemplateId_<email>`. The
 * Skills editor must resolve the domain the same way, otherwise it offers
 * categories the preview/PDF/DOCX then filter out (PR #96 review).
 *
 * The storage is scoped by the logged-in account's email as PreviewPanel and
 * TemplatesTab get it (getProfile), so every consumer must use that email too
 * (resolveAccountEmail / useAccountEmail), not localStorage.userEmail, which
 * is only written by a few pages and never cleared on logout.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { getProfile } from '@/api/userApi';

export interface AppliedCareerTemplate {
  id: string | number;
  name?: string;
  domain_family?: string;
}

const storageKeys = (userEmail?: string | null) => ({
  selectedTemplateKey: userEmail ? `selectedTemplateId_${userEmail}` : 'selectedTemplateId',
  careerLevelKey: userEmail ? `careerLevelTemplates_${userEmail}` : 'careerLevelTemplates',
});

/** The career-level template the user applied, or null when none is applied. */
export function getAppliedCareerTemplate(userEmail?: string | null): AppliedCareerTemplate | null {
  if (typeof window === 'undefined') return null;
  try {
    const { selectedTemplateKey, careerLevelKey } = storageKeys(userEmail);
    const appliedTemplateId = localStorage.getItem(selectedTemplateKey);
    const careerLevelStorage = localStorage.getItem(careerLevelKey);
    if (!appliedTemplateId || !careerLevelStorage) return null;
    const careerLevels = JSON.parse(careerLevelStorage) as unknown;
    if (!Array.isArray(careerLevels)) return null;
    const applied = (careerLevels as AppliedCareerTemplate[]).find(
      (t) => t && String(t.id) === String(appliedTemplateId),
    );
    return applied ?? null;
  } catch {
    return null;
  }
}

/** domain_family of the applied career-level template (what the preview renders). */
export function getActiveTemplateDomain(userEmail?: string | null): string | undefined {
  return getAppliedCareerTemplate(userEmail)?.domain_family || undefined;
}

/**
 * Domain whose skill categories the Skills editor shows. No applied
 * career-level template means the preview renders a style template or the
 * default Template2, both of which print the general categories.
 */
export function getSkillsEditorDomain(userEmail?: string | null): string {
  return (getActiveTemplateDomain(userEmail) || 'general').toLowerCase();
}

/** localStorage.userEmail — may belong to a previous account; prefer getAccountEmail(). */
export function getStoredUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('userEmail');
  } catch {
    return null;
  }
}

// ── Logged-in account email ────────────────────────────────────────────────
// undefined = not resolved yet on this page load.
let accountEmail: string | null | undefined;
let inflight: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

/**
 * Fetch the logged-in account's email (getProfile), exactly as PreviewPanel
 * does: null when the profile has no email or the request fails (PreviewPanel
 * then uses the unscoped keys). Concurrent callers share one request.
 */
export function resolveAccountEmail(): Promise<string | null> {
  if (!inflight) {
    inflight = getProfile()
      .then((profile) => profile?.email || null)
      .catch(() => null)
      .then((email) => {
        inflight = null;
        if (email !== accountEmail) {
          accountEmail = email;
          listeners.forEach((listener) => listener());
        }
        return email;
      });
  }
  return inflight;
}

/** Last resolved account email; localStorage.userEmail until it resolves. */
export function getAccountEmail(): string | null {
  return accountEmail !== undefined ? accountEmail : getStoredUserEmail();
}

function subscribeAccountEmail(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** getAccountEmail() for components; re-renders once the profile resolves. */
export function useAccountEmail(): string | null {
  const email = useSyncExternalStore(subscribeAccountEmail, getAccountEmail, () => null);
  useEffect(() => {
    if (accountEmail === undefined) void resolveAccountEmail();
  }, []);
  return email;
}
