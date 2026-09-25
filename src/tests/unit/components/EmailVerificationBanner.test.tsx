/**
 * EmailVerificationBanner — careerbot-api now sends a 6-digit code, not a
 * link (endpoints/auth.py verify_email takes {user_id, otp}), and the
 * /verify-email link page was removed, so the banner must not tell users to
 * click a link.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/api/authApi', () => ({ resendVerificationEmail: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mock = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { default: mock, logger: mock };
});

import EmailVerificationBanner from '@/components/EmailVerificationBanner';

describe('EmailVerificationBanner', () => {
  it('describes a verification code, not a link', () => {
    render(<EmailVerificationBanner userEmail="user@example.com" />);
    expect(screen.queryByText(/link/i)).not.toBeInTheDocument();
    expect(screen.getByText(/verification code to it/i)).toBeInTheDocument();
  });
});
