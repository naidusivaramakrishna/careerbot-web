/**
 * Admin credits API — SUPER_ADMIN credit grants + per-user credit ledger.
 *
 * Uses the shared httpClient: admin auth is the admin httpOnly cookie, and
 * any URL containing "/admin/" is routed through the admin refresh path by
 * the response interceptor (src/lib/http.ts isAdminRequest).
 *
 * Paths are relative to BASE_URL (/api/v1). Keep every path in a constant
 * here so a backend rename is a one-line change.
 */
import { httpClient } from '@/lib/http';
import type { CreditHistoryType } from '@/lib/creditHistory';

// ==================== PATHS ====================

/** POST — SUPER_ADMIN grant. Body {credits, reason}; header Idempotency-Key. */
export const ADMIN_ADD_CREDITS_PATH = (userId: string) =>
    `/admin/quota/user/${encodeURIComponent(userId)}/add-credits`;

/**
 * GET — SUPER_ADMIN per-user credit ledger (?page=&page_size=, page_size 1..50).
 * Also the source of the user's balance (top-level `balance`, read from the
 * users collection — the same balance deductions use). Do NOT read balance
 * from /admin/quota/user/{id}/usage: it prefers legacy quota_state, which drifts.
 */
export const ADMIN_USER_CREDIT_HISTORY_PATH = (userId: string) =>
    `/admin/quota/user/${encodeURIComponent(userId)}/credit-history`;

// ==================== LIMITS (mirror backend validation) ====================

export const ADD_CREDITS_MIN = 1;
export const ADD_CREDITS_MAX = 5000;
export const ADD_CREDITS_REASON_MIN = 3;
export const ADD_CREDITS_REASON_MAX = 200;

// ==================== TYPES ====================

export interface AdminUserCreditBalance {
    credits_remaining: number | null;
    credits_total: number | null;
}

export interface AddCreditsRequest {
    credits: number;
    reason: string;
}

export interface AddCreditsResponse {
    message: string;
    user_id: string;
    credits_added: number;
    previous_balance: number;
    new_balance: number;
    idempotent_replay: boolean;
    /**
     * Set (client-side) when the backend answered 500 CREDIT_GRANT_PARTIAL:
     * the credits WERE added, but a secondary step failed. The grant stands —
     * treat as success, surface this warning, never retry.
     */
    partial_warning?: string;
}

export interface AdminCreditHistoryItem {
    id: string;
    created_at: string;
    type: CreditHistoryType | string;
    amount: number;
    feature: string | null;
    balance_after: number | null;
    description: string | null;
    admin_id: string | null;
    admin_email: string | null;
    reason: string | null;
    idempotency_key: string | null;
}

export interface AdminCreditHistoryResponse {
    items: AdminCreditHistoryItem[];
    page: number;
    page_size: number;
    total: number;
    balance: AdminUserCreditBalance;
}

// ==================== CALLS ====================

const toNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export const addUserCredits = async (
    userId: string,
    body: AddCreditsRequest,
    idempotencyKey: string
): Promise<AddCreditsResponse> => {
    try {
        const res = await httpClient.post<AddCreditsResponse>(
            ADMIN_ADD_CREDITS_PATH(userId),
            // Exactly these two fields: the backend rejects extras with 422.
            { credits: Math.trunc(body.credits), reason: body.reason.trim() },
            { headers: { 'Idempotency-Key': idempotencyKey } }
        );
        return res.data;
    } catch (err) {
        const env = readErrorEnvelope(err);
        if (env.status === 500 && env.code === 'CREDIT_GRANT_PARTIAL') {
            const d = env.details ?? {};
            const added = toNum(d.credits_added) ?? Math.trunc(body.credits);
            const newBalance = toNum(d.new_balance);
            if (newBalance !== null) {
                return {
                    message: env.message ?? 'Credits added with warnings',
                    user_id: userId,
                    credits_added: added,
                    previous_balance: newBalance - added,
                    new_balance: newBalance,
                    idempotent_replay: false,
                    partial_warning:
                        `Credits were added, but a follow-up step failed${typeof d.grant_id === 'string' ? ` (grant ${d.grant_id})` : ''}. ` +
                        'Do not retry — check credit history.',
                };
            }
        }
        throw err;
    }
};

export const getAdminUserCreditHistory = async (
    userId: string,
    page = 1,
    pageSize = 20
): Promise<AdminCreditHistoryResponse> => {
    const res = await httpClient.get<Partial<AdminCreditHistoryResponse> & { balance?: Partial<AdminUserCreditBalance> | null }>(
        ADMIN_USER_CREDIT_HISTORY_PATH(userId),
        { params: { page, page_size: pageSize } }
    );
    const d = res.data;
    return {
        items: Array.isArray(d?.items) ? d.items : [],
        page: d?.page ?? page,
        page_size: d?.page_size ?? pageSize,
        total: d?.total ?? 0,
        balance: {
            credits_remaining: toNum(d?.balance?.credits_remaining),
            credits_total: toNum(d?.balance?.credits_total),
        },
    };
};

