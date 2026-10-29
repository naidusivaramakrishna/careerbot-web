import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Cancel Ticket: PATCH /api/v1/tickets/{ticket_id}/status, wired into the
 * chatbot's ticket detail modal (opened via the ?ticket= deep link -- the
 * old in-widget History sidebar's own "Tickets" tab, a separate client-side
 * list, has been removed; ticket management now lives entirely on the
 * dashboard's Support & History page). Only tickets in a cancellable status
 * (open/in_progress/waiting_user) show the action; resolved/closed/cancelled
 * tickets must not.
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

const getSupportTickets = vi.fn();
const getTicketDetails = vi.fn();
const cancelTicket = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: vi.fn(),
  escalateToSupport: vi.fn(),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  getTicketDetails: (...args: unknown[]) => getTicketDetails(...args),
  cancelTicket: (...args: unknown[]) => cancelTicket(...args),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: vi.fn(),
  sendSessionMessage: vi.fn(),
  getChatSessionHistory: vi.fn().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] }),
  getChatSession: vi.fn(),
}));

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';
import { getProfile } from '@/api/userApi';

// Opens the ticket details modal via the ?ticket= deep link -- the only
// remaining way to reach it from inside the widget now that the old
// History sidebar's "Tickets" tab is gone.
const openTicketViaDeepLink = async (ticketId: string) => {
  window.history.pushState(null, '', `/chatbot?ticket=${ticketId}`);
  render(<ChatApp />);
  await waitFor(() => expect(screen.getByText('Ticket ID').closest('.ticket-modal')).toBeInTheDocument());
};

const ticket = (overrides: Partial<Record<string, unknown>> = {}) => ({
  ticket_id: 'CB-00025',
  subject: 'Unable to login',
  description: 'Password reset link never arrives',
  affected_feature: 'account_organization',
  status: 'open',
  priority: 'normal',
  user_email: 'alice@example.com',
  user_name: 'Alice',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('ChatApp — Cancel Ticket', () => {
  beforeEach(() => {
    localStorage.clear();
    getSupportTickets.mockReset().mockResolvedValue({ data: [] });
    getTicketDetails.mockReset();
    cancelTicket.mockReset();
    // The ticket is shown only for a confirmed account (a profile with an
    // email); afterEach's restoreAllMocks clears the module-level mock's value.
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    window.history.pushState(null, '', '/chatbot');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the Cancel Ticket action for an open ticket and calls the cancel endpoint', async () => {
    getTicketDetails.mockResolvedValue(ticket({ status: 'open' }));
    cancelTicket.mockResolvedValue(ticket({ status: 'cancelled', updated_at: '2026-01-02T00:00:00Z' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await openTicketViaDeepLink('CB-00025');

    const cancelButton = await screen.findByText('Cancel Ticket');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => expect(cancelTicket).toHaveBeenCalledWith('CB-00025'));
    const modal = document.querySelector('.ticket-modal') as HTMLElement;
    expect(within(modal).getByText('Cancelled')).toBeInTheDocument();
  });

  it('does not call cancelTicket if the confirmation dialog is dismissed', async () => {
    getTicketDetails.mockResolvedValue(ticket({ status: 'open' }));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await openTicketViaDeepLink('CB-00025');

    const cancelButton = await screen.findByText('Cancel Ticket');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(cancelTicket).not.toHaveBeenCalled();
  });

  it('does not show Cancel Ticket for a resolved ticket', async () => {
    getTicketDetails.mockResolvedValue(ticket({ status: 'resolved' }));

    await openTicketViaDeepLink('CB-00025');

    expect(screen.queryByText('Cancel Ticket')).not.toBeInTheDocument();
  });

  it('does not show Cancel Ticket for an already-cancelled ticket', async () => {
    getTicketDetails.mockResolvedValue(ticket({ status: 'cancelled' }));

    await openTicketViaDeepLink('CB-00025');

    expect(screen.queryByText('Cancel Ticket')).not.toBeInTheDocument();
  });

  it('surfaces an error and leaves the ticket unchanged when cancellation fails', async () => {
    getTicketDetails.mockResolvedValue(ticket({ status: 'open' }));
    cancelTicket.mockRejectedValue(new Error('This ticket can no longer be cancelled.'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await openTicketViaDeepLink('CB-00025');

    const cancelButton = await screen.findByText('Cancel Ticket');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('This ticket can no longer be cancelled.'));
    // Still showing the cancel action -- status was never flipped on failure.
    expect(screen.getByText('Cancel Ticket')).toBeInTheDocument();
  });
});
