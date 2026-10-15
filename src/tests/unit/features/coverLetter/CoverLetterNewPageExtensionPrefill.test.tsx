/**
 * Extension handoff tests for /cover-letter/new?session=<id>
 * (src/app/cover-letter/new/page.tsx).
 *
 * Everything in an extension session was scraped from a third-party job page,
 * so it is untrusted input. These tests pin the two things that matter:
 *   - the fields the form prefills, and
 *   - that a prefilled value cannot exceed the cap the typed input enforces
 *     via `maxLength` (the value is read back into application_context on the
 *     generate request, where the API enforces the same bounds).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const SESSION_ID = "sess-1";

const { mockSearchParams, mockGetExtensionSession, mockParseJDText, mockGetParsedJDDetails, mockGetResume } = vi.hoisted(() => ({
  mockSearchParams: vi.fn(),
  mockGetExtensionSession: vi.fn(),
  mockParseJDText: vi.fn(),
  mockGetParsedJDDetails: vi.fn(),
  mockGetResume: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mockSearchParams(),
  usePathname: () => "/cover-letter/new",
  useParams: () => ({}),
}));

vi.mock("@/api/extensionApi", () => ({
  getExtensionSession: mockGetExtensionSession,
}));

vi.mock("@/api/parserApi", () => ({
  parseJDText: mockParseJDText,
  parseJDFile: vi.fn(),
  parseJDByJob: vi.fn(),
  getParsedJDDetails: mockGetParsedJDDetails,
  getResume: mockGetResume,
}));

vi.mock("@/hooks/useHasParsedResume", () => ({
  useHasParsedResume: () => ({ hasResume: true, isLoading: false, error: null, refetch: vi.fn() }),
}));

vi.mock("@/hooks/useLatestParsedResume", () => ({
  useLatestParsedResume: () => ({
    resume: { resume_id: "resume-1", source: "parser" as const, display_name: "Test Resume", parsed_data: {} },
    resumeSchemaVersion: "2.0",
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDefaultCoverLetterResume", () => ({
  useDefaultCoverLetterResume: () => ({ defaultResume: null, isLoading: false, error: null, refetch: vi.fn() }),
}));

vi.mock("@/hooks/useCurrentUserId", () => ({
  useCurrentUserId: () => ({ userId: "user-1", isLoading: false, error: null }),
}));

vi.mock("@/hooks/useGenerateCoverLetter", () => ({
  useGenerateCoverLetter: () => ({
    mutate: vi.fn(),
    retry: vi.fn(),
    abort: vi.fn(),
    isLoading: false,
    data: null,
    error: null,
  }),
}));

// Partial mock: useCoverLetterTemplates also reaches for CoverLetterApiError
// from this module, and a bare factory mock makes that an unhandled rejection.
vi.mock("@/api/coverLetterApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/coverLetterApi")>()),
  listCoverLetterResumeOptions: vi.fn().mockResolvedValue({ resumes: [] }),
  setDefaultCoverLetterResume: vi.fn(),
  listCoverLetterTemplates: vi.fn().mockResolvedValue({ templates: [] }),
}));

vi.mock("@/components/SignUpModal", () => ({ default: () => null }));

vi.mock("@/app/cover-letter/_components/CoverLetterTemplatePreview", () => ({
  CoverLetterTemplatePreview: () => <div data-testid="template-preview" />,
}));

import CoverLetterNewPage from "@/app/cover-letter/new/page";

// Mirrors the caps in page.tsx, which mirror the CL-1.2 ApplicationContext
// schema. Hardcoded here on purpose: a test that imports the constant it is
// checking cannot catch the constant changing.
const MAX_ROLE_TITLE_CHARS = 300;
const MAX_COMPANY_LOCATION_CHARS = 200;

const BASE_SESSION = {
  session_id: SESSION_ID,
  user_id: "user-1",
  job_title: "Senior Backend Engineer",
  company: "Globex Corporation",
  job_description:
    "We are hiring a Senior Backend Engineer to design and own our core payments platform, " +
    "working closely with product and infra teams.",
  job_url: "https://jobs.example.com/123",
  job_location: "Bengaluru, India",
  resume_id: "resume-9",
  jd_id: "jd-9",
  profile: { email: "someone@example.com" },
  created_at: "2026-01-01T00:00:00Z",
  expires_at: "2026-01-01T01:00:00Z",
};

function session(overrides: Record<string, unknown> = {}) {
  return { ...BASE_SESSION, ...overrides };
}

// This page mounts several async hooks; under a loaded runner the default
// 1s waitFor window is not always enough for the prefill to land.
const WAIT = { timeout: 10_000 } as const;

const jdField = () => screen.getByPlaceholderText("Paste the full job description here...");
const companyField = () => screen.getByPlaceholderText("e.g. Globex Corporation");
const roleField = () => screen.getByPlaceholderText("e.g. Senior Backend Engineer");
const locationField = () => screen.getByPlaceholderText("e.g. Bengaluru, India");
const signatureField = () => screen.getByPlaceholderText("e.g. Ananya Rao");

describe("/cover-letter/new — browser extension session prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams.mockReturnValue(new URLSearchParams(`session=${SESSION_ID}`));
    mockGetExtensionSession.mockResolvedValue(session());
    mockParseJDText.mockResolvedValue({ jd_id: "jd-from-analysis" });
    mockGetParsedJDDetails.mockResolvedValue({});
    mockGetResume.mockResolvedValue({ data: {} });
  });

  it("prefills JD, job title, company and location from the session", async () => {
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(jdField()).toHaveValue(BASE_SESSION.job_description), WAIT);
    expect(roleField()).toHaveValue(BASE_SESSION.job_title);
    expect(companyField()).toHaveValue(BASE_SESSION.company);
    expect(locationField()).toHaveValue(BASE_SESSION.job_location);
    expect(mockGetExtensionSession).toHaveBeenCalledWith(SESSION_ID);
  });

  it("leaves the signature name for the user to type", async () => {
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(jdField()).toHaveValue(BASE_SESSION.job_description), WAIT);
    expect(signatureField()).toHaveValue("");
  });

  it("does not fetch a session when no ?session is present", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(jdField()).toBeInTheDocument(), WAIT);
    expect(mockGetExtensionSession).not.toHaveBeenCalled();
  });

  it("truncates a scraped job title to the role-title cap", async () => {
    mockGetExtensionSession.mockResolvedValue(session({ job_title: "T".repeat(400) }));
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(roleField()).toHaveValue("T".repeat(MAX_ROLE_TITLE_CHARS)), WAIT);
  });

  it("truncates a scraped location to the company-location cap", async () => {
    mockGetExtensionSession.mockResolvedValue(session({ job_location: "L".repeat(300) }));
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(locationField()).toHaveValue("L".repeat(MAX_COMPANY_LOCATION_CHARS)), WAIT);
  });

  it("caches only the fields the form consumes — not user_id or profile", async () => {
    render(<CoverLetterNewPage />);

    await waitFor(
      () => expect(sessionStorage.getItem(`careerbot:ext-session:${SESSION_ID}`)).not.toBeNull(),
      WAIT,
    );
    const cached = JSON.parse(sessionStorage.getItem(`careerbot:ext-session:${SESSION_ID}`) as string);
    expect(Object.keys(cached).sort()).toEqual(
      ["company", "job_description", "job_location", "job_title", "resume_id"].sort(),
    );
    expect(cached).not.toHaveProperty("user_id");
    expect(cached).not.toHaveProperty("profile");
  });

  it("reuses the cached session instead of re-consuming a single-use session id", async () => {
    sessionStorage.setItem(
      `careerbot:ext-session:${SESSION_ID}`,
      JSON.stringify({
        job_description: "Cached job description that is comfortably over the fifty character minimum.",
        job_title: "Cached Title",
        company: "Cached Co",
        job_location: "Cached City",
        resume_id: "resume-cached",
      }),
    );

    render(<CoverLetterNewPage />);

    await waitFor(() => expect(roleField()).toHaveValue("Cached Title"), WAIT);
    expect(companyField()).toHaveValue("Cached Co");
    expect(mockGetExtensionSession).not.toHaveBeenCalled();
  });

  it("falls back to manual entry when the session cannot be resolved", async () => {
    mockGetExtensionSession.mockRejectedValue(new Error("Session may have expired"));
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(jdField()).toBeInTheDocument(), WAIT);
    expect(jdField()).toHaveValue("");
    expect(companyField()).toHaveValue("");
  });

  it("tolerates a session with no location (the shape the extension sends today)", async () => {
    const withoutLocation: Record<string, unknown> = { ...BASE_SESSION };
    delete withoutLocation.job_location;
    mockGetExtensionSession.mockResolvedValue(withoutLocation);
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(companyField()).toHaveValue(BASE_SESSION.company), WAIT);
    expect(locationField()).toHaveValue("");
  });

  it("keeps extension-prefilled job details when JD analysis finds no replacements", async () => {
    render(<CoverLetterNewPage />);

    await waitFor(() => expect(jdField()).toHaveValue(BASE_SESSION.job_description), WAIT);
    fireEvent.blur(jdField());

    await waitFor(() => expect(mockGetParsedJDDetails).toHaveBeenCalledWith("jd-from-analysis"), WAIT);
    expect(companyField()).toHaveValue(BASE_SESSION.company);
    expect(roleField()).toHaveValue(BASE_SESSION.job_title);
    expect(locationField()).toHaveValue(BASE_SESSION.job_location);
  });
});
