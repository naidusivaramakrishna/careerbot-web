import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ──────────────────────────────────────────────────────────────────
// ClientLayout pulls in token refresh, tenant context, toasts, and the real
// chatbot widget — none of that is what this test is about. Only usePathname
// (which drives isChatbotAllowedOnPage) and a stand-in for ChatbotWidget
// matter here.

let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/hooks/useTokenRefresh', () => ({
  useTokenRefresh: () => {},
}));

vi.mock('@/contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@/components/VerificationRecovery', () => ({
  VerificationRecovery: () => null,
}));

vi.mock('@/components/chatbot', () => ({
  ChatbotWidget: () => <div data-testid="chatbot-widget-marker" />,
}));

beforeEach(() => {
  mockPathname = '/dashboard';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
});

// Imported after the mocks above so ClientLayout picks them up.
import ClientLayout from '@/app/ClientLayout';

/**
 * ClientLayout is where the floating chatbot widget is actually mounted (or
 * not) for the whole app — isChatbotAllowedOnPage alone being correct isn't
 * enough if the layout stops calling it correctly. This locks in that the
 * widget marker is absent on exam-style routes and present elsewhere.
 */
describe('ClientLayout — chatbot widget mount gate', () => {
  it('does not mount the chatbot widget on a live mock-test attempt page', () => {
    mockPathname = '/mock-test/abc123';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(screen.queryByTestId('chatbot-widget-marker')).not.toBeInTheDocument();
  });

  it('does not mount the chatbot widget on a live coding-test challenge page', () => {
    mockPathname = '/coding-test/two-sum';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(screen.queryByTestId('chatbot-widget-marker')).not.toBeInTheDocument();
  });

  it('mounts the chatbot widget on an ordinary page', () => {
    mockPathname = '/dashboard';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(screen.getByTestId('chatbot-widget-marker')).toBeInTheDocument();
  });

  it('mounts the chatbot widget on mock-test pages that are not the live attempt', () => {
    mockPathname = '/mock-test/results/1';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(screen.getByTestId('chatbot-widget-marker')).toBeInTheDocument();
  });
});
