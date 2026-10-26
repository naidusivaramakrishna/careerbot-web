import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * ChatApp's migration from the stateless POST /chat/message + localStorage
 * archiving to persisted MongoDB sessions (POST /chat/sessions,
 * POST /chat/sessions/{id}/messages, GET /chat/sessions/history,
 * GET /chat/sessions/{id}).
 *
 * Guests must be completely unaffected -- they keep using sendChatMessage(),
 * confirmed by asserting createChatSession/sendSessionMessage are never
 * called in the guest tests below. chatSessionStorage.test.ts separately
 * covers that the legacy localStorage mechanism itself still works
 * unchanged; this file covers the NEW wiring on top of it.
 */

// jsdom doesn't implement Element.scrollTo; ChatApp calls it on every
// messages-change effect (scrollToBottom), which otherwise throws and tears
// down the whole render before any assertion runs.
Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

let mockAuthenticated = true;

vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => mockAuthenticated,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' }),
}));

const createChatSession = vi.fn();
const sendSessionMessage = vi.fn();
const getChatSessionHistory = vi.fn();
const getChatSession = vi.fn();
const sendChatMessage = vi.fn();
const deleteChatSession = vi.fn();
const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });
const cancelTicket = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: vi.fn(),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  cancelTicket: (...args: unknown[]) => cancelTicket(...args),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: (...args: unknown[]) => createChatSession(...args),
  sendSessionMessage: (...args: unknown[]) => sendSessionMessage(...args),
  getChatSessionHistory: (...args: unknown[]) => getChatSessionHistory(...args),
  getChatSession: (...args: unknown[]) => getChatSession(...args),
  deleteChatSession: (...args: unknown[]) => deleteChatSession(...args),
}));

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';
import { getProfile } from '@/api/userApi';

const openWidget = async () => {
  render(<ChatApp />);
  const toggle = screen.getByTitle('Chatbot Support');
  await act(async () => {
    fireEvent.click(toggle);
  });
  // Welcome message only appears once initializeApp's async chain resolves.
  await waitFor(() => {
    expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
  });
};

const sendMessage = async (text: string) => {
  const input = screen.getByPlaceholderText('Type your question...');
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });
};

beforeEach(() => {
  localStorage.clear();
  mockAuthenticated = true;
  vi.mocked(getProfile).mockReset().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
  getSupportTickets.mockReset().mockResolvedValue({ data: [] });
  deleteChatSession.mockReset().mockResolvedValue(undefined);
  createChatSession.mockReset().mockResolvedValue({
    session_id: 'backend-sess-1',
    user_id: 'user-1',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    title: 'New Chat',
    preview: 'New conversation...',
    message_count: 0,
  });
  sendSessionMessage.mockReset().mockResolvedValue({
    message_id: 'msg-2',
    session_id: 'backend-sess-1',
    content: 'Here is the answer.',
    timestamp: '2026-01-01T00:01:00Z',
    role: 'assistant',
    category: 'general',
    confidence: 0.9,
    requires_escalation: false,
  });
  getChatSessionHistory.mockReset().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] });
  getChatSession.mockReset();
  sendChatMessage.mockReset().mockResolvedValue({
    session_id: 'session',
    message: 'hi',
    answer: 'Guest answer.',
    category: 'general',
    authenticated: false,
    requires_escalation: false,
    confidence: 0.9,
    timestamp: '2026-01-01T00:00:00Z',
  });
});

