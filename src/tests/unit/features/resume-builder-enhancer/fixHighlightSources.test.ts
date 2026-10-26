import { describe, it, expect, beforeEach } from "vitest";
import { unitsWritingText } from "@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights";
import { setBuilderFixUnits, clearBuilderFixUnits } from "@/app/(resume)/builder/creation/_lib/builderFixHighlights";

const units = [
  { key: "workExperience.0.description", text: "Built REST APIs serving 2M requests per day. Cut latency by 30%." },
  { key: "skills.0", text: "Python, Java" },
];

describe("unitsWritingText (fixes made when the resume was uploaded)", () => {
  it("finds the text the server says a fix wrote, where it is in the resume", () => {
    const found = unitsWritingText(units, "Cut latency by 30%.");
    expect(found).toEqual([{ key: "workExperience.0.description", text: "Cut latency by 30%." }]);
  });

  it("ignores spacing differences", () => {
    expect(unitsWritingText(units, "Cut  latency   by 30%.")).toHaveLength(1);
  });

  it("paints nothing when the text is not in the resume, or is too short to be unique", () => {
    expect(unitsWritingText(units, "Led a team of ten engineers.")).toEqual([]);
    expect(unitsWritingText(units, "Java")).toEqual([]);
    expect(unitsWritingText(units, undefined)).toEqual([]);
  });
});

describe("builder fix highlights store", () => {
  beforeEach(() => clearBuilderFixUnits());

  it("keeps a fix's text until it is cleared", () => {
    setBuilderFixUnits("fix-1", [{ key: "a", text: "added text here" }]);
    setBuilderFixUnits("fix-1", null);
    // clearing a fix that is not there is a no-op, not an error
    expect(() => setBuilderFixUnits("missing", null)).not.toThrow();
  });
});
