import { describe, it, expect } from 'vitest';
import { sectionsForOrderList } from '@/app/(resume)/builder/creation/_utils/sectionPayloadKeys';

const names = (l: { name: string }[]) => l.map((s) => s.name);
const all = ['Personal Info', 'Professional Summary', 'Education', 'Skills', 'Work Experience', 'Projects', 'Achievements', 'Hobbies', 'My Custom'].map((name) => ({ name }));

describe('sectionsForOrderList', () => {
  it('keeps only the sections the resume has content in', () => {
    const data = {
      workExperience: [{ company: 'Acme' }],
      hobbies: ['Reading'],
      education: [],
      projects: [{ projectName: '' }],
      achievements: [],
      categorizedSkills: { programming_languages: ['Python'] },
      customSections: [{ sectionName: 'My Custom', fields: [{ value: '' }] }],
    } as never;
    expect(names(sectionsForOrderList(all, data))).toEqual([
      'Personal Info', 'Professional Summary', 'Skills', 'Work Experience', 'Hobbies',
    ]);
  });

  it('includes a custom section once it has a value, and not while empty', () => {
    const empty = { customSections: [{ sectionName: 'My Custom', fields: [{ value: '' }] }] } as never;
    const filled = { customSections: [{ sectionName: 'My Custom', fields: [{ value: 'x' }] }] } as never;
    expect(names(sectionsForOrderList(all, empty))).not.toContain('My Custom');
    expect(names(sectionsForOrderList(all, filled))).toContain('My Custom');
  });

  it('shows a section the user just added even though it is still empty', () => {
    expect(names(sectionsForOrderList(all, {} as never, ['Projects', 'My Custom']))).toEqual(
      ['Personal Info', 'Professional Summary', 'Projects', 'My Custom'],
    );
  });

  it('never drops sections it does not recognise', () => {
    const odd = [{ name: 'Declaration' }, { name: 'Something New' }];
    expect(names(sectionsForOrderList(odd, {} as never))).toEqual(['Declaration', 'Something New']);
  });
});
