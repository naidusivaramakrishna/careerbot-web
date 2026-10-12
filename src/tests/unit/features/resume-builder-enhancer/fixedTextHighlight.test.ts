import { describe, it, expect } from "vitest";
import {
  toPlainLines,
  diffTextUnits,
  findHighlightRanges,
} from "@/app/(resume)/builder/creation/_utils/fixedTextHighlight";

describe("toPlainLines", () => {
  it("splits HTML bullets into plain lines and decodes entities", () => {
    expect(toPlainLines("<ul><li>Led  the team &amp; shipped</li><li>• Managed X</li></ul>"))
      .toEqual(["Led the team & shipped", "Managed X"]);
  });
});

describe("diffTextUnits", () => {
  it("returns only the text that is new, tagged with its resume field", () => {
    const before = { skills: ["React"], projects: [{ id: "1", description: "<li>Built a thing</li><li>Kept this</li>" }] };
    const after = { skills: ["React", "Docker"], projects: [{ id: "2", description: "<li>Led the build of a thing</li><li>Kept this</li>" }] };
    expect(diffTextUnits(before, after)).toEqual([
      { key: "skills", text: "Docker" },
      { key: "projects", text: "Led the build of a thing" },
    ]);
  });

  it("ignores id-only churn", () => {
    expect(diffTextUnits({ projects: [{ id: "1", title: "A" }] }, { projects: [{ id: "9", title: "A" }] })).toEqual([]);
  });
});

describe("findHighlightRanges", () => {
  const mount = (html: string) => {
    const root = document.createElement("div");
    root.innerHTML = html;
    document.body.appendChild(root);
    return root;
  };

  it("highlights just the changed bullet inside its section", () => {
    const root = mount(
      '<div data-section="projects"><ul><li>Led the design of <b>a quiz</b> platform</li><li>Other bullet</li></ul></div>',
    );
    const ranges = findHighlightRanges(root, [{ key: "projects", text: "Led the design of a quiz platform" }]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].toString()).toBe("Led the design of a quiz platform");
  });

  it("keeps a short skill inside the skills section and matches whole words only", () => {
    const root = mount(
      '<div data-section="skills"><span>AWS</span>, <span>AWSome</span></div>'
      + '<div data-section="projects"><li>Deployed on AWS</li></div>',
    );
    const ranges = findHighlightRanges(root, [{ key: "skills", text: "AWS" }]);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].startContainer.parentElement?.closest("[data-section]")?.getAttribute("data-section")).toBe("skills");
  });

  it("finds nothing for text that is not rendered", () => {
    expect(findHighlightRanges(mount("<p>hello</p>"), [{ key: "summary", text: "absent" }])).toEqual([]);
  });
});
