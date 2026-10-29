import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * ChatApp.css coverage that isn't tied to any one component test. The old
 * in-widget History sidebar (☰ toggle, History/Tickets tabs, session and
 * ticket cards, "New Conversation" button) was removed -- conversation
 * history and ticket management now live entirely on the dashboard's
 * Support & History page (see the bottom-nav "History" button, which
 * navigates there) -- so this file no longer covers sidebar controls.
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

describe('ChatApp.css -- launcher reduced-motion support', () => {
  it('turns the guest launcher swing off for reduced-motion users', async () => {
    render(<ChatApp />);
    await waitFor(() => expect(screen.getByTitle('Chatbot Support')).toBeInTheDocument());

    expect(CHAT_APP_CSS).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.message-icon-rotate\s*\{[^}]*animation:\s*none/,
    );
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
    expect(document.querySelector('.chat-sidebar')).toBeNull();
  });
});
