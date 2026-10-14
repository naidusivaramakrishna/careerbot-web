/**
 * A rescan of the original file reuses the saved record's ID, and the browser keeps
 * that resume's green "fixed" cards and text highlights under the same ID. These
 * helpers are what make the rescan start clean.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { clearStoredFixedSuggestions } from "@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage";
import { forgetFixedTextFor } from "@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights";

const CARDS = "careerbot:enhanced-fixed-suggestions:";
const TEXT = "ats-fixed-text:";

describe("forgetting a resume's stored fixes", () => {
  beforeEach(() => window.localStorage.clear());

  it("removes that resume's fixed cards and highlights, and only those", () => {
    window.localStorage.setItem(`${CARDS}enh-1`, "[]");
    window.localStorage.setItem(`${CARDS}enh-2`, "[]");
    window.localStorage.setItem(`${TEXT}enh-1`, "{}");
    window.localStorage.setItem(`${TEXT}enh-2`, "{}");

    clearStoredFixedSuggestions("enh-1");
    forgetFixedTextFor("enh-1");

    expect(window.localStorage.getItem(`${CARDS}enh-1`)).toBeNull();
    expect(window.localStorage.getItem(`${TEXT}enh-1`)).toBeNull();
    expect(window.localStorage.getItem(`${CARDS}enh-2`)).not.toBeNull();
    expect(window.localStorage.getItem(`${TEXT}enh-2`)).not.toBeNull();
  });

  it("does nothing without an ID", () => {
    window.localStorage.setItem(`${CARDS}enh-1`, "[]");
    clearStoredFixedSuggestions(undefined);
    expect(window.localStorage.getItem(`${CARDS}enh-1`)).not.toBeNull();
  });
});
