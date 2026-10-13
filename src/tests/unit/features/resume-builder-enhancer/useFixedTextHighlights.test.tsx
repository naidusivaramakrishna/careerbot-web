/**
 * The green highlight must survive anything that is not a real Undo. The
 * suggestions list is rebuilt from server snapshots whenever another fix lands,
 * and a fixed card can read as pending (or lose its status) for a render before
 * it is marked fixed again. That used to be treated as an Undo: the card's
 * "before" was reset to include its own text, so the highlight never came back.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFixedTextHighlights, resetFixedTextBaselines } from '@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights';
import type { EnhancedSuggestion } from '@/types/api.types';

const sug = (id: string, section: string, status?: 'pending' | 'fixed') =>
  ({ id, section, message: 'x', fix_type: 'manual', ...(status ? { status } : {}) }) as EnhancedSuggestion;
const never = () => false;

const BEFORE = { personalInfo: { location: '' }, skills: ['React'], professionalSummary: { summary: '' } };
const AFTER_AB = { personalInfo: { location: 'Hyderabad' }, skills: ['React', 'Docker'], professionalSummary: { summary: '' } };
const AFTER_LOCATION = { ...BEFORE, personalInfo: { location: 'Hyderabad' } };
const AFTER_C = { ...AFTER_AB, professionalSummary: { summary: 'Aspiring ML engineer with Python.' } };

type Props = { data: unknown; s: EnhancedSuggestion[] };
const mount = (data: unknown, s: EnhancedSuggestion[]) =>
  renderHook((p: Props) => useFixedTextHighlights('r1', p.data, p.s, never), { initialProps: { data, s } });
const texts = (units: { text: string }[]) => units.map((u) => u.text).sort();

beforeEach(() => resetFixedTextBaselines());

describe('useFixedTextHighlights', () => {
  it('highlights what a fix added', () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending'), sug('k', 'Keywords', 'pending')]);
    hook.rerender({ data: AFTER_AB, s: [sug('c', 'Contact', 'fixed'), sug('k', 'Keywords', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Docker', 'Hyderabad']);
  });

  it('keeps earlier highlights when a later fix is applied', () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending'), sug('k', 'Keywords', 'pending'), sug('s', 'Summary', 'pending')]);
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed'), sug('k', 'Keywords', 'fixed'), sug('s', 'Summary', 'pending')] });
    hook.rerender({ data: AFTER_C, s: [sug('c', 'Contact', 'fixed'), sug('k', 'Keywords', 'fixed'), sug('s', 'Summary', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Aspiring ML engineer with Python.', 'Docker', 'Hyderabad']);
  });

  it.each([
    ['pending', 'pending' as const],
    ['missing status', undefined],
  ])('keeps the highlight when a fixed card reads as %s for a render while its text is still there', (_label, status) => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });
    expect(texts(hook.result.current)).toEqual(['Hyderabad']);

    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', status)] });
    expect(hook.result.current).toEqual([]);

    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });
    expect(texts(hook.result.current)).toEqual(['Hyderabad']);
  });

  it('keeps earlier highlights when the whole list reopens for a render during a later fix', () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending'), sug('k', 'Keywords', 'pending'), sug('s', 'Summary', 'pending')]);
    hook.rerender({ data: AFTER_AB, s: [sug('c', 'Contact', 'fixed'), sug('k', 'Keywords', 'fixed'), sug('s', 'Summary', 'pending')] });
    hook.rerender({ data: AFTER_C, s: [sug('c', 'Contact'), sug('k', 'Keywords'), sug('s', 'Summary', 'fixed')] });
    hook.rerender({ data: AFTER_C, s: [sug('c', 'Contact', 'fixed'), sug('k', 'Keywords', 'fixed'), sug('s', 'Summary', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Aspiring ML engineer with Python.', 'Docker', 'Hyderabad']);
  });

  it('clears on a real Undo and highlights again when the fix is re-applied', () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });
    expect(texts(hook.result.current)).toEqual(['Hyderabad']);

    // Undo: the data is reverted and the card reopens together.
    hook.rerender({ data: BEFORE, s: [sug('c', 'Contact', 'pending')] });
    expect(hook.result.current).toEqual([]);

    hook.rerender({ data: { ...BEFORE, personalInfo: { location: 'Vijayawada' } }, s: [sug('c', 'Contact', 'fixed')] });
    expect(texts(hook.result.current)).toEqual(['Vijayawada']);
  });

  it('stores and keeps the new text after a fixed card is reopened, removed, and re-applied', () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'pending')] });
    hook.rerender({ data: BEFORE, s: [sug('c', 'Contact', 'pending')] });
    const reapplied = { ...BEFORE, personalInfo: { location: 'Vijayawada' } };
    hook.rerender({ data: reapplied, s: [sug('c', 'Contact', 'fixed')] });
    hook.rerender({ data: reapplied, s: [sug('c', 'Contact', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Vijayawada']);
    expect(window.localStorage.getItem('ats-fixed-text:r1')).toContain('Vijayawada');
  });

  it('highlights a re-applied fix even when an Undo left its text in the data', () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });
    // The server reopened the card but the text is still in the resume.
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'pending')] });
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Hyderabad']);
  });

  describe('text the user types after a fix is never painted as that fix', () => {
    // The test setup's localStorage mock is not enumerable, so resetFixedTextBaselines cannot clear it.
    beforeEach(() => window.localStorage.clear());
    const WITH_DOCKER = { ...BEFORE, skills: ['React', 'Docker'] };
    const TYPED = { ...BEFORE, skills: ['React', 'Docker', 'Kubernetes'] };
    const fixKeywords = () => {
      const hook = mount(BEFORE, [sug('k', 'Keywords', 'pending')]);
      hook.rerender({ data: WITH_DOCKER, s: [sug('k', 'Keywords', 'fixed')] });
      hook.rerender({ data: WITH_DOCKER, s: [sug('k', 'Keywords', 'fixed')] });
      hook.rerender({ data: TYPED, s: [sug('k', 'Keywords', 'fixed')] });
      return hook;
    };

    it('while the card stays fixed', () => {
      expect(texts(fixKeywords().result.current)).toEqual(['Docker']);
    });

    it.each([
      ['pending', 'pending' as const],
      ['missing status', undefined],
    ])('after the card reads as %s for one render and is fixed again', (_label, status) => {
      const hook = fixKeywords();
      hook.rerender({ data: TYPED, s: [sug('k', 'Keywords', status)] });
      hook.rerender({ data: TYPED, s: [sug('k', 'Keywords', 'fixed')] });

      expect(texts(hook.result.current)).toEqual(['Docker']);
      expect(window.localStorage.getItem('ats-fixed-text:r1')).not.toContain('Kubernetes');
    });

    // "'Docker' is listed but not demonstrated": deleting the skill fixes the card and adds nothing.
    const REMOVED = { ...BEFORE, skills: [] as string[] };
    const removeDocker = () => {
      const hook = mount(WITH_DOCKER, [sug('k', 'Skills', 'pending')]);
      hook.rerender({ data: REMOVED, s: [sug('k', 'Skills', 'fixed')] });
      hook.rerender({ data: REMOVED, s: [sug('k', 'Skills', 'fixed')] });
      return hook;
    };

    it('after a fix that only removed text', () => {
      const hook = removeDocker();
      hook.rerender({ data: { ...REMOVED, skills: ['Kubernetes'] }, s: [sug('k', 'Skills', 'fixed')] });
      hook.rerender({ data: { ...REMOVED, skills: ['Kubernetes'] }, s: [sug('k', 'Skills', 'fixed')] });

      expect(hook.result.current).toEqual([]);
      expect(window.localStorage.getItem('ats-fixed-text:r1')).toBeNull();
    });

    it('highlights a later fix that adds text once a removal-only fix was undone', () => {
      const hook = removeDocker();
      hook.rerender({ data: WITH_DOCKER, s: [sug('k', 'Skills', 'pending')] }); // Undo: Docker is back
      hook.rerender({ data: { ...WITH_DOCKER, skills: ['React', 'Docker', 'Go'] }, s: [sug('k', 'Skills', 'fixed')] });

      expect(texts(hook.result.current)).toEqual(['Go']);
    });

    it('still highlights a fix whose data lands a render late after the user deleted text while it was pending', () => {
      const hook = mount({ ...BEFORE, skills: ['React', 'Java'] }, [sug('k', 'Keywords', 'pending')]);
      hook.rerender({ data: BEFORE, s: [sug('k', 'Keywords', 'pending')] }); // user deletes Java
      hook.rerender({ data: BEFORE, s: [sug('k', 'Keywords', 'fixed')] }); // fixed before its data
      hook.rerender({ data: WITH_DOCKER, s: [sug('k', 'Keywords', 'fixed')] });
      hook.rerender({ data: WITH_DOCKER, s: [sug('k', 'Keywords', 'fixed')] });

      expect(texts(hook.result.current)).toEqual(['Docker']);
    });

    it('treats only the removed text coming back as the Undo of a removal-only fix', () => {
      const hook = mount({ ...WITH_DOCKER, skills: ['React', 'Docker', 'Java'] }, [sug('k', 'Skills', 'pending')]);
      hook.rerender({ data: { ...BEFORE, skills: ['React', 'Java'] }, s: [sug('k', 'Skills', 'fixed')] }); // Docker removed
      hook.rerender({ data: BEFORE, s: [sug('k', 'Skills', 'fixed')] }); // user deletes Java
      hook.rerender({ data: WITH_DOCKER, s: [sug('k', 'Skills', 'pending')] }); // Undo: Docker is back
      hook.rerender({ data: { ...WITH_DOCKER, skills: ['React', 'Docker', 'Go'] }, s: [sug('k', 'Skills', 'fixed')] });

      expect(texts(hook.result.current)).toEqual(['Go']);
    });
  });
});

describe('useFixedTextHighlights after a page reload', () => {
  const FIXED = [sug('c', 'Contact', 'fixed')];
  const reload = () => resetFixedTextBaselines({ keepStored: true });

  it('still highlights what an earlier fix added once the page is reloaded', () => {
    const first = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    first.rerender({ data: AFTER_LOCATION, s: FIXED });
    expect(texts(first.result.current)).toEqual(['Hyderabad']);
    first.unmount();

    reload(); // new page load: nothing in memory, the card already comes back fixed
    const second = mount(AFTER_LOCATION, FIXED);

    expect(texts(second.result.current)).toEqual(['Hyderabad']);
  });

  it('restores every earlier fix, including several at once', () => {
    const open = [sug('c', 'Contact', 'pending'), sug('k', 'Keywords', 'pending')];
    const done = [sug('c', 'Contact', 'fixed'), sug('k', 'Keywords', 'fixed')];
    const first = mount(BEFORE, open);
    first.rerender({ data: AFTER_AB, s: done });
    first.unmount();

    reload();
    const second = mount(AFTER_AB, done);

    expect(texts(second.result.current)).toEqual(['Docker', 'Hyderabad']);
  });

  it('forgets the stored text when the fix is really undone', () => {
    const first = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    first.rerender({ data: AFTER_LOCATION, s: FIXED });
    first.rerender({ data: BEFORE, s: [sug('c', 'Contact', 'pending')] }); // Undo reverts the data
    first.unmount();

    reload();
    // The same card later comes back fixed with different text; the old text must not return.
    const second = mount({ ...BEFORE, personalInfo: { location: 'Pune' } }, FIXED);

    expect(texts(second.result.current)).toEqual([]);
  });

  it('keeps the stored text when a card only reads pending for a moment', () => {
    const first = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    first.rerender({ data: AFTER_LOCATION, s: FIXED });
    first.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'pending')] });
    first.unmount();

    reload();
    const second = mount(AFTER_LOCATION, FIXED);

    expect(texts(second.result.current)).toEqual(['Hyderabad']);
  });

  it('does not highlight text that has since been removed from the resume', () => {
    const first = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    first.rerender({ data: AFTER_LOCATION, s: FIXED });
    first.unmount();

    reload();
    const second = mount({ ...BEFORE, personalInfo: { location: 'Pune' } }, FIXED);

    expect(texts(second.result.current)).toEqual([]);
  });

  it('keeps each resume separate', () => {
    const first = renderHook((p: Props) => useFixedTextHighlights('resume-a', p.data, p.s, never), {
      initialProps: { data: BEFORE as unknown, s: [sug('c', 'Contact', 'pending')] },
    });
    first.rerender({ data: AFTER_LOCATION, s: FIXED });
    first.unmount();

    reload();
    const other = renderHook(() => useFixedTextHighlights('resume-b', AFTER_LOCATION, FIXED, never));

    expect(other.result.current).toEqual([]);
  });

  it('ignores corrupt stored data and a fix that added nothing', () => {
    window.localStorage.setItem('ats-fixed-text:r1', '{not json');
    const first = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    first.rerender({ data: BEFORE, s: FIXED }); // marked fixed, but no new text
    first.unmount();

    reload();
    const second = mount(BEFORE, FIXED);

    expect(second.result.current).toEqual([]);
    expect(window.localStorage.getItem('ats-fixed-text:r1')).not.toContain('Hyderabad');
  });

  it('does not paint the whole resume when the first fix lands on a resume that was still empty at mount', () => {
    // The ATS report mounts the preview before the resume has loaded.
    const hook = renderHook(
      (p: Props & { ready: boolean }) => useFixedTextHighlights('r1', p.data, p.s, never, p.ready),
      { initialProps: { data: {} as unknown, s: [sug('k', 'Keywords', 'pending')], ready: false } },
    );
    hook.rerender({ data: BEFORE, s: [sug('k', 'Keywords', 'pending')], ready: true });
    hook.rerender({ data: AFTER_AB, s: [sug('k', 'Keywords', 'fixed')], ready: true });

    expect(texts(hook.result.current)).toEqual(['Docker']);
  });

  it("does not paint the user's own edit in another section as the fix's text", () => {
    const hook = mount(BEFORE, [sug('k', 'Keywords', 'pending')]);
    const edited = { ...AFTER_AB, professionalSummary: { summary: 'A sentence I typed myself.' } };
    hook.rerender({ data: edited, s: [sug('k', 'Keywords', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Docker']);
  });

  it("still paints text typed into the card's own section before the card was confirmed (manual fix)", () => {
    const hook = mount(BEFORE, [sug('c', 'Contact', 'pending')]);
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'pending')] });
    hook.rerender({ data: AFTER_LOCATION, s: [sug('c', 'Contact', 'fixed')] });

    expect(texts(hook.result.current)).toEqual(['Hyderabad']);
  });

  it("does not paint a later user edit in the same section as an already fixed card", () => {
    const hook = mount(BEFORE, [sug('k', 'Keywords', 'pending')]);
    hook.rerender({ data: AFTER_AB, s: [sug('k', 'Keywords', 'fixed')] });
    expect(texts(hook.result.current)).toEqual(['Docker']);

    hook.rerender({
      data: { ...AFTER_AB, skills: ['React', 'Docker', 'Kubernetes'] },
      s: [sug('k', 'Keywords', 'fixed')],
    });

    expect(texts(hook.result.current)).toEqual(['Docker']);
  });
});
