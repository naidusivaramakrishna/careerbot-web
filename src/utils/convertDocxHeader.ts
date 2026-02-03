import JSZip from "jszip";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export async function convertDocxHeaderToParagraphs(docxBlob: Blob): Promise<Blob> {
  try {
    const zip = await JSZip.loadAsync(docxBlob);
    
    const parser = new XMLParser({ 
      ignoreAttributes: false,
      preserveOrder: false,
      parseAttributeValue: false,
      trimValues: true
    });
    
    const builder = new XMLBuilder({ 
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: false
    });

    const documentXml = await zip.file("word/document.xml")?.async("string");
    if (!documentXml) {
      // // console.warn("⚠️ No document.xml");
      return docxBlob;
    }

    const documentJson = parser.parse(documentXml);

    const headerFiles = Object.keys(zip.files).filter((f) =>
      f.startsWith("word/header") && f.endsWith(".xml")
    );

    if (process.env.NODE_ENV === 'development') {
      // // console.log("📄 Header files:", headerFiles);
    }

    if (headerFiles.length === 0) {
      return docxBlob;
    }

    const allHeaderTexts: string[] = [];

    for (const headerFile of headerFiles) {
      const xml = await zip.file(headerFile)?.async("string");
      if (!xml) continue;

      const headerJson = parser.parse(xml);

      const extractText = (obj: unknown): void => {
        if (!obj) return;

        if (typeof obj === "string") {
          const text = obj.trim();
          if (text.length > 0 && text.length < 200) {
            allHeaderTexts.push(text);
          }
          return;
        }

        if (Array.isArray(obj)) {
          obj.forEach(item => extractText(item));
          return;
        }

        if (typeof obj === "object" && obj !== null) {
          const objRecord = obj as Record<string, unknown>;
          if (objRecord["w:t"]) {
            const text = typeof objRecord["w:t"] === "string"
              ? objRecord["w:t"]
              : (objRecord["w:t"] as Record<string, unknown>)["#text"] || "";

            if (text && String(text).trim().length > 0) {
              allHeaderTexts.push(String(text).trim());
            }
          }

          Object.keys(objRecord).forEach(key => extractText(objRecord[key]));
        }
      };

      extractText(headerJson);
    }

    if (process.env.NODE_ENV === 'development') {
      // // console.log("📝 Raw extracted:", allHeaderTexts);
    }

    // ULTRA-AGGRESSIVE filtering - remove ALL junk
    const cleanedTexts = allHeaderTexts
      .map(t => t.trim())
      .filter(t => {
        if (t.length === 0 || t.length > 100) return false;
        
        // Remove ALL color codes
        if (t.match(/^[A-F0-9]{4,8}$/i)) return false;
        
        // Remove version numbers
        if (t.match(/^\d+\.\d+$/)) return false;
        
        // Remove font names
        const fontNames = [
          "Segoe", "Calibri", "Arial", "Times", "Verdana", 
          "Georgia", "Courier", "Impact", "Comic", "Tahoma",
          "Trebuchet", "Lucida", "Palatino", "Garamond", "Bookman",
          "Emoji", "Symbol", "Wingdings"
        ];
        if (fontNames.some(font => t.includes(font))) return false;
        
        // Remove coordinates
        if (t.match(/^\d+,\d+,?\d*,?\d*$/)) return false;
        if (t.match(/^-?\d+$/)) return false;
        
        // Remove symbols only
        if (t.match(/^[□ʌV•☎|˙¡˜·ˆ¸ç]+$/)) return false;
        
        // Remove technical keywords
        const techWords = [
          "UTF", "xml", "BodyText", "auto", "page", "Group", 
          "Graphic", "Textbox", "textNoShape", "square", "solid", 
          "wps", "rect", "miter", "_x0000_", "schemas", "http://", 
          "urn:", "position:", "docshape", "rId", "preserve", "w14",
          "21600", "none", "true", "false", "yes", "no",
          "left", "right", "top", "bottom", "center"
        ];
        if (techWords.some(word => t.toLowerCase().includes(word.toLowerCase()))) {
          return false;
        }
        
        // Remove path patterns
        if (t.match(/^[ltrb]$/)) return false;
        if (t.match(/^m\d+/)) return false;
        
        return true;
      });

    const uniqueTexts = Array.from(new Set(cleanedTexts));

    if (process.env.NODE_ENV === 'development') {
      // // console.log("✨ Cleaned texts:", uniqueTexts);
    }

    if (uniqueTexts.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // // console.log("ℹ️ No valid text found");
      }
      return docxBlob;
    }

    // Categorize into name and contact
    const nameParts: string[] = [];
    const contactParts: string[] = [];
    
    for (const text of uniqueTexts) {
      // Email
      if (text.includes("@") && text.includes(".")) {
        contactParts.push(text);
      }
      // Phone number
      else if (text.match(/^\+?\d{10,15}$/)) {
        contactParts.push(text);
      }
      // City/Location (alphabetic, reasonable length)
      else if (text.match(/^[A-Za-z\s]{3,30}$/) && 
               text.length > 2 && 
               !text.match(/^(P|V|I|A|E)$/)) {
        contactParts.push(text);
      }
      // Name part (short text, starts with capital letter)
      else if (text.match(/^[A-Z][A-Za-z]*$/) && text.length <= 20) {
        nameParts.push(text);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      // // console.log("📊 Name parts:", nameParts);
      // // console.log("📊 Contact parts:", contactParts);
    }

    if (nameParts.length === 0 && contactParts.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // // console.log("⚠️ No valid data found");
      }
      return docxBlob;
    }

    const headerParagraphs: Record<string, unknown>[] = [];

    // Combine ALL name parts into one
    if (nameParts.length > 0) {
      const fullName = nameParts.join(" ");

      headerParagraphs.push({
        "w:pPr": {
          "w:jc": { "@_w:val": "center" },
          "w:spacing": { "@_w:before": "0", "@_w:after": "120" }
        },
        "w:r": {
          "w:rPr": {
            "w:b": {},
            "w:bCs": {},
            "w:sz": { "@_w:val": "28" },
            "w:szCs": { "@_w:val": "28" }
          },
          "w:t": {
            "@_xml:space": "preserve",
            "#text": fullName
          }
        }
      });
    }

    // Contact info on one line
    if (contactParts.length > 0) {
      const contactLine = contactParts.join(" | ");
      
      headerParagraphs.push({
        "w:pPr": {
          "w:jc": { "@_w:val": "center" },
          "w:spacing": { "@_w:before": "0", "@_w:after": "200" }
        },
        "w:r": {
          "w:rPr": {
            "w:sz": { "@_w:val": "20" },
            "w:szCs": { "@_w:val": "20" }
          },
          "w:t": {
            "@_xml:space": "preserve",
            "#text": contactLine
          }
        }
      });
    }

    // Separator
    headerParagraphs.push({
      "w:pPr": {
        "w:pBdr": {
          "w:bottom": {
            "@_w:val": "single",
            "@_w:sz": "12",
            "@_w:space": "1",
            "@_w:color": "CCCCCC"
          }
        },
        "w:spacing": { "@_w:before": "0", "@_w:after": "240" }
      },
      "w:r": {
        "w:t": ""
      }
    });

    const body = documentJson["w:document"]?.["w:body"];
    if (!body) {
      // // console.warn("⚠️ No body");
      return docxBlob;
    }

    let bodyParagraphs = body["w:p"];
    if (!Array.isArray(bodyParagraphs)) {
      bodyParagraphs = bodyParagraphs ? [bodyParagraphs] : [];
    }
    
    documentJson["w:document"]["w:body"]["w:p"] = [
      ...headerParagraphs,
      ...bodyParagraphs
    ];

    const newDocumentXml = builder.build(documentJson);
    zip.file("word/document.xml", newDocumentXml);

    const updatedBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    if (process.env.NODE_ENV === 'development') {
      // // console.log("✅ SUCCESS! Header:", {
        fullName: nameParts.join(" "),
        contact: contactParts.join(" | ")
      });
    }

    return updatedBlob;
  } catch (e) {
    // // console.error("convertDocxHeaderToParagraphs error:", e instanceof Error ? e.message : String(e));
    return docxBlob;
  }
}
