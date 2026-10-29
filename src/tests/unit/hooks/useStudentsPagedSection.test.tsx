/**
 * The section filter must reach the API: useStudentsPaged used to forward
 * every filter except section_id, so the screen filtered nothing (Codex T6).
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const listStudents = vi.hoisted(() => vi.fn());
vi.mock('@/api/institutionApi', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/api/institutionApi')>();
  return { ...real, listStudents };
});

import { useStudentsPaged } from '@/hooks/useInstitutionResource';

describe('useStudentsPaged', () => {
  it('forwards section_id to listStudents', async () => {
    listStudents.mockResolvedValue({ items: [], total: 0, skip: 0, limit: 100 });
    renderHook(() => useStudentsPaged({ department_id: 'cse', section_id: 'sec-a', limit: 100 }));
    await waitFor(() => expect(listStudents).toHaveBeenCalled());
    expect(listStudents.mock.calls[0][0]).toMatchObject({
      department_id: 'cse', section_id: 'sec-a', limit: 100,
    });
  });
});
