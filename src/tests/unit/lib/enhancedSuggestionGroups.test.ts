import { describe, it, expect } from "vitest";
import {
  withoutPendingChildrenOfFixedBulkSuggestions,
} from "@/app/(resume)/builder/creation/_utils/enhancedSuggestionGroups";
import type { EnhancedSuggestion } from "@/types/api.types";

const suggestion = (
  id: string,
  message: string,
  fixType: EnhancedSuggestion["fix_type"] = "auto",
  status: EnhancedSuggestion["status"] = "pending",
  section = "Skills",
): EnhancedSuggestion => ({ id, message, fix_type: fixType, status, section });

describe("withoutPendingChildrenOfFixedBulkSuggestions", () => {
  const children = [
    suggestion("kubernetes", "Add 'Kubernetes' to Technical Skills"),
    suggestion("docker", "Add 'Docker' to Technical Skills"),
    suggestion("aws", "Add 'AWS' to Technical Skills"),
  ];

  it("removes covered pending children after Fix All succeeds", () => {
    const result = withoutPendingChildrenOfFixedBulkSuggestions([
      suggestion("cloud", "Add cloud platform experience", "manual"),
      ...children,
      suggestion("terraform", "Add 'Terraform' to Technical Skills"),
      suggestion("fix-all", "Add all at once: 'Kubernetes', 'Docker', 'AWS'", "auto", "fixed"),
    ]);

    expect(result.map(item => item.id)).toEqual(["cloud", "terraform", "fix-all"]);
  });

  it("restores children when the grouped fix is undone", () => {
    const result = withoutPendingChildrenOfFixedBulkSuggestions([
      ...children,
      suggestion("fix-all", "Add all at once: 'Kubernetes', 'Docker', 'AWS'"),
    ]);

    expect(result.map(item => item.id)).toEqual(["kubernetes", "docker", "aws", "fix-all"]);
  });

  it("does not hide independently fixed or differently-sectioned cards", () => {
    const result = withoutPendingChildrenOfFixedBulkSuggestions([
      suggestion("docker", "Add 'Docker' to Technical Skills", "auto", "fixed"),
      suggestion("aws-project", "Add 'AWS' to Technical Skills", "auto", "pending", "Projects"),
      suggestion("fix-all", "Add all at once: 'Docker', 'AWS'", "auto", "fixed"),
    ]);

    expect(result.map(item => item.id)).toEqual(["docker", "aws-project", "fix-all"]);
  });

  // Terms decide whether a card is HIDDEN, so punctuation must survive
  // normalisation: stripping it collapses "C++", "C#" and "C" onto one token
  // and a still-applicable recommendation disappears behind an unrelated one.
  it.each([
    ["C#", "C++"],
    [".NET", "Net Core"],
    ["Node.js", "Node"],
  ])("keeps a pending '%s' card that a fixed bulk fix for '%s' does not cover", (pending, covered) => {
    const result = withoutPendingChildrenOfFixedBulkSuggestions([
      suggestion("pending-term", `Add '${pending}' to Technical Skills`),
      suggestion("fix-all", `Add all at once: '${covered}'`, "auto", "fixed"),
    ]);

    expect(result.map(item => item.id)).toEqual(["pending-term", "fix-all"]);
  });

  it("still hides a child whose term matches apart from case and spacing", () => {
    const result = withoutPendingChildrenOfFixedBulkSuggestions([
      suggestion("node", "Add '  node.JS ' to Technical Skills"),
      suggestion("fix-all", "Add all at once: 'Node.js'", "auto", "fixed"),
    ]);

    expect(result.map(item => item.id)).toEqual(["fix-all"]);
  });
});
