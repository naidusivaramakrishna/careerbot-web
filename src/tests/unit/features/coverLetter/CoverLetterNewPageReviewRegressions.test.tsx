import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const VALID_JD = "We are hiring a Senior Backend Engineer to design reliable payment services with product and platform teams.";

const {
  mockSearchParams,
  mockGetParsedJDDetails,
  mockGetParsedResume,
  mockGetResumeById,
  mockGenerateMutate,
  mockParseJDText,
} = vi.hoisted(() => ({
  mockSearchParams: vi.fn(),
  mockGetParsedJDDetails: vi.fn(),
  mockGetParsedResume: vi.fn(),
  mockGetResumeById: vi.fn(),
  mockGenerateMutate: vi.fn(),
  mockParseJDText: vi.fn(),
}));

let defaultResumeState: Record<string, unknown> | null = null;
let defaultResumeLoading = false;
let latestResumeState: Record<string, unknown> | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@/api/parserApi", () => ({
  parseJDText: mockParseJDText,
  parseJDFile: vi.fn(),
  parseJDByJob: vi.fn(),
  getParsedJDDetails: mockGetParsedJDDetails,
  getResume: mockGetParsedResume,
}));

vi.mock("@/api/resumeApi", () => ({ getResumeById: mockGetResumeById }));
vi.mock("@/api/extensionApi", () => ({ getExtensionSession: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { debug: vi.fn() } }));
vi.mock("@/api/coverLetterApi", () => ({
  getCoverLetterGenerationProgress: vi.fn(),
  listCoverLetterResumeOptions: vi.fn().mockResolvedValue({ resumes: [] }),
  setDefaultCoverLetterResume: vi.fn(),
}));

