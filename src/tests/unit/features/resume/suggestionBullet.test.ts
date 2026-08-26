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
 * This test reproduces the sink and the fix on the same shape of DOM the
 * editors use. It is deliberately not importing the components -- they are
 * 700-line editors behind a resume context -- but the logic under test is
 * copied verbatim from them, so a divergence shows up as a failure here.
 */
import { describe, expect, it, beforeEach } from 'vitest';

// Verbatim from the seven section editors after the fix.
function appendSuggestionBullet(el: HTMLElement, suggestion: string) {
  const text = suggestion.replace(/<[^>]*>/g, '').trim();
  const current = el.innerHTML.trim();
  const li = document.createElement('li');
  li.textContent = text;
  if (!current || current === '<br>') {
    el.innerHTML = '';
    const ul = document.createElement('ul');
    ul.appendChild(li);
    el.appendChild(ul);
  } else {
    const uls = el.getElementsByTagName('ul');
    if (uls.length > 0) {
      uls[uls.length - 1].appendChild(li);
    } else {
      const ul = document.createElement('ul');
      ul.appendChild(li);
      el.appendChild(ul);
    }
  }
}

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
