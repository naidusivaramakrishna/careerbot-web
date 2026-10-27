// ai-review on #150 @ 6e4eb8e8: per-question pick state across operations and sections.
// P2: Clear was not frozen during the section-submit flush (select was), so a pick
//     being re-sent could be cleared and still score.
// P3: per-question refs survived across sections, and fallback ids
//     (question_id ?? idx + 1) collide between sections.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'sonner';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'custom-test' }),
  useSearchParams: () => new URLSearchParams('categories=arithmetic,reasoning&difficulty=easy&parentSessionId=parent-1'),
}));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), info: vi.fn(), warning: vi.fn(), success: vi.fn() }) }));
vi.mock('@/hooks/useAttemptRecorder', () => ({
  useAttemptRecorder: () => ({ isRecording: true, status: 'recording', fileExtension: 'webm', start: vi.fn(async () => {}), stop: vi.fn(async () => null) }),
}));
const api = vi.hoisted(() => ({
  getActiveSession: vi.fn(async () => null), submitAnswer: vi.fn(async (): Promise<null> => null),
  generateMockTest: vi.fn(async () => ({ session_id: 'child-1', sections: [{ section_id: 'sec-1' }, { section_id: 'sec-2' }] })),
  // No question_id: the runner falls back to idx + 1, so BOTH sections' first question is id "1".
  getSectionQuestions: vi.fn(async () => [{ question_text: '1 + 1 = ?', options: ['1', '2', '3', '4'] }]),
  submitSection: vi.fn(async () => {}), submitTest: vi.fn(), submitParentSession: vi.fn(async () => {}), uploadSessionVideo: vi.fn(async () => {}),
}));
vi.mock('@/api/mockTestApi', async (orig) => ({ ...(await orig<typeof import('@/api/mockTestApi')>()), ...api }));

import MockTestPage from '@/app/(interview)/mock-test/[id]/page';

const input = (label: string) => screen.getAllByLabelText(label).find(el => el.tagName === 'INPUT') as HTMLInputElement;
const clearBtn = () => screen.getByRole('button', { name: /^clear$/i });
const submitSectionBtn = () => screen.getAllByRole('button', { name: /submit (section|test)/i })[0];

describe('mock-test runner: pick state across operations and sections', { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let now = 1_000_000; // each Date.now() advances 10s: the per-pick 3s minimum is already met
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 10_000));
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('Clear is frozen while the section submit re-sends a failed pick (same guard as select)', async () => {
    let resolveResend!: () => void;
    api.submitAnswer.mockRejectedValueOnce(new Error('Network Error'))                       // the pick fails...
      .mockImplementationOnce(() => new Promise<null>(r => { resolveResend = () => r(null); })); // ...its re-send hangs
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    await screen.findAllByLabelText('Option B: 2');
    fireEvent.click(input('Option B: 2'));
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(1));
    await act(() => new Promise(r => setTimeout(r, 20)));
    fireEvent.click(submitSectionBtn());
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(2)); // the re-send is on the wire
    fireEvent.click(clearBtn());
    expect(input('Option B: 2').checked).toBe(true); // not cleared: it is being saved
    await act(async () => { resolveResend(); });
  });

  it("a saved pick in section 1 does not block Clear for section 2's question with the same fallback id", async () => {
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    await screen.findAllByLabelText('Option B: 2');
    fireEvent.click(input('Option B: 2'));                                // id "1", saved
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(1));
    await act(() => new Promise(r => setTimeout(r, 20)));
    fireEvent.click(submitSectionBtn());
    fireEvent.click(await screen.findByRole('button', { name: /start reasoning/i }));
    await screen.findAllByLabelText('Option C: 3');
    api.submitAnswer.mockRejectedValueOnce(new Error('Network Error'));   // section 2's pick never reaches the backend
    fireEvent.click(input('Option C: 3'));                                // ALSO id "1"
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(2));
    await act(() => new Promise(r => setTimeout(r, 20)));
    fireEvent.click(clearBtn());
    expect(toast.info).not.toHaveBeenCalledWith(expect.stringMatching(/already saved/i));
    expect(input('Option C: 3').checked).toBe(false);
  });

  it("control: section 2's own saved pick still blocks Clear", async () => {
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    await screen.findAllByLabelText('Option B: 2');
    fireEvent.click(input('Option B: 2'));
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(1));
    await act(() => new Promise(r => setTimeout(r, 20)));
    fireEvent.click(submitSectionBtn());
    fireEvent.click(await screen.findByRole('button', { name: /start reasoning/i }));
    await screen.findAllByLabelText('Option C: 3');
    fireEvent.click(input('Option C: 3'));
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(2)); // saved
    await act(() => new Promise(r => setTimeout(r, 20)));
    fireEvent.click(clearBtn());
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/already saved/i));
    expect(input('Option C: 3').checked).toBe(true);
  });
});
