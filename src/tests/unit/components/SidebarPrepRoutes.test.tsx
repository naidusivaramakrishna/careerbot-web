/**
 * Interview notes live under /prep/* (moved from /notes/*). The app sidebar
 * must link there, open expanded on those pages and mark "Interview Notes"
 * active, as it did for /notes/*.
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/prep/hr", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}));
vi.mock("@/api/resumeApi", () => ({ getAllResumesUnified: vi.fn(), getAllResumes: vi.fn() }));
vi.mock("@/api/enhancerApi", () => ({ getEnhancementHistory: vi.fn() }));
vi.mock("@/contexts/DashboardContext", () => ({ useDashboard: () => ({ data: null }) }));
vi.mock("@/hooks/useCollegeMembership", () => ({ useHasCollegeMembership: () => false, useStudentCollege: () => null }));

import Sidebar from "@/components/layout/Sidebar";

const notesButton = () => screen.getByText("Interview Notes").closest("button") as HTMLButtonElement;
const isActive = (button: HTMLButtonElement) => button.getAttribute("style")?.includes("rgb(37, 87, 167)") ?? false;

describe("Sidebar and the /prep notes routes", { timeout: 20_000 }, () => {
  beforeEach(() => nav.push.mockClear());

  it.each(["/prep", "/prep/notes", "/prep/hr", "/prep/technical/practice"])(
    "opens expanded with Interview Notes active on %s",
    (pathname) => {
      nav.pathname = pathname;
      render(<Sidebar />);
      expect(isActive(notesButton())).toBe(true);
    },
  );

  it.each(["/dashboard", "/preparation"])("does not mark Interview Notes active on %s", (pathname) => {
    nav.pathname = pathname;
    render(<Sidebar />);
    // "/preparation" is not an expanded path: open the sidebar to see the labels.
    if (!screen.queryByText("Interview Notes")) fireEvent(window, new Event("toggle-sidebar"));
    expect(isActive(notesButton())).toBe(false);
  });

  it("sends Interview Notes to /prep/notes", () => {
    nav.pathname = "/dashboard";
    render(<Sidebar />);
    fireEvent.click(notesButton());
    expect(nav.push).toHaveBeenCalledWith("/prep/notes");
  });
});
