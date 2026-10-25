/**
 * Does a suggested rewrite still contain a blank for a number only the user knows?
 *
 * The AI writes rewrites with deliberate blanks because it will not invent
 * figures: "improving data quality by n%", "handle n+ concurrent users", "$n".
 * Applying such a fix makes the server answer 409 needs_value and the app asks the
 * person for the number. "Apply all fixes" uses this to know which fixes will
 * interrupt it with that question, so they can be left to the end instead of
 * stopping the run half way.
 */
const BLANK = /(?:^|[^A-Za-z0-9$])(?:n%|n\+|\$n)(?![A-Za-z0-9])/i;

export function hasMetricBlank(text: unknown): boolean {
  return typeof text === "string" && BLANK.test(text);
}
