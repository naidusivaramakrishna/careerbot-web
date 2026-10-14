/**
 * Required-field marks on the domain section editors: a red asterisk on exactly the
 * fields Save enforces (the keys each editor passes to validateRequired), and no
 * plain-text "*" on fields that are not enforced.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";

const validateRequired = vi.fn((..._args: unknown[]) => true);
vi.mock("@/app/(resume)/builder/creation/_hooks/useValidation", () => ({
  useValidation: () => ({ validateRequired, clearError: vi.fn() }),
}));
vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({ resumeData: {}, setResumeData: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/api/resumeApi", () => ({ deleteResumeSectionItem: vi.fn() }));
vi.mock("@/api/enhancerApi", () => ({ deleteSectionItemFromEnhancedResume: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import ConferencePresentations from "@/app/(resume)/builder/creation/_components/editor/sections/ConferencePresentations";
import EditorialActivities from "@/app/(resume)/builder/creation/_components/editor/sections/EditorialActivities";
import ResearchGrants from "@/app/(resume)/builder/creation/_components/editor/sections/ResearchGrants";
import SeaServiceRecord from "@/app/(resume)/builder/creation/_components/editor/sections/SeaServiceRecord";

const cases: Array<[string, React.FC, string[]]> = [
  ["Conference Presentations", ConferencePresentations, ["Presentation Title", "Conference/Symposium Name"]],
  ["Editorial Activities", EditorialActivities, ["Activity Type", "Journal/Organization Name"]],
  ["Research Grants", ResearchGrants, ["Grant Title", "Funding Agency"]],
  ["Sea Service Record", SeaServiceRecord, ["Current Rank", "Rank Progression"]],
];

describe("domain section editors — required marks match what Save enforces", () => {
  beforeEach(() => validateRequired.mockClear());

  it.each(cases)("%s", (section, Editor, expectedMarked) => {
    const { container } = render(<Editor />);
    const labels = Array.from(container.querySelectorAll("label"));
    const marked = labels
      .filter((label) => label.querySelector("span.text-red-500")?.textContent === "*")
      .map((label) => label.textContent!.replace("*", "").trim());

    expect(marked).toEqual(expectedMarked);
    // No unstyled asterisk left on any other label.
    for (const label of labels) {
      if (!label.querySelector("span.text-red-500")) expect(label.textContent).not.toContain("*");
    }

    // The editor enforces exactly as many fields as it marks.
    const resultRef = { valid: true };
    act(() => {
      window.dispatchEvent(new CustomEvent("resume-validate-section", { detail: { section, resultRef } }));
    });
    expect(validateRequired).toHaveBeenCalledTimes(1);
    expect(Object.keys(validateRequired.mock.calls[0][2] as object)).toHaveLength(expectedMarked.length);
  });
});
