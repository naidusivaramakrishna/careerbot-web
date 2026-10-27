import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Products & Features -- 6 main questions (Resume Building, Job Match,
 * Mock Interview, Mock Test, Coding Assessment, English Assessment), each
 * with 3 auth-aware sub-questions (related questions). Guests see
 * introductory "what is this" questions; authenticated users see
 * practical "how do I use this" questions -- mirroring the Login &
 * Account pattern.
 *
 * Every phrase (48 candidates: 6 topics x (1 main + 3 subs) x 2 auth
 * states) was verified live against the real backend before being added.
 * Mock Interview, Mock Test, Coding Assessment, and English Assessment
 * have NO sibling KB topics of their own -- every candidate "what topics
 * are covered" / "how do I view my results" style sub-question either
 * failed to route at all, or resolved back to the same topic as its own
 * main question (a self-reference, since the main question was just
 * answered). Their sub-questions instead cross-link to each other, a
 * real, verified, non-duplicate "assessment cluster", rather than
 * inventing granular sub-topics the KB does not have.
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

// Guided-flow navigation: welcome -> "I want to know about products and
// features" -> that topic's question list directly (single step, unlike
// Login & Account which is nested under the Customer Support sub-menu).
// Replaces the old single-click expand/collapse toggle now that the
// quick-menu is a progressive, message-by-message flow instead of an
// always-visible panel. Each call produces a NEW question-list message --
// use getAllByText/queryAllByText (not getByText/queryByText) wherever a
// test navigates here more than once.
const expandFeaturesMenu = async () => {
  const options = screen.getAllByText('I want to know about products and features');
  await act(async () => {
    fireEvent.click(options[options.length - 1]);
  });
  // The menu just clicked collapses entirely now (global option-lifecycle
  // behavior -- every option group, not just leaf question lists), so a
  // plain "did the count go up" check no longer holds: the welcome/
  // initial menu disappearing and the features topic's list appearing can
  // net to zero change. Wait instead for the newest .guided-menu-options
  // block to actually be this topic's (6 options, guest or authenticated).
  await waitFor(() => {
    const menus = document.querySelectorAll('.guided-menu-options');
    const last = menus[menus.length - 1];
    expect(last?.querySelectorAll('button').length).toBe(6);
  }, { timeout: 3000 });
};

