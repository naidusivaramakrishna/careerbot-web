// src/utils/resumeSkillInjector.ts
import JSZip from "jszip";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function addSkillsToPdf(pdfBlob: Blob, newSkills: string[]): Promise<Blob> {
  try {
    const pdfBytes = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const skillsText = `✨ ADDED SKILLS:\n${newSkills.join(", ")}`;

      page.drawText(skillsText, {
        x: 50,
        y: height - 120 - (index * 20),
        size: 11,
        font,
        color: rgb(0, 0.5, 0),
        maxWidth: width - 100,
      });
    });

    // FIX: Wrap Uint8Array in Blob before returning
    const savedPdfBytes = await pdfDoc.save();
    const buffer = savedPdfBytes.buffer.slice(savedPdfBytes.byteOffset, savedPdfBytes.byteOffset + savedPdfBytes.byteLength) as ArrayBuffer;
    return new Blob([buffer], { type: 'application/pdf' });
  } catch (e) {
    console.error("addSkillsToPdf error:", e instanceof Error ? e.message : String(e));
    return pdfBlob;
  }
}

export async function addSkillsToDocxSkillsSection(docxBlob: Blob, newSkills: string[]): Promise<Blob> {
  try {
    const zip = await JSZip.loadAsync(docxBlob);
    const parser = new XMLParser({ ignoreAttributes: false });
    const builder = new XMLBuilder({ format: true });

    const documentXml = await zip.file("word/document.xml")?.async("string");
    if (!documentXml) return docxBlob;

    const json = parser.parse(documentXml) as Record<string, unknown>;
    const doc = json as Record<string, Record<string, Record<string, Record<string, unknown>>>>;
    const bodyParagraphs = doc["w:document"]["w:body"]["w:p"];

    const paragraphs = Array.isArray(bodyParagraphs)
      ? bodyParagraphs
      : [bodyParagraphs];

    // Find Skills section and inject new skills
    for (let i = 0; i < paragraphs.length - 1; i++) {
      const paraText = getParagraphText(paragraphs[i]);
      if (paraText.toLowerCase().match(/skills?|competencies?|abilities/i)) {
        // Create new skills paragraph
        const newSkillsPara: Record<string, unknown> = {
          "w:pPr": { "w:spacing": { "@_w:after": "200" } },
          "w:r": [{
            "w:rPr": { "w:b": {}, "w:color": "008000" },
            "w:t": { "#text": `Additional Skills: ${newSkills.join(', ')}` }
          }]
        };

        // Insert after skills heading
        (doc["w:document"]["w:body"] as Record<string, unknown>)["w:p"] = [
          ...paragraphs.slice(0, i + 1),
          newSkillsPara,
          ...paragraphs.slice(i + 1)
        ] as unknown;
        break;
      }
    }

    const newXml = builder.build(json);
    zip.file("word/document.xml", newXml);
    return await zip.generateAsync({ type: "blob" });
  } catch (e) {
    console.error("addSkillsToDocxSkillsSection error:", e instanceof Error ? e.message : String(e));
    return docxBlob;
  }
}

function getParagraphText(para: unknown): string {
  let text = '';
  if (typeof para === 'object' && para !== null) {
    const paraRecord = para as Record<string, unknown>;
    const runs = paraRecord["w:r"];
    if (Array.isArray(runs)) {
      runs.forEach((run: unknown) => {
        if (typeof run === 'object' && run !== null) {
          const runRecord = run as Record<string, unknown>;
          const wt = runRecord["w:t"];
          if (wt) {
            const content = typeof wt === 'string' ? wt : (wt as Record<string, unknown>)["#text"] || '';
            text += String(content);
          }
        }
      });
    }
  }
  return text.trim();
}
