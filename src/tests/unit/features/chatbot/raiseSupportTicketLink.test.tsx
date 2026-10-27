/**
 * All three of the chatbot's ticket-raising entry points:
 *   - the plain "Raise a support ticket" link (input footer)
 *   - the contextual "🎫 Raise a Support Ticket →" link shown after a 👎
 *     "not helpful" answer (carries the original question/answer along)
 *   - "Contact Support" in the guided flow (covered in
 *     guidedConversationFlow.test.tsx, next to its other guided-flow
 *     navigation tests)
 *
 * All three now navigate away instead of opening an in-widget modal:
 * guests to the dedicated guest support portal (/support/tickets/new) --
 * via sessionStorage (ticket_ctx:<id>) when available, falling back to
 * plain query params otherwise -- signed-in users to the dashboard's
 * Support Center (/dashboard/support-history), which opens its own
 * create-ticket form via ?raise=1. The question/answer travel the same way
 * on both routes: sessionStorage (?ctx=) first, plain query params only as
 * the fallback -- a 2 x 5,000-character Q&A in the URL can exceed proxy URL
 * limits and lands in browser history, signed in or not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

let mockAuthenticated = false;

vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => mockAuthenticated,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' }),
}));

const sendChatMessage = vi.fn();
const createChatSession = vi.fn();
const sendSessionMessage = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: vi.fn(),
  getSupportTickets: vi.fn().mockResolvedValue({ data: [] }),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: (...args: unknown[]) => createChatSession(...args),
  sendSessionMessage: (...args: unknown[]) => sendSessionMessage(...args),
  getChatSessionHistory: vi.fn().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] }),
  getChatSession: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';

const openWidget = async () => {
  render(<ChatApp />);
  const toggle = screen.getByTitle('Chatbot Support');
  await act(async () => {
    fireEvent.click(toggle);
  });
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

let sessionStorageSetItem: { mockRestore: () => void } | undefined;
beforeEach(() => {
  sessionStorageSetItem?.mockRestore();
  sessionStorageSetItem = undefined;
  localStorage.clear();
  sessionStorage.clear();
  mockAuthenticated = false;
  mockPush.mockReset();
  sendChatMessage.mockReset();
  createChatSession.mockReset();
  sendSessionMessage.mockReset();
});

describe('Chatbot "Raise a support ticket" link -- guest', () => {
  it('navigates to the dedicated support ticket page via the app router, not an in-widget modal', async () => {
    await openWidget();

    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket'));
    });

    expect(mockPush).toHaveBeenCalledWith('/support/tickets/new');
    // No modal opened in the widget itself.
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Chatbot "Raise a support ticket" link -- signed-in user', () => {
  it('navigates to the dashboard Support Center with its create-ticket form, not an in-widget modal', async () => {
    mockAuthenticated = true;
    await openWidget();

    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket'));
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/support-history?tab=tickets&raise=1');
    // No modal opened in the widget itself.
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
  });
});

describe('Chatbot contextual "Raise a support ticket →" link (after a 👎 unhelpful answer) -- guest', () => {
  const QUESTION = 'Why am I unable to reset my password from the settings page?';
  const ANSWER = 'Go to the login page and click the Forgot Password link to receive a reset email.';

  const mockAnswer = (answer: string, category: string) => ({
    session_id: 'session',
    message: 'q',
    answer,
    category,
    authenticated: false,
    requires_escalation: false,
    confidence: 0.9,
    timestamp: '2026-01-01T00:00:00Z',
  });

  const raiseFromUnhelpfulAnswer = async () => {
    sendChatMessage.mockResolvedValue(mockAnswer(ANSWER, 'account_access_general_issue'));
    await openWidget();
    await sendMessage(QUESTION);
    await screen.findByText(ANSWER);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as not helpful'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket →'));
    });
    const [path, query] = (mockPush.mock.calls[0][0] as string).split('?');
    expect(path).toBe('/support/tickets/new');
    return new URLSearchParams(query);
  };

  it('hands the question and answer over in sessionStorage, keeping the chat text out of the URL', async () => {
    const params = await raiseFromUnhelpfulAnswer();
    expect(params.get('question')).toBeNull();
    expect(params.get('answer')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(`ticket_ctx:${params.get('ctx')}`) || 'null'))
      .toEqual({ question: QUESTION, answer: ANSWER });
  });

  it('falls back to query params when sessionStorage is unavailable, not the modal', async () => {
    const realSetItem = Storage.prototype.setItem;
    sessionStorageSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (this === window.sessionStorage) throw new Error('QuotaExceededError');
      return realSetItem.call(this, k, v);
    });
    sendChatMessage.mockResolvedValue(mockAnswer(ANSWER, 'account_access_general_issue'));
    await openWidget();
    await sendMessage(QUESTION);
    await screen.findByText(ANSWER);

    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as not helpful'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket →'));
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    const [path, query] = pushedUrl.split('?');
    expect(path).toBe('/support/tickets/new');
    const params = new URLSearchParams(query);
    expect(params.get('question')).toBe(QUESTION);
    expect(params.get('answer')).toBe(ANSWER);
    // No modal opened in the widget itself.
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
  });
});

describe('Chatbot contextual "Raise a support ticket →" link (after a 👎 unhelpful answer) -- signed-in user', () => {
  const QUESTION = 'Why am I unable to reset my password from the settings page?';
  const ANSWER = 'Go to the login page and click the Forgot Password link to receive a reset email.';

  const raiseSignedIn = async () => {
    mockAuthenticated = true;
    createChatSession.mockResolvedValue({
      session_id: 'sess-1', user_id: 'user-1', status: 'active',
      created_at: '2026-01-01T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
    });
    sendSessionMessage.mockResolvedValue({
      message_id: 'm1', session_id: 'sess-1', content: ANSWER, timestamp: '2026-01-01T00:00:00Z',
      role: 'assistant', category: 'account_access_general_issue', confidence: 0.9, requires_escalation: false,
    });

    await openWidget();
    await sendMessage(QUESTION);
    await screen.findByText(ANSWER);

    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as not helpful'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket →'));
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const [path, query] = (mockPush.mock.calls[0][0] as string).split('?');
    expect(path).toBe('/dashboard/support-history');
    const params = new URLSearchParams(query);
    expect(params.get('tab')).toBe('tickets');
    expect(params.get('raise')).toBe('1');
    // No modal opened in the widget itself.
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    return params;
  };

  it('hands the question and answer to the dashboard in sessionStorage, keeping the chat text out of the URL', async () => {
    const params = await raiseSignedIn();
    expect(params.get('question')).toBeNull();
    expect(params.get('answer')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem(`ticket_ctx:${params.get('ctx')}`) || 'null'))
      .toEqual({ question: QUESTION, answer: ANSWER });
  });

  it('falls back to query params on the dashboard route when sessionStorage is unavailable', async () => {
    const realSetItem = Storage.prototype.setItem;
    sessionStorageSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (this === window.sessionStorage) throw new Error('QuotaExceededError');
      return realSetItem.call(this, k, v);
    });
    const params = await raiseSignedIn();
    expect(params.get('ctx')).toBeNull();
    expect(params.get('question')).toBe(QUESTION);
    expect(params.get('answer')).toBe(ANSWER);
  });

  it('navigates to the dashboard Support Center with the original question and answer, not the modal', async () => {
    mockAuthenticated = true;
    createChatSession.mockResolvedValue({
      session_id: 'sess-1', user_id: 'user-1', status: 'active',
      created_at: '2026-01-01T00:00:00Z', title: 'New Chat', preview: '', message_count: 0,
    });
    sendSessionMessage.mockResolvedValue({
      message_id: 'm1', session_id: 'sess-1', content: ANSWER, timestamp: '2026-01-01T00:00:00Z',
      role: 'assistant', category: 'account_access_general_issue', confidence: 0.9, requires_escalation: false,
    });

    await openWidget();
    await sendMessage(QUESTION);
    await screen.findByText(ANSWER);

    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as not helpful'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket →'));
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    const [path, query] = pushedUrl.split('?');
    expect(path).toBe('/dashboard/support-history');
    const params = new URLSearchParams(query);
    // The Q&A reaches the dashboard via ?ctx= (see the sessionStorage test above).
    expect(JSON.parse(sessionStorage.getItem(`ticket_ctx:${params.get('ctx')}`) || 'null'))
      .toEqual({ question: QUESTION, answer: ANSWER });
    expect(params.get('tab')).toBe('tickets');
    expect(params.get('raise')).toBe('1');
    // No modal opened in the widget itself.
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
  });
});
