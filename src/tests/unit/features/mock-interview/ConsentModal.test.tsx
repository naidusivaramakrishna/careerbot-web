import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  recordConsent: vi.fn(),
}));

vi.mock("@/api/mockInterviewApi", () => ({
  recordConsent: mocks.recordConsent,
}));

const importConsentModal = async () => (await import("@/app/(interview)/mock-interview/_components/ConsentModal")).default;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.recordConsent.mockResolvedValue({ consent_recorded: true, timestamp: "2026-07-17T09:00:00Z" });
});

describe("ConsentModal", () => {
  it("records consent before continuing", async () => {
    const ConsentModal = await importConsentModal();
    const onAccept = vi.fn();
    render(<ConsentModal onAccept={onAccept} onDecline={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /i agree/i }));

    await waitFor(() => expect(mocks.recordConsent).toHaveBeenCalledWith(true));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("continues even when the consent endpoint is temporarily unavailable", async () => {
    mocks.recordConsent.mockRejectedValue(new Error("network"));
    const ConsentModal = await importConsentModal();
    const onAccept = vi.fn();
    render(<ConsentModal onAccept={onAccept} onDecline={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /i agree/i }));

    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
    expect(mocks.recordConsent).toHaveBeenCalledWith(true);
  });

  it("declines from cancel, close, and escape", async () => {
    const ConsentModal = await importConsentModal();
    const onDecline = vi.fn();
    render(<ConsentModal onAccept={vi.fn()} onDecline={onDecline} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onDecline).toHaveBeenCalledTimes(3);
  });

  it("renders re-consent copy and policy version when required", async () => {
    const ConsentModal = await importConsentModal();
    render(<ConsentModal onAccept={vi.fn()} onDecline={vi.fn()} isReConsent />);

    expect(screen.getByRole("dialog", { name: /re-consent required/i })).toBeInTheDocument();
    expect(screen.getByText(/policy updated/i)).toBeInTheDocument();
    expect(screen.getAllByText("v1.1").length).toBeGreaterThan(0);
  });

  it("documents privacy-critical interview processing points", async () => {
    const ConsentModal = await importConsentModal();
    render(<ConsentModal onAccept={vi.fn()} onDecline={vi.fn()} />);

    expect(screen.getByText("Audio Recording")).toBeInTheDocument();
    expect(screen.getByText("AI Evaluation")).toBeInTheDocument();
    expect(screen.getByText("Practice vs Live Mode")).toBeInTheDocument();
    expect(screen.getByText("Data Retention")).toBeInTheDocument();
  });
});
