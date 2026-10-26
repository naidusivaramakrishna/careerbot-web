/**
 * The full-preview window mounts a second PreviewPanel next to the main one. Closing it must not take the
 * main preview's green fix highlights with it (neither the CSS highlight nor the from-scratch store).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreviewPanel from "@/app/(resume)/builder/creation/_components/PreviewPanel";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { resetFixedTextBaselines } from "@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights";
import { clearBuilderFixUnits, setBuilderFixUnits } from "@/app/(resume)/builder/creation/_lib/builderFixHighlights";

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
vi.mock("@/app/(resume)/builder/creation/_utils/enhancedScore", () => ({ getEnhancedCurrentScore: vi.fn(() => 0) }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateOne", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateTwo", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateThree", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateFour", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateFive", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template2", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template3", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template4", () => ({ default: () => null }));

const registry = new Map<string, unknown>();
class FakeHighlight { ranges: Range[]; constructor(...ranges: Range[]) { this.ranges = ranges; } }

const panel = () => (
  <PreviewPanel hideToolbar isTemplateSidebarOpen={false} onTabClick={() => {}} resumeId="r1" isEnhancedResume={false} />
);
const settle = () => act(async () => { await Promise.resolve(); });

describe("a second preview (the full-preview window)", () => {
  beforeEach(() => {
    vi.mocked(useResume).mockReturnValue({
      selectedTemplate: "clean_simple", resumeData: { skills: ["React"] }, resumeStyle: {}, enhancedAtsScore: null,
      enhancedSuggestions: [], enhancedDataVersion: 0, resumeSavedVersion: 0, sectionOrder: ["Personal Info"], previewCatalogueKey: null,
    } as never);
    resetFixedTextBaselines();
    clearBuilderFixUnits();
    registry.clear();
    vi.stubGlobal("CSS", { highlights: registry });
    vi.stubGlobal("Highlight", FakeHighlight);
  });

  it("keeps the main preview's highlight when it closes", async () => {
    setBuilderFixUnits("fix-1", [{ key: "skills", text: "Led the design of a quiz platform" }]);
    const main = render(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);

    const windowPreview = render(panel()); // the eye-icon window opens
    await settle();
    windowPreview.unmount();               // ... and closes
    await settle();

    expect(registry.has("ats-fixed-text")).toBe(true);
    main.unmount();
    expect(registry.has("ats-fixed-text")).toBe(false); // the last preview leaving removes it
  });

  it("keeps the from-scratch fix units in the store when it closes", async () => {
    setBuilderFixUnits("fix-1", [{ key: "skills", text: "Led the design of a quiz platform" }]);
    render(panel());
    const windowPreview = render(panel());
    await settle();
    windowPreview.unmount();
    await settle();
    // a preview mounted afterwards still finds the units
    const again = render(panel());
    await settle();
    expect(registry.has("ats-fixed-text")).toBe(true);
    again.unmount();
  });

  it("does not force the page padding with a wrapper class (the margin is the hook's alone)", async () => {
    const view = render(
      <PreviewPanel hideToolbar expandPreview isTemplateSidebarOpen={false} onTabClick={() => {}} resumeId="r1" isEnhancedResume={false} />,
    );
    await settle();
    const wrapper = view.container.querySelector(".resume-content") as HTMLElement;
    expect(wrapper).toBeTruthy();
    // `[&>div]:!p-4` here would beat the template's own padding and make "Template default" differ from the export
    expect(wrapper.className).not.toMatch(/!p-/);
    view.unmount();
  });
});
