// Map a weak-area topic label (e.g. "Percentages", "Time & Work") to a
// practiceable category + backend subcategory slug, so "Practice this topic"
// launches a focused custom test instead of the generic company list.
// The subcategory is only set when we can confidently match a valid slug
// (see CATEGORY_SUBCATEGORIES in lib/mockTestConstants).
// A plain substring match lets a short keyword fire inside an unrelated word:
// 'ratio' in "Operations", 'work' in "Networks", 'oop' in "Loops", 'graph' in
// "Paragraph", 'git' in "Unit Digit". Every keyword below is therefore matched
// at a word boundary, and that is the DEFAULT rather than an opt-in list.
//
// An earlier version kept a `boundaryKws` allow-list and added one word to it
// per bug report ('ratio', then 'work', then 'oop', then 'search'). That shape
// guarantees the next short keyword collides too, because being safe requires
// someone to remember to enrol it. Defaulting to a boundary inverts that: a
// new keyword is safe unless it deliberately opts out.
//
// The boundary is only on the LEFT, so deliberate stems still match: 'simplif'
// -> "Simplification", 'ratio' -> "Ratios", 'normaliz' -> "Normalization".
const matchesWord = (text: string, kw: string): boolean =>
  new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);

// The opt-OUT: stems that must match INSIDE a word, with the label that forces
// it. Keep this list short and justified — every entry re-opens the embedded-
// keyword risk for that one stem, so it needs a label that cannot be spelled
// any other way.
//   'thread' -> "Multithreading" is one word, so \bthread never fires.
const SUBSTRING_KWS = new Set(['thread']);

const matchesKeyword = (text: string, kw: string): boolean =>
  SUBSTRING_KWS.has(kw) ? text.includes(kw) : matchesWord(text, kw);

