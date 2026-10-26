import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// Shared ChatApp suite setup (fast text queries, test timeout): see the file.
import './chatAppSuiteSetup';
import { getActionLink } from '@/app/(ai)/chatbot/_components/ChatApp';

/**
 * Guest vs. authenticated chatbot link behavior.
 *
 * Routes used here were confirmed against src/middleware.ts before being
 * added: /forgot-password is public (publicRoutes), /profile and
 * /builder/start fall through the default-protected branch (no page-level
 * public exemption past the exact bare /builder landing), and there is no
 * separate "change password while logged in" page -- so password-change
 * topics intentionally route to the same public forgot-password flow for
 * both guest and authenticated users. /coding-test is actually public at
 * the app level (middleware.ts's own comment: "a public preview slice"),
 * but is deliberately forced through the login-trigger for guests as a
 * CHATBOT-ONLY policy, independent of the page's real access rules.
 *
 * Category spellings were verified against the live backend: the same
 * real-world topic can arrive under the hardcoded LoginIntent enum's
 * .value (fast-path keyword cascade) or a JSON knowledge-base topic's own
 * `intent` slug (KB_TOPIC_MATCH similarity-search path) -- both spellings
 * are tested here since the frontend map must key on either.
 */

describe('getActionLink -- pure routing logic', () => {
  it.each([
    'forgot_password',
    'password_forgot_or_change',
    'reset_email_not_received',
    'password_reset_email_not_received',
    'reset_link_not_working',
    'password_reset_link_not_working',
    'reset_link_expired',
    'password_reset_link_expired',
    'password_change_not_working',
    'password_changed_still_cant_login',
  ])('%s links to /forgot-password for guests, as an inline "click here"', (category) => {
    expect(getActionLink(category, false)).toEqual({
      sentence: 'To reset your password, ',
      linkText: 'click here',
      href: '/forgot-password',
    });
  });

  it.each([
    'forgot_password',
    'password_forgot_or_change',
    'password_changed_still_cant_login',
  ])('%s links to the SAME /forgot-password page for authenticated users -- no dedicated change-password page exists', (category) => {
    expect(getActionLink(category, true)).toEqual({
      sentence: 'To reset your password, ',
      linkText: 'click here',
      href: '/forgot-password',
    });
  });

  it.each(['account_locked', 'account_locked_or_blocked', 'account_temporarily_blocked'])(
    '%s links to /forgot-password regardless of auth state, matching the KB answer\'s own suggestion',
    (category) => {
      const expected = { sentence: 'To reset your password, ', linkText: 'click here', href: '/forgot-password' };
      expect(getActionLink(category, false)).toEqual(expected);
      expect(getActionLink(category, true)).toEqual(expected);
    },
  );

  it('profile_building sends a guest to the login trigger, not directly to the auth-guarded /profile page', () => {
    const link = getActionLink('profile_building', false);
    expect(link).toEqual({
      sentence: 'To view or edit your profile, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fprofile',
      requiresLogin: true,
    });
  });

  it('profile_building sends an authenticated user straight to the real /profile page', () => {
    const link = getActionLink('profile_building', true);
    expect(link).toEqual({ sentence: 'To view or edit your profile, ', linkText: 'click here', href: '/profile' });
    expect(link?.requiresLogin).toBeUndefined();
  });

  it('signup_update_registered_email also links to /profile -- its own KB answer says to update email from profile settings', () => {
    expect(getActionLink('signup_update_registered_email', true)).toEqual({
      sentence: 'To view or edit your profile, ',
      linkText: 'click here',
      href: '/profile',
    });
    expect(getActionLink('signup_update_registered_email', false)?.requiresLogin).toBe(true);
  });

  it('resume_builder sends a guest to the login trigger (not straight to the page), and an authenticated user straight to /builder/start', () => {
    expect(getActionLink('resume_builder', false)).toEqual({
      sentence: 'To get started, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fbuilder%2Fstart',
      requiresLogin: true,
    });
    expect(getActionLink('resume_builder', true)).toEqual({
      sentence: 'To get started, ',
      linkText: 'click here',
      href: '/builder/start',
    });
  });

  it('coding_test sends a guest to the login trigger even though /coding-test is actually public at the app level (chatbot-only policy)', () => {
    expect(getActionLink('coding_test', false)).toEqual({
      sentence: 'To start practicing, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fcoding-test',
      requiresLogin: true,
    });
  });

  it('coding_test sends an authenticated user straight to /coding-test -- no login prompt', () => {
    expect(getActionLink('coding_test', true)).toEqual({
      sentence: 'To start practicing, ',
      linkText: 'click here',
      href: '/coding-test',
    });
  });

  it.each([
    'login_invalid_credentials',
    'invalid_credentials',
    'otp_not_received',
    'otp_invalid',
    'otp_expired',
    'password_new_rejected',
    'new_password_rejected',
  ])('%s gets no action link -- no page exists, or the answer never actually recommends a reset', (category) => {
    expect(getActionLink(category, false)).toBeNull();
    expect(getActionLink(category, true)).toBeNull();
  });

  it('product_overview and other non-actionable topics get no link -- there is no single destination page to send anyone to', () => {
    expect(getActionLink('product_overview', false)).toBeNull();
    expect(getActionLink('product_overview', true)).toBeNull();
    expect(getActionLink('feature_general_issue', true)).toBeNull();
  });

  // Routes confirmed by reading src/middleware.ts's publicLandingPages
  // array and the actual page tree under src/app/ -- each bare landing
  // path (e.g. /jobmatch, /mock-interview) is public, only its feature
  // sub-path is protected, matching the existing /builder vs /builder/start
  // pattern above.
  it('job_match sends a guest to the login trigger, and an authenticated user straight to /jobmatch/app', () => {
    expect(getActionLink('job_match', false)).toEqual({
      sentence: 'To run it on your resume, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fjobmatch%2Fapp',
      requiresLogin: true,
    });
    expect(getActionLink('job_match', true)).toEqual({
      sentence: 'To run it on your resume, ',
      linkText: 'click here',
      href: '/jobmatch/app',
    });
  });

  it('mock_interview_live sends a guest to the login trigger, and an authenticated user straight to /mock-interview/live', () => {
    expect(getActionLink('mock_interview_live', false)).toEqual({
      sentence: 'To start a session, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fmock-interview%2Flive',
      requiresLogin: true,
    });
    expect(getActionLink('mock_interview_live', true)).toEqual({
      sentence: 'To start a session, ',
      linkText: 'click here',
      href: '/mock-interview/live',
    });
  });

  it('mock_test sends a guest to the login trigger, and an authenticated user straight to /mock-test -- the page has no public landing at all', () => {
    expect(getActionLink('mock_test', false)).toEqual({
      sentence: 'To take one, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fmock-test',
      requiresLogin: true,
    });
    expect(getActionLink('mock_test', true)).toEqual({
      sentence: 'To take one, ',
      linkText: 'click here',
      href: '/mock-test',
    });
  });

  it('english_assessment sends a guest to the login trigger, and an authenticated user straight to /communication/start', () => {
    expect(getActionLink('english_assessment', false)).toEqual({
      sentence: 'To take the assessment, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fcommunication%2Fstart',
      requiresLogin: true,
    });
    expect(getActionLink('english_assessment', true)).toEqual({
      sentence: 'To take the assessment, ',
      linkText: 'click here',
      href: '/communication/start',
    });
  });

  it('job_search sends a guest to the login trigger, and an authenticated user straight to /jobslogin (the actual feed -- /jobs is just the marketing landing)', () => {
    expect(getActionLink('job_search', false)).toEqual({
      sentence: 'To browse and apply, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fjobslogin',
      requiresLogin: true,
    });
    expect(getActionLink('job_search', true)).toEqual({
      sentence: 'To browse and apply, ',
      linkText: 'click here',
      href: '/jobslogin',
    });
  });

  it('resume_parser sends a guest to the login trigger, and an authenticated user straight to /atslogin (the actual upload flow -- /ats is just the marketing landing)', () => {
    expect(getActionLink('resume_parser', false)).toEqual({
      sentence: 'To upload your resume, please log in -- ',
      linkText: 'click here',
      href: '/?showLogin=true&next=%2Fatslogin',
      requiresLogin: true,
    });
    expect(getActionLink('resume_parser', true)).toEqual({
      sentence: 'To upload your resume, ',
      linkText: 'click here',
      href: '/atslogin',
    });
  });

  it('resume_enhancer links to /atslogin/report -- the AI-suggestion capability has no standalone page, it lives inline on the ATS report page', () => {
    expect(getActionLink('resume_enhancer', true)).toEqual({
      sentence: 'To see AI suggestions, ',
      linkText: 'click here',
      href: '/atslogin/report',
    });
    expect(getActionLink('resume_enhancer', false)?.requiresLogin).toBe(true);
  });

  it('cover_letter links straight to /cover-letter for BOTH guest and authenticated users -- the page is fully public end-to-end, unlike every other feature above', () => {
    const expected = { sentence: 'To get started, ', linkText: 'click here', href: '/cover-letter' };
    expect(getActionLink('cover_letter', false)).toEqual(expected);
    expect(getActionLink('cover_letter', true)).toEqual(expected);
  });

  it('smart_match gets NO action link, for either auth state -- it has no dedicated page of its own, it is ranking logic embedded directly in the /jobslogin feed (confirmed by reading the actual page tree, not inferred)', () => {
    expect(getActionLink('smart_match', false)).toBeNull();
    expect(getActionLink('smart_match', true)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration: rendered link, correct href, and auth-state-dependent variant.
// ---------------------------------------------------------------------------

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
const getSupportTickets = vi.fn().mockResolvedValue({ data: [] });

vi.mock('@/api/chatbotApi', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
  escalateToSupport: vi.fn(),
  getSupportTickets: (...args: unknown[]) => getSupportTickets(...args),
  cancelTicket: vi.fn(),
  sendTicketOtp: vi.fn(),
  verifyTicketOtp: vi.fn(),
  createChatSession: vi.fn(),
  sendSessionMessage: vi.fn(),
  getChatSessionHistory: vi.fn(),
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

const sendMessage = async (text: string) => {
  const input = screen.getByPlaceholderText('Type your question...');
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });
};

const mockAnswer = (answer: string, category: string) => ({
  session_id: 'session',
  message: 'q',
  answer,
  category,
  authenticated: mockAuthenticated,
  requires_escalation: false,
  confidence: 0.9,
  timestamp: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  localStorage.clear();
  sendChatMessage.mockReset();
});

describe('Guest user -- action links', () => {
  beforeEach(() => {
    mockAuthenticated = false;
  });

  it('shows a plain inline "click here" hyperlink inside the answer text, pointing to /forgot-password -- not a separate button/block', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'),
    );
    await openWidget();
    await sendMessage('I forgot my password. How can I reset it?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/forgot-password');
    // A plain <a>, not next/link's <Link> -- Link does client-side "soft"
    // navigation, which would silently fail to open the sign-in modal for
    // requiresLogin links if the widget happens to already be open on "/"
    // itself (page.tsx's modal-opening effect is mount-only and doesn't
    // re-run on a query-string-only soft navigation). A plain <a> forces a
    // full navigation every time, so the modal reliably opens regardless
    // of which page the widget was open on.
    expect(link.tagName).toBe('A');

    // Inline within the same paragraph as the answer, not a separate block.
    const messageText = screen.getByText(/On the sign-in page, click 'Forgot Password\?'/).closest('.message-text');
    expect(messageText).not.toBeNull();
    expect(messageText).toContainElement(link);
    expect(messageText?.textContent).toContain('To reset your password,');

    // No leftover button-style wrapper/icon/arrow from an older design.
    expect(document.querySelector('.message-action-link')).toBeNull();
    expect(document.querySelector('.action-link-btn')).toBeNull();
  });

  it('shows a login-trigger inline link (not a direct /profile link) for profile questions', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Build your Profile with education, experience, skills...', 'profile_building'),
    );
    await openWidget();
    await sendMessage('How can I update my profile information?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/?showLogin=true&next=%2Fprofile');
    expect(link.tagName).toBe('A');

    const messageText = screen.getByText(/Build your Profile with education/).closest('.message-text');
    expect(messageText?.textContent).toContain('please log in');
  });

  it('shows no action link for topics with no real dedicated page', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Verification codes can take a minute or two...', 'otp_not_received'),
    );
    await openWidget();
    await sendMessage("I'm having trouble with OTP verification. Can you help?");

    await screen.findByText('Verification codes can take a minute or two...');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows no reset-password link for password-requirements answers (the answer never recommends resetting)', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer(
        'Your new password must meet the requirements shown on the form -- usually a minimum length plus upper/lowercase letters and a number or symbol.',
        'password_new_rejected',
      ),
    );
    await openWidget();
    await sendMessage('What are the password requirements?');

    await screen.findByText(/Your new password must meet the requirements/);
    expect(screen.queryByRole('link', { name: /Reset your password/i })).not.toBeInTheDocument();
  });

  it('shows no reset-password link for login-credential errors (explicitly excluded even though the KB text itself mentions Forgot Password)', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer(
        "Check you're using the exact registered email, that Caps Lock is off, and that your password is case-sensitive. Still rejected? Use 'Forgot Password?' to reset it.",
        'login_invalid_credentials',
      ),
    );
    await openWidget();
    await sendMessage('Why are my login credentials not being accepted?');

    await screen.findByText(/Still rejected/);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('related-question chips still send chat text, not navigation, alongside an action link', async () => {
    sendChatMessage
      .mockResolvedValueOnce(mockAnswer('Account is locked...', 'account_locked'))
      .mockResolvedValueOnce(mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'));

    await openWidget();
    await sendMessage('My account is locked. How can I unlock it?');

    // The action link is present...
    expect(await screen.findByRole('link', { name: 'click here' })).toHaveAttribute('href', '/forgot-password');
    // ...and the related-question suggestion is a BUTTON (not a link) that
    // sends another chat message rather than navigating.
    const relatedBtn = screen.getByText('🔑 How can I reset my password?');
    expect(relatedBtn.tagName).toBe('BUTTON');

    await act(async () => {
      fireEvent.click(relatedBtn);
    });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
    expect(sendChatMessage.mock.calls[1][0]).toBe('🔑 How can I reset my password?');
  });

  it('sends a guest to the login trigger (not straight to the page) for a protected feature like Resume Builder', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Use the Resume Builder to add contact info, experience, education, and skills...', 'resume_builder'),
    );
    await openWidget();
    await sendMessage('How can I create a resume using CareerBot?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/?showLogin=true&next=%2Fbuilder%2Fstart');
    const messageText = screen.getByText(/Use the Resume Builder/).closest('.message-text');
    expect(messageText?.textContent).toContain('please log in');
  });

  it('sends a guest to the login trigger for coding practice, even though /coding-test is actually public at the app level', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Practice coding problems and run them against real test cases for free, unlimited...', 'coding_test'),
    );
    await openWidget();
    await sendMessage('How can I practice coding problems using CareerBot?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/?showLogin=true&next=%2Fcoding-test');
    const messageText = screen.getByText(/Practice coding problems/).closest('.message-text');
    expect(messageText?.textContent).toContain('please log in');
  });
});

