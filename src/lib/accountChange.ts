/**
 * "The signed-in account just changed in THIS page" -- without a reload.
 *
 * Credential sign-in (SignUpModal with an onSuccess) and sign-out keep the
 * page alive, so module-level caches built for the previous account survive
 * them. The college membership cache is one: account B would inherit account
 * A's college name, "Provided by" label and student shell, and would try to
 * mint a college session for A's membership.
 *
 * Each such cache subscribes here and drops itself. OAuth sign-in does a hard
 * navigation, so a fresh page load already covers it.
 */
const ACCOUNT_CHANGED_EVENT = 'careerbot-account-changed';

export function announceAccountChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACCOUNT_CHANGED_EVENT));
}

export function onAccountChanged(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(ACCOUNT_CHANGED_EVENT, handler);
  return () => window.removeEventListener(ACCOUNT_CHANGED_EVENT, handler);
}
