/**
 * useUserManagement.handleExport — every exit path must dismiss its own
 * "Preparing export..." loading toast (by id, not every toast):
 *   - export request rejects -> failure toast
 *   - count above the 10,000-row limit -> limit error, no export request
 *   - success (including exactly 10,000 rows) -> file downloaded, row-count toast
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

const mockGetUserList = vi.fn();
const mockExportUsers = vi.fn();
const mockDownloadExportedFile = vi.fn();

vi.mock('@/api/userManagementApi', () => ({
  getUserList: (...args: unknown[]) => mockGetUserList(...args),
  exportUsers: (...args: unknown[]) => mockExportUsers(...args),
  downloadExportedFile: (...args: unknown[]) => mockDownloadExportedFile(...args),
}));

vi.mock('@/lib/logger', () => {
  const l = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { logger: l, default: l };
});

import { useUserManagement } from '@/app/admin/dashboard/user-management/_hooks/useUserManagement';

describe('useUserManagement handleExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  const exportWithTotal = async (total: number) => {
    const { result } = renderHook(() => useUserManagement());
    await waitFor(() => expect(mockGetUserList).toHaveBeenCalled());
    mockGetUserList.mockResolvedValueOnce({ users: [], total, total_pages: 1, page: 1 });
    await act(async () => {
      await result.current.handleExport('csv');
    });
  };

  it('refuses an export above 10,000 rows without calling the export endpoint', async () => {
    await exportWithTotal(10001);

    expect(mockExportUsers).not.toHaveBeenCalled();
    expect(mockDownloadExportedFile).not.toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalledWith('export-toast');
    expect(toast.error).toHaveBeenCalledWith(
      `Export limited to 10,000 rows. Found ${(10001).toLocaleString()} total users. Please refine filters.`,
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('exports, downloads and reports the row count on success', async () => {
    const blob = new Blob(['id,email\n']);
    mockExportUsers.mockResolvedValueOnce(blob);

    await exportWithTotal(5);

    expect(mockExportUsers).toHaveBeenCalledWith({ page: 1, page_size: 10000 }, 'csv');
    expect(mockDownloadExportedFile).toHaveBeenCalledWith(blob, 'csv');
    expect(toast.dismiss).toHaveBeenCalledWith('export-toast');
    expect(toast.success).toHaveBeenCalledWith('Users exported as CSV (5 rows)');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('still exports at exactly 10,000 rows (the limit is inclusive)', async () => {
    mockExportUsers.mockResolvedValueOnce(new Blob(['x']));

    await exportWithTotal(10000);

    expect(mockExportUsers).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Users exported as CSV (10000 rows)');
    expect(toast.error).not.toHaveBeenCalled();
  });
});
