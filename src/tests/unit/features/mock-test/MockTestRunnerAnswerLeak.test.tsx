// PR #150, two P1 fixes on the mock-test runner.
//
// (1) "Skip & View Results" must cancel an in-flight section start. Clearing the
//     pending retry timeout was not enough: a generate/questions request already
//     on the wire still resolved and ran setQuestions/setPhase('section_testing'),
//     dragging a candidate who had already left back into the section.
//
// (2) The per-pick answer response is an answer key. POST /mock-test/{s}/answer
//     returns is_correct / correct_answer / model_answer / score, and PR #150 made
//     picks editable, so retaining that verdict mid-attempt lets a candidate pick
//     A, read the verdict, and switch. The live path now discards the body and
//     feedbackByQ is populated for REVIEW mode only. The test below pins the
//     review half (the behaviour that must KEEP working).
//
//     NOTE on coverage, stated plainly: there is no DOM assertion that can
//     distinguish the live half before/after this fix, because every UI consumer
//     of the verdict was ALREADY gated on isReviewMode (page.tsx:1763, 1770, 1780,
//     1802, 1817, 1825, 2119, 2122-2123, 2181). The fix removes the retained
//     React state, not a rendered element. The static guard at the bottom is what
//     actually prevents re-introduction.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const nav = vi.hoisted(() => ({ search: '' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: 'custom-test' }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('@/hooks/useAttemptRecorder', () => ({
  useAttemptRecorder: () => ({
    isRecording: true, status: 'recording', fileExtension: 'webm',
    start: vi.fn(async () => {}), stop: vi.fn(async () => null),
  }),
}));

const api = vi.hoisted(() => ({
  getActiveSession: vi.fn(async () => null),
  // A full verdict body, exactly as careerbot-api answers a live pick.
  submitAnswer: vi.fn(async () => ({
    saved: true, is_correct: false, score: 0, accuracy: 0, completeness: 0, clarity: 0,
    feedback: 'LEAK_FEEDBACK', explanation: 'LEAK_EXPLANATION',
    solution_steps: ['LEAK_STEP'], common_mistakes: ['LEAK_MISTAKE'],
    correct_answer: 'LEAK_CORRECT_ANSWER', model_answer: 'LEAK_MODEL_ANSWER',
  })),
  generateMockTest: vi.fn(async () => ({ session_id: 'child-1', sections: [{ section_id: 'sec-1' }] })),
  getSectionQuestions: vi.fn(async () => [
    { question_id: 'q1', question_text: '1 + 1 = ?', options: ['1', '2', '3', '4'] },
  ]),
  submitSection: vi.fn(async () => {}),
  submitTest: vi.fn(async () => {}),
  submitParentSession: vi.fn(async () => {}),
  uploadSessionVideo: vi.fn(async () => {}),
  getParentSessionResult: vi.fn(async () => ({
    questions: [{
      question_id: 'q1', question_text: '1 + 1 = ?', options: ['1', '2', '3', '4'],
      correct_answer: '2', user_answer: '3', is_correct: false,
      explanation: 'REVIEW_EXPLANATION', solution_steps: ['REVIEW_STEP'],
      common_mistakes: ['REVIEW_MISTAKE'], category: 'arithmetic', section_id: 'sec-1',
    }],
  })),
}));
vi.mock('@/api/mockTestApi', async (orig) => ({
  ...(await orig<typeof import('@/api/mockTestApi')>()), ...api,
}));

import MockTestPage from '@/app/(interview)/mock-test/[id]/page';

