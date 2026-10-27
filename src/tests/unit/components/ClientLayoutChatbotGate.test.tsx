import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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

vi.mock('@/components/chatbot/ChatbotWidget', () => ({
  default: () => <div data-testid="chatbot-widget-marker" />,
}));

beforeEach(() => {
  mockPathname = '/dashboard';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
});

// Imported after the mocks above so ClientLayout picks them up.
import ClientLayout from '@/app/ClientLayout';

// ClientLayout loads the widget with next/dynamic, so it appears a tick after
// render. Let that import settle before asserting absence; otherwise the
// "does not mount" checks pass even when the gate is broken.
async function settleLazyChatbot() {
  await act(async () => {
    await import('@/components/chatbot/ChatbotWidget');
  });
}

/**
 * ClientLayout is where the floating chatbot widget is actually mounted (or
 * not) for the whole app — isChatbotAllowedOnPage alone being correct isn't
 * enough if the layout stops calling it correctly. This locks in that the
 * widget marker is absent on exam-style routes and present elsewhere.
 */
describe('ClientLayout — chatbot widget mount gate', () => {
  it('does not mount the chatbot widget on a live mock-test attempt page', async () => {
    mockPathname = '/mock-test/abc123';
    render(<ClientLayout>{null}</ClientLayout>);
    await settleLazyChatbot();
    expect(screen.queryByTestId('chatbot-widget-marker')).not.toBeInTheDocument();
  });

  it('does not mount the chatbot widget on a live coding-test challenge page', async () => {
    mockPathname = '/coding-test/two-sum';
    render(<ClientLayout>{null}</ClientLayout>);
    await settleLazyChatbot();
    expect(screen.queryByTestId('chatbot-widget-marker')).not.toBeInTheDocument();
  });

  it('mounts the chatbot widget on an ordinary page', async () => {
    mockPathname = '/dashboard';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(await screen.findByTestId('chatbot-widget-marker')).toBeInTheDocument();
  });

  it('mounts the chatbot widget on mock-test pages that are not the live attempt', async () => {
    mockPathname = '/mock-test/results/1';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(await screen.findByTestId('chatbot-widget-marker')).toBeInTheDocument();
  });

  // usePathname reflects the current route on first render regardless of
  // how it was reached (client navigation, refresh, or a direct URL) -- a
  // fresh render with this pathname is exactly what a refresh/direct nav
  // looks like, so this one test covers both.
  it('does not mount the chatbot widget (launcher or greeting popup) on the guest support ticket portal, on a fresh render', () => {
    mockPathname = '/support/tickets/new';
    render(<ClientLayout>{null}</ClientLayout>);
    expect(screen.queryByTestId('chatbot-widget-marker')).not.toBeInTheDocument();
  });
});
