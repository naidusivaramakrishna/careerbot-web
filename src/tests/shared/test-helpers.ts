import { vi } from 'vitest';

/**
 * Shared test helpers for integration tests
 */

/**
 * Simulate custom event dispatch for cross-tab communication
 */
export const simulateCreditsUpdate = (creditsRemaining: number) => {
  const event = new CustomEvent('credits-updated', {
    detail: { credits_remaining: creditsRemaining },
  });
  window.dispatchEvent(event);
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock localStorage for tests
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

/**
 * Mock BroadcastChannel for cross-tab tests
 */
export const mockBroadcastChannel = () => {
  const channels: Record<string, Set<(data: any) => void>> = {};

  return {
    create: vi.fn((channelName: string) => {
      if (!channels[channelName]) {
        channels[channelName] = new Set();
      }

      return {
        postMessage: vi.fn((data: any) => {
          channels[channelName].forEach((callback) => {
            setTimeout(() => callback(data), 0);
          });
        }),
        onmessage: null as ((event: any) => void) | null,
        close: vi.fn(),
        addEventListener: vi.fn((event: string, callback: (data: any) => void) => {
          if (event === 'message') {
            channels[channelName].add(callback);
          }
        }),
        removeEventListener: vi.fn(),
      };
    }),

    simulateMessage: (channelName: string, data: any) => {
      if (channels[channelName]) {
        channels[channelName].forEach((callback) => {
          callback({ data });
        });
      }
    },

    clear: () => {
      Object.keys(channels).forEach((key) => {
        channels[key].clear();
        delete channels[key];
      });
    },
  };
};

/**
 * Simulate user interaction: click
 */
export const simulateClick = (element: HTMLElement | null) => {
  if (element) {
    const event = new MouseEvent('click', { bubbles: true });
    element.dispatchEvent(event);
  }
};

/**
 * Simulate user interaction: form submission
 */
export const simulateFormSubmit = (form: HTMLFormElement | null) => {
  if (form) {
    const event = new Event('submit', { bubbles: true });
    form.dispatchEvent(event);
  }
};

/**
 * Simulate user interaction: input change
 */
export const simulateInputChange = (
  input: HTMLInputElement | null,
  value: string
) => {
  if (input) {
    input.value = value;
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
  }
};

/**
 * Wait for next tick (setTimeout)
 */
export const nextTick = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Wait for condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await nextTick();
  }
};

/**
 * Setup common test environment
 */
export const setupTestEnvironment = () => {
  const localStorage = mockLocalStorage();

  Object.defineProperty(window, 'localStorage', {
    value: localStorage,
    writable: true,
  });

  return { localStorage };
};

/**
 * Cleanup test environment
 */
export const cleanupTestEnvironment = () => {
  vi.clearAllMocks();
  localStorage.clear();
};
