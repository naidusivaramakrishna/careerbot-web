import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import JobPreviewPanel from "@/app/(jobs)/jobslogin/_components/sidebar/JobPreviewPanel";

const job = {
  id: "job-preview-1",
  title: "Senior Frontend Engineer",
  company: "Acme",
  location: "Remote, India",
  type: "Full-time",
  mode: "Remote",
  salary: "₹20–30 LPA",
  experience: "5+ years",
  description: "Build accessible product experiences with React and TypeScript.",
  source: "Company site",
  matchScore: 82,
  match_band: "strong",
  matched_skills: ["React", "TypeScript"],
  missing_skills: ["GraphQL"],
  url: "https://example.com/job",
};

describe("JobPreviewPanel", () => {
  it("shows the selected job, match context, and skill evidence", () => {
    render(<JobPreviewPanel job={job} onClose={vi.fn()} onAskAI={vi.fn()} onTailorResume={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Senior Frontend Engineer" })).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("2 verified skills align with this role.")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("GraphQL")).toBeInTheDocument();
  });

  it("prepares a contextual AI question", () => {
    const onAskAI = vi.fn();
    render(<JobPreviewPanel job={job} onClose={vi.fn()} onAskAI={onAskAI} onTailorResume={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Explain my skill gaps" }));
    expect(onAskAI).toHaveBeenCalledWith("What skills am I missing?");
  });

  it("closes with Escape", () => {
    const onClose = vi.fn();
    render(<JobPreviewPanel job={job} onClose={onClose} onAskAI={vi.fn()} onTailorResume={vi.fn()} isModal />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("labels the external application action clearly", () => {
    render(<JobPreviewPanel job={job} onClose={vi.fn()} onAskAI={vi.fn()} onTailorResume={vi.fn()} />);

    expect(screen.getByRole("link", { name: /view job and apply/i })).toHaveAttribute(
      "href",
      "https://example.com/job"
    );
  });
});
