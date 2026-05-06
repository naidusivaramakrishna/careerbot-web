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