// ==================== ERROR MAPPING ====================
//
// Backend error envelope (all errors):
//   {"success": false, "error": {message, error_code, error_id, request_id,
//                                timestamp, path, details?}}
// Read error.message / error.error_code / error.details — not `detail`.

interface ErrorEnvelope {
    status: number | null;
    code: string | null;
    message: string | null;
    details: Record<string, unknown> | null;
}

export function readErrorEnvelope(error: unknown): ErrorEnvelope {
    const e = (error ?? {}) as { response?: { status?: number; data?: unknown } };
    const status = typeof e.response?.status === 'number' ? e.response.status : null;
    const data = (e.response?.data ?? null) as Record<string, unknown> | null;
    const inner = data && typeof data.error === 'object' && data.error !== null
        ? (data.error as Record<string, unknown>)
        : null;
    const details = inner && typeof inner.details === 'object' && inner.details !== null && !Array.isArray(inner.details)
        ? (inner.details as Record<string, unknown>)
        : null;
    return {
        status,
        code: inner && typeof inner.error_code === 'string' ? inner.error_code : null,
        message: inner && typeof inner.message === 'string' && inner.message ? inner.message : null,
        details,
    };
}

/**
 * What the dialog should do with the Idempotency-Key after a failure:
 *  - 'same-key': retrying re-sends the SAME submission (network, 409 in-progress,
 *                500 CREDIT_GRANT_FAILED — the backend resumes the same grant —, unknown 5xx)
 *  - 'new-key':  a retry must be a NEW submission (409 IDEMPOTENCY_KEY_REUSED)
 *  - 'none':     retrying will not help (401/403/404/422/429)
 */
export type AddCreditsRetry = 'same-key' | 'new-key' | 'none';

export interface AddCreditsErrorInfo {
    message: string;
    retry: AddCreditsRetry;
}

const firstValidationMessage = (details: Record<string, unknown> | null): string | null => {
    const list = details?.validation_errors;
    if (!Array.isArray(list) || list.length === 0) return null;
    const first = list[0] as Record<string, unknown>;
    const msg = typeof first?.message === 'string' ? first.message : typeof first?.msg === 'string' ? first.msg : null;
    const field = typeof first?.field === 'string' ? first.field
        : Array.isArray(first?.loc) ? String((first.loc as unknown[])[(first.loc as unknown[]).length - 1]) : null;
    if (!msg) return null;
    return field ? `${field}: ${msg}` : msg;
};

const grantRef = (details: Record<string, unknown> | null): string =>
    typeof details?.grant_id === 'string' && details.grant_id ? ` (grant ${details.grant_id})` : '';

/** Map an add-credits failure to a specific, user-facing message + retry policy. */
export function describeAddCreditsError(error: unknown): AddCreditsErrorInfo {
    const { status, code, message, details } = readErrorEnvelope(error);

    if (status === null) {
        return {
            message: 'Network error: the request did not reach the server. Check your connection and retry — retrying is safe and will not add credits twice.',
            retry: 'same-key',
        };
    }

    if (code === 'ADMIN_DAILY_GRANT_LIMIT_EXCEEDED' || status === 429) {
        const remaining = toNum(details?.remaining_allowance);
        const limit = toNum(details?.daily_limit);
        if (remaining !== null) {
            return {
                message: `Daily credit grant limit reached${limit !== null ? ` (${limit}/day)` : ''}. You can grant ${remaining} more credit${remaining === 1 ? '' : 's'} today.`,
                retry: 'none',
            };
        }
        return { message: `Daily credit grant limit reached${message ? `: ${message}` : '.'}`, retry: 'none' };
    }
    if (code === 'IDEMPOTENCY_KEY_REUSED') {
        return {
            message: 'This submission was already used with different details. Go back, review, and submit again.',
            retry: 'new-key',
        };
    }
    if (code === 'CREDIT_GRANT_IN_PROGRESS') {
        return {
            message: `This grant is still being processed${grantRef(details)}. Wait a moment, then retry — it will not add credits twice.`,
            retry: 'same-key',
        };
    }
    if (code === 'CREDIT_GRANT_FAILED') {
        return {
            message: `The grant did not complete${grantRef(details)}. Retry — it resumes the same grant and will not add credits twice.`,
            retry: 'same-key',
        };
    }

    switch (status) {
        case 401:
            return { message: 'Your admin session has expired. Sign in again to add credits.', retry: 'none' };
        case 403:
            return { message: 'Only a super admin can add credits. Your account does not have permission.', retry: 'none' };
        case 404:
            return { message: 'User not found. They may have been deleted.', retry: 'none' };
        case 422: {
            const v = firstValidationMessage(details);
            return { message: `Invalid request${v ? `: ${v}` : message ? `: ${message}` : '. Check the amount and reason.'}`, retry: 'none' };
        }
        default:
            if (status >= 500) {
                return {
                    message: 'Server error while adding credits. Retrying is safe and will not add credits twice.',
                    retry: 'same-key',
                };
            }
            return { message: message || 'Failed to add credits.', retry: 'none' };
    }
}
