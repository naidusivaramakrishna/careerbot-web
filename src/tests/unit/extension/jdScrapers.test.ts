/**
 * The Zippia and JobLeads content scripts must:
 *  - send the WHOLE job description, not just one of its sections
 *    (e.g. only "Requirements");
 *  - stop rescanning the page once a description has been found;
 *  - keep the banner when only the URL changes, swap it when a different job
 *    shows up, and remove it when the page stops being a job page.
 *
 * The scripts are plain browser scripts (no exports), so each test loads the
 * real file into a page built from a small HTML fixture and reads the
 * JD_DETECTED messages it sends.
 */

import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// jsdom has no innerText; the scripts read it. Counting reads lets a test tell
// whether the page was rescanned (each read forces a layout in a real browser).
let innerTextReads = 0;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      innerTextReads++;
      return this.textContent;
    },
  });
});

type Message = { type: string; data?: { jd?: string } };
const stopCallbacks: Array<() => void> = [];

beforeEach(() => {
  vi.useFakeTimers();
  innerTextReads = 0;
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

afterEach(() => {
  stopCallbacks.splice(0).forEach((stop) => stop());
  vi.useRealTimers();
});

function runScraper(file: string, url: string) {
  const source = fs.readFileSync(path.resolve(process.cwd(), "extension/content-scripts", file), "utf8");
  const messages: Message[] = [];
  const chromeStub = {
    runtime: {
      sendMessage: (message: Message) => {
        messages.push(message);
        return Promise.resolve();
      },
      getURL: (asset: string) => asset,
    },
  };
  const fakeLocation = { href: url, pathname: new URL(url).pathname };
  // A plain function, not vi.fn(): the shared test setup calls vi.clearAllMocks()
  // after every test, which would erase a mock's record of the handler.
  let onPageHide: (() => void) | undefined;
  const fakeWindow = {
    location: fakeLocation,
    addEventListener: (event: string, handler: () => void) => {
      if (event === "pagehide") onPageHide = handler;
    },
  };

  new Function("window", "location", "chrome", source)(fakeWindow, fakeLocation, chromeStub);

  // Stops the script's MutationObserver so it doesn't outlive the test.
  stopCallbacks.push(() => onPageHide?.());

  return {
    descriptions: () => messages.filter((m) => m.type === "JD_DETECTED").map((m) => m.data?.jd ?? ""),
    setUrl: (next: string) => {
      fakeLocation.href = next;
      fakeLocation.pathname = new URL(next).pathname;
    },
    // Any DOM change makes the script's MutationObserver run.
    pageChanged: () => document.body.appendChild(document.createElement("span")),
  };
}

async function detect(file: string, url: string): Promise<string | null> {
  const page = runScraper(file, url);
  await vi.advanceTimersByTimeAsync(1000);
  return page.descriptions()[0] ?? null;
}

const section = (heading: string) => `${heading} ${"Build and maintain reliable services together with the team. ".repeat(8)}`;

const PAGE_WITH_SECTIONS = `
  <header><nav>Home Jobs Companies</nav></header>
  <main>
    <h1>Senior Engineer</h1>
    <div id="job-body">
      <div>${section("Responsibilities:")}</div>
      <div>${section("Requirements:")}</div>
      <div>Nice to have: SQL</div>
    </div>
    <aside>
      <div>Similar job: Data Analyst at Acme, remote</div>
      <div>Similar job: Product Manager at Globex, hybrid</div>
    </aside>
  </main>`;

const BANNER = "cb-shadow-host";

describe.each([
  {
    file: "zippia-scraper.js",
    jobUrl: "https://www.zippia.com/job/senior-engineer/",
    otherJobUrl: "https://www.zippia.com/job/data-analyst/",
    notAJobUrl: "https://www.zippia.com/careers/",
  },
  {
    file: "jobleads-scraper.js",
    jobUrl: "https://www.jobleads.com/us/job/senior-engineer--austin--123",
    otherJobUrl: "https://www.jobleads.com/us/job/data-analyst--boston--456",
    notAJobUrl: "https://www.jobleads.com/us/about",
  },
])("$file", ({ file, jobUrl, otherJobUrl, notAJobUrl }) => {
  describe("what it captures", () => {
    it("returns every section of the job description, not just one", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;

      const jd = await detect(file, jobUrl);

      expect(jd).toContain("Responsibilities:");
      expect(jd).toContain("Requirements:");
      expect(jd).toContain("Nice to have: SQL");
    });

    it("leaves out related-jobs links that sit outside the description", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;

      expect(await detect(file, jobUrl)).not.toContain("Similar job");
    });

    it("still returns a description that has a single section", async () => {
      document.body.innerHTML = `<header><nav>Menu</nav></header><div>${section("Responsibilities:")}</div>`;

      const jd = await detect(file, jobUrl);

      expect(jd).toContain("Responsibilities:");
      expect(jd).not.toContain("Menu");
    });

    it("sends nothing on a page that is not a job page", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;

      expect(await detect(file, notAJobUrl)).toBeNull();
    });
  });

  describe("scanning", () => {
    it("stops rescanning the page once a description has been found", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;
      const page = runScraper(file, jobUrl);
      await vi.advanceTimersByTimeAsync(1000);
      expect(page.descriptions()).toHaveLength(1);

      // Let the watch window and the scheduled retries pass.
      await vi.advanceTimersByTimeAsync(20000);
      const readsBefore = innerTextReads;

      page.pageChanged();
      await vi.advanceTimersByTimeAsync(1000);

      expect(innerTextReads).toBe(readsBefore);
    });
  });

  describe("navigation", () => {
    it("keeps the banner and does not resend the description when only the URL changes", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;
      const page = runScraper(file, jobUrl);
      await vi.advanceTimersByTimeAsync(1000);

      page.setUrl(`${jobUrl}?utm_source=email#top`);
      page.pageChanged();
      await vi.advanceTimersByTimeAsync(1000);

      expect(page.descriptions()).toHaveLength(1);
      expect(document.getElementById(BANNER)).not.toBeNull();
    });

    it("sends the new description when a different job shows up after a URL change", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;
      const page = runScraper(file, jobUrl);
      await vi.advanceTimersByTimeAsync(1000);

      page.setUrl(otherJobUrl);
      document.body.innerHTML = PAGE_WITH_SECTIONS.replaceAll("Build and maintain", "Design and operate");
      await vi.advanceTimersByTimeAsync(1000);

      const sent = page.descriptions();
      expect(sent).toHaveLength(2);
      expect(sent[1]).toContain("Design and operate");
      expect(document.getElementById(BANNER)).not.toBeNull();
    });

    it("removes the banner when the page is no longer a job page", async () => {
      document.body.innerHTML = PAGE_WITH_SECTIONS;
      const page = runScraper(file, jobUrl);
      await vi.advanceTimersByTimeAsync(1000);
      expect(document.getElementById(BANNER)).not.toBeNull();

      page.setUrl(notAJobUrl);
      page.pageChanged();
      await vi.advanceTimersByTimeAsync(1000);

      expect(document.getElementById(BANNER)).toBeNull();
    });
  });
});
