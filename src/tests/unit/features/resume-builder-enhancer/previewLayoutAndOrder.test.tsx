import { appendLayoutParams } from "@/api/layoutOptions";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import Template2 from "@/app/(resume)/templates/Template2";
import { applyPreviewLayout } from "@/app/(resume)/builder/creation/_hooks/usePreviewLayout";
import { withFilledCoreSections } from "@/app/(resume)/builder/creation/_utils/sectionOrderFill";

const style = { fontFamily: "arial", nameFontSize: "20px", headingFontSize: "14px", bodyFontSize: "10px", bold: false, italic: false, lineSpacing: "1.2", headingColor: "#111", bodyColor: "#333" } as never;
const data = {
  personalInfo: { fullname: "Test User", email: "t@e.co", phone: "1" },
  professionalSummary: { summary: "Strategic Full Stack Developer with 12 years of experience." },
  workExperience: [{ id: "w1", company: "Acme", role: "Engineer", description: "Built things" }],
  education: [], projects: [], skills: {}, certifications: [],
};
const renderPreview = () =>
  render(<Template2 data={data as never} style={style} careerLevel="Mid-Level" domainFamily="software_engineering" sectionOrder={["Personal Info", "Professional Summary", "Work Experience"]} />).container;

const sizes = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("*")).map((el) => el.style.fontSize).filter(Boolean);
const gaps = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>("*")).map((el) => el.style.marginBottom).filter(Boolean);

describe("Style & Layout settings on the preview", () => {
  it("font size scales the sizes the template set, and template default puts them back", () => {
    const root = renderPreview();
    const before = sizes(root);
    applyPreviewLayout(root, { fontSize: "12" });
    const scaled = sizes(root);
    expect(scaled).not.toEqual(before);
    // the body size (10px by default) is now 12px
    expect(scaled).toContain("12px");
    applyPreviewLayout(root, {});
    expect(sizes(root)).toEqual(before);
  });

  it("font sizes outside the export's 8-12 range change nothing, on the screen and in the request", () => {
    const root = renderPreview();
    const before = sizes(root);
    for (const outOfRange of ["13", "14", "7", "abc", ""]) {
      applyPreviewLayout(root, { fontSize: outOfRange });
      expect(sizes(root)).toEqual(before);
      const params = new URLSearchParams();
      appendLayoutParams(params, { fontSize: outOfRange });
      expect(params.has("font_size")).toBe(false);
    }
    const params = new URLSearchParams();
    appendLayoutParams(params, { fontSize: "12" });
    expect(params.get("font_size")).toBe("12");
  });

  it("section spacing scales the gaps between sections (compact smaller, relaxed larger)", () => {
    const root = renderPreview();
    const normal = gaps(root).map((g) => parseFloat(g));
    applyPreviewLayout(root, { sectionSpacing: "compact" });
    const compact = gaps(root).map((g) => parseFloat(g));
    applyPreviewLayout(root, { sectionSpacing: "relaxed" });
    const relaxed = gaps(root).map((g) => parseFloat(g));
    expect(Math.max(...compact)).toBeLessThan(Math.max(...normal));
    expect(Math.max(...relaxed)).toBeGreaterThan(Math.max(...normal));
    applyPreviewLayout(root, {});
    expect(gaps(root).map((g) => parseFloat(g))).toEqual(normal);
  });

  it("page margin replaces the page's outer padding", () => {
    const root = renderPreview();
    const page = Array.from(root.querySelectorAll<HTMLElement>("div")).find((el) => el.style.padding === "32px") as HTMLElement;
    expect(page).toBeTruthy();
    applyPreviewLayout(root, { pageMargin: "wide" });
    expect(page.style.padding).toBe("56px");
    applyPreviewLayout(root, { pageMargin: "narrow" });
    expect(page.style.padding).toBe("18px");
    applyPreviewLayout(root, { pageMargin: "normal" });
    expect(page.style.padding).toBe("32px");
  });

  it("a chosen page margin is !important, so the builder preview's `[&>div]:!p-4` wrapper cannot override it", () => {
    // The builder preview wraps the template in a class that forces `padding: 1rem !important` on its root div.
    // An ordinary inline padding loses to it (checked in a real browser); an !important inline one wins.
    const root = renderPreview();
    const page = Array.from(root.querySelectorAll<HTMLElement>("div")).find((el) => el.style.padding === "32px") as HTMLElement;
    applyPreviewLayout(root, { pageMargin: "wide" });
    expect(page.style.getPropertyPriority("padding")).toBe("important");
    expect(page.style.getPropertyValue("padding")).toBe("56px");
    applyPreviewLayout(root, { pageMargin: "narrow" });
    expect(page.style.getPropertyPriority("padding")).toBe("important");
    expect(page.style.getPropertyValue("padding")).toBe("18px");
  });

  it("Template default, Narrow and Wide are written the same way, so Narrow < default < Wide holds on screen too", () => {
    const root = renderPreview();
    const page = Array.from(root.querySelectorAll<HTMLElement>("div")).find((el) => el.style.padding === "32px") as HTMLElement;
    const shown = (margin?: string) => {
      applyPreviewLayout(root, margin ? { pageMargin: margin } : {});
      return { value: parseFloat(page.style.getPropertyValue("padding")), priority: page.style.getPropertyPriority("padding") };
    };
    const normal = shown();           // never touched: the template's own 32px (what the export prints)
    const narrow = shown("narrow");
    const wide = shown("wide");
    const backToDefault = shown();    // and back again: the same as at the start
    expect(normal.value).toBe(32);
    expect(backToDefault.value).toBe(32);
    expect(narrow.value).toBeLessThan(normal.value);
    expect(wide.value).toBeGreaterThan(normal.value);
    // all three forced alike: a class rule on the wrapper cannot make one of them look different
    for (const state of [normal, narrow, wide, backToDefault]) expect(state.priority).toBe("important");
  });

  it("font size is measured from the active template's own body size, so the preview shows the size the export prints", () => {
    // compact_professional / clean_simple render body text at 9px, classic_professional at 11px (templateStyles.ts)
    for (const body of ["9px", "11px"]) {
      const view = render(<Template2 data={data as never} style={{ ...(style as object), bodyFontSize: body } as never} careerLevel="Mid-Level" domainFamily="software_engineering" sectionOrder={["Personal Info", "Professional Summary", "Work Experience"]} />);
      const root = view.container;
      const before = sizes(root);
      expect(before).toContain(body);
      applyPreviewLayout(root, { fontSize: "10", baseFontSize: body });
      // the template's body text is now exactly the 10pt the export receives (font_size=10)
      expect(sizes(root)).toContain("10px");
      expect(sizes(root)).not.toContain(body);
      applyPreviewLayout(root, { baseFontSize: body });
      expect(sizes(root)).toEqual(before);
      view.unmount();
    }
  });

  it("without a usable template body size the 10px design size is the base (control)", () => {
    for (const base of [undefined, "", "abc"]) {
      const root = renderPreview();
      applyPreviewLayout(root, { fontSize: "12", baseFontSize: base });
      expect(sizes(root)).toContain("12px");
    }
  });

  it("alignment aligns the name and the section headings", () => {
    const root = renderPreview();
    applyPreviewLayout(root, { alignment: "right" });
    expect(root.querySelector<HTMLElement>("h1")!.style.textAlign).toBe("right");
    const headings = Array.from(root.querySelectorAll<HTMLElement>("*")).filter((el) => el.style.textTransform === "uppercase" && el.tagName !== "H1");
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) expect(heading.style.textAlign).toBe("right");
  });
});

