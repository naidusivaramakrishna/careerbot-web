/**
 * The Batch year field takes ONE number, but a batch is named by a range such as
 * "2020-2024". The hint used to show only the range, which people typed into the
 * number field and had refused.
 */
import { describe, it, expect } from 'vitest';
import { batchYearHint } from '@/lib/batchYearHint';

describe('batchYearHint', () => {
  it('tells the user to enter the start year and uses it as the example', () => {
    const hint = batchYearHint(['2020-2024']);
    expect(hint).toContain('Enter the year the batch starts, e.g. 2020');
    expect(hint).toContain('2020-2024');
  });

  it('lists at most three batches', () => {
    const hint = batchYearHint(['2020-2024', '2021-2025', '2022-2026', '2023-2027']);
    expect(hint).toContain('2022-2026');
    expect(hint).not.toContain('2023-2027');
  });

  it('falls back to a plain instruction when there are no batches', () => {
    expect(batchYearHint([])).toMatch(/year the batch starts/);
  });

  it('does not invent an example when no batch name starts with a year', () => {
    expect(batchYearHint(['Autumn intake'])).toBe(
      'Optional — the year the batch starts, e.g. 2026.');
  });
});
