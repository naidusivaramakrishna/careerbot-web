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

// Guided-flow navigation: welcome -> "I'm a customer and need support" ->
// support sub-menu -> "Login & Account" -> its question list. Replaces the
// old single-click expand/collapse toggle now that the quick-menu is a
// progressive, message-by-message flow instead of an always-visible panel.
// Each call produces a NEW question-list message -- use getAllByText/
// queryAllByText (not getByText/queryByText) wherever a test navigates here
// more than once, since an earlier call's message text stays in the
// transcript (only its now-answered option group's buttons disappear)
// rather than being replaced.
const expandLoginAccountMenu = async () => {
  const supportOptions = screen.getAllByText("I'm a customer and need support");
  await act(async () => {
    fireEvent.click(supportOptions[supportOptions.length - 1]);
  });
  // Every menu along the way collapses entirely once clicked (global
  // option-lifecycle behavior) -- a plain "more menus than before" count
  // no longer holds, since the welcome/initial menu disappearing and the
  // support sub-menu appearing can net to zero change. Wait instead for
  // the newest block to actually be the support sub-menu (4 options).
  await waitFor(() => {
    const menus = document.querySelectorAll('.guided-menu-options');
    const last = menus[menus.length - 1];
    expect(last?.querySelectorAll('button').length).toBe(4);
  }, { timeout: 3000 });

  const loginAccountOptions = screen.getAllByText('Login & Account');
  await act(async () => {
    fireEvent.click(loginAccountOptions[loginAccountOptions.length - 1]);
  });
  // Same reasoning -- wait for the newest block to be this topic's own
  // 5-item question list.
  await waitFor(() => {
    const menus = document.querySelectorAll('.guided-menu-options');
    const last = menus[menus.length - 1];
    expect(last?.querySelectorAll('button').length).toBe(5);
  }, { timeout: 3000 });
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
  // Each topic's question list is built once, when that guided-flow message
  // is created (buildTopicQuestionOptions(topic, isLocallyAuthenticated) at
  // click time) -- not retroactively recomputed if auth state changes while
  // it's already on screen. This is the same, already-established behavior
  // as getRelatedQuestions (see this file's 3rd test below, and
  // loginAccountAuthStateSwitch's own comment on it): a snapshot at
  // creation time, re-evaluated on the NEXT fresh navigation/message, not
  // the existing one in place. So "live switching" here means a fresh
  // navigation after the auth change correctly reflects the new state --
  // not that an already-rendered list mutates underneath the user.
  // There's only one "I'm a customer and need support" entry point until a
  // real question has been answered (its follow-up's "I have more
  // questions" is what creates a second, fresh one) -- so re-navigating
  // after the auth flip requires actually answering a leaf question first,
  // not just calling expandLoginAccountMenu() again (its button would
  // already be disabled from the first call, a no-op).
  const answerAQuestionAndReturnToMenu = async () => {
    // Strictly more than before this click -- clicking "I'm a customer and
    // need support" earlier (inside expandLoginAccountMenu) already left
    // behind a *user-echo* message with that exact text too, so a weaker
    // "more than 1" check is already satisfied by button+echo from that
    // first round alone, before this fresh one has actually landed.
    const countBefore = screen.getAllByText("I'm a customer and need support").length;
    await act(async () => {
      fireEvent.click(screen.getByText('I have more questions'));
    });
    // "I have more questions" now asks continue-topic vs explore-different
    // first -- "Explore a different topic" is what reaches the initial menu.
    const exploreDifferentTopic = await screen.findByText('Explore a different topic', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(exploreDifferentTopic);
    });
    await waitFor(() => {
      expect(screen.getAllByText("I'm a customer and need support").length).toBeGreaterThan(countBefore);
    }, { timeout: 3000 });
  };

  it('signing in (guest -> authenticated) makes a fresh navigation show the 5-item authenticated menu, not the stale guest one', async () => {
    mockAuthenticated = false;
    sendChatMessage.mockResolvedValueOnce({
      session_id: 'session', message: 'q', answer: 'Some answer.', category: 'account_access_general_issue',
      authenticated: false, requires_escalation: false, confidence: 0.9, timestamp: '2026-01-01T00:00:00Z',
    });
    await openWidget();
    await expandLoginAccountMenu();

    for (const label of GUEST_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }

    // Reach the "I have more questions" follow-up so there's a fresh entry
    // point to re-navigate from after signing in.
    await act(async () => {
      fireEvent.click(screen.getByText(GUEST_LABELS[0]));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });

    await triggerAuthRecheck(true);
    // Still the same widget instance -- the header greeting now reflects
    // the signed-in user, proving this was a live state flip, not a reload.
    expect(await screen.findByText(/👤 Alice/)).toBeInTheDocument();

    // Fresh navigation, now authenticated -- a new snapshot.
    await answerAQuestionAndReturnToMenu();
    await expandLoginAccountMenu();

    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // The earlier guest-flavored message's own text is still in the
    // transcript (see answeredOptionGroupIds) -- only its now-answered
    // option group's buttons are gone; what matters is the NEW message is
    // authenticated-flavored, which the assertions above confirm.
  }, 30_000); // two full navigations, each with a real ~1.2s guided-message delay

  it('signing out (authenticated -> guest) makes a fresh navigation show the guest menu, not the stale authenticated one', async () => {
    mockAuthenticated = true;
    sendSessionMessage.mockResolvedValueOnce({
      message_id: 'm1', session_id: 'backend-sess-1', content: 'Some answer.', timestamp: '2026-01-01T00:01:00Z',
      role: 'assistant', category: 'profile_building', confidence: 0.9, requires_escalation: false,
    });
    await openWidget();
    await expandLoginAccountMenu();

    for (const label of AUTHENTICATED_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    await act(async () => {
      fireEvent.click(screen.getByText(AUTHENTICATED_LABELS[0]));
    });
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });

    // A real sign-out resets the whole transcript back to the bare welcome
    // screen (see ChatApp.tsx's "Logout detected" branch, startNewAccountGeneration
    // + initializeChat) -- unlike signing IN mid-conversation, which keeps it.
    // Never leave a signed-out visitor's conversation on screen for whoever
    // uses the device next. So there's no "I have more questions" follow-up
    // to click through afterward -- the next navigation starts fresh.
    await triggerAuthRecheck(false);
    await waitFor(() => {
      expect(screen.queryByText(/👤 Alice/)).not.toBeInTheDocument();
    });
    await screen.findByText(/Hi! I'm CareerBot/i, {}, { timeout: 3000 });

    await expandLoginAccountMenu();

    for (const label of GUEST_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  }, 30_000);

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
