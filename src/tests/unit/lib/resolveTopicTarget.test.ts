import { describe, expect, it } from 'vitest';
import { resolveTopicTarget } from '@/lib/resolveTopicTarget';
import { CATEGORY_SUBCATEGORIES } from '@/lib/mockTestConstants';

// Every slug in CATEGORY_SUBCATEGORIES, run through resolveTopicTarget as a
// human-readable label, should resolve back to its own category AND its own
// slug — category-only would pass even when a rule matches the wrong SIBLING
// slug in the same category (e.g. 'java' matching "JavaScript" before a
// dedicated javascript rule existed — both are 'technical', so a category-only
// check couldn't have caught it). A new slug with no rule at all would also
// silently fall through to a same-category default and still pass a
// category-only check in some cases.
describe('resolveTopicTarget (Weak Areas "Practice this topic")', () => {
  for (const [category, slugs] of Object.entries(CATEGORY_SUBCATEGORIES)) {
    for (const slug of slugs) {
      const label = slug.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      it(`"${label}" (${slug}) resolves to category "${category}" and its own slug`, () => {
        const result = resolveTopicTarget(label);
        expect(result.category).toBe(category);
        expect(result.subcategory).toBe(slug);
      });
    }
  }
});

// Real-world labels outside our own slug set — these previously tripped
// substring collisions the table test above couldn't catch, since it only
// feeds in labels built from our own slugs.
describe('resolveTopicTarget — collisions with unrelated labels', () => {
  it('"Operations" is not mistaken for "Ratios" (the substring "ratio" sits mid-word)', () => {
    expect(resolveTopicTarget('Operations').subcategory).not.toBe('ratios');
  });

  it('"Iteration" is not mistaken for "Ratios" (same mid-word "ratio")', () => {
    expect(resolveTopicTarget('Iteration').subcategory).not.toBe('ratios');
  });

  it('"Networks" is not mistaken for "Time and Work" (the substring "work" sits mid-word)', () => {
    expect(resolveTopicTarget('Networks').subcategory).not.toBe('time_and_work');
  });

  it('"Coding Basics" (a general-programming label) is not mistaken for the reasoning coding-decoding puzzle type', () => {
    expect(resolveTopicTarget('Coding Basics').subcategory).not.toBe('coding_decoding');
  });

  it('a real "Ratios" or "Ratio and Proportion" label still matches (word-boundary, not full-word-only)', () => {
    expect(resolveTopicTarget('Ratios').subcategory).toBe('ratios');
    expect(resolveTopicTarget('Ratio and Proportion').subcategory).toBe('ratios');
  });

  // 'oop' used plain substring matching, so "Loops" (l-OOP-s) resolved to the
  // OOPs subcategory and a loops weak-area launched an OOPs practice test.
  it('a loops topic does not resolve to the OOPs subcategory', () => {
    for (const topic of ['Loops', 'For Loops', 'Nested Loops', 'Loops and Iteration']) {
      expect(resolveTopicTarget(topic).subcategory).not.toBe('oops');
    }
  });

  it('a real OOPs label still resolves to the OOPs subcategory', () => {
    expect(resolveTopicTarget('OOPs Concepts').subcategory).toBe('oops');
    expect(resolveTopicTarget('OOP').subcategory).toBe('oops');
  });

  // Asserting `subcategory !== 'oops'` above is too weak on its own: it passes
  // while the CATEGORY is wrong. Before the technical block was added, all 41
  // of these fell through to the 'arithmetic' default, so a candidate whose weak
  // area was "Recursion" or "Linked List" was handed an arithmetic test.
  it.each([
    'Loops', 'For Loops', 'While Loops', 'Nested Loops', 'Recursion',
    'Arrays', 'Array Manipulation', 'Linked List', 'Stacks', 'Queues',
    'Trees', 'Binary Tree', 'Graphs', 'Hash Maps', 'Hashing',
    'Sorting', 'Searching', 'Binary Search',
    'Time Complexity', 'Space Complexity', 'Big-O Notation',
    'Abstract Class', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Interfaces',
    'Exception Handling', 'Pointers', 'Memory Management', 'Multithreading',
    'Concurrency', 'Design Patterns', 'REST APIs',
    'Normalization', 'Indexing', 'Joins', 'Transactions',
    'Git', 'Debugging', 'Unit Testing', 'Strings',
  ])('routes the technical topic %s to the technical category', (topic) => {
    expect(resolveTopicTarget(topic).category).toBe('technical');
  });

  // The technical block sits above the arithmetic/aptitude rules, so these
  // guard the collisions that ordering creates.
  it('the technical block does not steal non-technical topics', () => {
    // 'time' must not lose "Time & Work" to the 'complexity' rule's neighbours
    expect(resolveTopicTarget('Time & Work')).toEqual({ category: 'arithmetic', subcategory: 'time_and_work' });
    expect(resolveTopicTarget('Time, Speed & Distance').subcategory).toBe('time_speed_and_distance');
    // 'abstract class' must not swallow plain "Abstract Reasoning"
    expect(resolveTopicTarget('Abstract Reasoning')).toEqual({ category: 'aptitude', subcategory: 'abstract' });
    // 'graph' must not beat data interpretation — hence the hoisted DI rule
    expect(resolveTopicTarget('Bar Graph Data Interpretation').subcategory).toBe('data_interpretation');
    // 'search' is boundary-matched so it does not fire inside "Research"
    expect(resolveTopicTarget('Research Aptitude').category).toBe('aptitude');
  });

  // Each of these routed to a technical category once the technical block was
  // hoisted above the arithmetic/aptitude rules, because its keyword appeared
  // INSIDE a longer, unrelated word. They are the reason keyword matching now
  // defaults to a word boundary instead of opting in one word at a time.
  //
  // Note the weaker assertion these replace: a test using the label
  // "Bar Graph Data Interpretation" passes on the 'data interpretation' phrase
  // and never exercises 'graph' at all.
  it.each([
    // [topic,                    expected category, expected subcategory]
    ['Paragraph Completion',      'aptitude',   'verbal'],
    ['Unit Digit',                'arithmetic', undefined],
    ['Digits and Numbers',        'arithmetic', undefined],
    ['Bar Graph',                 'aptitude',   'data_interpretation'],
    ['Line Graph',                'aptitude',   'data_interpretation'],
    ['Pie Chart',                 'aptitude',   'data_interpretation'],
    ['Family Tree',               'reasoning',  'blood_relations'],
    ['Blood Relations',           'reasoning',  'blood_relations'],
    ['Heights and Distances',     'aptitude',   'trigonometry'],
  ])('does not route %s into a technical subcategory', (topic, category, sub) => {
    const got = resolveTopicTarget(topic as string);
    expect(got.category).toBe(category);
    if (sub !== undefined) expect(got.subcategory).toBe(sub);
    expect(got.category).not.toBe('technical');
  });

  // The guard that outlives any individual keyword: no keyword in the rule
  // table may fire from inside a longer word. This fails for a future short
  // keyword added without a boundary, which the per-topic cases above cannot.
  it('never matches a keyword embedded inside a longer word', () => {
    const embedded: Array<[string, string]> = [
      ['Operations Research', 'ratio'],   // ope-RATIO-ns
      ['Networks',            'work'],    // net-WORK-s
      ['Paragraph',           'graph'],   // para-GRAPH
      ['Unit Digit',          'git'],     // di-GIT
      ['Research',            'search'],  // re-SEARCH
      ['Iteration',           'ratio'],   // ite-RATIO-n
    ];
    for (const [topic] of embedded) {
      // Resolving must not depend on the embedded keyword: the result is
      // whatever the topic's own words say, and for these it is never DSA.
      expect(resolveTopicTarget(topic).subcategory).not.toBe('dsa');
    }
    // "Nested Loops" IS dsa — \bloop matches the whole word "Loops"
    // legitimately. The embedded keyword there is 'oop', so the guard is that
    // it does not land in the OOPs subcategory.
    expect(resolveTopicTarget('Nested Loops')).toEqual({ category: 'technical', subcategory: 'dsa' });
    // 'thread' is a deliberate substring opt-out, so this must keep matching.
    expect(resolveTopicTarget('Multithreading').category).toBe('technical');
  });
});
