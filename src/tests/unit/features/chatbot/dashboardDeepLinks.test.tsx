import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * The dashboard Support History page's two deep links into the chatbot
 * widget that aren't covered elsewhere:
 *
 *  - ?chat_session=<id> -- "Continue conversation". Shares its happy path with
 *    the History-tab click (see chatAppBackendSessions.test.tsx), but a
 *    CLOSED session has no live conversation to continue -- a follow-up
 *    message into one 409s -- so this covers that it's shown read-only
 *    instead of reactivated as the session new messages would post into.
 *
 *  - ?chat=new -- "New Conversation". Opens the widget onto a fresh chat;
 *    not covered anywhere else.
 */

Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

let mockAuthenticated = true;
vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => mockAuthenticated,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

const getProfile = vi.fn();
vi.mock('@/api/userApi', () => ({
  getProfile: (...args: unknown[]) => getProfile(...args),
}));

const getChatSession = vi.fn();
const sendSessionMessage = vi.fn();
const createChatSession = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: vi.fn(),
  escalateToSupport: vi.fn(),
  uploadTicketAttachment: vi.fn(),
  getSupportTickets: vi.fn().mockResolvedValue({ data: [] }),
  getTicketDetails: vi.fn(),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: (...args: unknown[]) => createChatSession(...args),
  sendSessionMessage: (...args: unknown[]) => sendSessionMessage(...args),
  getChatSessionHistory: vi.fn().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] }),
  getChatSession: (...args: unknown[]) => getChatSession(...args),
}));

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';

