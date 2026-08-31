/**
 * Append an AI suggestion into a contentEditable as a list bullet.
 *
 * ONE implementation, imported by every section editor. It used to be copied
 * into seven of them, and all seven carried the same sink:
 *
 *     const text = suggestion.replace(/<[^>]*>/g, '').trim();
 *     el.innerHTML = `<ul><li>${text}</li></ul>`;
 *
 * That regex only matches a '<' that HAS a closing '>', so an unclosed tag
 * survives it byte-for-byte. '<img src=x onerror=alert(document.cookie)' comes
 * out of .replace() unchanged, the template hands it to the HTML parser, and
 * the parser resolves it into a live <img> whose handler fires.
 *
 * The payload path is not theoretical: `suggestion` is AI text derived from an
 * uploaded resume, and the caller writes el.innerHTML straight back into the
 * SAVED resume afterwards, so it persisted rather than lasting one render.
 *
 * Nodes are built, never interpolated. Keeping this in one place is half the
 * fix: seven copies meant seven chances to reintroduce it, and the eighth
 * section someone adds would have copied a vulnerable one.
 */
export function appendSuggestionBullet(el: HTMLElement, suggestion: string): void {
  const text = suggestion.replace(/<[^>]*>/g, '').trim();
  const current = el.innerHTML.trim();

  const li = document.createElement('li');
  li.textContent = text;

  if (!current || current === '<br>') {
    el.innerHTML = '';
    const ul = document.createElement('ul');
    ul.appendChild(li);
    el.appendChild(ul);
    return;
  }

  const uls = el.getElementsByTagName('ul');
  if (uls.length > 0) {
    uls[uls.length - 1].appendChild(li);
    return;
  }

  const ul = document.createElement('ul');
  ul.appendChild(li);
  el.appendChild(ul);
}
