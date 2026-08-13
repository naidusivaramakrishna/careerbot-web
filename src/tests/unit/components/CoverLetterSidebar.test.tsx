/**
 * Component tests for CoverLetterSidebar.tsx
 *
 * Tests:
 *   - Renders the "Cover letters" heading (font-bold, not font-black)
 *   - Does NOT render a duplicate "New Cover Letter" CTA — that button
 *     was removed because CoverLetterTopBar already has a
 *     "Create new letter" CTA; keeping both was a duplicate-action bug.
 *   - Total / Can export metric tiles reflect the items prop
 *   - Empty state vs. populated list rendering
 *   - Search filters by role title or company name
 *   - Loading skeleton only shows while isLoading AND no items yet
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CoverLetterSidebar from "@/components/cover-letter/CoverLetterSidebar";
import type { CoverLetterListItem } from "@/types/coverLetter";

function makeItem(overrides: Partial<CoverLetterListItem> = {}): CoverLetterListItem {
  return {
    letter_id: "letter-1",
    created_at: new Date().toISOString(),
    status: "ready_to_review",
    role_title: "Backend Engineer",
    company_name: "Globex",
    word_count: 320,
    ...overrides,
  };
}

const noop = vi.fn();

describe("CoverLetterSidebar", () => {
  it("renders the Cover letters heading", () => {
    render(
      <CoverLetterSidebar
        items={[]}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Cover letters" })
    ).toBeInTheDocument();
  });

  it("uses font-bold (700) on the heading, not font-black (900)", () => {
    render(
      <CoverLetterSidebar
        items={[]}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    const heading = screen.getByRole("heading", { name: "Cover letters" });
    expect(heading.className).toContain("font-bold");
    expect(heading.className).not.toContain("font-black");
  });

  it("does not render a duplicate 'New Cover Letter' CTA (removed — TopBar already has one)", () => {
    render(
      <CoverLetterSidebar
        items={[]}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    expect(
      screen.queryByRole("link", { name: /New Cover Letter/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /New Cover Letter/i })
    ).not.toBeInTheDocument();
  });

  it("shows 'No letters yet' when items is empty and not loading", () => {
    render(
      <CoverLetterSidebar
        items={[]}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    expect(screen.getByText("No letters yet")).toBeInTheDocument();
  });

  it("shows the loading skeleton only while isLoading is true and there are no items yet", () => {
    const { container } = render(
      <CoverLetterSidebar
        items={[]}
        isLoading
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("No letters yet")).not.toBeInTheDocument();
  });

  it("renders Total and Can export metric tiles from the items prop", () => {
    const items = [
      makeItem({ letter_id: "l1", status: "ready_to_review" }),
      makeItem({ letter_id: "l2", status: "needs_review" }),
      makeItem({ letter_id: "l3", status: "failed" }),
    ];
    render(
      <CoverLetterSidebar
        items={items}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // total
    expect(screen.getByText("Can export")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 of 3 aren't "failed"
  });

  it("renders one list row per item", () => {
    const items = [
      makeItem({ letter_id: "l1", role_title: "Backend Engineer", company_name: "Globex" }),
      makeItem({ letter_id: "l2", role_title: "Frontend Engineer", company_name: "Initech" }),
    ];
    render(
      <CoverLetterSidebar
        items={items}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("filters the list by role title as the user types in search", () => {
    const items = [
      makeItem({ letter_id: "l1", role_title: "Backend Engineer", company_name: "Globex" }),
      makeItem({ letter_id: "l2", role_title: "Frontend Engineer", company_name: "Initech" }),
    ];
    render(
      <CoverLetterSidebar
        items={items}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search role or company"), {
      target: { value: "frontend" },
    });

    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("filters the list by company name as the user types in search", () => {
    const items = [
      makeItem({ letter_id: "l1", role_title: "Backend Engineer", company_name: "Globex" }),
      makeItem({ letter_id: "l2", role_title: "Frontend Engineer", company_name: "Initech" }),
    ];
    render(
      <CoverLetterSidebar
        items={items}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search role or company"), {
      target: { value: "initech" },
    });

    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("shows a 'No matching letters' message when a search yields no results", () => {
    const items = [makeItem({ role_title: "Backend Engineer", company_name: "Globex" })];
    render(
      <CoverLetterSidebar
        items={items}
        isLoading={false}
        selectedId={null}
        onSelect={noop}
        onRename={noop}
        onDelete={noop}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search role or company"), {
      target: { value: "nonexistent role" },
    });

    expect(screen.getByText("No matching letters")).toBeInTheDocument();
  });

  it("calls onSelect when a list row is clicked", () => {
    const onSelect = vi.fn();
    const items = [makeItem({ letter_id: "l1" })];
    render(
      <CoverLetterSidebar
        items={items}
        isLoading={false}
        selectedId={null}
        onSelect={onSelect}
        onRename={noop}
        onDelete={noop}
      />
    );

    fireEvent.click(screen.getByText("Backend Engineer"));
    expect(onSelect).toHaveBeenCalledWith("l1");
  });
});
