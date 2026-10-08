import { describe, expect, it } from 'vitest';
import {
  isBuiltInCategoryName,
  renameCategoryErrorMessage,
} from '@/app/(resume)/builder/creation/_utils/skillCategoryName';

describe('isBuiltInCategoryName', () => {
  it.each([
    'marketingSales', 'Marketing Sales', 'marketing_sales', 'Soft Skills', 'softSkills',
    'Programming Languages', 'programming_language', 'Frameworks', 'Project Management',
  ])('treats %s as built-in', (name) => {
    expect(isBuiltInCategoryName(name)).toBe(true);
  });

  it.each([
    'Tool', 'DevOps Tools', 'Cloud & DevOps', 'Frameworks & Libraries', 'AI/ML', 'Marketing Analytics',
  ])('treats %s as a normal custom name', (name) => {
    expect(isBuiltInCategoryName(name)).toBe(false);
  });
});

describe('renameCategoryErrorMessage', () => {
  it('explains a 409 conflict', () => {
    expect(renameCategoryErrorMessage({ response: { status: 409 } }, 'Cloud Tools'))
      .toBe('"Cloud Tools" category already exists');
  });

  it("shows the API's own reason without its technical prefix", () => {
    const err = {
      response: {
        status: 400,
        data: {
          error: {
            message:
              "Validation error on field 'new_name': 'Misc Stuff' is not a recognized professional skill category. Use a meaningful name like 'DevOps Tools'.",
          },
        },
      },
    };
    expect(renameCategoryErrorMessage(err, 'Misc Stuff')).toBe(
      "'Misc Stuff' is not a recognized professional skill category. Use a meaningful name like 'DevOps Tools'.",
    );
  });

  it('falls back when a 400 carries no message, and for other failures', () => {
    expect(renameCategoryErrorMessage({ response: { status: 400 } }, 'X Tools'))
      .toBe('"X Tools" is not an allowed category name.');
    expect(renameCategoryErrorMessage(new Error('network'), 'X Tools'))
      .toBe('Failed to rename category. Please try again.');
  });
});
