/**
 * A CSV reader for roster uploads.
 *
 * Hand-written rather than a dependency. The job is narrow -- read a file a
 * college exported from Excel or Google Sheets -- and RFC 4180 is small. What
 * it must get right is the part a naive `split(',')` gets wrong, because a
 * college roster contains all of it: names with commas ("Nair, R"), quoted
 * fields, doubled quotes inside them, CRLF from Windows, and a trailing
 * newline.
 *
 * What it deliberately does NOT do: infer types, trim data values, or guess a
 * delimiter. A leading zero on an admission number is significant and must
 * survive as a string.
 */

/** One parsed row, keyed by header, plus where it came from in the file. */
export interface CsvRow {
  values: Record<string, string>;
  /** 1-based line in the FILE, header included. What a person sees in Excel. */
  line: number;
}

export interface CsvParseResult {
  headers: string[];
  rows: CsvRow[];
}

/**
 * Split CSV text into records of fields.
 *
 * A record is not a line: a quoted field may contain newlines, so the parser
 * has to be a state machine over characters rather than a split over lines.
 * Returns the 1-based line each record STARTS on, which is what a person
 * matches against their spreadsheet.
 */
function splitRecords(text: string): { fields: string[]; line: number }[] {
  const records: { fields: string[]; line: number }[] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;
  let started = false;

  const pushField = () => {
    fields.push(field);
    field = '';
  };
  const pushRecord = () => {
    pushField();
    records.push({ fields, line: recordLine });
    fields = [];
    started = false;
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (!started && !inQuotes) {
      recordLine = line;
      started = true;
    }

    if (inQuotes) {
      if (ch === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === '\n') line += 1;
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\r') {
      // CRLF: the \n does the work. A lone \r (old Mac) also ends the record.
      if (text[i + 1] === '\n') i += 1;
      line += 1;
      pushRecord();
    } else if (ch === '\n') {
      line += 1;
      pushRecord();
    } else {
      field += ch;
    }
  }

  // A file that does not end in a newline still has a final record. One that
  // does must not produce a phantom empty one.
  if (started || field !== '' || fields.length > 0) pushRecord();

  return records;
}

/** A header cell -> the key rows are addressed by. */
function normaliseHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Parse roster CSV.
 *
 * Blank records are dropped: a spreadsheet export routinely carries trailing
 * empty rows, and reporting "row 3001 is missing a name" for one is noise
 * about the export rather than about the roster.
 */
export function parseCsv(text: string): CsvParseResult {
  // Excel writes a UTF-8 BOM. Left in place it becomes part of the first
  // header, so "full_name" silently stops matching.
  const clean = text.replace(/^﻿/, '');
  const records = splitRecords(clean);
  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].fields.map(normaliseHeader);
  const rows: CsvRow[] = [];

  for (let r = 1; r < records.length; r += 1) {
    const { fields, line } = records[r];
    if (fields.every((f) => f.trim() === '')) continue;

    const values: Record<string, string> = {};
    headers.forEach((header, i) => {
      if (header) values[header] = fields[i] ?? '';
    });
    rows.push({ values, line });
  }

  return { headers, rows };
}
