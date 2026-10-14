/**
 * The summary editor enforces the API's 2000-character limit, so what is on screen
 * is what gets saved (the API otherwise silently cuts the rest).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/lib/http", () => ({ default: {}, httpClient: {} }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn(), api: { request: vi.fn() } },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/api/resumeApi", () => ({
  getResumeById: vi.fn(),
  getDefaultTemplate: vi.fn(async () => ({ template_id: "modern_blue" })),
}));
vi.mock("@/api/enhancerApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/enhancerApi")>()),
  getEnhancedResume: vi.fn(),
}));
vi.mock("@/app/(resume)/templates/_utils/sectionOrder", () => ({
  getSectionOrder: vi.fn(() => ["Personal Info", "Professional Summary"]),
}));

import { ResumeProvider, useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { getEnhancedResume } from "@/api/enhancerApi";
import { toast } from "sonner";
import ProfessionalSummary from "@/app/(resume)/builder/creation/_components/editor/sections/ProfessionalSummary";

type Ctx = ReturnType<typeof useResume>;
let latest: Ctx;
const Consumer = () => {
  latest = useResume();
  return (
    <>
      <p>Name: {latest.resumeData.personalInfo.fullname || "empty"}</p>
      {/* Mount the editor once the resume has loaded, as it is when the modal opens. */}
      {latest.resumeData.personalInfo.fullname ? <ProfessionalSummary /> : null}
    </>
  );
};


const SUMMARY_PLACEHOLDER_ROLE = "e.g., Frontend Developer, Data Analyst";
const box = () => document.querySelector('[contenteditable="true"]') as HTMLElement;
const counter = () => screen.getByTestId("summary-counter");
const setBox = async (html: string) => {
  await act(async () => {
    box().innerHTML = html;
    fireEvent.input(box());
  });
};

async function renderWith(summary: string) {
  vi.mocked(getEnhancedResume).mockResolvedValue({
    id: "enhanced-1",
    enhanced_data: {
      personalInfo: { fullname: "Bhavana", email: "bhavana@example.com" },
      professionalSummary: { summary, targetRole: "" },
    },
  } as never);
  render(
    <ResumeProvider resumeId="enhanced-1" source="enhanced">
      <Consumer />
    </ResumeProvider>,
  );
  await screen.findByText("Name: Bhavana");
  await screen.findByPlaceholderText(SUMMARY_PLACEHOLDER_ROLE);
}

// Each test mounts the whole ResumeProvider. Locally a test takes under 1.5s, but
// on a loaded CI runner the first one, which also pays the module load, went past
// vitest's 5s default.
const RENDER_TIMEOUT_MS = 15_000;

