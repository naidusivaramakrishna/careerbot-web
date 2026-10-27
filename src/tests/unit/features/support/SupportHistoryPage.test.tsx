/**
 * Unit tests for the dashboard's Support & History page
 * (/dashboard/support-history) -- the full-screen Support Center the
 * chatbot's History button now navigates to. Sidebar-nav layout: a fixed
 * left sidebar (Support Center / My Tickets) plus a main content area with
 * a shared search bar and Create Ticket button.
 *
 * Covers:
 *   Sidebar
 *     - Support Center / My Tickets switch the active view, with the
 *       selected item visually/structurally distinguished
 *     - Create Ticket lives only in the main content header and opens the
 *       create-ticket form
 *   Conversation History
 *     - Shows real session titles/previews (not generic placeholders)
 *     - Clicking a row reopens the chatbot widget on that exact session
 *   Support Tickets
 *     - Summary cards (All / Pending / Solved-Closed) reflect actual data
 *     - Priority is shown in the ticket table, from the API, never defaulted
 *     - The shared search bar and status filter narrow the visible list
 *     - Ticket detail shows priority, status, category, dates
 *     - Attachments are clickable and route through the authenticated fetch
 *       helper, not a static href
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

const mockGetProfile = vi.fn().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
vi.mock('@/api/userApi', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
}));

const mockGetChatSessionHistory = vi.fn();
const mockGetSupportTickets = vi.fn();
const mockGetTicketDetails = vi.fn();
const mockCancelTicket = vi.fn();
const mockEscalateToSupport = vi.fn();
const mockUploadTicketAttachment = vi.fn();
const mockOpenOrDownloadTicketAttachment = vi.fn().mockResolvedValue(undefined);

vi.mock('@/api/chatbotApi', () => ({
  getChatSessionHistory: (...args: unknown[]) => mockGetChatSessionHistory(...args),
  getSupportTickets: (...args: unknown[]) => mockGetSupportTickets(...args),
  getTicketDetails: (...args: unknown[]) => mockGetTicketDetails(...args),
  cancelTicket: (...args: unknown[]) => mockCancelTicket(...args),
  escalateToSupport: (...args: unknown[]) => mockEscalateToSupport(...args),
  uploadTicketAttachment: (...args: unknown[]) => mockUploadTicketAttachment(...args),
  openOrDownloadTicketAttachment: (...args: unknown[]) => mockOpenOrDownloadTicketAttachment(...args),
}));

let mockSearchParams = new URLSearchParams();
const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockRouterReplace, push: vi.fn() }),
}));

import SupportHistoryPage from '@/app/(user)/dashboard/support-history/page';

const ticket = (overrides: Partial<Record<string, unknown>> = {}) => ({
  ticket_id: 'CB-00054',
  subject: 'Resume parser not extracting skills',
  description: 'Uploaded a PDF and the skills section comes back empty every time.',
  affected_feature: 'resume_parser',
  status: 'open',
  priority: 'normal',
  user_email: 'alice@example.com',
  user_name: 'Alice',
  created_at: '2026-10-14T00:00:00Z',
  updated_at: '2026-10-16T00:00:00Z',
  attachments: [],
  ...overrides,
});

let originalLocation: Location;

beforeEach(() => {
  mockSearchParams = new URLSearchParams();
  mockGetProfile.mockReset().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
  mockGetChatSessionHistory.mockReset().mockResolvedValue({ total: 0, skip: 0, limit: 20, sessions: [] });
  mockGetSupportTickets.mockReset().mockResolvedValue({ data: [], page: 1, limit: 100, total_records: 0, total_pages: 1 });
  mockGetTicketDetails.mockReset();
  mockCancelTicket.mockReset();
  mockEscalateToSupport.mockReset();
  mockUploadTicketAttachment.mockReset();
  mockOpenOrDownloadTicketAttachment.mockReset().mockResolvedValue(undefined);
  mockRouterReplace.mockReset();
  // jsdom's real window.location throws on navigation (continueConversation/
  // startNewConversation assign window.location.href); Object.defineProperty
  // (not delete + reassign) keeps it restorable, and the matching afterEach
  // below puts the real one back so no other test file in this run is left
  // with a location object missing assign/reload/origin/etc.
  originalLocation = window.location;
  Object.defineProperty(window, 'location', { configurable: true, value: { href: '' } });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  // Only the account-switch tests override this; deleting it (safe --
  // it's always a configurable own property once overridden, and a no-op
  // if nothing overrode it) restores jsdom's real getter for every test
  // that runs after them in this file.
  delete (document as unknown as { visibilityState?: unknown }).visibilityState;
});

describe('Conversation History', () => {
  it('shows the real session title and preview, not a placeholder', async () => {
    mockGetChatSessionHistory.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 20,
      sessions: [{
        session_id: 'sess-1',
        user_id: 'user-1',
        status: 'active',
        created_at: '2026-10-10T00:00:00Z',
        updated_at: '2026-10-12T00:00:00Z',
        title: 'How do I reset my password?',
        preview: 'You can reset your password from the login page by clicking "Forgot password".',
        message_count: 4,
      }],
    });

    render(<SupportHistoryPage />);

    expect(await screen.findByText('How do I reset my password?')).toBeInTheDocument();
    expect(screen.getByText(/You can reset your password from the login page/)).toBeInTheDocument();
  });

  it('clicking a conversation row reopens the chatbot widget scoped to that exact session', async () => {
    mockGetChatSessionHistory.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 20,
      sessions: [{
        session_id: 'sess-42',
        user_id: 'user-1',
        status: 'active',
        created_at: '2026-10-10T00:00:00Z',
        title: 'Billing question',
        preview: 'preview',
        message_count: 2,
      }],
    });

    render(<SupportHistoryPage />);
    const title = await screen.findByText('Billing question');

    fireEvent.click(title);

    expect(window.location.href).toBe('/dashboard?chat_session=sess-42');
  });

  it('a conversation row is keyboard-activatable with Enter, not just clickable', async () => {
    mockGetChatSessionHistory.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 20,
      sessions: [{
        session_id: 'sess-43',
        user_id: 'user-1',
        status: 'active',
        created_at: '2026-10-10T00:00:00Z',
        title: 'Billing question',
        preview: 'preview',
        message_count: 2,
      }],
    });

    render(<SupportHistoryPage />);
    const row = (await screen.findByText('Billing question')).closest('li') as HTMLElement;
    expect(row).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(row, { key: 'Enter' });

    expect(window.location.href).toBe('/dashboard?chat_session=sess-43');
  });

  it('shows an empty state, not a crash, when there is no history', async () => {
    render(<SupportHistoryPage />);
    expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
  });

  it('shows an error, not a crash, when loading conversation history fails', async () => {
    mockGetChatSessionHistory.mockRejectedValue(new Error('Backend is unreachable'));

    render(<SupportHistoryPage />);

    expect(await screen.findByText('Backend is unreachable')).toBeInTheDocument();
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
  });

  it('shows an error toast, not a crash, when loading more conversations fails', async () => {
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 25, skip: 0, limit: 20,
      sessions: Array.from({ length: 20 }, (_, i) => ({
        session_id: `sess-${i}`, user_id: 'user-1', status: 'active',
        created_at: '2026-10-10T00:00:00Z', title: `Conversation ${i}`, preview: 'preview', message_count: 1,
      })),
    });
    mockGetChatSessionHistory.mockRejectedValueOnce(new Error('Backend is unreachable'));

    render(<SupportHistoryPage />);
    // findByText, not findByRole: role queries over 20 rows took >5 s on a loaded host.
    const loadMoreButton = await screen.findByText(/Load more \(\d+ remaining\)/);
    await act(async () => {
      fireEvent.click(loadMoreButton);
    });

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Backend is unreachable'));
  });

  const session = (overrides: Partial<Record<string, unknown>> = {}) => ({
    session_id: 'sess-1',
    user_id: 'user-1',
    status: 'active',
    created_at: '2026-10-10T00:00:00Z',
    title: 'How do I reset my password?',
    preview: 'preview',
    message_count: 4,
    ...overrides,
  });

  it('never shows a closed session -- it has no live conversation to continue', async () => {
    mockGetChatSessionHistory.mockResolvedValue({
      total: 2,
      skip: 0,
      limit: 20,
      sessions: [session({ session_id: 'sess-open', title: 'Still open' }), session({ session_id: 'sess-closed', title: 'Already closed', status: 'closed' })],
    });

    render(<SupportHistoryPage />);

    expect(await screen.findByText('Still open')).toBeInTheDocument();
    expect(screen.queryByText('Already closed')).not.toBeInTheDocument();
  });

  it('when every session on the first page is closed, still offers "Load more" instead of a dead-end "no match" message', async () => {
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 21,
      skip: 0,
      limit: 20,
      sessions: Array.from({ length: 20 }, (_, i) => session({ session_id: `closed-${i}`, title: `Closed ${i}`, status: 'closed' })),
    });

    render(<SupportHistoryPage />);

    // Not the search-specific message -- no search was typed, and there
    // genuinely are conversations (just none visible on this page yet).
    expect(await screen.findByText('No active conversations on this page')).toBeInTheDocument();
    expect(screen.queryByText('No conversations match your search')).not.toBeInTheDocument();
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();

    const loadMore = screen.getByRole('button', { name: /Load more/ });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 21,
      skip: 20,
      limit: 20,
      sessions: [session({ session_id: 'sess-open-21', title: 'Finally an active one' })],
    });
    fireEvent.click(loadMore);

    expect(await screen.findByText('Finally an active one')).toBeInTheDocument();
  });

  it('shows "Load more" when more sessions exist beyond the first page, and fetches the next page on click', async () => {
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 25,
      skip: 0,
      limit: 20,
      sessions: Array.from({ length: 20 }, (_, i) => session({ session_id: `sess-${i}`, title: `Conversation ${i}` })),
    });

    render(<SupportHistoryPage />);
    await screen.findByText('Conversation 0');

    const loadMore = screen.getByText(/Load more/);
    expect(loadMore).toBeInTheDocument();

    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 25,
      skip: 20,
      limit: 20,
      sessions: Array.from({ length: 5 }, (_, i) => session({ session_id: `sess-${20 + i}`, title: `Conversation ${20 + i}` })),
    });

    fireEvent.click(loadMore);

    expect(await screen.findByText('Conversation 24')).toBeInTheDocument();
    expect(mockGetChatSessionHistory).toHaveBeenLastCalledWith(20, 20);
    // All 25 now loaded -- the button disappears instead of asking for more.
    expect(screen.queryByText(/Load more/)).not.toBeInTheDocument();
  });

  it('search covers sessions brought in by Load more, not just the first page', async () => {
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 21,
      skip: 0,
      limit: 20,
      sessions: Array.from({ length: 20 }, (_, i) => session({ session_id: `sess-${i}`, title: `Conversation ${i}` })),
    });

    render(<SupportHistoryPage />);
    await screen.findByText('Conversation 0');

    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 21,
      skip: 20,
      limit: 20,
      sessions: [session({ session_id: 'sess-20', title: 'Needle in a haystack' })],
    });
    fireEvent.click(screen.getByText(/Load more/));
    await screen.findByText('Needle in a haystack');

    fireEvent.change(screen.getByPlaceholderText('Search conversations or tickets…'), { target: { value: 'needle' } });

    expect(screen.getByText('Needle in a haystack')).toBeInTheDocument();
    expect(screen.queryByText('Conversation 0')).not.toBeInTheDocument();
  });

  it('tells the user that unloaded pages were never searched, instead of implying none of their conversations match', async () => {
    mockGetChatSessionHistory.mockResolvedValue({
      total: 21,
      skip: 0,
      limit: 20,
      sessions: Array.from({ length: 20 }, (_, i) => session({ session_id: `sess-${i}`, title: `Conversation ${i}` })),
    });

    render(<SupportHistoryPage />);
    await screen.findByText('Conversation 0');

    fireEvent.change(screen.getByPlaceholderText('Search conversations or tickets…'), { target: { value: 'needle' } });

    expect(await screen.findByText('No conversations match your search')).toBeInTheDocument();
    expect(screen.getByText(/or load more conversations to search within them too/)).toBeInTheDocument();
  });

  it('gives the plain "try a different term" message once every page has actually been loaded and searched', async () => {
    mockGetChatSessionHistory.mockResolvedValue({
      total: 1,
      skip: 0,
      limit: 20,
      sessions: [session({ session_id: 'sess-0', title: 'Conversation 0' })],
    });

    render(<SupportHistoryPage />);
    await screen.findByText('Conversation 0');

    fireEvent.change(screen.getByPlaceholderText('Search conversations or tickets…'), { target: { value: 'needle' } });

    expect(await screen.findByText('No conversations match your search')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
  });
});

// The ticket list renders twice in the DOM at once -- a <table> for
// desktop and a <ul> of cards for mobile, toggled purely by CSS (Tailwind's
// hidden/md:block), which jsdom doesn't apply. Every assertion below scopes
// to the table specifically so it isn't ambiguous between the two. Must be
// awaited: the table only exists once the initial fetch resolves.
const findTicketsTable = () => screen.findByRole('table');

describe('Support Tickets -- summary cards', () => {
  it('computes All / Pending / Solved-Closed from the actual ticket data', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', status: 'open' }),
        ticket({ ticket_id: 'CB-2', status: 'in_progress' }),
        ticket({ ticket_id: 'CB-3', status: 'resolved' }),
      ],
      page: 1, limit: 100, total_records: 3, total_pages: 1,
    });

    render(<SupportHistoryPage />);

    const table = await findTicketsTable();
    expect(within(table).getByText('CB-1')).toBeInTheDocument();
    expect(screen.getByText('All Tickets').closest('div')?.parentElement).toHaveTextContent('3');
    expect(screen.getByText('Pending Tickets').closest('div')?.parentElement).toHaveTextContent('2');
    expect(screen.getByText('Solved/Closed Tickets').closest('div')?.parentElement).toHaveTextContent('1');
  });

  it('counts a ticket with an unrecognized status as pending, consistent with its "Open" badge fallback', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', status: 'escalated_to_engineering' }),
        ticket({ ticket_id: 'CB-2', status: 'resolved' }),
      ],
      page: 1, limit: 100, total_records: 2, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();

    // The unrecognized status falls back to the "Open" pill (never a
    // guessed-wrong label) -- the summary cards must agree with that, not
    // silently fold it into Solved/Closed.
    expect(within(within(table).getByText('CB-1').closest('tr') as HTMLElement).getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('All Tickets').closest('div')?.parentElement).toHaveTextContent('2');
    expect(screen.getByText('Pending Tickets').closest('div')?.parentElement).toHaveTextContent('1');
    expect(screen.getByText('Solved/Closed Tickets').closest('div')?.parentElement).toHaveTextContent('1');
  });

  it('shows an error, not a crash, when loading tickets fails', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockRejectedValue(new Error('Backend is unreachable'));

    render(<SupportHistoryPage />);

    expect(await screen.findByText('Backend is unreachable')).toBeInTheDocument();
    expect(screen.getByText('All Tickets').closest('div')?.parentElement).toHaveTextContent('0');
  });

  it('shows an error, not a crash, when a later page of tickets fails to load', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets
      .mockResolvedValueOnce({ data: [ticket({ ticket_id: 'CB-1' })], page: 1, limit: 50, total_records: 100, total_pages: 2 })
      .mockRejectedValueOnce(new Error('Backend is unreachable'));

    render(<SupportHistoryPage />);

    expect(await screen.findByText('Backend is unreachable')).toBeInTheDocument();
    // The already-fetched first page is discarded, not shown half-loaded
    // alongside the error -- setTickets only runs once, after every page
    // succeeds.
    expect(screen.queryByText('CB-1')).not.toBeInTheDocument();
  });
});

describe('Support Tickets -- priority, search, and filtering', () => {
  it('shows the stored priority for every ticket, never a default', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', subject: 'Urgent one', priority: 'urgent' }),
        ticket({ ticket_id: 'CB-2', subject: 'Normal one', priority: 'normal' }),
      ],
      page: 1, limit: 100, total_records: 2, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();

    const urgentRow = within(table).getByText('Urgent one').closest('tr') as HTMLElement;
    expect(within(urgentRow).getByText('🔥 Urgent')).toBeInTheDocument();
    const normalRow = within(table).getByText('Normal one').closest('tr') as HTMLElement;
    expect(within(normalRow).getByText('Normal')).toBeInTheDocument();
  });

  it('the shared search bar narrows the list by subject or ticket ID', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', subject: 'Resume parser broken' }),
        ticket({ ticket_id: 'CB-2', subject: 'Payment failed' }),
      ],
      page: 1, limit: 100, total_records: 2, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    expect(within(table).getByText('Resume parser broken')).toBeInTheDocument();
    expect(within(table).getByText('Payment failed')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search conversations or tickets'), { target: { value: 'payment' } });

    expect(within(table).queryByText('Resume parser broken')).not.toBeInTheDocument();
    expect(within(table).getByText('Payment failed')).toBeInTheDocument();
  });

  it('status filter narrows the list without a second API call', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', subject: 'Open one', status: 'open' }),
        ticket({ ticket_id: 'CB-2', subject: 'Resolved one', status: 'resolved' }),
      ],
      page: 1, limit: 100, total_records: 2, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    expect(within(table).getByText('Open one')).toBeInTheDocument();
    expect(mockGetSupportTickets).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Filter tickets by status'), { target: { value: 'resolved' } });

    expect(within(table).queryByText('Open one')).not.toBeInTheDocument();
    expect(within(table).getByText('Resolved one')).toBeInTheDocument();
    expect(mockGetSupportTickets).toHaveBeenCalledTimes(1);
  });

  it('fetches every page of tickets, not just the first, for accurate counts', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockImplementation((_status?: string, page = 1) => {
      if (page === 1) {
        return Promise.resolve({ data: [ticket({ ticket_id: 'CB-1' })], page: 1, limit: 100, total_records: 2, total_pages: 2 });
      }
      return Promise.resolve({ data: [ticket({ ticket_id: 'CB-2' })], page: 2, limit: 100, total_records: 2, total_pages: 2 });
    });

    render(<SupportHistoryPage />);

    const table = await findTicketsTable();
    expect(within(table).getByText('CB-1')).toBeInTheDocument();
    await waitFor(() => expect(within(table).getByText('CB-2')).toBeInTheDocument());
    expect(mockGetSupportTickets).toHaveBeenCalledTimes(2);
  });
});

describe('Support Tickets -- status filter dropdown options', () => {
  it('shows exactly 4 options, in order: All Statuses, Open, Resolved, Cancelled', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1' })], page: 1, limit: 100, total_records: 1, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    await findTicketsTable();

    const select = screen.getByLabelText('Filter tickets by status') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.textContent);
    expect(optionLabels).toEqual(['All Statuses', 'Open', 'Resolved', 'Cancelled']);
    // "In Progress", "Waiting on You", and "Closed" are hidden from the
    // dropdown -- not deleted from the underlying status system.
    expect(optionLabels).not.toContain('In Progress');
    expect(optionLabels).not.toContain('Waiting on You');
    expect(optionLabels).not.toContain('Closed');
  });

  it('defaults to "All Statuses"', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1' })], page: 1, limit: 100, total_records: 1, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    await findTicketsTable();

    const select = screen.getByLabelText('Filter tickets by status') as HTMLSelectElement;
    expect(select.value).toBe('all');
  });

  it('"All Statuses" shows tickets of every status, including the ones hidden from the dropdown (In Progress, Waiting on You, Closed)', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', subject: 'Open one', status: 'open' }),
        ticket({ ticket_id: 'CB-2', subject: 'In progress one', status: 'in_progress' }),
        ticket({ ticket_id: 'CB-3', subject: 'Waiting one', status: 'waiting_user' }),
        ticket({ ticket_id: 'CB-4', subject: 'Closed one', status: 'closed' }),
        ticket({ ticket_id: 'CB-5', subject: 'Resolved one', status: 'resolved' }),
        ticket({ ticket_id: 'CB-6', subject: 'Cancelled one', status: 'cancelled' }),
      ],
      page: 1, limit: 100, total_records: 6, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();

    for (const subject of ['Open one', 'In progress one', 'Waiting one', 'Closed one', 'Resolved one', 'Cancelled one']) {
      expect(within(table).getByText(subject)).toBeInTheDocument();
    }
  });

  it('selecting Open, Resolved, or Cancelled filters to exactly that status', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [
        ticket({ ticket_id: 'CB-1', subject: 'Open one', status: 'open' }),
        ticket({ ticket_id: 'CB-2', subject: 'In progress one', status: 'in_progress' }),
        ticket({ ticket_id: 'CB-3', subject: 'Resolved one', status: 'resolved' }),
        ticket({ ticket_id: 'CB-4', subject: 'Cancelled one', status: 'cancelled' }),
      ],
      page: 1, limit: 100, total_records: 4, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    const select = screen.getByLabelText('Filter tickets by status');

    fireEvent.change(select, { target: { value: 'open' } });
    expect(within(table).getByText('Open one')).toBeInTheDocument();
    expect(within(table).queryByText('In progress one')).not.toBeInTheDocument();
    expect(within(table).queryByText('Resolved one')).not.toBeInTheDocument();
    expect(within(table).queryByText('Cancelled one')).not.toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'resolved' } });
    expect(within(table).getByText('Resolved one')).toBeInTheDocument();
    expect(within(table).queryByText('Open one')).not.toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'cancelled' } });
    expect(within(table).getByText('Cancelled one')).toBeInTheDocument();
    expect(within(table).queryByText('Resolved one')).not.toBeInTheDocument();
  });
});

describe('Support Tickets -- ticket detail', () => {
  it('shows status, category, priority, dates, and a clickable attachment', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1', status: 'in_progress', priority: 'urgent' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(
      ticket({
        ticket_id: 'CB-1',
        status: 'in_progress',
        priority: 'urgent',
        attachments: [{ attachment_id: 'att-1', filename: 'skills-screenshot.png' }],
      }),
    );

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    expect(within(table).getByText('CB-1')).toBeInTheDocument();

    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    const modal = (await screen.findByText('Ticket CB-1')).closest('div') as HTMLElement;
    await waitFor(() => expect(within(modal.parentElement as HTMLElement).getByText('In Progress')).toBeInTheDocument());
    expect(within(modal.parentElement as HTMLElement).getByText(/Urgent/)).toBeInTheDocument();

    const attachmentButton = screen.getByRole('button', { name: /skills-screenshot\.png/ });
    await act(async () => {
      fireEvent.click(attachmentButton);
    });
    expect(mockOpenOrDownloadTicketAttachment).toHaveBeenCalledWith('CB-1', 'att-1', 'skills-screenshot.png');
  });

  it('shows the Subcategory when the ticket has an issue_type', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1', issue_type: 'upload_failed' }));

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    const modal = (await screen.findByText('Ticket CB-1')).closest('div') as HTMLElement;
    await waitFor(() => expect(within(modal.parentElement as HTMLElement).getByText('Subcategory')).toBeInTheDocument());
    expect(within(modal.parentElement as HTMLElement).getByText('Upload Failed')).toBeInTheDocument();
  });

  it('omits the Subcategory field entirely when the ticket has none, rather than fabricating one', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1' }));

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    await screen.findByText('Ticket CB-1');
    await waitFor(() => expect(mockGetTicketDetails).toHaveBeenCalled());
    expect(screen.queryByText('Subcategory')).not.toBeInTheDocument();
  });

  it('has dialog semantics and closes on Escape', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1' }));

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Ticket CB-1');

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape from wherever focus lands when it opens (focus moves into the dialog)', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({ data: [ticket({ ticket_id: 'CB-1' })], page: 1, limit: 100, total_records: 1, total_pages: 1 });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1' }));
    render(<SupportHistoryPage />);
    fireEvent.click(within(await findTicketsTable()).getByText('Resume parser not extracting skills'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an error inside the modal, not a crash, when loading ticket details fails', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockRejectedValue(new Error('Ticket not found'));

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    expect(await screen.findByText('Ticket not found')).toBeInTheDocument();
  });

  it('cancels a cancellable ticket after confirming, shows a success toast, and refetches the list', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1', status: 'open' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1', status: 'open' }));
    mockCancelTicket.mockResolvedValue(ticket({ ticket_id: 'CB-1', status: 'cancelled' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    const cancelButton = await screen.findByText('Cancel ticket');
    const ticketsCallsBefore = mockGetSupportTickets.mock.calls.length;
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => expect(mockCancelTicket).toHaveBeenCalledWith('CB-1'));
    expect(mockToast.success).toHaveBeenCalledWith('Ticket cancelled.');
    // The modal closes (onCancelled) and the list is refetched for the
    // now-updated status.
    expect(screen.queryByText('Ticket CB-1')).not.toBeInTheDocument();
    expect(mockGetSupportTickets.mock.calls.length).toBeGreaterThan(ticketsCallsBefore);
  });

  it('does not cancel the ticket if the confirmation dialog is dismissed', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1', status: 'open' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1', status: 'open' }));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    const cancelButton = await screen.findByText('Cancel ticket');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockCancelTicket).not.toHaveBeenCalled();
    expect(screen.getByText('Ticket CB-1')).toBeInTheDocument();
  });

  it('shows an error toast and keeps the modal open when cancellation fails', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1', status: 'open' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1', status: 'open' }));
    mockCancelTicket.mockRejectedValue(new Error('This ticket can no longer be cancelled.'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    const cancelButton = await screen.findByText('Cancel ticket');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('This ticket can no longer be cancelled.'));
    expect(screen.getByText('Ticket CB-1')).toBeInTheDocument();
  });

  it('does not show a Cancel ticket action for a non-cancellable (resolved) ticket', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket({ ticket_id: 'CB-1', status: 'resolved' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });
    mockGetTicketDetails.mockResolvedValue(ticket({ ticket_id: 'CB-1', status: 'resolved' }));

    render(<SupportHistoryPage />);
    const table = await findTicketsTable();
    fireEvent.click(within(table).getByText('Resume parser not extracting skills'));

    await screen.findByText('Ticket CB-1');
    expect(screen.queryByText('Cancel ticket')).not.toBeInTheDocument();
  });
});

describe('Create Ticket -- main content button only (no sidebar item)', () => {
  it('shows exactly one Create Ticket trigger -- the main content button -- and no sidebar item or leftover old button', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({ data: [ticket()], page: 1, limit: 100, total_records: 1, total_pages: 1 });

    render(<SupportHistoryPage />);
    await findTicketsTable();

    expect(screen.getAllByText('Create Ticket')).toHaveLength(1);
    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).queryByText('Create Ticket')).not.toBeInTheDocument();
    // The old in-section button (from before the sidebar redesign) is gone.
    expect(screen.queryByText('🎫 Raise a Ticket')).not.toBeInTheDocument();
  });

  it('the single trigger stays visible on the Conversation History view too', async () => {
    render(<SupportHistoryPage />);

    expect(await screen.findAllByText('Create Ticket')).toHaveLength(1);
  });

  it('clicking the main content button opens the create-ticket form', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({ data: [], page: 1, limit: 100, total_records: 0, total_pages: 1 });

    render(<SupportHistoryPage />);
    await screen.findByText('No tickets yet');
    expect(screen.queryByText('Raise a support ticket')).not.toBeInTheDocument();

    const main = screen.getByRole('main');
    await act(async () => {
      fireEvent.click(within(main).getByText('Create Ticket'));
    });

    expect(await screen.findByText('Raise a support ticket')).toBeInTheDocument();
  });
});

describe('Sidebar navigation', () => {
  it('defaults to Support Center (Conversation History) as the selected view', async () => {
    render(<SupportHistoryPage />);
    await screen.findByText('Conversation History');

    const sidebar = screen.getByRole('complementary');
    const supportCenterItem = within(sidebar).getByText('Support Center').closest('button') as HTMLElement;
    expect(supportCenterItem.className).toMatch(/#eef4ff/);
  });

  it('clicking My Tickets switches to the tickets view and highlights it instead', async () => {
    mockGetSupportTickets.mockResolvedValue({ data: [], page: 1, limit: 100, total_records: 0, total_pages: 1 });

    render(<SupportHistoryPage />);
    await screen.findByText('Conversation History');

    const sidebar = screen.getByRole('complementary');
    await act(async () => {
      fireEvent.click(within(sidebar).getByText('My Tickets'));
    });

    expect(await screen.findByText('My Tickets', { selector: 'h2' })).toBeInTheDocument();
    const ticketsItem = within(sidebar).getByText('My Tickets').closest('button') as HTMLElement;
    const supportCenterItem = within(sidebar).getByText('Support Center').closest('button') as HTMLElement;
    expect(ticketsItem.className).toMatch(/#eef4ff/);
    expect(supportCenterItem.className).not.toMatch(/#eef4ff/);
  });

  it('clicking Support Center switches back to the conversation history view', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets');
    mockGetSupportTickets.mockResolvedValue({
      data: [ticket()], page: 1, limit: 100, total_records: 1, total_pages: 1,
    });

    render(<SupportHistoryPage />);
    await findTicketsTable();

    const sidebar = screen.getByRole('complementary');
    await act(async () => {
      fireEvent.click(within(sidebar).getByText('Support Center'));
    });

    expect(await screen.findByText('Conversation History')).toBeInTheDocument();
  });
});

describe('Raise a Ticket -- redirected here from the chatbot', () => {
  const fillMinimalForm = async () => {
    await act(async () => {
      fireEvent.change(document.getElementById('dash-ticket-category') as HTMLSelectElement, { target: { value: 'other' } });
      fireEvent.change(screen.getByPlaceholderText('Brief summary of your issue'), { target: { value: 'Something is broken' } });
      fireEvent.change(
        screen.getByPlaceholderText('Describe your issue in as much detail as possible'),
        { target: { value: 'This is a sufficiently long description of the problem I am facing.' } },
      );
    });
  };

  it('?raise=1 opens the create-ticket form immediately, without clicking Raise a Ticket', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);

    expect(await screen.findByText('Raise a support ticket')).toBeInTheDocument();
  });

  it('has dialog semantics and closes on Escape', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Raise a support ticket');

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape from wherever focus lands when it opens (focus moves into the dialog)', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    const dialog = await screen.findByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open while submitting (backdrop/Escape ignored), files as signed-in, then focuses the success view', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    let resolveEscalate!: (v: unknown) => void;
    mockEscalateToSupport.mockReturnValue(new Promise((r) => { resolveEscalate = r; }));
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    expect(mockEscalateToSupport.mock.calls[0][0].authenticated).toBe(true);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => {
      resolveEscalate({ success: true, ticket_id: 'CB-00077', status: 'open', message: 'Created' });
    });
    expect(await screen.findByText('Ticket submitted')).toBeInTheDocument();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('?question=&answer= prefill the subject from the question, not the answer', async () => {
    const question = 'Why am I unable to reset my password from the settings page?';
    const answer = 'Go to the login page and click the Forgot Password link to receive a reset email.';
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', question, answer });
    render(<SupportHistoryPage />);

    const subjectInput = (await screen.findByPlaceholderText('Brief summary of your issue')) as HTMLInputElement;
    expect(subjectInput.value).toContain('Why am I unable to reset my password');
    expect(subjectInput.value).not.toContain('Forgot Password link');
  });

  it('sends the original question and chatbot answer as separate fields on submit', async () => {
    const question = 'Why am I unable to reset my password?';
    const answer = 'Go to the login page and click Forgot Password.';
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', question, answer });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00050', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');

    await fillMinimalForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toBe(question);
    expect(submitted.issue_details.chatbot_answer).toBe(answer);
  });

  // The chatbot hands a signed-in user's Q&A over in sessionStorage
  // (?ctx=<id>, see stashTicketContext), as it does for the guest portal --
  // not in the URL (ai-review P2 at #327 5a6b2e73).
  it('?ctx= reads the question and answer from sessionStorage, prefills the subject and sends both', async () => {
    const question = 'Why am I unable to reset my password?';
    const answer = 'Go to the login page and click Forgot Password.';
    sessionStorage.setItem('ticket_ctx:abc123', JSON.stringify({ question, answer }));
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', ctx: 'abc123' });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00051', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);

    const subjectInput = (await screen.findByPlaceholderText('Brief summary of your issue')) as HTMLInputElement;
    expect(subjectInput.value).toContain('Why am I unable to reset my password');
    // One-time hand-off: gone from sessionStorage once read.
    await waitFor(() => expect(sessionStorage.getItem('ticket_ctx:abc123')).toBeNull());

    await fillMinimalForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toBe(question);
    expect(submitted.issue_details.chatbot_answer).toBe(answer);
  });

  // ai-review P2 at #327 7603e4a8: the page is server-rendered, and reading
  // sessionStorage during render gave the server an empty subject and the
  // client the stored question -- a hydration mismatch. The hand-off is
  // read only after mount, so the server markup never depends on it.
  it('?ctx= never touches sessionStorage during render (SSR-safe), and the form is not server-rendered with a guessed prefill', async () => {
    const { renderToString } = await import('react-dom/server');
    sessionStorage.setItem('ticket_ctx:abc123', JSON.stringify({ question: 'Why am I unable to reset my password?', answer: 'A.' }));
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', ctx: 'abc123' });
    const realGetItem = Storage.prototype.getItem;
    let sessionReads = 0;
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (this === window.sessionStorage) sessionReads += 1;
      return realGetItem.call(this, key);
    });
    try {
      const html = renderToString(<SupportHistoryPage />);
      expect(sessionReads).toBe(0);
      expect(html).not.toContain('Brief summary of your issue');
    } finally {
      getItem.mockRestore();
    }
    // Still there for the client's post-mount read.
    expect(sessionStorage.getItem('ticket_ctx:abc123')).not.toBeNull();
  });

  it('closing the form strips ?ctx= from the URL along with raise, keeping tab', async () => {
    sessionStorage.setItem('ticket_ctx:abc123', JSON.stringify({ question: 'Q?', answer: 'A.' }));
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', ctx: 'abc123' });
    render(<SupportHistoryPage />);

    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard/support-history?tab=tickets');
  });

  it('raises a ticket with no attachment -- uploadTicketAttachment is never called', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00042', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');

    await fillMinimalForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    expect(mockUploadTicketAttachment).not.toHaveBeenCalled();
    expect(mockEscalateToSupport.mock.calls[0][0].attachment_ids).toBeUndefined();
  });

  it('uploads a selected screenshot before submitting, and includes its attachment_id on the ticket', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockUploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'abc123', filename: 'screenshot.png', content_type: 'image/png', size: 1024,
    });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00043', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    expect(screen.getByText('screenshot.png')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockUploadTicketAttachment.mock.calls[0][0]).toBe(file);
    expect(mockEscalateToSupport.mock.calls[0][0].attachment_ids).toEqual(['abc123']);
  });

  it('removing an attached file before submitting leaves the ticket with no attachment', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00044', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove screenshot.png' }));
    });
    expect(screen.queryByText('screenshot.png')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    expect(mockUploadTicketAttachment).not.toHaveBeenCalled();
  });

  it('aborts submission instead of filing the ticket if the account changed since the form opened', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    // Baseline must be established as Alice (both the page's own
    // account-switch effect and the modal's mount effect use getProfile)
    // before simulating a switch, same reasoning as the chatbot widget's
    // equivalent test -- the modal's own account line renders the baseline.
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
    expect((screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement).value).toBe('Something is broken');
  });

  it('aborts submission if the account switches between the upload and the ticket itself being filed', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    // The switch happens as a side effect of the upload resolving -- models
    // a real race (another tab signs in while this upload is in flight),
    // not a switch already visible before the pre-upload check runs.
    mockUploadTicketAttachment.mockImplementation(async () => {
      mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
      return { success: true, attachment_id: 'abc123', filename: 'screenshot.png', content_type: 'image/png', size: 1024 };
    });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('aborts submission before ever uploading if the account already changed when Submit was clicked', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    expect(mockUploadTicketAttachment).not.toHaveBeenCalled();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('does not re-upload a file that already succeeded when the submit is retried', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockUploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'abc123', filename: 'screenshot.png', content_type: 'image/png', size: 1024,
    });
    // First escalateToSupport call fails (e.g. a transient server error);
    // the retry must reuse the already-uploaded attachment, not resend it.
    mockEscalateToSupport.mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValueOnce({ success: true, ticket_id: 'CB-00099', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    await screen.findByText('Server error');

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText('Ticket submitted')).toBeInTheDocument();
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockEscalateToSupport).toHaveBeenCalledTimes(2);
  });

  it('does not re-upload a file on retry after the account-mismatch check itself blocked the first attempt', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00102', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // The switch happens as a side effect of the upload resolving -- the
    // pre-submit check (right after) is what actually blocks this attempt.
    mockUploadTicketAttachment.mockImplementationOnce(async () => {
      mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
      return { success: true, attachment_id: 'abc123', filename: 'screenshot.png', content_type: 'image/png', size: 1024 };
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockEscalateToSupport).not.toHaveBeenCalled();

    // Back on the right account for the retry -- the file from the
    // blocked attempt must not be sent to the backend a second time.
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText('Ticket submitted')).toBeInTheDocument();
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockEscalateToSupport).toHaveBeenCalledTimes(1);
  });

  it('blocks submission with a retryable error, not a false "account changed" claim, when the account check itself fails', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    // Overridden only now -- the baseline from mount must already be
    // Alice, so this failure is purely "the check didn't work", not an
    // actual switch.
    mockGetProfile.mockRejectedValue(new Error('Network error'));
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText(/couldn't confirm your account/i)).toBeInTheDocument();
    expect(screen.queryByText(/account changed in another tab/i)).not.toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('treats a 401 on the account check as a sign-out, not a generic failure or a false "account changed" claim', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText(/alice@example\.com/);
    await fillMinimalForm();

    mockGetProfile.mockRejectedValue(Object.assign(new Error('Unauthorized'), { response: { status: 401 } }));
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText(/signed out/i)).toBeInTheDocument();
    expect(screen.queryByText(/account changed in another tab/i)).not.toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('establishes the baseline on the first successful check instead of blocking forever when the mount-time profile fetch failed', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    // Every mount-time read fails (both the page's own account-switch
    // effect and the modal's mount effect) -- authenticatedEmailRef is
    // never set. The pre-upload check is the first SUCCESSFUL read, and
    // must adopt it as the baseline rather than treating it as a detected
    // switch or blocking forever.
    mockGetProfile.mockRejectedValue(new Error('Network error'));
    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00101', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await screen.findByText('your account');
    await fillMinimalForm();

    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText('Ticket submitted')).toBeInTheDocument();
    expect(mockEscalateToSupport).toHaveBeenCalledTimes(1);
  });

  it('a failed upload does not block ticket creation -- the ticket is still raised, without that attachment', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockUploadTicketAttachment.mockRejectedValue(new Error('network error'));
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00045', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    expect(mockEscalateToSupport.mock.calls[0][0].attachment_ids).toBeUndefined();
    // The ticket going out silently short of its attachment is exactly the
    // failure mode that must be surfaced, not swallowed.
    expect(mockToast.success).toHaveBeenCalledWith('Support ticket submitted.');
    expect(mockToast.warning).toHaveBeenCalledWith(expect.stringContaining('screenshot.png'));
  });

  it('shows a clickable attachment on the success screen after creating a ticket with a screenshot', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockUploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'att-5', filename: 'bug.png', content_type: 'image/png', size: 100,
    });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00050', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    const file = new File(['x'], 'bug.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText('Ticket submitted')).toBeInTheDocument();
    const attachmentButton = screen.getByRole('button', { name: /bug\.png/ });
    await act(async () => {
      fireEvent.click(attachmentButton);
    });
    expect(mockOpenOrDownloadTicketAttachment).toHaveBeenCalledWith('CB-00050', 'att-5', 'bug.png');
  });

  it('shows no attachment section on the success screen when nothing was attached', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00051', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    expect(await screen.findByText('Ticket submitted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\.png/ })).not.toBeInTheDocument();
  });

  it('caps the subject at 200 characters, even when typed past the limit', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');

    const subjectInput = screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'x'.repeat(250) } });
    });

    expect(subjectInput.value).toHaveLength(200);
  });

  it('caps original_question and chatbot_answer at 5,000 characters before sending to the backend', async () => {
    const longQuestion = 'q'.repeat(6000);
    const longAnswer = 'a'.repeat(6000);
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', question: longQuestion, answer: longAnswer });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00052', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });

    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toHaveLength(5000);
    expect(submitted.issue_details.chatbot_answer).toHaveLength(5000);
  });

  it('allows up to 5 attachments and rejects the rest with a clear notice', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');

    const files = Array.from({ length: 6 }, (_, i) => new File([`bytes-${i}`], `file-${i}.png`, { type: 'image/png' }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files } });
    });

    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`file-${i}.png`)).toBeInTheDocument();
    }
    expect(screen.queryByText('file-5.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/up to 5 files/i);
  });

  it('rejects a file over 5 MB with a clear notice, without attaching it', async () => {
    mockSearchParams = new URLSearchParams('tab=tickets&raise=1');
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');

    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversized] } });
    });

    expect(screen.queryByText('huge.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/larger than 5 MB/i);
  });

  it('a later, unrelated ticket (via the Create Ticket button) never reuses a prior question/answer', async () => {
    const question = 'Why am I unable to reset my password?';
    const answer = 'Go to the login page and click Forgot Password.';
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', question, answer });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00060', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');

    const firstSubjectInput = screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement;
    expect(firstSubjectInput.value).toContain('Why am I unable to reset my password');

    await fillMinimalForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(1));
    expect(mockEscalateToSupport.mock.calls[0][0].issue_details.original_question).toBe(question);

    // The modal shows its own success screen first; only dismissing it
    // (Done) fires onCreated and actually closes the modal.
    await screen.findByText('Ticket submitted');
    await act(async () => {
      fireEvent.click(screen.getByText('Done'));
    });

    // Opening a fresh ticket via the main "Create Ticket" button must
    // start with a blank slate, not the previous question/answer.
    await act(async () => {
      fireEvent.click(screen.getByText('Create Ticket'));
    });
    const secondSubjectInput = screen.getByPlaceholderText('Brief summary of your issue') as HTMLInputElement;
    expect(secondSubjectInput.value).toBe('');

    await fillMinimalForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    await waitFor(() => expect(mockEscalateToSupport).toHaveBeenCalledTimes(2));
    expect(mockEscalateToSupport.mock.calls[1][0].issue_details.original_question).toBeUndefined();
    expect(mockEscalateToSupport.mock.calls[1][0].issue_details.chatbot_answer).toBeUndefined();
  });

  it('strips raise/question/answer from the URL once the form is closed, so a refresh does not reopen it with stale prefill', async () => {
    const question = 'Why am I unable to reset my password?';
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', question });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    expect(mockRouterReplace).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close'));
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard/support-history?tab=tickets');
  });

  it('strips raise/question/answer from the URL once the ticket is created', async () => {
    const question = 'Why am I unable to reset my password?';
    mockSearchParams = new URLSearchParams({ tab: 'tickets', raise: '1', question });
    mockEscalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00061', status: 'open', message: 'Created' });
    render(<SupportHistoryPage />);
    await screen.findByText('Raise a support ticket');
    await fillMinimalForm();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit ticket'));
    });
    await screen.findByText('Ticket submitted');
    await act(async () => {
      fireEvent.click(screen.getByText('Done'));
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard/support-history?tab=tickets');
  });
});

describe('Account switch (e.g. signing into a different account from another tab)', () => {
  const session = (overrides: Partial<Record<string, unknown>> = {}) => ({
    session_id: 'sess-1',
    user_id: 'user-1',
    status: 'active',
    created_at: '2026-10-10T00:00:00Z',
    title: 'conversation',
    preview: 'preview',
    message_count: 1,
    ...overrides,
  });

  it('refetches conversation history for the new account instead of continuing to show the old one', async () => {
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'alice-sess', title: "Alice's conversation" })],
    });

    render(<SupportHistoryPage />);
    expect(await screen.findByText("Alice's conversation")).toBeInTheDocument();

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'bob-sess', title: "Bob's conversation" })],
    });

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    expect(await screen.findByText("Bob's conversation")).toBeInTheDocument();
    expect(screen.queryByText("Alice's conversation")).not.toBeInTheDocument();
  });

  it('still refetches for a switched account when the very first account check failed', async () => {
    mockGetProfile.mockRejectedValueOnce(new Error('Network error'));
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'alice-sess', title: "Alice's conversation" })],
    });
    render(<SupportHistoryPage />);
    expect(await screen.findByText("Alice's conversation")).toBeInTheDocument();
    await waitFor(() => expect(mockGetProfile).toHaveBeenCalledTimes(1));

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'bob-sess', title: "Bob's conversation" })],
    });
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    expect(await screen.findByText("Bob's conversation")).toBeInTheDocument();
    expect(screen.queryByText("Alice's conversation")).not.toBeInTheDocument();
  });

  it('closes an open create-ticket modal rather than let it submit under the new account', async () => {
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    render(<SupportHistoryPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Create Ticket'));
    });
    expect(screen.getByText('Raise a support ticket')).toBeInTheDocument();

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    await waitFor(() => {
      expect(screen.queryByText('Raise a support ticket')).not.toBeInTheDocument();
    });
  });

  it('a tab regaining focus with no real account change does not needlessly remount the sections', async () => {
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    mockGetChatSessionHistory.mockResolvedValue({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'alice-sess', title: "Alice's conversation" })],
    });

    render(<SupportHistoryPage />);
    await screen.findByText("Alice's conversation");
    const historyCallsBefore = mockGetChatSessionHistory.mock.calls.length;
    const profileCallsBefore = mockGetProfile.mock.calls.length;

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // The account IS re-checked on focus (this would still pass if the
    // visibilitychange listener were deleted otherwise) -- but since it's
    // the same email, no switch is detected and the section is not torn
    // down and refetched.
    await waitFor(() => expect(mockGetProfile.mock.calls.length).toBeGreaterThan(profileCallsBefore));
    expect(mockGetChatSessionHistory.mock.calls.length).toBe(historyCallsBefore);
    expect(screen.getByText("Alice's conversation")).toBeInTheDocument();
  });

  it('detects a switch via the tab regaining focus too, not only via the storage event', async () => {
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'alice-sess', title: "Alice's conversation" })],
    });

    render(<SupportHistoryPage />);
    await screen.findByText("Alice's conversation");

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'bob-sess', title: "Bob's conversation" })],
    });

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(await screen.findByText("Bob's conversation")).toBeInTheDocument();
    expect(screen.queryByText("Alice's conversation")).not.toBeInTheDocument();
  });

  it('also remounts the My Tickets section on a switch, not just Conversation History', async () => {
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    mockGetSupportTickets.mockResolvedValueOnce({
      data: [ticket({ ticket_id: 'CB-ALICE-1', subject: "Alice's ticket" })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });

    mockSearchParams = new URLSearchParams('tab=tickets');
    render(<SupportHistoryPage />);
    let table = await screen.findByRole('table');
    expect(within(table).getByText("Alice's ticket")).toBeInTheDocument();

    mockGetProfile.mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' });
    mockGetSupportTickets.mockResolvedValueOnce({
      data: [ticket({ ticket_id: 'CB-BOB-1', subject: "Bob's ticket", user_email: 'bob@example.com', user_name: 'Bob' })],
      page: 1, limit: 100, total_records: 1, total_pages: 1,
    });

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });

    await waitFor(() => expect(within(screen.getByRole('table')).queryByText("Alice's ticket")).not.toBeInTheDocument());
    table = screen.getByRole('table');
    expect(within(table).getByText("Bob's ticket")).toBeInTheDocument();
  });

  it('ignores a stale account check that resolves after a newer one already answered', async () => {
    mockGetProfile.mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' });
    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'alice-sess', title: "Alice's conversation" })],
    });
    render(<SupportHistoryPage />);
    await screen.findByText("Alice's conversation");

    // Two checks go out back-to-back (e.g. storage fires twice in quick
    // succession); the OLDER one (issued first) is the slower of the two
    // and resolves with its own (now stale) read only AFTER the NEWER one
    // has already resolved with the real, current account.
    let resolveOlder!: (value: unknown) => void;
    let resolveNewer!: (value: unknown) => void;
    mockGetProfile
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOlder = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNewer = resolve; }));
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'token_last_refreshed_at' }));
    });

    mockGetChatSessionHistory.mockResolvedValueOnce({
      total: 1, skip: 0, limit: 20,
      sessions: [session({ session_id: 'carol-sess', title: "Carol's conversation" })],
    });
    await act(async () => {
      resolveNewer({ email: 'carol@example.com', full_name: 'Carol' });
    });
    await screen.findByText("Carol's conversation");
    const historyCallsAfterRealSwitch = mockGetChatSessionHistory.mock.calls.length;

    // The older, stale read of Alice arrives last -- it must not revert
    // the account to Alice, re-trigger a bogus second switch, or refetch
    // anything a second time.
    await act(async () => {
      resolveOlder({ email: 'alice@example.com', full_name: 'Alice' });
    });

    expect(screen.getByText("Carol's conversation")).toBeInTheDocument();
    expect(screen.queryByText("Alice's conversation")).not.toBeInTheDocument();
    expect(mockGetChatSessionHistory.mock.calls.length).toBe(historyCallsAfterRealSwitch);
  });
});
