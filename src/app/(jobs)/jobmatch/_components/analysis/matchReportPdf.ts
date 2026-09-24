import { jsPDF } from "jspdf";
import { resultColor, resultsSummary } from "./resultsSummary";

export function createMatchReportPdf(matchResults: unknown, resumeName: string, jobDescriptionName: string) {
  const summary = resultsSummary(matchResults);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setProperties({ title: "CareerBOT Match Report", author: "CareerBOT" });
  const margin = 18;
  const width = 174;
  let y = 22;
  const newPage = () => {
    pdf.addPage();
    y = 22;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor("#145BC2");
    pdf.text("CareerBOT | Match Report", margin, y);
    y += 12;
  };
  const ensureSpace = (height: number) => { if (y + height > 275) newPage(); };
  const paragraph = (text: string) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    // Wrap before pagination so long filenames and skill lists remain readable.
    const lines: string[] = pdf.splitTextToSize(text, width);
    for (const line of lines) {
      ensureSpace(6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor("#40536B");
      pdf.text(line, margin, y);
      y += 6;
    }
    y += 3;
  };
  const heading = (text: string) => {
    ensureSpace(24);
    y += 4;
    pdf.setDrawColor("#DDE6F0");
    pdf.line(margin, y, margin + width, y);
    y += 9;
    pdf.setTextColor("#15243B");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(text, margin, y);
    y += 9;
  };
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor("#145BC2");
  pdf.text("CareerBOT", margin, y);
  y += 13;
  pdf.setFontSize(24);
  pdf.setTextColor("#15243B");
  pdf.text("Your Match Results", margin, y);
  y += 12;
  paragraph(`Resume: ${resumeName}`);
  paragraph(`Job description: ${jobDescriptionName}`);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(resultColor(summary.score));
  ensureSpace(14);
  pdf.text(`${summary.score == null ? "N/A" : `${summary.score}%`}  |  ${summary.band}`, margin, y + 3);
  y += 16;
  heading("Quick Summary");
  paragraph(`${summary.matched.length} matched skills    |    ${summary.missing.length} missing skills    |    ${summary.areas.length} areas to improve`);
  heading("Match Score Breakdown");
  for (const row of summary.breakdown) {
    ensureSpace(13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor("#15243B");
    pdf.text(row.label, margin, y);
    pdf.setFillColor("#E8EEF7");
    pdf.roundedRect(105, y - 3, 65, 3, 1.5, 1.5, "F");
    if (row.score != null && row.score > 0) {
      pdf.setFillColor(resultColor(row.score));
      pdf.rect(105, y - 3, 65 * row.score / 100, 3, "F");
    }
    pdf.setTextColor(resultColor(row.score));
    pdf.text(row.score == null ? "N/A" : `${row.score}%`, margin + width, y, { align: "right" });
    y += 12;
  }
  heading("Matched Skills");
  paragraph(summary.matched.join(", ") || "None reported in this analysis.");
  heading("Missing Skills");
  paragraph(summary.missing.join(", ") || "None reported in this analysis.");
  heading("Areas to Improve");
  paragraph(summary.areas.join(", ").replaceAll("_", " ") || "None reported in this analysis.");
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor("#64748B");
    pdf.text("CareerBOT | Job Match", margin, 287);
    pdf.text(`Page ${page} of ${pdf.getNumberOfPages()}`, margin + width, 287, { align: "right" });
  }
  return pdf;
}
