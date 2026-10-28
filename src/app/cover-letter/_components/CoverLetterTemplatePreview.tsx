"use client";

import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/lib/http";

export type CoverLetterPreviewStyle =
  | "classic"
  | "modern"
  | "compact"
  | "executive"
  | "minimal"
  | "signature";

export type CoverLetterPreviewTemplate = {
  accent: string;
  paper?: string;
  previewStyle: CoverLetterPreviewStyle;
};

export type CoverLetterPreviewContent = {
  name: string;
  contact: string;
  date: string;
  recipient: string;
  company: string;
  greeting: string;
  paragraphs: string[];
  closing: string;
  signature: string;
};

const sampleContent: CoverLetterPreviewContent = {
  name: "Ananya Rao",
  contact: "ananya.rao@email.com | Bengaluru",
  date: "24 Jun 2026",
  recipient: "Hiring Manager",
  company: "Northstar Analytics",
  greeting: "Dear Hiring Manager,",
  paragraphs: [
    "I am excited to apply for the Product Analyst role.",
    "My work in reporting and customer insight helps teams make clear product decisions.",
    "I would welcome the opportunity to bring that rigor to your team.",
  ],
  closing: "Sincerely,",
  signature: "Ananya Rao",
};

const sizeClass = {
  compact: {
    shell: "h-24 w-16",
    text: "text-[3.4px] leading-[1.25]",
    pad: "p-1.5",
    avatar: "h-3 w-3 text-[4px]",
    monogram: "h-4 w-4 text-[5px]",
  },
  picker: {
    shell: "h-32 w-24",
    text: "text-[3.8px] leading-[1.28]",
    pad: "p-2",
    avatar: "h-4 w-4 text-[5px]",
    monogram: "h-5 w-5 text-[6px]",
  },
  large: {
    shell: "h-48 w-40",
    text: "text-[4px] leading-[1.28]",
    pad: "p-3",
    avatar: "h-7 w-7 text-[8px]",
    monogram: "h-8 w-8 text-[9px]",
  },
} as const;