describe('ChatApp — authenticated users get a persisted backend session', () => {
  it('does not create a backend session just from opening the widget', async () => {
    await openWidget();
    expect(createChatSession).not.toHaveBeenCalled();
  });

  it('creates exactly one backend session on the first message, and stores its id', async () => {
    await openWidget();
    await sendMessage('I forgot my password');

    await waitFor(() => expect(createChatSession).toHaveBeenCalledTimes(1));
    expect(sendSessionMessage).toHaveBeenCalledWith('backend-sess-1', 'I forgot my password');
  });

  it('reuses the same backend session for a second and third message', async () => {
    await openWidget();
    await sendMessage('first question');
    await waitFor(() => expect(createChatSession).toHaveBeenCalledTimes(1));

    await sendMessage('second question');
    await sendMessage('third question');

    // Only ever created once, even though three messages were sent.
    expect(createChatSession).toHaveBeenCalledTimes(1);
    expect(sendSessionMessage).toHaveBeenNthCalledWith(1, 'backend-sess-1', 'first question');
    expect(sendSessionMessage).toHaveBeenNthCalledWith(2, 'backend-sess-1', 'second question');
    expect(sendSessionMessage).toHaveBeenNthCalledWith(3, 'backend-sess-1', 'third question');
  });

  it('sends a message via the backend session endpoint, not the stateless one', async () => {
    await openWidget();
    await sendMessage('I forgot my password');

    await waitFor(() => {
      expect(sendSessionMessage).toHaveBeenCalledWith('backend-sess-1', 'I forgot my password');
    });
    expect(sendChatMessage).not.toHaveBeenCalled();
    expect(await screen.findByText('Here is the answer.')).toBeInTheDocument();
  });

  it('loads the History tab from the backend', async () => {
    getChatSessionHistory.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 20,
      sessions: [{
        session_id: 'backend-sess-old',
        user_id: 'user-1',
        status: 'active',
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:05:00Z',
        title: 'Old conversation about billing',
        preview: 'Here is how billing works...',
        message_count: 4,
      }],
    });

    await openWidget();
    const historyTab = screen.getByText('💬 History');
    await act(async () => {
      fireEvent.click(historyTab);
    });

    expect(await screen.findByText('Old conversation about billing')).toBeInTheDocument();
  });

  it('opening a previous backend conversation restores its full transcript', async () => {
    getChatSessionHistory.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 20,
      sessions: [{
        session_id: 'backend-sess-old',
        user_id: 'user-1',
        status: 'active',
        created_at: '2025-12-01T00:00:00Z',
        updated_at: '2025-12-01T00:05:00Z',
        title: 'Old conversation',
        preview: 'preview text',
        message_count: 2,
      }],
    });
    getChatSession.mockResolvedValue({
      session_id: 'backend-sess-old',
      user_id: 'user-1',
      status: 'active',
      created_at: '2025-12-01T00:00:00Z',
      title: 'Old conversation',
      preview: 'preview text',
      message_count: 2,
      messages: [
        { message_id: 'm1', role: 'user', content: 'What is the refund policy?', timestamp: '2025-12-01T00:00:00Z' },
        { message_id: 'm2', role: 'assistant', content: 'We offer a 7-day money-back guarantee.', timestamp: '2025-12-01T00:01:00Z' },
      ],
    });

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    const row = await screen.findByText('Old conversation');
    await act(async () => {
      fireEvent.click(row);
    });

    expect(getChatSession).toHaveBeenCalledWith('backend-sess-old');
    expect(await screen.findByText('What is the refund policy?')).toBeInTheDocument();
    expect(await screen.findByText('We offer a 7-day money-back guarantee.')).toBeInTheDocument();
  });

  it('New Conversation does not create a session until the next message, then creates a separate one', async () => {
    await openWidget();
    await sendMessage('first conversation question');
    await waitFor(() => expect(createChatSession).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByText('✨ New Conversation'));
    });
    // Clicking "New Conversation" must not, by itself, create a session --
    // only resets state/UI. Still just the one call from the first message.
    expect(createChatSession).toHaveBeenCalledTimes(1);

    createChatSession.mockResolvedValue({
      session_id: 'backend-sess-2',
      user_id: 'user-1',
      status: 'active',
      created_at: '2026-01-02T00:00:00Z',
      title: 'New Chat',
      preview: 'New conversation...',
      message_count: 0,
    });
    await sendMessage('second conversation question');

    await waitFor(() => expect(createChatSession).toHaveBeenCalledTimes(2));
    expect(sendSessionMessage).toHaveBeenCalledWith('backend-sess-2', 'second conversation question');
  });
});

describe('ChatApp — guests are completely unaffected', () => {
  beforeEach(() => {
    mockAuthenticated = false;
  });

  it('never creates a backend session for a guest', async () => {
    await openWidget();
    expect(createChatSession).not.toHaveBeenCalled();
  });

  it('still sends guest messages through the original stateless endpoint', async () => {
    await openWidget();
    await sendMessage('What is CareerBot?');

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalled());
    expect(sendSessionMessage).not.toHaveBeenCalled();
  });
});

// The same StorageEvent a real sign-in / sign-out fires (see
// loginAccountAuthStateSwitch.test.tsx), driving checkAuthStatus.
const triggerAuthRecheck = async () => {
  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
  });
};

const backendRow = (overrides: Record<string, unknown> = {}) => ({
  session_id: 'backend-sess-old',
  user_id: 'user-1',
  status: 'active',
  created_at: '2025-12-01T00:00:00Z',
  updated_at: '2025-12-01T00:05:00Z',
  title: 'Old conversation',
  preview: 'preview text',
  message_count: 2,
  ...overrides,
});

