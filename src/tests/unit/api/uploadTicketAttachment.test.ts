import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression test for a real bug: httpClient's underlying axios instance
 * sets a default 'Content-Type: application/json' header on every request
 * (src/lib/http.ts). That default wins over axios's automatic multipart
 * boundary detection unless explicitly overridden per-request, so a
 * FormData body sent without the override goes out mislabeled as JSON --
 * the backend fails to parse the file, the upload throws, and (by design)
 * ChatApp.tsx's Promise.allSettled silently drops the attachment. The
 * ticket still gets created successfully, just with no screenshot and no
 * visible error -- exactly what made this hard to notice from the UI.
 *
 * This test exercises the REAL uploadTicketAttachment implementation
 * (unlike the ChatApp.tsx tests, which mock the whole chatbotApi module
 * and would never have caught a bug inside this function itself).
 */

const post = vi.fn();
vi.mock('@/lib/http', () => ({
  httpClient: {
    post: (...args: unknown[]) => post(...args),
  },
}));

import { uploadTicketAttachment } from '@/api/chatbotApi';

beforeEach(() => {
  post.mockReset();
});

describe('uploadTicketAttachment', () => {
  it('sends the file as FormData and explicitly clears the inherited Content-Type header', async () => {
    post.mockResolvedValue({
      data: { success: true, attachment_id: 'abc123', filename: 'screenshot.png', content_type: 'image/png', size: 42 },
    });

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const result = await uploadTicketAttachment(file);

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/tickets/attachments/upload');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);

    // The actual bug: Content-Type must be explicitly undefined here so
    // axios/the browser can generate the multipart boundary itself,
    // overriding httpClient's instance-level 'application/json' default.
    expect((config as { headers: Record<string, unknown> }).headers['Content-Type']).toBeUndefined();
    expect('Content-Type' in (config as { headers: Record<string, unknown> }).headers).toBe(true);

    expect(result.attachment_id).toBe('abc123');
  });

  it('propagates a rejection when the upload fails, so callers can decide how to handle it', async () => {
    post.mockRejectedValue(new Error('Network Error'));
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    await expect(uploadTicketAttachment(file)).rejects.toThrow('Network Error');
  });
});
