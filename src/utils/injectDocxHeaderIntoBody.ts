// src/utils/injectDocxHeaderIntoBody.ts
import JSZip from "jszip";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export async function injectDocxHeaderIntoBody(docxBlob: Blob): Promise<Blob> {
  try {
    const zip = await JSZip.loadAsync(docxBlob);
    const parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: false,
      parseAttributeValue: false,
      trimValues: true,
      removeNSPrefix: false,
    });
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: false,
    });

    const documentXml = await zip.file("word/document.xml")?.async("string");
    if (!documentXml) return docxBlob;

    const documentJson = parser.parse(documentXml) as Record<string, unknown>;
    const headerFiles = Object.keys(zip.files).filter(
      (f) => f.startsWith("word/header") && f.endsWith(".xml")
    );

    if (headerFiles.length === 0) return docxBlob;

    const headerTexts: string[] = [];
    for (const headerFile of headerFiles) {
      const xml = await zip.file(headerFile)?.async("string");
      if (!xml) continue;
      
      const headerJson = parser.parse(xml);
      extractTextFromObject(headerJson, headerTexts);
    }

    const cleanTexts = headerTexts
      .map(t => t.replace(/[□ʌV•☎]/g, "").replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 0 && t.length < 100 && !t.match(/^(UTF|xml|page|auto|center)$/i));

    if (cleanTexts.length === 0) return docxBlob;

    const uniqueTexts = Array.from(new Set(cleanTexts));
    let name = uniqueTexts[0] || "";
    let contactIndex = 1;

    if (uniqueTexts.length >= 2 && uniqueTexts[0].length <= 20 && uniqueTexts[1].length <= 20) {
      name = `${uniqueTexts[0]} ${uniqueTexts[1]}`;
      contactIndex = 2;
    }

    const headerParagraphs = [
      {
        "w:pPr": { "w:jc": { "@_w:val": "center" }, "w:spacing": { "@_w:after": "120" } },
        "w:r": {
          "w:rPr": { "w:b": {}, "w:sz": { "@_w:val": "32" } },
          "w:t": { "#text": name }
        }
      },
      {
        "w:pPr": { "w:jc": { "@_w:val": "center" }, "w:spacing": { "@_w:after": "200" } },
        "w:r": {
          "w:rPr": { "w:sz": { "@_w:val": "22" } },
          "w:t": { "#text": uniqueTexts.slice(contactIndex).join(" | ") }
        }
      },
      {
        "w:pPr": {
          "w:pBdr": { "w:bottom": { "@_w:val": "single", "@_w:sz": "12", "@_w:color": "999999" } },
          "w:spacing": { "@_w:after": "240" }
        },
        "w:r": { "w:t": "" }
      }
    ];

    const doc = documentJson as Record<string, Record<string, Record<string, unknown>>>;
    const wDocument = doc["w:document"] as Record<string, Record<string, unknown>>;
    const wBody = wDocument["w:body"] as Record<string, unknown>;
    const wP = wBody["w:p"];

    const bodyParagraphs = Array.isArray(wP)
      ? wP
      : [wP || {}];

    wBody["w:p"] = [...headerParagraphs, ...bodyParagraphs];
    const newDocumentXml = builder.build(documentJson);
    zip.file("word/document.xml", newDocumentXml);

    return await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  } catch {
    return docxBlob;
  }
}

function extractTextFromObject(obj: unknown, texts: string[]): void {
  if (typeof obj === "string") {
    const text = obj.trim();
    if (text.length > 0 && text.length < 150) texts.push(text);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach(item => extractTextFromObject(item, texts));
    return;
  }
  if (typeof obj === "object" && obj !== null) {
    const objRecord = obj as Record<string, unknown>;
    if (objRecord["w:t"]) {
      const wt = objRecord["w:t"];
      const textValue = typeof wt === "string" ? wt : (wt as Record<string, unknown>)["#text"] || "";
      const textStr = String(textValue).trim();
      if (textStr) texts.push(textStr);
    }
    Object.values(objRecord).forEach((value: unknown) => extractTextFromObject(value, texts));
  }
}
