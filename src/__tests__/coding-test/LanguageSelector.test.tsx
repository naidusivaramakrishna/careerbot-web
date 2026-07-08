/**
 * LanguageSelector self-containment tests.
 *
 * In the actual implementation the language selector is inline state in
 * [slug]/page.tsx (useState, not useRouter — by design). This file tests:
 *   1. The LANGUAGES/MONACO_LANGUAGE/DIFFICULTY_BADGE constants that back the selector UI.
 *   2. normalizeScore() — the guard that prevents impossible values in the UI.
 *   3. OutputPanel — a second self-contained component with zero routing deps.
 *
 * All tests pass with NO mock of useRouter or next/navigation beyond what the
 * global vitest.setup.ts already provides for the entire project.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  LANGUAGES,
  MONACO_LANGUAGE,
  DIFFICULTY_BADGE,
  normalizeScore,
} from '@/app/coding-test/_lib/ui';
import OutputPanel from '@/app/coding-test/_components/OutputPanel';
import type { RunResult } from '@/app/coding-test/_lib/types';

// ── Language constants ────────────────────────────────────────────────────────

describe('LANGUAGES (language selector backing data)', () => {
  it('contains exactly the four MVP languages', () => {
    const values = LANGUAGES.map((l) => l.value);
    expect(values).toHaveLength(4);
    expect(values).toContain('python');
    expect(values).toContain('java');
    expect(values).toContain('cpp');
    expect(values).toContain('c');
  });

  it('every language has a non-empty display label', () => {
    for (const lang of LANGUAGES) {
      expect(lang.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('MONACO_LANGUAGE maps each language key to a non-empty Monaco language id', () => {
    for (const lang of LANGUAGES) {
      const id = MONACO_LANGUAGE[lang.value];
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });
});

// ── Difficulty badges ─────────────────────────────────────────────────────────

describe('DIFFICULTY_BADGE', () => {
  it('defines a Tailwind class string for every difficulty level', () => {
    expect(typeof DIFFICULTY_BADGE.easy).toBe('string');
    expect(typeof DIFFICULTY_BADGE.medium).toBe('string');
    expect(typeof DIFFICULTY_BADGE.hard).toBe('string');
  });

  it('each difficulty has distinct badge classes', () => {
    expect(DIFFICULTY_BADGE.easy).not.toBe(DIFFICULTY_BADGE.medium);
    expect(DIFFICULTY_BADGE.medium).not.toBe(DIFFICULTY_BADGE.hard);
    expect(DIFFICULTY_BADGE.easy).not.toBe(DIFFICULTY_BADGE.hard);
  });
});

// ── normalizeScore ────────────────────────────────────────────────────────────

describe('normalizeScore', () => {
  it('passes through valid scores in [0, 100] unchanged', () => {
    expect(normalizeScore(0)).toBe(0);
    expect(normalizeScore(50)).toBe(50);
    expect(normalizeScore(100)).toBe(100);
  });

  it('rounds fractional values to the nearest integer', () => {
    expect(normalizeScore(85.7)).toBe(86);
    expect(normalizeScore(85.3)).toBe(85);
    expect(normalizeScore(0.5)).toBe(1);
  });

  it('clamps scores above 100 to exactly 100', () => {
    expect(normalizeScore(101)).toBe(100);
    expect(normalizeScore(150)).toBe(100);
    expect(normalizeScore(9999)).toBe(100);
  });

  it('clamps negative scores to exactly 0', () => {
    expect(normalizeScore(-1)).toBe(0);
    expect(normalizeScore(-100)).toBe(0);
  });

  it('returns null for null input', () => {
    expect(normalizeScore(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeScore(undefined)).toBeNull();
  });

  it('returns null for non-finite values (Infinity, NaN)', () => {
    expect(normalizeScore(Infinity)).toBeNull();
    expect(normalizeScore(-Infinity)).toBeNull();
    expect(normalizeScore(NaN)).toBeNull();
  });
});

// ── OutputPanel (self-containment) ────────────────────────────────────────────

describe('OutputPanel', () => {
  function run(overrides: Partial<RunResult> = {}): RunResult {
    return { stdout: '', stderr: '', exit_code: 0, ...overrides };
  }

  it('renders without any routing context', () => {
    const { container } = render(<OutputPanel result={run({ stdout: 'ok' })} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('displays stdout on a successful run', () => {
    const { getByText } = render(
      <OutputPanel result={run({ stdout: 'Test 1: ✓ PASS', exit_code: 0 })} />,
    );
    expect(getByText('Test 1: ✓ PASS')).toBeTruthy();
  });

  it('displays stderr when the program exits with an error', () => {
    const { getByText } = render(
      <OutputPanel result={run({ stderr: 'NameError: name "x" not defined', exit_code: 1 })} />,
    );
    expect(getByText('NameError: name "x" not defined')).toBeTruthy();
  });

  it('shows "No output." when stdout and stderr are both empty', () => {
    const { getByText } = render(<OutputPanel result={run()} />);
    expect(getByText('No output.')).toBeTruthy();
  });

  it('shows "Exited 0" for a successful run', () => {
    const { getByText } = render(
      <OutputPanel result={run({ stdout: 'done', exit_code: 0 })} />,
    );
    expect(getByText('Exited 0')).toBeTruthy();
  });

  it('shows the non-zero exit code for a failed run', () => {
    const { getByText } = render(
      <OutputPanel result={run({ stderr: 'error', exit_code: 2 })} />,
    );
    expect(getByText('Exited 2')).toBeTruthy();
  });

  it('renders both stdout and stderr together when both are present', () => {
    const { getByText } = render(
      <OutputPanel
        result={run({ stdout: 'some output', stderr: 'some warning', exit_code: 0 })}
      />,
    );
    expect(getByText('some output')).toBeTruthy();
    expect(getByText('some warning')).toBeTruthy();
  });
});
