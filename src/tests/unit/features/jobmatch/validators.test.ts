import { describe, it, expect } from 'vitest';
import { hasAllowedDocumentExtension, hasAllowedResumeExtension } from '@/utils/validators';

// Pins the split between the JD-upload guard (backend /jd/extract accepts
// .txt) and the resume-upload guard (backend /parser/parse_resume/ does
// not) — before this split, resume uploads used the JD guard and let .txt
// files through, which then failed server-side with no clear reason why.

describe('hasAllowedDocumentExtension (JD upload)', () => {
  it.each(['.pdf', '.doc', '.docx', '.txt'])('accepts %s', (ext) => {
    expect(hasAllowedDocumentExtension(`resume${ext}`)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(hasAllowedDocumentExtension('resume.PDF')).toBe(true);
    expect(hasAllowedDocumentExtension('resume.TXT')).toBe(true);
  });

  it('rejects unsupported extensions', () => {
    expect(hasAllowedDocumentExtension('resume.exe')).toBe(false);
    expect(hasAllowedDocumentExtension('resume.rtf')).toBe(false);
    expect(hasAllowedDocumentExtension('resume')).toBe(false);
  });
});

describe('hasAllowedResumeExtension (resume upload)', () => {
  it.each(['.pdf', '.doc', '.docx'])('accepts %s', (ext) => {
    expect(hasAllowedResumeExtension(`resume${ext}`)).toBe(true);
  });

  it('rejects .txt — the resume parser endpoint does not support it, unlike JD upload', () => {
    expect(hasAllowedResumeExtension('resume.txt')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(hasAllowedResumeExtension('resume.DOCX')).toBe(true);
  });

  it('rejects unsupported extensions', () => {
    expect(hasAllowedResumeExtension('resume.exe')).toBe(false);
    expect(hasAllowedResumeExtension('resume')).toBe(false);
  });
});
