import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveSessionToStorage,
  capSessionsPerOwner,
  CHAT_SESSIONS_STORAGE_KEY,
  type ChatSession,
} from '@/app/(ai)/chatbot/_components/ChatApp';

/**
 * Regression coverage for two P1 privacy bugs in the chatbot's localStorage
 * session persistence:
 *
 *   1. saveSessionToStorage used to merge into the current (already
 *      owner-filtered) React state instead of the full stored set, so
 *      saving User B's session silently deleted User A's sessions that
 *      were also cached on the same device.
 *   2. Sessions were tagged/filtered using a fake guest-bootstrapped
 *      localStorage value instead of the real authenticated identity,
 *      so two different real accounts on a shared device could see each
 *      other's history.
 *
 * These tests exercise the storage layer directly (no component render
 * needed — saveSessionToStorage/capSessionsPerOwner are pure module-level
 * functions) with a same-device, two-user scenario matching the reported bug.
 */

const session = (overrides: Partial<ChatSession>): ChatSession => ({
  id: overrides.id ?? 'session-1',
  title: overrides.title ?? 'Title',
  date: overrides.date ?? new Date('2026-01-01T00:00:00.000Z'),
  preview: overrides.preview ?? 'Preview',
  messages: overrides.messages,
  userEmail: overrides.userEmail,
});

beforeEach(() => {
  localStorage.clear();
});

describe('saveSessionToStorage — cross-account isolation on a shared device', () => {
  it('does not delete another account\'s sessions when a different user saves one', () => {
    const userA = session({ id: 'a-1', userEmail: 'alice@example.com' });
    saveSessionToStorage(userA, 'alice@example.com');

    // A different account, on the same browser, saves their own session.
    const userB = session({ id: 'b-1', userEmail: 'bob@example.com' });
    saveSessionToStorage(userB, 'bob@example.com');

    const stored: ChatSession[] = JSON.parse(localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY) || '[]');
    const ids = stored.map((s) => s.id);
    expect(ids).toContain('a-1');
    expect(ids).toContain('b-1');
  });

  it('only returns the saving user\'s own sessions for React state, never another account\'s', () => {
    saveSessionToStorage(session({ id: 'a-1', userEmail: 'alice@example.com' }), 'alice@example.com');

    const visibleToBob = saveSessionToStorage(session({ id: 'b-1', userEmail: 'bob@example.com' }), 'bob@example.com');

    expect(visibleToBob.map((s) => s.id)).toEqual(['b-1']);
    expect(visibleToBob.some((s) => s.userEmail === 'alice@example.com')).toBe(false);
  });

  it('does not persist a guest session to localStorage at all', () => {
    saveSessionToStorage(session({ id: 'guest-1' }), null);
    expect(localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY)).toBeNull();
  });

  it('upserts by id instead of creating a duplicate when the same session is saved again', () => {
    saveSessionToStorage(session({ id: 's-1', title: 'First save', userEmail: 'alice@example.com' }), 'alice@example.com');
    saveSessionToStorage(session({ id: 's-1', title: 'Second save', userEmail: 'alice@example.com' }), 'alice@example.com');

    const stored: ChatSession[] = JSON.parse(localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY) || '[]');
    const matches = stored.filter((s) => s.id === 's-1');
    expect(matches).toHaveLength(1);
    expect(matches[0].title).toBe('Second save');
  });
});

describe('capSessionsPerOwner', () => {
  it('caps each owner independently instead of one account crowding out another', () => {
    const sessions: ChatSession[] = [
      session({ id: 'a-1', userEmail: 'alice@example.com' }),
      session({ id: 'a-2', userEmail: 'alice@example.com' }),
      session({ id: 'a-3', userEmail: 'alice@example.com' }),
      session({ id: 'b-1', userEmail: 'bob@example.com' }),
    ];

    const capped = capSessionsPerOwner(sessions, 2);

    expect(capped.filter((s) => s.userEmail === 'alice@example.com')).toHaveLength(2);
    expect(capped.filter((s) => s.userEmail === 'bob@example.com')).toHaveLength(1);
  });
});

describe('saveSessionToStorage — a failed write must not blank the History list', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('still returns the saving user\'s visible sessions when localStorage.setItem throws', () => {
    // One session already persisted successfully.
    saveSessionToStorage(session({ id: 'a-1', userEmail: 'alice@example.com' }), 'alice@example.com');

    // The next write fails (quota exceeded / storage blocked in private mode).
    // Spy on the localStorage INSTANCE, not Storage.prototype: jsdom's
    // localStorage does not delegate to the prototype method, so a
    // Storage.prototype spy is never invoked and the test would be inert.
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('exceeded the quota', 'QuotaExceededError');
    });

    const visible = saveSessionToStorage(
      session({ id: 'a-2', userEmail: 'alice@example.com' }),
      'alice@example.com',
    );

    // Returning [] here would be assigned straight into chatSessions state and
    // wipe the user's History tab even though a-1 is still on disk.
    expect(setItemSpy).toHaveBeenCalled(); // the failure path really ran

    const ids = visible.map((s) => s.id);
    expect(ids).toContain('a-1');
    expect(ids).toContain('a-2');
    expect(visible.every((s) => s.userEmail === 'alice@example.com')).toBe(true);
  });
});
