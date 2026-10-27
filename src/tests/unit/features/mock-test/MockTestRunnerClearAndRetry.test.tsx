// ai-review on #150 @ 4e0c285d: P2 "Clear" on a pick that is still sending; P2 the
// page's AI retry only matched one error shape.
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
const api = vi.hoisted(() => ({
  getActiveSession: vi.fn(async () => null), submitAnswer: vi.fn(async (): Promise<null> => null),
  generateMockTest: vi.fn(async () => ({ session_id: 'child-1', sections: [{ section_id: 'sec-1' }] })),
  getSectionQuestions: vi.fn(async () => [{ question_id: 'q1', question_text: '1 + 1 = ?', options: ['1', '2', '3', '4'] }]),
  submitSection: vi.fn(async () => {}), submitTest: vi.fn(), submitParentSession: vi.fn(async () => {}), uploadSessionVideo: vi.fn(async () => {}),
}));
vi.mock('@/api/mockTestApi', async (orig) => ({ ...(await orig<typeof import('@/api/mockTestApi')>()), ...api }));

import MockTestPage from '@/app/(interview)/mock-test/[id]/page';

const optionB = () => screen.getAllByLabelText('Option B: 2').find(el => el.tagName === 'INPUT') as HTMLInputElement;
async function startSection() {
  render(<MockTestPage />);
  fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
  await screen.findAllByLabelText('Option B: 2');
}

describe('mock-test runner: Clear on a pick that has not been saved yet', { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('a pick still waiting out the 3s minimum is never sent once cleared', async () => {
    // Pinned BEFORE the section starts, so the question's start time and the pick
    // share one clock: elapsed 0s -> the pick waits out exactly the real 3s minimum.
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    await startSection();
    fireEvent.click(optionB());
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    await act(() => new Promise(r => setTimeout(r, 3_500))); // past the 3s minimum
    expect(api.submitAnswer).not.toHaveBeenCalled();
    expect(optionB().checked).toBe(false);
  });

  it('control: the same pick without Clear is sent once', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    await startSection();
    fireEvent.click(optionB());
    await act(() => new Promise(r => setTimeout(r, 3_500))); // past the 3s minimum
    expect(api.submitAnswer).toHaveBeenCalledTimes(1);
  });

  it('a pick already on the wire is kept (it will be saved) and the candidate is told why', async () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 10_000)); // minimum already met
    let resolvePick!: () => void;
    api.submitAnswer.mockImplementationOnce(() => new Promise<null>(r => { resolvePick = () => r(null); }));
    await startSection();
    fireEvent.click(optionB());
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(1)); // request sent, response pending
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/being saved/i));
    expect(optionB().checked).toBe(true);
    await act(async () => { resolvePick(); });
  });

  it('Clear is refused once an EARLIER pick for the question is saved, even with a newer pick still queued', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000); // every pick waits out the real 3s minimum
    await startSection();
    fireEvent.click(optionB());
    await act(() => new Promise(r => setTimeout(r, 3_500))); // B is sent and saved
    expect(api.submitAnswer).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByLabelText('Option C: 3').find(el => el.tagName === 'INPUT')!); // C queued
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/already saved/i));
    expect((screen.getAllByLabelText('Option C: 3').find(el => el.tagName === 'INPUT') as HTMLInputElement).checked).toBe(true);
  });

  it('a failed pick that is cleared is not re-sent at section submit (sibling: flushPicks path)', async () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 10_000));
    api.submitAnswer.mockRejectedValueOnce(new Error('Network Error'));
    await startSection();
    fireEvent.click(optionB());
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument());
    await act(() => new Promise(r => setTimeout(r, 20))); // let the failure settle into the re-send queue
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(optionB().checked).toBe(false);
    fireEvent.click(optionB()); // re-answer so the section can be submitted...
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i })); // ...and clear that one too while it waits
    fireEvent.click(screen.getAllByLabelText('Option C: 3')[0]);
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(2));
    expect(api.submitAnswer.mock.calls.map(c => (c as unknown[])[2])).toEqual(['B', 'C']);
  });
});

describe('mock-test runner: AI_SERVICE_UNAVAILABLE retry recognises every envelope', { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  const reject503 = (data: unknown) => Object.assign(new Error('Request failed with status code 503'), { response: { status: 503, data } });

  it('retries when the specific code is in error.details.error and error_code is the generic HTTP_503', async () => {
    api.generateMockTest.mockRejectedValueOnce(reject503({ error: { error_code: 'HTTP_503', message: 'Service Unavailable', details: { error: 'AI_SERVICE_UNAVAILABLE' } } }));
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/AI service temporarily unavailable/)));
  });

  it('control: a 503 without AI_SERVICE_UNAVAILABLE anywhere is not retried', async () => {
    api.generateMockTest.mockRejectedValueOnce(reject503({ error: { error_code: 'HTTP_503', message: 'Service Unavailable' } }));
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.info).not.toHaveBeenCalledWith(expect.stringMatching(/AI service temporarily unavailable/));
  });
});
