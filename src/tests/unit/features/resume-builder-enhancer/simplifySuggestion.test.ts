import { describe, it, expect } from "vitest";
import { simplifySuggestion } from "@/app/(resume)/builder/creation/_components/score/ScoreTab";

describe("simplifySuggestion", () => {
  it("drops the repeated project title and keeps the entry and the plain advice", () => {
    expect(
      simplifySuggestion("Project 1 'Proactive Dropout Mitigation for School Student Success': no company. Add where you built it."),
    ).toEqual({ entry: "Project 1", text: "No company. Add where you built it." });
  });

  it("works for other entries and double quotes", () => {
    expect(simplifySuggestion('Internship 2 "Data Intern": no duration. Add how long it ran.')).toEqual({
      entry: "Internship 2",
      text: "No duration. Add how long it ran.",
    });
  });

  it("leaves an ordinary suggestion as it is (first letter capitalised)", () => {
    expect(simplifySuggestion("add quantified results to achievements")).toEqual({
      entry: undefined,
      text: "Add quantified results to achievements",
    });
  });
});
