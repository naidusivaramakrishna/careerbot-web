/**
 * The chatbot's two "raise a support ticket" entry points -- the plain
 * link in the input footer, and the contextual link shown after a 👎
 * "not helpful" answer -- now navigate to the real ticket portal
 * (/support/tickets/new) via redirectToTicketPage, instead of opening the
 * old in-widget modal (openTicketModal, left in place but unreachable).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => false,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn(),
}));

const sendChatMessage = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: vi.fn(),
  getSupportTickets: vi.fn().mockResolvedValue({ data: [] }),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: vi.fn(),
  sendSessionMessage: vi.fn(),
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
  mockPush.mockReset();
  sendChatMessage.mockReset();
});

describe('Chatbot "Raise a support ticket" link', () => {
  it('navigates to the ticket portal via the app router, not an in-widget modal', async () => {
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

describe('Chatbot contextual "Raise a support ticket →" link (after a 👎 unhelpful answer)', () => {
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
