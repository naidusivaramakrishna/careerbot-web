import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PriorFixesDialog from "@/components/common/PriorFixesDialog";

const setup = (props: Partial<React.ComponentProps<typeof PriorFixesDialog>> = {}) => {
  const onContinue = vi.fn();
  const onStartFresh = vi.fn();
  render(<PriorFixesDialog count={2} onContinue={onContinue} onStartFresh={onStartFresh} {...props} />);
  return { onContinue, onStartFresh };
};

describe("PriorFixesDialog", () => {
  it("renders nothing when there are no saved fixes", () => {
    render(<PriorFixesDialog count={0} onContinue={vi.fn()} onStartFresh={vi.fn()} />);
    expect(screen.queryByTestId("prior-fixes-dialog")).toBeNull();
  });

  it("is a modal dialog that names the number of fixes, with the safe action focused", () => {
    setup();
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.textContent).toContain("2 fixes applied");
    expect(document.activeElement?.textContent).toBe("Continue with my changes");
  });

  it("keeps the fixes on the primary button, Escape and a click outside", () => {
    const { onContinue, onStartFresh } = setup();
    fireEvent.click(screen.getByText("Continue with my changes"));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByTestId("prior-fixes-dialog"));
    expect(onContinue).toHaveBeenCalledTimes(3);
    expect(onStartFresh).not.toHaveBeenCalled();
  });

  it("needs a second confirmation before discarding, and cancel goes back", () => {
    const { onStartFresh } = setup({ count: 1 });
    fireEvent.click(screen.getByText("Start with fresh data"));
    expect(onStartFresh).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog").textContent).toContain("discards the 1 fix you applied");
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Continue with my changes")).toBeTruthy();
    fireEvent.click(screen.getByText("Start with fresh data"));
    fireEvent.click(screen.getByText("Yes, start fresh"));
    expect(onStartFresh).toHaveBeenCalledTimes(1);
  });

  it("focuses Cancel, not the destructive button, on the confirmation step", () => {
    setup();
    fireEvent.click(screen.getByText("Start with fresh data"));
    expect(document.activeElement?.textContent).toBe("Cancel");
  });

  it("ignores Escape and outside clicks while starting fresh", () => {
    const { onContinue } = setup({ busy: true });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByTestId("prior-fixes-dialog"));
    expect(onContinue).not.toHaveBeenCalled();
  });
});
