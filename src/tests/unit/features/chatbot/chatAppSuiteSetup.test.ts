import { describe, it, expect } from 'vitest';
import { fastMatches, jsdomMatches } from './chatAppSuiteSetup';

// The shortcut must answer exactly what jsdom's own matches() answers.
const SELECTORS = [
  'script, style',
  'input[type=submit], input[type=button], input[type=reset]',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

const elements = (): Element[] => {
  const html = (tag: string, type?: string) => {
    const el = document.createElement(tag);
    if (type !== undefined) el.setAttribute('type', type);
    return el;
  };
  const svg = (tag: string, type?: string) => {
    const el = document.createElementNS(SVG_NS, tag);
    if (type !== undefined) el.setAttribute('type', type);
    return el;
  };
  return [
    html('script'), html('style'), html('SCRIPT'), html('div'), html('a'), html('span'),
    html('input'), html('input', 'submit'), html('input', 'button'), html('input', 'reset'),
    html('input', 'SUBMIT'), html('input', 'Reset'), html('input', 'text'), html('input', ''),
    html('input', ' submit'), html('button', 'submit'), html('textarea'),
    svg('style'), svg('script'), svg('svg'), svg('path'), svg('input', 'submit'), svg('input', 'SUBMIT'),
  ];
};

describe('chatAppSuiteSetup -- the text-query shortcut answers what jsdom answers', () => {
  for (const selector of SELECTORS) {
    it(`"${selector}"`, () => {
      const root = document.createElement('div');
      const els = elements();
      root.append(...els);
      document.body.append(root);
      for (const el of els) {
        expect({ el: el.outerHTML, ns: el.namespaceURI, matches: fastMatches.call(el, selector) })
          .toEqual({ el: el.outerHTML, ns: el.namespaceURI, matches: jsdomMatches.call(el, selector) });
      }
      root.remove();
    });
  }

  it('leaves elements of XML documents to jsdom', () => {
    const xml = document.implementation.createDocument(null, 'root', null);
    const input = xml.createElementNS('http://www.w3.org/1999/xhtml', 'input');
    input.setAttribute('type', 'SUBMIT');
    xml.documentElement.append(input);
    for (const selector of SELECTORS) {
      expect(fastMatches.call(input, selector)).toBe(jsdomMatches.call(input, selector));
    }
  });

  it('is installed, and leaves every other selector to jsdom', () => {
    expect(Element.prototype.matches).toBe(fastMatches);
    const a = document.createElement('a');
    a.setAttribute('href', '/x');
    expect(a.matches('a[href]')).toBe(true);
    expect(a.matches('button')).toBe(false);
  });
});
