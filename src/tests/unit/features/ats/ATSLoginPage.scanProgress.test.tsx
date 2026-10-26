import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from "@testing-library/react";

// The real page is heavy to render; the default 1 s wait is too short on a busy machine.
configure({ asyncUtilTimeout: 10_000 });
vi.setConfig({ testTimeout: 30_000 });

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const scan = vi.hoisted(() => vi.fn());
vi.mock("@/api/resumeatsapi", () => ({ processResumeComplete: scan }));

import ATSLoginPage from "@/app/(resume)/atslogin/_components/ATSLoginPage";

type Options = { targetRole?: string; parsed?: unknown; onStage?: (stage: "parsing" | "scoring" | "finishing") => void };
const KEPT_PARSE = { resume_id: "src-1", parsed_data: { contact: { name: "Asha" } } };   // the parse the first attempt already paid for

/** A scan the test drives by hand: each real stage waits for the test to release it. */
function controlledScan() {
  const gates: Array<() => void> = [];
  const wait = () => new Promise<void>((resolve) => gates.push(resolve));
  scan.mockImplementation(async (_file: File, options: Options = {}) => {
    options.onStage?.("parsing");
    await wait();
    options.onStage?.("scoring");
    await wait();
    options.onStage?.("finishing");
    await wait();
    return { success: true, resume_id: "r-1" };
  });
  return { release: async () => { await act(async () => { gates.shift()?.(); }); } };
}

async function startScan(container: HTMLElement) {
  const file = new File(["x"], "resume.pdf", { type: "application/pdf" });
  fireEvent.change(container.querySelector("#ats-file-upload") as HTMLInputElement, { target: { files: [file] } });
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(await screen.findByRole("button", { name: /Analyze My Resume|Upload & Scan Resume/i }));
}

const stageState = (id: string) => screen.getByTestId(`scan-stage-${id}`).getAttribute("data-state");

describe("ATS scan progress shows what the scan is really doing", () => {
  beforeEach(() => { scan.mockReset(); nav.push.mockClear(); });
  afterEach(() => { cleanup(); });

  it("moves through the three real stages as the API reports them", async () => {
    const driver = controlledScan();
    const { container } = render(<ATSLoginPage />);
    await startScan(container);

    await waitFor(() => expect(screen.getByTestId("scan-step").textContent).toBe("Step 1 of 3"));
    expect([stageState("parsing"), stageState("scoring"), stageState("finishing")]).toEqual(["active", "queued", "queued"]);

    await driver.release();
    await waitFor(() => expect(screen.getByTestId("scan-step").textContent).toBe("Step 2 of 3"));
    expect([stageState("parsing"), stageState("scoring"), stageState("finishing")]).toEqual(["done", "active", "queued"]);

    await driver.release();
    await waitFor(() => expect(screen.getByTestId("scan-step").textContent).toBe("Step 3 of 3"));
    expect([stageState("parsing"), stageState("scoring"), stageState("finishing")]).toEqual(["done", "done", "active"]);

    await driver.release();
    await waitFor(() => expect(screen.getByText("Analysis Complete")).toBeTruthy());
    expect(screen.getByText(/Opening your report/)).toBeTruthy();           // the wait is animated, not a frozen tick
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/atslogin/report?resume_id=r-1"));
  });

  it("shows no invented numbers: no percentage, no countdown, no checks that were never run", async () => {
    controlledScan();
    const { container } = render(<ATSLoginPage />);
    await startScan(container);
    await screen.findByTestId("scan-step");

    const overlay = screen.getByRole("dialog", { name: "Scanning your resume" });
    expect(overlay.textContent).toContain("ATS Scan");
    expect(overlay.textContent).not.toMatch(/premium/i);
    expect(overlay.textContent).not.toMatch(/elapsed/i);                         // no running clock in the overlay
    expect(screen.queryByTestId("scan-elapsed")).toBeNull();
    expect(overlay.textContent).not.toMatch(/\d+\s*%/);
    expect(overlay.textContent).not.toMatch(/sec left/i);
    for (const invented of ["Skills Validation", "Keyword Optimization", "Readability Analysis", "Finding missing keywords"]) {
      expect(overlay.textContent).not.toContain(invented);
    }
  });

  it("only reassures after a long wait (and shows no elapsed counter)", async () => {
    let now = 1_000_000;
    const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
    try {
      controlledScan();
      const { container } = render(<ATSLoginPage />);
      await startScan(container);
      await screen.findByTestId("scan-step");

      expect(screen.queryByText(/Long or scanned resumes/)).toBeNull();
      now += 65_000;                                   // the clock moves; the page's own 1 s tick reads it
      await waitFor(() => expect(screen.getByText(/Long or scanned resumes can take a little longer/)).toBeTruthy(), { timeout: 5000 });
      expect(screen.queryByTestId("scan-elapsed")).toBeNull();
    } finally {
      clock.mockRestore();
    }
  });

  it("starts the scan once, even if Analyze is pressed again while it runs", async () => {
    controlledScan();
    const { container } = render(<ATSLoginPage />);
    await startScan(container);
    await screen.findByTestId("scan-step");

    const analyze = screen.queryByRole("button", { name: /Analyze My Resume/ });
    if (analyze) {
      expect((analyze as HTMLButtonElement).disabled).toBe(true);        // nothing to press during a scan
      fireEvent.click(analyze);
    }
    expect(scan).toHaveBeenCalledTimes(1);                                // one parse + one enhance, one credit
  });

  it("shows the real failure, not a progress bar, when the scan fails", async () => {
    scan.mockImplementation(async (_file: File, options: Options = {}) => {
      options.onStage?.("parsing");
      return { success: false, error: "Parse failed on server" };
    });
    const { container } = render(<ATSLoginPage />);
    await startScan(container);

    await waitFor(() => expect(screen.getByText(/Parse failed on server/)).toBeTruthy());
    expect(screen.queryByTestId("scan-step")).toBeNull();
  });
});

