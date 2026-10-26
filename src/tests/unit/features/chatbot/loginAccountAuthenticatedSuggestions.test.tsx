import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Login & Account suggested questions -- the AUTHENTICATED-facing 5-card
 * menu and its related-questions buckets. (Guest suggestions are covered
 * in loginAccountSuggestions.test.tsx; switching between the two live is
 * covered in loginAccountAuthStateSwitch.test.tsx.)
 *
 * These 5 prioritize account management (profile, password, email, sign
 * out) over the guest-facing "how do I get INTO my account" questions --
 * an already-logged-in user doesn't need "why can't I log in" as a primary
 * suggestion. Every phrase was verified live against the real backend
 * before being added. "Why can't I save my profile changes?" was
 * deliberately NOT included: it has no distinct KB answer (falls back to
 * the same generic profile_building blurb, which doesn't address a save
 * failure at all) -- an unsupported question per the instruction not to
 * invent KB content.
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

const sendChatMessage = vi.fn();
const sendSessionMessage = vi.fn();
const createChatSession = vi.fn();
const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: vi.fn(),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: (...args: unknown[]) => createChatSession(...args),
  sendSessionMessage: (...args: unknown[]) => sendSessionMessage(...args),
  getChatSessionHistory: vi.fn().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] }),
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

const mockAnswer = (answer: string, category: string, confidence = 0.9) => ({
  message_id: 'm1',
  session_id: 'backend-sess-1',
  content: answer,
  timestamp: '2026-01-01T00:01:00Z',
  role: 'assistant',
  category,
  confidence,
  requires_escalation: false,
});

beforeEach(() => {
  localStorage.clear();
  sendChatMessage.mockReset();
  sendSessionMessage.mockReset();
  createChatSession.mockReset().mockResolvedValue({
    session_id: 'backend-sess-1',
    user_id: 'user-1',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    title: 'New Chat',
    preview: 'New conversation...',
    message_count: 0,
  });
});

describe('Login & Account (authenticated) -- initial suggested questions', () => {
  it('expands to show exactly the 5 authenticated-appropriate question cards -- account management, not guest login troubleshooting', async () => {
    await openWidget();
    await expandLoginAccountMenu();

    const expected = [
      '👤 How can I update my profile information?',
      '🔐 How can I change my password?',
      '📧 How can I update my registered email address?',
      '🚪 How do I sign out of my account?',
      '🔄 Why do I keep getting signed out unexpectedly?',
    ];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const grid = screen.getByText(expected[0]).closest('.features-grid');
    expect(grid).not.toBeNull();
    expect(within(grid as HTMLElement).getAllByRole('button')).toHaveLength(5);

    expect(screen.queryByText(/Why can't I log in to my account/)).not.toBeInTheDocument();
    expect(screen.queryByText(/My account is locked/)).not.toBeInTheDocument();
    expect(screen.queryByText(/login credentials/)).not.toBeInTheDocument();
    expect(screen.queryByText(/save my profile changes/)).not.toBeInTheDocument();
  });

  it.each([
    ['👤 How can I update my profile information?', 'How can I update my profile information?'],
    ['🔐 How can I change my password?', 'How can I change my password?'],
    ['📧 How can I update my registered email address?', 'How can I update my registered email address?'],
    ['🚪 How do I sign out of my account?', 'How do I sign out of my account?'],
    ['🔄 Why do I keep getting signed out unexpectedly?', 'Why do I keep getting signed out unexpectedly?'],
  ])('clicking "%s" sends the exact query "%s" through the existing (session-backed) chat flow', async (label, expectedQuery) => {
    sendSessionMessage.mockResolvedValueOnce(mockAnswer('Some answer.', 'profile_building'));
    await openWidget();
    await expandLoginAccountMenu();

    await act(async () => {
      fireEvent.click(screen.getByText(label));
    });

    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
    expect(sendSessionMessage.mock.calls[0][1]).toBe(expectedQuery);
  });
});

describe('Login & Account (authenticated) -- related questions are authenticated-appropriate', () => {
  it('profile_building does not suggest itself, and does not suggest pre-login questions ("why can\'t I log in" / "reset my password") to an already-logged-in user', async () => {
    sendSessionMessage.mockResolvedValueOnce(
      mockAnswer('Build your Profile with education, experience, skills...', 'profile_building'),
    );
    await openWidget();
    await expandLoginAccountMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('👤 How can I update my profile information?'));
    });

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText('👤 Where can I edit my profile details?')).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).queryByText(/Why can't I log in to my account/)).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).queryByText(/How can I reset my password/)).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('📧 How can I update my name or email address?')).toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('🚪 How do I sign out of my account?')).toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('🔄 Why do I keep getting signed out unexpectedly?')).toBeInTheDocument();
  });

  it('signup_update_registered_email does not suggest itself or pre-login questions either', async () => {
    sendSessionMessage.mockResolvedValueOnce(
      mockAnswer('Update your registered email from account/profile settings once signed in...', 'signup_update_registered_email'),
    );
    await openWidget();
    await expandLoginAccountMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('📧 How can I update my registered email address?'));
    });

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText(/How can I update my registered email address/)).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).queryByText(/Why can't I log in to my account/)).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('👤 Where can I edit my profile details?')).toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('🚪 How do I sign out of my account?')).toBeInTheDocument();
  });

  it('signout_not_working and session_unexpected_signout cross-link to each other and to account-management topics, not to each other\'s own answer', async () => {
    sendSessionMessage.mockResolvedValueOnce(
      mockAnswer("Click your profile icon (top right) and select 'Sign Out'...", 'signout_not_working'),
    );
    await openWidget();
    await expandLoginAccountMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('🚪 How do I sign out of my account?'));
    });

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list');
    expect(relatedList).not.toBeNull();
    expect(within(relatedList as HTMLElement).queryByText(/How do I sign out of my account/)).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('🔄 Why do I keep getting signed out unexpectedly?')).toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('👤 How can I update my profile information?')).toBeInTheDocument();
  });
});

describe('Login & Account (authenticated) -- action links', () => {
  it('shows a real inline link to /profile for profile questions (no login-trigger, already authenticated)', async () => {
    sendSessionMessage.mockResolvedValueOnce(
      mockAnswer('Build your Profile with education, experience, skills...', 'profile_building'),
    );
    await openWidget();
    await expandLoginAccountMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('👤 How can I update my profile information?'));
    });

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/profile');
    const messageText = screen.getByText(/Build your Profile with education/).closest('.message-text');
    expect(messageText?.textContent).not.toContain('please log in');
  });

  it('shows a real inline link to /profile for the registered-email question too', async () => {
    sendSessionMessage.mockResolvedValueOnce(
      mockAnswer('Update your registered email from account/profile settings once signed in...', 'signup_update_registered_email'),
    );
    await openWidget();
    await expandLoginAccountMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('📧 How can I update my registered email address?'));
    });

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('password-change still links to /forgot-password -- no separate change-password page exists', async () => {
    sendSessionMessage.mockResolvedValueOnce(
      mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'),
    );
    await openWidget();
    await expandLoginAccountMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('🔐 How can I change my password?'));
    });

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });
});
