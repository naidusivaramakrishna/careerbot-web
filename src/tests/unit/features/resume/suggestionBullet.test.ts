/**
 * The suggestion-bullet sink, pinned.
 *
 * Seven section editors append an AI suggestion as a bullet into a
 * contentEditable. They stripped tags with /<[^>]*>/g and then interpolated
 * the result into innerHTML. That regex only matches a '<' WITH a closing
 * '>', so an unclosed tag survives it byte-for-byte -- and the template then
 * handed it to the HTML parser, which resolved it into a live element.
 *
 * The payload path is real: `suggestion` is AI text derived from an uploaded
 * resume, and the result was written straight back into the SAVED resume, so
 * it persisted rather than lasting one render.
 *
 * The logic now lives in ONE module that all seven editors import, so this
 * test drives the real thing rather than a copy of it.
 */
import { describe, expect, it, beforeEach } from 'vitest';
// THE PRODUCTION FUNCTION. The first version of this file copied the fixed
// implementation into the test, which meant reverting the real one left this
// green -- a test that cannot fail. All seven section editors now import
// this same symbol, so this exercises what actually ships.
import { appendSuggestionBullet } from '@/app/(resume)/builder/creation/_lib/appendSuggestionBullet';

let el: HTMLElement;
beforeEach(() => {
  el = document.createElement('div');
  document.body.appendChild(el);
});

describe('appendSuggestionBullet', () => {
  it('leaves no live element when the payload has an unclosed tag', () => {
    // The exact bypass: no '>' anywhere, so the strip is a no-op.
    appendSuggestionBullet(el, '<img src=x onerror=alert(document.cookie)');

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('li')?.textContent).toContain('onerror');
  });

  it('does not execute an unclosed script payload on an existing list', () => {
    el.innerHTML = '<ul><li>Existing bullet</li></ul>';
    appendSuggestionBullet(el, '<img src=x onerror=alert(1)');

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelectorAll('li')).toHaveLength(2);
  });

  it('does not execute a payload when there is no list to append to', () => {
    // The branch that used `innerHTML +=`.
    el.innerHTML = '<p>Some prose</p>';
    appendSuggestionBullet(el, '<img src=x onerror=alert(1)');

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('ul li')).not.toBeNull();
  });

  it('still strips well-formed tags and keeps the readable text', () => {
    appendSuggestionBullet(el, '<b>Led</b> a team of <i>8</i> engineers');
    expect(el.querySelector('li')?.textContent).toBe('Led a team of 8 engineers');
    expect(el.querySelector('b')).toBeNull();
  });

  it('appends to the last list rather than starting a new one', () => {
    el.innerHTML = '<ul><li>One</li></ul>';
    appendSuggestionBullet(el, 'Two');

    expect(el.querySelectorAll('ul')).toHaveLength(1);
    expect([...el.querySelectorAll('li')].map((n) => n.textContent)).toEqual(['One', 'Two']);
  });

  it('replaces an empty editor rather than nesting inside its <br>', () => {
    el.innerHTML = '<br>';
    appendSuggestionBullet(el, 'First bullet');

    expect(el.querySelector('br')).toBeNull();
    expect(el.querySelector('ul li')?.textContent).toBe('First bullet');
  });
});

describe('every section editor uses the shared helper', () => {
  // The 7-way copy is what allowed one sink to be seven sinks. If a section
  // grows its own inline version again, this fails.
  it('has no inline innerHTML bullet construction left', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = 'src/app/(resume)/builder/creation/_components/editor/sections';
    const offenders = readdirSync(dir)
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => /innerHTML\s*\+?=\s*`<ul>/.test(readFileSync(`${dir}/${f}`, 'utf8')));

    expect(offenders).toEqual([]);
  });
});
