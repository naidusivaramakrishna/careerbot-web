import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// ==================== MSW Integration Testing Setup ====================
let server: ReturnType<typeof import('msw/node').setupServer> | undefined;

try {
  // Only load MSW if integration tests are running
  // (To avoid issues with unit tests if MSW is not always needed)
  const { setupServer } = require('msw/node');
  const { handlers } = require('./src/tests/integration/shared/msw-handlers');

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
  server = null;
}

// ==================== Common Test Setup ====================

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  try {
    cleanup();
  } catch (e) {
    // Cleanup may fail if component not mounted - that's OK
  }
});

// Mock navigator.clipboard for copy-to-clipboard tests
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
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
  default: (props: any) => {
    const React = require('react');
    return React.createElement('img', props);
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => {
    const React = require('react');
    return React.createElement('a', { href }, children);
  },
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

// Mock IntersectionObserver for lazy-load / scroll tests
class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock ResizeObserver for layout tests
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Suppress Next.js server-side warnings in test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