beforeEach(() => {
  mockAuthenticated = true;
  getProfile.mockReset().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
  getChatSession.mockReset();
  sendSessionMessage.mockReset();
  createChatSession.mockReset().mockResolvedValue({
    session_id: 'new-sess', user_id: 'user-1', status: 'active',
    created_at: '2026-01-01T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  window.history.pushState(null, '', '/chatbot');
});

describe('?chat_session= deep link -- a closed conversation', () => {
  it('shows the transcript read-only, with a closed notice, instead of reactivating it as the live session', async () => {
    window.history.pushState(null, '', '/chatbot?chat_session=closed-sess-1');
    getChatSession.mockResolvedValue({
      session_id: 'closed-sess-1',
      user_id: 'user-1',
      status: 'closed',
      created_at: '2026-01-01T00:00:00Z',
      title: 'Old question',
      preview: 'preview',
      message_count: 2,
      messages: [
        { message_id: 'm1', role: 'user', content: 'Why was I charged twice?', timestamp: '2026-01-01T00:00:00Z' },
        { message_id: 'm2', role: 'assistant', content: 'That has been refunded.', timestamp: '2026-01-01T00:01:00Z' },
      ],
    });

    render(<ChatApp />);

    expect(await screen.findByText('Why was I charged twice?')).toBeInTheDocument();
    expect(await screen.findByText(/This conversation is closed/i)).toBeInTheDocument();
  });

  it('a still-active session restores normally, with the ordinary restored notice', async () => {
    window.history.pushState(null, '', '/chatbot?chat_session=active-sess-1');
    getChatSession.mockResolvedValue({
      session_id: 'active-sess-1',
      user_id: 'user-1',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      title: 'Still going',
      preview: 'preview',
      message_count: 1,
      messages: [
        { message_id: 'm1', role: 'user', content: 'Can I change my plan?', timestamp: '2026-01-01T00:00:00Z' },
      ],
    });

    render(<ChatApp />);

    expect(await screen.findByText('Can I change my plan?')).toBeInTheDocument();
    expect(screen.queryByText(/This conversation is closed/i)).not.toBeInTheDocument();
  });

  it('still fetches after a sign-out/sign-in round trip, not just on the very first login', async () => {
    // Regression guard for the fix above (generation-bound deep link): a
    // logout bumps accountGeneration (see ChatApp.tsx's "Logout detected"
    // branch), which must NOT be mistaken for "a later account's re-run"
    // the next time this exact same deep link becomes authenticated again
    // -- otherwise a sign-out/sign-in cycle permanently breaks it.
    mockAuthenticated = false;
    window.history.pushState(null, '', '/chatbot?chat_session=active-sess-1');
    getChatSession.mockResolvedValue({
      session_id: 'active-sess-1', user_id: 'user-1', status: 'active',
      created_at: '2026-01-01T00:00:00Z', title: 'Still going', preview: 'preview', message_count: 1,
      messages: [{ message_id: 'm1', role: 'user', content: 'Can I change my plan?', timestamp: '2026-01-01T00:00:00Z' }],
    });

    render(<ChatApp />);
    expect(await screen.findByText('Log in to continue')).toHaveAttribute(
      'href', `/?showLogin=true&next=${encodeURIComponent('/chatbot?chat_session=active-sess-1')}`);

    mockAuthenticated = true;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await waitFor(() => expect(getChatSession).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Can I change my plan?')).toBeInTheDocument();

    mockAuthenticated = false;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await screen.findByText('Log in to continue');

    mockAuthenticated = true;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    await waitFor(() => expect(getChatSession).toHaveBeenCalledTimes(2));
  });
});

describe('?chat_session= deep link -- account switches while the restore is in flight', () => {
  it('does not restore the old account\'s session if the account switches before getChatSession resolves', async () => {
    window.history.pushState(null, '', '/chatbot?chat_session=alice-sess-1');

    // getChatSession deliberately never auto-resolves -- held open so the
    // test controls exactly when (relative to the account switch) it does.
    let resolveGetChatSession!: (value: unknown) => void;
    getChatSession.mockReturnValue(new Promise((resolve) => { resolveGetChatSession = resolve; }));

    render(<ChatApp />);
    await waitFor(() => expect(getChatSession).toHaveBeenCalledWith('alice-sess-1'));
    // checkAuthStatus's own first check must have resolved and recorded
    // Alice as the known baseline BEFORE the switch below -- otherwise
    // this becomes the first-ever check, which silently adopts whatever
    // email it sees as the baseline instead of detecting a switch.
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    // The switch happens here, while the fetch above is still pending.
    getProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    // checkAuthStatus's switch branch reloads the new account's profile
    // asynchronously (its own second getProfile call) before it bumps
    // accountGeneration's dependents -- wait for that to actually land
    // (header now says Bob) rather than guessing at a tick count.
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    // Bob's generation never belonged to this deep link -- the effect
    // must not re-fetch it a second time under his account.
    expect(getChatSession).toHaveBeenCalledTimes(1);

    // Only now does Alice's session detail arrive -- stale by this point.
    await act(async () => {
      resolveGetChatSession({
        session_id: 'alice-sess-1',
        user_id: 'user-1',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        title: "Alice's conversation",
        preview: 'preview',
        message_count: 1,
        messages: [
          { message_id: 'm1', role: 'user', content: "Alice's message", timestamp: '2026-01-01T00:00:00Z' },
        ],
      });
    });

    // The stale response must not land: not shown, and not adopted as the
    // active session (which would route Bob's next message into it).
    expect(screen.queryByText("Alice's message")).not.toBeInTheDocument();

    // Bob sending a message must create his own session, never post into
    // Alice's session id -- confirms the stale response wasn't silently
    // adopted as the active session either.
    createChatSession.mockResolvedValueOnce({
      session_id: 'bob-sess-1', user_id: 'user-2', status: 'active',
      created_at: '2026-01-01T00:02:00Z', title: 'New Chat', preview: '', message_count: 0,
    });
    sendSessionMessage.mockResolvedValueOnce({
      message_id: 'm2', session_id: 'bob-sess-1', content: 'Reply', timestamp: '2026-01-01T00:03:00Z',
      role: 'assistant', category: 'general', confidence: 0.9, requires_escalation: false,
    });
    await act(async () => {
      const input = screen.getByPlaceholderText('Type your question...');
      fireEvent.change(input, { target: { value: "Bob's message" } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
    expect(sendSessionMessage).not.toHaveBeenCalledWith('alice-sess-1', expect.anything());
    expect(sendSessionMessage).toHaveBeenCalledWith('bob-sess-1', "Bob's message");
  });
});

describe('?session= on a non-chat page (cover-letter extension hand-off)', () => {
  it('is ignored: no chat session fetch, no error message', async () => {
    window.history.pushState(null, '', '/cover-letter/new?session=ext-handoff-1');
    render(<ChatApp />);
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    expect(screen.getByLabelText('Chatbot Support')).toBeInTheDocument(); // still minimized
    expect(getChatSession).not.toHaveBeenCalled();
    expect(screen.queryByText(/couldn't load that conversation/i)).not.toBeInTheDocument();
  });
});

describe('?chat=new deep link', () => {
  it('opens the widget onto a fresh conversation, not any prior session', async () => {
    window.history.pushState(null, '', '/chatbot?chat=new');

    render(<ChatApp />);

    await waitFor(() => {
      expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
    });
    expect(createChatSession).not.toHaveBeenCalled();
    expect(getChatSession).not.toHaveBeenCalled();
  });

  it('fires startNewChat exactly once, not on every re-render', async () => {
    window.history.pushState(null, '', '/chatbot?chat=new');

    render(<ChatApp />);
    await waitFor(() => {
      expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
    });

    // A state change elsewhere (auth re-check tick) re-runs effects; the
    // welcome message must not be reset a second time by this deep link.
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(screen.getAllByText(/How can I help you today/i)).toHaveLength(1);
  });
});
