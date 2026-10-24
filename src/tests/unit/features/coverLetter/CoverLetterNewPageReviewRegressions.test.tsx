import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";

// The page mounts several async hooks; on a loaded runner the default 1s
// waitFor window is not always enough.
configure({ asyncUtilTimeout: 10_000 });

const VALID_JD = "We are hiring a Senior Backend Engineer to design reliable payment services with product and platform teams.";

const {
  mockSearchParams,
  mockGetParsedJDDetails,
  mockGetParsedResume,
  mockGetResumeById,
  mockGenerateMutate,
  mockParseJDByJob,
  mockParseJDText,
} = vi.hoisted(() => ({
  mockSearchParams: vi.fn(),
  mockGetParsedJDDetails: vi.fn(),
  mockGetParsedResume: vi.fn(),
  mockGetResumeById: vi.fn(),
  mockGenerateMutate: vi.fn(),
  mockParseJDByJob: vi.fn(),
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
  parseJDByJob: mockParseJDByJob,
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
vi.mock("@/components/SignUpModal", () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="sign-in-modal" /> : null),
}));
vi.mock("@/app/cover-letter/_components/CoverLetterTemplatePreview", () => ({
  CoverLetterTemplatePreview: () => <div data-testid="template-preview" />,
  CoverLetterTemplatePreviewModal: () => null,
}));

import CoverLetterNewPage from "@/app/cover-letter/new/page";
import { getCoverLetterGenerationProgress, listCoverLetterResumeOptions } from "@/api/coverLetterApi";

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

describe("/cover-letter/new review regressions", { timeout: 30_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    sessionStorage.clear();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    defaultResumeState = null;
    defaultResumeLoading = false;
    latestResumeState = null;
    mockParseJDByJob.mockResolvedValue({ jd_id: "jd-1" });
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
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type: "reload" }] as unknown as PerformanceEntryList);

    render(<CoverLetterNewPage />);

    await waitFor(() => expect(signatureField()).toHaveValue("Saved Resume A Signature"));
  });
});

