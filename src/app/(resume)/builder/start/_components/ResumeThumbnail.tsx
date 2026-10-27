"use client";
import { useEffect, useRef, useState } from "react";
import { getResumePreviewImage } from "@/api/resumeApi";
import { previewEnhancedResumePDFOnly } from "@/api/enhancerApi";
import { resolveAccountEmail } from "@/app/(resume)/templates/_utils/activeTemplateDomain";
import logger from "@/lib/logger";
import { detectCareerLevel } from "@/utils/careerLevelDetection";
import type { LayoutOptions } from "@/api/layoutOptions";
import { STYLE_CATALOGUES } from "../../creation/_utils/templateStyles";

type Thumb = { kind: "img" | "pdf"; url: string };

// Rendered previews are cached per resume + last-saved time, so switching views or reopening the
// page does not render again, and an edit (new updatedAt) fetches a fresh one. Only successes are
// kept: a failed render is tried again instead of leaving an empty card until the page reloads.
const cache = new Map<string, Thumb>();
const inFlight = new Map<string, Promise<Thumb | "failed">>();

// The server renders each preview from the resume's full data, so keep a few running at once, and
// give up on a render that takes too long so it cannot hold up the cards queued behind it.
const MAX_PARALLEL = 4;
const RENDER_TIMEOUT_MS = 40000;
const RETRY_DELAYS_MS = [3000, 8000];

const withTimeout = <T,>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error(`preview render timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
let running = 0;
const waiting: Array<() => void> = [];
const acquire = (): Promise<void> =>
  new Promise((resolve) => {
    if (running < MAX_PARALLEL) {
      running += 1;
      resolve();
    } else {
      waiting.push(() => {
        running += 1;
        resolve();
      });
    }
  });
const release = () => {
  running -= 1;
  waiting.shift()?.();
};

/** The catalogue template the user picked in the builder (same lookup as the editor preview). */
function selectedCatalogueTemplateId(): string | undefined {
  try {
    const key = localStorage.getItem("selected_catalogue");
    if (!key) return undefined;
    const fromStyles = STYLE_CATALOGUES[key]?.template_id;
    if (fromStyles) return fromStyles;
    const cached = JSON.parse(localStorage.getItem("catalogues_cache") ?? "null") as { data?: Array<{ key?: string; template_id?: string }> } | null;
    return cached?.data?.find((c) => c.key === key)?.template_id;
  } catch {
    return undefined;
  }
}

/**
 * The Style & Layout settings saved in this browser, as the editor's export reads them (PreviewPanel's
 * handleExport), so a card is drawn from the same settings as the file the user would download.
 *
 * The saved section order is deliberately NOT sent: it belongs to the browser (whatever the last edited resume used),
 * and the export completes it with this resume's own filled sections before sending it. Sent raw, it could drop a
 * section this resume has, so the card leaves the order to the template.
 */
interface SavedStyle {
  catalogueTemplateId?: string;
  domainTemplateId?: string;
  sectionBgColor?: string;
  accentColor?: string;
  fontFamily?: string;
  lineSpacing?: string;
  careerLevel: string;
  layout: LayoutOptions;
}

const EMPTY_STYLE: SavedStyle = { careerLevel: "Mid-Level", layout: {} };

const readJson = <T,>(key: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
};

/** `accountEmail` is the signed-in account (resolveAccountEmail), which the export uses for the template and career level. */
function readSavedStyle(accountEmail: string | null): SavedStyle {
  try {
    const accountKey = (base: string) => (accountEmail ? `${base}_${accountEmail}` : base);
    // The style itself is stored under localStorage.userEmail, which is how the editor's context reads it.
    const contextEmail = localStorage.getItem("userEmail");
    const style = readJson<Record<string, string | undefined>>(contextEmail ? `resumeStyle_${contextEmail}` : "resumeStyle") ?? {};

    // Same rule as the export's getCareerLevel: the career level of the applied template, else Mid-Level.
    let careerLevel = "Mid-Level";
    const domainTemplateId = localStorage.getItem(accountKey("selectedTemplateId")) ?? undefined;
    const levels = readJson<Array<{ id: string; name: string }>>(accountKey("careerLevelTemplates"));
    const applied = domainTemplateId ? levels?.find((t) => String(t.id) === String(domainTemplateId)) : undefined;
    if (applied) {
      const name = applied.name.toLowerCase();
      careerLevel = detectCareerLevel(name)
        ?? (name.includes("early") && name.includes("career") ? "Early Career" : name.includes("mid") ? "Mid-Level" : careerLevel);
    }

    const catalogueKey = localStorage.getItem("selected_catalogue");
    return {
      catalogueTemplateId: selectedCatalogueTemplateId(),
      domainTemplateId,
      // Eclipse is the only catalogue that uses it; a stale value from an earlier Eclipse session must not leak
      sectionBgColor: catalogueKey === "eclipse" ? style.sectionHeaderBg || undefined : undefined,
      accentColor: style.accentColor || style.headingColor || undefined,
      fontFamily: style.fontFamily || undefined,
      lineSpacing: style.lineSpacing || undefined,
      careerLevel,
      layout: {
        fontSize: style.fontSize || undefined,
        pageMargin: style.pageMargin || undefined,
        sectionSpacing: style.sectionSpacing || undefined,
        alignment: style.alignment || undefined,
      },
    };
  } catch {
    return EMPTY_STYLE;
  }
}

/** Stores a finished picture and frees the older pictures of the same resume, which nothing can show any more. */
const remember = (resumePrefix: string, key: string, thumb: Thumb) => {
  for (const [otherKey, old] of Array.from(cache.entries())) {
    if (otherKey === key || !otherKey.startsWith(resumePrefix)) continue;
    if (typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(old.url);
    cache.delete(otherKey);
  }
  cache.set(key, thumb);
};

async function loadThumb(id: string, source: "builder" | "enhanced", style: SavedStyle): Promise<Thumb | "failed"> {
  await acquire();
  try {
    // A render that takes too long is cancelled, not just given up on, so it stops using the server
    // (and its slot is not handed to a retry while the old request still runs)
    const controller = new AbortController();
    if (source === "enhanced") {
      const blob = await withTimeout(
        previewEnhancedResumePDFOnly(id, controller.signal),
        RENDER_TIMEOUT_MS,
        () => controller.abort(),
      );
      return { kind: "pdf", url: URL.createObjectURL(blob) };
    }
    const blob = await withTimeout(
      getResumePreviewImage(
        id,
        style.catalogueTemplateId,
        style.domainTemplateId,
        style.sectionBgColor,
        style.accentColor,
        undefined,
        style.fontFamily,
        style.lineSpacing,
        style.careerLevel,
        controller.signal,
        style.layout,
      ),
      RENDER_TIMEOUT_MS,
      () => controller.abort(),
    );
    return { kind: "img", url: URL.createObjectURL(blob) };
  } catch (error) {
    logger.warn(`Resume card preview failed (${source} ${id})`, error);
    return "failed";
  } finally {
    release();
  }
}

/** Placeholder shown until (or instead of) the real preview. */
const Placeholder = () => (
  <div className="h-full w-full p-2">
    <div className="mb-2 flex gap-1.5">
      <div className="h-3.5 w-3.5 rounded-sm bg-[#d5deec]" />
      <div className="flex-1 space-y-1 pt-0.5">
        <div className="h-1 rounded-full bg-[#e3e9f2]" />
        <div className="h-1 w-2/3 rounded-full bg-[#e3e9f2]" />
      </div>
    </div>
    {["w-full", "w-5/6", "w-full", "w-3/5", "w-full"].map((w, i) => (
      <div key={i} className={`mb-1.5 h-1 rounded-full bg-[#eef2f8] ${w}`} />
    ))}
  </div>
);

