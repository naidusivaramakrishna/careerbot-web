import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const importTranscriptDisplay = async () => (await import("@/app/(interview)/mock-interview/_components/TranscriptDisplay")).default;

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TranscriptDisplay", () => {
  it("renders transcript details, duration, filler count, and key point count", async () => {
    const TranscriptDisplay = await importTranscriptDisplay();
    render(
      <TranscriptDisplay
        transcript="So I aligned the team and delivered the release."
        duration={64}
        fillerCount={1}
        keyPointsHit={["ownership", "impact"]}
      />
    );

    expect(screen.getByRole("region", { name: /answer transcript/i })).toBeInTheDocument();
    expect(screen.getByText("64s")).toBeInTheDocument();
    expect(screen.getByText("1 filler word")).toBeInTheDocument();
    expect(screen.getByText("2 key points covered")).toBeInTheDocument();
    expect(screen.getByText(/delivered the release/i)).toBeInTheDocument();
    expect(document.querySelector("mark")).toHaveTextContent("So");
  });

  it("copies the raw transcript and restores the copy icon after the timeout", async () => {
    const TranscriptDisplay = await importTranscriptDisplay();
    render(<TranscriptDisplay transcript="Copy this answer." />);

    fireEvent.click(screen.getByRole("button", { name: /copy transcript/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy this answer.");

    act(() => { vi.advanceTimersByTime(2_000); });
    expect(screen.getByRole("button", { name: /copy transcript/i })).toBeInTheDocument();
  });

  it("collapses and expands from mouse and keyboard controls", async () => {
    const TranscriptDisplay = await importTranscriptDisplay();
    render(<TranscriptDisplay transcript="Expandable answer text." />);

    const header = screen.getByRole("button", { expanded: true });
    fireEvent.click(header);
    expect(screen.queryByRole("log", { name: /transcript content/i })).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("button", { expanded: false }), { key: "Enter" });
    expect(screen.getByRole("log", { name: /transcript content/i })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("button", { expanded: true }), { key: " " });
    expect(screen.queryByRole("log", { name: /transcript content/i })).not.toBeInTheDocument();
  });

  it("escapes transcript HTML before applying filler highlighting", async () => {
    const TranscriptDisplay = await importTranscriptDisplay();
    render(<TranscriptDisplay transcript={'<img src=x onerror="alert(1)"> actually safe'} fillerCount={1} />);

    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText(/<img src=x/i)).toBeInTheDocument();
    expect(document.querySelector("mark")).toHaveTextContent("actually");
  });

  it("shows a positive no-filler state", async () => {
    const TranscriptDisplay = await importTranscriptDisplay();
    render(<TranscriptDisplay transcript="Clear concise response." fillerCount={0} />);

    expect(screen.getByText(/no filler words/i)).toBeInTheDocument();
    expect(screen.queryByText(/highlighted words/i)).not.toBeInTheDocument();
  });
});
