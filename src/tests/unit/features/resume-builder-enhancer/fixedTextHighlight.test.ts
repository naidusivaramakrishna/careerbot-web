import { describe, it, expect } from "vitest";
import {
  toPlainLines,
  diffTextUnits,
  findHighlightRanges,
  unitBelongsToSuggestionSection,
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

  it("highlights the added value but not the 'Label:' heading in front of it", () => {
    const root = mount(
      '<div data-section="skills"><p><b>Tools:</b> Docker</p><p><b>Cloud Platform:</b> AWS</p><p><b>Database:</b> MySQL</p></div>',
    );
    const ranges = findHighlightRanges(root, [
      { key: "categorizedSkills", text: "Tools" },
      { key: "categorizedSkills", text: "Docker" },
      { key: "categorizedSkills", text: "Cloud Platform" },
      { key: "categorizedSkills", text: "AWS" },
    ]);
    expect(ranges.map((range) => range.toString())).toEqual(["Docker", "AWS"]);
  });

  it("skips a label whose colon is in a separate element from the label text", () => {
    const root = mount(
      '<div data-section="skills"><p><b>Additional Skills</b><span>:</span> <span>Docker</span>, <span>AWS</span></p></div>',
    );
    const ranges = findHighlightRanges(root, [
      { key: "categorizedSkills", text: "Additional Skills" },
      { key: "categorizedSkills", text: "Docker" },
      { key: "categorizedSkills", text: "AWS" },
    ]);
    expect(ranges.map((range) => range.toString())).toEqual(["Docker", "AWS"]);
  });
});

describe("unitBelongsToSuggestionSection", () => {
  const unit = (key: string) => ({ key, text: "x" });

  it("lets a card only claim text from the sections it can change", () => {
    expect(unitBelongsToSuggestionSection(unit("categorizedSkills"), "Keywords")).toBe(true);
    expect(unitBelongsToSuggestionSection(unit("professionalSummary"), "Keywords")).toBe(false);
    expect(unitBelongsToSuggestionSection(unit("personalInfo"), "Contact")).toBe(true);
    expect(unitBelongsToSuggestionSection(unit("workExperience"), "Contact")).toBe(false);
  });

  it("covers the bullet-level cards that write into experience, projects and internships", () => {
    for (const field of ["workExperience", "projects", "internships"]) {
      expect(unitBelongsToSuggestionSection(unit(field), "Leadership")).toBe(true);
    }
    expect(unitBelongsToSuggestionSection(unit("education"), "Leadership")).toBe(false);
  });

  it("never filters when the card's section or the text's field is unknown", () => {
    expect(unitBelongsToSuggestionSection(unit("workExperience"), "format")).toBe(true);
    expect(unitBelongsToSuggestionSection(unit("somethingNew"), "Keywords")).toBe(true);
  });
});

describe("findHighlightRanges: profile links", () => {
  it("looks for the link's label in the contact block only, not in a project titled 'Portfolio Website'", () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<div data-section="personal-info"><a>Portfolio</a></div>' +
      '<div data-section="projects"><p>Portfolio Website</p></div>';
    document.body.appendChild(root);
    const ranges = findHighlightRanges(root, [{ key: "portfolio", text: "https://janedoe.dev" }]);
    expect(ranges.map((range) => range.toString())).toEqual(["Portfolio"]);
    root.remove();
  });
});