describe('ChatApp — a backend session never outlives its account', () => {
  it('after sign-out, the next (guest) message does not go to the previous user\'s backend session', async () => {
    await openWidget();
    await sendMessage('first question');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));

    mockAuthenticated = false;
    await triggerAuthRecheck();
    await sendMessage('guest question');

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    expect(sendSessionMessage).toHaveBeenCalledTimes(1);
    expect(sendChatMessage.mock.calls[0][1]).not.toBe('backend-sess-1');
  });

  it('a sign-out not yet noticed by the 30 s check still never sends into the old session', async () => {
    await openWidget();
    await sendMessage('first question');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));

    // Tokens gone, but no storage/visibility event has fired yet.
    mockAuthenticated = false;
    await sendMessage('guest question');

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    expect(sendSessionMessage).toHaveBeenCalledTimes(1);
  });

  it('after an account switch, the new account gets its own backend session', async () => {
    await openWidget();
    await sendMessage('alice question');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledWith('backend-sess-1', 'alice question'));

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    createChatSession.mockResolvedValue({
      session_id: 'backend-sess-bob', user_id: 'user-2', status: 'active',
      created_at: '2026-01-02T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
    });
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await sendMessage('bob question');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(2));
    expect(createChatSession).toHaveBeenCalledTimes(2);
    expect(sendSessionMessage).toHaveBeenLastCalledWith('backend-sess-bob', 'bob question');
  });

  it('a message into a session the backend says is closed (409) continues in a new session', async () => {
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 20, sessions: [backendRow()] });
    getChatSession.mockResolvedValue({
      ...backendRow(),
      messages: [{ message_id: 'm1', role: 'user', content: 'Old question', timestamp: '2025-12-01T00:00:00Z' }],
    });
    sendSessionMessage.mockRejectedValueOnce({ response: { status: 409, data: { detail: 'This session is closed' } } });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    const row = await screen.findByText('Old conversation');
    await act(async () => {
      fireEvent.click(row);
    });
    await screen.findByText('Old question');

    await sendMessage('follow-up');

    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(2));
    expect(sendSessionMessage).toHaveBeenNthCalledWith(1, 'backend-sess-old', 'follow-up');
    expect(sendSessionMessage).toHaveBeenNthCalledWith(2, 'backend-sess-1', 'follow-up');
    expect(await screen.findByText('Here is the answer.')).toBeInTheDocument();
    expect(screen.getByText(/continued in a new conversation/i)).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('a 403 (session of another account, switch not yet noticed) also continues in a new session', async () => {
    await openWidget();
    await sendMessage('first');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));

    sendSessionMessage.mockRejectedValueOnce({ response: { status: 403 } });
    createChatSession.mockResolvedValue({
      session_id: 'backend-sess-2', user_id: 'user-1', status: 'active',
      created_at: '2026-01-02T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendMessage('second');

    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(3));
    expect(sendSessionMessage).toHaveBeenLastCalledWith('backend-sess-2', 'second');
    errorSpy.mockRestore();
  });

  it('if the replacement session cannot be created, the message falls back to stateless chat and the dead session is dropped', async () => {
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 20, sessions: [backendRow()] });
    getChatSession.mockResolvedValue({ ...backendRow(), messages: [] });
    sendSessionMessage.mockRejectedValueOnce({ response: { status: 409 } });
    createChatSession.mockRejectedValue(new Error('create failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    const row = await screen.findByText('Old conversation');
    await act(async () => {
      fireEvent.click(row);
    });
    await waitFor(() => expect(getChatSession).toHaveBeenCalled());

    await sendMessage('follow-up');
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Guest answer.')).toBeInTheDocument();

    await sendMessage('next one');
    await waitFor(() => expect(createChatSession).toHaveBeenCalledTimes(2));
    // Never again into the closed session.
    expect(sendSessionMessage).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('if the send into the replacement session fails, it is reported once, not re-sent stateless', async () => {
    await openWidget();
    await sendMessage('first');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));

    sendSessionMessage
      .mockRejectedValueOnce({ response: { status: 409 } })
      .mockRejectedValueOnce(new Error('Server unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendMessage('second');

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(sendSessionMessage).toHaveBeenCalledTimes(3);
    expect(sendChatMessage).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('a conversation still loading when the account switches is not restored for the new account', async () => {
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 20, sessions: [backendRow()] });
    let resolveDetail: (v: unknown) => void = () => {};
    getChatSession.mockReturnValue(new Promise((r) => { resolveDetail = r; }));

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    const row = await screen.findByText('Old conversation');
    await act(async () => {
      fireEvent.click(row);
    });

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveDetail({
        ...backendRow(),
        messages: [{ message_id: 'm1', role: 'user', content: 'Alice private question', timestamp: '2025-12-01T00:00:00Z' }],
      });
    });
    expect(screen.queryByText('Alice private question')).not.toBeInTheDocument();

    await sendMessage('bob question');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
    expect(sendSessionMessage).toHaveBeenCalledWith('backend-sess-1', 'bob question');
  });

  it('a reply still in flight when the account switches is not shown to the new account', async () => {
    await openWidget();
    await sendMessage('first');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));

    let resolveReply: (v: unknown) => void = () => {};
    sendSessionMessage.mockReturnValueOnce(new Promise((r) => { resolveReply = r; }));
    await sendMessage('alice private question');

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveReply({
        message_id: 'm9', session_id: 'backend-sess-1', content: 'Alice private answer',
        timestamp: '2026-01-01T00:02:00Z', role: 'assistant', category: 'general', confidence: 0.9,
        requires_escalation: false,
      });
    });
    expect(screen.queryByText('Alice private answer')).not.toBeInTheDocument();
  });

  it('History still loading when the account switches is not shown to the new account', async () => {
    let resolveHistory: (v: unknown) => void = () => {};
    // Alice's first History request (on open) is left pending.
    getChatSessionHistory.mockReturnValueOnce(new Promise((r) => { resolveHistory = r; }));
    await openWidget();
    await waitFor(() => expect(getChatSessionHistory).toHaveBeenCalledTimes(1));

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveHistory({ total: 1, skip: 0, limit: 100, sessions: [backendRow({ title: 'Alice old chat' })] });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    expect(screen.queryByText('Alice old chat')).not.toBeInTheDocument();
  });

  it('any other send failure is still reported, not retried in a new session', async () => {
    sendSessionMessage.mockRejectedValueOnce(new Error('Server unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await sendMessage('question');

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(createChatSession).toHaveBeenCalledTimes(1);
    expect(sendSessionMessage).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

describe('ChatApp — removing a conversation from History', () => {
  it('does not list closed (removed) backend sessions', async () => {
    getChatSessionHistory.mockResolvedValue({
      total: 2, skip: 0, limit: 20,
      sessions: [
        backendRow({ session_id: 's-open', title: 'Still open chat' }),
        backendRow({ session_id: 's-closed', title: 'Removed chat', status: 'closed' }),
      ],
    });

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });

    expect(await screen.findByText('Still open chat')).toBeInTheDocument();
    expect(screen.queryByText('Removed chat')).not.toBeInTheDocument();
    // Largest page the backend allows, so removed rows don't eat the list.
    expect(getChatSessionHistory).toHaveBeenLastCalledWith(0, 100);
  });

  it('asks to remove from history without promising a permanent erase', async () => {
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 20, sessions: [backendRow()] });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    await screen.findByText('Old conversation');
    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove from history'));
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0]).toMatch(/remove this conversation from your history/i);
    expect(confirmSpy.mock.calls[0][0]).not.toMatch(/cannot be undone/i);
    await waitFor(() => expect(deleteChatSession).toHaveBeenCalledWith('backend-sess-old'));
    expect(screen.queryByText('Old conversation')).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});

