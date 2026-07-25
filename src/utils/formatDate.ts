import { format } from "date-fns";

function parseDate(value?: string | Date): Date | "Present" | null {
  if (!value) return null;
  if (typeof value === "string") {
    if (value.trim().toLowerCase() === "present") return "Present";
    const trimmed = value.trim();
    // Normalize date-only strings to noon UTC so local-time rendering never crosses
    // a month boundary in any UTC offset (UTC-12 to UTC+14).
    // YYYY-MM: anchor to day 15 to also prevent a month-end day boundary shift.
    const toparse = /^\d{4}-\d{2}$/.test(trimmed)
      ? trimmed + "-15T12:00:00Z"
      : /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? trimmed + "T12:00:00Z"
        : trimmed;
    const parsed = new Date(toparse);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return isNaN(value.getTime()) ? null : value;
}

export function formatDateRange(start?: string | Date, end?: string | Date): string {
  if (!start) return "";

  const parsedStart = parseDate(start);
  const parsedEnd = parseDate(end);

  // "present" as a start is degenerate — no meaningful range to render
  if (parsedStart === "Present") return "";

  const formattedStart = parsedStart instanceof Date
    ? format(parsedStart, "MMM yyyy")
    : typeof start === "string" ? start : "";

  // Invalid Date object start resolves to "" — no meaningful range to render
  if (!formattedStart) return "";

  const formattedEnd = !end || parsedEnd === "Present"
    ? "Present"
    : parsedEnd instanceof Date
      ? format(parsedEnd, "MMM yyyy")
      : typeof end === "string" ? end
      // Invalid Date object — fall back to "Present" so the range reads as open/ongoing
      : "Present";

  return `${formattedStart} – ${formattedEnd}`;
}
