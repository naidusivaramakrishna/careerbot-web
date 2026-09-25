import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WizardStepJobDescription from "@/app/(jobs)/jobmatch/_components/wizard/WizardStepJobDescription";
import WizardModalShell from "@/app/(jobs)/jobmatch/_components/wizard/WizardModalShell";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderStep(overrides: Partial<React.ComponentProps<typeof WizardStepJobDescription>> = {}) {
  const props = {
    jdText: "", jdFile: null, isExtractingJd: false, error: null,
    onTextChange: vi.fn(), onFileSelected: vi.fn(), onClear: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<WizardStepJobDescription {...props} />) };
}

describe("Job description dialog", () => {
  it("preserves text editing, skill highlighting and sanitization", () => {
    const { props, container } = renderStep({ jdText: "React developer <script>alert(1)</script>" });
    fireEvent.change(screen.getByRole("textbox", { name: "Job description" }), { target: { value: "https://example.com/jobs/developer" } });
    expect(props.onTextChange).toHaveBeenCalledWith("https://example.com/jobs/developer");
    expect(container.querySelector("mark")?.textContent).toBe("React");
    expect(container.querySelector("script")).toBeNull();
  });

  it("adds a job posting URL from the Job URL tab", () => {
    const { props } = renderStep();
    fireEvent.click(screen.getByRole("tab", { name: /Job URL/ }));
    const input = screen.getByLabelText("Job posting URL");
    fireEvent.change(input, { target: { value: "https://example.com/jobs/1" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(props.onTextChange).toHaveBeenCalledWith("https://example.com/jobs/1");
    expect(screen.getByRole("status").textContent).toContain("Job link added");
  });

  it("rejects a value that is not a web link", () => {
    const { props } = renderStep();
    fireEvent.click(screen.getByRole("tab", { name: /Job URL/ }));
    const input = screen.getByLabelText("Job posting URL");
    fireEvent.change(input, { target: { value: "not a link" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(props.onTextChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Enter a valid public job posting URL.");
  });

  it("preserves file selection, extraction status, errors and opens the file picker on Replace", () => {
    const openPicker = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const file = new File(["Job description"], "Role.txt", { type: "text/plain" });
    const { props } = renderStep({ jdFile: file, isExtractingJd: true, error: "Extraction unavailable" });
    fireEvent.change(screen.getByLabelText("Choose job description file"), { target: { files: [file] } });
    expect(props.onFileSelected).toHaveBeenCalledWith(file);
    expect(screen.getByRole("status").textContent).toContain("Extracting text...");
    expect(screen.getByRole("alert").textContent).toBe("Extraction unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Replace job description file" }));
    expect(openPicker).toHaveBeenCalledOnce();
  });

  it("shows step two and routes Back and Continue through existing callbacks", () => {
    const onBack = vi.fn();
    const onContinueClick = vi.fn();
    const props = { open: true, wizardStep: 2 as const, onClose: vi.fn(), onBack, onContinueClick, onAnalyzeClick: vi.fn() };
    const child = <h2 id="job-description-title">Add Job Description</h2>;
    const { rerender } = render(<WizardModalShell {...props} continueDisabled>{child}</WizardModalShell>);
    expect(screen.getByText("Step 2 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinueClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
    rerender(<WizardModalShell {...props} continueDisabled={false}>{child}</WizardModalShell>);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinueClick).toHaveBeenCalledOnce();
  });
});
