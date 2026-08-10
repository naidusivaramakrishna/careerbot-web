/**
 * Fetch-based SSE client for the code execution stream endpoint.
 *
 * Uses fetch + ReadableStream instead of native EventSource so we can send
 * credentials (httpOnly cookies) and the X-Tenant-Id header, which EventSource
 * does not support.
 */
import { getTenantId } from '@/lib/tenantStorage';

export type SseEvent =
  | { type: 'status'; status: string }
  | { type: 'stdout'; line: string }
  | { type: 'stderr'; line: string }
  | { type: 'done'; status: string; exit_code: number | null; wall_time_ms: number | null }
  | { type: 'error'; error: string };

export async function* streamSse(
  url: string,
  signal?: AbortSignal,
): AsyncGenerator<SseEvent> {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  };
  const tenantId = getTenantId();
  if (tenantId) headers['X-Tenant-Id'] = tenantId;

  let response: Response;
  try {
    response = await fetch(url, { credentials: 'include', headers, signal });
  } catch {
    yield { type: 'error', error: 'Could not connect to execution stream.' };
    return;
  }

  if (!response.ok) {
    yield { type: 'error', error: `Stream request failed (${response.status}).` };
    return;
  }

  if (!response.body) {
    yield { type: 'error', error: 'No response body from execution stream.' };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Normalize CRLF to LF
      buffer = buffer.replace(/\r\n/g, '\n');

      // SSE events are separated by \n\n
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const event = parseSseBlock(part.trim());
        if (event) yield event;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

function parseSseBlock(block: string): SseEvent | null {
  if (!block) return null;

  let eventType = '';
  let data = '';

  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) eventType = line.slice(7).trim();
    else if (line.startsWith('data:')) {
      const rest = line.slice(5).replace(/^ /, '');
      data = data ? `${data}\n${rest}` : rest;
    }
  }

  if (!data) return null;

  switch (eventType) {
    case 'status': {
      const parsed = tryJson(data);
      return { type: 'status', status: String(parsed?.status ?? data) };
    }
    case 'stderr':
      return { type: 'stderr', line: data };
    case 'done': {
      const parsed = tryJson(data);
      return {
        type: 'done',
        status: String(parsed?.status ?? 'completed'),
        exit_code: typeof parsed?.exit_code === 'number' ? parsed.exit_code : null,
        wall_time_ms: typeof parsed?.wall_time_ms === 'number' ? parsed.wall_time_ms : null,
      };
    }
    case 'error': {
      const parsed = tryJson(data);
      return { type: 'error', error: String(parsed?.error ?? data) };
    }
    default:
      return { type: 'stdout', line: data };
  }
}

function tryJson(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s) as Record<string, unknown>; } catch { return null; }
}
