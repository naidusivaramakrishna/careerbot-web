/**
 * VerificationRecovery — the banner shown after a reload when a signup was
 * left unverified. Clicking "Enter verification code" must expand the banner
 * into the OTP input (PR #90 description: "Expands inline to show
 * OTPVerificationInput").
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VerificationRecovery } from '@/components/VerificationRecovery';

const PENDING_KEY = 'pendingEmailVerification';

describe('VerificationRecovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the OTP input after clicking "Enter verification code"', async () => {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ userId: 'u1', email: 'a@b.co', pendingVerification: true, timestamp: Date.now() }),
    );
    render(<VerificationRecovery />);

    fireEvent.click(await screen.findByRole('button', { name: /Enter verification code/ }));

    expect(screen.getByTestId('otp-input-0')).toBeInTheDocument();
    expect(screen.getByTestId('verify-email-btn')).toBeInTheDocument();
  });

  it('renders nothing and clears the record when it is older than 24 hours', () => {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ userId: 'u1', email: 'a@b.co', pendingVerification: true, timestamp: Date.now() - 25 * 3600 * 1000 }),
    );
    const { container } = render(<VerificationRecovery />);
    expect(container).toBeEmptyDOMElement();
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('appears when another tab writes a record, and hides when it is removed there', async () => {
    render(<VerificationRecovery />);
    expect(screen.queryByText('Resume Email Verification')).not.toBeInTheDocument();

    const value = JSON.stringify({ userId: 'u1', email: 'a@b.co', pendingVerification: true, timestamp: Date.now() });
    localStorage.setItem(PENDING_KEY, value);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: PENDING_KEY, newValue: value }));
    });
    expect(await screen.findByText('Resume Email Verification')).toBeInTheDocument();

    localStorage.removeItem(PENDING_KEY);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: PENDING_KEY, newValue: null }));
    });
    expect(screen.queryByText('Resume Email Verification')).not.toBeInTheDocument();
  });
});
