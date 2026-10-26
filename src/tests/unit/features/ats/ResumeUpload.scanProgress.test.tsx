import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

configure({ asyncUtilTimeout: 10_000 });
vi.setConfig({ testTimeout: 30_000 });

const mockPush = vi.fn();
const mockProcessResumeComplete = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/SignUpModal", () => ({ default: () => null }));
vi.mock("@/api/resumeatsapi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/resumeatsapi")>()),
  processResumeComplete: (...args: unknown[]) => mockProcessResumeComplete(...args),
}));

import ResumeUpload from "@/app/(resume)/ats/_components/upload/ResumeUpload";

type Options = { targetRole?: string; parsed?: unknown; onStage?: (stage: "parsing" | "scoring" | "finishing") => void };
const KEPT_PARSE = { resume_id: "src-1", parsed_data: { contact: { name: "Asha" } } };   // the parse the first attempt already paid for

function upload(container: HTMLElement) {
  const file = new File(["%PDF-1.4 test"], "resume.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "slice", {
    value: () => ({ arrayBuffer: async () => new TextEncoder().encode("%PDF-1.4").buffer }),
  });
  fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
}

const states = () => ["parsing", "scoring", "finishing"].map((id) => screen.getByTestId(`ats-stage-${id}`).getAttribute("data-state"));

describe("public ATS upload shows what the scan is really doing", () => {
  beforeEach(() => { mockProcessResumeComplete.mockReset(); mockPush.mockClear(); localStorage.clear(); sessionStorage.clear(); });
  afterEach(() => cleanup());

  it("moves through the real stages as the API reports them, with no percentage", async () => {
    const gates: Array<() => void> = [];
    const wait = () => new Promise<void>((resolve) => gates.push(resolve));
    mockProcessResumeComplete.mockImplementation(async (_f: File, options: Options = {}) => {
      options.onStage?.("parsing");
      await wait();
      options.onStage?.("scoring");
      await wait();
      options.onStage?.("finishing");
      await wait();
      return { success: true, resume_id: "r-1", finalWeightedScore: 70, parsed_data: {}, missingFields: [] };
    });
    // The page shows "Step 1" before the API call starts, so wait until the call is parked on a gate.
    const release = async () => {
      await waitFor(() => expect(gates.length).toBeGreaterThan(0));
      await act(async () => { gates.shift()?.(); });
    };

    const { container } = render(<ResumeUpload />);
    upload(container);

    await waitFor(() => expect(screen.getByTestId("ats-step").textContent).toContain("Step 1"));
    expect(states()).toEqual(["active", "queued", "queued"]);
    // The ring shows the stage, not a percentage (other copy on the page may mention percentages).
    expect(screen.getByTestId("ats-step").parentElement?.textContent).not.toContain("%");
    expect(screen.getByText("Uploading and reading your resume...")).toBeInTheDocument();

    await release();
    await waitFor(() => expect(screen.getByTestId("ats-step").textContent).toContain("Step 2"));
    expect(states()).toEqual(["done", "active", "queued"]);
    expect(screen.getByText("Scoring your resume...")).toBeInTheDocument();

    await release();
    await waitFor(() => expect(screen.getByTestId("ats-step").textContent).toContain("Step 3"));
    expect(states()).toEqual(["done", "done", "active"]);

    await release();
    await waitFor(() => expect(screen.queryByTestId("ats-step")).toBeNull());
  });

  it("no longer shows messages that were only a function of time", async () => {
    mockProcessResumeComplete.mockImplementation(() => new Promise(() => undefined));
    const { container } = render(<ResumeUpload />);
    upload(container);
    await screen.findByTestId("ats-step");

    for (const invented of ["Validating file format", "AI is parsing document content", "Calculating ATS compatibility", "Generating recommendations"]) {
      expect(container.textContent).not.toContain(invented);
    }
  });

  it("counts the real elapsed time", async () => {
    let now = 3_000_000;
    const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
    try {
      mockProcessResumeComplete.mockImplementation(() => new Promise(() => undefined));
      const { container } = render(<ResumeUpload />);
      upload(container);
      await screen.findByTestId("ats-elapsed");
      expect(screen.getByTestId("ats-elapsed").textContent).toBe("0:00 elapsed");

      now += 75_000;
      await waitFor(() => expect(screen.getByTestId("ats-elapsed").textContent).toMatch(/^1:1\d elapsed$|^1:0\d elapsed$/), { timeout: 5000 });
    } finally {
      clock.mockRestore();
    }
  });
});

describe("public ATS upload asks for a role when the resume names none", () => {
  beforeEach(() => { mockProcessResumeComplete.mockReset(); mockPush.mockClear(); localStorage.clear(); sessionStorage.clear(); });
  afterEach(() => cleanup());

  const needsRole = (_f: File, options: Options = {}) => {
    options.onStage?.("parsing");
    options.onStage?.("scoring");
    return Promise.resolve(options.targetRole
      ? { success: true, resume_id: "r-2", finalWeightedScore: 64, parsed_data: {}, missingFields: [] }
      : { success: false, code: "target_role_required", parsed: KEPT_PARSE, error: "We could not tell which role to score your resume for." });
  };

  it("asks instead of failing, then scans again with the role the user typed", async () => {
    mockProcessResumeComplete.mockImplementation(needsRole);
    const { container } = render(<ResumeUpload />);
    upload(container);

    await screen.findByRole("dialog", { name: "Which role are you aiming for?" });
    expect(screen.queryByText(/could not tell which role/i)).toBeNull();          // not shown as a scan error

    fireEvent.change(screen.getByLabelText("Target role"), { target: { value: " Data Analyst " } });
    fireEvent.click(screen.getByRole("button", { name: "Scan my resume" }));

    await waitFor(() => expect(mockProcessResumeComplete).toHaveBeenCalledTimes(2));
    expect(mockProcessResumeComplete.mock.calls[0][1].targetRole).toBeUndefined();
    expect(mockProcessResumeComplete.mock.calls[1][1].targetRole).toBe("Data Analyst");
    expect(mockProcessResumeComplete.mock.calls[0][1].parsed).toBeUndefined();
    expect(mockProcessResumeComplete.mock.calls[1][1].parsed).toBe(KEPT_PARSE);     // the file is not uploaded and parsed again
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Which role are you aiming for?" })).toBeNull());
    expect(localStorage.getItem("currentScore") ?? sessionStorage.getItem("currentScore")).toBe("64");
  });

  it("starts over when the user cancels", async () => {
    mockProcessResumeComplete.mockImplementation(needsRole);
    const { container } = render(<ResumeUpload />);
    upload(container);
    await screen.findByRole("dialog", { name: "Which role are you aiming for?" });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Which role are you aiming for?" })).toBeNull();
    expect(mockProcessResumeComplete).toHaveBeenCalledTimes(1);
  });
});
