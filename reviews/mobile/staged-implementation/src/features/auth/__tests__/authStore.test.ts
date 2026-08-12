// Basic Zustand authStore behavior tests.

import { useAuthStore } from '../authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('starts unsigned-in', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isSignedIn).toBe(false);
    expect(state.isHydrated).toBe(false);
  });

  it('setSession marks isSignedIn when accessToken present', () => {
    useAuthStore.getState().setSession({
      accessToken: 'tok',
      refreshToken: 'ref',
      tokenType: 'bearer',
      expiresAt: Date.now() + 3600_000,
      username: 'alice',
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('tok');
    expect(state.refreshToken).toBe('ref');
    expect(state.isSignedIn).toBe(true);
    expect(state.username).toBe('alice');
  });

  it('reset clears all but isHydrated', () => {
    useAuthStore.getState().setSession({
      accessToken: 'tok',
      refreshToken: 'ref',
      tokenType: 'bearer',
      expiresAt: Date.now() + 3600_000,
      username: 'alice',
    });
    useAuthStore.getState().markHydrated();
    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isSignedIn).toBe(false);
    // CRITICAL: isHydrated must REMAIN true (the doc says "once hydrated, we don't un-hydrate").
    expect(state.isHydrated).toBe(true);
  });

  it('subscribeWithSelector fires when expiresAt changes', () => {
    const listener = jest.fn();
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.expiresAt,
      listener,
    );

    useAuthStore.getState().setSession({
      accessToken: 'tok',
      refreshToken: 'ref',
      tokenType: 'bearer',
      expiresAt: 12345,
      username: 'alice',
    });

    expect(listener).toHaveBeenCalledWith(12345, null);
    unsubscribe();
  });
});
