import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AnimatedSkillChip from "@/app/(jobs)/jobmatch/_components/resume/AnimatedSkillChip";

afterEach(() => { cleanup(); vi.useRealTimers(); });

it("celebrates a newly added skill, clears feedback, and can celebrate again after undo", () => {
  vi.useFakeTimers();
  const chip = (added: boolean) => <AnimatedSkillChip skill="Python" added={added} status={added ? "matched" : "missing"} style={{}}/>;
  const { rerender } = render(chip(false));
  expect(screen.queryByRole("status")).toBeNull();
  rerender(chip(true));
  expect(screen.getByRole("status").textContent).toContain("Added");
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole("status")).toBeNull();
  rerender(chip(false));
  rerender(chip(true));
  expect(screen.getByRole("status")).toBeTruthy();
});

it("does not replay the added animation for a restored skill", () => {
  render(<AnimatedSkillChip skill="Python" added status="matched" style={{}}/>);
  expect(screen.queryByRole("status")).toBeNull();
});

it("scrolls the resume panel to an offscreen skill before showing the added feedback", () => {
  vi.useFakeTimers();
  const content = (added: boolean) => <div data-resume-scroll-container><AnimatedSkillChip skill="SQL" added={added} status={added ? "matched" : "missing"} style={{}}/></div>;
  const { container, rerender } = render(content(false));
  const viewer = container.firstElementChild as HTMLElement;
  viewer.scrollTo = vi.fn() as unknown as HTMLElement["scrollTo"];
  vi.spyOn(viewer, "getBoundingClientRect").mockReturnValue({top: 100, bottom: 500, height: 400} as DOMRect);
  vi.spyOn(screen.getByText("SQL"), "getBoundingClientRect").mockReturnValue({top: 900, bottom: 924, height: 24} as DOMRect);
  rerender(content(true));
  expect(viewer.scrollTo).toHaveBeenCalledWith({top: 612, behavior: "smooth"});
  expect(screen.queryByRole("status")).toBeNull();
  fireEvent(viewer, new Event("scrollend"));
  expect(screen.getByRole("status").textContent).toContain("Added");
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole("status")).toBeNull();
});
