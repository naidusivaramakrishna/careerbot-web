import { format } from "date-fns";

export function formatDateRange(start?: string | Date, end?: string | Date): string {
  if (!start) return "";

  const formattedStart = format(new Date(start), "MMM yyyy");
  const formattedEnd = end ? format(new Date(end), "MMM yyyy") : "Present";

  return `${formattedStart} – ${formattedEnd}`;
}