describe("a resume with no role anywhere is asked for one", () => {
  beforeEach(() => { scan.mockReset(); nav.push.mockClear(); });

  const needsRole = (_file: File, options: Options = {}) => {
    options.onStage?.("parsing");
    options.onStage?.("scoring");
    return Promise.resolve(options.targetRole
      ? { success: true, resume_id: "r-2" }
      : { success: false, code: "target_role_required", parsed: KEPT_PARSE, error: "We could not tell which role to score your resume for." });
  };

  it("asks instead of failing, then scans with the role the user typed", async () => {
    scan.mockImplementation(needsRole);
    const { container } = render(<ATSLoginPage />);
    await startScan(container);

    const prompt = await screen.findByRole("dialog", { name: "Which role are you aiming for?" });
    expect(prompt.textContent).toContain("no headline or job title");
    expect(screen.queryByText(/could not tell which role/i)).toBeNull();      // not shown as an error

    const submit = screen.getByRole("button", { name: "Scan my resume" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);                                         // a role is required
    fireEvent.change(screen.getByLabelText("Target role"), { target: { value: "  Software Developer " } });
    fireEvent.click(submit);

    await waitFor(() => expect(scan).toHaveBeenCalledTimes(2));
    expect(scan.mock.calls[0][1].targetRole).toBeUndefined();
    expect(scan.mock.calls[1][1].targetRole).toBe("Software Developer");
    expect(scan.mock.calls[0][1].parsed).toBeUndefined();
    expect(scan.mock.calls[1][1].parsed).toBe(KEPT_PARSE);            // the file is not uploaded and parsed again
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/atslogin/report?resume_id=r-2"));
  });

  it("does not offer the role typed for one file when another file needs one", async () => {
    scan.mockImplementation(needsRole);
    const { container } = render(<ATSLoginPage />);
    await startScan(container);
    fireEvent.change(await screen.findByLabelText("Target role"), { target: { value: "Support Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.change(container.querySelector("#ats-file-upload") as HTMLInputElement, {
      target: { files: [new File(["y"], "other.pdf", { type: "application/pdf" })] },
    });
    const agree = await screen.findByRole("checkbox") as HTMLInputElement;
    if (!agree.checked) fireEvent.click(agree);
    fireEvent.click(await screen.findByRole("button", { name: /Analyze My Resume|Upload & Scan Resume/i }));

    expect((await screen.findByLabelText("Target role") as HTMLInputElement).value).toBe("");
    expect(scan.mock.calls[1][1].parsed).toBeUndefined();            // another file is parsed on its own, not scored on the old parse
  });

  it("does not scan again when the user cancels", async () => {
    scan.mockImplementation(needsRole);
    const { container } = render(<ATSLoginPage />);
    await startScan(container);
    await screen.findByRole("dialog", { name: "Which role are you aiming for?" });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Which role are you aiming for?" })).toBeNull();
    expect(scan).toHaveBeenCalledTimes(1);
  });

  it("a role the user cancelled is not sent by the next Analyze click on the same file", async () => {
    scan.mockImplementation(needsRole);
    const { container } = render(<ATSLoginPage />);
    await startScan(container);
    fireEvent.change(await screen.findByLabelText("Target role"), { target: { value: "Support Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(await screen.findByRole("button", { name: /Analyze My Resume|Upload & Scan Resume/i }));

    await waitFor(() => expect(scan).toHaveBeenCalledTimes(2));
    expect(scan.mock.calls[1][1].targetRole).toBeUndefined();
    expect((await screen.findByLabelText("Target role") as HTMLInputElement).value).toBe("");
  });

  it("never mistakes the click event for a role on the first scan", async () => {
    scan.mockImplementation(needsRole);
    const { container } = render(<ATSLoginPage />);
    await startScan(container);
    await screen.findByRole("dialog", { name: "Which role are you aiming for?" });
    expect(scan.mock.calls[0][1].targetRole).toBeUndefined();
  });
});
