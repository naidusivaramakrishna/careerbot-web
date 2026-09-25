/**
 * Regression tests for PreviewPanel's server-rendered preview trigger (P1).
 *
 * GET /resumes/{id}/download always renders the PERSISTED resume -- it takes
 * no resumeData in the request, only resumeId + style/template query params
 * (see getResumePreviewImage in resumeApi.ts). The preview-fetch effect used
 * to key its debounce on `resumeData` directly, so every keystroke scheduled
 * a fetch 1s later of whatever was already saved -- but autosave takes 3s,
 * so that fetch always returned the PRE-EDIT snapshot, and nothing re-fired
 * once the user stopped typing. The preview was permanently one edit behind,
 * and brand-new entries (stripped from autosave payloads until the backend
 * assigns them an id) never appeared until an explicit Save.
 *
 * Fixed by keying the fetch on resumeSavedVersion (ResumeContext.tsx), which
 * only bumps once EditorTab's autosave/Save actually lands on the backend.
 *
 * Uses fake timers throughout: the effect under test debounces on a real
 * 1000ms setTimeout, and this environment's async setup/teardown overhead
 * can itself run into multiple seconds, making a real-time wait for "did it
 * NOT fire" both slow and flaky. Fake timers make every advance exact.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreviewPanel from "@/app/(resume)/builder/creation/_components/PreviewPanel";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { getResumePreviewImage } from "@/api/resumeApi";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: vi.fn(),
}));
vi.mock("@/app/(resume)/builder/creation/_context/ScoreContext", () => ({
  useScore: () => ({ canonicalScore: null, setCanonicalScore: vi.fn() }),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useResumeScorePreview", () => ({
  useResumeScorePreview: () => ({ score: 0, breakdown: {} }),
}));
vi.mock("@/api/resumeApi", () => ({
  getResumePreviewImage: vi.fn(),
  downloadResume: vi.fn(),
}));
vi.mock("@/api/enhancerApi", () => ({
  downloadEnhancedResume: vi.fn(),
}));
vi.mock("@/api/userApi", () => ({
  getProfile: vi.fn().mockResolvedValue({ email: "test@example.com" }),
}));
vi.mock("@/utils/careerLevelDetection", () => ({
  detectCareerLevel: vi.fn(() => "mid"),
}));
vi.mock("@/app/(resume)/builder/creation/_utils/enhancedScore", () => ({
  getEnhancedCurrentScore: vi.fn(() => 0),
}));
// Template components aren't exercised on the server-preview path (isEnhancedResume=false
// renders the <img>, not these), but PreviewPanel imports them unconditionally.
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateOne", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateTwo", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateThree", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateFour", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/templates/TemplateFive", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template2", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template3", () => ({ default: () => null }));
vi.mock("@/app/(resume)/templates/Template4", () => ({ default: () => null }));

const mockedUseResume = vi.mocked(useResume);
const mockedGetPreview = vi.mocked(getResumePreviewImage);

const baseResumeData = {
  personalInfo: { fullname: "Avery Test" },
  customSections: [],
} as never;

function mockContext(overrides: Partial<ReturnType<typeof useResume>> = {}) {
  mockedUseResume.mockReturnValue({
    selectedTemplate: "clean_simple",
    resumeData: baseResumeData,
    resumeStyle: {},
    enhancedAtsScore: null,
    enhancedSuggestions: [],
    enhancedDataVersion: 0,
    resumeSavedVersion: 0,
    sectionOrder: ["Personal Info"],
    previewCatalogueKey: null,
    ...overrides,
  } as never);
}

describe("PreviewPanel — server preview trigger keyed on resumeSavedVersion (P1 regression)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGetPreview.mockReset();
    mockedGetPreview.mockResolvedValue(new Blob(["fake-png"], { type: "image/png" }));
    window.URL.createObjectURL = vi.fn(() => "blob:fake-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const panel = () => (
    <PreviewPanel
      isTemplateSidebarOpen={false}
      onTabClick={() => {}}
      resumeId="resume-123"
      isEnhancedResume={false}
    />
  );

  // Advances past both the getProfile()-driven isEmailReady mount effect and
  // the 1000ms preview debounce. Split into two act() calls on purpose: the
  // preview-fetch effect only re-runs once isEmailReady flips true, which
  // itself requires a render commit after getProfile()'s microtask resolves.
  // A single big advanceTimersByTimeAsync doesn't reliably interleave with
  // that render commit in this environment; an intermediate flush does.
  const settleInitialPreview = async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });
  };

  it("does not re-fetch the server preview when only resumeData changes (no save yet)", async () => {
    mockContext({ resumeSavedVersion: 0 });
    const { rerender } = render(panel());
    await settleInitialPreview();
    expect(mockedGetPreview).toHaveBeenCalledTimes(1);

    // Simulate the user typing: resumeData changes, resumeSavedVersion does not
    // (nothing has been persisted yet -- autosave hasn't landed).
    mockContext({
      resumeSavedVersion: 0,
      resumeData: { ...baseResumeData, personalInfo: { fullname: "Avery Edited Locally" } } as never,
    });
    rerender(panel());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(mockedGetPreview).toHaveBeenCalledTimes(1);
  });

  it("re-fetches the server preview once resumeSavedVersion bumps (autosave/Save landed)", async () => {
    mockContext({ resumeSavedVersion: 0 });
    const { rerender } = render(panel());
    await settleInitialPreview();
    expect(mockedGetPreview).toHaveBeenCalledTimes(1);

    mockContext({ resumeSavedVersion: 1 });
    rerender(panel());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(mockedGetPreview).toHaveBeenCalledTimes(2);
  });
});
