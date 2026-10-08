/**
 * Admin credits API + CreditHistoryTab, exercised through the REAL
 * adminCreditsApi module with only the http client mocked:
 * path constants, query params, rows, pagination, empty / error / 403 / 404,
 * and the 500 CREDIT_GRANT_PARTIAL -> success-with-warning conversion.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, configure } from '@testing-library/react';
import React from 'react';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: http, httpClient: http }));

vi.mock('@/lib/logger', () => {
    const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
    return { default: mock, logger: mock };
});

import { CreditHistoryTab } from '@/app/admin/dashboard/user-management/_components/user-details/CreditHistoryTab';
import {
    ADMIN_ADD_CREDITS_PATH,
    ADMIN_USER_CREDIT_HISTORY_PATH,
    addUserCredits,
    getAdminUserCreditHistory,
} from '@/api/adminCreditsApi';

// Generous async timeout: these suites run alongside ~300 other files in CI.
configure({ asyncUtilTimeout: 5000 });

const row = (id: string, over: Record<string, unknown> = {}) => ({
    id, created_at: '2026-10-01T10:00:00Z', type: 'admin_grant', amount: 50, feature: null,
    balance_after: 90, description: 'Bonus credits from the CareerBot team', admin_id: 'a1',
    admin_email: 'boss@careerbot.in', reason: 'Goodwill', idempotency_key: 'k', ...over,
});

const page = (items: unknown[], total = items.length, p = 1) => ({ data: { items, page: p, page_size: 20, total } });

const envelopeError = (status: number, error_code: string, message: string, details?: unknown) =>
    Object.assign(new Error(message), {
        response: { status, data: { success: false, error: { message, error_code, error_id: 'e', request_id: 'r', timestamp: 't', path: '/p', details } } },
    });

beforeEach(() => {
    vi.clearAllMocks();
});

describe('admin credits path constants', () => {
    it('builds the contract paths', () => {
        expect(ADMIN_USER_CREDIT_HISTORY_PATH('u 1')).toBe('/admin/quota/user/u%201/credit-history');
        expect(ADMIN_ADD_CREDITS_PATH('u-1')).toBe('/admin/quota/user/u-1/add-credits');
    });
});

describe('getAdminUserCreditHistory balance', () => {
    it('returns the top-level balance (users collection) and nulls when absent', async () => {
        http.get.mockResolvedValueOnce({ data: { items: [], page: 1, page_size: 1, total: 0, balance: { credits_remaining: 12, credits_total: 300 } } });
        expect((await getAdminUserCreditHistory('u-1', 1, 1)).balance).toEqual({ credits_remaining: 12, credits_total: 300 });
        http.get.mockResolvedValueOnce({ data: { items: [], page: 1, page_size: 1, total: 0 } });
        expect((await getAdminUserCreditHistory('u-1', 1, 1)).balance).toEqual({ credits_remaining: null, credits_total: null });
        expect(http.get).toHaveBeenCalledWith('/admin/quota/user/u-1/credit-history', { params: { page: 1, page_size: 1 } });
        expect(http.get.mock.calls.some(([url]) => String(url).includes('/usage'))).toBe(false);
    });
});

describe('addUserCredits', () => {
    it('sends exactly {credits, reason} as an integer + trimmed string with the Idempotency-Key header', async () => {
        http.post.mockResolvedValue({ data: { new_balance: 1 } });
        await addUserCredits('u-1', { credits: 10, reason: '  Goodwill  ' }, 'key-abc');
        expect(http.post).toHaveBeenCalledWith(
            '/admin/quota/user/u-1/add-credits',
            { credits: 10, reason: 'Goodwill' },
            { headers: { 'Idempotency-Key': 'key-abc' } },
        );
    });

    it('converts 500 CREDIT_GRANT_PARTIAL into a success result with a warning (grant stands)', async () => {
        http.post.mockRejectedValue(envelopeError(500, 'CREDIT_GRANT_PARTIAL', 'partial', { grant_id: 'g-7', credits_added: 25, new_balance: 125 }));
        const res = await addUserCredits('u-1', { credits: 25, reason: 'Goodwill' }, 'k');
        expect(res).toMatchObject({ credits_added: 25, new_balance: 125, previous_balance: 100 });
        expect(res.partial_warning).toContain('grant g-7');
        expect(res.partial_warning).toContain('Do not retry');
    });

    it('rethrows other errors', async () => {
        const err = envelopeError(500, 'CREDIT_GRANT_FAILED', 'failed', { grant_id: 'g-8' });
        http.post.mockRejectedValue(err);
        await expect(addUserCredits('u-1', { credits: 1, reason: 'abc' }, 'k')).rejects.toBe(err);
    });
});

describe('CreditHistoryTab (admin)', () => {
    it('requests page 1 / page_size 20 and renders type, signed amount, feature, balance after, admin email, reason', async () => {
        http.get.mockResolvedValue(page([
            row('h1'),
            row('h2', { type: 'usage', amount: -3, feature: 'ats_scan', balance_after: 87, admin_email: null, admin_id: null, reason: null, idempotency_key: null }),
        ]));
        render(<CreditHistoryTab userId="u-1" />);
        const rows = await screen.findAllByTestId('admin-credit-history-row');
        expect(http.get).toHaveBeenCalledWith('/admin/quota/user/u-1/credit-history', { params: { page: 1, page_size: 20 } });
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveTextContent('Admin grant');
        expect(rows[0]).toHaveTextContent('+50');
        expect(rows[0]).toHaveTextContent('Balance 90');
        expect(rows[0]).toHaveTextContent('By boss@careerbot.in');
        expect(rows[0]).toHaveTextContent('Reason: Goodwill');
        expect(screen.getByText('+50')).toHaveClass('text-green-600');
        expect(rows[1]).toHaveTextContent('Usage · ats scan');
        expect(rows[1]).toHaveTextContent('-3');
        expect(rows[1]).not.toHaveTextContent('By ');
    });

    it('paginates', async () => {
        http.get.mockResolvedValue(page([row('h1')], 45));
        render(<CreditHistoryTab userId="u-1" />);
        await screen.findByText('1/3');
        fireEvent.click(screen.getByRole('button', { name: 'Next credit history page' }));
        await waitFor(() =>
            expect(http.get).toHaveBeenLastCalledWith('/admin/quota/user/u-1/credit-history', { params: { page: 2, page_size: 20 } }),
        );
    });

    it('shows the empty state', async () => {
        http.get.mockResolvedValue(page([], 0));
        render(<CreditHistoryTab userId="u-1" />);
        expect(await screen.findByText('No credit history')).toBeInTheDocument();
    });

    it('shows a 403 message, then recovers on retry', async () => {
        http.get.mockRejectedValueOnce(envelopeError(403, 'FORBIDDEN', 'Forbidden'));
        render(<CreditHistoryTab userId="u-1" />);
        expect(await screen.findByRole('alert')).toHaveTextContent('Only a super admin can view credit history.');
        http.get.mockResolvedValueOnce(page([row('h1')]));
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(await screen.findAllByTestId('admin-credit-history-row')).toHaveLength(1);
    });

    it('ignores a stale response: two requests resolved in reverse order render only the newest (Codex P2)', async () => {
        const resolvers: Array<(v: unknown) => void> = [];
        http.get.mockImplementation(() => new Promise((r) => { resolvers.push(r); }));
        const { rerender } = render(<CreditHistoryTab userId="u-1" refreshKey={0} />);
        rerender(<CreditHistoryTab userId="u-1" refreshKey={1} />);
        await waitFor(() => expect(resolvers).toHaveLength(2));
        // newest first, then the stale one
        resolvers[1](page([row('new', { reason: 'NEWEST' })]));
        expect(await screen.findByText('Reason: NEWEST')).toBeInTheDocument();
        resolvers[0](page([row('old', { reason: 'STALE' })]));
        await new Promise((r) => setTimeout(r, 20));
        expect(screen.queryByText('Reason: STALE')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('admin-credit-history-row')).toHaveLength(1);
    });

    it('shows the envelope message for 404', async () => {
        http.get.mockRejectedValueOnce(envelopeError(404, 'NOT_FOUND', 'User not found'));
        render(<CreditHistoryTab userId="u-1" />);
        expect(await screen.findByRole('alert')).toHaveTextContent('User not found');
    });
});
