import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const getCollegeBranding = vi.fn();
vi.mock('@/api/institutionPublicApi', () => ({
  getCollegeBranding: () => getCollegeBranding(),
}));

// The real modal is covered by AuthModalSignInOnly.test.tsx; here only the
// props this page passes to it matter.
const modalProps = vi.fn();
vi.mock('@/components/SignUpModal', () => ({
  default: (props: Record<string, unknown>) => {
    modalProps(props);
    return props.open ? <div data-testid="signin-modal" /> : null;
  },
}));

import { fireEvent } from '@testing-library/react';
import CollegeLoginPage from '@/app/institution/login/page';

beforeEach(() => getCollegeBranding.mockReset());

describe('the branded college login page', () => {
  it('says the college name back to the student', async () => {
    /** A student who types their college's address and lands on the consumer
     *  marketing page has no way to tell they are in the right place. */
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    render(<CollegeLoginPage />);
    await waitFor(() =>
      expect(screen.getByText('VIT University')).toBeInTheDocument());
  });

  it('falls back to the product when the address is not a college', async () => {
    getCollegeBranding.mockResolvedValue(null);
    render(<CollegeLoginPage />);
    await waitFor(() =>
      expect(screen.getByText('CareerBOT')).toBeInTheDocument());
  });

  it('still renders when the branding lookup fails', async () => {
    /** A branding lookup that fails must not stop somebody signing in. */
    getCollegeBranding.mockResolvedValue(null);
    render(<CollegeLoginPage />);
    // The BUTTON, not any text matching /sign in/ -- the caption says "Sign
    // in to continue" too, and a matcher that hits both passes whether or not
    // the thing a person clicks is actually there.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in/i }))
        .toBeInTheDocument());
  });

  it('offers NO create-account path', async () => {
    /**
     * A college's students are on its roster before they ever sign in.
     * Self-registration would let anybody who guessed the address create an
     * account that looks like it belongs to the college.
     */
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    render(<CollegeLoginPage />);
    await waitFor(() => screen.getByText('VIT University'));
    expect(screen.queryByText(/create an account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sign up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
  });

  it('points a student without an account at their placement officer', async () => {
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    render(<CollegeLoginPage />);
    await waitFor(() =>
      expect(screen.getByText(/placement officer/i)).toBeInTheDocument());
  });

  it('offers the invite-code route', async () => {
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    render(<CollegeLoginPage />);
    await waitFor(() =>
      expect(screen.getByText(/I have an invite code/i)).toBeInTheDocument());
  });

  it('shows nothing about the college beyond its name', async () => {
    /** The subdomain is a string anybody can type. Anything shown here is
     *  shown to somebody who may not belong to the college at all. */
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    const { container } = render(<CollegeLoginPage />);
    await waitFor(() => screen.getByText('VIT University'));
    const text = container.textContent?.toLowerCase() ?? '';
    for (const leak of ['subscription', 'trial', 'students', 'paid', 'expired']) {
      expect(text).not.toContain(leak);
    }
  });
});

describe('the college sign-in opens on this page, sign-in only', () => {
  beforeEach(() => modalProps.mockReset());

  it('Sign in opens the modal here (no trip to the consumer home page)', async () => {
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    render(<CollegeLoginPage />);
    await waitFor(() => screen.getByText('VIT University'));
    expect(screen.queryByTestId('signin-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByTestId('signin-modal')).toBeInTheDocument();
    const last = modalProps.mock.calls.at(-1)?.[0];
    expect(last).toMatchObject({ open: true, signInOnly: true, initialFormType: 'signin', redirectTo: '/institution' });
  });

  it('the page has no link to the consumer sign-in', async () => {
    getCollegeBranding.mockResolvedValue({ id: 'vit', name: 'VIT University' });
    const { container } = render(<CollegeLoginPage />);
    await waitFor(() => screen.getByText('VIT University'));
    expect(container.querySelector('a[href*="showLogin"]')).toBeNull();
  });
});
