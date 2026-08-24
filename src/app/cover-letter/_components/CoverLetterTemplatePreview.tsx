"use client";

import { useEffect, useState } from "react";
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
  const authenticatedPreviewUrl = useAuthenticatedPdfUrl(previewUrl);
  if (authenticatedPreviewUrl) {
    return (
      <PdfPreviewFrame src={authenticatedPreviewUrl} shellClass={ui.shell} />
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

function PdfPreviewFrame({ src, shellClass }: { src: string; shellClass: string }) {
  const [hasViewerLoaded, setHasViewerLoaded] = useState(false);
  const [isViewerReady, setIsViewerReady] = useState(false);

  useEffect(() => {
    setHasViewerLoaded(false);
    setIsViewerReady(false);
  }, [src]);

  useEffect(() => {
    if (!hasViewerLoaded) return;
    const timer = window.setTimeout(() => setIsViewerReady(true), 900);
    return () => window.clearTimeout(timer);
  }, [hasViewerLoaded]);

  return (
    <div className={[shellClass, "relative shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"].join(" ")}>
      {!isViewerReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white px-3 text-center" aria-label="Loading template preview">
          <div className="h-2 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-1.5 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="h-1.5 w-3/4 animate-pulse rounded-full bg-slate-100" />
          <span className="mt-1 text-[9px] font-bold text-slate-400">Loading preview...</span>
        </div>
      )}
      <iframe
        src={`${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title="Template style preview"
        loading="lazy"
        tabIndex={-1}
        // Chromium fires once for the viewer shell, shortly before its PDF
        // canvas paints. Keep the white placeholder over that black frame.
        onLoad={() => setHasViewerLoaded(true)}
        className={`pointer-events-none h-full w-full border-0 transition-opacity duration-200 ${isViewerReady ? "opacity-100" : "opacity-0"}`}
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
  const authenticatedUrl = useAuthenticatedPdfUrl(previewUrl);
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
          {!authenticatedUrl ? (
            <div className="flex h-full items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-500">Loading preview...</div>
          ) : (
            <iframe
              src={`${authenticatedUrl}#toolbar=1&navpanes=0&view=FitH`}
              title={`${templateName} template preview`}
              className="h-full w-full rounded-xl border-0 bg-white"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function useAuthenticatedPdfUrl(previewUrl?: string | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setObjectUrl(null);
      return;
    }
    let cancelled = false;
    let nextObjectUrl: string | null = null;
    void httpClient.get<Blob>(previewUrl, { responseType: "blob" })
      .then(({ data }) => {
        if (cancelled) return;
        nextObjectUrl = URL.createObjectURL(data);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        // Keep the code-rendered preview when the remote PDF is unavailable.
        if (!cancelled) setObjectUrl(null);
      });
    return () => {
      cancelled = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [previewUrl]);

  return objectUrl;
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
