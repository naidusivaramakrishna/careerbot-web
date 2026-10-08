/**
 * User "Credit history" (settings/subscription) — friendly labels, signed
 * amounts, pagination, empty / error states, and the guarantee that admin
 * fields never render even if the backend leaks them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, configure } from '@testing-library/react';
import React from 'react';

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: http, httpClient: http }));

import { CreditHistory } from '@/app/settings/subscription/_components/CreditHistory';
import { getMyCreditHistory, CREDITS_HISTORY_PATH } from '@/api/creditsApi';

// Generous async timeout: these suites render a full dialog flow and run
// alongside ~300 other files in CI.
configure({ asyncUtilTimeout: 5000 });

const leakyRow = (id: string, over: Record<string, unknown> = {}) => ({
    id, created_at: '2026-10-01T10:00:00Z', type: 'admin_grant', amount: 50, feature: null,
    balance_after: 90, description: null,
    // admin-only fields that must never reach the user UI:
    admin_id: 'admin-secret-id', admin_email: 'boss@careerbot.in',
    reason: 'internal: VIP escalation', idempotency_key: 'idem-secret',
    ...over,
});

const page = (items: unknown[], total = items.length, p = 1) => ({ data: { items, page: p, page_size: 20, total } });

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getMyCreditHistory', () => {
    it('calls the user path with page params and strips admin fields', async () => {
        http.get.mockResolvedValue(page([leakyRow('h1')]));
        const res = await getMyCreditHistory(2, 20);
        expect(http.get).toHaveBeenCalledWith(CREDITS_HISTORY_PATH, { params: { page: 2, page_size: 20 } });
        expect(CREDITS_HISTORY_PATH).toBe('/credits/history');
        expect(Object.keys(res.items[0]).sort()).toEqual(
            ['amount', 'balance_after', 'created_at', 'description', 'feature', 'id', 'type'],
        );
    });
});

describe('CreditHistory', () => {
    it('renders friendly labels, signed amounts and balance after', async () => {
        http.get.mockResolvedValue(page([
            leakyRow('h1'),
            leakyRow('h2', { type: 'usage', amount: -3, feature: 'ats_scan', balance_after: 87 }),
            leakyRow('h3', { type: 'plan_reset', amount: 200, balance_after: 200 }),
            leakyRow('h4', { type: 'something_new', amount: 1 }),
        ]));
        render(<CreditHistory />);
        const rows = await screen.findAllByTestId('credit-history-row');
        expect(rows).toHaveLength(4);
        expect(rows[0]).toHaveTextContent('Bonus from CareerBot team');
        expect(rows[0]).toHaveTextContent('+50');
        expect(rows[0]).toHaveTextContent('Balance 90');
        expect(rows[1]).toHaveTextContent('Used on a feature · ats scan');
        expect(rows[1]).toHaveTextContent('-3');
        expect(rows[2]).toHaveTextContent('Monthly plan reset');
        expect(rows[3]).toHaveTextContent('Adjustment');
    });

    it('never renders admin fields even if present in the response', async () => {
        http.get.mockResolvedValue(page([leakyRow('h1')]));
        const { container } = render(<CreditHistory />);
        await screen.findAllByTestId('credit-history-row');
        const text = container.textContent ?? '';
        for (const secret of ['admin-secret-id', 'boss@careerbot.in', 'VIP escalation', 'idem-secret']) {
            expect(text).not.toContain(secret);
        }
        expect(container.innerHTML).not.toContain('idem-secret');
    });

    it('paginates', async () => {
        http.get.mockResolvedValue(page([leakyRow('h1')], 41));
        render(<CreditHistory />);
        await screen.findByText('1/3');
        fireEvent.click(screen.getByRole('button', { name: 'Next credit history page' }));
        await waitFor(() =>
            expect(http.get).toHaveBeenLastCalledWith('/credits/history', { params: { page: 2, page_size: 20 } }),
        );
    });

    it('ignores a stale response: two page requests resolved in reverse order render only the newest (Codex P2)', async () => {
        const resolvers: Array<(v: unknown) => void> = [];
        http.get.mockImplementation(() => new Promise((r) => { resolvers.push(r); }));
        // StrictMode double-runs the mount effect -> two concurrent page-1 requests.
        render(<React.StrictMode><CreditHistory /></React.StrictMode>);
        await waitFor(() => expect(resolvers.length).toBeGreaterThanOrEqual(2));
        const last = resolvers.length - 1;
        resolvers[last](page([leakyRow('new', { type: 'refund', amount: 7 })]));
        expect(await screen.findByText('Refund')).toBeInTheDocument();
        for (let i = last - 1; i >= 0; i--) resolvers[i](page([leakyRow(`old-${i}`, { type: 'purchase', amount: 999 })]));
        await new Promise((r) => setTimeout(r, 20));
        expect(screen.queryByText('Credit purchase')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('credit-history-row')).toHaveLength(1);
    });

    it('shows the empty state', async () => {
        http.get.mockResolvedValue(page([], 0));
        render(<CreditHistory />);
        expect(await screen.findByText('No credit history yet')).toBeInTheDocument();
    });

    it('shows an error with retry', async () => {
        http.get.mockRejectedValueOnce(new Error('boom'));
        render(<CreditHistory />);
        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your credit history");
        expect(screen.queryByText('No credit history yet')).not.toBeInTheDocument();
        http.get.mockResolvedValueOnce(page([leakyRow('h1')]));
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(await screen.findAllByTestId('credit-history-row')).toHaveLength(1);
    });
});
