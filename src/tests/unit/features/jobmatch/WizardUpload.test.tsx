import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WizardStepResume from "@/app/(jobs)/jobmatch/_components/wizard/WizardStepResume";
import WizardModalShell from "@/app/(jobs)/jobmatch/_components/wizard/WizardModalShell";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Job match resume upload", () => {
  it("passes picked and dropped files to the existing upload handler", () => {
    const onFileSelected = vi.fn();
    render(<WizardStepResume uploadedFile={null} sessionResumeName={null} error={null} onFileSelected={onFileSelected} onClear={vi.fn()} />);
    const file = new File(["resume"], "Resume.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Choose resume file"), { target: { files: [file] } });
    expect(onFileSelected).toHaveBeenLastCalledWith(file);
    fireEvent.drop(screen.getByText("Drag and drop your resume here").parentElement!, { dataTransfer: { files: [file] } });
    expect(onFileSelected).toHaveBeenCalledTimes(2);
  });

  // The limit shown must match the one Overview.tsx enforces (10 MB).
  it("shows the same 10 MB limit that the upload enforces", () => {
    render(<WizardStepResume uploadedFile={null} sessionResumeName={null} error={null} onFileSelected={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText(/Max file size: 10 MB/)).toBeTruthy();
  });

  it("shows the selected file, opens the file picker on Replace, and exposes validation errors", () => {
    const openPicker = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    render(<WizardStepResume uploadedFile={new File(["resume"], "Resume.pdf")} sessionResumeName={null} error="Resume must be under 10MB." onFileSelected={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("Resume.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Replace Resume.pdf" }));
    expect(openPicker).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toContain("Resume must be under 10MB.");
  });

  it("keeps Continue disabled until ready and supports cancel, close, and Escape", () => {
    const onClose = vi.fn();
    const onContinueClick = vi.fn();
    const props = { open: true, wizardStep: 1 as const, onClose, onBack: vi.fn(), onContinueClick, onAnalyzeClick: vi.fn() };
    const child = <h2 id="resume-upload-title">Upload Your Resume</h2>;
    const { rerender } = render(<WizardModalShell {...props} continueDisabled>{child}</WizardModalShell>);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinueClick).not.toHaveBeenCalled();
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
    rerender(<WizardModalShell {...props} continueDisabled={false}>{child}</WizardModalShell>);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinueClick).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Close upload dialog" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
