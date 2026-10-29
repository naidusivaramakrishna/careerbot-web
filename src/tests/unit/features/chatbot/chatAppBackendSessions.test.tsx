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
 *
 * The old in-widget History sidebar (its own "History"/"Tickets" tabs, a
 * client-side session/ticket list independent of the dashboard) has been
 * removed -- conversation history and ticket management now live entirely
 * on the dashboard's Support & History page. Tests that used to open a
 * previous conversation via that sidebar now do so via the ?chat_session=
 * deep link instead (its happy path and account-switch-race safety are
 * covered in dashboardDeepLinks.test.tsx, not duplicated here). Tests whose
 * only path to the relevant state was the removed History/Tickets list
 * display itself (not a specific session) have no remaining UI surface to
 * exercise and were removed, not adapted -- the underlying loadTickets /
 * confirmedOwnerEmail race-condition-guarding logic they covered is
 * unchanged by the sidebar's removal, but is no longer independently
 * user-observable since nothing renders that list anymore.
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
const getChatSession = vi.fn();
const deleteChatSession = vi.fn();
const sendChatMessage = vi.fn();
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

// Opens the widget already pointed at an existing backend session via the
// dashboard's "Continue conversation" deep link -- the replacement for the
// old History sidebar's click-a-row-to-open flow.
const openViaChatSessionDeepLink = async (sessionId: string) => {
  window.history.pushState(null, '', `/chatbot?chat_session=${sessionId}`);
  render(<ChatApp />);
  await waitFor(() => expect(getChatSession).toHaveBeenCalledWith(sessionId));
};

beforeEach(() => {
  localStorage.clear();
  mockAuthenticated = true;
  window.history.pushState(null, '', '/chatbot');
  vi.mocked(getProfile).mockReset().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
  getSupportTickets.mockReset().mockResolvedValue({ data: [] });
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
  getChatSession.mockReset();
  deleteChatSession.mockReset().mockResolvedValue(undefined);
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

  it('New Conversation does not create a session until the next message, then creates a separate one', async () => {
    await openWidget();
    await sendMessage('first conversation question');
    await waitFor(() => expect(createChatSession).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByTitle('New Chat'));
    });
    // Clicking "New Chat" must not, by itself, create a session -- only
    // resets state/UI. Still just the one call from the first message.
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
    getChatSession.mockResolvedValue({
      ...backendRow(),
      messages: [{ message_id: 'm1', role: 'user', content: 'Old question', timestamp: '2025-12-01T00:00:00Z' }],
    });
    sendSessionMessage.mockRejectedValueOnce({ response: { status: 409, data: { detail: 'This session is closed' } } });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openViaChatSessionDeepLink('backend-sess-old');
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
    getChatSession.mockResolvedValue({ ...backendRow(), messages: [] });
    sendSessionMessage.mockRejectedValueOnce({ response: { status: 409 } });
    createChatSession.mockRejectedValue(new Error('create failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openViaChatSessionDeepLink('backend-sess-old');

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

describe('ChatApp — an empty session is not left behind in History', () => {
  it('closes the just-created session when its first message fails to send, instead of leaving an empty row', async () => {
    sendSessionMessage.mockRejectedValueOnce(new Error('Server unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await sendMessage('question');

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    await waitFor(() => expect(deleteChatSession).toHaveBeenCalledWith('backend-sess-1'));
    errorSpy.mockRestore();
  });

  it('does not close an existing conversation just because a follow-up message in it fails', async () => {
    await openWidget();
    await sendMessage('first question');
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));

    sendSessionMessage.mockRejectedValueOnce(new Error('Server unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendMessage('second question, which fails');

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(deleteChatSession).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('closes the replacement session if its own first message also fails, after the original was closed (409)', async () => {
    sendSessionMessage
      .mockRejectedValueOnce({ response: { status: 409 } })
      .mockRejectedValueOnce(new Error('Server unavailable'));
    createChatSession.mockResolvedValueOnce({
      session_id: 'backend-sess-1', user_id: 'user-1', status: 'active',
      created_at: '2026-01-01T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
    }).mockResolvedValueOnce({
      session_id: 'backend-sess-replacement', user_id: 'user-1', status: 'active',
      created_at: '2026-01-02T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await sendMessage('question');

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    await waitFor(() => expect(deleteChatSession).toHaveBeenCalledWith('backend-sess-replacement'));
    // The original (already closed by the 409) is not re-closed.
    expect(deleteChatSession).not.toHaveBeenCalledWith('backend-sess-1');
    errorSpy.mockRestore();
  });
});

const asProfile = (email: string, name: string) =>
  ({ email, full_name: name } as Awaited<ReturnType<typeof getProfile>>);

// A conversation kept only on this device (its backend session could not be
// created), archived by "New Chat" after a profile request.
const startLocalOnlyConversation = async (question: string) => {
  createChatSession.mockRejectedValue(new Error('create failed'));
  await sendMessage(question);
  expect(await screen.findByText('Guest answer.')).toBeInTheDocument();
};
const clickNewConversation = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTitle('New Chat'));
  });
};
const savedOwners = () =>
  (JSON.parse(localStorage.getItem('saved_chat_sessions') || '[]') as { title: string; userEmail?: string }[])
    .map((s) => `${s.userEmail}: ${s.title}`);

describe('ChatApp — a conversation archived by New Chat stays with its account', () => {
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
    errorSpy.mockRestore();
  });

  it('is saved for Alice but not under Bob when the switch to Bob lands before the profile comes back', async () => {
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

  it('control: with no account change it is saved for Alice', async () => {
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await startLocalOnlyConversation('alice private question');

    await clickNewConversation();
    await waitFor(() => expect(savedOwners()).toEqual(['alice@example.com: alice private question']));
    errorSpy.mockRestore();
  });
});
