import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import AchievementRow from "@/components/common/AchievementRow";

const base = {
  formatDate: (v?: string) => v ?? "",
  textStyle: {},
  renderDescription: (html: string) => <span dangerouslySetInnerHTML={{ __html: html }} />,
};

describe("AchievementRow", () => {
  it("shows an entry that has only a description as its own text, with entities decoded", () => {
    const { container } = render(<AchievementRow {...base} achievement={{ description: "<p>Cut R&amp;D cost 20%</p>" }} />);
    expect(container.textContent).toContain("Cut R&D cost 20%");
    expect(container.textContent).not.toContain("&amp;");
  });

  it("keeps a row, with its description, on one page", () => {
    const { container } = render(
      <AchievementRow {...base} achievement={{ title: "Won", date: "2024", description: "Detail line" }} />,
    );
    const row = container.querySelector('[data-bullet-row="achievement"]') as HTMLElement;
    expect(row.style.breakInside).toBe("avoid");
  });

  it("draws bullet, text and year, and the description under the text", () => {
    const { container } = render(
      <AchievementRow {...base} achievement={{ title: "Won the hackathon", date: "2024", description: "Led the team" }} />,
    );
    expect(container.textContent).toContain("•");
    expect(container.textContent).toContain("Won the hackathon");
    expect(container.textContent).toContain("2024");
    expect(container.textContent).toContain("Led the team");
  });
});
