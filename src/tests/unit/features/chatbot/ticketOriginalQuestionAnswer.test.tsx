import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Raising a ticket from an unhelpful chatbot answer must capture the
 * customer's original question and the chatbot's answer to it as two
 * separate values -- neither ever substituting for the other, and the
 * ticket subject must summarize the QUESTION, not the chatbot's solution
 * text. Regression coverage for the bug where the chatbot's answer was
 * sent as the ticket subject and the original question was lost entirely.
 */

Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => true,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' }),
}));

const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });
const escalateToSupport = vi.fn();
const sendChatMessage = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: (...args: unknown[]) => escalateToSupport(...args),
  uploadTicketAttachment: vi.fn(),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: vi.fn(),
  sendSessionMessage: vi.fn(),
  getChatSessionHistory: vi.fn().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] }),
  getChatSession: vi.fn(),
}));

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';

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

/** Mirrors fillMinimalAuthenticatedForm from ticketAttachments.test.tsx --
 * the minimum fields the authenticated ticket form requires to enable
 * "Submit Ticket", without touching the Subject field (so a prefilled
 * value, or lack of one, survives untouched into the assertions). */
const fillMinimalAuthenticatedFormExceptSubject = async () => {
  await act(async () => {
    fireEvent.change(
      screen.getByPlaceholderText('Describe what happened, what you expected, and what actually happened...'),
      { target: { value: 'This is a sufficiently long description of the problem I am facing.' } },
    );
    fireEvent.click(screen.getByText('Other'));
  });
};

beforeEach(() => {
  localStorage.clear();
  getSupportTickets.mockReset().mockResolvedValue({ data: [] });
  escalateToSupport.mockReset();
  sendChatMessage.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Raising a ticket from an unhelpful answer', () => {
  it('prefills the subject from the original question, not the chatbot answer', async () => {
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
    await screen.findByText('🎫 Raise a Support Ticket');

    const subjectInput = screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement;
    expect(subjectInput.value).toContain('Why am I unable to reset my password');
    expect(subjectInput.value).not.toContain('Forgot Password link');
  });

  it('sends the original question and chatbot answer as separate fields on submit, distinct from subject/description', async () => {
    sendChatMessage.mockResolvedValue(mockAnswer(ANSWER, 'account_access_general_issue'));
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00050', status: 'open', message: 'Created',
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
    await screen.findByText('🎫 Raise a Support Ticket');

    await fillMinimalAuthenticatedFormExceptSubject();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    const submitted = escalateToSupport.mock.calls[0][0];

    expect(submitted.issue_details.original_question).toBe(QUESTION);
    expect(submitted.issue_details.chatbot_answer).toBe(ANSWER);
    // The customer's freeform description (typed fresh in the modal) must
    // stay independent of the captured question/answer pair.
    expect(submitted.issue_description).toBe('This is a sufficiently long description of the problem I am facing.');
    expect(submitted.issue_description).not.toBe(ANSWER);
  });

  it('the generic "Raise a support ticket" link (no prior answer) sends no question/answer -- nothing fabricated', async () => {
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00051', status: 'open', message: 'Created',
    });

    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket'));
    });
    await screen.findByText('🎫 Raise a Support Ticket');

    const subjectInput = screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement;
    expect(subjectInput.value).toBe('');

    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Something is broken' } });
    });
    await fillMinimalAuthenticatedFormExceptSubject();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    const submitted = escalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toBeUndefined();
    expect(submitted.issue_details.chatbot_answer).toBeUndefined();
  });

  it('caps a long one-sentence question at the backend subject limit (200 characters)', async () => {
    const longQuestion = 'Why '.concat('does this very long question keep on going '.repeat(10), 'and never end?');
    expect(longQuestion.length).toBeGreaterThan(200);
    sendChatMessage.mockResolvedValue(mockAnswer(ANSWER, 'account_access_general_issue'));

    await openWidget();
    await sendMessage(longQuestion);
    await screen.findByText(ANSWER);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as not helpful'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket →'));
    });
    await screen.findByText('🎫 Raise a Support Ticket');

    const subjectInput = screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement;
    expect(subjectInput.value.startsWith('Why does this very long question')).toBe(true);
    expect(subjectInput.value.length).toBeLessThanOrEqual(200);
    expect(subjectInput.maxLength).toBe(200);
  });
});
