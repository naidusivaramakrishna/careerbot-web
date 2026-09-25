import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnalysisContent from "@/app/(jobs)/jobmatch/_components/analysis/AnalysisContent";
import JobMatchTemplateThree from "@/app/(jobs)/jobmatch/_components/resume/JobMatchTemplateThree";
import { matcherEnhanceApply, matcherEnhanceRemove } from "@/api/parserApi";
import { toast } from "sonner";

vi.mock("@/api/parserApi", () => ({ matcherEnhanceApply: vi.fn(), matcherEnhanceRemove: vi.fn(), matcherUpdateSections: vi.fn(), downloadResumePdf: vi.fn() }));
vi.mock("@/app/(jobs)/jobmatch/_components/resume/ResumePreview", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (p: any) => <pre data-testid="preview">{JSON.stringify({ certifications: p.editOverrides?.certifications, experience: p.editOverrides?.experience, added: p.addedFields })}</pre>,
}));
vi.mock("@/app/(jobs)/jobmatch/_components/resume/JobMatchSectionEditor", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, score_diff: { after: 83 } });
  vi.mocked(matcherEnhanceRemove).mockResolvedValue({ score_diff: { after: 78 } });
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.clearAllMocks(); });

const parsedResumeData = {
  id: "resume-test",
  parsed_data: {
    contact: { name: "Test Candidate" },
    skills: ["React"],
    summary: "Developer",
    certifications: [
      { name: "AWS Certified Solutions Architect - Associate", issuedBy: "AWS" },
      "Certified Kubernetes Administrator (CKA)",
    ],
    experience: [{ company: "Acme", role: "Engineer", responsibilities: ["Built APIs"] }],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderWithPenalty(penalty: Record<string, any>) {
  return render(
    <AnalysisContent
      jdText="A role requiring stakeholder management."
      onBackToUpload={vi.fn()}
      parsedResumeData={parsedResumeData}
      matchResults={{ data: { id: "match-test", ats_score: 78, resume_id: "resume-test", match_result: { Match_Penalties: { penalties: [penalty] } } } }}
    />
  );
}

const preview = () => JSON.parse(screen.getByTestId("preview").textContent ?? "{}");

describe("additive fixes reach the resume preview", () => {
  it("shows an applied missing certification and removes it again on undo (API confirms the write)", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, resume_updated: true, score_diff: { after: 83 } });
    renderWithPenalty({
      suggestion_id: "suggest_add_cert_1", category: "certifications", target: "CBAP certification",
      fix_type: "auto", severity: "critical", penalty: -4.75,
      message: "Add 'CBAP certification' to your resume — this required certification is missing and costs ~4.8 pts.",
    });
    expect(preview().certifications).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitFor(() => expect(preview().certifications).toContain("CBAP certification"));
    expect(preview().certifications).toHaveLength(3);
    expect(preview().added.certifications).toEqual(["2"]);

    fireEvent.click(await screen.findByRole("button", { name: "Undo applied fix" }));
    await waitFor(() => expect(preview().certifications).not.toContain("CBAP certification"));
    expect(preview().certifications).toHaveLength(2);
    expect(preview().added.certifications ?? []).toEqual([]);
  });

  it("shows a generated capability bullet in the first experience entry and removes it on undo", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, resume_updated: true, score_diff: { after: 83 } });
    renderWithPenalty({
      suggestion_id: "combined_fix_1", category: "capabilities", fix_type: "auto", severity: "important", penalty: -1.2,
      message: "Demonstrate stakeholder workshops",
      after_example: "Led stakeholder workshops that cut delivery time by 20%", mapping_section: "experience",
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitFor(() => expect(preview().experience[0].responsibilities).toHaveLength(2));
    expect(preview().experience[0].responsibilities[1]).toBe("Led stakeholder workshops that cut delivery time by 20%");
    expect(preview().added.experience).toEqual(["0"]);

    fireEvent.click(await screen.findByRole("button", { name: "Undo applied fix" }));
    await waitFor(() => expect(preview().experience[0].responsibilities).toEqual(["Built APIs"]));
  });
});

