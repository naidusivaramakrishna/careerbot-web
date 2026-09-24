/**
 * useUserManagement.handleExport — the error path must dismiss the
 * "Preparing export..." loading toast and show the failure toast.
 * (toastId was declared inside `try`, so the `catch` threw ReferenceError.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

const mockGetUserList = vi.fn();
const mockExportUsers = vi.fn();

vi.mock('@/api/userManagementApi', () => ({
  getUserList: (...args: unknown[]) => mockGetUserList(...args),
  exportUsers: (...args: unknown[]) => mockExportUsers(...args),
  downloadExportedFile: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const l = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { logger: l, default: l };
});

import { useUserManagement } from '@/app/admin/dashboard/user-management/_hooks/useUserManagement';

describe('useUserManagement handleExport', () => {
  beforeEach(() => {
    vi.mocked(toast.loading).mockReturnValue('export-toast');
    // initial list fetch on mount
    mockGetUserList.mockResolvedValue({ users: [], total: 0, total_pages: 1, page: 1 });
  });

  it('dismisses the loading toast and reports the failure when the export request rejects', async () => {
    const { result } = renderHook(() => useUserManagement());
    await waitFor(() => expect(mockGetUserList).toHaveBeenCalled());

    mockGetUserList.mockResolvedValueOnce({ users: [], total: 5, total_pages: 1, page: 1 });
    mockExportUsers.mockRejectedValueOnce(new Error('network down'));

    await act(async () => {
      await result.current.handleExport('csv');
    });

    expect(toast.dismiss).toHaveBeenCalledWith('export-toast');
    expect(toast.error).toHaveBeenCalledWith('Failed to export users');
  });
});
