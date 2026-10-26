import React from "react";
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TargetRolePrompt from "@/components/common/TargetRolePrompt";

const renderPrompt = (value = "") => {
  const props = { value, onChange: vi.fn(), onSubmit: vi.fn(), onCancel: vi.fn() };
  render(<TargetRolePrompt {...props} />);
  return props;
};

describe("TargetRolePrompt", () => {
  it("submits only once a role is typed", () => {
    const empty = renderPrompt("");
    expect((screen.getByRole("button", { name: "Scan my resume" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(empty.onSubmit).not.toHaveBeenCalled();
  });

  it.each(["x", "na", "Not specified"])("does not submit %p, which the API does not accept as a role", (typed) => {
    const props = renderPrompt(typed);
    expect((screen.getByRole("button", { name: "Scan my resume" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Target role").getAttribute("aria-describedby")).toBe("target-role-hint");
    expect(screen.getByText(/Enter a job title/)).toBeTruthy();         // says why the button is off
  });

  it("shows no hint for an empty field or a usable role", () => {
    renderPrompt("");
    expect(screen.queryByText(/Enter a job title/)).toBeNull();
    cleanup();
    renderPrompt("QA Engineer");
    expect(screen.queryByText(/Enter a job title/)).toBeNull();
    expect(screen.getByLabelText("Target role").getAttribute("aria-describedby")).toBeNull();
  });

  it("says the resume names no role by default, and shows the caller's reason instead when given", () => {
    renderPrompt("");
    expect(screen.getByRole("dialog")).toHaveTextContent("Your resume has no headline or job title");
    cleanup();
    render(<TargetRolePrompt value="" onChange={vi.fn()} onSubmit={vi.fn()} onCancel={vi.fn()} reason={'We couldn\'t score your resume for "X".'} />);
    expect(screen.getByRole("dialog").textContent).toContain("We couldn't score your resume for \"X\". Your ATS score");
    expect(screen.getByRole("dialog").textContent).not.toContain("no headline");
  });

  it("submits the typed role", () => {
    const props = renderPrompt("Software Developer");
    fireEvent.click(screen.getByRole("button", { name: "Scan my resume" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("closes with Escape as well as with Cancel", () => {
    const props = renderPrompt("Software Developer");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });

  it("keeps Tab inside the dialog", () => {
    renderPrompt("Software Developer");
    const dialog = screen.getByRole("dialog");
    const submit = screen.getByRole("button", { name: "Scan my resume" });
    submit.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });                       // from the last control back to the first
    expect(document.activeElement).toBe(screen.getByLabelText("Target role"));
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });       // from the first control to the last
    expect(document.activeElement).toBe(submit);
  });

  it("gives focus back to what opened it when it closes", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<TargetRolePrompt value="x" onChange={vi.fn()} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("does not close on other keys", () => {
    const props = renderPrompt("x");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
