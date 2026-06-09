import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

/**
 * MSW Server Setup for Integration Tests
 *
 * This creates the MSW server that intercepts HTTP requests during tests.
 * It's started before all tests and cleaned up after each test.
 */

export const server = setupServer(...handlers);

/**
 * Setup MSW Server in Vitest
 * Call this in your vitest.setup.ts or beforeAll hook
 */
export const setupMSWServer = () => {
  // Start server before all tests
  server.listen({ onUnhandledRequest: 'error' });

  // Return cleanup function
  return () => {
    server.close();
  };
};

/**
 * Reset MSW Server between tests
 * Call this in your afterEach hook
 */
export const resetMSWServer = () => {
  server.resetHandlers();
};

/**
 * Add custom handler during test
 * Useful for test-specific API behavior
 */
export const useHandler = (handler: any) => {
  server.use(handler);
};

/**
 * Remove all handlers and use custom ones
 * Useful when you want complete control over API responses in a test
 */
export const replaceHandlers = (...handlers: any[]) => {
  server.resetHandlers(...handlers);
};
