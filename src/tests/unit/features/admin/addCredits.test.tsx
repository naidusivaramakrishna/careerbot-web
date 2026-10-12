/**
 * SUPER_ADMIN "Add credits" — balance display, role gating, dialog
 * validation, confirmation maths, error mapping, idempotency-key lifecycle,
 * double-submit guard, and the user-details modal wiring.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, configure } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const api = vi.hoisted(() => ({
    addUserCredits: vi.fn(),
    getAdminUserCreditHistory: vi.fn(),
}));

vi.mock('@/api/adminCreditsApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/api/adminCreditsApi')>();
    return { ...actual, ...api };
});

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/lib/logger', () => {
    const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
    return { default: mock, logger: mock };
});

const uuid = vi.hoisted(() => ({ n: 0 }));
vi.mock('@/lib/idempotencyKey', () => ({
    randomUuid: () => `key-${++uuid.n}`,
}));

const role = vi.hoisted(() => ({ userRole: 'SUPER_ADMIN' as string | null }));
vi.mock('@/app/admin/_hooks/useAdminAccess', () => ({
    useAdminAccess: () => ({ userRole: role.userRole, loading: false, hasAccess: true, requiredRoles: [], error: null }),
}));

vi.mock('@/app/admin/_components/SlidePanel', () => ({
    SlidePanel: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'slide-panel' }, children),
}));

const userDetails = vi.hoisted(() => ({ activeTab: 'Subscription', setActiveTab: vi.fn() }));
vi.mock('@/app/admin/dashboard/user-management/_hooks/useUserDetails', () => ({
    useUserDetails: () => ({
        user: {
            id: 'u-1', email: 'jane@example.com', username: 'jane', full_name: 'Jane Doe',
            phone: null, location: null, role: 'user', status: 'active',
            joined_at: '2026-01-01T00:00:00Z', last_login: null, subscription: null,
            resumes: [], payments: [], activity: [],
        },
        activities: [],
        loading: false,
        actionLoading: false,
        activeTab: userDetails.activeTab,
        setActiveTab: userDetails.setActiveTab,
        handleUpdateUser: vi.fn(),
        handleSuspendUser: vi.fn(),
        handleUnsuspendUser: vi.fn(),
        handleDeleteUser: vi.fn(),
        fetchUserDetails: vi.fn(),
    }),
}));

// ─── Under test ───────────────────────────────────────────────────────────────

import { UserCreditsSection } from '@/app/admin/dashboard/user-management/_components/user-details/UserCreditsSection';
import UserDetailsModal from '@/app/admin/dashboard/user-management/_components/user-details/UserDetailsModal';
import { describeAddCreditsError } from '@/api/adminCreditsApi';

// Generous async timeout: these suites render a full dialog flow and run
// alongside ~300 other files in CI.
configure({ asyncUtilTimeout: 5000 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const okResponse = (added: number, prev = 40) => ({
    message: 'ok', user_id: 'u-1', credits_added: added,
    previous_balance: prev, new_balance: prev + added, idempotent_replay: false,
});

// Backend error envelope: {"success": false, "error": {message, error_code, ..., details?}}
const httpError = (status: number, error_code?: string, details?: unknown, message = 'fail') =>
    Object.assign(new Error(message), {
        response: {
            status,
            data: { success: false, error: { message, error_code, error_id: 'e1', request_id: 'r1', timestamp: 't', path: '/p', details } },
        },
    });

async function renderSection(canAddCredits = true) {
    render(<UserCreditsSection userId="u-1" userLabel="Jane Doe" canAddCredits={canAddCredits} />);
    if (canAddCredits) await screen.findByText('40 remaining / 200 total');
}

function openAndFill(amount: string, reason: string) {
    fireEvent.click(screen.getByRole('button', { name: /add credits/i }));
    fireEvent.change(screen.getByLabelText('Credits to add'), { target: { value: amount } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: reason } });
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
}

beforeEach(() => {
    vi.clearAllMocks();
    uuid.n = 0;
    role.userRole = 'SUPER_ADMIN';
    userDetails.activeTab = 'Subscription';
    api.getAdminUserCreditHistory.mockResolvedValue({
        items: [], page: 1, page_size: 1, total: 0,
        balance: { credits_remaining: 40, credits_total: 200 },
    });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserCreditsSection', () => {
    it('shows remaining / total credits', async () => {
        await renderSection();
        expect(screen.getByTestId('user-credits-balance')).toHaveTextContent('Credits:40 remaining / 200 total');
        // balance comes from credit-history (users collection), not /usage
        expect(api.getAdminUserCreditHistory).toHaveBeenCalledWith('u-1', 1, 1);
    });

    it('hides the Add credits button when not super admin', async () => {
        await renderSection(false);
        expect(screen.queryByRole('button', { name: /add credits/i })).not.toBeInTheDocument();
        // SUPER_ADMIN-only endpoint is not called for other roles
        expect(api.getAdminUserCreditHistory).not.toHaveBeenCalled();
        expect(screen.getByTestId('user-credits-balance')).toHaveTextContent('Visible to super admins only');
    });

    it('validates amount and reason before confirmation', async () => {
        await renderSection();
        openAndFill('0', 'ab');
        expect(screen.getByText('Credits must be between 1 and 5000.')).toBeInTheDocument();
        expect(screen.getByText('Reason must be at least 3 characters.')).toBeInTheDocument();
        // error text is associated with its input
        const amount = screen.getByLabelText('Credits to add');
        expect(amount).toHaveAttribute('aria-invalid', 'true');
        expect(amount).toHaveAccessibleDescription('Credits must be between 1 and 5000.');

        fireEvent.change(amount, { target: { value: '5001' } });
        expect(screen.getByText('Credits must be between 1 and 5000.')).toBeInTheDocument();
        fireEvent.change(amount, { target: { value: '2.5' } });
        expect(screen.getByText('Credits must be a whole number.')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'x'.repeat(201) } });
        expect(screen.getByText('Reason must be at most 200 characters.')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Reason'), { target: { value: '   ' } });
        expect(screen.getByText('A reason is required.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    });

    it('shows Current X -> New X+amount on the confirmation step', async () => {
        await renderSection();
        openAndFill('25', 'Goodwill credit');
        expect(screen.getByTestId('add-credits-balance-change')).toHaveTextContent('Current 40 -> New 65');
    });

    it('on success updates the balance from new_balance and toasts', async () => {
        api.addUserCredits.mockResolvedValue({ ...okResponse(25), new_balance: 70 });
        await renderSection();
        openAndFill('25', '  Goodwill credit  ');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        await screen.findByText('70 remaining / 225 total');
        expect(api.addUserCredits).toHaveBeenCalledWith('u-1', { credits: 25, reason: 'Goodwill credit' }, 'key-1');
        expect(toastMock.success).toHaveBeenCalledWith('Added 25 credits. New balance: 70.');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows a specific message for 403', async () => {
        api.addUserCredits.mockRejectedValue(httpError(403, 'FORBIDDEN'));
        await renderSection();
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Only a super admin can add credits');
    });

    it('shows the remaining daily allowance for 429', async () => {
        api.addUserCredits.mockRejectedValue(httpError(429, 'ADMIN_DAILY_GRANT_LIMIT_EXCEEDED', { remaining_allowance: 120, daily_limit: 1000, granted_today: 880 }));
        await renderSection();
        openAndFill('500', 'Big grant');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Daily credit grant limit reached (1000/day). You can grant 120 more credits today.');
    });

    it('reuses the Idempotency-Key on retry and mints a new one for a new submission', async () => {
        api.addUserCredits
            .mockRejectedValueOnce(new Error('Network Error')) // no response => retryable
            .mockResolvedValueOnce(okResponse(10))
            .mockResolvedValueOnce(okResponse(5, 50));
        await renderSection();
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        await screen.findByText('50 remaining / 210 total');
        expect(api.addUserCredits.mock.calls[0][2]).toBe('key-1');
        expect(api.addUserCredits.mock.calls[1][2]).toBe('key-1');

        // New submission -> new key
        openAndFill('5', 'Another case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        await screen.findByText('55 remaining / 215 total');
        expect(api.addUserCredits.mock.calls[2][2]).toBe('key-2');
    });

    it('mints a new key after going Back to edit', async () => {
        api.addUserCredits.mockRejectedValueOnce(httpError(422, 'VALIDATION_ERROR', { validation_errors: [{ field: 'reason', message: 'too short' }] }));
        await renderSection();
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request: reason: too short');
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Support case 2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Review' }));
        api.addUserCredits.mockResolvedValueOnce(okResponse(10));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        await screen.findByText('50 remaining / 210 total');
        expect(api.addUserCredits.mock.calls[0][2]).toBe('key-1');
        expect(api.addUserCredits.mock.calls[1][2]).toBe('key-2');
    });

    it('prevents double submit while pending', async () => {
        let resolve!: (v: unknown) => void;
        api.addUserCredits.mockReturnValue(new Promise((r) => { resolve = r; }));
        await renderSection();
        openAndFill('10', 'Support case');
        const confirm = screen.getByRole('button', { name: 'Confirm' });
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        expect(api.addUserCredits).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
        await act(async () => { resolve(okResponse(10)); });
        await screen.findByText('50 remaining / 210 total');
        expect(api.addUserCredits).toHaveBeenCalledTimes(1);
    });

    it('closes on Escape and labels the dialog', async () => {
        await renderSection();
        fireEvent.click(screen.getByRole('button', { name: /add credits/i }));
        const dialog = screen.getByRole('dialog', { name: 'Add credits' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByLabelText('Credits to add')).toHaveFocus();
        fireEvent.keyDown(dialog, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('traps focus inside the dialog', async () => {
        await renderSection();
        fireEvent.click(screen.getByRole('button', { name: /add credits/i }));
        const dialog = screen.getByRole('dialog');
        const cancel = screen.getByRole('button', { name: 'Cancel' });
        cancel.focus();
        fireEvent.keyDown(dialog, { key: 'Tab' });
        expect(screen.getByLabelText('Credits to add')).toHaveFocus();
        fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
        expect(cancel).toHaveFocus();
    });
});

describe('UserCreditsSection — grant failure contract', () => {
    it('CREDIT_GRANT_FAILED is safe to retry and reuses the SAME key (backend resumes the grant)', async () => {
        api.addUserCredits
            .mockRejectedValueOnce(httpError(500, 'CREDIT_GRANT_FAILED', { grant_id: 'g-9' }))
            .mockResolvedValueOnce(okResponse(10));
        await renderSection();
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('The grant did not complete (grant g-9). Retry — it resumes the same grant and will not add credits twice.');
        expect(screen.queryByRole('button', { name: 'Submit again' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        await screen.findByText('50 remaining / 210 total');
        expect(api.addUserCredits.mock.calls[0][2]).toBe('key-1');
        expect(api.addUserCredits.mock.calls[1][2]).toBe('key-1');
    });

    it('CREDIT_GRANT_IN_PROGRESS retries with the SAME key', async () => {
        api.addUserCredits
            .mockRejectedValueOnce(httpError(409, 'CREDIT_GRANT_IN_PROGRESS', { grant_id: 'g-1' }))
            .mockResolvedValueOnce({ ...okResponse(10), idempotent_replay: true });
        await renderSection();
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('still being processed (grant g-1)');
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        await screen.findByText('50 remaining / 210 total');
        expect(api.addUserCredits.mock.calls[1][2]).toBe('key-1');
        expect(toastMock.success).toHaveBeenCalledWith('This grant was already applied. Balance is 50.');
    });

    it('partial grant (CREDIT_GRANT_PARTIAL) is shown as success-with-warning and closes the dialog', async () => {
        api.addUserCredits.mockResolvedValueOnce({ ...okResponse(10), partial_warning: 'Do not retry — check credit history.' });
        await renderSection();
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        await screen.findByText('50 remaining / 210 total');
        expect(toastMock.warning).toHaveBeenCalledWith(expect.stringContaining('Do not retry'));
        expect(toastMock.success).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

describe('UserCreditsSection — stale balance (Codex P1)', () => {
    it('a slow initial balance that resolves AFTER a grant does not overwrite the grant result', async () => {
        let resolveInitial!: (v: unknown) => void;
        api.getAdminUserCreditHistory.mockReturnValueOnce(new Promise((r) => { resolveInitial = r; }));
        api.addUserCredits.mockResolvedValueOnce(okResponse(10, 40));
        render(<UserCreditsSection userId="u-1" userLabel="Jane Doe" canAddCredits />);
        expect(screen.getByTestId('user-credits-balance')).toHaveTextContent('Loading');
        openAndFill('10', 'Support case');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        await screen.findByText('50 remaining / — total');
        await act(async () => {
            resolveInitial({ items: [], page: 1, page_size: 1, total: 0, balance: { credits_remaining: 40, credits_total: 200 } });
        });
        expect(screen.getByTestId('user-credits-balance')).toHaveTextContent('50 remaining / — total');
        expect(screen.queryByText('40 remaining / 200 total')).not.toBeInTheDocument();
    });
});

describe('describeAddCreditsError', () => {
    it('maps the backend error envelope', () => {
        expect(describeAddCreditsError(httpError(404, 'NOT_FOUND', undefined, 'User not found')).message).toMatch(/User not found/);
        expect(describeAddCreditsError(httpError(401)).message).toMatch(/session has expired/);
        expect(describeAddCreditsError(httpError(503))).toMatchObject({ retry: 'same-key' });
        expect(describeAddCreditsError(new Error('Network Error'))).toMatchObject({ retry: 'same-key' });
        expect(describeAddCreditsError(httpError(409, 'IDEMPOTENCY_KEY_REUSED'))).toMatchObject({ retry: 'new-key' });
        expect(describeAddCreditsError(httpError(500, 'CREDIT_GRANT_FAILED', { grant_id: 'g-2' }))).toEqual({
            message: 'The grant did not complete (grant g-2). Retry — it resumes the same grant and will not add credits twice.',
            retry: 'same-key',
        });
        expect(describeAddCreditsError(httpError(409, 'CREDIT_GRANT_IN_PROGRESS'))).toMatchObject({ retry: 'same-key' });
        expect(describeAddCreditsError(httpError(429, 'ADMIN_DAILY_GRANT_LIMIT_EXCEEDED', { remaining_allowance: 1 })).message)
            .toBe('Daily credit grant limit reached. You can grant 1 more credit today.');
        // legacy FastAPI `detail` is NOT the contract — falls back to generic text
        const legacy = Object.assign(new Error('x'), { response: { status: 422, data: { detail: 'legacy' } } });
        expect(describeAddCreditsError(legacy).message).toBe('Invalid request. Check the amount and reason.');
    });
});

describe('UserDetailsModal credit wiring', () => {
    it('super admin sees the Add credits button and Credit history tab', async () => {
        render(<UserDetailsModal userId="u-1" onClose={vi.fn()} />);
        await screen.findByText('40 remaining / 200 total');
        expect(screen.getByRole('button', { name: /add credits/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Credit history' })).toBeInTheDocument();
    });

    it('non-super-admin sees no balance fetch, no Add credits button and no history tab', async () => {
        role.userRole = 'ADMIN';
        render(<UserDetailsModal userId="u-1" onClose={vi.fn()} />);
        await screen.findByText('Visible to super admins only');
        expect(api.getAdminUserCreditHistory).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: /add credits/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Credit history' })).not.toBeInTheDocument();
    });

    it('renders credit history when that tab is active (super admin)', async () => {
        userDetails.activeTab = 'Credit history';
        api.getAdminUserCreditHistory.mockResolvedValue({
            items: [{
                id: 'h1', created_at: '2026-10-01T10:00:00Z', type: 'admin_grant', amount: 50,
                feature: null, balance_after: 90, description: null, admin_id: 'a1',
                admin_email: 'boss@careerbot.in', reason: 'Goodwill', idempotency_key: 'k',
            }],
            page: 1, page_size: 20, total: 1,
            balance: { credits_remaining: 40, credits_total: 200 },
        });
        render(<UserDetailsModal userId="u-1" onClose={vi.fn()} />);
        expect(await screen.findByText('By boss@careerbot.in')).toBeInTheDocument();
        await waitFor(() => expect(api.getAdminUserCreditHistory).toHaveBeenCalledWith('u-1', 1, 20));
    });
});
