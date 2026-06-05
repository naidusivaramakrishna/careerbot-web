/**
 * Idempotency-Key minter for cover-letter generation requests.
 *
 * The key prevents duplicate AI billing on retries: a second
 * /generate POST with the SAME key + same caller returns the
 * cached response in ~110 ms instead of re-running the LLM
 * (backend §API-3.4 / Codex P1 #6).
 *
 * Key lifecycle (wireframes §B.4, impl blueprint §8.B):
 *   - Minted ONCE per submission attempt (in the form's onSubmit).
 *   - Bound to the in-flight mutation object via useRef — NOT to
 *     form state — so a form-edit-during-flight cannot race-clear
 *     the key the in-flight retry uses.
 *   - On a FRESH submission (user edited the form and clicked
 *     Generate again), mint a NEW key.
 *   - On a manual Retry button after 5xx: re-use the SAME key →
 *     backend cache hit.
 *   - NEVER persisted to localStorage (would break the "different
 *     submission = different key" contract across sessions).
 */
export function mintIdempotencyKey(userId: string): string {
  if (!userId) {
    // Defensive: a missing userId would let two different users
    // collide on the same key. Throwing is safer than minting an
    // unscoped key — the form should never submit without auth.
    throw new Error("mintIdempotencyKey requires a non-empty userId");
  }
  return `cl-${userId}-${randomUuid()}`;
}

/**
 * crypto.randomUUID is available in all modern browsers + Node 18+.
 * The fallback path uses crypto.getRandomValues to construct a
 * RFC-4122 v4 UUID by hand — covers any pre-2022 browser without
 * pulling in a dependency.
 */
function randomUuid(): string {
  const c =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    // RFC 4122 v4: set bits per spec
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return (
      hex.slice(0, 4).join("") +
      "-" +
      hex.slice(4, 6).join("") +
      "-" +
      hex.slice(6, 8).join("") +
      "-" +
      hex.slice(8, 10).join("") +
      "-" +
      hex.slice(10, 16).join("")
    );
  }
  // Final fallback — non-crypto Math.random. NEVER reached in a
  // real browser or Node 14+ environment. Logged at module init
  // time only if someone wires this on a very old runtime.
  return "noncrypto-" + Math.random().toString(36).slice(2, 14);
}