export function resolveTopicTarget(topic: string): { category: string; subcategory?: string } {
  const t = (topic || '').toLowerCase();
  const rules: Array<{ kws: string[]; category: string; sub?: string }> = [
    // ── Technical topics first ────────────────────────────────────────────
    // These MUST precede the arithmetic/aptitude rules below, which otherwise
    // swallow them: 'time' matches "Time Complexity", 'abstract' matches
    // "Abstract Class". Hoisted 'data interpretation' above the technical block
    // so "Bar Graph"/"Line Graph" still resolve to DI rather than to 'graph'.
    //
    // Before this block, 41 of 41 sampled DSA/OOP/DB topics fell through to the
    // 'arithmetic' default — a candidate whose weak area was "Recursion" or
    // "Linked List" was handed an arithmetic test.
    // ── Shared-word disambiguation — MUST stay above the technical block ──
    // Each word here reads as both a technical and a non-technical topic. A
    // left boundary alone cannot separate them, so the more specific phrasing
    // wins by sitting first.
    //   'tree'  -> DSA, but "Family Tree" is blood relations
    //   'graph' -> DSA, but "Bar Graph"/"Line Graph" is data interpretation
    //   'distance' -> time/speed/distance, but "Heights and Distances" is trig
    { kws: ['family tree', 'blood'],  category: 'reasoning', sub: 'blood_relations' },
    { kws: ['data interpretation', 'bar graph', 'line graph', 'bar chart',
            'pie chart'],             category: 'aptitude',  sub: 'data_interpretation' },
    { kws: ['height'],                category: 'aptitude',  sub: 'trigonometry' },
    // Ahead of the generic 'analyt' -> aptitude rule below, or "Critical and
    // Analytical Reasoning" wrongly lands in aptitude via that substring.
    { kws: ['critical', 'critical and analytical', 'analytical reasoning'],
                                      category: 'reasoning', sub: 'critical_and_analytical_reasoning' },

    { kws: ['complexity', 'big-o', 'big o'],      category: 'technical', sub: 'dsa' },
    { kws: ['abstract class', 'abstract method'], category: 'technical', sub: 'oops' },
    { kws: ['inheritance', 'polymorph', 'encapsulat', 'interface'], category: 'technical', sub: 'oops' },
    { kws: ['loop', 'recursion', 'array', 'linked list', 'stack', 'queue',
            'tree', 'graph', 'hash', 'sort', 'search', 'pointer', 'string'],
                                                  category: 'technical', sub: 'dsa' },
    { kws: ['normaliz', 'indexing', 'join', 'transaction', 'query'],
                                                  category: 'technical', sub: 'database' },
    { kws: ['exception', 'memory', 'thread', 'concurren', 'design pattern',
            'rest api', 'api design', 'git', 'debugging', 'unit test'],
                                                  category: 'technical' },
    // ── end technical block ───────────────────────────────────────────────

    { kws: ['percent'],               category: 'arithmetic', sub: 'percentages' },
    { kws: ['profit', 'loss'],        category: 'arithmetic', sub: 'profit_loss' },
    // Ahead of 'ratio' below — "mensuRATIOn" contains that substring.
    { kws: ['mensuration'],           category: 'aptitude',   sub: 'mensuration' },
    { kws: ['ratio'],                 category: 'arithmetic', sub: 'ratios' },
    { kws: ['interest'],              category: 'arithmetic', sub: 'simple_interest' },
    // Ahead of the generic 'time'/'work' rule below, or "Time, Speed & Distance" wrongly matches it.
    { kws: ['speed', 'distance'],     category: 'arithmetic', sub: 'time_speed_and_distance' },
    { kws: ['time', 'work'],          category: 'arithmetic', sub: 'time_and_work' },
    { kws: ['algebra'],               category: 'arithmetic', sub: 'algebra' },
    { kws: ['number system'],         category: 'arithmetic', sub: 'number_system' },
    { kws: ['simplif'],               category: 'arithmetic', sub: 'simplification' },
    { kws: ['average'],               category: 'arithmetic', sub: 'average' },
    { kws: ['mixture', 'alligation'], category: 'arithmetic', sub: 'mixture_and_alligation' },
    { kws: ['age'],                   category: 'arithmetic', sub: 'problems_on_ages' },
    { kws: ['train'],                 category: 'arithmetic', sub: 'problems_on_trains' },
    { kws: ['boat', 'stream'],        category: 'arithmetic', sub: 'boats_and_streams' },
    // Verbal/English labels: before these, "Paragraph Completion" and
    // "Reading Comprehension" fell through every rule to the arithmetic
    // default, handing an English weak area an arithmetic test.
    { kws: ['verbal', 'paragraph', 'sentence', 'reading comprehension',
            'synonym', 'antonym', 'vocabulary', 'grammar', 'idiom',
            'fill in the blank', 'cloze'],
                                      category: 'aptitude',   sub: 'verbal' },
    { kws: ['abstract'],              category: 'aptitude',   sub: 'abstract' },
    { kws: ['analyt'],                category: 'aptitude',   sub: 'analytical' },
    { kws: ['statistic'],             category: 'aptitude',   sub: 'statistics' },
    { kws: ['geometry'],              category: 'aptitude',   sub: 'geometry' },
    { kws: ['trigon'],                category: 'aptitude',   sub: 'trigonometry' },
    { kws: ['permutation', 'combination'], category: 'aptitude', sub: 'permutation_and_combination' },
    { kws: ['probability'],           category: 'aptitude',   sub: 'probability' },
    { kws: ['arithmetic progression'], category: 'aptitude',  sub: 'arithmetic_progression' },
    { kws: ['geometric progression'],  category: 'aptitude',  sub: 'geometric_progression' },
    // Bare "progression" with no AP/GP qualifier — no single valid slug to
    // force, so leave sub unset and let the runner pick randomly between them.
    { kws: ['progression'],           category: 'aptitude' },
    { kws: ['direction'],             category: 'reasoning',  sub: 'direction_sense' },
    // Not bare 'coding' — that also matches general-programming labels like
    // "Coding Basics" (a real, if inherent, ambiguity: "coding" means two
    // different things depending on whether the topic is reasoning puzzles
    // or software). The specific phrasing narrows it to the puzzle type.
    { kws: ['coding-decoding', 'coding decoding', 'coding and decoding', 'code-decode'], category: 'reasoning', sub: 'coding_decoding' },
    { kws: ['sequence', 'series'],    category: 'reasoning',  sub: 'series' },
    { kws: ['puzzle'],                category: 'reasoning',  sub: 'puzzles' },
    { kws: ['analogy'],               category: 'reasoning',  sub: 'analogy' },
    { kws: ['classification'],        category: 'reasoning',  sub: 'classification' },
    { kws: ['ranking'],               category: 'reasoning',  sub: 'ranking' },
    { kws: ['assumption'],            category: 'reasoning',  sub: 'statement_and_assumption' },
    { kws: ['cause', 'effect'],       category: 'reasoning',  sub: 'cause_and_effect' },
    // No specific-enough slug for bare "logic"/"reason" — falls through to the
    // category-only match below, which lets the runner pick a random reasoning
    // subcategory rather than forcing a wrong one.
    { kws: ['logic', 'reason'],       category: 'reasoning' },
    { kws: ['python'],                category: 'technical',  sub: 'python' },
    // Ahead of 'java' below, or "JavaScript" wrongly matches it (t.includes('java')).
    { kws: ['javascript'],            category: 'technical',  sub: 'javascript' },
    { kws: ['java'],                  category: 'technical',  sub: 'java' },
    { kws: ['dsa', 'data structure'], category: 'technical',  sub: 'dsa' },
    { kws: ['sql'],                   category: 'technical',  sub: 'sql' },
    { kws: ['oop'],                   category: 'technical',  sub: 'oops' },
    { kws: ['database'],              category: 'technical',  sub: 'database' },
    { kws: ['system design'],         category: 'technical',  sub: 'system_design' },
    { kws: ['html'],                  category: 'technical',  sub: 'html' },
    { kws: ['css'],                   category: 'technical',  sub: 'css' },
    { kws: ['web'],                   category: 'technical',  sub: 'web' },
  ];
  for (const r of rules) {
    if (r.kws.some(k => matchesKeyword(t, k))) {
      return { category: r.category, subcategory: r.sub };
    }
  }
  if (t.includes('aptitude')) return { category: 'aptitude' };
  if (t.includes('tech') || t.includes('program')) return { category: 'technical' };
  return { category: 'arithmetic' };
}