// careerbot-api's POST /matcher/enhance/apply reports `resume_updated: false`
// when it wrote nothing to the stored resume (job_matcher.py: `_resume_updated
// = bool(_text_written or _added_skills)`). Two payloads hit that:
//  - a bare capability gap from the AI layer (penalties.py: suggest_demonstrate_N
//    with only `target`), which resolves no resume edit on the API;
//  - suggest_add_cert_N against an API version that has no certification write
//    (versions with add_resume_certification report `resume_updated: true`).
// A response that does not say the resume was updated is treated the same way
// for certifications. The row must not claim "Added" and the preview must not
// show text the backend never saved.
describe("fixes the backend did not write to the resume", () => {
  const waitForOutcome = () =>
    waitFor(() => {
      const undo = screen.queryByRole("button", { name: "Undo applied fix" });
      expect(undo !== null || vi.mocked(toast.info).mock.calls.length > 0).toBe(true);
    });

  it("does not mark a bare capability gap as added when nothing could be mirrored", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, resume_updated: false, score_diff: { after: 80 } });
    renderWithPenalty({
      suggestion_id: "suggest_demonstrate_3", category: "capabilities", target: "stakeholder management",
      fix_type: "auto", severity: "important", penalty: -1.5,
      message: "Add experience that demonstrates 'stakeholder management' (~1.5 pts).",
    });
    const before = preview();

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitForOutcome();
    expect(screen.queryByRole("button", { name: "Undo applied fix" })).toBeNull();
    expect(toast.info).toHaveBeenCalled();
    expect(preview()).toEqual(before);
  });

  it("does not add a certification to the preview when the backend reports no resume change", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, resume_updated: false, score_diff: { after: 83 } });
    renderWithPenalty({
      suggestion_id: "suggest_add_cert_1", category: "certifications", target: "CBAP certification",
      fix_type: "auto", severity: "critical", penalty: -4.75, message: "Add 'CBAP certification'.",
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitForOutcome();
    expect(preview().certifications).toHaveLength(2);
    expect(preview().certifications).not.toContain("CBAP certification");
    expect(screen.queryByRole("button", { name: "Undo applied fix" })).toBeNull();
  });

  it("does not add a certification when the response does not say the resume was updated", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, score_diff: { after: 83 } });
    renderWithPenalty({
      suggestion_id: "suggest_add_cert_1", category: "certifications", target: "CBAP certification",
      fix_type: "auto", severity: "critical", penalty: -4.75, message: "Add 'CBAP certification'.",
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitForOutcome();
    expect(preview().certifications).toHaveLength(2);
    expect(preview().certifications).not.toContain("CBAP certification");
    expect(screen.queryByRole("button", { name: "Undo applied fix" })).toBeNull();
  });

  // The score change above is persisted server-side, and the API keeps no
  // `_applied_suggestions` entry for a fix that resolved no resume edit, so
  // enhance/remove would 404. The row must not fall back to "Apply Fix" (as
  // if nothing happened) nor offer an Undo that cannot work.
  it("keeps an applied-but-not-in-preview fix marked as applied, without Undo", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, resume_updated: false, score_diff: { after: 83 } });
    renderWithPenalty({
      suggestion_id: "suggest_add_cert_1", category: "certifications", target: "CBAP certification",
      fix_type: "auto", severity: "critical", penalty: -4.75, message: "Add 'CBAP certification'.",
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Applied/ })).toBeTruthy());
    const button = screen.getByRole("button", { name: /Applied/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Apply Fix" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Undo applied fix" })).toBeNull();
    fireEvent.click(button);
    expect(matcherEnhanceApply).toHaveBeenCalledTimes(1);
    expect(preview().certifications).toHaveLength(2);
  });

  it("still mirrors a certification the backend says it wrote", async () => {
    vi.mocked(matcherEnhanceApply).mockResolvedValue({ applied: true, resume_updated: true, score_diff: { after: 83 } });
    renderWithPenalty({
      suggestion_id: "suggest_add_cert_1", category: "certifications", target: "CBAP certification",
      fix_type: "auto", severity: "critical", penalty: -4.75, message: "Add 'CBAP certification'.",
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommendations" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Fix" }));

    await waitFor(() => expect(preview().certifications).toContain("CBAP certification"));
    expect(await screen.findByRole("button", { name: "Undo applied fix" })).toBeTruthy();
  });
});

