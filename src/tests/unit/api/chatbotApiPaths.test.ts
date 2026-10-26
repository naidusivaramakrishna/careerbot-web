import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Ids go into chatbot API paths as ONE encoded path segment: a '/' or '?'
 * in an id must not reach another endpoint, and '.'/'..' (which
 * encodeURIComponent leaves alone) are refused before any request.
 * Runs the REAL chatbotApi functions against a mocked httpClient.
 */

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
const patch = vi.fn();
vi.mock('@/lib/http', () => ({
  httpClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => del(...args),
    patch: (...args: unknown[]) => patch(...args),
    defaults: { baseURL: 'https://api.example.com/api/v1' },
  },
}));

import {
  getTicketDetails,
  getChatSession,
  sendSessionMessage,
  deleteChatSession,
  cancelTicket,
  getTicketAttachmentUrl,
} from '@/api/chatbotApi';

beforeEach(() => {
  for (const m of [get, post, del, patch]) m.mockReset().mockResolvedValue({ data: {} });
});

describe('chatbotApi -- ids are encoded as a single path segment', () => {
  it('a plain ticket id is used as is', async () => {
    await getTicketDetails('CB-00001');
    expect(get).toHaveBeenCalledWith('/tickets/CB-00001');
  });

  it('a ticket id with a slash or query cannot reach another endpoint', async () => {
    await getTicketDetails('CB-1/attachments?x=1');
    expect(get).toHaveBeenCalledWith('/tickets/CB-1%2Fattachments%3Fx%3D1');
  });

  it('dot-segment ids are refused before any request', async () => {
    await expect(getTicketDetails('..')).rejects.toThrow('Invalid id');
    await expect(getChatSession('.')).rejects.toThrow('Invalid id');
    await expect(cancelTicket('..')).rejects.toThrow();
    expect(get).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it('session endpoints encode the session id', async () => {
    await sendSessionMessage('a/b', 'hi');
    await getChatSession('a/b');
    await deleteChatSession('a/b');
    expect(post).toHaveBeenCalledWith('/chat/sessions/a%2Fb/messages', { content: 'hi' });
    expect(get).toHaveBeenCalledWith('/chat/sessions/a%2Fb');
    expect(del).toHaveBeenCalledWith('/chat/sessions/a%2Fb');
  });

  it('cancel and attachment URLs encode both ids', async () => {
    await cancelTicket('CB-1/x');
    expect(patch).toHaveBeenCalledWith('/tickets/CB-1%2Fx/status', { status: 'cancelled' });
    expect(getTicketAttachmentUrl('CB-00001', 'a/b')).toBe(
      'https://api.example.com/api/v1/tickets/CB-00001/attachments/a%2Fb',
    );
  });
});