const THUMB_W = 68;
const THUMB_H = 84;
const PAGE_W = 595; // A4 at 72dpi: PDFs are laid out this wide, then scaled down into the thumbnail

/** The resume's real rendered first page (builder: PNG, enhanced: PDF), loaded when it scrolls into view. */
const ResumeThumbnail = ({
  resumeId,
  source,
  updatedAt,
}: {
  resumeId: string;
  source: "builder" | "enhanced";
  updatedAt?: string;
}) => {
  // A builder card is drawn from the style saved in this browser, read with the signed-in account's email, as the
  // export does. The style and the selected templates are part of the cache key, so a change made in the editor
  // draws a fresh picture instead of reusing one made with the old settings.
  const [style, setStyle] = useState<SavedStyle | null>(null);
  useEffect(() => {
    if (source !== "builder") return;
    let cancelled = false;
    resolveAccountEmail()
      .catch(() => null)
      .then((email) => {
        if (!cancelled) setStyle(readSavedStyle(email));
      });
    return () => { cancelled = true; };
  }, [source, resumeId]);
  const cacheKey = source === "builder"
    ? (style ? `builder:${resumeId}:${updatedAt ?? ""}:${JSON.stringify(style)}` : null)
    : `enhanced:${resumeId}:${updatedAt ?? ""}:`;
  const boxRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | "failed" | null>(() => (cacheKey ? cache.get(cacheKey) ?? null : null));

  useEffect(() => {
    if (!cacheKey) return;
    const cached = cache.get(cacheKey);
    if (cached) {
      setThumb(cached);
      return;
    }
    setThumb(null);
    let cancelled = false;

    const start = async () => {
      let attempt = 0;
      for (;;) {
        let pending = inFlight.get(cacheKey);
        if (!pending) {
          pending = loadThumb(resumeId, source, style ?? EMPTY_STYLE).then((result) => {
            if (result !== "failed") remember(`${source}:${resumeId}:`, cacheKey, result);
            inFlight.delete(cacheKey);
            return result;
          });
          inFlight.set(cacheKey, pending);
        }
        const result = await pending;
        if (cancelled) return;
        if (result !== "failed" || attempt >= RETRY_DELAYS_MS.length) {
          setThumb(result);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        attempt += 1;
        if (cancelled) return;
      }
    };

    const node = boxRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      void start();
      return () => { cancelled = true; };
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void start();
      }
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [cacheKey, resumeId, source, style]);

  const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
  const scale = THUMB_W / PAGE_W;

  return (
    <div
      ref={boxRef}
      className="relative shrink-0 overflow-hidden rounded-md border border-[#e3e9f2] bg-white"
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      {thumb && thumb !== "failed" && thumb.kind === "img" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a blob: object URL, not a static/remote asset next/image can optimize
        <img src={thumb.url} alt="Resume preview" className="h-full w-full object-cover object-top" draggable={false} />
      ) : thumb && thumb !== "failed" ? (
        <iframe
          title="Resume preview"
          src={`${thumb.url}#toolbar=0&navpanes=0&scrollbar=0&zoom=page-width`}
          tabIndex={-1}
          className="pointer-events-none absolute left-0 border-0 bg-white"
          style={{
            width: PAGE_W,
            height: Math.ceil(THUMB_H / scale) + 64,
            top: isFirefox ? -32 * scale : 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      ) : (
        <Placeholder />
      )}
    </div>
  );
};

export default ResumeThumbnail;
