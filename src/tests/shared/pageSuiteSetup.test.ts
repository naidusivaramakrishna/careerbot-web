import { describe, expect, it } from 'vitest';
import { getRoles } from '@testing-library/react';
import { compileRoleSelector, fastMatches, jsdomMatches } from './pageSuiteSetup';

// Read before recordRoleSelectors() below swaps it out and back.
const installedMatches = Element.prototype.matches;

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';
const IGNORED = 'script, style';
const BUTTON_INPUTS = 'input[type=submit], input[type=button], input[type=reset]';

/** The selectors Testing Library itself tries, recorded from its own role lookup (no copy of its list). */
function recordRoleSelectors(): string[] {
  const seen = new Set<string>();
  Element.prototype.matches = function record(this: Element, selectors: string) {
    seen.add(selectors);
    return jsdomMatches.call(this, selectors);
  };
  try {
    // An element no selector matches walks the whole list; a text input also reaches
    // the entries Testing Library only tries for type="text".
    const host = document.createElement('div');
    host.innerHTML = '<x-none></x-none><input type="text">';
    getRoles(host);
  } finally {
    Element.prototype.matches = fastMatches;
  }
  return [...seen];
}

const roleSelectors = recordRoleSelectors();

function el(tag: string, attrs: Record<string, string> = {}, ns = HTML_NS): Element {
  const e = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function elements(): Element[] {
  const tags = new Set(roleSelectors.map((s) => /^[a-z0-9]+/.exec(s)![0]));
  const out: Element[] = [...tags, 'x-none', 'div', 'script', 'style', 'input', 'svg'].map((t) => el(t));
  const typeValues = ['button', 'image', 'reset', 'submit', 'checkbox', 'radio', 'range', 'number', 'email', 'search', 'tel', 'url', 'text', 'password', ''];
  const caseVariants = ['CHECKBOX', 'Submit', 'Email', 'checKbox', ' checkbox'];
  for (const tag of ['input', 'div']) {
    for (const type of [...typeValues, ...caseVariants]) {
      out.push(el(tag, { type }), el(tag, { type, list: 'opts' }));
    }
    out.push(el(tag, { list: 'opts' }));
  }
  for (const tag of ['th', 'td']) for (const scope of ['col', 'colgroup', 'row', 'rowgroup', 'ROW', '']) out.push(el(tag, { scope }));
  const selectAttrs: Record<string, string>[] = [{ multiple: '' }, { size: '3' }, { size: '1' }, { multiple: '', size: '2' }];
  for (const attrs of selectAttrs) out.push(el('select', attrs), el('div', attrs));
  for (const tag of ['img', 'a', 'area', 'aside', 'form', 'section']) {
    for (const attr of ['alt', 'href', 'aria-label', 'aria-labelledby', 'name']) out.push(el(tag, { [attr]: '' }), el(tag, { [attr]: 'x' }));
  }
  // Cases the fast path must hand to jsdom.
  const upperTag = document.createElementNS(HTML_NS, 'INPUT');
  upperTag.setAttribute('type', 'checkbox');
  const upperAttr = el('input');
  upperAttr.setAttributeNS(null, 'TYPE', 'checkbox');
  const nsAttr = el('a');
  nsAttr.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#x');
  const nsAttrNoPrefix = el('area');
  nsAttrNoPrefix.setAttributeNS('urn:x', 'href', '#x');
  const upperAttrName = el('img');
  upperAttrName.setAttributeNS(null, 'ALT', 'x');
  const twoHrefs = el('a', { href: '#a' });
  twoHrefs.setAttributeNS('urn:x', 'href', '#b');
  const prefixedType = el('input');
  prefixedType.setAttributeNS('urn:x', 'x:type', 'submit');
  const upperTypeName = el('input');
  upperTypeName.setAttributeNS(null, 'TYPE', 'submit');
  const upperScript = document.createElementNS(HTML_NS, 'SCRIPT');
  const upperButtonInput = document.createElementNS(HTML_NS, 'INPUT');
  upperButtonInput.setAttribute('type', 'submit');
  const xmlDoc = document.implementation.createDocument(HTML_NS, 'html', null);
  const xmlInput = xmlDoc.createElementNS(HTML_NS, 'input');
  xmlInput.setAttribute('type', 'Checkbox');
  out.push(upperTag, upperAttr, nsAttr, nsAttrNoPrefix, upperAttrName, twoHrefs, prefixedType, upperTypeName, upperScript, upperButtonInput, xmlInput, el('a', { href: '#' }, SVG_NS), el('script', {}, SVG_NS), el('input', { type: 'submit' }, SVG_NS));
  return out;
}

describe('pageSuiteSetup', () => {
  it('recognises every role selector Testing Library uses', () => {
    expect(roleSelectors.length).toBeGreaterThan(80);
    expect(roleSelectors.filter((s) => compileRoleSelector(s) === null)).toEqual([]);
  });

  it('is installed as Element.prototype.matches', () => {
    expect(installedMatches).toBe(fastMatches);
  });

  it("gives jsdom's answer for every element and Testing Library selector", () => {
    const mismatches: string[] = [];
    for (const e of elements()) {
      for (const sel of [...roleSelectors, IGNORED, BUTTON_INPUTS]) {
        const fast = fastMatches.call(e, sel);
        const jsdom = jsdomMatches.call(e, sel);
        if (fast !== jsdom) mismatches.push(`${e.namespaceURI} ${e.outerHTML ?? e.localName} ${sel}: fast ${fast}, jsdom ${jsdom}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('leaves other selectors to jsdom', () => {
    const host = el('div', { class: 'card' });
    host.appendChild(el('button'));
    expect(fastMatches.call(host, 'div.card')).toBe(true);
    expect(fastMatches.call(host, ':has(button)')).toBe(jsdomMatches.call(host, ':has(button)'));
    expect(fastMatches.call(host.firstElementChild!, 'div > button')).toBe(true);
    expect(fastMatches.call(host, 'button[type="submit" i]')).toBe(false);
  });
});
