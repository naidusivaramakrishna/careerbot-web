import { describe, expect, it } from "vitest";
import { isSameCardStillPending } from "@/app/(resume)/builder/creation/_utils/suggestionSection";

const card = (over: Record<string, unknown> = {}) => ({
  id: "contact_issue_0", section: "Contact", fix_type: "manual",
  message: "Missing LinkedIn profile", status: "pending", ...over,
});

describe("isSameCardStillPending", () => {
  it("is true for a card that is still pending and says the same thing", () => {
    expect(isSameCardStillPending([card()], card())).toBe(true);
  });

  it("is false once the card is gone from the latest scan", () => {
    expect(isSameCardStillPending([card({ id: "other" })], card())).toBe(false);
    expect(isSameCardStillPending([], card())).toBe(false);
  });

  it("is false once the card is already fixed", () => {
    expect(isSameCardStillPending([card({ status: "fixed" })], card())).toBe(false);
  });

  it("is false when the id was renumbered to a different problem", () => {
    // LinkedIn was fixed, so careerbot-ai now calls the GitHub problem contact_issue_0.
    expect(isSameCardStillPending([card({ message: "Missing GitHub profile" })], card())).toBe(false);
  });
});
