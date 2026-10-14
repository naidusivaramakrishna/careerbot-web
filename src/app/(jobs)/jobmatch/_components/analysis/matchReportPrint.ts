import { toast } from "sonner";
import { resultBg, resultColor, resultsSummary } from "./resultsSummary";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

/** Standalone document: no app navigation, external assets, or executable report data. */
export function matchReportHtml(results: unknown, resumeName: string, jobName: string) {
  const summary = resultsSummary(results);
  const status = (tone: "success" | "missing" | "neutral", label: string) => `<span class="status ${tone}" aria-label="${label}">${tone === "success" ? "&#10003;" : tone === "missing" ? "&#215;" : "&ndash;"}</span>`;
  const skills = (items: string[], tone: "success" | "missing") => items.length
    ? `<ul class="findings">${items.map(skill => `<li>${status(tone, tone === "success" ? "Matched" : "Missing")}<span>${escapeHtml(skill)}</span></li>`).join("")}</ul>`
    : `<p class="muted">None reported in this analysis.</p>`;
  const rows = summary.breakdown.filter(row => row.label !== "Overall Match").map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th><td><div class="score-row"><span class="track"><span style="width:${row.score ?? 0}%;background:${resultColor(row.score)}"></span></span><strong style="color:${resultColor(row.score)}">${row.score == null ? "N/A" : `${row.score}%`}</strong></div>${row.score == null ? '<small class="muted">Not evaluated</small>' : ""}</td></tr>`).join("");
  // Compact 110px/90px gauges retain a 30px value; full-size UI rings use the 48px score role.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CareerBOT Match Report</title><style>
*{box-sizing:border-box}body{margin:0;background:#F8FAFC;color:#101828;font:400 15px/24px Arial,sans-serif}main{max-width:1180px;margin:40px auto;padding:28px;background:white;box-shadow:0 3px 18px #15243b0a}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}h1{font-size:30px;line-height:38px;font-weight:700;margin:0 0 6px}h2{font-size:20px;line-height:28px;font-weight:700;margin:32px 0 10px}p{margin:4px 0;overflow-wrap:anywhere}.muted,small{color:#475467;font-size:14px;line-height:20px;font-weight:400}header p:not(.brand):not(.muted){font-size:16px;line-height:24px;font-weight:400}.brand{color:#2557A7;font-weight:600;font-size:12px;line-height:16px;text-transform:uppercase;margin-bottom:6px}.actions{display:flex;gap:10px;flex-shrink:0}button{font:600 14px/20px Arial,sans-serif;cursor:pointer;border:1px solid #D0D5DD;border-radius:6px;padding:8px 14px;background:white;color:#2557A7}button.primary{background:#2557A7;color:white;border-color:#2557A7;display:flex;align-items:center;gap:8px}button.primary:hover{background:#1F4E98;border-color:#1F4E98}button.primary:active{background:#1A4080;border-color:#1A4080}button:focus-visible{outline:3px solid #B2CCFF;outline-offset:3px}.summary{display:grid;grid-template-columns:130px repeat(3,1fr);gap:14px;align-items:center;background:#F2F4F7;border:1px solid #B2CCFF;border-radius:5px;padding:22px;margin-top:28px}.metric{background:white;border:1px solid #D0D5DD;border-radius:4px;padding:18px}.metric strong{display:block;font-size:30px;line-height:38px;font-weight:700}.gauge{width:110px;height:110px}.gauge text{font-family:Arial,sans-serif;fill:#101828}.gauge .gauge-value{font-size:32.727px;font-weight:700}.gauge .gauge-label{font-size:15.273px;font-weight:400}.band{margin-top:10px;font-size:14px;line-height:20px;font-weight:600}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #D0D5DD;padding:12px 16px;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{width:27%;font-weight:600}thead th{background:#F8FAFC;font-size:12px;line-height:16px;font-weight:600;text-transform:uppercase}.score-row{display:flex;align-items:center;gap:20px}.score-row strong{width:64px;text-align:right;flex-shrink:0}.track{display:block;flex:1;height:8px;background:#F2F4F7;border-radius:6px;overflow:hidden}.track span{display:block;height:100%}.findings{list-style:none;padding:0;margin:0}.findings li{display:flex;align-items:baseline;gap:10px;padding:5px 0;overflow-wrap:anywhere}.status{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:50%;flex-shrink:0;font-size:15px;font-weight:700;line-height:1}.success{background:#067647;color:white}.missing{background:#B42318;color:white}.neutral{background:#F2F4F7;color:#475467}.keyword-table tr{break-inside:auto}.keyword-table td{background:#fff}.keyword-table tr:first-child th{background:#ECFDF3;color:#067647}.keyword-table tr:nth-child(2) th{background:#FEF3F2;color:#B42318}footer{margin-top:28px;border-top:1px solid #D0D5DD;padding-top:12px;font-size:14px;line-height:20px;font-weight:400;color:#475467}h2{break-after:avoid}tr,li,.summary{break-inside:avoid}thead{display:table-header-group}
@media(max-width:700px){h1{font-size:24px;line-height:32px}main{margin:0;padding:18px}header{flex-direction:column}.summary{grid-template-columns:1fr 1fr;padding:14px}.metric{padding:12px}th{width:35%}}
@page{size:A4 portrait;margin:14mm}
@media print{html,body{background:white;font-size:15px;line-height:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}main{max-width:none;margin:0;padding:0;box-shadow:none}.actions,.preview-note{display:none!important}header{display:block}h1{font-size:30px;line-height:38px}h2{font-size:20px;line-height:28px}.summary{grid-template-columns:100px repeat(3,1fr);padding:14px;gap:10px}.metric{padding:12px}.metric strong{font-size:30px;line-height:38px}.gauge{width:90px;height:90px}.gauge .gauge-value{font-size:40px}.gauge .gauge-label{font-size:18.667px}th,td{padding:9px 12px}footer{font-size:14px;line-height:20px}}
</style></head><body><main><header><div><p class="brand">CareerBOT</p><h1>Match Report</h1><p>${escapeHtml(jobName || "Job description")}</p><p class="muted">Resume: ${escapeHtml(resumeName || "Resume")}</p></div><div class="actions"><button id="close-report" type="button">Close preview</button><button id="download-report" type="button">Download PDF</button><button class="primary" id="print-report" type="button"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4V9h16v9h-2M6 14h12v7H6z"/></svg>Print Report</button></div></header><p class="muted preview-note">Review your report, then choose Download PDF, or Print Report to print it.</p>
<section class="summary" aria-label="Match summary"><svg class="gauge" viewBox="0 0 120 120" role="img" aria-label="Match score: ${summary.score == null ? "unavailable" : summary.score + "%"}"><circle cx="60" cy="60" r="49" fill="white" stroke="#F2F4F7" stroke-width="8"/><circle cx="60" cy="60" r="49" fill="none" stroke="${resultColor(summary.score)}" stroke-width="8" pathLength="100" stroke-dasharray="${summary.score ?? 0} 100" transform="rotate(-90 60 60)"/><text class="gauge-value" x="60" y="64" text-anchor="middle" ${summary.score != null && String(summary.score).length >= 3 ? 'textLength="84" lengthAdjust="spacingAndGlyphs"' : ""}>${summary.score == null ? "N/A" : summary.score + "%"}</text><text class="gauge-label" x="60" y="83" text-anchor="middle">Score</text></svg><div class="metric">Matched keywords<strong>${summary.matched.length}</strong></div><div class="metric">Missing keywords<strong>${summary.missing.length}</strong></div><div class="metric">Sections to improve<strong>${summary.areas.length}</strong></div></section><p class="band" style="color:${resultColor(summary.score)};background:${resultBg(summary.score)}">${escapeHtml(summary.band)}</p>
<h2>Match Score Breakdown</h2><table><thead><tr><th scope="col">Category</th><th scope="col">Your score</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Keyword Analysis</h2><table class="keyword-table"><tbody><tr><th scope="row">Matched keywords</th><td>${skills(summary.matched,"success")}</td></tr><tr><th scope="row">Missing keywords</th><td>${skills(summary.missing,"missing")}</td></tr></tbody></table>
<h2>Areas to Improve</h2>${skills(summary.areas.map(area=>area.replaceAll("_"," ")),"missing")}<footer>CareerBOT &middot; Job Match<br>Based on the available analysis. N/A means a section was not evaluated. Only add skills and experience you can support.</footer></main></body></html>`;
}

export function openMatchReportPreview(results: unknown, resumeName: string, jobName: string) {
  const preview = window.open("", "_blank");
  if (!preview) throw new Error("Preview blocked");
  preview.opener = null;
  preview.document.open();
  preview.document.write(matchReportHtml(results, resumeName, jobName));
  preview.document.close();
  preview.document.getElementById("print-report")?.addEventListener("click", () => {
    preview.focus();
    preview.print();
  });
  preview.document.getElementById("close-report")?.addEventListener("click", () => preview.close());
  // The PDF export (jsPDF) runs here in the app window, so the download and
  // any error toast land where the user started.
  preview.document.getElementById("download-report")?.addEventListener("click", async () => {
    try {
      const { createMatchReportPdf } = await import("./matchReportPdf");
      await createMatchReportPdf(results, resumeName, jobName).save("CareerBOT-match-report.pdf", { returnPromise: true });
    } catch {
      toast.error("Couldn't download the PDF report. Please try again.");
    }
  });
}