const asProfile = (email: string, name: string) =>
  ({ email, full_name: name } as Awaited<ReturnType<typeof getProfile>>);

const savedTicket = (subject: string, email: string) => ({
  id: `CB-${subject.length}`, subject, status: 'open', priority: 1,
  created_at: '2026-01-01T00:00:00Z', contact_email: email,
});

const openTicketsTab = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('🎫 Tickets'));
  });
};

describe('ChatApp — a ticket or History load for one account never lands on the next', () => {
  it('a ticket request that fails after a switch does not show the previous account\'s saved tickets', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Alice private ticket', 'alice@example.com')]));
    await openWidget();

    // Switch to Alice; her ticket request is still pending...
    let rejectAlice: (e: unknown) => void = () => {};
    getSupportTickets.mockReturnValueOnce(new Promise((_, reject) => { rejectAlice = reject; }));
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    await waitFor(() => expect(getSupportTickets).toHaveBeenCalledTimes(2));

    // ...when Bob signs in, and only then does it fail.
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());
    await waitFor(() => expect(getSupportTickets).toHaveBeenCalledTimes(3));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      rejectAlice(new Error('Network Error'));
    });

    await openTicketsTab();
    expect(screen.queryByText('Alice private ticket')).not.toBeInTheDocument();
    expect(screen.getByText('No tickets yet')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('control: with no account change, a failed ticket request still shows the user\'s own saved tickets', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Alice private ticket', 'alice@example.com')]));
    await openWidget();

    getSupportTickets.mockRejectedValueOnce(new Error('Network Error'));
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    await openTicketsTab();
    expect(await screen.findByText('Alice private ticket')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('a ticket load whose profile lookup fails after a switch does not clear the next account\'s tickets', async () => {
    // Alice's first ticket load: backend empty, then the profile lookup for
    // the local fallback is still pending when Bob signs in.
    let rejectProfile: (e: unknown) => void = () => {};
    // (Opening reads the profile for History, then for tickets, before their requests.)
    vi.mocked(getProfile)
      .mockResolvedValueOnce(asProfile('alice@example.com', 'Alice'))
      .mockResolvedValueOnce(asProfile('alice@example.com', 'Alice'))
      .mockReturnValueOnce(new Promise<unknown>((_, reject) => { rejectProfile = reject; }) as ReturnType<typeof getProfile>)
      .mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    getSupportTickets
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [{
        ticket_id: 'CB-00900', subject: 'Bob real ticket', description: 'd', status: 'open', priority: 'normal',
        user_email: 'bob@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }] });
    // Alice's first History load stays pending, so its profile reads don't
    // take the slow one above (they come before and after its request).
    getChatSessionHistory.mockReturnValueOnce(new Promise(() => {}));
    await openWidget();
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(3));
    // A check while Alice is signed in records her; then Bob signs in.
    await triggerAuthRecheck();
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());
    await openTicketsTab();
    expect(await screen.findByText('Bob real ticket')).toBeInTheDocument();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      rejectProfile(new Error('Network Error'));
    });
    expect(screen.getByText('Bob real ticket')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('an older auth check that finishes after a newer one does not switch back to the previous account', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Alice private ticket', 'alice@example.com')]));
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    // Check 1 (a stale tab event) is still waiting for Alice's profile...
    let resolveOld: (v: unknown) => void = () => {};
    vi.mocked(getProfile).mockReturnValueOnce(new Promise<unknown>((r) => { resolveOld = r; }) as ReturnType<typeof getProfile>);
    await triggerAuthRecheck();
    // ...when Bob signs in and check 2 completes.
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveOld(asProfile('alice@example.com', 'Alice'));
    });
    await openTicketsTab();
    expect(screen.queryByText('Alice private ticket')).not.toBeInTheDocument();
    expect(screen.getByText(/👤 Bob/)).toBeInTheDocument();
  });

  it('an older auth check that sees the new account still switches when a newer check\'s profile request fails', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    let resolveOld: (v: unknown) => void = () => {};
    vi.mocked(getProfile)
      .mockReturnValueOnce(new Promise<unknown>((r) => { resolveOld = r; }) as ReturnType<typeof getProfile>)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await triggerAuthRecheck();
    await act(async () => {
      resolveOld(asProfile('bob@example.com', 'Bob'));
    });
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());
    errorSpy.mockRestore();
  });

  it('a switch whose profile is still loading when the next switch lands does not load its account\'s tickets or name', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Alice private ticket', 'alice@example.com')]));
    await openWidget();

    // The switch to Alice reads her email, then stalls on her profile...
    let resolveAliceProfile: (v: unknown) => void = () => {};
    const callsBefore = vi.mocked(getProfile).mock.calls.length;
    vi.mocked(getProfile)
      .mockResolvedValueOnce(asProfile('alice@example.com', 'Alice'))
      .mockReturnValueOnce(new Promise<unknown>((r) => { resolveAliceProfile = r; }) as ReturnType<typeof getProfile>)
      .mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(vi.mocked(getProfile).mock.calls.length).toBe(callsBefore + 2));
    // ...while the switch to Bob completes.
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveAliceProfile(asProfile('alice@example.com', 'Alice'));
    });
    expect(screen.getByText(/👤 Bob/)).toBeInTheDocument();
    expect(screen.queryByText(/👤 Alice/)).not.toBeInTheDocument();
    await openTicketsTab();
    expect(screen.queryByText('Alice private ticket')).not.toBeInTheDocument();
  });

  it('removing the open conversation does not reset the next account\'s conversation when it finishes after a switch', async () => {
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 20, sessions: [backendRow()] });
    getChatSession.mockResolvedValue({
      ...backendRow(),
      messages: [{ message_id: 'm1', role: 'user', content: 'Alice old question', timestamp: '2025-12-01T00:00:00Z' }],
    });
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    await act(async () => {
      fireEvent.click(await screen.findByText('Old conversation'));
    });
    await screen.findByText('Alice old question');

    // Remove the conversation that is open; the request is slow.
    let resolveDelete: (v: unknown) => void = () => {};
    deleteChatSession.mockReturnValue(new Promise((r) => { resolveDelete = r; }));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      fireEvent.click(screen.getByText('💬 History'));
    });
    await act(async () => {
      fireEvent.click(await screen.findByTitle('Remove from history'));
    });
    expect(deleteChatSession).toHaveBeenCalledWith('backend-sess-old');

    getChatSessionHistory.mockResolvedValue({ total: 0, skip: 0, limit: 100, sessions: [] });
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());
    await sendMessage('bob question');
    expect(await screen.findByText('Here is the answer.')).toBeInTheDocument();

    await act(async () => {
      resolveDelete(undefined);
    });
    expect(screen.getByText('bob question')).toBeInTheDocument();
    expect(screen.getByText('Here is the answer.')).toBeInTheDocument();
    confirmSpy.mockRestore();
  });
});

