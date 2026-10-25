/**
 * The assignment screen must say what the server actually did.
 */
import { describe, it, expect } from 'vitest';
import { assignmentOutcomeMessage, facultyOptionLabel } from '@/lib/facultyAssignment';

describe('assignmentOutcomeMessage', () => {
  it('all new', () => {
    expect(assignmentOutcomeMessage(3, 3)).toBe('3 students assigned.');
    expect(assignmentOutcomeMessage(1, 1)).toBe('1 student assigned.');
  });

  it('a mix says how many were new and how many were already there', () => {
    expect(assignmentOutcomeMessage(5, 2)).toBe(
      '2 students newly assigned. 3 already assigned, left as they were.');
  });

  it('assigning the same students again is NOT reported as a success', () => {
    const msg = assignmentOutcomeMessage(4, 0);
    expect(msg).toContain('already assigned');
    expect(msg).toContain('Nothing changed');
    expect(msg).not.toMatch(/^\d+ students? assigned\.$/);
  });

  it('singular when the one ticked student was already assigned', () => {
    expect(assignmentOutcomeMessage(1, 0)).toBe(
      'That student was already assigned to this faculty member. Nothing changed.');
  });

  it('never reports a negative count', () => {
    expect(assignmentOutcomeMessage(1, 3)).toBe('3 students assigned.');
  });
});

describe('facultyOptionLabel', () => {
  const ACCOUNT = '5e881aa6c0ffee00000000000000beef';

  it('shows name, department and the account id', () => {
    expect(facultyOptionLabel({ display_name: ' Prof Meera ', account_id: ACCOUNT }, 'Civil Engineering'))
      .toBe(`Prof Meera · Civil Engineering · ${ACCOUNT}`);
  });

  it('a missing name reads as Unnamed faculty member, not a bare hex id', () => {
    const label = facultyOptionLabel({ display_name: null, account_id: ACCOUNT }, 'Civil Engineering');
    expect(label.startsWith('Unnamed faculty member')).toBe(true);
    expect(label).toContain(ACCOUNT);
  });

  it('keeps the account id even when a name is present (the name is unverified)', () => {
    expect(facultyOptionLabel({ display_name: 'Prof X', account_id: ACCOUNT }, null)).toContain(ACCOUNT);
  });
});

describe('assignmentOutcomeMessage with the endpoint\'s real response (an array of CREATED rows)', () => {
  const created = [{ id: 'a1', student_id: 's1' }, { id: 'a2', student_id: 's2' }];

  it('counts the rows returned, so already-assigned students show as left as they were', () => {
    expect(assignmentOutcomeMessage(3, created.length)).toBe(
      '2 students newly assigned. 1 already assigned, left as they were.');
  });

  it('says nothing changed when the server created no rows', () => {
    expect(assignmentOutcomeMessage(2, [].length)).toContain('Nothing changed');
  });
});
