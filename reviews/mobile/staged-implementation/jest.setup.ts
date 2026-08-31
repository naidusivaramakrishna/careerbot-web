// Jest setup: wire MSW server + silence noisy console in tests.

import { server } from '@/test/msw/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
