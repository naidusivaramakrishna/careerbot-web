/**
 * Builds a query string from a params object, omitting undefined/null/empty-string values.
 * Returns `?key=val&...` or `''` when there are no params.
 *
 * Note: numeric 0 and boolean false ARE serialized (unlike the original per-call
 * truthiness guards that skipped them). Current callers only pass typed string/number
 * params where 0 is not meaningful, so there is no behavioural impact today.
 */
export function buildQueryString(params: object | undefined): string {
    if (!params) return '';
    const q = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
            q.append(key, String(val));
        }
    }
    const qs = q.toString();
    return qs ? `?${qs}` : '';
}
