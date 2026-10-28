/**
 * Component tests for CoverLetterTemplatePreview.tsx (image previews + cache).
 *
 * Covers:
 *   - one request is shared by every consumer of the same preview URL
 *   - remounting makes no new request (module-level cache)
 *   - a failed load is not cached and is retried on the next mount
 *   - the request asks for the PNG, carries a version marker and opts in to
 *     HTTP caching
 *   - a 2xx response that is not an image (e.g. the PDF an older backend returns
 *     for the unknown format parameter) falls back instead of showing a broken
 *     <img>, and is not cached
 *   - an <img> that fails to load falls back and drops the cached entry
 *   - the modal shows an error state with a retry instead of loading forever
 *
 * The cache lives in module-level maps, so every test uses its own preview URL
 * instead of resetting modules (which would load a second copy of React).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const getMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/http", () => ({ httpClient: { get: getMock } }));

import {
  CoverLetterTemplatePreview,
  CoverLetterTemplatePreviewModal,
} from "@/app/cover-letter/_components/CoverLetterTemplatePreview";

const template = { accent: "bg-blue-600", previewStyle: "modern" as const };

let urlCounter = 0;
const nextPreviewUrl = () => `https://api.test/api/v1/cover-letter/templates/t${++urlCounter}/preview?v=abc`;

const png = () => new Blob(["png"], { type: "image/png" });
const pdf = () => new Blob(["pdf"], { type: "application/pdf" });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const thumbnail = (url: string) => <CoverLetterTemplatePreview template={template} previewUrl={url} />;
const modal = (url: string) => (
  <CoverLetterTemplatePreviewModal previewUrl={url} templateName="Modern" onClose={() => undefined} />
);

let blobCounter = 0;
const createObjectURL = vi.fn(() => `blob:preview-${++blobCounter}`);
const revokeObjectURL = vi.fn();

beforeEach(() => {
  getMock.mockReset();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: revokeObjectURL });
});

afterEach(() => cleanup());

describe("CoverLetterTemplatePreview cache", () => {
  it("shares one request between a thumbnail and the modal for the same URL", async () => {
    const url = nextPreviewUrl();
    const pending = deferred<{ data: Blob }>();
    getMock.mockReturnValue(pending.promise);

    render(
      <>
        {thumbnail(url)}
        {thumbnail(url)}
        {modal(url)}
      </>,
    );
    expect(getMock).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve({ data: png() }));

    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(3));
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("makes no request when the same preview is mounted again", async () => {
    const url = nextPreviewUrl();
    getMock.mockResolvedValue({ data: png() });

    const first = render(thumbnail(url));
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    first.unmount();

    render(modal(url));

    // Straight from the cache: no loading state and no second request.
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failed load: the next mount requests it again", async () => {
    const url = nextPreviewUrl();
    getMock.mockRejectedValueOnce(new Error("network down"));

    const first = render(thumbnail(url));
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));
    // Code-drawn preview stays on screen; there is no image.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Dear Hiring Manager,")).toBeInTheDocument();
    first.unmount();

    getMock.mockResolvedValue({ data: png() });
    render(thumbnail(url));

    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("requests the PNG with a version marker and opts in to HTTP caching", async () => {
    const url = nextPreviewUrl();
    getMock.mockResolvedValue({ data: png() });

    render(thumbnail(url));
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());

    const [requestedUrl, config] = getMock.mock.calls[0];
    expect(requestedUrl).toBe(`${url}&format=png&piv=1`);
    expect(config.responseType).toBe("blob");
    expect(config.headers).toEqual({ "X-Allow-Http-Cache": "true" });
  });
});

describe("CoverLetterTemplatePreview non-image responses", () => {
  it("falls back instead of showing a broken <img> when the response is not an image", async () => {
    const url = nextPreviewUrl();
    // e.g. a backend that does not know ?format=png yet answers 200 with the PDF
    getMock.mockResolvedValue({ data: pdf() });

    render(thumbnail(url));
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Dear Hiring Manager,")).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("does not cache a non-image response: the next mount asks again", async () => {
    const url = nextPreviewUrl();
    getMock.mockResolvedValue({ data: pdf() });

    const first = render(thumbnail(url));
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    const callsAfterFirst = getMock.mock.calls.length;
    first.unmount();

    getMock.mockResolvedValue({ data: png() });
    render(thumbnail(url));

    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(getMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("recovers from a stale non-image HTTP-cache entry by asking the server directly", async () => {
    const url = nextPreviewUrl();
    // First answer comes from the browser cache (the old PDF), the retry from the server.
    getMock.mockResolvedValueOnce({ data: pdf() }).mockResolvedValueOnce({ data: png() });

    render(thumbnail(url));

    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(getMock).toHaveBeenCalledTimes(2);
    // The retry must not opt in to caching, so it bypasses the stale entry.
    expect(getMock.mock.calls[1][1].headers).toBeUndefined();
  });
});

describe("CoverLetterTemplatePreview image load errors", () => {
  it("falls back and drops the cached entry when the <img> fails to load", async () => {
    const url = nextPreviewUrl();
    getMock.mockResolvedValue({ data: png() });

    const first = render(thumbnail(url));
    const img = await screen.findByRole("img");
    const blobUrl = img.getAttribute("src");

    fireEvent.error(img);

    await waitFor(() => expect(screen.queryByRole("img")).not.toBeInTheDocument());
    expect(screen.getByText("Dear Hiring Manager,")).toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith(blobUrl);
    first.unmount();

    // The broken entry is gone, so the next mount downloads it again.
    render(thumbnail(url));
    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(getMock).toHaveBeenCalledTimes(2);
  });
});

describe("CoverLetterTemplatePreviewModal states", () => {
  it("shows a loading state while the preview is downloading", () => {
    const url = nextPreviewUrl();
    getMock.mockReturnValue(deferred<{ data: Blob }>().promise);

    render(modal(url));

    expect(screen.getByText("Loading preview...")).toBeInTheDocument();
  });

  it("shows an error with a retry instead of loading forever when the load fails", async () => {
    const url = nextPreviewUrl();
    getMock.mockRejectedValueOnce(new Error("boom"));

    render(modal(url));

    expect(await screen.findByText("Preview unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Loading preview...")).not.toBeInTheDocument();

    getMock.mockResolvedValue({ data: png() });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByRole("img")).toBeInTheDocument());
    expect(screen.queryByText("Preview unavailable")).not.toBeInTheDocument();
  });

  it("shows the error state for a non-image response", async () => {
    const url = nextPreviewUrl();
    getMock.mockResolvedValue({ data: pdf() });

    render(modal(url));

    expect(await screen.findByText("Preview unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the error state when the loaded image cannot be displayed", async () => {
    const url = nextPreviewUrl();
    getMock.mockResolvedValue({ data: png() });

    render(modal(url));
    fireEvent.error(await screen.findByRole("img"));

    expect(await screen.findByText("Preview unavailable")).toBeInTheDocument();
  });
});
