import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WizardModalShell from "@/app/(jobs)/jobmatch/_components/wizard/WizardModalShell";

afterEach(cleanup);

function renderShell(wizardStep: 1 | 2 | 3 | 4) {
  const onClose = vi.fn();
  render(
    <WizardModalShell
      open
      wizardStep={wizardStep}
      onClose={onClose}
      onBack={vi.fn()}
      onContinueClick={vi.fn()}
      continueDisabled={false}
      onAnalyzeClick={vi.fn()}
    >
      <h2 id="analyzing-match-title">Analyzing your match</h2>
    </WizardModalShell>
  );
  const dialog = screen.getByRole("dialog");
  return { onClose, dialog, overlay: dialog.parentElement as HTMLElement };
}

describe("wizard shell while the match is being analyzed (step 4)", () => {
  it("ignores Escape and a click on the backdrop", () => {
    const { onClose, dialog, overlay } = renderShell(4);

    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("hides the close button and the footer buttons", () => {
    renderShell(4);

    expect(screen.queryByRole("button", { name: /Close/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  // Control: the same actions do close the wizard on the earlier steps, so the
  // step-4 tests above are not passing just because the handlers are dead.
  it("still closes on Escape and on a backdrop click at step 2", () => {
    const { onClose, dialog, overlay } = renderShell(2);

    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
