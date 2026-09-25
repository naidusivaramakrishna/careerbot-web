/**
 * Regression test for #83 review P1-3: the section editor remounted mid-edit.
 *
 * EditorTab keys the open section's editor on `${openModalSection}-${version}`
 * so it remounts with fresh data when a section is opened. The version used to
 * be snapshotted into a ref by an effect, i.e. AFTER the first render of the
 * newly opened modal, so that render used the previous open's version and the
 * next re-render (a keystroke, setIsAutoSaving, a sync) changed the key and
 * remounted the editor, discarding its local edit state.
 */
import { describe, it, expect } from "vitest";
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useModalMountVersion } from "@/app/(resume)/builder/creation/_hooks/useModalMountVersion";

let mounts = 0;
function SectionEditor() {
  // Local edit state that a remount would discard.
  const [value, setValue] = useState(() => {
    mounts += 1;
    return "";
  });
  return <input aria-label="field" value={value} onChange={(e) => setValue(e.target.value)} />;
}

function Harness({ openModalSection, version }: { openModalSection: string | null; version: number }) {
  const mountVersion = useModalMountVersion(openModalSection, version);
  const [, setTick] = useState(0);
  return (
    <div>
      <button onClick={() => setTick((t) => t + 1)}>rerender</button>
      {openModalSection && <SectionEditor key={`${openModalSection}-${mountVersion}`} />}
    </div>
  );
}

describe("EditorTab section-editor key (P1-3)", () => {
  it("does not remount the open editor when a re-render follows a version change made before opening", () => {
    mounts = 0;
    const { rerender } = render(<Harness openModalSection={null} version={0} />);
    // A data sync bumps the version while no modal is open.
    rerender(<Harness openModalSection={null} version={3} />);
    // Open the section.
    rerender(<Harness openModalSection="Projects" version={3} />);
    fireEvent.change(screen.getByLabelText("field"), { target: { value: "typed" } });
    // Any later re-render (keystroke, autosave status, ...) must keep the key.
    act(() => { fireEvent.click(screen.getByText("rerender")); });
    expect(screen.getByLabelText("field")).toHaveValue("typed");
    expect(mounts).toBe(1);
  });

  it("does not remount when the version bumps while the same section stays open", () => {
    mounts = 0;
    const { rerender } = render(<Harness openModalSection="Projects" version={1} />);
    fireEvent.change(screen.getByLabelText("field"), { target: { value: "typed" } });
    rerender(<Harness openModalSection="Projects" version={2} />);
    act(() => { fireEvent.click(screen.getByText("rerender")); });
    expect(screen.getByLabelText("field")).toHaveValue("typed");
    expect(mounts).toBe(1);
  });

  it("still remounts with fresh state when the section is closed and reopened after a sync", () => {
    mounts = 0;
    const { rerender } = render(<Harness openModalSection="Projects" version={1} />);
    fireEvent.change(screen.getByLabelText("field"), { target: { value: "typed" } });
    rerender(<Harness openModalSection={null} version={1} />);
    rerender(<Harness openModalSection={null} version={2} />);
    rerender(<Harness openModalSection="Projects" version={2} />);
    expect(screen.getByLabelText("field")).toHaveValue("");
    expect(mounts).toBe(2);
  });
});
