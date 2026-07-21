/**
 * Unit tests for AdminDetailsModal — SUPER_ADMIN access-control gating
 *
 * Covers:
 *   - Non-SUPER_ADMIN users do not see Change Role, Change Status, or Reset Password
 *   - SUPER_ADMIN users see all three action buttons
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAdminDetails = vi.fn();

vi.mock('@/api/adminManagementApi', () => ({
    getAdminDetails: (...args: unknown[]) => mockGetAdminDetails(...args),
    updateAdminRole: vi.fn(),
    updateAdminStatus: vi.fn(),
    resetAdminPassword: vi.fn(),
}));

const mockRoleHolder = vi.hoisted(() => ({ userRole: 'ADMIN', loading: false }));
vi.mock('@/app/admin/_hooks/useAdminAccess', () => ({
    useAdminAccess: () => ({ userRole: mockRoleHolder.userRole, loading: mockRoleHolder.loading }),
}));

vi.mock('@/app/admin/_utils/apiError', () => ({
    extractApiError: (_e: unknown, fallback: string) => fallback,
}));

vi.mock('@/app/admin/_utils/formatDate', () => ({
    formatDateTime: (date: string | null) => date ?? 'N/A',
}));

vi.mock('@/app/admin/_components/SlidePanel', () => ({
    SlidePanel: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'slide-panel' }, children),
}));

vi.mock('@/components/common/CustomDropdown', () => ({
    default: ({ label }: { label?: string }) =>
        React.createElement('div', { 'data-testid': 'dropdown' }, label),
}));

vi.mock('@/lib/logger', () => {
    const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
    return { default: mock, logger: mock };
});

// ─── Component under test ─────────────────────────────────────────────────────

import AdminDetailsModal from '@/app/admin/dashboard/admin-management/_components/AdminDetailsModal';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAdmin = {
    id: 'admin-1',
    email: 'admin@test.com',
    username: 'testadmin',
    full_name: 'Test Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    totp_enabled: false,
    last_login: null,
    created_at: '2024-01-01T00:00:00Z',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminDetailsModal — SUPER_ADMIN button gating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAdminDetails.mockResolvedValue(mockAdmin);
        mockRoleHolder.userRole = 'ADMIN';
    });

    it('hides Change Role, Change Status, and Reset Password for a non-SUPER_ADMIN', async () => {
        mockRoleHolder.userRole = 'ADMIN';
        render(<AdminDetailsModal adminId="admin-1" onClose={vi.fn()} />);

        await waitFor(() => expect(screen.getByText('Test Admin')).toBeInTheDocument());

        expect(screen.queryByRole('button', { name: /change role/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /change status/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /reset password/i })).not.toBeInTheDocument();
    });

    it('shows Change Role, Change Status, and Reset Password for SUPER_ADMIN', async () => {
        mockRoleHolder.userRole = 'SUPER_ADMIN';
        render(<AdminDetailsModal adminId="admin-1" onClose={vi.fn()} />);

        await waitFor(() => expect(screen.getByText('Test Admin')).toBeInTheDocument());

        expect(screen.getByRole('button', { name: /change role/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /change status/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });
});