describe("resume template renders fix-added content", () => {
  it("lists every certification including the added one", () => {
    render(<JobMatchTemplateThree data={{ parsed_data: { contact: { name: "T" } } }} editOverrides={{ certifications: ["Certified Kubernetes Administrator (CKA)", "CBAP certification"] }} />);
    expect(screen.getByText("CBAP certification")).toBeTruthy();
    expect(screen.getByText("Certified Kubernetes Administrator (CKA)")).toBeTruthy();
  });

  it("shows bullets that only live in achievements next to a project or internship description", () => {
    render(
      <JobMatchTemplateThree
        data={{ parsed_data: { contact: { name: "T" } } }}
        editOverrides={{
          projects: [{ title: "Side project", description: "Built the thing", achievements: ["Led stakeholder workshops"] }],
          internships: [{ company: "Intern Co", description: "Assisted the team", responsibilities: ["Wrote reports"] }],
        }}
      />
    );
    expect(screen.getByText("Built the thing")).toBeTruthy();
    expect(screen.getByText("Led stakeholder workshops")).toBeTruthy();
    expect(screen.getByText("Assisted the team")).toBeTruthy();
    expect(screen.getByText("Wrote reports")).toBeTruthy();
  });

  // fixMirror.addBullet (like the API's append_resume_bullet) appends to the
  // entry's first existing bullet list, so a role with a description and a
  // responsibilities/details array gets the generated bullet in that array.
  it("shows experience bullets from responsibilities and details next to a description", () => {
    render(
      <JobMatchTemplateThree
        data={{ parsed_data: { contact: { name: "T" } } }}
        editOverrides={{
          experience: [
            { company: "Acme", role: "Engineer", description: "Owned the billing platform", responsibilities: ["Built APIs", "Led stakeholder workshops"] },
            { company: "Beta", role: "Analyst", description: "Reporting", details: ["Automated weekly reports"] },
          ],
        }}
      />
    );
    expect(screen.getByText("Owned the billing platform")).toBeTruthy();
    expect(screen.getByText("Led stakeholder workshops")).toBeTruthy();
    expect(screen.getByText("Automated weekly reports")).toBeTruthy();
  });

  it("shows project and internship bullets next to an HTML description", () => {
    render(
      <JobMatchTemplateThree
        data={{ parsed_data: { contact: { name: "T" } } }}
        editOverrides={{
          projects: [{ title: "Side project", description: "<p>Built the thing</p>", achievements: ["Led stakeholder workshops", "Built the thing"] }],
          internships: [{ company: "Intern Co", description: "<ul><li>Assisted the team</li></ul>", responsibilities: ["Wrote reports"] }],
        }}
      />
    );
    expect(screen.getByText("Built the thing")).toBeTruthy();
    expect(screen.getByText("Led stakeholder workshops")).toBeTruthy();
    expect(screen.getByText("Assisted the team")).toBeTruthy();
    expect(screen.getByText("Wrote reports")).toBeTruthy();
  });

  it("does not duplicate a bullet that is already in the description", () => {
    render(
      <JobMatchTemplateThree
        data={{ parsed_data: { contact: { name: "T" } } }}
        editOverrides={{ projects: [{ title: "P", description: ["Shipped v1", "Cut costs"], achievements: ["Cut costs"] }] }}
      />
    );
    expect(screen.getAllByText("Cut costs")).toHaveLength(1);
  });
});
