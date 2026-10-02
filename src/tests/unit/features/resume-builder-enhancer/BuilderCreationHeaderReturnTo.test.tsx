/**
 * The builder/creation Header is the ONE place a `return_to` value is actually
 * navigated to ("Use for cover letter"). Every other surface only forwards the
 * value along as a query param, so this is the sink that has to hold.
 *
 * Regression cover for: `return_to=/..//evil.com` passed the old
 * `startsWith("/") && !startsWith("//")` check, and
 * `new URL("/..//evil.com", origin).pathname` is "//evil.com" — a
 * protocol-relative path, i.e. an off-origin navigation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { mockPush, mockSearchParams, mockParams } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSearchParams: vi.fn(),
  mockParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams(),
  useParams: () => mockParams(),
}));

import Header from "@/app/(resume)/builder/creation/_components/Header";

const RESUME_ID = "builder-7";

function renderHeader(returnTo?: string) {
  mockParams.mockReturnValue({ resumeId: RESUME_ID });
  mockSearchParams.mockReturnValue(
    new URLSearchParams(returnTo === undefined ? "" : `return_to=${encodeURIComponent(returnTo)}`),
  );
  render(<Header />);
}

function clickUseForCoverLetter() {
  fireEvent.click(screen.getByRole("button", { name: /Use for cover letter/i }));
}

function pushedPath(): string {
  expect(mockPush).toHaveBeenCalledTimes(1);
  return mockPush.mock.calls[0][0] as string;
}

describe("builder/creation Header — return_to navigation sink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("honours a legitimate in-app return_to", () => {
    renderHeader("/cover-letter/new");
    clickUseForCoverLetter();

    expect(pushedPath()).toBe(`/cover-letter/new?resume_id=${RESUME_ID}&resume_source=builder`);
  });

  it("falls back to /cover-letter/new when return_to is absent", () => {
    renderHeader();
    clickUseForCoverLetter();

    expect(pushedPath()).toBe(`/cover-letter/new?resume_id=${RESUME_ID}&resume_source=builder`);
  });

  // The shapes that defeated the raw startsWith check.
  const offOrigin = ["/..//evil.com", "/./..//evil.com", "/a/../..//evil.com", "/\\evil.com", "//evil.com"];

  for (const value of offOrigin) {
    it(`never navigates off-origin for return_to=${JSON.stringify(value)}`, () => {
      renderHeader(value);
      clickUseForCoverLetter();

      const path = pushedPath();
      expect(path.startsWith("//")).toBe(false);
      expect(new URL(path, "https://app.careerbot.test").origin).toBe("https://app.careerbot.test");
      expect(path).toBe(`/cover-letter/new?resume_id=${RESUME_ID}&resume_source=builder`);
    });
  }

  it("does not trust an off-origin value already sitting in localStorage", () => {
    // Written by an older build, or by any other writer of this key — it has
    // not been through the URL-param check.
    localStorage.setItem("careerbot:builder:return_to", "/..//evil.com");
    renderHeader();
    clickUseForCoverLetter();

    const path = pushedPath();
    expect(path.startsWith("//")).toBe(false);
    expect(path).toBe(`/cover-letter/new?resume_id=${RESUME_ID}&resume_source=builder`);
  });

  it("clears the stored return_to on back-navigation", () => {
    localStorage.setItem("careerbot:builder:return_to", "/cover-letter/new");
    localStorage.setItem("resumeData", "{}");
    renderHeader("/cover-letter/new");

    fireEvent.click(screen.getByRole("button", { name: /Go back to resume page/i }));

    expect(localStorage.getItem("careerbot:builder:return_to")).toBeNull();
    expect(localStorage.getItem("resumeData")).toBeNull();
    expect(pushedPath()).toBe("/builder/start/list");
  });
});