describe('mock-test runner: Skip cancels an in-flight start', { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.search = 'categories=arithmetic,reasoning&difficulty=easy&parentSessionId=parent-1';
    let now = 1_000_000; // each Date.now() advances 10s, clearing the per-pick 3s minimum
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 10_000));
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('a generate that resolves AFTER Skip must not move the candidate into the section', async () => {
    render(<MockTestPage />);

    // ── Finish section 1 so the Skip affordance exists (it needs sectionResults > 0)
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    fireEvent.click((await screen.findAllByLabelText('Option B: 2'))[0]);
    // 2-section test: section 1 is not the last, so page.tsx:2279 reads "Submit Section".
    fireEvent.click(screen.getAllByRole('button', { name: /submit section/i })[0]);

    // ── Now on the Reasoning intro, with "Skip & View Results" available
    const skip = await screen.findByRole('button', { name: /skip & view results/i });
    expect(api.getSectionQuestions).toHaveBeenCalledTimes(1);

    // ── Start Reasoning, but hold generate on the wire
    let releaseGenerate!: () => void;
    api.generateMockTest.mockImplementationOnce(
      () => new Promise(resolve => {
        releaseGenerate = () => resolve({ session_id: 'child-2', sections: [{ section_id: 'sec-2' }] });
      })
    );
    fireEvent.click(screen.getByRole('button', { name: /start reasoning/i }));
    await waitFor(() => expect(api.generateMockTest).toHaveBeenCalledTimes(2));

    // ── The candidate gives up and skips while that request is still in flight
    fireEvent.click(skip);
    await screen.findByRole('button', { name: /submit full test/i });

    // ── The late response lands. It must be dropped on the floor.
    await act(async () => { releaseGenerate(); await new Promise(r => setTimeout(r, 50)); });

    // Still on Review & Submit — not yanked back into Reasoning.
    expect(screen.getByRole('button', { name: /submit full test/i })).toBeInTheDocument();
    // And it stopped BEFORE the questions fetch, so no section was ever loaded.
    expect(api.getSectionQuestions).toHaveBeenCalledTimes(1);
  });
});

describe('mock-test runner: the verdict is a REVIEW-mode-only thing', { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let now = 1_000_000; // each Date.now() advances 10s, clearing the per-pick 3s minimum
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 10_000));
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('still populates feedbackByQ in review mode (the fix must not break reviewing)', async () => {
    nav.search = 'reviewParentSession=parent-1';
    render(<MockTestPage />);

    // The Solution button only renders under `isReviewMode && answerFeedback`
    // (page.tsx:2181) — its presence proves feedbackByQ was populated for review.
    // Generous timeout: this page is ~2.4k lines and the review loader has to
    // round-trip before the Solution control exists. The 1s findBy default made
    // this pass only when an earlier test in the file had already warmed the module.
    fireEvent.click(await screen.findByRole('button', { name: /^solution$/i }, { timeout: 20_000 }));
    expect(await screen.findByText('REVIEW_EXPLANATION')).toBeInTheDocument();
    expect(screen.getByText('REVIEW_STEP')).toBeInTheDocument();
    expect(screen.getByText('REVIEW_MISTAKE')).toBeInTheDocument();
  });

  it('never renders the live per-pick verdict during an active scored section', async () => {
    nav.search = 'categories=arithmetic&difficulty=easy&parentSessionId=parent-1';
    render(<MockTestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /start arithmetic/i }));
    fireEvent.click((await screen.findAllByLabelText('Option B: 2'))[0]);
    await waitFor(() => expect(api.submitAnswer).toHaveBeenCalledTimes(1));

    // The pick IS saved (the candidate's answer still reaches the backend)...
    expect(api.submitAnswer).toHaveBeenCalledWith('child-1', 'q1', 'B', expect.any(Number));
    // ...but nothing the response carried reaches the screen.
    for (const leak of ['LEAK_EXPLANATION', 'LEAK_CORRECT_ANSWER', 'LEAK_MODEL_ANSWER',
                        'LEAK_STEP', 'LEAK_MISTAKE', 'LEAK_FEEDBACK']) {
      expect(screen.queryByText(leak)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/^INCORRECT$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^CORRECT$/)).not.toBeInTheDocument();
  });

  it('static guard: the live pick path stores nothing from the answer response', () => {
    // This is the assertion that actually prevents re-introduction. The live
    // verdict leak is React state, not a rendered element, so no DOM query can
    // catch a regression here — see the NOTE at the top of this file.
    const src = readFileSync(
      path.resolve(__dirname, '../../../../app/(interview)/mock-test/[id]/page.tsx'),
      'utf8'
    );
    const setters = src.match(/setFeedbackByQ\(/g) ?? [];
    // Exactly two legitimate writers remain: the review-mode loader
    // (setFeedbackByQ(section.feedback)) and the per-section reset
    // (setFeedbackByQ({})). A third would mean the live verdict is being stored.
    expect(setters).toHaveLength(2);
    expect(src).toContain('setFeedbackByQ(section.feedback)');
    expect(src).toContain('setFeedbackByQ({})');
    // And the live submit must not bind the response to a variable at all.
    expect(src).not.toMatch(/const\s+feedback\s*=\s*await\s+send\(\)/);
  });
});
