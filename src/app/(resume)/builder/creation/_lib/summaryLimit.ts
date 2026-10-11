// The Professional Summary limit is on the text a reader SEES: 2000 characters.
// Formatting markup (bullets, numbering, bold) does not count, so a full summary
// can still be turned into a list. The API applies the same rule (see
// summary_visible_length in the backend's resume_builder_service/schemas.py) and
// only keeps a larger ceiling on the stored HTML so storage stays bounded.
export const SUMMARY_MAX_LENGTH = 2000;
/** The counter turns to a warning from here. */
export const SUMMARY_WARN_AT = 1900;
/** Ceiling on the stored HTML (text plus markup); mirrors SUMMARY_MAX_STORED_CHARS in the API. */
export const SUMMARY_MAX_STORED_LENGTH = 8000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntity(entity: string): string {
  if (entity[0] === "#") {
    const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "?";
  }
  return NAMED_ENTITIES[entity.toLowerCase()] ?? "?";
}

/** Characters a reader sees in the summary HTML: tags dropped, entities decoded ("&amp;" is 1). */
export function summaryVisibleLength(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g, (_, e: string) => decodeEntity(e));
  return Array.from(text).length;
}

const TRAILING_LINE_BREAKS = /[\r\n]+$/;

/**
 * Longest prefix of pasted plain `text` that still fits in `room` visible
 * characters. Line breaks are formatting, not characters, so they are free.
 * Never cuts a surrogate pair.
 */
export function clipTextToRoom(text: string, room: number): string {
  if (room <= 0) return "";
  let used = 0;
  let end = 0;
  for (const ch of text) {
    const cost = ch === "\n" || ch === "\r" ? 0 : 1;
    if (used + cost > room) break;
    used += cost;
    end += ch.length;
  }
  const clipped = text.slice(0, end);
  // A cut that leaves a dangling line break would add a stray empty line.
  return end < text.length ? clipped.replace(TRAILING_LINE_BREAKS, "") : clipped;
}
