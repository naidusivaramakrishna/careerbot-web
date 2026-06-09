import { NextResponse } from "next/server";
import HTMLtoDOCX from "html-to-docx";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { html } = body;
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    console.error("[generate-docx] HTML length:", html.length);

    const result = await HTMLtoDOCX(html, undefined, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
      margins: { top: 720, right: 720, bottom: 720, left: 720, header: 360, footer: 360, gutter: 0 },
    });

    console.error("[generate-docx] result type:", typeof result, "isBuffer:", Buffer.isBuffer(result), "isBlob:", result instanceof Blob);

    let bytes: Uint8Array;
    if (Buffer.isBuffer(result)) {
      bytes = new Uint8Array(result);
    } else {
      bytes = new Uint8Array(await (result as Blob).arrayBuffer());
    }

    console.error("[generate-docx] bytes length:", bytes.byteLength);

    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: "html-to-docx produced empty output" }, { status: 500 });
    }

    // Copy into a plain ArrayBuffer — avoids SharedArrayBuffer type mismatch in BodyInit
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);

    return new Response(ab, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="resume.docx"',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("[generate-docx] ERROR:", msg, stack);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
