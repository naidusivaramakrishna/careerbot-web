import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Login & Account suggested questions -- the GUEST-facing 5-card menu and
 * its related-questions buckets. (Authenticated suggestions are covered in
 * loginAccountAuthenticatedSuggestions.test.tsx; switching between the two
 * live is covered in loginAccountAuthStateSwitch.test.tsx.)
 *
 * The 5 guest questions are access/troubleshooting -- getting INTO the
 * account, not managing it once inside. Every phrase was verified live
 * against the real backend KB before being added (each resolves to a
 * distinct topic, no duplicate answers).
 */

Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => false,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

const sendChatMessage = vi.fn();
const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: vi.fn(),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: vi.fn(),
  sendSessionMessage: vi.fn(),
  getChatSessionHistory: vi.fn(),
  getChatSession: vi.fn(),
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

const expandLoginAccountMenu = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText(/Login & Account/));
  });
};

const sendMessage = async (text: string) => {
  const input = screen.getByPlaceholderText('Type your question...');
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });
};

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

beforeEach(() => {
  localStorage.clear();
  sendChatMessage.mockReset();
});

describe('Login & Account (guest) -- initial suggested questions', () => {
  it('shows the Login & Account toggle on widget open, collapsed by default', async () => {
    await openWidget();
    expect(screen.getByText(/Login & Account/)).toBeInTheDocument();
    expect(screen.queryByText("⚠️ Why can't I log in to my account?")).not.toBeInTheDocument();
  });

  it('expands to show exactly the 5 guest-appropriate question cards -- access/troubleshooting, not account management', async () => {
    await openWidget();
    await expandLoginAccountMenu();

    const expected = [
      "⚠️ Why can't I log in to my account?",
      '🔑 I forgot my password. How can I reset it?',
      '📧 Why am I not receiving the OTP?',
      '🔒 My account is locked. How can I unlock it?',
      '🆔 Why are my login credentials not being accepted?',
    ];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const grid = screen.getByText(expected[0]).closest('.features-grid');
    expect(grid).not.toBeNull();
    expect(within(grid as HTMLElement).getAllByRole('button')).toHaveLength(5);

    // None of the authenticated-only account-management questions.
    expect(screen.queryByText(/How can I update my profile information/)).not.toBeInTheDocument();
    expect(screen.queryByText(/How can I update my registered email address/)).not.toBeInTheDocument();
    expect(screen.queryByText(/sign out/)).not.toBeInTheDocument();
  });

  it.each([
    ["⚠️ Why can't I log in to my account?", "Why can't I log in to my account?"],
    ['🔑 I forgot my password. How can I reset it?', 'I forgot my password. How can I reset it?'],
    ['📧 Why am I not receiving the OTP?', 'Why am I not receiving the OTP?'],
    ['🔒 My account is locked. How can I unlock it?', 'My account is locked. How can I unlock it?'],
    ['🆔 Why are my login credentials not being accepted?', 'Why are my login credentials not being accepted?'],
  ])('clicking "%s" sends the exact query "%s" through the existing chat flow', async (label, expectedQuery) => {
    sendChatMessage.mockResolvedValueOnce(mockAnswer('Some answer.', 'account_access_general_issue'));
    await openWidget();
    await expandLoginAccountMenu();

    await act(async () => {
      fireEvent.click(screen.getByText(label));
    });

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    expect(sendChatMessage.mock.calls[0][0]).toBe(expectedQuery);
  });

  it('initial questions remain visible and reachable by scrolling, however long the conversation grows', async () => {
    // Regression test for the removed "Show Suggestions" button: suggestions
    // used to auto-hide past messages.length > 5, requiring a click to bring
    // them back. They must now just always be there -- no count-based hide,
    // no separate button needed to get them back.
    sendChatMessage.mockResolvedValue(mockAnswer('Some answer.', 'account_access_general_issue'));
    await openWidget();
    // welcome(1) + 3x(user+answer) = 7 messages -- past the old >5 threshold.
    await sendMessage('A question');
    await screen.findByText('Some answer.');
    await sendMessage('Another question');
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
    await sendMessage('A third question');
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(3));

    expect(screen.getByText(/Login & Account/)).toBeInTheDocument();
    expect(screen.queryByText(/Show Suggestions/)).not.toBeInTheDocument();
  });
});

