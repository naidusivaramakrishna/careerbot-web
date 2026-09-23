/**
 * Regression tests for the export dropdown (P2 + P3).
 *
 * Close behavior (P2): the menu used to close only via a blur event on its
 * container. In Safari, and in Firefox on macOS, clicking a <button> does
 * not move focus to it -- opening the menu with a mouse leaves nothing
 * inside it focused, so a click outside never fires blur at all, and the
 * menu stays open until the trigger is clicked again. Fixed with a
 * document-level pointerdown listener (works regardless of that platform
 * focus behavior) plus an Escape key handler.
 *
 * Roles (P3): the panel used to declare aria-haspopup="menu" and
 * role="menu"/"menuitem" without the matching keyboard support (arrow-key
 * movement, focus moving into the panel on open) those roles promise a
 * screen reader. Downgraded to a plain disclosure -- aria-expanded on the
 * trigger, ordinary buttons in the panel, no menu semantics. These tests
 * query by role="button"/accessible name, not role="menu"/"menuitem",
 * matching that.
 *
 * Copy-while-downloading (P3): the trigger used to disable during a
 * download (disabled={!anyFormatAvailable || isDownloading}), blocking
 * Copy as text even though copying has nothing to do with a PDF/DOCX
 * export in flight. Fixed to disabled={!anyFormatAvailable} only; PDF/DOCX
 * still disable themselves individually via isDownloading.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CoverLetterView from "@/app/cover-letter/_components/CoverLetterView";
import { CL_FIXTURES } from "@/tests/mocks/coverLetter/fixtures";
import { useDownloadCoverLetter } from "@/hooks/useDownloadCoverLetter";

vi.mock("@/hooks/useCoverLetterTemplates", () => ({
  useCoverLetterTemplates: () => ({
    templates: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/useDefaultCoverLetterTemplate", () => ({
  useDefaultCoverLetterTemplate: () => ({
    defaultTemplate: null,
    isLoading: false,
    isSaving: false,
    error: null,
    refetch: vi.fn(),
    setDefault: vi.fn(),
  }),
}));
vi.mock("@/hooks/useDownloadCoverLetter", () => ({
  // vi.fn() (not a plain arrow function) so a test can override its return
  // value per-call via vi.mocked(...).mockReturnValue(...).
  useDownloadCoverLetter: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));
vi.mock("@/hooks/useUpdateCoverLetter", () => ({
  useUpdateCoverLetter: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /download \/ export/i }));
}

describe("CoverLetterView — export dropdown close behavior (P2 regression)", () => {
  it("opens the panel on trigger click", () => {
    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    expect(screen.queryByRole("button", { name: /download as pdf/i })).not.toBeInTheDocument();

    openMenu();
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();
  });

  it("closes on a pointerdown outside the panel (the Safari/macOS-Firefox path -- no focus involved)", () => {
    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    openMenu();
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();

    // Simulate exactly what a real outside click delivers: a pointerdown
    // with no preceding blur -- this is the case onBlur alone missed.
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("button", { name: /download as pdf/i })).not.toBeInTheDocument();
  });

  it("does not close when a pointerdown lands inside the panel", () => {
    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    openMenu();
    const pdfOption = screen.getByRole("button", { name: /download as pdf/i });

    fireEvent.pointerDown(pdfOption);
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    openMenu();
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /download as pdf/i })).not.toBeInTheDocument();
  });

  it("renders a disabled option (Copy as text, when plain_text is null) that cannot be selected", () => {
    const letter = { ...CL_FIXTURES.readyToReview, plain_text: null };
    render(<CoverLetterView letter={letter} />);
    openMenu();

    const copyOption = screen.getByRole("button", { name: /copy as text/i });
    expect(copyOption).toBeDisabled();

    fireEvent.click(copyOption);
    // A disabled button ignores clicks -- the panel must still be open,
    // proving no onSelect/close logic ran for it.
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();
  });
});

describe("CoverLetterView — export dropdown roles are a plain disclosure, not an ARIA menu (P3 regression)", () => {
  it("does not declare menu/menuitem roles it doesn't implement keyboard behavior for", () => {
    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    const trigger = screen.getByRole("button", { name: /download \/ export/i });
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    openMenu();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    // The options are ordinary buttons instead.
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download as docx/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy as text/i })).toBeInTheDocument();
  });
});

describe("CoverLetterView — Copy as text stays available while a download is in progress (P3 regression)", () => {
  it("keeps the trigger enabled during isDownloading so the panel can still be opened", () => {
    vi.mocked(useDownloadCoverLetter).mockReturnValue({
      mutate: vi.fn(),
      isLoading: true,
      error: null,
    } as never);

    render(<CoverLetterView letter={CL_FIXTURES.readyToReview} />);
    const trigger = screen.getByRole("button", { name: /preparing/i });
    expect(trigger).not.toBeDisabled();

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: /copy as text/i })).not.toBeDisabled();
    // PDF/DOCX still disable themselves individually during a download.
    expect(screen.getByRole("button", { name: /download as pdf/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /download as docx/i })).toBeDisabled();
  });
});
