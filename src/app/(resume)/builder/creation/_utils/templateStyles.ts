/**
 * Per-template default styles that match the backend's ReportLab PDF generation configs.
 * Values are derived from default_templates.json typography settings in careerbot-api.
 * These ensure the frontend preview matches what the backend renders in the downloaded PDF.
 *
 * Backend PDFStyleBuilder clamps values:
 *   heading_size: max(12, min(v, 20))
 *   section_heading_size: max(9, min(v, 14))
 *   body_size: max(8, min(v, 12))
 * Name size = styling.name_size || heading_size (clamped)
 */
export const TEMPLATE_DEFAULT_STYLES: Record<string, {
  fontFamily: string;
  nameFontSize: string;
  headingFontSize: string;
  bodyFontSize: string;
  lineSpacing: string;
  headingColor: string;
  bodyColor: string;
}> = {
  compact_professional: {
    fontFamily: "helvetica",
    nameFontSize: "15px",   // heading_size: 15pt
    headingFontSize: "10px", // section_heading_size: 10pt
    bodyFontSize: "9px",     // body_size: 9pt
    lineSpacing: "1.3",
    headingColor: "#00695c", // colors.primary
    bodyColor: "#000000",    // colors.text
  },
  clean_simple: {
    fontFamily: "arial",
    nameFontSize: "14px",    // heading_size: 14pt (used as name_size)
    headingFontSize: "10px", // section_heading_size: 10pt
    bodyFontSize: "9px",     // body_size: 9pt
    lineSpacing: "1.4",
    headingColor: "#000000", // colors.primary
    bodyColor: "#333333",    // colors.text
  },
  minimalist_classic: {
    fontFamily: "helvetica",
    nameFontSize: "14px",    // heading_size: 14pt
    headingFontSize: "10px", // section_heading_size: 10pt
    bodyFontSize: "9px",     // body_size: 9pt
    lineSpacing: "1.3",
    headingColor: "#212121", // colors.primary
    bodyColor: "#000000",    // colors.text
  },
  professional_classic: {
    fontFamily: "times new roman",
    nameFontSize: "16px",    // heading_size: 16pt
    headingFontSize: "12px", // section_heading_size: 12pt
    bodyFontSize: "10px",    // body_size: 10pt
    lineSpacing: "1.5",
    headingColor: "#000000", // colors.primary
    bodyColor: "#000000",    // colors.text
  },
  classic_professional: {
    fontFamily: "times new roman", // Times-Roman in ReportLab
    nameFontSize: "18px",    // heading_size: 18pt
    headingFontSize: "12px", // section_heading_size: 12pt
    bodyFontSize: "11px",    // body_size: 11pt
    lineSpacing: "1.6",
    headingColor: "#000000", // colors.primary
    bodyColor: "#000000",    // colors.text
  },
};