// These drive the full page (analysis, picker, generation); a loaded runner needs more than 5s.
describe("/cover-letter/new agent fix round (bot F11, F12, retry, analysis, polling, draft)", { timeout: 30_000 }, () => {
  const mockProgress = vi.mocked(getCoverLetterGenerationProgress);
  const mockOptions = vi.mocked(listCoverLetterResumeOptions);
  const resumeB = {
    resume_id: "resume-b",
    source: "parser" as const,
    display_name: "Resume B",
    is_user_default: false,
    is_usable_for_cover_letter: true,
  };

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
    mockOptions.mockResolvedValue({ resumes: [resumeB] } as unknown as Awaited<ReturnType<typeof listCoverLetterResumeOptions>>);
    mockProgress.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function restoreDraft(draft: Record<string, unknown>) {
    sessionStorage.setItem("careerbot:cover-letter-refresh-pending", "true");
    sessionStorage.setItem("careerbot:cover-letter-refresh-draft", JSON.stringify({
      jd: VALID_JD,
      companyName: "Globex",
      roleTitle: "Senior Backend Engineer",
      location: "Bengaluru, India",
      hiringManagerName: "",
      candidateSignatureName: "",
      autoFilledFields: [],
      signatureResumeKey: null,
      ...draft,
    }));
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type: "reload" }] as unknown as PerformanceEntryList);
  }

  async function pickResumeB() {
    fireEvent.click(screen.getByRole("button", { name: /change resume|choose saved resume/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Use for this letter" }));
  }

  async function startGeneration() {
    defaultResumeState = defaultResume("parser");
    mockGenerateMutate.mockReturnValue(new Promise(() => undefined));
    render(<CoverLetterNewPage />);
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());
    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-1"));
    fillManualDetails();
    fireEvent.click(screen.getByRole("button", { name: /generate cover letter/i }));
    await waitFor(() => expect(mockGenerateMutate).toHaveBeenCalled());
    await waitFor(() => expect(mockProgress).toHaveBeenCalledTimes(1));
  }

  it("F11: a 401 from the JD details lookup opens sign-in instead of the incomplete toast", async () => {
    defaultResumeState = defaultResume("parser");
    mockGetParsedJDDetails.mockRejectedValueOnce(Object.assign(new Error("Not authenticated"), { status: 401 }));
    render(<CoverLetterNewPage />);

    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());

    await waitFor(() => expect(screen.getByTestId("sign-in-modal")).toBeInTheDocument());
  });

  it("F11 control: a non-auth details failure does not open sign-in", async () => {
    defaultResumeState = defaultResume("parser");
    mockGetParsedJDDetails.mockRejectedValueOnce(new Error("details temporarily unavailable"));
    render(<CoverLetterNewPage />);

    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());

    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-1"));
    expect(screen.queryByTestId("sign-in-modal")).not.toBeInTheDocument();
  });

  it("caps company, title and location filled from JD analysis like the typed inputs", async () => {
    mockGetParsedJDDetails.mockResolvedValueOnce({ company: "C".repeat(300), job_title: "T".repeat(400), location: "L".repeat(300) });
    render(<CoverLetterNewPage />);
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());

    await waitFor(() => expect(companyField()).toHaveValue("C".repeat(200)));
    expect(roleField()).toHaveValue("T".repeat(300));
    expect(locationField()).toHaveValue("L".repeat(200));
  });

  it("clears a field auto-filled from job A when job B's analysis has no value for it", async () => {
    mockGetParsedJDDetails
      .mockResolvedValueOnce({ company: "Acme Payments" })
      .mockResolvedValueOnce({});
    mockParseJDText.mockResolvedValueOnce({ jd_id: "jd-a" }).mockResolvedValueOnce({ jd_id: "jd-b" });
    render(<CoverLetterNewPage />);
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());
    await waitFor(() => expect(companyField()).toHaveValue("Acme Payments"));

    fireEvent.change(jdField(), { target: { value: `${VALID_JD} A second, different role.` } });
    fireEvent.blur(jdField());

    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-b"));
    await waitFor(() => expect(companyField()).toHaveValue(""));
  });

  it("control: a company the user typed survives job B's analysis without a company", async () => {
    mockGetParsedJDDetails.mockResolvedValue({});
    render(<CoverLetterNewPage />);
    fireEvent.change(companyField(), { target: { value: "Typed Co" } });
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());

    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-1"));
    expect(companyField()).toHaveValue("Typed Co");
  });

  it("generates with the parsed JD ID while the optional details lookup is still pending", async () => {
    defaultResumeState = defaultResume("parser");
    mockGetParsedJDDetails.mockReturnValue(new Promise(() => undefined));
    render(<CoverLetterNewPage />);
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());
    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-1"));
    fillManualDetails();
    await waitFor(() => expect(signatureField()).toHaveValue("Ananya Rao"));

    fireEvent.click(screen.getByRole("button", { name: /generate cover letter/i }));

    await waitFor(() => expect(mockGenerateMutate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({ jd_id: "jd-1" }),
    })));
  });

  it("does not send job A's auto-filled details with job B's jd_id while B's details are pending", async () => {
    defaultResumeState = defaultResume("parser");
    mockParseJDText.mockResolvedValueOnce({ jd_id: "jd-a" }).mockResolvedValueOnce({ jd_id: "jd-b" });
    mockGetParsedJDDetails
      .mockResolvedValueOnce({ company: "Acme Payments", job_title: "Staff Engineer", location: "Pune, India" })
      .mockReturnValueOnce(new Promise(() => undefined));
    render(<CoverLetterNewPage />);
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    fireEvent.blur(jdField());
    await waitFor(() => expect(companyField()).toHaveValue("Acme Payments"));
    await waitFor(() => expect(signatureField()).toHaveValue("Ananya Rao"));

    fireEvent.change(jdField(), { target: { value: `${VALID_JD} A second, different role.` } });
    expect(companyField()).toHaveValue("");
    expect(roleField()).toHaveValue("");
    expect(locationField()).toHaveValue("");
    fireEvent.blur(jdField());
    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-b"));
    fireEvent.click(screen.getByRole("button", { name: /generate cover letter/i }));

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mockGenerateMutate).not.toHaveBeenCalled();
  });

  it("F12: picking resume B while the default resume loads replaces resume A's restored signature", async () => {
    latestResumeState = { resume_id: "resume-a", source: "parser", display_name: "Resume A", parsed_data: {} };
    defaultResumeLoading = true;
    restoreDraft({ candidateSignatureName: "Saved Resume A Signature", signatureResumeKey: "parser:resume-old" });
    mockGetParsedResume.mockImplementation(async (id: string) => ({
      personalInfo: { full_name: id === "resume-b" ? "Bea Resume B" : "Ann Resume A" },
    }));

    render(<CoverLetterNewPage />);
    await waitFor(() => expect(signatureField()).toHaveValue("Saved Resume A Signature"));
    await pickResumeB();

    await waitFor(() => expect(signatureField()).toHaveValue("Bea Resume B"));
  });

  it("F12 sibling: picking the resume that is already the transient fallback also drops the restored signature", async () => {
    latestResumeState = { resume_id: "resume-b", source: "parser", display_name: "Resume B", parsed_data: {} };
    defaultResumeLoading = true;
    restoreDraft({ candidateSignatureName: "Saved Resume A Signature", signatureResumeKey: "parser:resume-old" });
    mockGetParsedResume.mockResolvedValue({ personalInfo: { full_name: "Bea Resume B" } });

    render(<CoverLetterNewPage />);
    await waitFor(() => expect(mockGetParsedResume).toHaveBeenCalledWith("resume-b"));
    await waitFor(() => expect(signatureField()).toHaveValue("Saved Resume A Signature"));
    await pickResumeB();

    await waitFor(() => expect(signatureField()).toHaveValue("Bea Resume B"));
  });

  it("retries the signature lookup when the user picks the same resume again after a failure", async () => {
    mockGetParsedResume
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValue({ personalInfo: { full_name: "Bea Resume B" } });
    // With no default, the page auto-selects resume B; its first lookup fails.
    render(<CoverLetterNewPage />);
    await waitFor(() => expect(mockGetParsedResume).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 100));

    await pickResumeB();

    await waitFor(() => expect(mockGetParsedResume).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(signatureField()).toHaveValue("Bea Resume B"));
  });

  it("analyzes a JD that arrives through ?jd= without waiting for a blur", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams({ jd: VALID_JD }));
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(mockParseJDText).toHaveBeenCalledTimes(1));
  });

  it("analyzes a JD restored from a refresh draft without waiting for a blur", async () => {
    restoreDraft({});
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(jdField()).toHaveValue(VALID_JD));
    await waitFor(() => expect(mockParseJDText).toHaveBeenCalledTimes(1));
  });

  it("keeps restored auto-filled tracker details when analysis is cancelled", async () => {
    const pendingParse = deferred<{ jd_id: string }>();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockParseJDByJob.mockReturnValueOnce(pendingParse.promise);
    restoreDraft({
      jd: "",
      source: "tracker",
      trackerJobId: "job-42",
      autoFilledFields: ["company", "title", "location"],
    });
    render(<CoverLetterNewPage />);

    const trackerJobId = await screen.findByPlaceholderText("e.g. 557ac932ccd40e7a27cdd22c");
    await waitFor(() => expect(trackerJobId).toHaveValue("job-42"));
    fireEvent.blur(trackerJobId);
    await waitFor(() => expect(mockParseJDByJob).toHaveBeenCalledWith("job-42"));
    await waitFor(() => expect(screen.getByRole("dialog", { name: /analyzing job description/i })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: /cancel and enter details manually/i }));

    expect(companyField()).toHaveValue("Globex");
    expect(roleField()).toHaveValue("Senior Backend Engineer");
    expect(locationField()).toHaveValue("Bengaluru, India");
    pendingParse.resolve({ jd_id: "jd-1" });
  });

  it("does not re-parse a pasted JD when it blurs during the first request", async () => {
    const pendingParse = deferred<{ jd_id: string }>();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockParseJDText.mockReturnValueOnce(pendingParse.promise);
    render(<CoverLetterNewPage />);

    fireEvent.paste(jdField());
    fireEvent.change(jdField(), { target: { value: VALID_JD } });
    await waitFor(() => expect(mockParseJDText).toHaveBeenCalledTimes(1));
    fireEvent.blur(jdField());

    expect(mockParseJDText).toHaveBeenCalledTimes(1);
    pendingParse.resolve({ jd_id: "jd-1" });
    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-1"));
  });

  it("control: a typed JD is still analyzed only on blur", async () => {
    render(<CoverLetterNewPage />);
    fireEvent.change(jdField(), { target: { value: VALID_JD } });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(mockParseJDText).not.toHaveBeenCalled();
    fireEvent.blur(jdField());
    await waitFor(() => expect(mockParseJDText).toHaveBeenCalledTimes(1));
  });

  it("polls progress one request at a time", async () => {
    await startGeneration();
    mockProgress.mockReturnValue(new Promise(() => undefined));

    await waitFor(() => expect(mockProgress).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 2_500));
    expect(mockProgress).toHaveBeenCalledTimes(2);
  });

  it("stops polling once the backend reports a terminal status", async () => {
    mockProgress.mockResolvedValue({
      status: "completed", stage: "completed", progress: 100, message: "Done", letter_id: "letter-1",
      updated_at: "2026-10-15T00:00:00Z",
    });
    await startGeneration();

    await new Promise((resolve) => setTimeout(resolve, 2_500));
    expect(mockProgress).toHaveBeenCalledTimes(1);
  });

  it("control: polling continues while the progress route returns nothing yet", async () => {
    await startGeneration();

    await waitFor(() => expect(mockProgress.mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 3_000 });
  });

  it("keeps a refresh draft for the tracker source and restores it", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams({ source: "tracker" }));
    render(<CoverLetterNewPage />);
    fireEvent.change(screen.getByPlaceholderText("e.g. 557ac932ccd40e7a27cdd22c"), { target: { value: "job-42" } });

    await waitFor(() => {
      const draft = JSON.parse(sessionStorage.getItem("careerbot:cover-letter-refresh-draft") ?? "null");
      expect(draft).toEqual(expect.objectContaining({ source: "tracker", trackerJobId: "job-42" }));
    });
  });

  it("restores the tracker source and job ID from a refresh draft", async () => {
    restoreDraft({ jd: "", source: "tracker", trackerJobId: "job-42" });
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(screen.getByPlaceholderText("e.g. 557ac932ccd40e7a27cdd22c")).toHaveValue("job-42"));
  });
});
