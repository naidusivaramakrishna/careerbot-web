import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { findOcrOutOfTimeWarning, notifyOcrOutOfTime, OCR_OUT_OF_TIME_ACTION } from "@/utils/parseWarnings";

vi.mock("sonner", () => ({ toast: { warning: vi.fn() } }));

describe("findOcrOutOfTimeWarning", () => {
  it("finds the warning in parse_warnings or warnings", () => {
    const w = { code: "W_OCR_PAGES_OUT_OF_TIME", message: "pages 2, 3 missing", severity: "warning", field: null };
    expect(findOcrOutOfTimeWarning({ parse_warnings: [w] })).toEqual({
      code: "W_OCR_PAGES_OUT_OF_TIME",
      message: "pages 2, 3 missing",
      action: OCR_OUT_OF_TIME_ACTION,
    });
    expect(findOcrOutOfTimeWarning({ warnings: [w] })?.message).toBe("pages 2, 3 missing");
  });

  it("returns null for other warnings and bad input", () => {
    expect(findOcrOutOfTimeWarning({ warnings: [{ code: "W_X" }] })).toBeNull();
    expect(findOcrOutOfTimeWarning(undefined)).toBeNull();
    expect(findOcrOutOfTimeWarning({ warnings: "nope" })).toBeNull();
  });
});

describe("notifyOcrOutOfTime", () => {
  it("shows a warning toast with the retry action only when the warning is present", () => {
    expect(notifyOcrOutOfTime({ warnings: [] })).toBe(false);
    expect(toast.warning).not.toHaveBeenCalled();
    expect(notifyOcrOutOfTime({ warnings: [{ code: "W_OCR_PAGES_OUT_OF_TIME", message: "pages 2 missing." }] })).toBe(true);
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining(OCR_OUT_OF_TIME_ACTION), expect.any(Object));
  });
});