vi.mock("@/hooks/useHasParsedResume", () => ({
  useHasParsedResume: () => ({ hasResume: true, isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock("@/hooks/useLatestParsedResume", () => ({
  useLatestParsedResume: () => ({
    resume: latestResumeState,
    resumeSchemaVersion: "2.0",
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/useDefaultCoverLetterResume", () => ({
  useDefaultCoverLetterResume: () => ({
    defaultResume: defaultResumeState,
    isLoading: defaultResumeLoading,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/useDefaultCoverLetterTemplate", () => ({
  useDefaultCoverLetterTemplate: () => ({ defaultTemplate: null, isLoading: false, error: null, refetch: vi.fn(), setDefault: vi.fn() }),
}));
vi.mock("@/hooks/useCoverLetterTemplates", () => ({
  useCoverLetterTemplates: () => ({ templates: [], isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock("@/hooks/useCurrentUserId", () => ({
  useCurrentUserId: () => ({ userId: "user-1", isLoading: false, error: null }),
}));
vi.mock("@/hooks/useGenerateCoverLetter", () => ({
  useGenerateCoverLetter: () => ({
    mutate: mockGenerateMutate,
    retry: vi.fn(),
    abort: vi.fn(),
    isLoading: false,
    data: null,
    error: null,
  }),
}));
vi.mock("@/components/SignUpModal", () => ({ default: () => null }));
vi.mock("@/app/cover-letter/_components/CoverLetterTemplatePreview", () => ({
  CoverLetterTemplatePreview: () => <div data-testid="template-preview" />,
  CoverLetterTemplatePreviewModal: () => null,
}));

import CoverLetterNewPage from "@/app/cover-letter/new/page";

const signatureField = () => screen.getByPlaceholderText("e.g. Ananya Rao");
const jdField = () => screen.getByPlaceholderText("Paste the full job description here...");
const companyField = () => screen.getByPlaceholderText("e.g. Globex Corporation");
const roleField = () => screen.getByPlaceholderText("e.g. Senior Backend Engineer");
const locationField = () => screen.getByPlaceholderText("e.g. Bengaluru, India");

function defaultResume(source: "parser" | "builder", resumeId = `${source}-resume`) {
  return {
    resume_id: resumeId,
    source,
    display_name: `${source} default`,
    is_user_default: true,
    is_usable_for_cover_letter: true,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => { resolve = finish; });
  return { promise, resolve };
}

function fillManualDetails() {
  fireEvent.change(companyField(), { target: { value: "Globex" } });
  fireEvent.change(roleField(), { target: { value: "Senior Backend Engineer" } });
  fireEvent.change(locationField(), { target: { value: "Bengaluru, India" } });
  fireEvent.change(signatureField(), { target: { value: "Ananya Rao" } });
}

describe("/cover-letter/new review regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    sessionStorage.clear();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    defaultResumeState = null;
    defaultResumeLoading = false;
    latestResumeState = null;
    mockParseJDText.mockResolvedValue({ jd_id: "jd-1" });
    mockGetParsedJDDetails.mockResolvedValue({});
    mockGetParsedResume.mockResolvedValue({ personalInfo: { full_name: "Ananya Rao" } });
    mockGetResumeById.mockResolvedValue({ personalInfo: { full_name: "Ananya Rao" } });
    mockGenerateMutate.mockResolvedValue({ letter_id: "letter-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["parser", "builder"] as const)("loads a delayed %s default resume signature", async (source) => {
    defaultResumeState = defaultResume(source);
    const request = deferred<{ personalInfo: { full_name: string } }>();
    if (source === "parser") mockGetParsedResume.mockReturnValueOnce(request.promise);
    else mockGetResumeById.mockReturnValueOnce(request.promise);

    render(<CoverLetterNewPage />);

    const loader = source === "parser" ? mockGetParsedResume : mockGetResumeById;
    await waitFor(() => expect(loader).toHaveBeenCalledWith(`${source}-resume`));
    request.resolve({ personalInfo: { full_name: "Ananya Rao" } });

    await waitFor(() => expect(signatureField()).toHaveValue("Ananya Rao"));
  });

  it("keeps the parsed JD ID when optional details lookup fails and generates with it", async () => {
    defaultResumeState = defaultResume("parser");
    mockGetParsedJDDetails.mockRejectedValueOnce(new Error("details temporarily unavailable"));
    render(<CoverLetterNewPage />);

    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());
    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-1"));
    fillManualDetails();

    const generate = screen.getByRole("button", { name: /generate cover letter/i });
    await waitFor(() => expect(generate).toBeEnabled());
    fireEvent.click(generate);

    await waitFor(() => expect(mockGenerateMutate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({ jd_id: "jd-1" }),
    })));
  });

  it("does not parse an unchanged JD again after a second blur", async () => {
    defaultResumeState = defaultResume("parser");
    render(<CoverLetterNewPage />);

    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());
    await waitFor(() => expect(mockParseJDText).toHaveBeenCalledTimes(1));
    fireEvent.blur(jdField());

    await waitFor(() => expect(mockParseJDText).toHaveBeenCalledTimes(1));
  });

  it("keeps a draft signature for resume A while the default resume is loading", async () => {
    latestResumeState = {
      resume_id: "resume-a",
      source: "parser",
      display_name: "Resume A",
      parsed_data: {},
    };
    defaultResumeLoading = true;
    sessionStorage.setItem("careerbot:cover-letter-refresh-pending", "true");
    sessionStorage.setItem("careerbot:cover-letter-refresh-draft", JSON.stringify({
      jd: VALID_JD,
      companyName: "Globex",
      roleTitle: "Senior Backend Engineer",
      location: "Bengaluru, India",
      hiringManagerName: "",
      candidateSignatureName: "Saved Resume A Signature",
      autoFilledFields: [],
      signatureResumeKey: "parser:resume-a",
    }));
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type: "reload" }] as PerformanceEntryList);

    render(<CoverLetterNewPage />);

    await waitFor(() => expect(signatureField()).toHaveValue("Saved Resume A Signature"));
  });
});
