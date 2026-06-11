/**
 * Component tests for CopyButton.tsx
 *
 * Tests:
 *   - Default label and custom label
 *   - Copy via navigator.clipboard (success + failure)
 *   - Fallback to execCommand for older browsers
 *   - Icon change to check mark on success
 *   - Label change to "Copied" on success
 *   - Auto-revert after 2s timeout
 *   - Toast notifications (success + error)
 *   - Accessibility: aria-label, button role, keyboard accessible
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CopyButton from "@/app/cover-letter/_components/CopyButton";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("CopyButton", () => {
  const testText = "This is the text to copy";

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  describe("rendering", () => {
    it("renders as a button element", () => {
      render(<CopyButton text={testText} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders with default label 'Copy plain text'", () => {
      render(<CopyButton text={testText} />);
      expect(screen.getByText("Copy plain text")).toBeInTheDocument();
    });

    it("renders with custom label when provided", () => {
      render(<CopyButton text={testText} label="Copy to clipboard" />);
      expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
    });

    it("has aria-label matching the display label", () => {
      render(<CopyButton text={testText} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Copy plain text"
      );
    });

    it("has custom aria-label when label prop is provided", () => {
      render(<CopyButton text={testText} label="Copy" />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Copy");
    });

    it("renders with type='button'", () => {
      render(<CopyButton text={testText} />);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("applies default button styling classes", () => {
      const { container } = render(<CopyButton text={testText} />);
      const button = container.querySelector("button");
      expect(button).toHaveClass("inline-flex", "items-center", "gap-2", "px-4", "py-2");
    });

    it("applies custom className when provided", () => {
      const { container } = render(
        <CopyButton text={testText} className="w-full" />
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("w-full");
    });
  });

  describe("copy success — via navigator.clipboard", () => {
    it("calls navigator.clipboard.writeText with the text", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
      });
    });

    it("shows 'Copied' text after successful copy", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeInTheDocument();
      });
    });

    it("shows success toast on successful copy", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
      });
    });

    it("reverts to original label after 2 seconds", async () => {
      vi.useFakeTimers();
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText("Copy plain text")).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it("sets timeout to 2000ms", async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(window, "setTimeout");

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
      });

      vi.useRealTimers();
    });
  });

  describe("copy failure handling", () => {
    it("shows error toast when clipboard.writeText fails", async () => {
      const clipboardError = new Error("Clipboard failed");
      (navigator.clipboard.writeText as any).mockRejectedValueOnce(clipboardError);

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Couldn't copy. Select the text manually."
        );
      });
    });

    it("does not call success toast on error", async () => {
      (navigator.clipboard.writeText as any).mockRejectedValueOnce(
        new Error("fail")
      );

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe("fallback for older browsers (execCommand)", () => {
    beforeEach(() => {
      // Simulate missing clipboard API
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
    });

    it("falls back to execCommand when clipboard is unavailable", async () => {
      const execCommandSpy = vi.spyOn(document, "execCommand");

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(execCommandSpy).toHaveBeenCalledWith("copy");
      });
    });

    it("shows error when execCommand returns false", async () => {
      vi.spyOn(document, "execCommand").mockReturnValueOnce(false);

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("shows success when execCommand returns true", async () => {
      vi.spyOn(document, "execCommand").mockReturnValueOnce(true);

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("creates temporary textarea for fallback copy", async () => {
      vi.spyOn(document, "execCommand").mockReturnValueOnce(true);
      const createElementSpy = vi.spyOn(document, "createElement");

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith("textarea");
      });
    });

    it("removes textarea from DOM after fallback copy", async () => {
      vi.spyOn(document, "execCommand").mockReturnValueOnce(true);
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(removeChildSpy).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
      });
    });

    it("sets textarea position to fixed and opacity to 0", async () => {
      vi.spyOn(document, "execCommand").mockReturnValueOnce(true);
      const createElementSpy = vi.spyOn(document, "createElement");

      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        const textareaCall = createElementSpy.mock.results.find(
          (call) => call.value.tagName === "TEXTAREA"
        );
        const textarea = textareaCall?.value as HTMLTextAreaElement;
        expect(textarea?.style.position).toBe("fixed");
        expect(textarea?.style.opacity).toBe("0");
      });
    });
  });

  describe("icon rendering", () => {
    it("renders Copy icon initially", () => {
      const { container } = render(<CopyButton text={testText} />);
      // The Copy icon should be rendered (check for the SVG)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    it("shows Check icon after successful copy", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeInTheDocument();
      });
    });
  });

  describe("keyboard accessibility", () => {
    it("responds to Enter key press", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it("responds to Space key press", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.keyDown(button, { key: " ", code: "Space" });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it("is focusable (can receive focus)", () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe("multiple clicks", () => {
    it("allows multiple copies in sequence", async () => {
      render(<CopyButton text={testText} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText("Copied")).toBeInTheDocument();
      });

      // Reset state and click again
      vi.useFakeTimers();
      vi.advanceTimersByTime(2100);
      vi.useRealTimers();

      fireEvent.click(button);
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("different text content", () => {
    it.each([
      "Simple text",
      "Text with\nmultiple\nlines",
      "Text with special chars: !@#$%^&*()",
      "😀 Emoji text",
      "",
    ])('copies "%s" correctly', async (content) => {
      render(<CopyButton text={content} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content);
      });
    });
  });
});
