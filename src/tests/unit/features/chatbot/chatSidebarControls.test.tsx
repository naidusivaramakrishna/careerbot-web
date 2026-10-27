import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * The signed-in History sidebar's own controls (ai-review P2s at 5a6b2e73):
 * - its "New Conversation" button must still close the sidebar overlay
 *   (startNewChat is shared with the bottom-nav "New Chat" button);
 * - the header's ☰ toggle and the sidebar's New Conversation button are
 *   still rendered, so ChatApp.css must still style them.
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

const CHAT_APP_CSS = readFileSync(
  path.resolve(__dirname, '../../../../app/(ai)/chatbot/_components/ChatApp.css'),
  'utf8',
);

beforeEach(() => {
  localStorage.clear();
});

describe('History sidebar -- New Conversation', () => {
  it('closes the sidebar and its scrim, not just resets the chat behind it', async () => {
    render(<ChatApp />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Chatbot Support'));
    });
    await waitFor(() => expect(screen.getByText(/Hi! I'm CareerBot/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(await screen.findByTitle('Toggle History'));
    });
    const sidebar = document.querySelector('.chat-sidebar');
    expect(sidebar).toHaveClass('active');
    expect(document.querySelector('.sidebar-scrim')).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByText('✨ New Conversation'));
    });

    expect(sidebar).not.toHaveClass('active');
    expect(document.querySelector('.sidebar-scrim')).toBeNull();
  });

  it('control: the bottom-nav New Chat button still starts a fresh conversation in place', async () => {
    render(<ChatApp />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Chatbot Support'));
    });
    await waitFor(() => expect(screen.getByText(/Hi! I'm CareerBot/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByTitle('New Chat'));
    });

    expect(await screen.findByText(/Hi! I'm CareerBot/i)).toBeInTheDocument();
    expect(document.querySelector('.chat-sidebar')).not.toHaveClass('active');
  });
});

describe('ChatApp.css -- still-rendered sidebar controls keep their styles', () => {
  it.each(['sidebar-toggle', 'new-chat-btn'])('has a .%s rule (the class is still rendered)', async (className) => {
    render(<ChatApp />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Chatbot Support'));
    });
    await waitFor(() => expect(document.querySelector(`.${className}`)).not.toBeNull());

    expect(CHAT_APP_CSS).toMatch(new RegExp(`(^|\\n)\\.${className}\\s*\\{`));
  });

  it('turns the guest launcher swing off for reduced-motion users', () => {
    expect(CHAT_APP_CSS).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.message-icon-rotate\s*\{[^}]*animation:\s*none/,
    );
  });
});
