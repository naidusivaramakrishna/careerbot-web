/**
 * Student rows carry ids; people need names.
 *
 * The Section column showed a 32-character generated id and the Department
 * column the department code. nameLookup resolves them against the lists the
 * college area already loads.
 */
import { describe, it, expect } from 'vitest';
import { nameLookup } from '@/lib/structureNames';

const SECTION_ID = '4c64d4393ee54ce9b885e363b0bb5bbd';

describe('nameLookup', () => {
  const section = nameLookup([{ id: SECTION_ID, name: 'civil-A' }]);
  const department = nameLookup([{ id: 'civil', name: 'Civil Engineering' }]);

  it('turns a section id into its name', () => {
    expect(section(SECTION_ID)).toBe('civil-A');
  });

  it('turns a department code into its name', () => {
    expect(department('civil')).toBe('Civil Engineering');
  });

  it('is null, never the raw id, for an id that is not in the list', () => {
    expect(section('not-a-known-section')).toBeNull();
  });

  it('is null for a blank or missing id', () => {
    expect(section(null)).toBeNull();
    expect(section(undefined)).toBeNull();
    expect(section('')).toBeNull();
  });

  it('copes with a list that has not loaded', () => {
    expect(nameLookup(undefined)(SECTION_ID)).toBeNull();
    expect(nameLookup(null)(SECTION_ID)).toBeNull();
    expect(nameLookup([])(SECTION_ID)).toBeNull();
  });

  it('trims the name and ignores rows with no usable name', () => {
    const lookup = nameLookup([
      { id: 'a', name: '  Padded  ' },
      { id: 'b', name: '   ' },
    ]);
    expect(lookup('a')).toBe('Padded');
    expect(lookup('b')).toBeNull();
  });
});
