import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JobMatchTemplateThree from "@/app/(jobs)/jobmatch/_components/resume/JobMatchTemplateThree";
import JobMatchTemplate from "@/app/(jobs)/jobmatch/_components/resume/JobMatchTemplate";
import JobMatchSectionEditor from "@/app/(jobs)/jobmatch/_components/resume/JobMatchSectionEditor";
import ATSResumePreview from "@/app/(resume)/atslogin/_components/ATSResumePreview";
import { getEducationScore, withEducationScoreValue } from "@/utils/resumeMappers";

afterEach(cleanup);

// The resume builder persists an education score ONLY as scoreValue/scoreType
// (stored snake_case as score_value/score_type; careerbot-api's builder
// Education schema drops every other score key on save). JobMatch reads that
// same stored document.
const builderEdu = { school: "State University", degree: "B.Tech", scoreType: "CGPA", scoreValue: "8.5" };
const withEducation = (education: unknown[]) => ({ education });

describe("JobMatch preview (JobMatchTemplateThree) education score", () => {
  it("shows a builder-saved scoreValue/scoreType score", () => {
    render(<JobMatchTemplateThree data={withEducation([builderEdu])} />);
    expect(screen.getByText("CGPA: 8.5")).toBeTruthy();
  });

  it("adds the % suffix the builder stores without", () => {
    render(<JobMatchTemplateThree data={withEducation([{ ...builderEdu, scoreType: "Percentage", scoreValue: "86" }])} />);
    expect(screen.getByText("Percentage: 86%")).toBeTruthy();
  });

  it("reads the snake_case keys the API stores after a PATCH (score_type/score_value)", () => {
    render(<JobMatchTemplateThree data={withEducation([{ school: "X", degree: "M.Sc", score_type: "Percentage", score_value: "78" }])} />);
    expect(screen.getByText("Percentage: 78%")).toBeTruthy();
  });

  it("control: parser-only legacy aliases still render as before", () => {
    render(<JobMatchTemplateThree data={withEducation([
      { school: "A", degree: "B.Sc", cgpa: "7.9" },
      { school: "B", degree: "XII", percentage: "91", gradeType: "Percentage" },
    ])} />);
    expect(screen.getByText("Grade: 7.9")).toBeTruthy();
    expect(screen.getByText("Percentage: 91")).toBeTruthy();
  });
});

describe("other education score readers", () => {
  it("JobMatchTemplate shows a builder-saved score", () => {
    render(<JobMatchTemplate data={withEducation([builderEdu])} />);
    expect(screen.getByText("Grade: 8.5")).toBeTruthy();
  });

  it("control: JobMatchTemplate keeps legacy aliases", () => {
    render(<JobMatchTemplate data={withEducation([{ school: "B", degree: "XII", percentage: "91" }])} />);
    expect(screen.getByText("Grade: 91")).toBeTruthy();
  });

  it("ATSResumePreview shows a builder-saved score", () => {
    render(<ATSResumePreview data={{ parsed_data: withEducation([builderEdu]) }} />);
    expect(screen.getByText("CGPA 8.5")).toBeTruthy();
  });
});

describe("JobMatch section editor education score field", () => {
  function renderEduEditor(initialData: unknown[]) {
    const onSave = vi.fn();
    render(
      <JobMatchSectionEditor sectionKey="education" sectionLabel="Education" initialData={initialData} onSave={onSave} onClose={vi.fn()} />
    );
    return { onSave, field: screen.getByPlaceholderText("e.g. 8.5 CGPA") as HTMLInputElement };
  }

  it("shows the builder-saved score and writes edits back to scoreValue", () => {
    const { onSave, field } = renderEduEditor([builderEdu]);
    expect(field.value).toBe("8.5");

    fireEvent.change(field, { target: { value: "9.1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const [, saved] = onSave.mock.calls[0];
    expect(saved[0]).toMatchObject({ scoreType: "CGPA", scoreValue: "9.1" });
    expect(saved[0]).not.toHaveProperty("grade");
  });

  it("control: an edit to a legacy-alias score shows in the preview", () => {
    const { onSave, field } = renderEduEditor([{ school: "A", degree: "B.Sc", cgpa: "7.9" }]);
    expect(field.value).toBe("7.9");

    fireEvent.change(field, { target: { value: "8.0" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const [, saved] = onSave.mock.calls[0];
    cleanup();
    render(<JobMatchTemplateThree data={withEducation(saved)} />);
    expect(screen.getByText("Grade: 8.0")).toBeTruthy();
  });
});

describe("getEducationScore / withEducationScoreValue", () => {
  it("falls back to aliases when scoreValue is empty, and unwraps parser shapes", () => {
    expect(getEducationScore({ scoreValue: "", cgpa: 8.2 }).value).toBe("8.2");
    expect(getEducationScore({ grade: { value: "A" } }).value).toBe("A");
    expect(getEducationScore({ scoreType: "Percentage", scoreValue: "86%" }).display).toBe("86%");
    expect(getEducationScore(null)).toEqual({ type: "", value: "", display: "" });
  });

  it("clearing an edited score removes it instead of resurfacing a stale alias", () => {
    const cleared = withEducationScoreValue({ ...builderEdu, grade: "7", score_value: "7" }, "");
    expect(getEducationScore(cleared).value).toBe("");
    expect(cleared).toMatchObject({ scoreType: "CGPA", school: "State University" });
  });
});
