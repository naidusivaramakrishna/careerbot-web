/**
 * The chunk contract between the roster screen and the route.
 *
 * The server caps a chunk at BULK_STUDENT_CHUNK_MAX and answers 422 above it.
 * The client mirrors that number so the file is split BEFORE sending, rather
 * than the limit being discovered as a rejected chunk on row 501. Two constants
 * that must agree is exactly the pair that drifts, so it is asserted.
 */
import { describe, expect, it } from 'vitest';
import { BULK_CHUNK_SIZE, chunkStudents } from '@/api/institutionApi';

describe('chunkStudents', () => {
  it('mirrors the server cap of 500', () => {
    // If this fails, change app/api/v1/endpoints/institution.py in the same
    // commit -- BULK_STUDENT_CHUNK_MAX is the source of truth.
    expect(BULK_CHUNK_SIZE).toBe(500);
  });

  it('leaves a roster smaller than one chunk alone', () => {
    const rows = Array.from({ length: 12 }, (_, i) => i);
    expect(chunkStudents(rows)).toEqual([rows]);
  });

  it('splits a roster larger than one chunk', () => {
    const rows = Array.from({ length: 1250 }, (_, i) => i);
    const chunks = chunkStudents(rows);
    expect(chunks.map((c) => c.length)).toEqual([500, 500, 250]);
  });

  it('never emits a chunk above the cap', () => {
    const rows = Array.from({ length: 30_000 }, (_, i) => i);
    const chunks = chunkStudents(rows);
    expect(Math.max(...chunks.map((c) => c.length))).toBeLessThanOrEqual(BULK_CHUNK_SIZE);
    expect(chunks.flat()).toHaveLength(30_000);
  });

  it('preserves order, because a row index maps back to a file line', () => {
    const rows = Array.from({ length: 1001 }, (_, i) => i);
    expect(chunkStudents(rows).flat()).toEqual(rows);
  });

  it('emits nothing for an empty roster rather than one empty chunk', () => {
    // An empty chunk is a 422 from the route: min_length=1.
    expect(chunkStudents([])).toEqual([]);
  });

  it('refuses a chunk size that would loop forever', () => {
    expect(() => chunkStudents([1, 2, 3], 0)).toThrow();
  });
});
