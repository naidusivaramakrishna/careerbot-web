import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { highlightResumeKeywords, ResumeKeywordHtml } from "@/app/(jobs)/jobmatch/_components/resume/resumeKeywordHighlights";
import JobMatchTemplateThree from "@/app/(jobs)/jobmatch/_components/resume/JobMatchTemplateThree";

afterEach(cleanup);

it("shows the whole suggested summary in rose, then green after applying", () => {
  const props = { data: { summary: "Experienced Python developer." }, matchedKeywords: ["Python"], pendingFields: { summary: ["text"] } };
  const { container, rerender } = render(<JobMatchTemplateThree {...props}/>);
  const pending = container.querySelector('[data-resume-edit="pending"]') as HTMLElement;
  expect(pending.textContent).toBe("Experienced Python developer.");
  expect(pending.style.backgroundColor).toBe("rgb(253, 240, 242)");
  expect(pending.querySelector("mark")).toBeNull();
  rerender(<JobMatchTemplateThree {...props} addedFields={{ summary: ["text"] }}/>);
  const applied = container.querySelector('[data-resume-edit="applied"]') as HTMLElement;
  expect(applied.textContent).toBe("Experienced Python developer.");
  expect(applied.style.backgroundColor).toBe("rgba(34, 197, 94, 0.25)");
  expect(container.querySelector('[data-resume-edit="pending"]')).toBeNull();
});

it("colors whole keywords without changing the resume text", () => {
  const text = "JavaScript, Java, PYTHON, C++ and CI/CD.";
  const { container } = render(<>{highlightResumeKeywords(text, ["Java", "Python", "C++"], ["CI/CD"])}</>);
  expect(container.textContent).toBe(text);
  expect(Array.from(container.querySelectorAll('[data-resume-keyword="matched"]')).map(node => node.textContent)).toEqual(["Java", "PYTHON", "C++"]);
  expect(container.querySelector('[data-resume-keyword="missing"]')?.textContent).toBe("CI/CD");
});

it("uses green when an applied skill is also in the old missing list", () => {
  const { container } = render(<>{highlightResumeKeywords("React", ["React"], ["React"])}</>);
  expect(container.querySelector("mark")?.getAttribute("data-resume-keyword")).toBe("matched");
});

it("preserves safe rich text and removes unsafe markup before highlighting", () => {
  const { container } = render(<ResumeKeywordHtml content={'<p><strong>Python</strong><br/>React<img src=x onerror="alert(1)"/><script>alert(1)</script></p>'} matched={["Python"]} missing={["React"]}/>);
  expect(container.querySelector("strong mark")?.textContent).toBe("Python");
  expect(container.querySelector("br")).not.toBeNull();
  expect(container.querySelector('[data-resume-keyword="missing"]')?.textContent).toBe("React");
  expect(container.querySelector("img, script")).toBeNull();
});
