import { describe, it, expect } from 'vitest';
import { readSectionReference } from '@/lib/sectionReference';

describe('readSectionReference', () => {
  it('sends a section name as it is, for the server to resolve', () => {
    expect(readSectionReference({ section_id: 'civil-A' })).toBe('civil-A');
  });

  it.each(['section', 'section_name'])('reads a column headed %s', (column) => {
    expect(readSectionReference({ [column]: ' civil-A ' })).toBe('civil-A');
  });

  it('skips an empty section_id column in favour of a filled name column', () => {
    expect(readSectionReference({ section_id: '', section_name: 'civil-A' })).toBe('civil-A');
  });

  it('is null when no section column has text', () => {
    expect(readSectionReference({ section_id: '  ' })).toBeNull();
    expect(readSectionReference({})).toBeNull();
  });
});