describe('Login & Account (guest) -- related questions match the answered topic', () => {
  it('shows the password-reset related bucket after a forgot_password answer', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'),
    );
    await openWidget();
    await sendMessage('I forgot my password. How can I reset it?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    // Never suggests itself back.
    expect(within(relatedList as HTMLElement).queryByText(/I forgot my password/)).not.toBeInTheDocument();
  });

  it('shows the OTP-specific related bucket after an otp_not_received answer', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Verification codes can take a minute or two...', 'otp_not_received'),
    );
    await openWidget();
    await sendMessage('Why am I not receiving the OTP?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText(/Why am I not receiving the OTP/)).not.toBeInTheDocument();
  });

  it('shows the account-locked related bucket after an account_locked answer -- cross-links only, not the same locked-account answer repeated', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Account is locked...', 'account_locked'),
    );
    await openWidget();
    await sendMessage('My account is locked. How can I unlock it?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText(/My account is locked/)).not.toBeInTheDocument();
  });

  it('account_access_general_issue does not suggest itself back after the KB routing fix that made "why can\'t I log in" resolve to this exact topic', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("Tell us a bit more about what's happening...", 'account_access_general_issue'),
    );
    await openWidget();
    await sendMessage("Why can't I log in to my account?");

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText(/Why can't I log in to my account/)).not.toBeInTheDocument();
  });

  it('profile_building does not suggest "Where can I edit my profile details?" back at itself (guest, reached via typed text)', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Build your Profile with education, experience, skills...', 'profile_building'),
    );
    await openWidget();
    await sendMessage('How can I update my profile information?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText(/How can I update my profile information/)).not.toBeInTheDocument();
    // Guest-flavored cross-links (login/reset), not authenticated ones.
    expect(within(relatedList as HTMLElement).getByText('🔑 How can I reset my password?')).toBeInTheDocument();
  });

  it('shows no Related Questions section for a category with no mapping, instead of a dead/irrelevant list', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Some generic unmapped answer.', 'some_unmapped_category'),
    );
    await openWidget();
    await sendMessage('A generic question');

    await screen.findByText('Some generic unmapped answer.');
    expect(screen.queryByText('Related questions:')).not.toBeInTheDocument();
  });
});

describe('Login & Account (guest) -- clicking a related question', () => {
  it('sends the exact related-question text through the existing chat flow', async () => {
    sendChatMessage
      .mockResolvedValueOnce(mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'))
      .mockResolvedValueOnce(mockAnswer('Account is locked...', 'account_locked'));

    await openWidget();
    await sendMessage('I forgot my password. How can I reset it?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list') as HTMLElement;
    const button = within(relatedList).getByText(/account is locked/i);

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
    expect(sendChatMessage.mock.calls[1][0]).toBe(button.textContent);
  });

  it('related questions update after the follow-up answer -- a genuinely different topic shows its own bucket, not a circular one', async () => {
    sendChatMessage
      .mockResolvedValueOnce(mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'))
      .mockResolvedValueOnce(mockAnswer('Verification codes can take a minute or two...', 'otp_not_received'));

    await openWidget();
    await sendMessage('I forgot my password. How can I reset it?');
    await screen.findByText('Related questions:');

    await sendMessage('Why am I not receiving the OTP?');
    await screen.findByText('Verification codes can take a minute or two...');

    const relatedLists = document.querySelectorAll('.related-questions-list');
    const latest = relatedLists[relatedLists.length - 1];
    expect(within(latest as HTMLElement).queryByText(/Why am I not receiving the OTP/)).not.toBeInTheDocument();
  });
});

describe('Login & Account (guest) -- no duplicate suggestions within a bucket', () => {
  it('a bucket never contains the same question text twice', async () => {
    sendChatMessage.mockResolvedValue(mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'));
    await openWidget();
    await sendMessage('I forgot my password. How can I reset it?');
    await screen.findByText('Related questions:');

    const relatedList = document.querySelector('.related-questions-list') as HTMLElement;
    const buttons = within(relatedList).getAllByRole('button');
    const texts = buttons.map((b) => b.textContent);
    expect(new Set(texts).size).toBe(texts.length);
  });
});