// Legacy History rows live in one device-wide key, filtered by `userEmail`.
const legacyRow = (title: string, email: string) => ({
  id: `local-${email}`, title, preview: 'p', date: '2025-11-01T00:00:00Z', userEmail: email,
});
const saveLegacyRows = (...rows: ReturnType<typeof legacyRow>[]) =>
  localStorage.setItem('saved_chat_sessions', JSON.stringify(rows));
const openHistoryTab = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('💬 History'));
  });
};

describe('ChatApp — saved History and tickets are read only for the account that is signed in', () => {
  it('a delayed check that saw Bob loads none of Bob\'s saved History or tickets once Carol has signed in', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    saveLegacyRows(legacyRow('Bob private chat', 'bob@example.com'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Bob private ticket', 'bob@example.com')]));
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 100, sessions: [backendRow({ title: 'Carol backend chat' })] });

    // Check 1 (Bob signed in) waits for its profile; check 2, after Carol
    // signed in, fails; every later profile request sees Carol.
    let resolveOld: (v: unknown) => void = () => {};
    vi.mocked(getProfile)
      .mockReturnValueOnce(new Promise<unknown>((r) => { resolveOld = r; }) as ReturnType<typeof getProfile>)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await triggerAuthRecheck();
    const historyCalls = getChatSessionHistory.mock.calls.length;
    await act(async () => {
      resolveOld(asProfile('bob@example.com', 'Bob'));
    });

    await openHistoryTab();
    expect(screen.queryByText('Bob private chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Carol backend chat')).not.toBeInTheDocument();
    expect(getChatSessionHistory.mock.calls.length).toBe(historyCalls);
    await openTicketsTab();
    expect(screen.queryByText('Bob private ticket')).not.toBeInTheDocument();

    // The next check finds Carol and loads her History.
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Carol/)).toBeInTheDocument());
    await openHistoryTab();
    expect(await screen.findByText('Carol backend chat')).toBeInTheDocument();
    expect(screen.queryByText('Bob private chat')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('a switch to Bob whose History and ticket requests finish after Carol signed in shows none of Bob\'s saved data', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    saveLegacyRows(legacyRow('Bob private chat', 'bob@example.com'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Bob private ticket', 'bob@example.com')]));

    // The switch to Bob completes its profile requests; its History request is slow.
    let resolveHistory: (v: unknown) => void = () => {};
    getChatSessionHistory.mockReturnValueOnce(new Promise((r) => { resolveHistory = r; }));
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    const historyCalls = getChatSessionHistory.mock.calls.length;
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());
    await waitFor(() => expect(getChatSessionHistory.mock.calls.length).toBe(historyCalls + 1));

    // Carol signs in; her check's profile request fails, so nothing reacts yet.
    vi.mocked(getProfile)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    // The slow request ran with Carol signed in; her ticket list is empty.
    await act(async () => {
      resolveHistory({ total: 1, skip: 0, limit: 100, sessions: [backendRow({ title: 'Carol backend chat' })] });
    });
    await waitFor(() => expect(getSupportTickets).toHaveBeenCalledTimes(2));

    await openHistoryTab();
    expect(screen.queryByText('Bob private chat')).not.toBeInTheDocument();
    await openTicketsTab();
    await act(async () => {});
    expect(screen.queryByText('Bob private ticket')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('a delayed sign-in check that saw Bob loads none of Bob\'s saved History or tickets once Carol has signed in', async () => {
    mockAuthenticated = false;
    localStorage.setItem('guest_ticket_email', 'guest@example.com');
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Guest ticket', 'guest@example.com')]));
    await openWidget();
    saveLegacyRows(legacyRow('Bob private chat', 'bob@example.com'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Bob private ticket', 'bob@example.com')]));
    getChatSessionHistory.mockResolvedValue({ total: 1, skip: 0, limit: 100, sessions: [backendRow({ title: 'Carol backend chat' })] });

    // As above, but from a guest: the sign-in check saw Bob. The newer check
    // fails its first request (it shows the sign-in and Carol's name, and
    // loads nothing), and so does the check that the sign-in starts.
    mockAuthenticated = true;
    let resolveOld: (v: unknown) => void = () => {};
    vi.mocked(getProfile)
      .mockReturnValueOnce(new Promise<unknown>((r) => { resolveOld = r; }) as ReturnType<typeof getProfile>)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(asProfile('carol@example.com', 'Carol'))
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await triggerAuthRecheck();
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(4));
    expect(screen.getByText(/👤 Carol/)).toBeInTheDocument();
    const historyCalls = getChatSessionHistory.mock.calls.length;
    const ticketCalls = getSupportTickets.mock.calls.length;
    await act(async () => {
      resolveOld(asProfile('bob@example.com', 'Bob'));
    });
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(5));

    await openHistoryTab();
    expect(screen.queryByText('Bob private chat')).not.toBeInTheDocument();
    expect(getChatSessionHistory.mock.calls.length).toBe(historyCalls);
    expect(getSupportTickets.mock.calls.length).toBe(ticketCalls);
    await openTicketsTab();
    expect(screen.queryByText('Bob private ticket')).not.toBeInTheDocument();
    expect(screen.queryByText('Guest ticket')).not.toBeInTheDocument();

    // The next check finds Carol.
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Carol/)).toBeInTheDocument());
    await openHistoryTab();
    expect(await screen.findByText('Carol backend chat')).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('the first History and ticket loads after opening, still running when Bob signs in, do not show Alice\'s rows to Bob', async () => {
    // Opening loads History and tickets before it records whose they are;
    // both requests are still running when Bob signs in.
    let resolveHistory: (v: unknown) => void = () => {};
    let resolveTickets: (v: unknown) => void = () => {};
    getChatSessionHistory.mockReturnValueOnce(new Promise((r) => { resolveHistory = r; }));
    getSupportTickets.mockReturnValueOnce(new Promise((r) => { resolveTickets = r; }));
    await openWidget();
    await waitFor(() => expect(getChatSessionHistory).toHaveBeenCalledTimes(1));

    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await act(async () => {
      resolveHistory({ total: 1, skip: 0, limit: 100, sessions: [backendRow({ title: 'Alice backend chat' })] });
    });
    await act(async () => {
      resolveTickets({ data: [{
        ticket_id: 'CB-00902', subject: 'Alice backend ticket', description: 'd', status: 'open', priority: 'normal',
        user_email: 'alice@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }] });
    });
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await openHistoryTab();
    expect(screen.queryByText('Alice backend chat')).not.toBeInTheDocument();
    await openTicketsTab();
    expect(screen.queryByText('Alice backend ticket')).not.toBeInTheDocument();
  });

  it('a switch to Bob whose ticket request returns Bob\'s tickets after Carol signed in does not show them', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    let resolveTickets: (v: unknown) => void = () => {};
    getSupportTickets.mockReturnValueOnce(new Promise((r) => { resolveTickets = r; }));
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    const ticketCalls = getSupportTickets.mock.calls.length;
    await triggerAuthRecheck();
    await waitFor(() => expect(getSupportTickets.mock.calls.length).toBe(ticketCalls + 1));

    // Carol signs in; her check's profile request fails.
    vi.mocked(getProfile)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await act(async () => {
      resolveTickets({ data: [{
        ticket_id: 'CB-00901', subject: 'Bob backend ticket', description: 'd', status: 'open', priority: 'normal',
        user_email: 'bob@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }] });
    });

    await openTicketsTab();
    await act(async () => {});
    expect(screen.queryByText('Bob backend ticket')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('a History load that returns after sign-out makes no profile request for the guest', async () => {
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    let resolveHistory: (v: unknown) => void = () => {};
    getChatSessionHistory.mockReturnValueOnce(new Promise((r) => { resolveHistory = r; }));
    await act(async () => {
      fireEvent.click(screen.getByTitle('Toggle History'));
    });
    await waitFor(() => expect(getChatSessionHistory).toHaveBeenCalledTimes(2));

    mockAuthenticated = false;
    await triggerAuthRecheck();
    const profileCalls = vi.mocked(getProfile).mock.calls.length;
    await act(async () => {
      resolveHistory({ total: 1, skip: 0, limit: 100, sessions: [backendRow({ title: 'Alice backend chat' })] });
    });
    expect(vi.mocked(getProfile).mock.calls.length).toBe(profileCalls);
    expect(screen.queryByText('Alice backend chat')).not.toBeInTheDocument();
  });

  it('Bob\'s ticket request that returns after Carol signed in is not shown when no profile request succeeds', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    let resolveTickets: (v: unknown) => void = () => {};
    getSupportTickets.mockReturnValueOnce(new Promise((r) => { resolveTickets = r; }));
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    const ticketCalls = getSupportTickets.mock.calls.length;
    await triggerAuthRecheck();
    await waitFor(() => expect(getSupportTickets.mock.calls.length).toBe(ticketCalls + 1));

    // Carol signs in; every profile request fails from now on.
    vi.mocked(getProfile).mockRejectedValue(new Error('Network Error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await act(async () => {
      resolveTickets({ data: [{
        ticket_id: 'CB-00903', subject: 'Bob unconfirmed ticket', description: 'd', status: 'open', priority: 'normal',
        user_email: 'bob@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }] });
    });

    await openTicketsTab();
    await act(async () => {});
    expect(screen.queryByText('Bob unconfirmed ticket')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('the first ticket load after opening loads nothing when its profile read fails (whose tickets is unknown)', async () => {
    getSupportTickets.mockResolvedValue({ data: [{
      ticket_id: 'CB-00904', subject: 'Unconfirmed ticket', description: 'd', status: 'open', priority: 'normal',
      user_email: 'alice@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }] });
    // Opening reads the profile for History, then for tickets: that one fails.
    vi.mocked(getProfile)
      .mockResolvedValueOnce(asProfile('alice@example.com', 'Alice'))
      .mockRejectedValueOnce(new Error('Network Error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    await openTicketsTab();
    expect(screen.queryByText('Unconfirmed ticket')).not.toBeInTheDocument();
    expect(getSupportTickets).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('a sign-in whose confirming profile request fails shows no tickets, not the guest\'s list from before', async () => {
    mockAuthenticated = false;
    localStorage.setItem('guest_ticket_email', 'guest@example.com');
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Guest ticket', 'guest@example.com')]));
    // Opening loads the guest's tickets (the Tickets tab shows once signed in).
    await openWidget();

    // Carol signs in; after the check's two profile requests, every one fails.
    mockAuthenticated = true;
    getSupportTickets.mockResolvedValue({ data: [{
      ticket_id: 'CB-00905', subject: 'Carol unconfirmed ticket', description: 'd', status: 'open', priority: 'normal',
      user_email: 'carol@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }] });
    vi.mocked(getProfile)
      .mockResolvedValueOnce(asProfile('carol@example.com', 'Carol'))
      .mockResolvedValueOnce(asProfile('carol@example.com', 'Carol'))
      .mockRejectedValue(new Error('Network Error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await waitFor(() => expect(getSupportTickets).toHaveBeenCalled());
    await act(async () => {});

    await openTicketsTab();
    expect(screen.queryByText('Guest ticket')).not.toBeInTheDocument();
    expect(screen.queryByText('Carol unconfirmed ticket')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('a sign-in as Bob whose ticket request returns after Carol signed in clears the guest\'s list from before', async () => {
    mockAuthenticated = false;
    localStorage.setItem('guest_ticket_email', 'guest@example.com');
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Guest ticket', 'guest@example.com')]));
    await openWidget();

    mockAuthenticated = true;
    let resolveTickets: (v: unknown) => void = () => {};
    getSupportTickets.mockReturnValueOnce(new Promise((r) => { resolveTickets = r; }));
    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(getSupportTickets).toHaveBeenCalledTimes(1));

    // Carol signs in; her check's profile request fails.
    vi.mocked(getProfile)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await act(async () => {
      resolveTickets({ data: [{
        ticket_id: 'CB-00906', subject: 'Bob backend ticket', description: 'd', status: 'open', priority: 'normal',
        user_email: 'bob@example.com', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }] });
    });

    await openTicketsTab();
    expect(screen.queryByText('Guest ticket')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob backend ticket')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('control: a switch to Bob with no further change shows Bob\'s saved History and tickets', async () => {
    vi.mocked(getProfile).mockResolvedValue(asProfile('alice@example.com', 'Alice'));
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    saveLegacyRows(legacyRow('Bob private chat', 'bob@example.com'), legacyRow('Alice private chat', 'alice@example.com'));
    localStorage.setItem('saved_tickets', JSON.stringify([savedTicket('Bob private ticket', 'bob@example.com')]));

    vi.mocked(getProfile).mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await openHistoryTab();
    expect(await screen.findByText('Bob private chat')).toBeInTheDocument();
    expect(screen.queryByText('Alice private chat')).not.toBeInTheDocument();
    await openTicketsTab();
    expect(await screen.findByText('Bob private ticket')).toBeInTheDocument();
  });
});

// A conversation kept only on this device (its backend session could not be
// created), archived by "New Conversation" after a profile request.
const startLocalOnlyConversation = async (question: string) => {
  createChatSession.mockRejectedValue(new Error('create failed'));
  await sendMessage(question);
  expect(await screen.findByText('Guest answer.')).toBeInTheDocument();
};
const clickNewConversation = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('✨ New Conversation'));
  });
};
const savedOwners = () =>
  (JSON.parse(localStorage.getItem('saved_chat_sessions') || '[]') as { title: string; userEmail?: string }[])
    .map((s) => `${s.userEmail}: ${s.title}`);

describe('ChatApp — a conversation archived by New Conversation stays with its account', () => {
  it('is not saved under Carol when she signed in (and her check failed) before the profile came back', async () => {
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await startLocalOnlyConversation('alice private question');

    let resolveSave: (v: unknown) => void = () => {};
    vi.mocked(getProfile)
      .mockReturnValueOnce(new Promise<unknown>((r) => { resolveSave = r; }) as ReturnType<typeof getProfile>)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    await clickNewConversation();
    await triggerAuthRecheck();
    await act(async () => {
      resolveSave(asProfile('carol@example.com', 'Carol'));
    });

    expect(savedOwners()).toEqual([]);
    await openHistoryTab();
    expect(screen.queryByText('alice private question')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('is saved for Alice but not shown to Bob when the switch to Bob lands before the profile comes back', async () => {
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await startLocalOnlyConversation('alice private question');

    let resolveSave: (v: unknown) => void = () => {};
    vi.mocked(getProfile)
      .mockReturnValueOnce(new Promise<unknown>((r) => { resolveSave = r; }) as ReturnType<typeof getProfile>)
      .mockResolvedValue(asProfile('bob@example.com', 'Bob'));
    await clickNewConversation();
    await triggerAuthRecheck();
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());
    await act(async () => {
      resolveSave(asProfile('alice@example.com', 'Alice'));
    });

    expect(savedOwners()).toEqual(['alice@example.com: alice private question']);
    await openHistoryTab();
    expect(screen.queryByText('alice private question')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('is not saved while no account has been confirmed yet (sign-in whose profile requests failed)', async () => {
    mockAuthenticated = false;
    await openWidget();
    await sendMessage('guest question');
    expect(await screen.findByText('Guest answer.')).toBeInTheDocument();

    // Sign-in: the check's profile request fails (it shows the name from its
    // second one), and so does the check the sign-in starts.
    mockAuthenticated = true;
    vi.mocked(getProfile)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(asProfile('carol@example.com', 'Carol'))
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(asProfile('carol@example.com', 'Carol'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await triggerAuthRecheck();
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(3));
    expect(screen.getByText(/👤 Carol/)).toBeInTheDocument();

    await clickNewConversation();
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(4));
    await act(async () => {});
    expect(savedOwners()).toEqual([]);
    errorSpy.mockRestore();
  });

  it('control: with no account change it is saved for Alice and listed in her History', async () => {
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await startLocalOnlyConversation('alice private question');

    await clickNewConversation();
    await waitFor(() => expect(savedOwners()).toEqual(['alice@example.com: alice private question']));
    await openHistoryTab();
    expect(await screen.findByText('alice private question')).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
