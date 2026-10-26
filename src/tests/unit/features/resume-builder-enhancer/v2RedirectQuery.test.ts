/**
 * /builder/creation/<id>/v2 now redirects to the canonical editor. The canonical page reads its mode from the
 * query string (source=enhanced, from_ats, open_section, return_to), so the redirect must carry it along:
 * without source=enhanced an enhanced-resume id would load as a normal builder resume.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import Page from "@/app/(resume)/builder/creation/[resumeId]/v2/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

type SearchParams = Record<string, string | string[] | undefined>;
const open = (resumeId: string, searchParams?: SearchParams) =>
  Page({ params: Promise.resolve({ resumeId }), searchParams: Promise.resolve(searchParams ?? {}) } as never);

describe("the v2 redirect", () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear();
  });

  it("keeps the query string, so an enhanced resume still opens as one", async () => {
    await open("abc", { source: "enhanced", from_ats: "true", open_section: "Skills", return_to: "/jobs?tab=matched" });
    const target = new URL(vi.mocked(redirect).mock.calls[0][0], "https://x.test");
    expect(target.pathname).toBe("/builder/creation/abc");
    expect(target.searchParams.get("source")).toBe("enhanced");
    expect(target.searchParams.get("from_ats")).toBe("true");
    expect(target.searchParams.get("open_section")).toBe("Skills");
    expect(target.searchParams.get("return_to")).toBe("/jobs?tab=matched");
  });

  it("keeps repeated parameters and drops empty ones", async () => {
    await open("abc", { tag: ["a", "b"], gone: undefined });
    const target = new URL(vi.mocked(redirect).mock.calls[0][0], "https://x.test");
    expect(target.searchParams.getAll("tag")).toEqual(["a", "b"]);
    expect(target.searchParams.has("gone")).toBe(false);
  });

  it("without a query string goes to the plain editor URL, the id still encoded (control)", async () => {
    await open("a b/c");
    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/builder/creation/a%20b%2Fc");
  });
});