const sendMessageGuest = async (text: string) => {
  const input = screen.getByPlaceholderText('Type your question...');
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
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

const authAnswer = (answer: string, category: string) => ({
  message_id: 'm1',
  session_id: 'backend-sess-1',
  content: answer,
  timestamp: '2026-01-01T00:01:00Z',
  role: 'assistant',
  category,
  confidence: 0.9,
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
  mockAuthenticated = false;
});

const GUEST_MAINS = [
  { topic: 'Resume Building', label: '📄 What can CareerBot help me do with my resume?', query: 'What can CareerBot help me do with my resume?', category: 'resume_optimization' },
  { topic: 'Job Match', label: '🎯 How does Job Match help me find suitable jobs?', query: 'How does Job Match help me find suitable jobs?', category: 'job_match' },
  { topic: 'Mock Interview', label: '🎤 What is a Mock Interview, and how does it work?', query: 'What is a Mock Interview, and how does it work?', category: 'mock_interview_live' },
  { topic: 'Mock Test', label: '📊 What is a Mock Test, and what can I practice?', query: 'What is a Mock Test, and what can I practice?', category: 'mock_test' },
  { topic: 'Coding Assessment', label: '💻 How can CareerBot help me assess my coding skills?', query: 'How can CareerBot help me assess my coding skills?', category: 'coding_test' },
  { topic: 'English Assessment', label: '🗣️ What is the English Assessment and how does it work?', query: 'What is the English Assessment and how does it work?', category: 'english_assessment' },
];

const AUTH_MAINS = [
  { topic: 'Resume Building', label: '📄 How can I create or update my resume?', query: 'How can I create or update my resume?', category: 'resume_builder' },
  { topic: 'Job Match', label: '🎯 How can I check my resume match for a specific job?', query: 'How can I check my resume match for a specific job?', category: 'job_match' },
  { topic: 'Mock Interview', label: '🎤 How can I start a Mock Interview and review my feedback?', query: 'How can I start a Mock Interview and review my feedback?', category: 'mock_interview_live' },
  { topic: 'Mock Test', label: '📊 Where can I take a Mock Test and see my results?', query: 'Where can I take a Mock Test and see my results?', category: 'mock_test' },
  { topic: 'Coding Assessment', label: '💻 Where can I practice coding problems and review my performance?', query: 'Where can I practice coding problems and review my performance?', category: 'coding_test' },
  { topic: 'English Assessment', label: '🗣️ How can I take an English Assessment and review my performance?', query: 'How can I take an English Assessment and review my performance?', category: 'english_assessment' },
];

describe('Products & Features (guest) -- 6 introductory main questions', () => {
  it('expands to show exactly 6 guest-appropriate question cards', async () => {
    await openWidget();
    await expandFeaturesMenu();

    for (const { label } of GUEST_MAINS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    const grid = screen.getByText(GUEST_MAINS[0].label).closest('.guided-menu-options');
    expect(grid).not.toBeNull();
    expect(within(grid as HTMLElement).getAllByRole('button')).toHaveLength(6);

    // None of the authenticated practical-usage questions.
    for (const { label } of AUTH_MAINS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it.each(GUEST_MAINS.map(({ topic, label, query, category }) => [topic, label, query, category]))(
    '%s: clicking its card sends the exact query and surfaces the %s topic',
    async (_topic, label, expectedQuery, category) => {
      sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', category as string));
      await openWidget();
      await expandFeaturesMenu();

      await act(async () => {
        fireEvent.click(screen.getByText(label as string));
      });

      await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
      expect(sendChatMessage.mock.calls[0][0]).toBe(expectedQuery);
    },
  );
});

describe('Products & Features (guest) -- sub-questions are correct, non-duplicate, non-self-referencing', () => {
  it.each(GUEST_MAINS.map(({ topic, query, category }) => [topic, query, category]))(
    '%s: its sub-question bucket is non-empty, has no duplicates, and never suggests its own question back',
    async (_topic, query, category) => {
      sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', category as string));
      await openWidget();
      await sendMessageGuest(query as string);

      await screen.findByText('Related questions:');
      const relatedList = document.querySelector('.related-questions-list');
      expect(relatedList).not.toBeNull();
      const buttons = within(relatedList as HTMLElement).getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      const texts = buttons.map((b) => b.textContent);
      expect(new Set(texts).size).toBe(texts.length);

      const normalizedQuery = (query as string).toLowerCase().replace(/[^\w\s]/g, '').trim();
      for (const t of texts) {
        const normalized = (t || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
        expect(normalized).not.toBe(normalizedQuery);
      }
    },
  );

  it('Resume Building shows the exact verified guest sub-questions', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'));
    await openWidget();
    await sendMessageGuest('What can CareerBot help me do with my resume?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list') as HTMLElement;
    expect(within(relatedList).getByText('✨ How can I create a resume?')).toBeInTheDocument();
    expect(within(relatedList).getByText('💡 How can I improve my resume?')).toBeInTheDocument();
    expect(within(relatedList).getByText('📝 Can CareerBot help me create a cover letter?')).toBeInTheDocument();
  });

  it('a related-question button carries its full text as a title attribute, for a hover tooltip when the visible label is CSS-truncated', async () => {
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'));
    await openWidget();
    await sendMessageGuest('What can CareerBot help me do with my resume?');

    await screen.findByText('Related questions:');
    // getByText resolves to the inner label span (the ellipsis styling
    // lives there, not the button -- see .option-label-ellipsis in
    // ChatApp.css), so climb to the real button to check its title.
    const subButton = screen.getByText('💡 How can I improve my resume?').closest('button');
    expect(subButton).toHaveAttribute('title', '💡 How can I improve my resume?');
  });

  it('clicking a sub-question sends it through the chat flow and gets its own correct KB answer', async () => {
    sendChatMessage
      .mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'))
      .mockResolvedValueOnce(guestAnswer('Resume Enhancer gives AI suggestions...', 'resume_enhancer'));
    await openWidget();
    await sendMessageGuest('What can CareerBot help me do with my resume?');

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list') as HTMLElement;
    const subButton = within(relatedList).getByText('💡 How can I improve my resume?');
    await act(async () => {
      fireEvent.click(subButton);
    });

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
    // Related-question buttons send their full display text (including
    // the emoji prefix) as the chat query -- same behavior as every other
    // related-question bucket in this file, not specific to this one.
    expect(sendChatMessage.mock.calls[1][0]).toBe('💡 How can I improve my resume?');
    // Regex, not exact string: resume_enhancer now carries an inline action
    // link, so the message-text node's full text content is the answer
    // plus the link's lead-in sentence -- an exact string no longer matches.
    await screen.findByText(/Resume Enhancer gives AI suggestions/);
  });

  it('picking one related question collapses the whole bucket -- global option-lifecycle behavior applies to KB suggestions too', async () => {
    sendChatMessage
      .mockResolvedValueOnce(guestAnswer('Use the Resume Builder...', 'resume_optimization'))
      .mockResolvedValueOnce(guestAnswer('Resume Enhancer gives AI suggestions...', 'resume_enhancer'));
    await openWidget();
    await sendMessageGuest('What can CareerBot help me do with my resume?');

    await screen.findByText('Related questions:');
    expect(screen.getByText('✨ How can I create a resume?')).toBeInTheDocument();
    expect(screen.getByText('📝 Can CareerBot help me create a cover letter?')).toBeInTheDocument();

    const subButton = screen.getByText('💡 How can I improve my resume?');
    await act(async () => {
      fireEvent.click(subButton);
      // Rapid second click on a sibling in the same bucket, before the
      // first's backend call resolves -- the bucket is marked answered
      // synchronously on the first click, so this must be rejected too.
      fireEvent.click(screen.getByText('✨ How can I create a resume?'));
    });

    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(sendChatMessage).toHaveBeenCalledTimes(2);

    await screen.findByText(/Resume Enhancer gives AI suggestions/);
    // The first answer's own bucket (including its unclicked sibling) is
    // gone. Note: resume_enhancer's answer gets its own fresh "Related
    // questions:" bucket that legitimately includes "✨ How can I create a
    // resume?" again (real, pre-existing KB content -- not a leftover from
    // the first bucket), so that specific label isn't checked here.
    expect(screen.queryByText('📝 Can CareerBot help me create a cover letter?')).not.toBeInTheDocument();
  });
});

describe('Products & Features (authenticated) -- 6 practical main questions', () => {
  it('expands to show exactly 6 authenticated-appropriate question cards', async () => {
    mockAuthenticated = true;
    await openWidget();
    await expandFeaturesMenu();

    for (const { label } of AUTH_MAINS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    const grid = screen.getByText(AUTH_MAINS[0].label).closest('.guided-menu-options');
    expect(grid).not.toBeNull();
    expect(within(grid as HTMLElement).getAllByRole('button')).toHaveLength(6);

    for (const { label } of GUEST_MAINS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it.each(AUTH_MAINS.map(({ topic, label, query, category }) => [topic, label, query, category]))(
    '%s: clicking its card sends the exact query through the session-backed flow and surfaces the %s topic',
    async (_topic, label, expectedQuery, category) => {
      mockAuthenticated = true;
      sendSessionMessage.mockResolvedValueOnce(authAnswer('Some answer.', category as string));
      await openWidget();
      await expandFeaturesMenu();

      await act(async () => {
        fireEvent.click(screen.getByText(label as string));
      });

      await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
      expect(sendSessionMessage.mock.calls[0][1]).toBe(expectedQuery);
    },
  );
});

describe('Products & Features (authenticated) -- sub-questions are correct, non-duplicate, non-self-referencing', () => {
  it.each(AUTH_MAINS.map(({ topic, query, category }) => [topic, query, category]))(
    '%s: its sub-question bucket is non-empty, has no duplicates, and never suggests its own question back',
    async (_topic, query, category) => {
      mockAuthenticated = true;
      sendSessionMessage.mockResolvedValueOnce(authAnswer('Some answer.', category as string));
      await openWidget();
      await act(async () => {
        const input = screen.getByPlaceholderText('Type your question...');
        fireEvent.change(input, { target: { value: query } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });

      await screen.findByText('Related questions:');
      const relatedList = document.querySelector('.related-questions-list');
      expect(relatedList).not.toBeNull();
      const buttons = within(relatedList as HTMLElement).getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      const texts = buttons.map((b) => b.textContent);
      expect(new Set(texts).size).toBe(texts.length);

      const normalizedQuery = (query as string).toLowerCase().replace(/[^\w\s]/g, '').trim();
      for (const t of texts) {
        const normalized = (t || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
        expect(normalized).not.toBe(normalizedQuery);
      }
    },
  );

  it('Mock Test (authenticated) shows the exact verified practical sub-questions, cross-linking the assessment cluster', async () => {
    mockAuthenticated = true;
    sendSessionMessage.mockResolvedValueOnce(authAnswer('Take AI-generated tests...', 'mock_test'));
    await openWidget();
    await act(async () => {
      const input = screen.getByPlaceholderText('Type your question...');
      fireEvent.change(input, { target: { value: 'Where can I take a Mock Test and see my results?' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    await screen.findByText('Related questions:');
    const relatedList = document.querySelector('.related-questions-list') as HTMLElement;
    expect(within(relatedList).getByText('🎤 How can I start a Mock Interview and review my feedback?')).toBeInTheDocument();
    expect(within(relatedList).getByText('💻 Where can I practice coding problems and review my performance?')).toBeInTheDocument();
    expect(within(relatedList).getByText('🗣️ How can I take an English Assessment and review my performance?')).toBeInTheDocument();
    // Never itself.
    expect(within(relatedList).queryByText(/Where can I take a Mock Test and see my results/)).not.toBeInTheDocument();
  });
});

describe('Products & Features -- live switching between guest and authenticated (no remount)', () => {
  // Each topic's question list is built once, when that guided-flow message
  // is created (buildTopicQuestionOptions(topic, isLocallyAuthenticated) at
  // click time) -- not retroactively recomputed if auth state changes while
  // it's already on screen (same established behavior as
  // getRelatedQuestions). So "live switching" means a FRESH navigation
  // after the auth change reflects the new state -- not that an
  // already-rendered list mutates in place underneath the user.
  const answerAQuestionAndReturnToMenu = async () => {
    // Strictly more than before -- clicking the main options button earlier
    // left behind a user-echo message with that same text too, so a
    // weaker "any exist" check would already be satisfied before this
    // fresh one has actually landed.
    const countBefore = screen.getAllByText('I want to know about products and features').length;
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
      expect(screen.getAllByText('I want to know about products and features').length).toBeGreaterThan(countBefore);
    }, { timeout: 3000 });
  };

  it('signing in: a fresh navigation after sign-in shows the practical menu, not the stale introductory one', async () => {
    mockAuthenticated = false;
    sendChatMessage.mockResolvedValueOnce(guestAnswer('Some answer.', GUEST_MAINS[0].category));
    await openWidget();
    await expandFeaturesMenu();

    for (const { label } of GUEST_MAINS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // Reach the "I have more questions" follow-up so there's a fresh entry
    // point to re-navigate from after signing in.
    await act(async () => {
      fireEvent.click(screen.getByText(GUEST_MAINS[0].label));
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });

    mockAuthenticated = true;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    expect(await screen.findByText(/👤 Alice/)).toBeInTheDocument();

    await answerAQuestionAndReturnToMenu();
    await expandFeaturesMenu();

    for (const { label } of AUTH_MAINS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  }, 30_000); // two full navigations, each with a real ~1.2s guided-message delay

  it('signing out: a fresh navigation after sign-out shows the introductory menu, not the stale practical one', async () => {
    mockAuthenticated = true;
    sendSessionMessage.mockResolvedValueOnce(authAnswer('Some answer.', AUTH_MAINS[0].category));
    await openWidget();
    await expandFeaturesMenu();

    for (const { label } of AUTH_MAINS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    await act(async () => {
      fireEvent.click(screen.getByText(AUTH_MAINS[0].label));
    });
    await waitFor(() => expect(sendSessionMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Is there anything else I can help with?', {}, { timeout: 3000 });

    // A real sign-out resets the whole transcript back to the bare welcome
    // screen (see ChatApp.tsx's "Logout detected" branch, startNewAccountGeneration
    // + initializeChat) -- unlike signing IN mid-conversation, which keeps it.
    // Never leave a signed-out visitor's conversation on screen for whoever
    // uses the device next. So there's no "I have more questions" follow-up
    // to click through afterward -- the next navigation starts fresh.
    mockAuthenticated = false;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await waitFor(() => {
      expect(screen.queryByText(/👤 Alice/)).not.toBeInTheDocument();
    });
    await screen.findByText(/Hi! I'm CareerBot/i, {}, { timeout: 3000 });

    await expandFeaturesMenu();

    for (const { label } of GUEST_MAINS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  }, 30_000); // two full navigations, each with a real ~1.2s guided-message delay
});