describe("a section with content is never dropped from the order", () => {
  it("adds the summary after Personal Info when the stored order lacks it", () => {
    expect(withFilledCoreSections(["Personal Info", "Work Experience"], data)).toEqual(["Personal Info", "Professional Summary", "Work Experience"]);
  });

  it("leaves a complete order, an empty order and empty sections alone", () => {
    const full = ["Personal Info", "Professional Summary", "Work Experience"];
    expect(withFilledCoreSections(full, data)).toBe(full);
    expect(withFilledCoreSections([], data)).toEqual([]);
    expect(withFilledCoreSections(["Personal Info"], { professionalSummary: { summary: "" }, workExperience: [] })).toEqual(["Personal Info"]);
  });

  it("appends other filled core sections at the end", () => {
    const withEducation = { ...data, education: [{ school: "MIT", degree: "BS" }] };
    expect(withFilledCoreSections(["Personal Info", "Professional Summary", "Work Experience"], withEducation)).toEqual(["Personal Info", "Professional Summary", "Work Experience", "Education"]);
  });

  it("adds a filled Skills section the stored order lacks (flat list, domain category, custom category)", () => {
    const order = ["Personal Info", "Professional Summary", "Work Experience"];
    expect(withFilledCoreSections(order, { ...data, skills: ["React"] })).toEqual([...order, "Skills"]);
    expect(withFilledCoreSections(order, { ...data, skills: [], categorizedSkills: { programming_languages: [], clinical_skills: ["Triage"] } })).toEqual([...order, "Skills"]);
    expect(withFilledCoreSections(order, { ...data, skills: [], categorizedSkills: { programming_languages: [], custom_categories: [{ id: "c1", name: "Tools", skills: ["Figma"] }] } })).toEqual([...order, "Skills"]);
  });

  it("leaves Skills out when it holds only category metadata, and never adds it twice", () => {
    const order = ["Personal Info", "Professional Summary", "Work Experience"];
    const metadataOnly = {
      ...data, skills: [],
      categorizedSkills: { programming_languages: [], frameworks: [], hidden_predefined_categories: ["frameworks"], skill_id_map: { "frameworks:React": "s1" }, custom_categories: [{ id: "c1", name: "Tools", skills: [] }] },
    };
    expect(withFilledCoreSections(order, metadataOnly)).toBe(order);
    const listed = ["Personal Info", "skills", "Work Experience"];
    expect(withFilledCoreSections(listed, { ...data, professionalSummary: "", skills: ["React"] })).toBe(listed);
  });

  it("the preview shows the skills once the order is filled, and not before", () => {
    const withSkills = { ...data, skills: ["Kubernetes"] };
    const text = (order: string[]) => render(<Template2 data={withSkills as never} style={style} careerLevel="Mid-Level" domainFamily="software_engineering" sectionOrder={order} />).container.textContent || "";
    const stored = ["Personal Info", "Professional Summary", "Work Experience"];
    expect(text(stored)).not.toMatch(/Kubernetes/);
    expect(text(withFilledCoreSections(stored, withSkills))).toMatch(/Kubernetes/);
  });

  it("the preview shows the summary once the order is filled, and not before", () => {
    const text = (order: string[]) => render(<Template2 data={data as never} style={style} careerLevel="Mid-Level" domainFamily="software_engineering" sectionOrder={order} />).container.textContent || "";
    const stored = ["Personal Info", "Work Experience"];
    expect(text(stored)).not.toMatch(/Strategic/);
    expect(text(withFilledCoreSections(stored, data))).toMatch(/Strategic/);
  });
});
