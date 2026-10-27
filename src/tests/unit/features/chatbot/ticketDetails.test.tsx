import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Ticket details modal -- completeness of displayed fields, and the
 * Attachments section.
 *
 * Root cause of the original bug: the ticket object built immediately
 * after successful creation (before any backend refetch) only carried
 * {id, subject, status, priority, created_at, contact_email} -- every
 * other field (description, category, updated_at, attachments) was
 * dropped even though the data was already available locally at that
 * exact point. The details modal renders each of those fields
 * conditionally, so a freshly-created ticket silently showed fewer fields
 * than one later reloaded from the backend's full ticket list.
 *
 * The tests that created a ticket via the in-widget modal to exercise
 * this (via a "Raise a support ticket" click) were removed: that entry
 * point now navigates to /support/tickets/new instead of opening the
 * modal (openTicketModal has no remaining callers), so there is no UI
 * path left to reach it. The tests below only cover tickets already
 * present in getSupportTickets/getTicketDetails -- no creation step --
 * which remain fully reachable via the Tickets tab and the ?ticket=
 * deep link.
 */

Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;

let mockAuthenticated = true;
vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => mockAuthenticated,
  classifyQuery: () => 'PUBLIC',
  canGuestAnswer: () => true,
  getAuthRequiredMessage: () => '',
}));

vi.mock('@/api/userApi', () => ({
  getProfile: vi.fn().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' }),
}));

const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });
const getTicketDetails = vi.fn();
// Attachments without a guest view_url render as a button that fetches
// credentialed content on click (see TicketAttachmentLink.tsx) -- not a
// plain <a href>, so opening/downloading goes through this mock instead of
// a navigable URL.
const openOrDownloadTicketAttachment = vi.fn().mockResolvedValue(undefined);

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: vi.fn(),
  escalateToSupport: vi.fn(),
  uploadTicketAttachment: vi.fn(),
  getTicketAttachmentUrl: (ticketId: string, attachmentId: string) =>
    `https://backend.example.com/api/v1/tickets/${ticketId}/attachments/${attachmentId}`,
  openOrDownloadTicketAttachment: (...args: unknown[]) => openOrDownloadTicketAttachment(...args),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  getTicketDetails: (...args: unknown[]) => getTicketDetails(...args),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: vi.fn(),
  sendSessionMessage: vi.fn(),
  getChatSessionHistory: vi.fn().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] }),
  getChatSession: vi.fn(),
}));

import ChatApp from '@/app/(ai)/chatbot/_components/ChatApp';
import { getProfile } from '@/api/userApi';

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

const openTicketsTab = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('🎫 Tickets'));
  });
};

const backendTicket = (overrides: Partial<Record<string, unknown>> = {}) => ({
  ticket_id: 'CB-00023',
  subject: 'Unable to login',
  description: 'Password reset link never arrives',
  affected_feature: 'account_organization',
  status: 'open',
  priority: 'normal',
  user_email: 'alice@example.com',
  user_name: 'Alice',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  attachments: [],
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  mockAuthenticated = true;
  getSupportTickets.mockReset().mockResolvedValue({ data: [] });
  // The ticket list is shown only for a confirmed account (a profile with an
  // email); afterEach's restoreAllMocks clears the module-level mock's value
  // (vi.fn() has no "original" to restore to, so it resets to undefined),
  // so every test after the first would otherwise see getProfile() resolve
  // to nothing, fail the owner check in loadTickets, and get an empty list.
  vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
  getTicketDetails.mockReset();
  openOrDownloadTicketAttachment.mockReset().mockResolvedValue(undefined);
  window.history.pushState(null, '', '/chatbot');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Ticket details -- Attachments section', () => {
  it('is hidden entirely when the ticket has no attachments', async () => {
    getSupportTickets.mockResolvedValue({ data: [backendTicket({ attachments: [] })] });

    await openWidget();
    await openTicketsTab();
    const ticketRow = await screen.findByText('Unable to login');
    await act(async () => {
      fireEvent.click(ticketRow);
    });

    expect(screen.queryByText('Attachments')).not.toBeInTheDocument();
  });

  it('authenticated: shows the filename as a clickable attachment that fetches and opens it', async () => {
    getSupportTickets.mockResolvedValue({
      data: [backendTicket({ attachments: [{ attachment_id: 'att-1', filename: 'screenshot.png' }] })],
    });

    await openWidget();
    await openTicketsTab();
    const ticketRow = await screen.findByText('Unable to login');
    await act(async () => {
      fireEvent.click(ticketRow);
    });

    expect(screen.getByText('Attachments')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /screenshot\.png/ });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(openOrDownloadTicketAttachment).toHaveBeenCalledWith('CB-00023', 'att-1', 'screenshot.png');
  });

  it('shows an inline error if opening the attachment fails', async () => {
    openOrDownloadTicketAttachment.mockRejectedValue(new Error('Network error'));
    getSupportTickets.mockResolvedValue({
      data: [backendTicket({ attachments: [{ attachment_id: 'att-1', filename: 'screenshot.png' }] })],
    });

    await openWidget();
    await openTicketsTab();
    await act(async () => {
      fireEvent.click(screen.getByText('Unable to login'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /screenshot\.png/ }));
    });

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  // There is currently no UI path for a guest to open the ticket details
  // modal at all: the entire "Tickets" sidebar tab (and therefore
  // setSelectedTicket) is gated behind isLocallyAuthenticated (a
  // pre-existing, unrelated structural fact, confirmed by reading the
  // component -- not something this fix changes or could meaningfully
  // test via the real UI). The guest-safe branch in the Attachments
  // section is still real, reachable code, though: a user who signs out
  // in another tab while this modal happens to still be open must not be
  // left looking at a button that will now 403. That IS testable.
  it('a clickable attachment is replaced with "Sign in to view" if the user signs out while the modal is still open', async () => {
    getSupportTickets.mockResolvedValue({
      data: [backendTicket({ attachments: [{ attachment_id: 'att-2', filename: 'error.png' }] })],
    });

    await openWidget();
    await openTicketsTab();
    const ticketRow = await screen.findByText('Unable to login');
    await act(async () => {
      fireEvent.click(ticketRow);
    });

    expect(screen.getByRole('button', { name: /error\.png/ })).toBeInTheDocument();

    mockAuthenticated = false;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /error\.png/ })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Sign in to view')).toBeInTheDocument();
    expect(screen.getByText(/error\.png/)).toBeInTheDocument();
  });
});

