/**
 * Unit tests for the guest Support Ticket Portal (/support/tickets/new).
 *
 * Covers:
 *   Rendering
 *     - Guests see name/email/user-type/category/subcategory/subject/
 *       description + Send OTP -- the Subcategory (Issue Type) field is
 *       shown to guests too, populated once a category is picked
 *     - Authenticated users skip name/email/user-type/OTP, see a prefilled
 *       summary, and also see Subcategory
 *   Validation
 *     - Empty required fields are rejected without calling the API
 *     - Subject/description below the minimum length are rejected
 *     - Guest submission without OTP verification is rejected
 *   Guest OTP flow
 *     - Send OTP reveals the code input
 *     - Verifying shows "Email verified" and hides the code input
 *   Happy path
 *     - Full guest flow submits the correct payload (incl. user_type AND
 *       issue_type) and shows the ticket ID
 *     - Authenticated users submit without OTP, with issue_type sent and
 *       no user_type
 *     - Priority, Steps to Reproduce, and Attachments all reach the backend
 *   Error handling
 *     - A failed submission shows an error and keeps all entered data
 *     - A 403 on submit resets guest verification and asks to re-verify
 *   Context carried from the chatbot
 *     - ?question=&answer= prefills the subject and reaches the backend
 *       as original_question/chatbot_answer, same as the in-widget modal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

let mockAuthenticated = false;
vi.mock('@/api/chatbotAuth', () => ({
  isUserAuthenticated: () => mockAuthenticated,
}));

const mockGetProfile = vi.fn();
vi.mock('@/api/userApi', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
}));

const mockEscalateToSupport = vi.fn();
const mockSendTicketOtp = vi.fn();
const mockVerifyTicketOtp = vi.fn();
const mockUploadTicketAttachment = vi.fn();
vi.mock('@/api/chatbotApi', () => ({
  escalateToSupport: (...args: unknown[]) => mockEscalateToSupport(...args),
  sendTicketOtp: (...args: unknown[]) => mockSendTicketOtp(...args),
  verifyTicketOtp: (...args: unknown[]) => mockVerifyTicketOtp(...args),
  uploadTicketAttachment: (...args: unknown[]) => mockUploadTicketAttachment(...args),
}));

let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

import SupportTicketPortalPage from '@/app/support/tickets/new/page';

// 'login-issues' -- not 'ai-resume-builder' -- because this is shared by
// both guest and authenticated tests, and guests can now only select the
// two categories the backend actually accepts from them (see
// GUEST_ALLOWED_CATEGORY_IDS in the page itself).
const fillCoreFields = () => {
  fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'login-issues' } });
  fireEvent.change(screen.getByTestId('ticket-subject-input'), { target: { value: 'My resume will not export' } });
  fireEvent.change(screen.getByTestId('ticket-description-input'), {
    target: { value: 'I click export and nothing happens, tried three times.' },
  });
};

const verifyGuestEmail = async () => {
  fireEvent.change(screen.getByTestId('ticket-name-input'), { target: { value: 'Jamie Guest' } });
  fireEvent.change(screen.getByTestId('ticket-email-input'), { target: { value: 'jamie@example.com' } });
  fireEvent.change(screen.getByTestId('ticket-user-type-select'), { target: { value: 'student' } });
  mockSendTicketOtp.mockResolvedValueOnce({ success: true, message: 'sent' });
  fireEvent.click(screen.getByTestId('send-otp-btn'));
  await screen.findByTestId('ticket-otp-input');
  fireEvent.change(screen.getByTestId('ticket-otp-input'), { target: { value: '123456' } });
  mockVerifyTicketOtp.mockResolvedValueOnce({ success: true, verified: true, message: 'ok', token: 'verify-token-abc' });
  fireEvent.click(screen.getByTestId('verify-otp-btn'));
  await screen.findByText('Email verified');
};

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks only clears call history, not a persistent
  // mockResolvedValue left behind by an earlier test -- reset this one
  // explicitly so every test starts from a clean implementation instead
  // of silently inheriting whichever account the previous test mocked.
  mockGetProfile.mockReset();
  mockGetProfile.mockRejectedValue(new Error('Request failed with status code 401'));
  mockAuthenticated = false;
  mockSearchParams = new URLSearchParams();
});

describe('Support Ticket Portal -- guest rendering', () => {
  it('shows name, email, user type, category, subject, description, and Send OTP', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(screen.getByTestId('ticket-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-user-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-category-select')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-subject-input')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-otp-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('ticket-otp-input')).not.toBeInTheDocument();
  });

  it('shows the Subcategory field, populated with that category\'s options once a category is picked', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(screen.getByTestId('ticket-issue-type-select')).toBeDisabled();

    fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'login-issues' } });

    const subcategorySelect = screen.getByTestId('ticket-issue-type-select');
    expect(subcategorySelect).not.toBeDisabled();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText('Unable to Login')).toBeInTheDocument();
  });

  it('resets the Subcategory selection when the category changes', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'login-issues' } });
    fireEvent.change(screen.getByTestId('ticket-issue-type-select'), { target: { value: 'forgot_password' } });
    expect(screen.getByTestId('ticket-issue-type-select')).toHaveValue('forgot_password');

    // The other guest-eligible category -- still exercises "category change
    // resets subcategory" without relying on an option guests can't pick.
    fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'account-organization' } });
    expect(screen.getByTestId('ticket-issue-type-select')).toHaveValue('');
    expect(screen.getByText('Organization access issue')).toBeInTheDocument();
  });

  it('only offers the categories the backend actually accepts from a guest, not the full list', async () => {
    render(<SupportTicketPortalPage />);
    const select = await screen.findByTestId('ticket-category-select') as HTMLSelectElement;

    const optionValues = Array.from(select.options).map((o) => o.value);
    // "" is the placeholder "Select a category…" option.
    expect(optionValues).toEqual(['', 'login-issues', 'account-organization']);
  });
});

describe('Support Ticket Portal -- authenticated rendering', () => {
  it('skips name/email/user-type/OTP fields and shows a prefilled summary instead', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockResolvedValueOnce({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(screen.queryByTestId('ticket-name-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ticket-email-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ticket-user-type-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('send-otp-btn')).not.toBeInTheDocument();
    expect(screen.getByText(/Alice Signed-in/)).toBeInTheDocument();
    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
  });

  it('also shows the Subcategory field, populated once a category is picked', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockResolvedValueOnce({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(screen.getByTestId('ticket-issue-type-select')).toBeDisabled();

    fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'ai-resume-builder' } });

    const subcategorySelect = screen.getByTestId('ticket-issue-type-select');
    expect(subcategorySelect).not.toBeDisabled();
    expect(screen.getByText('Template not loading')).toBeInTheDocument();
  });

  it('offers the full category list, unfiltered -- the guest restriction does not apply once signed in', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockResolvedValueOnce({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    const select = await screen.findByTestId('ticket-category-select') as HTMLSelectElement;

    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toContain('ai-resume-builder');
    expect(optionValues).toContain('payment-billing');
    expect(optionValues.length).toBeGreaterThan(3);
  });
});

describe('Support Ticket Portal -- stale local auth marker', () => {
  it('still shows the signed-in form when the marker is stale but the profile fetch succeeds', async () => {
    mockAuthenticated = false;
    mockGetProfile.mockResolvedValue({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(mockGetProfile).toHaveBeenCalledWith({ skipAuthRedirect: true });
    expect(screen.queryByTestId('send-otp-btn')).not.toBeInTheDocument();
    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
  });
});

describe('Support Ticket Portal -- validation', () => {
  it('rejects an empty guest submission without calling the API', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Please select your user type.')).toBeInTheDocument();
    expect(screen.getByText('Please select an issue category.')).toBeInTheDocument();
    expect(screen.getByText('Subject is required.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('rejects a subject/description below the minimum length', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    fireEvent.change(screen.getByTestId('ticket-subject-input'), { target: { value: 'Hi' } });
    fireEvent.change(screen.getByTestId('ticket-description-input'), { target: { value: 'too short' } });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText('Subject must be at least 5 characters.')).toBeInTheDocument();
    expect(screen.getByText('Description must be at least 20 characters.')).toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('rejects a guest submission with valid fields but no OTP verification', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    fireEvent.change(screen.getByTestId('ticket-name-input'), { target: { value: 'Jamie Guest' } });
    fireEvent.change(screen.getByTestId('ticket-email-input'), { target: { value: 'jamie@example.com' } });
    fillCoreFields();
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText('Please verify your email before submitting.')).toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });
});

describe('Support Ticket Portal -- guest OTP flow', () => {
  it('sending OTP reveals the code input, verifying shows "Email verified" and hides it again', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();

    expect(screen.queryByTestId('ticket-otp-input')).not.toBeInTheDocument();
    expect(mockSendTicketOtp).toHaveBeenCalledWith({ email: 'jamie@example.com' });
    expect(mockVerifyTicketOtp).toHaveBeenCalledWith({ email: 'jamie@example.com', otp: '123456' });
  });
});

describe('Support Ticket Portal -- happy path', () => {
  it('submits the full guest flow with the correct payload and shows the ticket ID', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();
    fireEvent.change(screen.getByTestId('ticket-issue-type-select'), { target: { value: 'forgot_password' } });

    mockEscalateToSupport.mockResolvedValueOnce({
      success: true,
      ticket_id: 'CB-00042',
      status: 'open',
      message: 'created',
    });

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    expect(screen.getByTestId('ticket-id')).toHaveTextContent('CB-00042');
    expect(mockToast.success).toHaveBeenCalledWith('Support ticket submitted.');

    expect(mockEscalateToSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_category: 'login-issues',
        issue_title: 'My resume will not export',
        issue_description: 'I click export and nothing happens, tried three times.',
        contact_email: 'jamie@example.com',
        issue_details: expect.objectContaining({
          requester_name: 'Jamie Guest',
          requester_email: 'jamie@example.com',
          verification_token: 'verify-token-abc',
          user_type: 'student',
          // Subcategory is now sent for guests too.
          issue_type: 'forgot_password',
        }),
      }),
    );
  });

  it('guest submission with no subcategory picked sends no issue_type -- it stays optional', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();
    mockEscalateToSupport.mockResolvedValueOnce({
      success: true, ticket_id: 'CB-00043', status: 'open', message: 'created',
    });

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.issue_type).toBeUndefined();
  });

  it('authenticated users submit without ever going through OTP, with Issue Type sent and no User Type', async () => {
    mockAuthenticated = true;
    // Not Once: the page re-confirms the account right before submitting,
    // so getProfile is called twice (mount, then pre-submit) for the same
    // authenticated account.
    mockGetProfile.mockResolvedValue({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    fillCoreFields();
    fireEvent.change(screen.getByTestId('ticket-issue-type-select'), { target: { value: 'forgot_password' } });
    mockEscalateToSupport.mockResolvedValueOnce({
      success: true,
      ticket_id: 'CB-00099',
      status: 'open',
      message: 'created',
    });

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    expect(screen.getByTestId('ticket-id')).toHaveTextContent('CB-00099');
    expect(mockSendTicketOtp).not.toHaveBeenCalled();
    expect(mockVerifyTicketOtp).not.toHaveBeenCalled();

    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.issue_type).toBe('forgot_password');
    // No User Type UI exists for authenticated users, so none is sent.
    expect(submitted.issue_details.user_type).toBeUndefined();
  });

  it('aborts submission instead of filing the ticket if the account changed since the form opened', async () => {
    mockAuthenticated = true;
    // Mount check sees Alice; the pre-submit re-check (right before
    // escalateToSupport) sees Bob -- a switch happened in another tab
    // while this form was open.
    mockGetProfile
      .mockResolvedValueOnce({ full_name: 'Alice Signed-in', email: 'alice@example.com' })
      .mockResolvedValueOnce({ full_name: 'Bob', email: 'bob@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    fillCoreFields();
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
    // The filled-in fields must still be there -- aborting is not the same
    // as losing the user's work.
    expect(screen.getByTestId('ticket-subject-input')).toHaveValue('My resume will not export');
  });

  it('aborts submission if the account switches between the upload and the ticket itself being filed', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockResolvedValue({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');
    fillCoreFields();

    const file = new File(['bytes'], 'screenshot.png', { type: 'image/png' });
    // The switch happens as a side effect of the upload resolving -- models
    // a real race (another tab signs in while this upload is in flight),
    // not a switch already visible before the pre-upload check runs.
    mockUploadTicketAttachment.mockImplementationOnce(async () => {
      mockGetProfile.mockResolvedValue({ full_name: 'Bob', email: 'bob@example.com' });
      return { success: true, attachment_id: 'att-1', filename: 'screenshot.png', content_type: 'image/png', size: 123 };
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    // The upload itself already happened (it's not safe to "undo" an
    // upload the backend accepted), but the ticket that would have
    // attached it to the WRONG account's name/session must not go out.
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('aborts submission before ever uploading if the account already changed when Submit was clicked', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockResolvedValue({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');
    fillCoreFields();

    const file = new File(['bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await screen.findByText('screenshot.png');

    mockGetProfile.mockResolvedValue({ full_name: 'Bob', email: 'bob@example.com' });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText(/account changed in another tab/i)).toBeInTheDocument();
    expect(mockUploadTicketAttachment).not.toHaveBeenCalled();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('retries a failed submission without re-uploading an attachment that already succeeded', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockResolvedValue({ full_name: 'Alice Signed-in', email: 'alice@example.com' });
    mockUploadTicketAttachment.mockResolvedValue({
      success: true, attachment_id: 'att-1', filename: 'screenshot.png', content_type: 'image/png', size: 123,
    });
    mockEscalateToSupport.mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValueOnce({ success: true, ticket_id: 'CB-00099', status: 'open', message: 'Created' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');
    fillCoreFields();

    const file = new File(['bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await screen.findByText('screenshot.png');

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));
    await screen.findByText('Server error');

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByTestId('ticket-success')).toBeInTheDocument();
    expect(mockUploadTicketAttachment).toHaveBeenCalledTimes(1);
    expect(mockEscalateToSupport).toHaveBeenCalledTimes(2);
  });

  it('blocks submission with a retryable error, not a false "account changed" claim, when the account check itself fails', async () => {
    mockAuthenticated = true;
    mockGetProfile
      .mockResolvedValueOnce({ full_name: 'Alice Signed-in', email: 'alice@example.com' })
      .mockRejectedValueOnce(new Error('Network error'));
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');
    fillCoreFields();

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText(/couldn't confirm your account/i)).toBeInTheDocument();
    expect(screen.queryByText(/account changed in another tab/i)).not.toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('treats a 401 on the account check as a sign-out, not a generic failure or a false "account changed" claim', async () => {
    mockAuthenticated = true;
    mockGetProfile
      .mockResolvedValueOnce({ full_name: 'Alice Signed-in', email: 'alice@example.com' })
      .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { response: { status: 401 } }));
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');
    fillCoreFields();

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText(/signed out/i)).toBeInTheDocument();
    expect(screen.queryByText(/account changed in another tab/i)).not.toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('falls back to the guest form, not a broken authenticated one, when the mount-time profile fetch fails', async () => {
    // isUserAuthenticated() is a local heuristic (a token marker), not
    // proof of a valid session. If the profile fetch that's supposed to
    // confirm it fails, rendering the authenticated form anyway would ask
    // for no name/email/user-type and no OTP verification -- a ticket
    // could then be submitted with zero identifying information and zero
    // verification. Falling back to the (already OTP-gated) guest form is
    // the safe behavior.
    mockAuthenticated = true;
    mockGetProfile.mockRejectedValue(new Error('Network error'));

    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(screen.getByTestId('ticket-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-user-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('send-otp-btn')).toBeInTheDocument();

    fillCoreFields();
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    // Blocked by the guest form's own OTP-required validation, same as any
    // other unverified guest -- never silently submitted as "authenticated".
    expect(await screen.findByText('Please verify your email before submitting.')).toBeInTheDocument();
    expect(mockEscalateToSupport).not.toHaveBeenCalled();
  });

  it('submits the guest shape it showed (not the stale local marker) once the guest verifies', async () => {
    mockAuthenticated = true;
    mockGetProfile.mockRejectedValue(new Error('Network error'));
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');
    await verifyGuestEmail();
    fillCoreFields();
    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00079', status: 'open', message: 'created' });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));
    await screen.findByTestId('ticket-success');
    expect(mockEscalateToSupport.mock.calls[0][0].authenticated).toBe(false);
  });

  it('submits Priority, Steps to Reproduce, and uploaded Attachments', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();
    fireEvent.click(screen.getByTestId('priority-urgent-btn'));
    fireEvent.change(screen.getByTestId('ticket-steps-input'), {
      target: { value: '1. Open the builder 2. Click export 3. Nothing happens' },
    });

    const file = new File(['screenshot-bytes'], 'screenshot.png', { type: 'image/png' });
    mockUploadTicketAttachment.mockResolvedValueOnce({
      success: true, attachment_id: 'att-1', filename: 'screenshot.png', content_type: 'image/png', size: 123,
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText('screenshot.png')).toBeInTheDocument();

    mockEscalateToSupport.mockResolvedValueOnce({
      success: true,
      ticket_id: 'CB-00123',
      status: 'open',
      message: 'created',
      attachments: [{ attachment_id: 'att-1', filename: 'screenshot.png', view_url: 'https://example.com/view/att-1' }],
    });

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    expect(mockUploadTicketAttachment).toHaveBeenCalledWith(file);
    expect(mockEscalateToSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        attachment_ids: ['att-1'],
        issue_details: expect.objectContaining({
          priority: 2,
          steps_to_reproduce: '1. Open the builder 2. Click export 3. Nothing happens',
        }),
      }),
    );
    expect(screen.getByRole('link', { name: 'screenshot.png' })).toHaveAttribute('href', 'https://example.com/view/att-1');
  });

  it('still submits the ticket when an attachment upload fails, and warns which file was dropped', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();

    const file = new File(['bytes'], 'broken.png', { type: 'image/png' });
    mockUploadTicketAttachment.mockRejectedValueOnce(new Error('upload failed'));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText('broken.png')).toBeInTheDocument();

    mockEscalateToSupport.mockResolvedValueOnce({
      success: true, ticket_id: 'CB-00124', status: 'open', message: 'created',
    });

    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    // The ticket still goes out -- resilience is unchanged.
    expect(mockEscalateToSupport).toHaveBeenCalledWith(
      expect.objectContaining({ attachment_ids: undefined }),
    );
    expect(mockToast.success).toHaveBeenCalledWith('Support ticket submitted.');
    // But the submitter is told, not left to assume it's attached.
    expect(mockToast.warning).toHaveBeenCalledWith(expect.stringContaining('broken.png'));
  });
});

describe('Support Ticket Portal -- error handling', () => {
  it('a failed submission shows an error and keeps every entered field', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();

    mockEscalateToSupport.mockRejectedValueOnce(new Error('Backend is unreachable'));
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(await screen.findByText('Backend is unreachable')).toBeInTheDocument();
    expect(screen.queryByTestId('ticket-success')).not.toBeInTheDocument();
    // Nothing was cleared -- the user can fix and resubmit without retyping.
    expect(screen.getByTestId('ticket-name-input')).toHaveValue('Jamie Guest');
    expect(screen.getByTestId('ticket-email-input')).toHaveValue('jamie@example.com');
    expect(screen.getByTestId('ticket-subject-input')).toHaveValue('My resume will not export');
    expect(screen.getByTestId('ticket-description-input')).toHaveValue(
      'I click export and nothing happens, tried three times.',
    );
    expect(screen.getByTestId('ticket-category-select')).toHaveValue('login-issues');
  });

  it('a 403 on submit resets guest verification and asks them to re-verify', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();

    const forbidden = Object.assign(new Error('Forbidden'), { response: { status: 403 } });
    mockEscalateToSupport.mockRejectedValueOnce(forbidden);
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(
      await screen.findByText("Your email verification expired or doesn't match this email. Please verify your email again and resubmit."),
    ).toBeInTheDocument();
    // Back to needing verification -- Send OTP is available again, the
    // "Email verified" banner is gone.
    expect(screen.queryByText('Email verified')).not.toBeInTheDocument();
    expect(screen.getByTestId('send-otp-btn')).toBeInTheDocument();
  });

  it('a 403 for a non-login guest ticket (X-Redirect header) shows the real reason and keeps the verified email intact', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fillCoreFields();

    // Same status code as the generic case, but this is the backend's
    // "guests may only file login/access tickets" rejection (CHECK 2 in
    // support_tickets_public.py) -- told apart by X-Redirect instead of
    // X-Next-Step. Re-verifying the OTP would never fix this, so the UI
    // must not claim the verification expired or reset it.
    const forbidden = Object.assign(new Error('Forbidden'), {
      response: {
        status: 403,
        headers: { 'x-redirect': '/login' },
        data: { detail: 'Guest users can only create tickets for login/access problems. Please log in to create a ticket for other issues.' },
      },
    });
    mockEscalateToSupport.mockRejectedValueOnce(forbidden);
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    expect(
      await screen.findByText('Guest users can only create tickets for login/access problems. Please log in to create a ticket for other issues.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Your email verification expired or doesn't match this email. Please verify your email again and resubmit."),
    ).not.toBeInTheDocument();
    // Still verified -- Send OTP must NOT reappear, "Email verified" stays.
    expect(screen.getByText('Email verified')).toBeInTheDocument();
    expect(screen.queryByTestId('send-otp-btn')).not.toBeInTheDocument();
  });
});

describe('Support Ticket Portal -- context carried from the chatbot', () => {
  const QUESTION = 'Why am I unable to reset my password from the settings page?';
  const ANSWER = 'Go to the login page and click the Forgot Password link to receive a reset email.';

  it('prefills the subject from ?question= and sends both question and answer to the backend', async () => {
    mockSearchParams = new URLSearchParams({ question: QUESTION, answer: ANSWER });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    const subjectInput = screen.getByTestId('ticket-subject-input') as HTMLInputElement;
    expect(subjectInput.value).toContain('Why am I unable to reset my password');
    expect(subjectInput.value).not.toContain('Forgot Password link');

    await verifyGuestEmail();
    fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'login-issues' } });
    fireEvent.change(screen.getByTestId('ticket-description-input'), {
      target: { value: 'Still cannot get in even after trying the reset flow twice.' },
    });

    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00077', status: 'open', message: 'created' });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toBe(QUESTION);
    expect(submitted.issue_details.chatbot_answer).toBe(ANSWER);
    // The customer's own description stays independent of the captured Q&A.
    expect(submitted.issue_description).toBe('Still cannot get in even after trying the reset flow twice.');
  });

  it('reads the Q&A handed over in sessionStorage (?ctx=<id>), then drops the stored copy', async () => {
    sessionStorage.setItem('ticket_ctx:abc123', JSON.stringify({ question: QUESTION, answer: ANSWER }));
    mockSearchParams = new URLSearchParams({ ctx: 'abc123' });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect((screen.getByTestId('ticket-subject-input') as HTMLInputElement).value).toContain('Why am I unable to reset my password');
    expect(sessionStorage.getItem('ticket_ctx:abc123')).toBeNull();

    await verifyGuestEmail();
    fillCoreFields();
    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00078', status: 'open', message: 'created' });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));
    await screen.findByTestId('ticket-success');
    expect(mockEscalateToSupport.mock.calls[0][0].issue_details.original_question).toBe(QUESTION);
    expect(mockEscalateToSupport.mock.calls[0][0].issue_details.chatbot_answer).toBe(ANSWER);
  });

  it('with no query params (e.g. reached via "Contact Support"), sends no question/answer -- nothing fabricated', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    expect(screen.getByTestId('ticket-subject-input')).toHaveValue('');

    await verifyGuestEmail();
    fillCoreFields();
    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00078', status: 'open', message: 'created' });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toBeUndefined();
    expect(submitted.issue_details.chatbot_answer).toBeUndefined();
  });
});

describe('Support Ticket Portal -- field and attachment limits', () => {
  it('caps the subject at 200 characters, even when typed past the limit', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    const longSubject = 'x'.repeat(250);
    fireEvent.change(screen.getByTestId('ticket-subject-input'), { target: { value: longSubject } });

    expect((screen.getByTestId('ticket-subject-input') as HTMLInputElement).value).toHaveLength(200);
  });

  it('caps the prefilled subject at 200 characters when the carried question has no short sentence to extract', async () => {
    const longQuestion = 'why is this happening to me and nothing I try seems to fix it no matter what '.repeat(5);
    mockSearchParams = new URLSearchParams({ question: longQuestion });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    const subjectInput = screen.getByTestId('ticket-subject-input') as HTMLInputElement;
    expect(subjectInput.value.length).toBeLessThanOrEqual(200);
  });

  it('caps original_question and chatbot_answer at 5,000 characters before sending to the backend', async () => {
    const longQuestion = 'q'.repeat(6000);
    const longAnswer = 'a'.repeat(6000);
    mockSearchParams = new URLSearchParams({ question: longQuestion, answer: longAnswer });
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    await verifyGuestEmail();
    fireEvent.change(screen.getByTestId('ticket-category-select'), { target: { value: 'login-issues' } });
    fireEvent.change(screen.getByTestId('ticket-description-input'), {
      target: { value: 'Still happening after trying everything suggested.' },
    });

    mockEscalateToSupport.mockResolvedValueOnce({ success: true, ticket_id: 'CB-00080', status: 'open', message: 'created' });
    fireEvent.click(screen.getByTestId('submit-ticket-btn'));

    await screen.findByTestId('ticket-success');
    const submitted = mockEscalateToSupport.mock.calls[0][0];
    expect(submitted.issue_details.original_question).toHaveLength(5000);
    expect(submitted.issue_details.chatbot_answer).toHaveLength(5000);
  });

  it('allows up to 5 attachments and rejects the rest with a clear notice', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    const files = Array.from({ length: 6 }, (_, i) => new File([`bytes-${i}`], `file-${i}.png`, { type: 'image/png' }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files } });

    for (let i = 0; i < 5; i++) {
      expect(await screen.findByText(`file-${i}.png`)).toBeInTheDocument();
    }
    expect(screen.queryByText('file-5.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/up to 5 files/i);
  });

  it('rejects a file over 5 MB with a clear notice, without attaching it', async () => {
    render(<SupportTicketPortalPage />);
    await screen.findByTestId('ticket-category-select');

    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [oversized] } });

    expect(screen.queryByText('huge.png')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/larger than 5 MB/i);
  });
});
