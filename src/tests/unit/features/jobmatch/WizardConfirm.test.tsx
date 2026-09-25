import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WizardStepConfirm from "@/app/(jobs)/jobmatch/_components/wizard/WizardStepConfirm";
import WizardModalShell from "@/app/(jobs)/jobmatch/_components/wizard/WizardModalShell";

afterEach(cleanup);

describe("Review and confirm popup", () => {
  it("shows real resume metadata and plain-text job content with working review actions", () => {
    const onReplaceResume = vi.fn();
    const onEditJobDescription = vi.fn();
    const text = "Role: Frontend Engineer\nSkills: React, TypeScript\n<script>alert(1)</script>";
    const { container } = render(<WizardStepConfirm uploadedFile={new File(["resume"], "Resume.pdf")} sessionResumeName={null} jdFile={null} jdText={text} error={null} onReplaceResume={onReplaceResume} onEditJobDescription={onEditJobDescription} />);
    expect(screen.getByText("Resume.pdf")).toBeTruthy();
    // "PDF" appears twice: the badge on the file icon and the file type in the details.
    expect(screen.getAllByText("PDF")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Job description preview" }).textContent).toBe(text);
    expect(container.querySelector("script")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit job description" }));
    expect(onReplaceResume).toHaveBeenCalledOnce();
    expect(onEditJobDescription).toHaveBeenCalledOnce();
  });

  it("handles saved resumes and files without extracted text honestly", () => {
    render(<WizardStepConfirm uploadedFile={null} sessionResumeName="Saved Resume" jdFile={new File(["job"], "Role.docx")} jdText="" error="Analysis unavailable" onReplaceResume={vi.fn()} onEditJobDescription={vi.fn()} />);
    expect(screen.getByText("Saved Resume")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Job description preview" }).textContent).toContain("Text preview is not available");
    expect(screen.getByRole("alert").textContent).toBe("Analysis unavailable");
  });

  it("keeps analysis inside the dialog and calls the original analysis action", () => {
    const onAnalyzeClick = vi.fn();
    const onBack = vi.fn();
    const onContinueClick = vi.fn();
    const props = { open: true, wizardStep: 3 as const, onClose: vi.fn(), onBack, onContinueClick, onAnalyzeClick };
    const child = <h2 id="review-confirm-title">Review &amp; Confirm</h2>;
    const { rerender } = render(<WizardModalShell {...props} continueDisabled>{child}</WizardModalShell>);
    expect(screen.getByRole("dialog", { name: "Review & Confirm" })).toBeTruthy();
    expect(screen.getByText("Step 3 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Analyze Match" }));
    expect(onAnalyzeClick).not.toHaveBeenCalled();
    rerender(<WizardModalShell {...props} continueDisabled={false}>{child}</WizardModalShell>);
    fireEvent.click(screen.getByRole("button", { name: "Analyze Match" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onAnalyzeClick).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
    expect(onContinueClick).not.toHaveBeenCalled();
  });
});
