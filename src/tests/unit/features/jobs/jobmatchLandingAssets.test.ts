// Size budget for the Job Match landing assets. next.config.ts sets
// images.unoptimized, so next/image serves these files byte for byte: no
// resizing, no WebP/AVIF, no srcset. An oversized file here ships as-is to
// every visitor (the hero SVG decides LCP on /jobmatch).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_IMAGES = path.resolve(__dirname, "../../../../../public/images");
const HERO = path.join(PUBLIC_IMAGES, "jobmatch-hero-direct.svg");
const REFERENCE_DIR = path.join(PUBLIC_IMAGES, "jobmatch-reference");

const KB = 1024;
const HERO_BUDGET = 500 * KB; // above the fold: decides LCP
const EMBEDDED_RASTER_BUDGET = 200 * KB; // each base64 image inside the hero SVG
const FILE_BUDGET = 800 * KB; // every other landing image

// The paths the landing components (landing-top, landing-bottom) reference.
const EXPECTED_ASSETS = [
  "jobmatch-hero-direct.svg",
  ...[
    "add-the-jd.png",
    "add-your-resume.png",
    "ai-platform-improvement-icon.svg",
    "careerbot-table-icon.svg",
    "cta-card-2.png",
    "cta-card1.png",
    "easy-editing-icon.svg",
    "free-to-start-icon.svg",
    "get-your-report.png",
    "key-analysis-icon.svg",
    "know-exactly-where-you-stand-icon.svg",
    "know-exactly-where-you-stand.png",
    "other-platforms-table-icon.svg",
    "relevant-skill-additions-icon.svg",
    "resume-match-icon.svg",
    "still-need-help-icon.svg",
    "tailor-my-resume-icon.svg",
    "takes-about-a-minute-icon.svg",
    "testimonials-icon.svg",
    "turn-insights-into-a-stronger-resume.webp",
    "your-files-stay-private-icon.svg",
  ].map((name) => `jobmatch-reference/${name}`),
];

const EDITOR_SCREENSHOT = "turn-insights-into-a-stronger-resume.webp";
const AVATARS = ["Person1.svg", "Person 2.svg", "Person3.svg"];

function referenceAssets(): string[] {
  return readdirSync(REFERENCE_DIR).map((name) => path.join(REFERENCE_DIR, name));
}

describe("jobmatch landing asset budget", () => {
  it("keeps the hero SVG under the LCP budget", () => {
    expect(statSync(HERO).size).toBeLessThanOrEqual(HERO_BUDGET);
  });

  it("keeps every raster embedded in the hero SVG small (no full-size exports)", () => {
    const svg = readFileSync(HERO, "utf8");
    const embedded = [...svg.matchAll(/data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)/g)].map((m) => m[1].length);
    expect(embedded.length).toBeGreaterThan(0);
    expect(embedded.filter((chars) => chars > EMBEDDED_RASTER_BUDGET)).toEqual([]);
  });

  it("keeps every jobmatch-reference image under the per-file budget", () => {
    const over = referenceAssets()
      .filter((file) => statSync(file).size > FILE_BUDGET)
      .map((file) => `${path.basename(file)}: ${statSync(file).size} bytes`);
    expect(over).toEqual([]);
  });

  // ResumeEditorSection renders this screenshot at most 1096 CSS px wide, and
  // TestimonialsSection draws each avatar in a circle of at most 66px; unoptimized means
  // every viewport (390px phones included) downloads these bytes as-is.
  it("keeps the screenshot ResumeEditorSection renders (2x of 1096px) under 200 KB", () => {
    const section = readFileSync(path.resolve(__dirname, "../../../../app/(jobs)/jobmatch/_components/landing/ResumeEditorSection.tsx"), "utf8");
    const src = /src="\/images\/(jobmatch-reference\/turn-insights[^"]+)"/.exec(section)?.[1];
    expect(src).toBe(`jobmatch-reference/${EDITOR_SCREENSHOT}`);
    expect(statSync(path.join(PUBLIC_IMAGES, src as string)).size).toBeLessThanOrEqual(200 * KB);
  });

  it.each(AVATARS)("keeps the testimonial avatar %s under 20 KB", (name) => {
    expect(statSync(path.join(PUBLIC_IMAGES, name)).size).toBeLessThanOrEqual(20 * KB);
  });

  it("ships exactly the asset paths the landing components reference (control)", () => {
    const shipped = [HERO, ...referenceAssets()].map((file) => path.relative(PUBLIC_IMAGES, file).split(path.sep).join("/"));
    expect(shipped.sort()).toEqual([...EXPECTED_ASSETS].sort());
  });
});
