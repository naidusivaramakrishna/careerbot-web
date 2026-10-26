import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';

/**
 * Optional screenshot attachments on support tickets.
 *
 * Covers the authenticated ticket-creation path (simpler form: no OTP
 * gate) end to end: uploading a file before submission, sending its
 * attachment_id along with the ticket, continuing to work with no file
 * attached at all, and not letting an upload failure block the ticket.
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

const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });
const escalateToSupport = vi.fn();
const uploadTicketAttachment = vi.fn();

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: vi.fn(),
  escalateToSupport: (...args: unknown[]) => escalateToSupport(...args),
  uploadTicketAttachment: (...args: unknown[]) => uploadTicketAttachment(...args),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
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

const openTicketModal = async () => {
  await act(async () => {
    fireEvent.click(screen.getByText('Raise a support ticket'));
  });
  await screen.findByText('🎫 Raise a Support Ticket');
};

/** Fills the minimum fields the authenticated form requires to enable
 * "Submit Ticket" (per ChatApp.tsx's disabled condition): subject,
 * description, and a selected feature chip. */
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

const attachFile = async (file: File) => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });
};

beforeEach(() => {
  localStorage.clear();
  getSupportTickets.mockReset().mockResolvedValue({ data: [] });
  escalateToSupport.mockReset();
  uploadTicketAttachment.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Support ticket creation -- with and without a screenshot', () => {
  it('raises a ticket with no attachment exactly as before -- uploadTicketAttachment is never called', async () => {
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00042', status: 'open', message: 'Created',
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    expect(uploadTicketAttachment).not.toHaveBeenCalled();
    expect(escalateToSupport.mock.calls[0][0].attachment_ids).toBeUndefined();
  });

  it('uploads the selected screenshot before submitting, and includes its attachment_id on the ticket', async () => {
    uploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'abc123', filename: 'screenshot.png',
      content_type: 'image/png', size: 1024,
    });
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00043', status: 'open', message: 'Created',
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    await attachFile(file);
    expect(screen.getByText('screenshot.png')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    expect(uploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(uploadTicketAttachment.mock.calls[0][0]).toBe(file);
    expect(escalateToSupport.mock.calls[0][0].attachment_ids).toEqual(['abc123']);
  });

  it('removing an attached file before submitting leaves the ticket with no attachment', async () => {
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00044', status: 'open', message: 'Created',
    });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    await attachFile(file);
    // Scoped to the attachment list -- the modal's own close button is
    // also "✕" and would otherwise be an ambiguous match.
    const attachmentItem = screen.getByText('screenshot.png').closest('.attachment-item') as HTMLElement;
    await act(async () => {
      fireEvent.click(within(attachmentItem).getByText('✕'));
    });
    expect(screen.queryByText('screenshot.png')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    expect(uploadTicketAttachment).not.toHaveBeenCalled();
  });

  it('a failed upload does not block ticket creation -- the ticket is still raised, without that attachment', async () => {
    uploadTicketAttachment.mockRejectedValue(new Error('network error'));
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00045', status: 'open', message: 'Created',
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    await attachFile(file);

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    expect(escalateToSupport.mock.calls[0][0].attachment_ids).toBeUndefined();
    consoleErrorSpy.mockRestore();
  });

  it('when multiple files are attached, only the ones that upload successfully are sent with the ticket', async () => {
    uploadTicketAttachment
      .mockResolvedValueOnce({ success: true, attachment_id: 'good-1', filename: 'a.png', content_type: 'image/png', size: 10 })
      .mockRejectedValueOnce(new Error('too large'));
    escalateToSupport.mockResolvedValue({
      success: true, ticket_id: 'CB-00046', status: 'open', message: 'Created',
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File(['a'], 'a.png', { type: 'image/png' });
    const fileB = new File(['b'], 'b.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    expect(escalateToSupport.mock.calls[0][0].attachment_ids).toEqual(['good-1']);
  });

  it('keeps at most 5 files (the backend limit) and says which ones were left out', async () => {
    uploadTicketAttachment.mockImplementation(async (f: File) => ({
      success: true, attachment_id: `id-${f.name}`, filename: f.name, content_type: 'image/png', size: 1,
    }));
    escalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00047', status: 'open', message: 'Created' });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const files = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'].map(
      (n) => new File(['x'], n, { type: 'image/png' }),
    );
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files } });
    });

    expect(screen.getByText('5.png')).toBeInTheDocument();
    expect(screen.queryByText('6.png')).not.toBeInTheDocument();
    expect(screen.getByText(/up to 5 files/i)).toHaveTextContent('6.png');

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));
    expect(uploadTicketAttachment).toHaveBeenCalledTimes(5);
    expect(escalateToSupport.mock.calls[0][0].attachment_ids).toHaveLength(5);
  });

  it('does not attach a file over 5 MB and says so', async () => {
    await openWidget();
    await openTicketModal();

    const big = new File(['x'], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    const small = new File(['x'], 'small.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [big, small] } });
    });

    expect(screen.getByText('small.png')).toBeInTheDocument();
    expect(screen.getByText(/larger than 5 MB/i)).toHaveTextContent('huge.pdf');
    expect(document.querySelectorAll('.attachment-item')).toHaveLength(1);
  });

  it('tells the user which files could not be attached when an upload fails', async () => {
    uploadTicketAttachment
      .mockResolvedValueOnce({ success: true, attachment_id: 'good-1', filename: 'a.png', content_type: 'image/png', size: 10 })
      .mockRejectedValueOnce(new Error('too large'));
    escalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00048', status: 'open', message: 'Created' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })] },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await screen.findByText('Ticket Submitted Successfully');
    const notice = screen.getByText(/could not be attached/i);
    expect(notice).toHaveTextContent('b.png');
    expect(notice).not.toHaveTextContent('a.png');
    errorSpy.mockRestore();
  });

  it('a ticket whose uploads all succeed shows no could-not-attach notice', async () => {
    uploadTicketAttachment.mockResolvedValue({ success: true, attachment_id: 'ok', filename: 'a.png', content_type: 'image/png', size: 1 });
    escalateToSupport.mockResolvedValue({ success: true, ticket_id: 'CB-00049', status: 'open', message: 'Created' });

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();
    await attachFile(new File(['a'], 'a.png', { type: 'image/png' }));
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });

    await screen.findByText('Ticket Submitted Successfully');
    expect(screen.queryByText(/could not be attached/i)).not.toBeInTheDocument();
  });


  it('a ticket is not created under a different account that signed in while its files uploaded', async () => {
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    let resolveUpload: (v: unknown) => void = () => {};
    uploadTicketAttachment.mockReturnValue(new Promise((r) => { resolveUpload = r; }));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();
    await attachFile(new File(['a'], 'a.png', { type: 'image/png' }));
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(uploadTicketAttachment).toHaveBeenCalledTimes(1));

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveUpload({ success: true, attachment_id: 'id-a', filename: 'a.png', content_type: 'image/png', size: 1 });
    });
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/account changed/i)));
    expect(escalateToSupport).not.toHaveBeenCalled();
  });

  it('a ticket that is created while another account signs in is reported with its ID, and the form is closed', async () => {
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    let resolveTicket: (v: unknown) => void = () => {};
    escalateToSupport.mockReturnValue(new Promise((r) => { resolveTicket = r; }));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await openWidget();
    await openTicketModal();
    await fillMinimalAuthenticatedForm();
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Ticket'));
    });
    await waitFor(() => expect(escalateToSupport).toHaveBeenCalledTimes(1));

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolveTicket({ success: true, ticket_id: 'CB-00777', status: 'open', message: 'Created' });
    });
    // It exists: say so (with its ID), so nobody resubmits it as a duplicate...
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('CB-00777')));
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    // ...but it is not shown as, or listed under, the account signed in now.
    expect(screen.queryByText('Ticket Submitted Successfully')).not.toBeInTheDocument();
    expect(localStorage.getItem('saved_tickets') ?? '').not.toContain('CB-00777');
  });

  it('a ticket form whose profile prefill finishes after another account signed in is not opened with the previous account\'s details', async () => {
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    let resolvePrefill: (v: unknown) => void = () => {};
    vi.mocked(getProfile).mockReturnValueOnce(new Promise<unknown>((r) => { resolvePrefill = r; }) as ReturnType<typeof getProfile>);
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket'));
    });

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    await act(async () => {
      resolvePrefill({ email: 'alice@example.com', full_name: 'Alice' });
    });
    expect(screen.queryByDisplayValue('alice@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
  });

  it('a ticket form whose profile prefill fails after another account signed in is not opened either', async () => {
    vi.mocked(getProfile).mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice' } as Awaited<ReturnType<typeof getProfile>>);
    await openWidget();
    await waitFor(() => expect(screen.getByText(/👤 Alice/)).toBeInTheDocument());

    let rejectPrefill: (e: unknown) => void = () => {};
    vi.mocked(getProfile).mockReturnValueOnce(new Promise<unknown>((_, reject) => { rejectPrefill = reject; }) as ReturnType<typeof getProfile>);
    await act(async () => {
      fireEvent.click(screen.getByText('Raise a support ticket'));
    });

    vi.mocked(getProfile).mockResolvedValue({ email: 'bob@example.com', full_name: 'Bob' } as Awaited<ReturnType<typeof getProfile>>);
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    await waitFor(() => expect(screen.getByText(/👤 Bob/)).toBeInTheDocument());

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      rejectPrefill(new Error('Network Error'));
    });
    expect(screen.queryByText('🎫 Raise a Support Ticket')).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
