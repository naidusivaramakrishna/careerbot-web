import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSavedResumeSnapshot } from "@/app/(resume)/builder/creation/_hooks/useSavedResumeSnapshot";

type Props = { data: { title: string }; loading: boolean; saved: number; synced: number };

const setup = (initial: Props) =>
  renderHook((p: Props) => useSavedResumeSnapshot(p.data, p.loading, p.saved, p.synced), { initialProps: initial });

describe("useSavedResumeSnapshot (saved content for the progress ticks and the preview)", () => {
  it("ignores drafts until a save lands", () => {
    const { result, rerender } = setup({ data: { title: "saved" }, loading: false, saved: 0, synced: 0 });
    rerender({ data: { title: "draft" }, loading: false, saved: 0, synced: 0 });
    expect(result.current.title).toBe("saved");

    rerender({ data: { title: "draft" }, loading: false, saved: 1, synced: 0 });
    expect(result.current.title).toBe("draft");
  });

  it("takes the loaded resume once loading finishes, and a server sync", () => {
    const { result, rerender } = setup({ data: { title: "" }, loading: true, saved: 0, synced: 0 });
    rerender({ data: { title: "loaded" }, loading: true, saved: 0, synced: 0 });
    expect(result.current.title).toBe("");
    rerender({ data: { title: "loaded" }, loading: false, saved: 0, synced: 0 });
    expect(result.current.title).toBe("loaded");

    rerender({ data: { title: "from server" }, loading: false, saved: 0, synced: 1 });
    expect(result.current.title).toBe("from server");
  });
});