describe("ProfessionalSummary — 2000 character limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("shows a live counter", async () => {
    await renderWith("");
    expect(counter()).toHaveTextContent("0 / 2,000");
    await setBox("a".repeat(120));
    expect(counter()).toHaveTextContent("120 / 2,000");
  });

  it("warns near the limit", async () => {
    await renderWith("");
    await setBox("a".repeat(1950));
    expect(counter().className).toContain("text-amber-600");
  });

  it("accepts text up to exactly 2000 characters", async () => {
    await renderWith("");
    await setBox("a".repeat(2000));
    expect(box().innerHTML).toHaveLength(2000);
    expect(counter()).toHaveTextContent("2,000 / 2,000");
    expect(counter()).toHaveTextContent("Limit reached");
    await waitFor(() => expect(latest.resumeData.professionalSummary.summary).toHaveLength(2000));
  });

  it("rejects an edit that would go past 2000 and keeps the previous text", async () => {
    await renderWith("");
    await setBox("a".repeat(1990));
    await setBox("a".repeat(1990) + "b".repeat(30));
    // The box and the saved draft both stay at the last accepted text.
    expect(box().innerHTML).toBe("a".repeat(1990));
    expect(latest.resumeData.professionalSummary.summary).toBe("a".repeat(1990));
    expect(counter()).toHaveTextContent("1,990 / 2,000");
    expect(counter()).toHaveTextContent("Limit reached");
  });

  it("still lets the user delete text from a summary that is already over the limit", async () => {
    await renderWith("x".repeat(2300));
    await setBox("x".repeat(2200));
    expect(box().innerHTML).toHaveLength(2200);
    await setBox("x".repeat(2250));
    expect(box().innerHTML).toHaveLength(2200); // growing is still refused
  });

  it("trims a paste that does not fit to the room left", async () => {
    await renderWith("");
    await setBox("a".repeat(1995));
    const exec = vi.fn(() => true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    await act(async () => {
      fireEvent.paste(box(), { clipboardData: { getData: () => "z".repeat(50) } });
    });
    expect(exec).toHaveBeenCalledWith("insertText", false, "z".repeat(5));
    expect(counter()).toHaveTextContent("Limit reached");
  });

  // A paste replaces the selection, so selected text in the editor is room too.
  const select = (node: Node, start?: number, end?: number) => {
    const range = document.createRange();
    if (start === undefined) range.selectNodeContents(node);
    else { range.setStart(node, start); range.setEnd(node, end!); }
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  };
  const pasteText = async (text: string) => {
    const exec = vi.fn(() => true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    await act(async () => {
      fireEvent.paste(box(), { clipboardData: { getData: () => text } });
    });
    return exec;
  };

  it("lets a paste replace a selected full summary", async () => {
    await renderWith("");
    await setBox("a".repeat(1990));
    select(box());
    expect(await pasteText("z".repeat(500))).not.toHaveBeenCalled();
  });

  it("counts only the selected part as freed room", async () => {
    await renderWith("");
    await setBox("a".repeat(1990));
    select(box().firstChild!, 0, 100);
    expect(await pasteText("z".repeat(150))).toHaveBeenCalledWith("insertText", false, "z".repeat(110));
  });

  it("ignores a selection outside the editor", async () => {
    await renderWith("");
    await setBox("a".repeat(1990));
    const outside = document.body.appendChild(document.createElement("p"));
    outside.textContent = "b".repeat(300);
    select(outside);
    expect(await pasteText("z".repeat(50))).toHaveBeenCalledWith("insertText", false, "z".repeat(10));
    outside.remove();
  });

  it("leaves a paste that fits to the browser", async () => {
    await renderWith("");
    const exec = vi.fn(() => true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    await act(async () => {
      fireEvent.paste(box(), { clipboardData: { getData: () => "short text" } });
    });
    expect(exec).not.toHaveBeenCalled();
  });

  // The browser's list command is stubbed (jsdom has none): it wraps the content
  // the way Chrome does, which adds <ul><li></li></ul> to the stored length.
  const stubListCommand = () => {
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn((cmd: string) => {
      if (cmd === "insertUnorderedList") box().innerHTML = `<ul><li>${box().innerHTML}</li></ul>`;
      return true;
    });
  };
  const clickBullets = async () => {
    await act(async () => {
      fireEvent.mouseDown(screen.getByTitle("Bullet List"));
      await new Promise((r) => setTimeout(r, 5));
    });
  };

  it("adds bullets when there is room for the list tags", async () => {
    await renderWith("");
    await setBox("a".repeat(500));
    stubListCommand();
    await clickBullets();
    expect(box().innerHTML).toBe(`<ul><li>${"a".repeat(500)}</li></ul>`);
  });

  it("still adds bullets to a summary that is full to the last character", async () => {
    await renderWith("");
    await setBox("a".repeat(2000));
    stubListCommand();
    await clickBullets();
    // The markup adds no visible characters, so the full summary can be bulleted.
    expect(box().innerHTML).toBe(`<ul><li>${"a".repeat(2000)}</li></ul>`);
    expect(counter()).toHaveTextContent("2,000 / 2,000");
    expect(toast.error).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(latest.resumeData.professionalSummary.summary).toBe(`<ul><li>${"a".repeat(2000)}</li></ul>`),
    );
  });

  it("counts visible text, not markup, in the counter", async () => {
    await renderWith("");
    await setBox(`<ul>${Array.from({ length: 10 }, () => `<li>${"a".repeat(199)}</li>`).join("")}</ul>`);
    expect(counter()).toHaveTextContent("1,990 / 2,000");
  });

  it("explains in a toast when there is too much markup, and keeps the text", async () => {
    await renderWith("");
    await setBox("a".repeat(100));
    // 1,000 one-character bullets: 1,000 visible, ~9,000 stored -- past the markup ceiling.
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn(() => {
      box().innerHTML = `<ul>${"<li>a</li>".repeat(1000)}</ul>`;
      return true;
    });
    await clickBullets();
    expect(box().innerHTML).toBe("a".repeat(100)); // refused, nothing lost
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Too much formatting"),
      expect.objectContaining({ id: "summary-limit" }),
    );
  });
}, RENDER_TIMEOUT_MS);
