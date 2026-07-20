import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import TopPickCard from "@/app/(jobs)/jobslogin/_components/sidebar/TopPickCard";

describe("TopPickCard empty state", () => {
  it("explains the analysed-job count and offers a recovery action", () => {
    render(<TopPickCard jobs={[]} analyzedCount={728} />);

    expect(screen.getByText(/728 jobs analysed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /improve my matches/i })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("button", { name: /view all recommendations/i })).not.toBeInTheDocument();
  });

  it("uses the supplied message when no analysis count is available", () => {
    render(<TopPickCard jobs={[]} emptyMessage="Upload your resume to unlock personalised picks." />);

    expect(screen.getByText(/upload your resume/i)).toBeInTheDocument();
  });
});
