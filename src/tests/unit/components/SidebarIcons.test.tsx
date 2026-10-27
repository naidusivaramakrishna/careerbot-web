/**
 * Sidebar nav icons load their artwork from /icons/sidebar/<name>.svg (public/icons/sidebar).
 * A file that is missing or fails to load must not leave a blank nav button: the icon falls back
 * to the inline icon that item used before the artwork was introduced.
 */
import React from "react";
import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import * as SidebarIcons from "@/components/icons/SidebarIcons";

const ICONS: Array<[string, string]> = [
  ["SidebarResumeIcon", "resume-builder"],
  ["SidebarAtsScanIcon", "ats-scan"],
  ["SidebarTemplatesIcon", "templates"],
  ["SidebarJobMatchIcon", "job-match"],
  ["SidebarJobsIcon", "jobs"],
  ["SidebarTrackerIcon", "track-application"],
  ["SidebarCoverLetterIcon", "cover-letter"],
  ["SidebarNotesIcon", "interview-notes"],
  ["SidebarMockInterviewIcon", "mock-interview"],
  ["SidebarCommunicationIcon", "communication"],
  ["SidebarMockTestIcon", "mock-test"],
  ["SidebarCodingIcon", "coding-practice"],
];

type IconComponent = (props: { size?: number; className?: string; sw?: number }) => React.ReactElement;
const iconOf = (name: string) => (SidebarIcons as unknown as Record<string, IconComponent>)[name];
const svgFile = (file: string) => path.join(process.cwd(), "public", "icons", "sidebar", `${file}.svg`);

describe("Sidebar icons", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("exports exactly the 12 nav icons", () => {
    expect(Object.keys(SidebarIcons).sort()).toEqual(ICONS.map(([name]) => name).sort());
  });

  it.each(ICONS)("%s shows /icons/sidebar/%s.svg while it loads", (name, file) => {
    const Icon = iconOf(name);
    const { container } = render(<Icon size={18} className="text-gray-600" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(`/icons/sidebar/${file}.svg`);
    expect(container.querySelector("svg")).toBeNull();
  });

  it.each(ICONS)("%s: the file %s.svg exists, or the icon falls back to an inline icon", (name, file) => {
    const Icon = iconOf(name);
    const { container } = render(<Icon size={18} className="text-gray-600" sw={1.6} />);
    const img = container.querySelector("img") as HTMLImageElement;
    fireEvent.error(img);
    // The fallback is drawn with currentColor, so the nav item's text colour still applies.
    const svg = container.querySelector("svg");
    expect(container.querySelector("img")).toBeNull();
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class") ?? "").toContain("text-gray-600");
    if (fs.existsSync(svgFile(file))) {
      expect(fs.readFileSync(svgFile(file), "utf8")).toContain("<svg");
    }
  });

  it("falls back when the file failed before React could see the img error (server-rendered page)", async () => {
    // A server-rendered <img> can fail before hydration, so its onError never runs; the icon
    // checks the URL itself after mount.
    const probes: Array<{ src: string; onerror: (() => void) | null }> = [];
    class ProbeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private url = "";
      constructor() { probes.push(this as unknown as { src: string; onerror: (() => void) | null }); }
      set src(value: string) { this.url = value; }
      get src() { return this.url; }
    }
    vi.stubGlobal("Image", ProbeImage);

    const Icon = iconOf("SidebarJobsIcon");
    const { container } = render(<Icon size={18} />);
    expect(probes.map((p) => p.src)).toContain("/icons/sidebar/jobs.svg");
    expect(container.querySelector("img")).not.toBeNull();

    await act(async () => probes.forEach((p) => p.onerror?.()));
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("keeps the artwork when it loads (control)", () => {
    const Icon = iconOf("SidebarResumeIcon");
    const { container } = render(<Icon size={18} />);
    fireEvent.load(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });
});
