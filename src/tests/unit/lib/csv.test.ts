/**
 * The cases a `split(',')` gets wrong, all of which appear in a real roster
 * exported from Excel or Google Sheets.
 */
import { describe, expect, it } from 'vitest';
import { parseCsv } from '@/lib/csv';

describe('parseCsv', () => {
  it('reads a plain file', () => {
    const r = parseCsv('full_name,admission_number\nR Nair,A2201\nP Das,A2202\n');
    expect(r.headers).toEqual(['full_name', 'admission_number']);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].values).toEqual({ full_name: 'R Nair', admission_number: 'A2201' });
  });

  it('keeps a comma inside a quoted name', () => {
    const r = parseCsv('full_name,admission_number\n"Nair, Ravi",A2201\n');
    expect(r.rows[0].values.full_name).toBe('Nair, Ravi');
    expect(r.rows[0].values.admission_number).toBe('A2201');
  });

  it('unescapes a doubled quote', () => {
    const r = parseCsv('full_name\n"Ravi ""Bat"" Nair"\n');
    expect(r.rows[0].values.full_name).toBe('Ravi "Bat" Nair');
  });

  it('keeps a newline inside a quoted field', () => {
    const r = parseCsv('full_name,note\nR Nair,"line one\nline two"\n');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].values.note).toBe('line one\nline two');
  });

  it('handles CRLF from Windows', () => {
    const r = parseCsv('full_name,admission_number\r\nR Nair,A2201\r\nP Das,A2202\r\n');
    expect(r.rows).toHaveLength(2);
    expect(r.rows[1].values.admission_number).toBe('A2202');
  });

  it('strips the UTF-8 BOM Excel writes', () => {
    // Left in place the BOM becomes part of the first header, so it stops
    // matching and every row looks like it is missing a name.
    const r = parseCsv('﻿full_name,admission_number\nR Nair,A2201\n');
    expect(r.headers[0]).toBe('full_name');
    expect(r.rows[0].values.full_name).toBe('R Nair');
  });

  it('does not invent a row for a trailing newline', () => {
    expect(parseCsv('full_name\nR Nair\n').rows).toHaveLength(1);
  });

  it('reads the last row when the file does not end in a newline', () => {
    expect(parseCsv('full_name\nR Nair').rows).toHaveLength(1);
  });

  it('drops the blank rows a spreadsheet export leaves behind', () => {
    const r = parseCsv('full_name\nR Nair\n\n\nP Das\n\n');
    expect(r.rows.map((x) => x.values.full_name)).toEqual(['R Nair', 'P Das']);
  });

  it('reports the line number a person would see in Excel', () => {
    const r = parseCsv('full_name\nR Nair\nP Das\n');
    expect(r.rows[0].line).toBe(2);
    expect(r.rows[1].line).toBe(3);
  });

  it('counts a multi-line quoted field toward later line numbers', () => {
    const r = parseCsv('full_name,note\nR Nair,"a\nb"\nP Das,c\n');
    expect(r.rows[1].line).toBe(4);
  });

  it('normalises header spelling but never the data', () => {
    const r = parseCsv('Full Name,Admission-Number\n  R Nair  ,00123\n');
    expect(r.headers).toEqual(['full_name', 'admission_number']);
    // A leading zero on an admission number is significant, and a trailing
    // space is the college's problem to see, not ours to hide.
    expect(r.rows[0].values.admission_number).toBe('00123');
    expect(r.rows[0].values.full_name).toBe('  R Nair  ');
  });

  it('fills a short row rather than misaligning the ones after it', () => {
    const r = parseCsv('full_name,admission_number,batch_year\nR Nair,A2201\n');
    expect(r.rows[0].values.batch_year).toBe('');
  });

  it('returns nothing for an empty file', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });

  it('returns no rows for a header-only file', () => {
    expect(parseCsv('full_name,admission_number\n').rows).toEqual([]);
  });
});