describe('?ticket= deep link -- the support-team email\'s "View Tickets" button', () => {
  it('authenticated: auto-opens the widget and the matching ticket, no manual click needed', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=CB-00040');
    getTicketDetails.mockResolvedValue(backendTicket({
      ticket_id: 'CB-00040', subject: 'Payment failed', user_id: 'someone_else',
    }));

    render(<ChatApp />);

    await waitFor(() => expect(getTicketDetails).toHaveBeenCalledWith('CB-00040'));
    await waitFor(() => expect(screen.getByText('Ticket ID').closest('.ticket-modal')).toBeInTheDocument());
    const modal = screen.getByText('Ticket ID').closest('.ticket-modal') as HTMLElement;
    expect(within(modal).getByText('CB-00040')).toBeInTheDocument();
  });

  it('guest: does not fetch, and prompts to log in instead', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=CB-00041');
    mockAuthenticated = false;

    render(<ChatApp />);

    await waitFor(() => {
      expect(screen.getByText(/Please log in to view ticket CB-00041/)).toBeInTheDocument();
    });
    expect(getTicketDetails).not.toHaveBeenCalled();
    const loginLink = screen.getByRole('link', { name: 'Log in to continue' });
    expect(loginLink.getAttribute('href')).toContain('%2Fchatbot%3Fticket%3DCB-00041');
  });

  it('a ticket that is not this user\'s and not staff-visible surfaces a permission message, not a crash', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=CB-00042');
    getTicketDetails.mockRejectedValue({ response: { status: 403 } });

    render(<ChatApp />);

    await waitFor(() => {
      expect(screen.getByText(/don't have permission to view ticket CB-00042/)).toBeInTheDocument();
    });
  });

  it('an unknown ticket id surfaces a not-found message', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=CB-99999');
    getTicketDetails.mockRejectedValue({ response: { status: 404 } });

    render(<ChatApp />);

    await waitFor(() => {
      expect(screen.getByText(/CB-99999 was not found/)).toBeInTheDocument();
    });
  });

  it('a malformed ticket id is never put into an API path', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=..%2Fadmin');

    render(<ChatApp />);

    await waitFor(() => {
      expect(screen.getByText(/link is not a valid ticket link/i)).toBeInTheDocument();
    });
    expect(getTicketDetails).not.toHaveBeenCalled();
  });

  it('a malformed ticket id does not produce a login prompt for a guest either', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=..%2Fadmin');
    mockAuthenticated = false;

    render(<ChatApp />);

    await waitFor(() => {
      expect(screen.getByText(/link is not a valid ticket link/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Please log in to view ticket/)).not.toBeInTheDocument();
  });

  it('staff opening another customer\'s ticket do not get a Cancel Ticket button (only the owner can cancel)', async () => {
    window.history.pushState(null, '', '/chatbot?ticket=CB-00043');
    getTicketDetails.mockResolvedValue(backendTicket({ ticket_id: 'CB-00043', user_email: 'customer@example.com' }));

    render(<ChatApp />);

    await waitFor(() => expect(screen.getByText('Ticket ID').closest('.ticket-modal')).toBeInTheDocument());
    const modal = screen.getByText('Ticket ID').closest('.ticket-modal') as HTMLElement;
    expect(within(modal).getByText('CB-00043')).toBeInTheDocument();
    expect(within(modal).queryByText('Cancel Ticket')).not.toBeInTheDocument();
  });

  it('the owner opening their own ticket from the link still gets Cancel Ticket', async () => {
    // afterEach's restoreAllMocks clears the module-level mock's value.
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    window.history.pushState(null, '', '/chatbot?ticket=CB-00044');
    getTicketDetails.mockResolvedValue(backendTicket({ ticket_id: 'CB-00044', user_email: 'Alice@Example.com' }));

    render(<ChatApp />);

    await waitFor(() => expect(screen.getByText('Ticket ID').closest('.ticket-modal')).toBeInTheDocument());
    const modal = screen.getByText('Ticket ID').closest('.ticket-modal') as HTMLElement;
    expect(await within(modal).findByText('Cancel Ticket')).toBeInTheDocument();
  });

  it('after switching to another account, the link is opened again with the new account', async () => {
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    window.history.pushState(null, '', '/chatbot?ticket=CB-00046');
    getTicketDetails.mockRejectedValueOnce({ response: { status: 403 } });

    render(<ChatApp />);
    await waitFor(() => {
      expect(screen.getByText(/don't have permission to view ticket CB-00046/)).toBeInTheDocument();
    });

    getTicketDetails.mockResolvedValueOnce(backendTicket({ ticket_id: 'CB-00046', user_email: 'customer@example.com' }));
    vi.mocked(getProfile).mockResolvedValue({ email: 'staff@example.com', full_name: 'Staff' } as Awaited<ReturnType<typeof getProfile>>);
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    await waitFor(() => expect(getTicketDetails).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('Ticket ID').closest('.ticket-modal')).toBeInTheDocument());
  });
});
