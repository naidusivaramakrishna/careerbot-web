import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JobMatchSectionEditor from "@/app/(jobs)/jobmatch/_components/resume/JobMatchSectionEditor";

afterEach(cleanup);

function renderEditor() {
  const onClose = vi.fn();
  const onSave = vi.fn();
  render(
    <JobMatchSectionEditor
      sectionKey="summary"
      sectionLabel="Professional Summary"
      initialData="Developer"
      onSave={onSave}
      onClose={onClose}
    />
  );
  return { onClose, onSave };
}

describe("section editor keyboard handling", () => {
  it("stays open while Space or Enter is typed in a field", () => {
    const { onClose } = renderEditor();
    const field = screen.getByRole("textbox");

    fireEvent.keyDown(field, { key: " " });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not swallow the Space key typed in a field", () => {
    renderEditor();

    // fireEvent returns false when the key's default action was cancelled.
    expect(fireEvent.keyDown(screen.getByRole("textbox"), { key: " " })).toBe(true);
  });

  it("does not cancel Enter or Space on the Save button, so Save can run", () => {
    const { onClose } = renderEditor();
    const save = screen.getByRole("button", { name: "Save" });

    expect(fireEvent.keyDown(save, { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(save, { key: " " })).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("saves the typed text when Save is clicked", () => {
    const { onSave, onClose } = renderEditor();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Senior developer" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith("summary", "Senior developer");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { onClose } = renderEditor();

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when the dark backdrop is clicked, but not when the panel is clicked", () => {
    const { onClose } = renderEditor();
    const panel = screen.getByRole("dialog", { name: "Professional Summary" });

    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(panel.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
