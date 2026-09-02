/**
 * Switching colleges must not leave the previous college's rows on screen.
 *
 * The rule is "never render out-of-scope data, even briefly while loading".
 * Before this guard, `run` was memoised on [fetcher, enabled]; the fetchers are
 * `useCallback(..., [])` and selecting a different membership changes neither,
 * so nothing refetched and college A's rows stayed under college B's name.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  setInstitutionSession,
  clearInstitutionSession,
} from '@/lib/institutionSession';
import { useInstitutionResource } from '@/hooks/useInstitutionResource';

function session(institutionId: string) {
  return {
    access_token: `token-for-${institutionId}`,
    token_type: 'bearer',
    institution_id: institutionId,
    role: 'cpo' as const,
    membership_id: `membership-${institutionId}`,
  };
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('useInstitutionResource is keyed by the active college', () => {
  it('refetches when the college changes', async () => {
    setInstitutionSession(session('college-a'));

    const fetcher = vi
      .fn<[], Promise<string[]>>()
      .mockResolvedValueOnce(['a-1', 'a-2'])
      .mockResolvedValueOnce(['b-1']);

    const { result } = renderHook(() => useInstitutionResource(fetcher));

    await waitFor(() => expect(result.current.data).toEqual(['a-1', 'a-2']));
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      setInstitutionSession(session('college-b'));
    });

    await waitFor(() => expect(result.current.data).toEqual(['b-1']));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('never exposes the previous college rows once the college has changed', async () => {
    setInstitutionSession(session('college-a'));

    // College B never resolves, so the ONLY way college A's rows could still be
    // readable is if the switch failed to clear them.
    const fetcher = vi
      .fn<[], Promise<string[]>>()
      .mockResolvedValueOnce(['a-1', 'a-2'])
      .mockImplementationOnce(() => new Promise<string[]>(() => {}));

    const { result } = renderHook(() => useInstitutionResource(fetcher));
    await waitFor(() => expect(result.current.data).toEqual(['a-1', 'a-2']));

    act(() => {
      setInstitutionSession(session('college-b'));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('drops an in-flight response that belongs to the previous college', async () => {
    setInstitutionSession(session('college-a'));

    let resolveA: (rows: string[]) => void = () => {};
    const fetcher = vi
      .fn<[], Promise<string[]>>()
      .mockImplementationOnce(
        () => new Promise<string[]>((resolve) => { resolveA = resolve; }),
      )
      .mockResolvedValueOnce(['b-1']);

    const { result } = renderHook(() => useInstitutionResource(fetcher));

    act(() => {
      setInstitutionSession(session('college-b'));
    });

    // College A answers AFTER the switch. Its rows must be discarded, not
    // written over college B's state.
    await act(async () => {
      resolveA(['a-1', 'a-2']);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.data).toEqual(['b-1']));
    expect(result.current.data).not.toEqual(['a-1', 'a-2']);
  });

  it('clears when the college session is dropped entirely', async () => {
    setInstitutionSession(session('college-a'));
    const fetcher = vi.fn<[], Promise<string[]>>().mockResolvedValue(['a-1']);

    const { result } = renderHook(() => useInstitutionResource(fetcher));
    await waitFor(() => expect(result.current.data).toEqual(['a-1']));

    act(() => {
      clearInstitutionSession();
    });

    expect(result.current.data).toBeNull();
  });

});