export const STYLE_CATALOGUES: Record<string, {
  label: string;
  description: string;
  swatches: string[];
  preview_url: string;
  template_id: string;
  style: {
    headingColor: string;
    bodyColor: string;
    fontFamily: string;
    headingFontSize?: string;
    bodyFontSize?: string;
    lineSpacing?: string;
    accentColor?: string;
  };
}> = {
  galaxy: {
    label: "Galaxy",
    description: "Sleek two-column header with bold name and clean section lines — great for tech and finance roles.",
    swatches: ["#1d4ed8", "#6366f1"],
    preview_url: "/assets/templates/software_engineering.png",
    template_id: "clean_simple",
    style: {
      headingColor: "#1A1A1A",
      accentColor: "#1d4ed8",
      bodyColor: "#4b5563",
      fontFamily: "times new roman",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.5",
    },
  },
  eclipse: {
    label: "Eclipse",
    description: "Centered header with highlighted section backgrounds — a structured, formal look for any industry.",
    swatches: ["#0369a1", "#0c4a6e"],
    preview_url: "/assets/templates/eclipse.png",
    template_id: "classic_formal",
    style: {
      headingColor: "#1A1A1A",
      bodyColor: "#4b5563",
      fontFamily: "arial",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.4",
    },
  },
  amber: {
    label: "Amber",
    description: "Elegant serif font with warm accent tones — ideal for business, consulting, and management profiles.",
    swatches: ["#b45309", "#f97316"],
    preview_url: "/assets/templates/template-4.png",
    template_id: "classic_professional",
    style: {
      headingColor: "#1A1A1A",
      accentColor: "#b45309",
      bodyColor: "#374151",
      fontFamily: "times new roman",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.5",
    },
  },
  ocean: {
    label: "Ocean",
    description: "Compact side-by-side header with cool blue accents — perfect for corporate and operations roles.",
    swatches: ["#0369a1", "#0891b2"],
    preview_url: "/assets/templates/template-1.png",
    template_id: "compact_professional",
    style: {
      headingColor: "#1A1A1A",
      accentColor: "#0369a1",
      bodyColor: "#374151",
      fontFamily: "arial",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.4",
    },
  },
  forest: {
    label: "Forest",
    description: "Stacked classic layout with earthy green tones — a calm, credible look for healthcare, education, and research.",
    swatches: ["#16a34a", "#0d9488"],
    preview_url: "/assets/templates/forest.png",
    template_id: "forest_classic",
    style: {
      headingColor: "#16a34a",
      bodyColor: "#374151",
      fontFamily: "helvetica",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.5",
    },
  },
  crimson: {
    label: "Crimson",
    description: "Executive-style header with bold red accents and strong typography — commands attention at every level.",
    swatches: ["#dc2626", "#f43f5e"],
    preview_url: "/assets/templates/crimson.png",
    template_id: "crimson_executive",
    style: {
      headingColor: "#dc2626",
      bodyColor: "#374151",
      fontFamily: "arial",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.4",
    },
  },
  slate: {
    label: "Slate",
    description: "Understated slate tones with a clean divider layout — timeless and recruiter-friendly for any profession.",
    swatches: ["#475569", "#3b82f6"],
    preview_url: "/assets/templates/slate.png",
    template_id: "slate_professional",
    style: {
      headingColor: "#475569",
      bodyColor: "#64748b",
      fontFamily: "helvetica",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.5",
    },
  },
  aether: {
    label: "Aether",
    description: "Ultra-minimal with ruled section dividers — no distraction, just content. Great for design and research roles.",
    swatches: ["#475569", "#6366f1"],
    preview_url: "/assets/templates/template-3.png",
    template_id: "aether_clean",
    style: {
      headingColor: "#475569",
      bodyColor: "#64748b",
      fontFamily: "helvetica",
      headingFontSize: "11px",
      bodyFontSize: "10px",
      lineSpacing: "1.4",
    },
  },
  ember: {
    label: "Ember",
    description: "Right-aligned name and contact block with warm orange highlights — energetic and distinctive for creative fields.",
    swatches: ["#ea580c", "#f97316"],
    preview_url: "/assets/templates/ember.png",
    template_id: "ember_right",
    style: {
      headingColor: "#1A1A1A",
      accentColor: "#ea580c",
      bodyColor: "#374151",
      fontFamily: "arial",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.4",
    },
  },
  pillar: {
    label: "Pillar",
    description: "Strong left accent bar with bold section titles — visually striking and structured for leadership and tech roles.",
    swatches: ["#1d4ed8", "#7c3aed"],
    preview_url: "/assets/templates/pillar.png",
    template_id: "pillar_accent",
    style: {
      headingColor: "#1d4ed8",
      bodyColor: "#374151",
      fontFamily: "arial",
      headingFontSize: "12px",
      bodyFontSize: "10px",
      lineSpacing: "1.4",
    },
  },
};

export type HeaderLayout = "centered" | "left-right" | "left-stacked" | "classic-formal" | "classic" | "executive" | "slate" | "aether" | "pillar" | "ember";

// Maps a catalogue's template_id → which header layout the domain templates should render
export const CATALOGUE_LAYOUT_MAP: Record<string, HeaderLayout> = {
  compact_professional: "left-right",
  clean_simple: "centered",
  minimalist_classic: "centered",
  professional_classic: "left-stacked",
  classic_professional: "left-stacked",
  classic_formal: "classic-formal",
  forest_classic: "classic",
  crimson_executive: "executive",
  slate_professional: "slate",
  aether_clean: "aether",
  pillar_accent: "pillar",
  ember_right: "ember",
};
