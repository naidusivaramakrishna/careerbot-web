/**
 * ATS Scan: once an Auto/Manual Fix is applied, only the text it wrote is
 * highlighted green in the preview (CSS Custom Highlight API, screen only).
 * Undo clears it again because the suggestion is no longer "fixed".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreviewPanel from "@/app/(resume)/builder/creation/_components/PreviewPanel";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { markPreviewSection, previewSectionKey } from "@/app/(resume)/templates/_utils/previewSectionMarker";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({ useResume: vi.fn() }));
vi.mock("@/app/(resume)/builder/creation/_context/ScoreContext", () => ({
  useScore: () => ({ canonicalScore: null, setCanonicalScore: vi.fn() }),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useResumeScorePreview", () => ({
  useResumeScorePreview: () => ({ score: 0, breakdown: {} }),
}));
vi.mock("@/api/resumeApi", () => ({ getResumePreviewImage: vi.fn(), downloadResume: vi.fn() }));
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

function mockState(enhancedSuggestions: unknown[], resumeData: unknown, enhancedDataVersion: number) {
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

const panel = (isEnhancedResume = true) => (
  <PreviewPanel isTemplateSidebarOpen={false} onTabClick={() => {}} resumeId="r1" isEnhancedResume={isEnhancedResume} />
);
const renderPanel = async () => {
  const view = render(panel());
  await act(async () => { await Promise.resolve(); });
  return view;
};
const settle = () => act(async () => { await Promise.resolve(); });

describe("PreviewPanel — green highlight for text written by a fix", () => {
  beforeEach(() => {
    mockedUseResume.mockReset();
    registry.clear();
    vi.stubGlobal("CSS", { highlights: registry });
    vi.stubGlobal("Highlight", FakeHighlight);
  });

  it("registers a highlight when a fix rewrites resume text, and clears it on Undo", async () => {
    mockState([{ id: "s1", section: "Leadership", message: "x", status: "pending" }], OLD, 0);
    const { rerender } = await renderPanel();
    expect(registry.has("ats-fixed-text")).toBe(false);

    mockState([{ id: "s1", section: "Leadership", message: "x", status: "fixed", undoAvailable: true }], NEW, 1);
    rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);

    mockState([{ id: "s1", section: "Leadership", message: "x", status: "pending" }], OLD, 2);
    rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
  });

  it("does not highlight when a fix changed no text, or for Formatting fixes / non-enhanced resumes", async () => {
    mockState([{ id: "s1", section: "Skills", message: "x", status: "pending" }], OLD, 0);
    const first = await renderPanel();
    mockState([{ id: "s1", section: "Skills", message: "x", status: "fixed" }], OLD, 1);
    first.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    first.unmount();

    mockState([{ id: "formatting_1", section: "Formatting", message: "x", status: "pending" }], OLD, 0);
    const second = await renderPanel();
    mockState([{ id: "formatting_1", section: "Formatting", message: "x", status: "fixed" }], NEW, 1);
    second.rerender(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(false);
    second.unmount();

    mockState([{ id: "s1", section: "Leadership", message: "x", status: "pending" }], OLD, 0);
    const third = render(panel(false));
    await settle();
    mockState([{ id: "s1", section: "Leadership", message: "x", status: "fixed" }], NEW, 1);
    third.rerender(panel(false));
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
