import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, 30 s test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Proactive guest greeting popup on the minimized launcher (before the
 * widget is even opened) -- shown only to guests, with the same 3 initial
 * options the chat itself opens with. Picking one opens the widget AND
 * carries that selection into the guided flow (handleLauncherOptionSelect +
 * the pendingLauncherSelection effect), instead of just landing on the bare
 * welcome screen. The launcher button itself also gets a continuous pulse
 * animation for guests, to draw attention before sign-in.
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

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: vi.fn(),
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

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';
import { announceAccountChanged } from '@/lib/accountChange';

beforeEach(() => {
  localStorage.clear();
  mockAuthenticated = false;
});

describe('Launcher greeting popup -- guests', () => {
  it('shows the popup with exactly the 3 initial options, and a rotating message icon, before the widget opens', async () => {
    render(<ChatApp />);

    expect(screen.getByText('I want to know about products and features')).toBeInTheDocument();
    expect(screen.getByText('I need help with subscription or payment')).toBeInTheDocument();
    expect(screen.getByText("I'm a customer and need support")).toBeInTheDocument();

    // Only the icon glyph turns -- not the whole button pulsing/vibrating.
    const launcherButton = screen.getByTitle('Chatbot Support');
    expect(launcherButton).not.toHaveClass('pulse-attention');
    expect(launcherButton.querySelector('svg')).toHaveClass('message-icon-rotate');

    // The widget itself is not open yet -- no welcome message. (The popup's
    // own "How can I help you today?" text legitimately overlaps part of
    // the real welcome message's text, so this checks the distinctive
    // "Hi! I'm CareerBot" prefix the popup doesn't have, not that shared phrase.)
    expect(screen.queryByText(/Hi! I'm CareerBot/i)).not.toBeInTheDocument();
  });

  it('the close button dismisses the popup without opening the widget', async () => {
    render(<ChatApp />);

    await act(async () => {
      fireEvent.click(screen.getByTitle('Dismiss'));
    });

    expect(screen.queryByText('I want to know about products and features')).not.toBeInTheDocument();
    expect(screen.queryByText(/Hi! I'm CareerBot/i)).not.toBeInTheDocument();
  });

  it('clicking a popup option opens the widget and lands directly on that path -- not just the bare welcome screen', async () => {
    render(<ChatApp />);

    await act(async () => {
      fireEvent.click(screen.getByText("I'm a customer and need support"));
    });

    // Widget opened, conversation shows the welcome message...
    await waitFor(() => {
      expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
    });
    // ...the popup's own click is echoed as the first real chat message --
    // the welcome menu's matching button collapses the instant it's
    // resolved (global option-lifecycle behavior), so exactly one instance
    // of this text remains: the echo...
    expect(screen.getByText("I'm a customer and need support")).toBeInTheDocument();
    // ...and lands on the support sub-menu, not just back at the 3 initial options.
    await screen.findByText('Login & Account', {}, { timeout: 3000 });
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('clicking "I want to know about products and features" lands directly on that topic\'s question list', async () => {
    render(<ChatApp />);

    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });

    await waitFor(() => {
      expect(screen.getByText(/How can I help you today/i)).toBeInTheDocument();
    });
    await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });
  });
});

describe('Launcher greeting popup -- every visible option is routed', () => {
  // ai-review P2 at 5a6b2e73: after a guest picked a popup option, minimized
  // and picked another, the second pick went through the already-answered
  // 'welcome' group and was silently dropped. With showSuggestedQuestions
  // off it was never consumed at all.
  it('a second popup pick after minimize lands on that option\'s path', async () => {
    render(<ChatApp />);
    await act(async () => {
      fireEvent.click(screen.getByText('I want to know about products and features'));
    });
    await screen.findByText('📄 What can CareerBot help me do with my resume?', {}, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Minimize (collapse and keep conversation)'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });

    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
    // Echoed as the guest's own message, after the first path.
    expect(screen.getByText('I need help with subscription or payment')).toBeInTheDocument();
  });

  it('a popup pick still lands on its path when suggested questions are turned off', async () => {
    localStorage.setItem('careerbot-settings', JSON.stringify({ showSuggestedQuestions: false }));
    render(<ChatApp />);
    await act(async () => {
      fireEvent.click(screen.getByText('I need help with subscription or payment'));
    });

    await screen.findByText('✅ What is included in the Free Plan?', {}, { timeout: 3000 });
  });
});

describe('Launcher greeting popup -- same-tab sign-in / sign-out', () => {
  // ai-review P2 (codex) at 5a6b2e73: a same-tab credential sign-in or
  // sign-out announces 'careerbot-account-changed', not a storage event, and
  // the never-opened widget kept its old guest/auth state.
  it('hides the popup after a same-tab sign-in, in the order SignUpModal does it', async () => {
    render(<ChatApp />);
    expect(screen.getByText('I want to know about products and features')).toBeInTheDocument();

    await act(async () => {
      // signIn() announces first; SignUpModal stamps the session right after.
      announceAccountChanged();
      mockAuthenticated = true;
    });

    await waitFor(() => {
      expect(screen.queryByText('I want to know about products and features')).not.toBeInTheDocument();
    });
    expect(screen.getByTitle('Chatbot Support').querySelector('svg')).not.toHaveClass('message-icon-rotate');
  });

  it('shows the popup again after a same-tab sign-out', async () => {
    mockAuthenticated = true;
    render(<ChatApp />);
    expect(screen.queryByText('I want to know about products and features')).not.toBeInTheDocument();

    await act(async () => {
      mockAuthenticated = false;
      announceAccountChanged();
    });

    expect(await screen.findByText('I want to know about products and features')).toBeInTheDocument();
  });
});

describe('Launcher greeting popup -- authenticated users never see it', () => {
  it('no popup and no rotating icon once signed in', async () => {
    mockAuthenticated = true;
    render(<ChatApp />);

    expect(screen.queryByText('I want to know about products and features')).not.toBeInTheDocument();
    expect(screen.queryByText("I'm a customer and need support")).not.toBeInTheDocument();
    expect(screen.queryByTitle('Dismiss')).not.toBeInTheDocument();

    const launcherButton = screen.getByTitle('Chatbot Support');
    expect(launcherButton.querySelector('svg')).not.toHaveClass('message-icon-rotate');
  });
});