export function CoverLetterTemplatePreview({
  template,
  content = sampleContent,
  size = "picker",
  previewUrl,
}: {
  template: CoverLetterPreviewTemplate;
  content?: CoverLetterPreviewContent;
  size?: keyof typeof sizeClass;
  previewUrl?: string | null;
}) {
  const ui = sizeClass[size];
  const previewImage = usePreviewImage(previewUrl);
  // Until the image is ready (or if it could not be loaded) the code-drawn
  // preview below stays on screen.
  if (previewImage.url) {
    return (
      <PreviewImage src={previewImage.url} shellClass={ui.shell} onError={previewImage.onImageError} />
    );
  }
  const initials = getInitials(content.name);
  const body = (
    <div className={[ui.text, "space-y-1 text-slate-800"].join(" ")}>
      <p className="font-semibold text-slate-950">{content.greeting}</p>
      {content.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className="font-semibold text-slate-950">{content.closing}</p>
      <p className="font-semibold text-slate-950">{content.signature}</p>
    </div>
  );

  if (template.previewStyle === "executive") {
    return (
      <div className={["flex justify-center rounded-lg", template.paper ?? ""].join(" ")}>
        <div className={[ui.shell, "grid shrink-0 grid-cols-[0.34fr_1fr] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"].join(" ")}>
          <div className={[ui.pad, "text-white", template.accent].join(" ")}>
            <div className={["flex items-center justify-center rounded-full border border-white/60 font-black", ui.avatar].join(" ")}>
              {initials}
            </div>
            <div className={[ui.text, "mt-4 space-y-1 font-semibold"].join(" ")}>
              <p>{content.name}</p>
              <p className="text-white/70">Product Analyst</p>
              <p className="text-white/70">{content.company}</p>
            </div>
          </div>
          <div className={[ui.pad, "overflow-hidden"].join(" ")}>
            <p className={[ui.text, "font-black uppercase tracking-wide text-slate-950"].join(" ")}>Cover Letter</p>
            <div className="my-2 h-px w-full bg-slate-200" />
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (template.previewStyle === "modern") {
    return (
      <div className={["flex justify-center rounded-lg", template.paper ?? ""].join(" ")}>
        <div className={[ui.shell, "shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"].join(" ")}>
          <div className={[ui.pad, "text-white", template.accent].join(" ")}>
            <p className={[ui.text, "font-black"].join(" ")}>{content.name}</p>
            <p className={[ui.text, "mt-1 text-white/75"].join(" ")}>{content.contact}</p>
          </div>
          <div className={[ui.pad, "overflow-hidden"].join(" ")}>
            <div className={[ui.text, "mb-2 space-y-0.5 text-slate-500"].join(" ")}>
              <p>{content.date}</p>
              <p>{content.recipient}</p>
              <p>{content.company}</p>
            </div>
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (template.previewStyle === "compact") {
    return (
      <div className={["flex justify-center rounded-lg", template.paper ?? ""].join(" ")}>
        <div className={[ui.shell, ui.pad, "shrink-0 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-md"].join(" ")}>
          <div className="mb-2 grid grid-cols-[1fr_0.38fr] gap-2">
            <div>
              <p className={[ui.text, "font-black text-slate-950"].join(" ")}>{content.name}</p>
              <p className={[ui.text, "text-slate-500"].join(" ")}>Product Analyst</p>
            </div>
            <div className={[ui.text, "space-y-0.5 text-right text-slate-500"].join(" ")}>
              <p>{content.date.split(" ").slice(0, 2).join(" ")}</p>
              <p>Remote</p>
            </div>
          </div>
          <div className="mb-2 h-px w-full bg-blue-100" />
          {body}
        </div>
      </div>
    );
  }

  if (template.previewStyle === "minimal") {
    return (
      <div className={["flex justify-center rounded-lg", template.paper ?? ""].join(" ")}>
        <div className={[ui.shell, ui.pad, "shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"].join(" ")}>
          <p className={[ui.text, "text-right text-slate-400"].join(" ")}>{content.date}</p>
          <p className={[ui.text, "mt-5 font-black text-slate-950"].join(" ")}>{content.name}</p>
          <div className={["mt-2 h-0.5 w-14 rounded-full", template.accent].join(" ")} />
          <div className="mt-4">{body}</div>
        </div>
      </div>
    );
  }

  if (template.previewStyle === "signature") {
    return (
      <div className={["flex justify-center rounded-lg", template.paper ?? ""].join(" ")}>
        <div className={[ui.shell, ui.pad, "shrink-0 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-md"].join(" ")}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className={[ui.text, "font-black text-slate-950"].join(" ")}>{content.name}</p>
              <p className={[ui.text, "text-slate-500"].join(" ")}>Product Analyst</p>
            </div>
            <div className={["flex items-center justify-center rounded-full font-black text-white", ui.monogram, template.accent].join(" ")}>
              {initials}
            </div>
          </div>
          {body}
          <div className="mt-3 flex items-center gap-2">
            <p className={[ui.text, "font-semibold text-slate-950"].join(" ")}>{content.signature}</p>
            <div className="h-px flex-1 bg-emerald-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={["flex justify-center rounded-lg", template.paper ?? ""].join(" ")}>
      <div className={[ui.shell, ui.pad, "shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"].join(" ")}>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className={[ui.text, "font-black text-slate-950"].join(" ")}>{content.name}</p>
            <p className={[ui.text, "text-slate-500"].join(" ")}>{content.contact}</p>
          </div>
          <div className={["flex items-center justify-center rounded-full border border-slate-300 font-black text-slate-700", ui.avatar].join(" ")}>
            {initials}
          </div>
        </div>
        <div className={["mb-3 h-1 w-full rounded-full", template.accent].join(" ")} />
        <div className={[ui.text, "mb-2 space-y-0.5 text-slate-500"].join(" ")}>
          <p>{content.date}</p>
          <p>{content.recipient}</p>
          <p>{content.company}</p>
        </div>
        {body}
      </div>
    </div>
  );
}

function PreviewImage({ src, shellClass, onError }: { src: string; shellClass: string; onError: () => void }) {
  return (
    <div className={[shellClass, "relative shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"].join(" ")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Template style preview"
        onError={onError}
        className="h-full w-full object-cover object-top"
        draggable={false}
      />
    </div>
  );
}

export function CoverLetterTemplatePreviewModal({
  previewUrl,
  templateName,
  onClose,
}: {
  previewUrl: string | null;
  templateName: string;
  onClose: () => void;
}) {
  const previewImage = usePreviewImage(previewUrl);
  if (!previewUrl) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Close template preview" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section className="relative z-10 flex h-[min(90vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/30 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-[#070b33]">{templateName} preview</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Non-personal sample generated by the export service</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        </header>
        <div className="relative min-h-0 flex-1 bg-slate-100 p-3">
          {previewImage.status === "error" ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl bg-white text-center">
              <p className="text-sm font-bold text-slate-700">Preview unavailable</p>
              <p className="max-w-xs text-xs font-semibold text-slate-500">
                The sample for this template could not be loaded.
              </p>
              <button
                type="button"
                onClick={previewImage.retry}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          ) : !previewImage.url ? (
            <div className="flex h-full items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-500">Loading preview...</div>
          ) : (
            <div className="h-full overflow-auto rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={`${templateName} template preview`}
                onError={previewImage.onImageError}
                className="mx-auto block h-auto w-full max-w-3xl"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Template previews are fixed, non-personal samples that the API serves as
// immutable images (the same sample as the export PDF, rasterized). Like the
// resume builder, they show in a plain <img>, with no PDF viewer to start up.
// Download each one once per page session and share the blob URL between the
// picker thumbnails and the preview modal (and across reopens).

// Bump to step past an HTTP-cache entry stored under the old URL. The API
// marks previews immutable, so a bad response (for example the PDF an older
// backend returns for the unknown `format` parameter) could otherwise be
// served from the browser cache after the backend is fixed.
const PREVIEW_IMAGE_CACHE_VERSION = "1";

function toPreviewImageUrl(previewUrl: string): string {
  const separator = previewUrl.includes("?") ? "&" : "?";
  return `${previewUrl}${separator}format=png&piv=${PREVIEW_IMAGE_CACHE_VERSION}`;
}

const previewBlobRequests = new Map<string, Promise<string>>();
const previewBlobUrls = new Map<string, string>();

function fetchPreviewBlob(imageUrl: string, allowHttpCache: boolean): Promise<Blob> {
  return httpClient
    .get<Blob>(imageUrl, {
      responseType: "blob",
      // Let the browser's HTTP cache serve the immutable image (see lib/http.ts).
      ...(allowHttpCache ? { headers: { "X-Allow-Http-Cache": "true" } } : {}),
    })
    .then(({ data }) => data);
}

const isImageBlob = (blob: Blob) => blob.type.startsWith("image/");

function loadPreviewBlobUrl(previewUrl: string): Promise<string> {
  const existing = previewBlobRequests.get(previewUrl);
  if (existing) return existing;
  const imageUrl = toPreviewImageUrl(previewUrl);
  const request = fetchPreviewBlob(imageUrl, true)
    // A 2xx that is not an image is a stale or wrong response (for example a
    // cached PDF). Ask the server directly, bypassing the HTTP cache, once.
    .then((blob) => (isImageBlob(blob) ? blob : fetchPreviewBlob(imageUrl, false)))
    .then((blob) => {
      if (!isImageBlob(blob)) throw new Error("Template preview response was not an image");
      const objectUrl = URL.createObjectURL(blob);
      previewBlobUrls.set(previewUrl, objectUrl);
      return objectUrl;
    })
    .catch((error) => {
      // Do not cache a failure: the next open should try again.
      previewBlobRequests.delete(previewUrl);
      throw error;
    });
  previewBlobRequests.set(previewUrl, request);
  return request;
}

// Forget a preview whose image could not be displayed, so the next open
// downloads it again instead of reusing the broken blob.
function dropPreview(previewUrl: string) {
  const objectUrl = previewBlobUrls.get(previewUrl);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  previewBlobUrls.delete(previewUrl);
  previewBlobRequests.delete(previewUrl);
}

type PreviewImageState = {
  url: string | null;
  status: "idle" | "loading" | "ready" | "error";
};

function usePreviewImage(previewUrl?: string | null): PreviewImageState & {
  /** Call from the <img> onError: drops the cached entry and reports an error. */
  onImageError: () => void;
  /** Load again after an error. */
  retry: () => void;
} {
  const [state, setState] = useState<PreviewImageState>(() => {
    const cached = previewUrl ? previewBlobUrls.get(previewUrl) : undefined;
    if (cached) return { url: cached, status: "ready" };
    return { url: null, status: previewUrl ? "loading" : "idle" };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!previewUrl) {
      setState({ url: null, status: "idle" });
      return;
    }
    const cached = previewBlobUrls.get(previewUrl);
    if (cached) {
      setState({ url: cached, status: "ready" });
      return;
    }
    setState({ url: null, status: "loading" });
    let cancelled = false;
    loadPreviewBlobUrl(previewUrl)
      .then((url) => {
        if (!cancelled) setState({ url, status: "ready" });
      })
      .catch(() => {
        // Thumbnails keep the code-drawn preview; the modal shows an error.
        if (!cancelled) setState({ url: null, status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [previewUrl, attempt]);

  const onImageError = useCallback(() => {
    if (previewUrl) dropPreview(previewUrl);
    setState({ url: null, status: "error" });
  }, [previewUrl]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, onImageError, retry };
}

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CL"
  );
}
