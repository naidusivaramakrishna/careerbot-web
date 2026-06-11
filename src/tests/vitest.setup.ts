/**
 * Vitest setup file for UI testing.
 *
 * Configures:
 *   - @testing-library/jest-dom matchers
 *   - Mock globals (window, document, etc.)
 *   - Mock navigator.clipboard
 *   - Mock dynamic imports
 */

import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Clean up after each test — unmount React components, clear mocks.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Mock navigator.clipboard for copy-to-clipboard tests ─────────────────

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// ── Mock window.matchMedia for responsive design tests ───────────────────

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// ── Mock IntersectionObserver for lazy-load / scroll tests ──────────────

class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// ── Mock ResizeObserver for layout tests ──────────────────────────────

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal("ResizeObserver", MockResizeObserver);

// ── Suppress Next.js server-side warnings in test output ──────────────

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: useLayoutEffect") ||
        args[0].includes("Not implemented: HTMLFormElement.prototype.submit"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
