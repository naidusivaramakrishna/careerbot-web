// ai-review #138 P0/P2: careerbot-api's section-submit body (SubmitTestRequest, extra='forbid') 422s on
// `answers`, so "Submit Full Test" must not send them and must reach the parent submit; P1: every pick is saved first.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'sonner';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'custom-test' }),
  useSearchParams: () => new URLSearchParams('categories=arithmetic&difficulty=easy&parentSessionId=parent-1'),
}));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn(), warning: vi.fn(), success: vi.fn() }) }));
vi.mock('@/hooks/useAttemptRecorder', () => ({
  useAttemptRecorder: () => ({ isRecording: true, status: 'recording', fileExtension: 'webm', start: vi.fn(async () => {}), stop: vi.fn(async () => null) }),
}));
// Default implementations survive vi.restoreAllMocks (vitest restores a vi.fn(impl) to impl).
const api = vi.hoisted(() => ({
  getActiveSession: vi.fn(async () => null), submitAnswer: vi.fn(async (): Promise<null> => null),
  generateMockTest: vi.fn(async () => ({ session_id: 'child-1', sections: [{ section_id: 'sec-1' }] })),
  getSectionQuestions: vi.fn(async () => [{ question_id: 'q1', question_text: '1 + 1 = ?', options: ['1', '2', '3', '4'] }]),
  // Mirrors careerbot-api develop2: a section-submit body carrying `answers` is a 422.
  submitSection: vi.fn(async (_s: string, _sec: string, answers?: unknown) => {
    if (answers !== undefined) throw Object.assign(new Error('Request failed with status code 422'), { response: { status: 422 } });
  }),
  submitTest: vi.fn(), submitParentSession: vi.fn(async () => {}), uploadSessionVideo: vi.fn(async () => {}),
}));
vi.mock('@/api/mockTestApi', async (orig) => ({ ...(await orig<typeof import('@/api/mockTestApi')>()), ...api }));

import MockTestPage from '@/app/(interview)/mock-test/[id]/page';

/** Starts the one-question custom section, picks "2" and submits the section. */
async function submitSection() {
  render(<MockTestPage />);
  fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
  fireEvent.click((await screen.findAllByLabelText('Option B: 2'))[0]);
  fireEvent.click(screen.getAllByRole('button', { name: /submit test/i })[0]); // header + in-flow: same handler
}
const submitFullTest = () => screen.findByRole('button', { name: /submit full test/i });

describe('mock-test runner final submit', { timeout: 30_000 }, () => { // full page render: > 5s default
  beforeEach(() => {
    vi.clearAllMocks();
    let now = 1_000_000; // each Date.now() advances 10s, so the per-pick 3s minimum is already met
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 10_000));
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('waits for in-flight and re-sent picks before leaving the section, then submits the parent without `answers`', async () => {
    let resolvePick!: () => void;
    api.submitAnswer.mockRejectedValueOnce(new Error('Network Error'))
      .mockImplementationOnce(() => new Promise<null>(resolve => { resolvePick = () => resolve(null); }));
    await submitSection();
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(2)); // the pick failed; its re-send hangs
    fireEvent.click(screen.getAllByLabelText('Option C: 3')[0]); // picks are frozen while the section submits
    await act(() => new Promise(r => setTimeout(r, 50))); // give the section submit every chance to run ahead
    expect(api.submitAnswer).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: /submit full test/i })).not.toBeInTheDocument();
    await act(async () => { resolvePick(); });
    fireEvent.click(await submitFullTest());
    await waitFor(() => expect(api.submitParentSession).toHaveBeenCalledWith('parent-1'));
    expect(screen.queryByText(/could not submit/i)).not.toBeInTheDocument();
    api.submitSection.mock.calls.forEach(call => expect(call[2]).toBeUndefined());
  });

  it('re-sends a failed pick at section submit and stays on the section until it is saved', async () => { // ai-review P1
    api.submitAnswer.mockRejectedValueOnce(new Error('Network Error')).mockRejectedValueOnce(new Error('Network Error'));
    await submitSection(); // the pick fails, then its re-send fails
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/could not be saved/)));
    expect(screen.queryByRole('button', { name: /submit full test/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /submit test/i })[0]); // the next re-send succeeds
    fireEvent.click(await submitFullTest());
    await waitFor(() => expect(api.submitParentSession).toHaveBeenCalledWith('parent-1'));
    expect(api.submitAnswer).toHaveBeenCalledTimes(3);
  });
});
