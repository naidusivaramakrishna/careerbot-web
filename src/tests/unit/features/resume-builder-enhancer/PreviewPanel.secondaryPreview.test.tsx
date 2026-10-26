/**
 * The full-preview window mounts a second PreviewPanel next to the main one. Closing it must not take the
 * main preview's green fix highlights with it (neither the CSS highlight nor the from-scratch store).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
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
// A template whose body text is rendered at the active template's body size, like the real ones
vi.mock("@/app/(resume)/templates/Template2", () => ({
  default: ({ style }: { style?: { bodyFontSize?: string } }) => <div><p data-testid="body-text" style={{ fontSize: style?.bodyFontSize }}>Body</p></div>,
}));
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

  it("scales the preview font from the active template's body size, so Font Size 10 shows 10px like the export", async () => {
    vi.mocked(useResume).mockReturnValue({
      selectedTemplate: "clean_simple", resumeData: { skills: ["React"] }, resumeStyle: { bodyFontSize: "9px", fontSize: "10" }, enhancedAtsScore: null,
      enhancedSuggestions: [], enhancedDataVersion: 0, resumeSavedVersion: 0, sectionOrder: ["Personal Info"], previewCatalogueKey: null,
    } as never);
    const view = render(panel());
    await settle();
    // the layout is re-applied on the next animation frame after the template mounts
    await waitFor(() => expect((view.getByTestId("body-text") as HTMLElement).style.fontSize).toBe("10px"));
    view.unmount();
  });

  // Codex review of the follow-up (#297): the hook remembers each element's original size in data-layout-fs and
  // takes a value React wrote as "ours" when it equals the last applied one. With Font Size 10 on a 9px template the
  // body is shown at 10px; a catalogue / template switch to a 10px body makes React write 10px, which looked like the
  // hook's own value, so the stale 9px original came back (factor 1 restores it) and the body showed 9px.
  const withBody = (bodyFontSize: string) => vi.mocked(useResume).mockReturnValue({
    selectedTemplate: "clean_simple", resumeData: { skills: ["React"] }, resumeStyle: { bodyFontSize, fontSize: "10" }, enhancedAtsScore: null,
    enhancedSuggestions: [], enhancedDataVersion: 0, resumeSavedVersion: 0, sectionOrder: ["Personal Info"], previewCatalogueKey: null,
  } as never);
  const bodySize = (view: ReturnType<typeof render>) => (view.getByTestId("body-text") as HTMLElement).style.fontSize;

  it("keeps Font Size 10 at 10px when the template's body size changes to 10px", async () => {
    withBody("9px");
    const view = render(panel());
    await settle();
    await waitFor(() => expect(bodySize(view)).toBe("10px"));
    withBody("10px");
    view.rerender(panel());
    await settle();
    await new Promise((resolve) => setTimeout(resolve, 50)); // a scheduled re-apply runs on the next frame
    expect(bodySize(view)).toBe("10px");
    view.unmount();
  });

  it("keeps Font Size 10 at 10px when the template's body size changes to 11px (control)", async () => {
    withBody("9px");
    const view = render(panel());
    await settle();
    await waitFor(() => expect(bodySize(view)).toBe("10px"));
    withBody("11px");
    view.rerender(panel());
    await settle();
    await waitFor(() => expect(bodySize(view)).toBe("10px"));
    view.unmount();
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
