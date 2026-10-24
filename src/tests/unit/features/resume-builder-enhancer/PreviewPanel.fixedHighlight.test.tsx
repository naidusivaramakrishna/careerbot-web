/**
 * ATS Scan: once an Auto/Manual Fix is applied, only the text it added is
 * highlighted green in the preview (CSS Custom Highlight API, screen only) --
 * never the whole section. Undo clears it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreviewPanel from "@/app/(resume)/builder/creation/_components/PreviewPanel";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { resetFixedTextBaselines } from "@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights";
import { markPreviewSection, previewSectionKey } from "@/app/(resume)/templates/_utils/previewSectionMarker";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({ useResume: vi.fn() }));
vi.mock("@/app/(resume)/builder/creation/_context/ScoreContext", () => ({
  useScore: () => ({ canonicalScore: null, setCanonicalScore: vi.fn() }),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useResumeScorePreview", () => ({
  useResumeScorePreview: () => ({ score: 0, breakdown: {} }),
}));
vi.mock("@/api/resumeApi", () => ({ downloadResume: vi.fn() }));
vi.mock("@/api/enhancerApi", () => ({ downloadEnhancedResume: vi.fn() }));
vi.mock("@/api/userApi", () => ({ getProfile: vi.fn().mockResolvedValue({ email: "t@example.com" }) }));
vi.mock("@/utils/careerLevelDetection", () => ({ detectCareerLevel: vi.fn(() => "mid") }));
vi.mock("@/app/(resume)/builder/creation/_utils/enhancedScore", () => ({
  getEnhancedCurrentScore: vi.fn(() => 0),
}));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateOne", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateTwo", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateThree", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateFour", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateFive", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template2", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template3", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template4", () => ({ default: () => null }));

const mockedUseResume = vi.mocked(useResume);

const registry = new Map<string, unknown>();
class FakeHighlight { ranges: Range[]; constructor(...ranges: Range[]) { this.ranges = ranges; } }

const OLD = { skills: ["React"], workExperience: [{ company: "Acme", description: "<ul><li>Built things</li></ul>" }] };
const NEW = { skills: ["React"], workExperience: [{ company: "Acme", description: "<ul><li>Led the design of a quiz platform</li></ul>" }] };

function mockState(enhancedSuggestions: unknown[], resumeData: unknown, enhancedDataVersion = 0) {
  mockedUseResume.mockReturnValue({
    selectedTemplate: "clean_simple",
    resumeData,
    resumeStyle: {},
    enhancedAtsScore: null,
    enhancedSuggestions,
    enhancedDataVersion,
    resumeSavedVersion: 0,
    sectionOrder: ["Personal Info"],
    previewCatalogueKey: null,
  } as never);
}

const suggestion = (id: string, section: string, status: "pending" | "fixed") => ({
  id, section, message: "x", status, undoAvailable: status === "fixed",
});

const panel = (isEnhancedResume = true) => (
  <PreviewPanel isTemplateSidebarOpen={false} onTabClick={() => {}} resumeId="r1" isEnhancedResume={isEnhancedResume} />
);
const renderPanel = async (isEnhancedResume = true) => {
  const view = render(panel(isEnhancedResume));
  await act(async () => { await Promise.resolve(); });
  return view;
};
const settle = () => act(async () => { await Promise.resolve(); });
const sectionCss = (view: { queryByTestId: (id: string) => HTMLElement | null }) =>
  view.queryByTestId("ats-fixed-section-style")?.textContent ?? "";

describe("PreviewPanel — green highlight for text written by a fix", () => {
  beforeEach(() => {
    mockedUseResume.mockReset();
    resetFixedTextBaselines();
    registry.clear();
    vi.stubGlobal("CSS", { highlights: registry });
    vi.stubGlobal("Highlight", FakeHighlight);
  });

  it("highlights the text an Auto Fix wrote, and clears it on Undo", async () => {
    mockState([suggestion("s1", "Leadership", "pending")], OLD, 0);
    const view = await renderPanel();
    expect(registry.has("ats-fixed-text")).toBe(false);

    mockState([suggestion("s1", "Leadership", "fixed")], NEW, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
    // Text-level, so no whole-section box.
    expect(sectionCss(view)).toBe("");

    mockState([suggestion("s1", "Leadership", "pending")], OLD, 2);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(sectionCss(view)).toBe("");
  });

  it("highlights a Manual Fix whose text was typed and autosaved BEFORE the card was confirmed", async () => {
    const before = { personalInfo: { fullname: "Shravya P", location: "" } };
    const typed = { personalInfo: { fullname: "Shravya P", location: "Vijayawada" } };
    mockState([suggestion("c1", "Contact", "pending")], before, 0);
    const view = await renderPanel();

    // Typing changes resumeData with no enhancedDataVersion bump.
    mockState([suggestion("c1", "Contact", "pending")], typed, 0);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);

    // Confirming only flips the card; the data does not change in that render.
    mockState([suggestion("c1", "Contact", "fixed")], typed, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);

    mockState([suggestion("c1", "Contact", "pending")], before, 2);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
  });

  it("highlights the added text when the card flips to fixed one render before the data lands", async () => {
    mockState([suggestion("k1", "Keywords", "pending")], { skills: ["React"] }, 0);
    const view = await renderPanel();

    mockState([suggestion("k1", "Keywords", "fixed")], { skills: ["React"] }, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(sectionCss(view)).toBe("");

    mockState([suggestion("k1", "Keywords", "fixed")], { skills: ["React", "Docker", "AWS"] }, 2);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
    expect(sectionCss(view)).toBe("");
  });

  it("keeps highlighting after the preview unmounts and mounts again mid-session", async () => {
    mockState([suggestion("k1", "Keywords", "pending")], { skills: ["React"] }, 0);
    const first = await renderPanel();
    mockState([suggestion("k1", "Keywords", "fixed")], { skills: ["React", "Docker"] }, 1);
    first.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
    first.unmount();
    expect(registry.has("ats-fixed-text")).toBe(false);

    await renderPanel();
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
  });

  it("does not highlight a pending suggestion", async () => {
    mockState([suggestion("s1", "Skills", "pending")], OLD);
    const view = await renderPanel();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(view.queryByTestId("ats-fixed-section-style")).toBeNull();
  });

  it("never highlights Formatting fixes or a non-enhanced resume", async () => {
    mockState([suggestion("formatting_1", "Formatting", "pending")], OLD, 0);
    const first = await renderPanel();
    mockState([suggestion("formatting_1", "Formatting", "fixed")], NEW, 1);
    first.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(first.queryByTestId("ats-fixed-section-style")).toBeNull();
    first.unmount();

    mockState([suggestion("s1", "Leadership", "pending")], OLD, 0);
    const second = await renderPanel(false);
    mockState([suggestion("s1", "Leadership", "fixed")], NEW, 1);
    second.rerender(panel(false));
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(second.queryByTestId("ats-fixed-section-style")).toBeNull();
  });
});

describe("PreviewPanel — never highlights a whole section", () => {
  beforeEach(() => {
    mockedUseResume.mockReset();
    resetFixedTextBaselines();
    registry.clear();
    vi.stubGlobal("CSS", { highlights: registry });
    vi.stubGlobal("Highlight", FakeHighlight);
  });

  it("highlights nothing for a fix that was already applied when the preview opened", async () => {
    mockState([suggestion("s1", "Skills", "fixed")], OLD);
    const view = await renderPanel();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(view.queryByTestId("ats-fixed-section-style")).toBeNull();
  });

  it("highlights nothing when a fix added no text", async () => {
    mockState([suggestion("s1", "Skills", "pending")], OLD, 0);
    const view = await renderPanel();
    mockState([suggestion("s1", "Skills", "fixed")], OLD, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    expect(view.queryByTestId("ats-fixed-section-style")).toBeNull();
  });

  it.each([
    ["Contact", { personalInfo: { location: "" } }, { personalInfo: { location: "Vijayawada" } }],
    ["Summary", { professionalSummary: { summary: "" } }, { professionalSummary: { summary: "Backend engineer" } }],
    ["Keywords", { skills: ["React"] }, { skills: ["React", "Docker"] }],
    ["Experience", { workExperience: [{ description: "Built" }] }, { workExperience: [{ description: "Built and led" }] }],
    ["Education", { education: [{ school: "A", degree: "" }] }, { education: [{ school: "A", degree: "B.Tech" }] }],
    ["Projects", { projects: [{ title: "P", description: "" }] }, { projects: [{ title: "P", description: "Added bullet" }] }],
    ["Internships", { internships: [{ company: "C", description: "" }] }, { internships: [{ company: "C", description: "Added bullet" }] }],
    ["Certifications", { certifications: [] }, { certifications: [{ name: "AWS SAA" }] }],
    ["Achievements", { achievements: [] }, { achievements: [{ title: "Won hackathon" }] }],
    ["Languages", { languages: [] }, { languages: [{ name: "Telugu" }] }],
    ["Hobbies", { hobbies: [] }, { hobbies: [{ name: "Chess" }] }],
    ["Volunteering", { volunteering: [] }, { volunteering: [{ role: "Mentor" }] }],
  ])("highlights only the added text for a fixed %s suggestion", async (section, before, after) => {
    mockState([suggestion("s1", section, "pending")], before, 0);
    const view = await renderPanel();
    mockState([suggestion("s1", section, "fixed")], after, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
    expect(view.queryByTestId("ats-fixed-section-style")).toBeNull();
  });

  it.each([
    ["SeaServiceRecord", { seaServiceRecord: [] }, { seaServiceRecord: [{ vessel: "MV Aurora" }] }],
    ["ResearchGrants", { researchGrants: [] }, { researchGrants: [{ title: "DST Grant" }] }],
    ["ConferencePresentations", { conferencePresentations: [] }, { conferencePresentations: [{ title: "ICML talk" }] }],
    ["CustomSection", { customSections: [] }, { customSections: [{ id: "c1", sectionName: "Patents", fields: [{ id: "f1", fieldName: "Detail", fieldType: "text", value: "Filed one patent" }] }] }],
    ["SomethingNewTheBackendAdds", { skills: ["React"] }, { skills: ["React", "Terraform"] }],
  ])("highlights what a fix added for any section, including %s", async (section, before, after) => {
    mockState([suggestion("s1", section, "pending")], before, 0);
    const view = await renderPanel();
    mockState([suggestion("s1", section, "fixed")], after, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
    expect(view.queryByTestId("ats-fixed-section-style")).toBeNull();
  });

  it("highlights the exact words a fix added, wherever the preview shows them", async () => {
    const before = { skills: ["React"], hobbies: [{ name: "Chess" }] };
    const after = { skills: ["React", "Docker"], hobbies: [{ name: "Chess" }] };
    mockState([suggestion("s1", "Keywords", "pending")], before, 0);
    const view = await renderPanel();
    mockState([suggestion("s1", "Keywords", "fixed")], after, 1);
    view.rerender(panel());
    await settle();

    // Locate the highlighted ranges in a real DOM rather than the mocked templates.
    const host = document.createElement("div");
    host.innerHTML = '<div data-section="skills"><p>React, Docker</p></div><div data-section="hobbies"><p>Chess</p></div>';
    document.body.appendChild(host);
    const { findHighlightRanges, diffTextUnits } = await import("@/app/(resume)/builder/creation/_utils/fixedTextHighlight");
    const ranges = findHighlightRanges(host, diffTextUnits(before, after));
    expect(ranges.map((range) => range.toString())).toEqual(["Docker"]);
    host.remove();
  });

  it("clears only the undone fix's text", async () => {
    mockState([suggestion("s1", "Skills", "pending"), suggestion("e1", "Education", "pending")],
      { skills: ["React"], education: [{ school: "A", degree: "" }] }, 0);
    const view = await renderPanel();
    mockState([suggestion("s1", "Skills", "fixed"), suggestion("e1", "Education", "fixed")],
      { skills: ["React", "Docker"], education: [{ school: "A", degree: "B.Tech" }] }, 1);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);

    mockState([suggestion("s1", "Skills", "pending"), suggestion("e1", "Education", "pending")],
      { skills: ["React"], education: [{ school: "A", degree: "" }] }, 2);
    view.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
  });
});

describe("markPreviewSection", () => {
  it("maps template section names to the preview's data-section keys", () => {
    expect(previewSectionKey("Professional Summary")).toBe("summary");
    expect(previewSectionKey("Work Experience")).toBe("work-experience");
    expect(previewSectionKey("Skills")).toBe("skills");
    expect(previewSectionKey("Certificates and Clearances")).toBe("certifications");
  });

  it("keeps empty sections empty so templates can still filter them out", () => {
    expect(markPreviewSection("Skills", null)).toBeNull();
  });
});
