/**
 * Unit tests for src/api/chatbotApi.ts's openOrDownloadTicketAttachment.
 *
 * Root-cause regression test for the "403 Please log in to view
 * attachments" bug: the backend's GET /tickets/{id}/attachments/{id}
 * deliberately returns 403 (not 401) when the access-token cookie is
 * missing/expired, specifically so it shares a status code with "logged in
 * but not the owner" -- but httpClient's global interceptor only
 * auto-refreshes on 401, and explicitly short-circuits on 403 ("tenant
 * mismatch" elsewhere in the app), so it never retries this endpoint. This
 * function must retry once via the same refresh-token flow the interceptor
 * itself uses, but only when the user is actually supposed to be logged in.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getMock = vi.fn();
vi.mock("@/lib/http", () => ({
  httpClient: {
    get: (...args: unknown[]) => getMock(...args),
    defaults: { baseURL: "https://backend.example.com/api/v1" },
  },
}));

const refreshAccessToken = vi.fn();
vi.mock("@/api/authApi", () => ({
  refreshAccessToken: (...args: unknown[]) => refreshAccessToken(...args),
}));

let mockAuthenticated = true;
vi.mock("@/api/chatbotAuth", () => ({
  isUserAuthenticated: () => mockAuthenticated,
}));

import { openOrDownloadTicketAttachment } from "@/api/chatbotApi";

const axiosError = (status: number) => {
  const err = new Error("Request failed") as Error & { response: { status: number }; isAxiosError: boolean };
  err.response = { status };
  err.isAxiosError = true;
  return err;
};

const blobResponse = (contentType: string) => ({
  data: new Blob(["bytes"], { type: contentType }),
  headers: { "content-type": contentType },
});

describe("openOrDownloadTicketAttachment", () => {
  let fakeTab: { location: { href: string }; close: ReturnType<typeof vi.fn>; closed: boolean; opener: unknown };
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMock.mockReset();
    refreshAccessToken.mockReset().mockResolvedValue(undefined);
    mockAuthenticated = true;

    // Starts with a non-null opener (as a real window.open('', '_blank')
    // reference would) so the "opener gets nulled out" assertion below
    // actually proves something.
    fakeTab = { location: { href: "" }, close: vi.fn(), closed: false, opener: window };
    vi.spyOn(window, "open").mockReturnValue(fakeTab as unknown as Window);

    createObjectURL = vi.fn().mockReturnValue("blob:fake-object-url");
    revokeObjectURL = vi.fn();
    // jsdom doesn't implement these on URL.
    (URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL = revokeObjectURL;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("opens an image attachment in the pre-opened tab on the first successful fetch, no refresh needed", async () => {
    getMock.mockResolvedValue(blobResponse("image/png"));

    await openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png");

    expect(getMock).toHaveBeenCalledWith(
      "/tickets/CB-001/attachments/att-1",
      expect.objectContaining({ responseType: "blob" }),
    );
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(fakeTab.location.href).toBe("blob:fake-object-url");
    expect(fakeTab.close).not.toHaveBeenCalled();
  });

  it("does not pass the 'noopener' feature to window.open, and nulls .opener manually instead", async () => {
    // Regression test: window.open(url, target, 'noopener') returns null
    // per the HTML spec -- the tab still opens, but every subsequent use of
    // the reference (navigating it to the blob URL, closing it) becomes a
    // silent no-op, so previews never work and a blank tab is left behind
    // on every click. window.open(url, target) WITHOUT 'noopener' keeps a
    // real reference; setting .opener = null on it achieves the same
    // "new tab can't reach back into window.opener" protection instead.
    getMock.mockResolvedValue(blobResponse("image/png"));

    await openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png");

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(fakeTab.opener).toBeNull();
  });

  it("retries once via refreshAccessToken when the first fetch 403s for a locally-authenticated user, then succeeds", async () => {
    getMock.mockRejectedValueOnce(axiosError(403)).mockResolvedValueOnce(blobResponse("image/png"));

    await openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png");

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(fakeTab.location.href).toBe("blob:fake-object-url");
  });

  it("does not retry (and closes the preview tab) when the user is not locally authenticated at all", async () => {
    mockAuthenticated = false;
    getMock.mockRejectedValue(axiosError(403));

    await expect(openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png")).rejects.toThrow();

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(fakeTab.close).toHaveBeenCalled();
  });

  it("propagates a genuine authorization failure (not this user's ticket) even after a successful refresh", async () => {
    getMock.mockRejectedValueOnce(axiosError(403)).mockRejectedValueOnce(axiosError(403));

    await expect(openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png")).rejects.toThrow();

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(fakeTab.close).toHaveBeenCalled();
  });

  it("downloads (does not preview) a non-image, non-PDF file", async () => {
    getMock.mockResolvedValue(blobResponse("application/zip"));
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    await openOrDownloadTicketAttachment("CB-001", "att-1", "archive.zip");

    expect(fakeTab.close).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("downloads (does not preview) an SVG -- it can embed and execute script at the app's own origin", async () => {
    // Regression test: before the window.open('', '_blank', 'noopener') fix,
    // previewTab was always null, so the preview branch (isPreviewable &&
    // previewTab) could never run at all -- this exact SVG-in-a-same-origin-
    // blob-URL path was dead code. Now that previewTab is real, a loose
    // startsWith('image/') check would navigate the tab to
    // URL.createObjectURL(svgBlob), a blob: URL on the app's own origin;
    // an SVG can carry a <script> or event-handler attribute that would
    // then run with the app's cookies/storage/credentialed fetch access.
    getMock.mockResolvedValue(blobResponse("image/svg+xml"));
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    await openOrDownloadTicketAttachment("CB-001", "att-1", "image.svg");

    expect(fakeTab.location.href).toBe("");
    expect(fakeTab.close).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("still previews a PDF whose content-type header carries extra parameters", async () => {
    // Regression test: a strict `contentType === 'application/pdf'` check
    // sent a real PDF served as "application/pdf; charset=binary" (or any
    // other parameter) to download instead of preview. Comparing only the
    // media type, before the ';', fixes both this and the SVG case above
    // with the same allowlist.
    getMock.mockResolvedValue(blobResponse("application/pdf; charset=binary"));

    await openOrDownloadTicketAttachment("CB-001", "att-1", "statement.pdf");

    expect(fakeTab.location.href).toBe("blob:fake-object-url");
    expect(fakeTab.close).not.toHaveBeenCalled();
  });

  it("falls back to a download, without throwing, when the browser blocked the popup (window.open returns null)", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    getMock.mockResolvedValue(blobResponse("image/png"));
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    await expect(openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png")).resolves.not.toThrow();

    expect(clickSpy).toHaveBeenCalled();
  });

  it("does not leave the error unhandled when the refresh call itself fails", async () => {
    getMock.mockRejectedValue(axiosError(403));
    refreshAccessToken.mockRejectedValue(new Error("refresh failed"));

    await expect(openOrDownloadTicketAttachment("CB-001", "att-1", "screenshot.png")).rejects.toThrow();
    expect(fakeTab.close).toHaveBeenCalled();
  });
});
