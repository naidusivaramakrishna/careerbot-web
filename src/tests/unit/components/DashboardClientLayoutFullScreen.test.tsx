import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The dashboard's ClientLayout wraps every /dashboard/* page in
 * Sidebar + Header + Footer chrome -- except /dashboard/support-history,
 * which is the chatbot's own full-screen History destination and must
 * render with no chrome around it at all (not just visually hidden).
 */

let mockPathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/components/layout/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('@/app/Footer/page', () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock('@/contexts/DashboardContext', () => ({
  DashboardProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ClientLayout from '@/app/(user)/dashboard/ClientLayout';

describe('Dashboard ClientLayout -- full-screen routes', () => {
  it('renders Sidebar/Header/Footer chrome on an ordinary dashboard page', () => {
    mockPathname = '/dashboard';
    render(<ClientLayout><div>page content</div></ClientLayout>);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders no chrome at all on /dashboard/support-history -- just the page content', () => {
    mockPathname = '/dashboard/support-history';
    render(<ClientLayout><div>support center content</div></ClientLayout>);

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    expect(screen.getByText('support center content')).toBeInTheDocument();
  });
});
