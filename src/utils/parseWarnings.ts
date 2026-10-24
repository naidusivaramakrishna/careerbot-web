import { toast } from "sonner";

// careerbot-ai (Oct 2026): scanned PDFs are OCR'd with a time budget. When it runs out, the
// unread pages are missing from the result and this warning is added (and never cached).
export const OCR_OUT_OF_TIME_WARNING_CODE = "W_OCR_PAGES_OUT_OF_TIME";

export const OCR_OUT_OF_TIME_ACTION =
  "Upload the file again to retry the unread pages, or re-export the resume as a text-based PDF or DOCX.";

export interface OcrOutOfTimeWarning {
  code: string;
  message: string;
  action: string;
}

function warningList(parsed: unknown, key: "parse_warnings" | "warnings"): unknown[] {
  if (!parsed || typeof parsed !== "object") return [];
  const value = (parsed as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

/** Returns the OCR out-of-time warning from parsed resume data, or null when there is none. */
export function findOcrOutOfTimeWarning(parsed: unknown): OcrOutOfTimeWarning | null {
  const all = [...warningList(parsed, "parse_warnings"), ...warningList(parsed, "warnings")];
  for (const item of all) {
    if (!item || typeof item !== "object") continue;
    const w = item as Record<string, unknown>;
    if (w.code !== OCR_OUT_OF_TIME_WARNING_CODE) continue;
    return {
      code: OCR_OUT_OF_TIME_WARNING_CODE,
      message:
        typeof w.message === "string" && w.message.trim()
          ? w.message
          : "OCR ran out of time on some scanned pages — their content is missing from this result",
      action: OCR_OUT_OF_TIME_ACTION,
    };
  }
  return null;
}

/**
 * Call right after a resume parse. Shows the warning (with how to retry) when OCR ran out of time
 * and some scanned pages are missing from the result. Returns true when a warning was shown.
 */
export function notifyOcrOutOfTime(parsed: unknown): boolean {
  const warning = findOcrOutOfTimeWarning(parsed);
  if (!warning) return false;
  toast.warning(`${warning.message.replace(/\.$/, "")}. ${warning.action}`, { duration: 12000 });
  return true;
}
