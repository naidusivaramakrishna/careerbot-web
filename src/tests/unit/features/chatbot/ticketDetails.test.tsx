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
const escalateToSupport = vi.fn();
const uploadTicketAttachment = vi.fn();
const getTicketDetails = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: vi.fn(),
  escalateToSupport: (...args: unknown[]) => escalateToSupport(...args),
  uploadTicketAttachment: (...args: unknown[]) => uploadTicketAttachment(...args),
  getTicketAttachmentUrl: (ticketId: string, attachmentId: string) =>
    `https://backend.example.com/api/v1/tickets/${ticketId}/attachments/${attachmentId}`,
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

const openTicketModal = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('Raise a support ticket'));
  });
  await screen.findByText('🎫 Raise a Support Ticket');
};

const fillMinimalAuthenticatedForm = async () => {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText('Brief summary of your issue'), {
      target: { value: 'Something is broken' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Describe what happened, what you expected, and what actually happened...'),
      { target: { value: 'This is a sufficiently long description of the problem I am facing.' } },
    );
    fireEvent.click(screen.getByText('Other'));
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
  // email); afterEach's restoreAllMocks clears the module-level mock's value.
  vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
  escalateToSupport.mockReset();
  uploadTicketAttachment.mockReset();
  getTicketDetails.mockReset();
  window.history.pushState(null, '', '/chatbot');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Ticket details -- a freshly-created ticket shows every field immediately, no reload needed', () => {
  it('shows Description, Category, Priority, Ticket ID, and Last Updated right after creation', async () => {
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00032', status: 'open', message: 'Created',
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));

    await openTicketsTab();
    await act(async () => {
      fireEvent.click(screen.getByText('Something is broken'));
    });

    const modal = screen.getByText('Ticket ID').closest('.ticket-modal') as HTMLElement;
    expect(within(modal).getByText('CB-00032')).toBeInTheDocument();
    expect(within(modal).getByText('Description')).toBeInTheDocument();
    expect(within(modal).getByText('This is a sufficiently long description of the problem I am facing.')).toBeInTheDocument();
    expect(within(modal).getByText('Category')).toBeInTheDocument();
    expect(within(modal).getByText('Priority')).toBeInTheDocument();
    expect(within(modal).getByText('Normal')).toBeInTheDocument();
    expect(within(modal).getByText('Last Updated')).toBeInTheDocument();
  });
});

describe('Ticket details -- Attachments section', () => {
  it('is hidden entirely when the ticket has no attachments', async () => {
    getSupportTickets.mockResolvedValue({ data: [backendTicket({ attachments: [] })] });

    await openWidget();
    await openTicketsTab();
    await act(async () => {
      fireEvent.click(screen.getByText('Unable to login'));
    });

    expect(screen.queryByText('Attachments')).not.toBeInTheDocument();
  });

  it('authenticated: shows the filename and a working View Attachment link', async () => {
    getSupportTickets.mockResolvedValue({
      data: [backendTicket({ attachments: [{ attachment_id: 'att-1', filename: 'screenshot.png' }] })],
    });

    await openWidget();
    await openTicketsTab();
    await act(async () => {
      fireEvent.click(screen.getByText('Unable to login'));
    });

    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText(/screenshot\.png/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'View Attachment' });
    expect(link).toHaveAttribute('href', 'https://backend.example.com/api/v1/tickets/CB-00023/attachments/att-1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  // There is currently no UI path for a guest to open the ticket details
  // modal at all: the entire "Tickets" sidebar tab (and therefore
  // setSelectedTicket) is gated behind isLocallyAuthenticated (a
  // pre-existing, unrelated structural fact, confirmed by reading the
  // component -- not something this fix changes or could meaningfully
  // test via the real UI). The guest-safe branch in the Attachments
  // section is still real, reachable code, though: a user who signs out
  // in another tab while this modal happens to still be open must not be
  // left looking at a link that will now 403. That IS testable.
  it('a link already showing in an open modal is replaced with "Sign in to view" if the user signs out while it is still open', async () => {
    getSupportTickets.mockResolvedValue({
      data: [backendTicket({ attachments: [{ attachment_id: 'att-2', filename: 'error.png' }] })],
    });

    await openWidget();
    await openTicketsTab();
    await act(async () => {
      fireEvent.click(screen.getByText('Unable to login'));
    });

    expect(screen.getByRole('link', { name: 'View Attachment' })).toBeInTheDocument();

    mockAuthenticated = false;
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'View Attachment' })).not.toBeInTheDocument();
    });
    expect(screen.getByText('Sign in to view')).toBeInTheDocument();
    expect(screen.getByText(/error\.png/)).toBeInTheDocument();
  });

  it('a ticket created WITH a screenshot shows the Attachments section immediately, no reload needed', async () => {
    uploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'att-3', filename: 'bug.png', content_type: 'image/png', size: 100,
    });
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00033', status: 'open', message: 'Created',
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const file = new File(['x'], 'bug.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));

    // Close the success modal first -- it also shows the just-attached
    // filename (see the ?ticket= deep link / success-modal attachment
    // tests below), so leaving it open makes "bug.png" ambiguous once the
    // details modal opens too.
    await act(async () => {
      fireEvent.click(screen.getByText('Close'));
    });

    await openTicketsTab();
    await act(async () => {
      fireEvent.click(screen.getByText('Something is broken'));
    });

    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText(/bug\.png/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Attachment' })).toHaveAttribute(
      'href', 'https://backend.example.com/api/v1/tickets/CB-00033/attachments/att-3',
    );
  });
});

describe('Ticket success modal -- attachment view links from the create response', () => {
  it('renders a clickable link when the backend returns a view_url for the attachment', async () => {
    uploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'att-5', filename: 'bug.png', content_type: 'image/png', size: 100,
    });
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00050', status: 'open', message: 'Created',
      attachments: [{ attachment_id: 'att-5', filename: 'bug.png', view_url: 'https://backend.example.com/api/v1/tickets/attachments/guest/tok-abc' }],
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const file = new File(['x'], 'bug.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));

    const link = await screen.findByRole('link', { name: 'bug.png' });
    expect(link).toHaveAttribute('href', 'https://backend.example.com/api/v1/tickets/attachments/guest/tok-abc');
  });

  it('shows the filename with no link when the response has no attachments at all', async () => {
    uploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'att-6', filename: 'bug.png', content_type: 'image/png', size: 100,
    });
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00051', status: 'open', message: 'Created',
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const file = new File(['x'], 'bug.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));

    expect(await screen.findByText(/bug\.png/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'bug.png' })).not.toBeInTheDocument();
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