describe('renderMarkdownText -- inline [text](url) link href safety (security)', () => {
  // renderMarkdownText runs on backend-sourced text with no further
  // sanitization (the KB answer itself, restored session messages, raw
  // error.message) -- a [text](url) markdown link's href must never become
  // a script-executing or otherwise unsafe URL just because it round-tripped
  // through a chat answer. React does not block javascript: hrefs on its
  // own; it only logs a console warning and still renders the link.
  beforeEach(() => {
    mockAuthenticated = false;
  });

  it('does not render a javascript: URL as a live link -- shows the label as plain text instead', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("For help, [click here](javascript:alert(document.cookie)) to continue.", 'otp_not_received'),
    );
    await openWidget();
    await sendMessage('I need help');

    await screen.findByText(/For help,/);
    expect(screen.queryByRole('link', { name: 'click here' })).not.toBeInTheDocument();
    // The label text still shows -- just not as a clickable href.
    expect(screen.getByText(/to continue\./).closest('.message-text')?.textContent).toContain('click here');
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it('does not render a data: URL as a live link', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("See [this](data:text/html,<script>alert(1)</script>) for details.", 'otp_not_received'),
    );
    await openWidget();
    await sendMessage('I need help');

    await screen.findByText(/for details\./);
    expect(screen.queryByRole('link', { name: 'this' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="data:"]')).toBeNull();
  });

  it('still renders a safe https: URL as a live link, unaffected by the allowlist', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("Read our [policy](https://example.com/policy) for details.", 'otp_not_received'),
    );
    await openWidget();
    await sendMessage('I need help');

    const link = await screen.findByRole('link', { name: 'policy' });
    expect(link).toHaveAttribute('href', 'https://example.com/policy');
  });

  it('does not render a protocol-relative //host URL as a live link (it leaves the site)', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("Go [here](//evil.example/login) or [there](/\\evil.example) or [tab](/\t/evil.example) now.", 'otp_not_received'),
    );
    await openWidget();
    await sendMessage('I need help');

    await screen.findByText(/now\./);
    expect(screen.queryByRole('link', { name: 'here' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'there' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'tab' })).not.toBeInTheDocument();
  });

  it('still renders a relative path as a live link, unaffected by the allowlist', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("Visit [settings](/settings) to update this.", 'otp_not_received'),
    );
    await openWidget();
    await sendMessage('I need help');

    const link = await screen.findByRole('link', { name: 'settings' });
    expect(link).toHaveAttribute('href', '/settings');
  });
});

