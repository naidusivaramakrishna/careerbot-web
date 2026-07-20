import '@testing-library/jest-dom';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// ==================== MSW Integration Testing Setup ====================
let server: ReturnType<typeof import('msw/node').setupServer> | undefined;

try {
  // Only load MSW if integration tests are running
  // (To avoid issues with unit tests if MSW is not always needed)
  const { setupServer } = await import('msw/node');
  const { handlers } = await import('./src/tests/integration/shared/msw-handlers');

  server = setupServer(...handlers);

  beforeAll(() => {
    server!.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server!.resetHandlers();
  });

  afterAll(() => {
    server!.close();
  });
} catch {
  // MSW not available - this is OK for unit tests only
}

// ==================== Common Test Setup ====================

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  useParams: () => ({}),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement('img', props as React.ImgHTMLAttributes<HTMLImageElement>),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

// Mock sonner toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console errors and warnings in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
