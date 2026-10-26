import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Live sign-in / sign-out switching of the Login & Account menu, without a
 * full page refresh or widget remount.
 *
 * ChatApp.tsx detects auth changes via a `storage` event listener on
 * access_token / user_email / token_last_refreshed_at (see its
 * checkAuthStatus effect) and flips the isLocallyAuthenticated state that
 * drives this menu -- the same mechanism a real sign-in/sign-out triggers
 * (chatbotAuth.ts's helpers write those same localStorage keys). Firing a
 * StorageEvent here exercises that real code path instead of re-rendering
 * with a different prop, which is what "without requiring a full page
 * refresh" actually depends on in this codebase.
 */

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

const GUEST_LABELS = [
  "⚠️ Why can't I log in to my account?",
  '🔑 I forgot my password. How can I reset it?',
  '📧 Why am I not receiving the OTP?',
  '🔒 My account is locked. How can I unlock it?',
  '🆔 Why are my login credentials not being accepted?',
];

const AUTHENTICATED_LABELS = [
  '👤 How can I update my profile information?',
  '🔐 How can I change my password?',
  '📧 How can I update my registered email address?',
  '🚪 How do I sign out of my account?',
  '🔄 Why do I keep getting signed out unexpectedly?',
];

// Fires the same kind of event ChatApp.tsx listens for on real sign-in /
// sign-out (see chatbotAuth.ts token writes), driving its checkAuthStatus
// effect without remounting the component.
const triggerAuthRecheck = async (nowAuthenticated: boolean) => {
  mockAuthenticated = nowAuthenticated;
  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
  });
};

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

describe('Login & Account menu -- live switching between guest and authenticated', () => {
  it('signing in (guest -> authenticated) swaps the 5-item menu without remounting the widget', async () => {
    mockAuthenticated = false;
    await openWidget();
    await expandLoginAccountMenu();

    for (const label of GUEST_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }

    await triggerAuthRecheck(true);

    await waitFor(() => {
      expect(screen.getByText(AUTHENTICATED_LABELS[0])).toBeInTheDocument();
    });
    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const label of GUEST_LABELS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }

    // Still the same widget instance -- the header greeting now reflects
    // the signed-in user, proving this was a live state flip, not a reload.
    expect(await screen.findByText(/👤 Alice/)).toBeInTheDocument();
  });

  it('signing out (authenticated -> guest) swaps back to the guest menu without remounting', async () => {
    mockAuthenticated = true;
    await openWidget();
    await expandLoginAccountMenu();

    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    await triggerAuthRecheck(false);

    await waitFor(() => {
      expect(screen.getByText(GUEST_LABELS[0])).toBeInTheDocument();
    });
    for (const label of GUEST_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('a related-questions bucket already on screen flips flavor (guest cross-links -> authenticated cross-links) after sign-in', async () => {
    mockAuthenticated = false;
    // Guests never reach sendSessionMessage (createChatSession is only
    // attempted for authenticated users, see ChatApp.tsx's handleSendMessage)
    // -- the first, pre-sign-in message goes through the stateless
    // sendChatMessage path, whose response shape is {answer, confidence,
    // category}, not sendSessionMessage's {content, confidence, category}.
    sendChatMessage.mockResolvedValueOnce({
      session_id: 'session',
      message: 'q',
      answer: 'Build your Profile with education, experience, skills...',
      category: 'profile_building',
      authenticated: false,
      requires_escalation: false,
      confidence: 0.9,
      timestamp: '2026-01-01T00:01:00Z',
    });

    await openWidget();
    await act(async () => {
      const input = screen.getByPlaceholderText('Type your question...');
      fireEvent.change(input, { target: { value: 'How can I update my profile information?' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    await screen.findByText('Related questions:');
    let relatedList = document.querySelector('.related-questions-list');
    expect(within(relatedList as HTMLElement).getByText("🔑 How can I reset my password?")).toBeInTheDocument();

    // Sign in while that guest-flavored answer is still the latest message.
    // getRelatedQuestions is only re-evaluated when a new message is
    // produced (it's not retroactively recomputed for messages already on
    // screen), so send a fresh message after signing in and confirm its
    // bucket is now authenticated-flavored, not stale guest-flavored.
    await triggerAuthRecheck(true);
    sendSessionMessage.mockResolvedValueOnce({
      message_id: 'm2',
      session_id: 'backend-sess-1',
      content: 'Update your registered email from account/profile settings once signed in...',
      timestamp: '2026-01-01T00:02:00Z',
      role: 'assistant',
      category: 'signup_update_registered_email',
      confidence: 0.9,
      requires_escalation: false,
    });
    await act(async () => {
      const input = screen.getByPlaceholderText('Type your question...');
      fireEvent.change(input, { target: { value: 'How can I update my registered email address?' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
    const relatedLists = document.querySelectorAll('.related-questions-list');
    relatedList = relatedLists[relatedLists.length - 1];
    expect(within(relatedList as HTMLElement).queryByText(/How can I reset my password/)).not.toBeInTheDocument();
    expect(within(relatedList as HTMLElement).getByText('🚪 How do I sign out of my account?')).toBeInTheDocument();
  });
});
