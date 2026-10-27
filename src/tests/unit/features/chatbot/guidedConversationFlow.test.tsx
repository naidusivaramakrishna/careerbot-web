import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, 30 s test timeout): see the
// file. These tests wait out real ~1.2 s guided-message delays, so the 5 s
// default timed out on a loaded CI runner ("Unit Tests (new failures)").
import './chatAppSuiteSetup';

/**
 * Progressive, multi-step guided conversation flow: the widget opens with
 * only a welcome message and exactly 3 options (not every topic/question at
 * once); each selection echoes as a chat message, then -- after a short
 * delay -- the next bot message with only that step's relevant options
 * appears. Leaf questions go through the exact same KB-backed
 * handleSendMessage() pipeline every typed message already uses.
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

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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

const guestAnswer = (answer: string, category: string) => ({
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
  mockAuthenticated = false;
  mockPush.mockReset();
  sendChatMessage.mockReset();
  sendSessionMessage.mockReset();
  createChatSession.mockReset();
  getSupportTickets.mockReset().mockResolvedValue({ data: [] });
});

describe('Guided flow -- initial screen', () => {
  it('shows only the welcome message and exactly 3 options, not any topic or question list', async () => {
    await openWidget();

    expect(screen.getByText('I want to know about products and features')).toBeInTheDocument();
    expect(screen.getByText('I need help with subscription or payment')).toBeInTheDocument();
    expect(screen.getByText("I'm a customer and need support")).toBeInTheDocument();

    const welcomeMenu = screen.getByText('I want to know about products and features').closest('.guided-menu-options');
    expect(welcomeMenu).not.toBeNull();
    expect(welcomeMenu!.querySelectorAll('button')).toHaveLength(3);

    // None of the leaf questions or nested support options are visible yet.
    expect(screen.queryByText('Login & Account')).not.toBeInTheDocument();
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
    expect(screen.queryByText(/What is included in the Free Plan/)).not.toBeInTheDocument();
  });

  it('respects the existing showSuggestedQuestions setting -- off means no guided options at all', async () => {
    localStorage.setItem('careerbot-settings', JSON.stringify({ showSuggestedQuestions: false }));
    await openWidget();

    expect(screen.queryByText('I want to know about products and features')).not.toBeInTheDocument();
    expect(screen.queryByText("I'm a customer and need support")).not.toBeInTheDocument();
  });
});

describe('Guided flow -- option 1: products and features', () => {
  it('echoes the selection, then shows that topic\'s existing prepared questions after a short delay', async () => {
    await openWidget();

    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });

    // Echoed immediately as its own chat message -- the welcome menu's own
    // button collapses the instant it's clicked (global option-lifecycle
    // behavior), so exactly one instance of this text remains: the echo.
    expect(screen.getByText('I want to know about products and features')).toBeInTheDocument();
    expect(screen.queryByText('I need help with subscription or payment')).not.toBeInTheDocument();

    // The topic's existing prepared questions appear after the delay --
    // same guest-flavored text as the old always-visible menu, unchanged.
    await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });
    expect(screen.getByText('🎯 How does Job Match help me find suitable jobs?')).toBeInTheDocument();
  });

  it('a leaf question goes through the real backend KB, unchanged', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });
    await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText('📄 What can CareerBot help me do with my resume?'));
    });

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    expect(sendChatMessage.mock.calls[0][0]).toBe('What can CareerBot help me do with my resume?');
    // Regex, not exact string: resume_optimization carries an inline action
    // link (a pre-existing, unrelated feature), so the message-text node's
    // full text content is the answer plus the link's lead-in sentence.
    expect(await screen.findByText(/Use the Resume Builder/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe('Guided flow -- option 2: subscription or payment', () => {
  it('shows the existing pricing questions directly, no intermediate sub-menu', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });

    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    expect(screen.getByText('💯 What is the refund policy?')).toBeInTheDocument();
  });

  it('renders all 9 pricing questions in the DOM -- a long list is never truncated to fit the viewport', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });

    const firstOption = await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    const menu = firstOption.closest('.guided-menu-options');
    expect(menu).not.toBeNull();
    const labels = Array.from(menu!.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual([
      '✅ What is included in the Free Plan?',
      '💎 What features are in the Premium Plan?',
      '🏢 What does the Enterprise Plan include?',
      '📊 What are the differences between plans?',
      '⬆️ How can I upgrade my plan?',
      '💯 What is the refund policy?',
      '💰 How much does Premium cost?',
      '❌ Can I cancel my subscription?',
      '🔄 Can I change my plan?',
    ]);
  });

  it('every option button carries its full label as a title attribute, for an accessible hover tooltip when the visible text is CSS-truncated', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });

    // findByText resolves to the inner label span (the ellipsis styling
    // lives there, not the button -- see .option-label-ellipsis in
    // ChatApp.css), so climb to the real button to check its title.
    const label = await screen.findByText('📊 What are the differences between plans?', {}, { timeout: 3000 });
    expect(label.closest('button')).toHaveAttribute('title', '📊 What are the differences between plans?');
  });
});

describe('Guided flow -- option 3: customer support', () => {
  it('shows exactly the 4 specified next-step options: Login & Account, Subscription & Pricing, Payment Support, Contact Support', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });

    const supportOptions = await screen.findByText('Login & Account', {}, { timeout: 3000 });
    const menu = supportOptions.closest('.guided-menu-options');
    expect(menu).not.toBeNull();
    const labels = Array.from(menu!.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['Login & Account', 'Subscription & Pricing', 'Payment Support', 'Contact Support']);
  });

  it('Payment Support shows the existing payment-support questions', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });
    await screen.findByText('Payment Support', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('Payment Support'));
    });

    await screen.findByText('📊 How can I check my payment status?', {}, { timeout: 3000 });
    expect(screen.getByText('🆘 How can I get help with a payment issue?')).toBeInTheDocument();
  });

  it('Subscription & Pricing under Customer Support shows the same existing pricing questions as option 2', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });
    await screen.findByText('Subscription & Pricing', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('Subscription & Pricing'));
    });

    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
  });

  it('Contact Support (guest) echoes the choice, then navigates to the dedicated support ticket page -- no modal, nothing submitted', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });
    await screen.findByText('Contact Support', {}, { timeout: 3000 });

    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    expect(getSupportTickets).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByText('Contact Support'));
    });

    // Echoed as a chat message immediately -- the support sub-menu
    // collapses entirely the instant it's clicked, so exactly one instance
    // of this text remains: the echo. Its siblings are gone too.
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.queryByText('Login & Account')).not.toBeInTheDocument();

    // Navigates to the dedicated page after a short beat -- not instantly,
    // and no modal opens, nothing is submitted/created in the meantime.
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/support/tickets/new'), { timeout: 3000 });
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    expect(getSupportTickets).not.toHaveBeenCalled();
  });

  it('Contact Support (signed-in) navigates to the dashboard Support Center instead of opening an in-widget modal', async () => {
    mockAuthenticated = true;
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });
    await screen.findByText('Contact Support', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText('Contact Support'));
    });

    await waitFor(
      () => expect(mockPush).toHaveBeenCalledWith('/dashboard/support-history?tab=tickets&raise=1'),
      { timeout: 3000 },
    );
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
  });
});

describe('Guided flow -- post-answer follow-up', () => {
  it('after a KB answer, offers "I have more questions" and "I\'m all set" -- not the normal Was this helpful prompt', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('What is included in the Free Plan: ...', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('✅ What is included in the Free Plan?'));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));

    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });
    expect(screen.getByText('I have more questions')).toBeInTheDocument();
    expect(screen.getByText("I'm all set")).toBeInTheDocument();
    // The real KB-answer message keeps its normal feedback UI unchanged
    // (preserving existing functionality) -- it's the separate follow-up
    // prompt message that shows the guided options instead of feedback on
    // itself, not a removal of "Was this helpful?" everywhere.
    expect(screen.getByText('Was this helpful?')).toBeInTheDocument();
  });

  it('"I\'m all set" shows a closing message and never creates a ticket', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('✅ What is included in the Free Plan?'));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText("I'm all set"));
    });

    await screen.findByText(/Glad I could help/, {}, { timeout: 3000 });
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    expect(getSupportTickets).not.toHaveBeenCalled();
  });

  it('"I have more questions" asks continue-topic vs explore-different first, not the 3 initial options directly', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('✅ What is included in the Free Plan?'));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText('I have more questions'));
    });

    await screen.findByText('Would you like to continue with this topic, or explore something different?', {}, { timeout: 3000 });
    expect(screen.getByText('Ask another question')).toBeInTheDocument();
    expect(screen.getByText('Explore a different topic')).toBeInTheDocument();
    // The 3 initial topics have NOT reappeared yet -- only after one of
    // the two choices above is made. "I need help with subscription or
    // payment" legitimately has exactly 1 instance already (the earlier
    // echo of picking it, which stays in history) -- a fresh button
    // reappearing would make that 2.
    expect(screen.getAllByText('I need help with subscription or payment')).toHaveLength(1);
    expect(screen.queryByText("I'm a customer and need support")).not.toBeInTheDocument();
  }, 30_000);

  it('"Explore a different topic" is the only path that shows the 3 initial options again', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('✅ What is included in the Free Plan?'));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('I have more questions'));
    });
    await screen.findByText('Explore a different topic', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText('Explore a different topic'));
    });

    await waitFor(() => {
      expect(screen.getAllByText('I want to know about products and features').length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    expect(screen.getAllByText('I need help with subscription or payment').length).toBeGreaterThan(0);
    expect(screen.getAllByText("I'm a customer and need support").length).toBeGreaterThan(0);
  }, 30_000);

  it('"Ask another question" shows the same topic\'s remaining questions, not the question already asked', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('✅ What is included in the Free Plan?'));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('I have more questions'));
    });
    await screen.findByText('Ask another question', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByText('Ask another question'));
    });

    // The remaining 8 pricing questions appear...
    await screen.findByText('💎 What features are in the Premium Plan?', {}, { timeout: 3000 });
    expect(screen.getByText('🔄 Can I change my plan?')).toBeInTheDocument();
    // ...but the one already asked is excluded entirely, not re-offered --
    // and the 3 initial topics never appeared at all on this path.
    expect(screen.queryByText('✅ What is included in the Free Plan?')).not.toBeInTheDocument();
    // Exactly 1 instance (the earlier echo of picking it, which stays in
    // history) -- a fresh button from the initial menu would make it 2.
    expect(screen.getAllByText('I need help with subscription or payment')).toHaveLength(1);
  }, 30_000);
});

describe('Guided flow -- duplicate prevention', () => {
  it('a second click on an already-answered menu does nothing (no duplicate message, no duplicate API call)', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });
    await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });

    const button = screen.getByText('📄 What can CareerBot help me do with my resume?');
    await act(async () => {
      fireEvent.click(button);
      // Rapid second click on the same (now-disabled) button, before the
      // backend call resolves.
      fireEvent.click(button);
    });

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    // Give any accidental second scheduled message a chance to fire, then
    // confirm it didn't -- the core duplicate-prevention proof.
    await new Promise((resolve) => setTimeout(resolve, 1400));
    expect(sendChatMessage).toHaveBeenCalledTimes(1);
    // The question is echoed once as a user message (its text has no emoji
    // prefix -- handleSendMessage sends/displays action.question, not the
    // button's emoji-prefixed label), and the whole suggested-question list
    // -- including the clicked button itself -- has collapsed rather than
    // sitting there disabled forever.
    expect(screen.getByText('What can CareerBot help me do with my resume?')).toBeInTheDocument();
    expect(screen.queryByText('📄 What can CareerBot help me do with my resume?')).not.toBeInTheDocument();
  }, 30_000);

  it('picking one leaf question collapses the whole suggested-question list, leaving only the pick and its answer', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });
    const firstQuestion = await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });
    // All 6 sibling questions are up first -- the clutter this collapse fixes.
    expect(screen.getByText('🎯 How does Job Match help me find suitable jobs?')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(firstQuestion);
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    // Regex, not exact string: resume_optimization carries an inline action
    // link (a pre-existing, unrelated feature), so the message-text node's
    // full text content is the answer plus the link's lead-in sentence.
    await screen.findByText(/Use the Resume Builder/, {}, { timeout: 3000 });

    // The whole leaf list is gone -- picked question included -- leaving
    // just the echoed selection and its answer.
    expect(screen.queryByText('📄 What can CareerBot help me do with my resume?')).not.toBeInTheDocument();
    expect(screen.queryByText('🎯 How does Job Match help me find suitable jobs?')).not.toBeInTheDocument();
    expect(screen.getByText('What can CareerBot help me do with my resume?')).toBeInTheDocument();
  }, 30_000);

  it('the welcome menu collapses too, not just leaf question lists -- global option-lifecycle behavior', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });
    await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });

    // The welcome menu's OWN buttons -- including the two never clicked --
    // are gone entirely, not just the one picked, and not just disabled.
    // Only the echoed selection (plain text, not a button) remains.
    expect(screen.queryByText('I need help with subscription or payment')).not.toBeInTheDocument();
    expect(screen.queryByText("I'm a customer and need support")).not.toBeInTheDocument();
    expect(screen.getByText('I want to know about products and features')).toBeInTheDocument();
  });

  it('the support sub-menu collapses too, one level deeper than the welcome menu', async () => {
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });
    await screen.findByText('Login & Account', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('Login & Account'));
    });
    await screen.findByText("⚠️ Why can't I log in to my account?", {}, { timeout: 3000 });

    // The sub-menu's other siblings -- never clicked -- are gone too.
    expect(screen.queryByText('Subscription & Pricing')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Support')).not.toBeInTheDocument();
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
    expect(screen.getByText('Login & Account')).toBeInTheDocument();
  });

  it('revisiting the same topic via "I have more questions" shows a fresh full list, with no duplicate questions or answers', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });
    const firstQuestion = await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(firstQuestion);
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    const moreQuestions = await screen.findByText('I have more questions', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(moreQuestions);
    });
    // "I have more questions" now asks continue-topic vs explore-different
    // first -- "Explore a different topic" is what reaches the initial menu.
    const exploreDifferentTopic = await screen.findByText('Explore a different topic', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(exploreDifferentTopic);
    });
    // Scoped to the fresh initial-menu message specifically -- plain
    // getAllByText('I want to know about products and features') would also
    // match the original welcome button and this same text's own echoed
    // user message, and (since those two already exist) resolve before the
    // fresh button even renders.
    const freshMenuPrompt = await screen.findByText('No problem! What would you like to know?', {}, { timeout: 3000 });
    const freshMenu = freshMenuPrompt.closest('.message-content')!.querySelector<HTMLElement>('.guided-menu-options')!;
    const topicAgain = within(freshMenu).getByText('I want to know about products and features');
    await act(async () => {
      fireEvent.click(topicAgain);
    });

    await screen.findAllByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });
    // The fresh list is complete again (not re-collapsed or truncated)...
    expect(screen.getByText('🎯 How does Job Match help me find suitable jobs?')).toBeInTheDocument();
    // ...and nothing from the first round got duplicated: exactly one
    // echoed selection, one KB answer, one fresh question button this time.
    expect(screen.getAllByText('What can CareerBot help me do with my resume?')).toHaveLength(1);
    expect(screen.getAllByText(/Use the Resume Builder/)).toHaveLength(1);
    expect(screen.getAllByText('📄 What can CareerBot help me do with my resume?')).toHaveLength(1);
  }, 30_000);
});

describe('Guided flow -- authenticated users get the same flow with practical questions', () => {
  it('option 1 shows authenticated-appropriate questions for a signed-in user', async () => {
    mockAuthenticated = true;
    createChatSession.mockResolvedValue({
      session_id: 'backend-sess-1', user_id: 'user-1', status: 'active', created_at: '2026-01-01T00:00:00Z',
      title: 'New Chat', preview: 'New conversation...', message_count: 0,
    });
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });

    await screen.findByText('📄 How can I create or update my resume?', {}, { timeout: 3000 });
    expect(screen.queryByText('📄 What can CareerBot help me do with my resume?')).not.toBeInTheDocument();
  });
});

describe('Guided flow -- the delayed follow-up never lands out of order', () => {
  // ai-review P2 at 5a6b2e73: the leaf question's "Is there anything else"
  // follow-up is scheduled ~1.2 s after the KB answer, and nothing cancelled
  // it when the user sent something else in that window, or reset the
  // conversation while the KB request was still in flight.
  const messageTexts = () =>
    Array.from(document.querySelectorAll('.messages-container .message .message-text')).map((el) => el.textContent || '');

  const askFreePlanQuestion = async (answer: Promise<unknown> | ReturnType<typeof guestAnswer>) => {
    sendChatMessage.mockReturnValueOnce(answer instanceof Promise ? answer : Promise.resolve(answer));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('✅ What is included in the Free Plan?'));
    });
  };

  it('a question typed during the follow-up delay is not split from its answer by the old follow-up', async () => {
    await askFreePlanQuestion(guestAnswer('Free plan answer.', 'subscription_plans'));
    await screen.findByText('Free plan answer.', {}, { timeout: 3000 });

    // Typed inside the ~1.2 s window, and its answer is held back so the old
    // timer (if still live) fires while this request is in flight.
    let resolveTyped: (value: unknown) => void = () => {};
    sendChatMessage.mockReturnValueOnce(new Promise((resolve) => { resolveTyped = resolve; }));
    const input = screen.getByPlaceholderText('Type your question...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Can I pay yearly?' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });
    await act(async () => {
      resolveTyped(guestAnswer('Yearly answer.', 'subscription_plans'));
    });
    await screen.findByText('Yearly answer.', {}, { timeout: 3000 });

    const texts = messageTexts();
    const typedAt = texts.indexOf('Can I pay yearly?');
    expect(typedAt).toBeGreaterThan(-1);
    expect(texts[typedAt + 1]).toBe('Yearly answer.');
    expect(texts.slice(typedAt)).not.toContain('Is there anything else I can help with?');
  }, 30_000);

  it('New Chat while the leaf question is still loading leaves no stale follow-up in the fresh conversation', async () => {
    let resolveAnswer: (value: unknown) => void = () => {};
    await askFreePlanQuestion(new Promise((resolve) => { resolveAnswer = resolve; }));
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByTitle('New Chat'));
    });
    await act(async () => {
      resolveAnswer(guestAnswer('Free plan answer.', 'subscription_plans'));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1600));
    });

    expect(screen.queryByText('Is there anything else I can help with?')).not.toBeInTheDocument();
  }, 30_000);

  it('control: with nothing else sent, the follow-up still appears after the answer', async () => {
    await askFreePlanQuestion(guestAnswer('Free plan answer.', 'subscription_plans'));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });
    const texts = messageTexts();
    expect(texts.indexOf('Is there anything else I can help with?')).toBeGreaterThan(texts.indexOf('Free plan answer.'));
  }, 30_000);
});

describe('Guided flow -- a typed send never swallows a navigation step the user already chose', () => {
  // codex P2 (MISSED) at 7603e4a8: the typed-send cancel also dropped
  // delayed NAVIGATION steps (topic / support menus, the Contact Support
  // redirect), whose source menu was already collapsed. Only the
  // post-answer "Is there anything else" prompt may be dropped; a pending
  // navigation step runs at once, ahead of the typed question.
  const messageTexts = () =>
    Array.from(document.querySelectorAll('.messages-container .message .message-text')).map((el) => el.textContent || '');

  const typeAndSend = async (text: string) => {
    const input = screen.getByPlaceholderText('Type your question...');
    await act(async () => {
      fireEvent.change(input, { target: { value: text } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
  };

  it('picking a topic then typing within the delay still shows that topic\'s questions, before the typed question', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Yearly answer.', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });
    await typeAndSend('Can I pay yearly?');

    await screen.findByText('Yearly answer.', {}, { timeout: 3000 });
    expect(screen.getByText('✅ What is included in the Free Plan?')).toBeInTheDocument();
    const texts = messageTexts();
    expect(texts.indexOf('Here are some common subscription & pricing questions:')).toBeGreaterThan(-1);
    expect(texts.indexOf('Here are some common subscription & pricing questions:')).toBeLessThan(texts.indexOf('Can I pay yearly?'));
    expect(texts[texts.indexOf('Can I pay yearly?') + 1]).toBe('Yearly answer.');
  }, 30_000);

  it('Contact Support then typing within its 600 ms beat still goes to the ticket page', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', 'subscription_plans'));
    await openWidget();
    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });
    await screen.findByText('Contact Support', {}, { timeout: 3000 });
    await act(async () => {
      fireEvent.click(screen.getByText('Contact Support'));
    });
    await typeAndSend('I need a human');

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/support/tickets/new'), { timeout: 3000 });
  }, 30_000);
});
