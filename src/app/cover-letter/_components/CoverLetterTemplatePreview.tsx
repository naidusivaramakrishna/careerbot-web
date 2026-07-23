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
}: {
  template: CoverLetterPreviewTemplate;
  content?: CoverLetterPreviewContent;
  size?: keyof typeof sizeClass;
}) {
  const ui = sizeClass[size];
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
