import { describe, expect, it } from "vitest";
import {
  SUMMARY_MAX_LENGTH,
  SUMMARY_MAX_STORED_LENGTH,
  clipTextToRoom,
  summaryVisibleLength,
} from "@/app/(resume)/builder/creation/_lib/summaryLimit";

describe("summaryLimit", () => {
  it("matches the backend's limits", () => {
    expect(SUMMARY_MAX_LENGTH).toBe(2000);
    expect(SUMMARY_MAX_STORED_LENGTH).toBe(8000);
  });

  describe("summaryVisibleLength", () => {
    it("ignores formatting markup", () => {
      expect(summaryVisibleLength("<b>Hi</b>")).toBe(2);
      expect(summaryVisibleLength("<ul><li>one</li><li>two</li></ul>")).toBe(6);
      expect(summaryVisibleLength("<ol><li><b>x</b></li></ol>")).toBe(1);
      expect(summaryVisibleLength("a<br>b")).toBe(2);
    });

    it("counts a decoded entity as one character", () => {
      expect(summaryVisibleLength("P&amp;L")).toBe(3);
      expect(summaryVisibleLength("a&nbsp;b")).toBe(3);
      expect(summaryVisibleLength("1 &lt; 2")).toBe(5);
      expect(summaryVisibleLength("&#169; 2026")).toBe(6);
    });

    it("counts an emoji as one character", () => {
      expect(summaryVisibleLength("a😀b")).toBe(3);
    });

    it("is the same whether or not the text is bulleted", () => {
      const lines = Array.from({ length: 10 }, () => "A".repeat(199));
      const plain = lines.join("<br>");
      const bulleted = `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
      expect(summaryVisibleLength(plain)).toBe(1990);
      expect(summaryVisibleLength(bulleted)).toBe(1990);
      expect(bulleted.length).toBeGreaterThan(SUMMARY_MAX_LENGTH);
    });
  });

  describe("clipTextToRoom", () => {
    it("keeps pasted text that fits and trims text that does not", () => {
      expect(clipTextToRoom("hello", 10)).toBe("hello");
      expect(clipTextToRoom("hello world", 5)).toBe("hello");
      expect(clipTextToRoom("hello", 0)).toBe("");
      expect(clipTextToRoom("hello", -3)).toBe("");
    });

    it("charges one per visible character and nothing for line breaks", () => {
      expect(clipTextToRoom("&&&", 2)).toBe("&&");
      expect(clipTextToRoom("a\nb\nc", 3)).toBe("a\nb\nc");
      expect(clipTextToRoom("a\nb\nc", 2)).toBe("a\nb");
    });

    it("never splits a surrogate pair", () => {
      expect(clipTextToRoom("a😀b", 1)).toBe("a");
      expect(clipTextToRoom("a😀b", 2)).toBe("a😀");
    });
  });
});
