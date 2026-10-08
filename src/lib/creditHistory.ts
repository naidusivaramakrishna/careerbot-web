/**
 * Shared presentation helpers for credit-ledger history rows.
 *
 * Used by BOTH the user's own "Credit history" view (settings/subscription)
 * and the SUPER_ADMIN credit-history tab in admin user details. Only
 * formatting lives here — each screen owns its own row type so the user view
 * cannot accidentally render admin-only fields.
 */

export type CreditHistoryType =
  | 'admin_grant'
  | 'purchase'
  | 'plan_reset'
  | 'usage'
  | 'refund'
  | 'other';

const USER_TYPE_LABELS: Record<CreditHistoryType, string> = {
  admin_grant: 'Bonus from CareerBot team',
  purchase: 'Credit purchase',
  plan_reset: 'Monthly plan reset',
  usage: 'Used on a feature',
  refund: 'Refund',
  other: 'Adjustment',
};

const ADMIN_TYPE_LABELS: Record<CreditHistoryType, string> = {
  admin_grant: 'Admin grant',
  purchase: 'Purchase',
  plan_reset: 'Plan reset',
  usage: 'Usage',
  refund: 'Refund',
  other: 'Other',
};

const isKnownType = (type: string): type is CreditHistoryType =>
  Object.prototype.hasOwnProperty.call(USER_TYPE_LABELS, type);

/** Friendly label for the end user (e.g. admin_grant -> "Bonus from CareerBot team"). */
export function userCreditTypeLabel(type: string): string {
  return isKnownType(type) ? USER_TYPE_LABELS[type] : USER_TYPE_LABELS.other;
}

/** Short operational label for the admin console. */
export function adminCreditTypeLabel(type: string): string {
  return isKnownType(type) ? ADMIN_TYPE_LABELS[type] : ADMIN_TYPE_LABELS.other;
}

/** "+50" / "-3" / "0". */
export function formatSignedCredits(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  if (amount > 0) return `+${amount}`;
  return String(amount);
}

/** Date + time in the viewer's locale; "—" for missing/invalid input. */
export function formatCreditDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Total pages for a {page_size, total} envelope (min 1). */
export function totalPagesOf(total: number, pageSize: number): number {
  if (!pageSize || pageSize <= 0 || !total || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}