describe('Authenticated user -- action links', () => {
  beforeEach(() => {
    mockAuthenticated = true;
  });

  it('shows a real inline link pointing directly to /profile', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Build your Profile with education, experience, skills...', 'profile_building'),
    );
    await openWidget();
    await sendMessage('How can I update my profile information?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/profile');

    const messageText = screen.getByText(/Build your Profile with education/).closest('.message-text');
    expect(messageText?.textContent).not.toContain('please log in');
    expect(messageText?.textContent).toContain('To view or edit your profile,');
  });

  it('password-reset answers still link to /forgot-password (no dedicated change-password page exists)', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer("On the sign-in page, click 'Forgot Password?'...", 'forgot_password'),
    );
    await openWidget();
    await sendMessage('How can I change my current password?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('sends an authenticated user straight to /builder/start for Resume Builder -- no login prompt', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Use the Resume Builder to add contact info, experience, education, and skills...', 'resume_builder'),
    );
    await openWidget();
    await sendMessage('How can I create a resume using CareerBot?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/builder/start');
    const messageText = screen.getByText(/Use the Resume Builder/).closest('.message-text');
    expect(messageText?.textContent).not.toContain('please log in');
  });

  it('sends an authenticated user straight to /coding-test -- no login prompt (only guests get the chatbot-only sign-in requirement)', async () => {
    sendChatMessage.mockResolvedValueOnce(
      mockAnswer('Practice coding problems and run them against real test cases for free, unlimited...', 'coding_test'),
    );
    await openWidget();
    await sendMessage('How can I practice coding problems using CareerBot?');

    const link = await screen.findByRole('link', { name: 'click here' });
    expect(link).toHaveAttribute('href', '/coding-test');
    const messageText = screen.getByText(/Practice coding problems/).closest('.message-text');
    expect(messageText?.textContent).not.toContain('please log in');
  });
});

describe('action:login sign-in link', () => {
  it('sends the guest to sign in and back to the page they were on', async () => {
    const original = window.location;
    const fakeLocation = { pathname: '/jobs', search: '?q=react', href: 'http://localhost/jobs?q=react' };
    Object.defineProperty(window, 'location', { configurable: true, value: fakeLocation });
    try {
      render(<ChatApp />);
      await act(async () => {
        window.dispatchEvent(new CustomEvent('chatbot:action', { detail: { action: 'login' } }));
      });
      expect(fakeLocation.href).toBe('/?showLogin=true&next=%2Fjobs%3Fq%3Dreact');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });
});
