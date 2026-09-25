import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockPush = vi.fn();
const mockProcessResumeComplete = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/SignUpModal", () => ({ default: () => null }));
vi.mock("@/api/resumeatsapi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/resumeatsapi")>()),
  processResumeComplete: (...args: unknown[]) => mockProcessResumeComplete(...args),
}));

import ResumeUpload from "@/app/(resume)/ats/_components/upload/ResumeUpload";

const quotaError = () => new DOMException("The quota has been exceeded.", "QuotaExceededError");
const photo = "data:image/png;base64," + "A".repeat(4096);

const successResult = {
  success: true as const,
  resume_id: "resume-1",
  finalWeightedScore: 72,
  parsed_data: { contact: { name: "Avery", profile_picture: photo } },
  missingFields: [],
};

async function uploadResume() {
  const { container } = render(<ResumeUpload />);
  const file = new File(["%PDF-1.4 test"], "resume.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "slice", {
    value: () => ({ arrayBuffer: async () => new TextEncoder().encode("%PDF-1.4").buffer }),
  });
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe("ResumeUpload storage handling", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockProcessResumeComplete.mockReset();
    vi.mocked(window.localStorage.setItem).mockReset();
    vi.mocked(window.localStorage.getItem).mockReset();
    vi.mocked(window.localStorage.getItem).mockReturnValue(null);
    sessionStorage.clear();
    mockProcessResumeComplete.mockResolvedValue(successResult);
  });

  it("still shows the score when localStorage quota is exceeded, instead of a raw storage error", async () => {
    vi.mocked(window.localStorage.setItem).mockImplementation((key: string) => {
      if (key === "atsAnalysisData" || key === "currentScore" || key === "isImageBased") throw quotaError();
    });

    await uploadResume();

    expect(await screen.findByText(/View Detailed Report/i, undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText(/quota/i)).not.toBeInTheDocument();
  });

  it("does not write embedded images into storage", async () => {
    await uploadResume();
    await screen.findByText(/View Detailed Report/i, undefined, { timeout: 3000 });

    const writes = vi.mocked(window.localStorage.setItem).mock.calls
      .filter(([key]) => key === "atsAnalysisData")
      .map(([, value]) => String(value));
    expect(writes.length).toBeGreaterThan(0);
    writes.forEach((value) => expect(value).not.toContain("data:image/"));
  });

  it("keeps the report link's resume_id when the analysis only fit in sessionStorage", async () => {
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw quotaError(); });

    await uploadResume();
    fireEvent.click(await screen.findByText(/View Detailed Report/i, undefined, { timeout: 3000 }));

    expect(mockPush).toHaveBeenCalledWith("/atslogin/report?resume_id=resume-1");
  });
});
